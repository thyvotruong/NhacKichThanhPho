/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ - BACKEND ARCHITECTURE
 * File: services/booking.service.js
 * Model: Booking (Collection: bookings)
 * Chức năng: Thao tác Đặt vé, Cập nhật trạng thái ghế DB, Hủy vé, Soát vé e-Gate & Hoàn tiền
 * ============================================================
 */

const Booking = require('../models/booking.model');
const Schedule = require('../models/schedule.model');
const store = require('../config/store');

class BookingService {
  async createBooking(payload, req) {
    const {
      musicalSlug,
      scheduleId,
      customerName,
      customerEmail,
      customerPhone,
      seats,
      voucherCode,
      paymentMethod,
      notes
    } = payload;

    if (!customerName || !customerEmail || !customerPhone || !seats || seats.length === 0) {
      throw new Error('Thông tin đặt vé không đầy đủ');
    }

    const schedule = store.memSchedules.find(s => s._id === scheduleId);
    const musical = store.memMusicals.find(m => m.slug === musicalSlug);

    // Chuẩn hóa cổng thanh toán (chỉ chấp nhận 4 cổng chuẩn: VIETQR, VNPAY, MOMO, ZALOPAY)
    const validPaymentMethods = ['VIETQR', 'VNPAY', 'MOMO', 'ZALOPAY'];
    const selectedMethod = (paymentMethod || 'VIETQR').toUpperCase();
    const finalPaymentMethod = validPaymentMethods.includes(selectedMethod) ? selectedMethod : 'VIETQR';

    // Tính tiền & áp dụng Voucher
    const subtotal = seats.reduce((sum, s) => sum + s.price, 0);
    let discountAmount = 0;

    if (voucherCode) {
      const voucher = store.memVouchers.find(v => v.code === voucherCode.toUpperCase() && v.isActive);
      if (voucher) {
        if (voucher.discountType === 'PERCENT') {
          discountAmount = Math.round((subtotal * voucher.discountValue) / 100);
          if (voucher.maxDiscountAmount && discountAmount > voucher.maxDiscountAmount) {
            discountAmount = voucher.maxDiscountAmount;
          }
        } else {
          discountAmount = voucher.discountValue;
        }
        voucher.usedCount += 1;
      }
    }

    const totalPrice = Math.max(0, subtotal - discountAmount);

    // Sinh mã đặt vé
    const randomChars = Math.random().toString(36).substring(2, 7).toUpperCase();
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const bookingCode = `NK-${datePrefix}-${randomChars}`;

    const qrCodeData = JSON.stringify({
      bookingCode,
      show: musical ? musical.title : 'Nhạc Kịch Thành Phố',
      seats: seats.map(s => s.seatCode).join(', '),
      date: schedule ? schedule.performanceDate : new Date(),
      time: schedule ? schedule.time : '19:30'
    });

    const newBooking = {
      _id: 'bk_' + Date.now(),
      bookingCode,
      musicalSlug,
      musicalTitle: musical ? musical.title : 'Nhạc Kịch Thành Phố',
      scheduleId,
      performanceDate: schedule ? schedule.performanceDate : new Date(),
      performanceTime: schedule ? schedule.time : '19:30',
      venue: schedule ? schedule.venue : 'Nhạc kịch Thành phố - 669 Đỗ Mười, khu phố 3, Linh Xuân, TP.HCM',
      hall: schedule ? schedule.hall : 'Khán phòng Grand A',
      customerName,
      customerEmail,
      customerPhone,
      seats,
      quantity: seats.length,
      subtotal,
      voucherCode: voucherCode || null,
      discountAmount,
      totalPrice,
      paymentMethod: finalPaymentMethod,
      paymentStatus: 'PAID',
      bookingStatus: 'CONFIRMED',
      qrCodeData,
      checkInInfo: { checkedInAt: null, checkedInBy: null, gate: 'Cửa Chính Khán Phòng A' },
      refundInfo: null,
      notes: notes || '',
      createdAt: new Date()
    };

    // 1. Cập nhật trạng thái ghế trong Schedule thành 'booked' (Real-time DB Sync)
    if (schedule && schedule.seats) {
      const seatCodes = seats.map(s => s.seatCode);
      schedule.seats.forEach(s => {
        if (seatCodes.includes(s.seatCode)) {
          s.status = 'booked';
          s.holdingSessionId = null;
          s.holdingExpiresAt = null;
        }
      });
      schedule.bookedSeats = schedule.seats.filter(s => s.status === 'booked').length;

      if (store.isMongoConnected) {
        try {
          await Schedule.updateOne(
            { _id: scheduleId },
            {
              $set: { seats: schedule.seats },
              $inc: { bookedSeats: seats.length }
            }
          );
        } catch (e) {
          console.warn('⚠️ Lỗi cập nhật ghế đã đặt MongoDB:', e.message);
        }
      }
    }

    // 2. Lưu Booking vào DB và Memory Store
    if (store.isMongoConnected) {
      try {
        await Booking.create(newBooking);
      } catch (e) {
        console.warn('⚠️ Lỗi tạo Booking MongoDB:', e.message);
      }
    }
    store.memBookings.unshift(newBooking);

    await store.logAudit(req, {
      action: 'BOOKING_SUCCESS',
      category: 'BOOKING',
      description: `Khách hàng ${customerName} đặt thành công đơn vé ${bookingCode} (${seats.length} vé)`,
      metadata: { bookingCode, musicalSlug, totalPrice, paymentMethod: finalPaymentMethod }
    });

    return newBooking;
  }

  async getMyBookings(email) {
    if (store.isMongoConnected) {
      try {
        const bookings = await Booking.find({ customerEmail: email }).sort({ createdAt: -1 });
        if (bookings && bookings.length > 0) return bookings;
      } catch (e) {
        console.warn('⚠️ Lỗi lấy vé cá nhân MongoDB:', e.message);
      }
    }
    return store.memBookings.filter(b => b.customerEmail.toLowerCase() === (email || '').toLowerCase());
  }

  async cancelBooking(bookingCode, req) {
    let booking = store.memBookings.find(b => b.bookingCode === bookingCode);
    if (!booking) throw new Error('Không tìm thấy đơn đặt vé');

    booking.bookingStatus = 'CANCELLED';
    booking.paymentStatus = 'REFUNDED';
    booking.refundInfo = {
      refundedAt: new Date(),
      refundAmount: booking.totalPrice,
      refundFee: 0,
      refundReason: 'Khách hàng hủy vé tự động'
    };

    // Giải phóng ghế trong Schedule
    const schedule = store.memSchedules.find(s => s._id === booking.scheduleId);
    if (schedule && schedule.seats) {
      const seatCodes = booking.seats.map(s => s.seatCode);
      schedule.seats.forEach(s => {
        if (seatCodes.includes(s.seatCode)) {
          s.status = 'available';
        }
      });
      schedule.bookedSeats = schedule.seats.filter(s => s.status === 'booked').length;

      if (store.isMongoConnected) {
        try {
          await Schedule.updateOne(
            { _id: booking.scheduleId },
            { $set: { seats: schedule.seats, bookedSeats: schedule.bookedSeats } }
          );
        } catch (e) {}
      }
    }

    if (store.isMongoConnected) {
      try {
        await Booking.updateOne(
          { bookingCode },
          {
            $set: {
              bookingStatus: 'CANCELLED',
              paymentStatus: 'REFUNDED',
              refundInfo: booking.refundInfo
            }
          }
        );
      } catch (e) {}
    }

    await store.logAudit(req, {
      action: 'CANCEL_BOOKING',
      category: 'BOOKING',
      description: `Hủy đơn vé ${bookingCode} và hoàn lại trạng thái ghế`,
      metadata: { bookingCode }
    });

    return booking;
  }

  async getAdminOrders(filters = {}) {
    let orders = store.memBookings;
    if (store.isMongoConnected) {
      try {
        const dbOrders = await Booking.find().sort({ createdAt: -1 });
        if (dbOrders && dbOrders.length > 0) orders = dbOrders;
      } catch (e) {}
    }

    const { status, search } = filters;
    if (status && status !== 'ALL') {
      orders = orders.filter(o => o.bookingStatus === status || o.paymentStatus === status);
    }
    if (search) {
      const q = search.toLowerCase();
      orders = orders.filter(o =>
        (o.bookingCode && o.bookingCode.toLowerCase().includes(q)) ||
        (o.customerName && o.customerName.toLowerCase().includes(q)) ||
        (o.customerEmail && o.customerEmail.toLowerCase().includes(q)) ||
        (o.musicalTitle && o.musicalTitle.toLowerCase().includes(q))
      );
    }
    return orders;
  }

  async refundOrder(id, reason, req) {
    const order = store.memBookings.find(o => o._id === id || o.bookingCode === id);
    if (!order) throw new Error('Không tìm thấy đơn hàng');

    order.paymentStatus = 'REFUNDED';
    order.bookingStatus = 'CANCELLED';
    order.refundInfo = {
      refundedAt: new Date(),
      refundAmount: order.totalPrice,
      refundFee: 0,
      refundReason: reason || 'Hoàn tiền bởi Admin'
    };

    if (store.isMongoConnected) {
      try {
        await Booking.updateOne(
          { $or: [{ _id: id }, { bookingCode: id }] },
          { $set: { paymentStatus: 'REFUNDED', bookingStatus: 'CANCELLED', refundInfo: order.refundInfo } }
        );
      } catch (e) {}
    }

    await store.logAudit(req, {
      action: 'REFUND_ORDER',
      category: 'BOOKING',
      description: `Hoàn tiền đơn vé ${order.bookingCode} - Lý do: ${reason}`,
      metadata: { bookingCode: order.bookingCode, refundAmount: order.totalPrice }
    });

    return order;
  }

  // --- Ops Soát Vé (Check-In) ---
  async checkInTicket(qrDataOrCode, gate, req) {
    let code = qrDataOrCode;
    try {
      const parsed = JSON.parse(qrDataOrCode);
      if (parsed.bookingCode) code = parsed.bookingCode;
    } catch (e) {}

    const booking = store.memBookings.find(b => b.bookingCode === code);
    if (!booking) throw new Error('Mã vé không hợp lệ hoặc không tồn tại trong hệ thống');

    if (booking.bookingStatus === 'CHECKED_IN') {
      return {
        alreadyCheckedIn: true,
        booking,
        message: `Vé này ĐÃ CHECK-IN vào lúc ${new Date(booking.checkInInfo.checkedInAt).toLocaleTimeString('vi-VN')}!`
      };
    }

    if (booking.bookingStatus === 'CANCELLED') {
      throw new Error('Vé này ĐÃ BỊ HỦY trước đó, không thể qua cổng');
    }

    booking.bookingStatus = 'CHECKED_IN';
    booking.checkInInfo = {
      checkedInAt: new Date(),
      checkedInBy: (req && req.user && req.user.fullName) || 'Nhân viên Soát vé Cửa Rạp',
      gate: gate || 'Cửa Chính Khán Phòng'
    };

    if (store.isMongoConnected) {
      try {
        await Booking.updateOne(
          { bookingCode: code },
          { $set: { bookingStatus: 'CHECKED_IN', checkInInfo: booking.checkInInfo } }
        );
      } catch (e) {}
    }

    await store.logAudit(req, {
      action: 'CHECKIN_TICKET',
      category: 'OPS',
      description: `Soát vé thành công cho mã ${code} tại ${booking.checkInInfo.gate}`,
      metadata: { bookingCode: code, gate: booking.checkInInfo.gate }
    });

    return {
      success: true,
      booking,
      message: 'Soát vé thành công! Mời quý khán giả vào khán phòng.'
    };
  }

  getOpsDashboard() {
    const today = new Date().toISOString().slice(0, 10);
    const todayBookings = store.memBookings.filter(b => {
      const bDate = new Date(b.performanceDate).toISOString().slice(0, 10);
      return bDate === today || true; // Mẫu
    });

    const checkedInCount = todayBookings.filter(b => b.bookingStatus === 'CHECKED_IN').length;
    const totalTodayTickets = todayBookings.reduce((sum, b) => sum + b.quantity, 0);

    return {
      todayShowsCount: 3,
      totalTodayTickets: Math.max(totalTodayTickets, 480),
      checkedInCount: Math.max(checkedInCount, 312),
      pendingCheckInCount: Math.max(totalTodayTickets - checkedInCount, 168),
      checkInRate: 65,
      activeGates: ['Cửa VIP Grand A', 'Cửa Chính Khán Đài A', 'Cửa Khán Đài B', 'Cửa Tầng Lầu']
    };
  }

  lookupTicket(keyword) {
    if (!keyword) return [];
    const q = keyword.trim().toLowerCase();
    return store.memBookings.filter(b =>
      (b.bookingCode && b.bookingCode.toLowerCase().includes(q)) ||
      (b.customerName && b.customerName.toLowerCase().includes(q)) ||
      (b.customerPhone && b.customerPhone.includes(q)) ||
      (b.customerEmail && b.customerEmail.toLowerCase().includes(q))
    );
  }
}

module.exports = new BookingService();
