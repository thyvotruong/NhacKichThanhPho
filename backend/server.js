/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ (CITY MUSICAL WEBSITE) - BACKEND API SERVER
 * Kiến trúc: ExpressJS RESTful API, MongoDB/Mongoose, CORS, Error Handling
 * Hỗ trợ 3 phân hệ:
 * 1. Customer Portal (Trang chủ, Lọc vở diễn, Sơ đồ ghế, Giữ ghế 8p, Đặt vé, Voucher, Hủy vé)
 * 2. Admin Portal (Dashboard, Khóa ghế nội bộ, Quản lý đơn, Vouchers, Đối soát doanh thu, RBAC)
 * 3. Ops Portal (Soát vé, Check-in thời gian thực, Quét mã QR)
 * ============================================================
 */

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nhac_kich_thanh_pho';

// Import Models
const Musical = require('./models/musical.model');
const Schedule = require('./models/schedule.model');
const Booking = require('./models/booking.model');
const Voucher = require('./models/voucher.model');
const User = require('./models/user.model');
const Reconciliation = require('./models/reconciliation.model');
const {
  sampleMusicals,
  sampleVouchers,
  sampleUsers,
  sampleArtists,
  sampleReconciliations,
  generateSeatLayout
} = require('./seed');

// ============================================================
// 1. MIDDLEWARES CƠ BẢN
// ============================================================
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let isMongoConnected = false;

// ============================================================
// 2. BỘ NHỚ ĐỆM IN-MEMORY DỰ PHÒNG CHUẨN XÁC 100%
// ============================================================
let memMusicals = JSON.parse(JSON.stringify(sampleMusicals));
let memVouchers = JSON.parse(JSON.stringify(sampleVouchers));
let memUsers = [
  ...JSON.parse(JSON.stringify(sampleUsers)),
  {
    _id: 'usr_customer_01',
    fullName: 'Nguyễn Văn An',
    email: 'khachhang@gmail.com',
    phone: '0909123456',
    role: 'customer',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
    isActive: true
  }
];
let memReconciliations = JSON.parse(JSON.stringify(sampleReconciliations));

let memSchedules = [
  {
    _id: 'sch_bb_01',
    musicalSlug: 'bong-bong-bay',
    musicalTitle: 'Bông Bóng Bay',
    performanceDate: new Date('2026-11-15T19:30:00Z'),
    time: '19:30',
    venue: 'Nhà Hát Thành Phố - Số 07 Công Trường Lam Sơn, Q.1',
    hall: 'Khán phòng Grand A',
    totalSeats: 110,
    bookedSeats: 4,
    lockedSeatsCount: 3,
    status: 'available',
    seats: generateSeatLayout(800000, 450000, 1200000)
  },
  {
    _id: 'sch_bb_02',
    musicalSlug: 'bong-bong-bay',
    musicalTitle: 'Bông Bóng Bay',
    performanceDate: new Date('2026-11-20T20:00:00Z'),
    time: '20:00',
    venue: 'Nhà Hát Thành Phố - Số 07 Công Trường Lam Sơn, Q.1',
    hall: 'Khán phòng Grand A',
    totalSeats: 110,
    bookedSeats: 110,
    lockedSeatsCount: 0,
    status: 'sold_out',
    seats: generateSeatLayout(800000, 450000, 1200000).map(s => ({ ...s, status: 'booked' }))
  },
  {
    _id: 'sch_gm_01',
    musicalSlug: 'giac-mo-mua-he',
    musicalTitle: 'Giấc Mơ Mùa Hè',
    performanceDate: new Date('2026-11-18T19:30:00Z'),
    time: '19:30',
    venue: 'Nhà Hát Thành Phố - Số 07 Công Trường Lam Sơn, Q.1',
    hall: 'Khán phòng Broadway Opera',
    totalSeats: 110,
    bookedSeats: 2,
    lockedSeatsCount: 2,
    status: 'available',
    seats: generateSeatLayout(950000, 500000, 1350000)
  }
];

let memBookings = [
  {
    _id: 'bk_001',
    bookingCode: 'NK-20261102-VALID',
    musicalSlug: 'bong-bong-bay',
    musicalTitle: 'Bông Bóng Bay',
    scheduleId: 'sch_bb_01',
    performanceDate: new Date('2026-11-15T19:30:00Z'),
    performanceTime: '19:30',
    venue: 'Nhà Hát Thành Phố HCM',
    hall: 'Khán phòng Grand A',
    customerName: 'Nguyễn Văn An',
    customerEmail: 'khachhang@gmail.com',
    customerPhone: '0909123456',
    seats: [
      { seatCode: 'B05', floor: 'Tầng Trệt', row: 'B', number: 5, type: 'VIP', price: 800000 },
      { seatCode: 'B06', floor: 'Tầng Trệt', row: 'B', number: 6, type: 'VIP', price: 800000 }
    ],
    quantity: 2,
    subtotal: 1600000,
    voucherCode: 'SHOWMAN20',
    discountAmount: 250000,
    totalPrice: 1350000,
    paymentMethod: 'VIETQR',
    paymentStatus: 'PAID',
    bookingStatus: 'CONFIRMED',
    qrCodeData: JSON.stringify({ code: 'NK-20261102-VALID', seats: 'B05, B06' }),
    checkInInfo: { checkedInAt: null, checkedInBy: null, gate: 'Cửa Chính Khán Phòng A' },
    createdAt: new Date()
  },
  {
    _id: 'bk_002',
    bookingCode: 'NK-20261102-USED1',
    musicalSlug: 'bong-bong-bay',
    musicalTitle: 'Bông Bóng Bay',
    scheduleId: 'sch_bb_01',
    performanceDate: new Date('2026-11-15T19:30:00Z'),
    performanceTime: '19:30',
    venue: 'Nhà Hát Thành Phố HCM',
    hall: 'Khán phòng Grand A',
    customerName: 'Trần Thị Mai',
    customerEmail: 'maitran@gmail.com',
    customerPhone: '0918888777',
    seats: [{ seatCode: 'D07', floor: 'Tầng Trệt', row: 'D', number: 7, type: 'Standard', price: 450000 }],
    quantity: 1,
    subtotal: 450000,
    voucherCode: null,
    discountAmount: 0,
    totalPrice: 450000,
    paymentMethod: 'VNPAY',
    paymentStatus: 'PAID',
    bookingStatus: 'CHECKED_IN',
    qrCodeData: JSON.stringify({ code: 'NK-20261102-USED1', seats: 'D07' }),
    checkInInfo: { checkedInAt: new Date(Date.now() - 3600000), checkedInBy: 'Phạm Hùng Cường (Soát vé Cửa A)', gate: 'Cửa A' },
    createdAt: new Date()
  },
  {
    _id: 'bk_003',
    bookingCode: 'NK-20261102-CNCLD',
    musicalSlug: 'bong-bong-bay',
    musicalTitle: 'Bông Bóng Bay',
    scheduleId: 'sch_bb_01',
    performanceDate: new Date('2026-11-15T19:30:00Z'),
    performanceTime: '19:30',
    venue: 'Nhà Hát Thành Phố HCM',
    hall: 'Khán phòng Grand A',
    customerName: 'Hoàng Nam',
    customerEmail: 'hoangnam@gmail.com',
    customerPhone: '0933222111',
    seats: [{ seatCode: 'D08', floor: 'Tầng Trệt', row: 'D', number: 8, type: 'Standard', price: 450000 }],
    quantity: 1,
    subtotal: 450000,
    voucherCode: null,
    discountAmount: 0,
    totalPrice: 450000,
    paymentMethod: 'MOMO',
    paymentStatus: 'REFUNDED',
    bookingStatus: 'CANCELLED',
    refundInfo: {
      refundedAt: new Date(),
      refundAmount: 405000,
      refundFee: 45000,
      refundReason: 'Khách hàng bận công tác đột xuất'
    },
    createdAt: new Date()
  }
];

// Định kỳ quét giải phóng các ghế giữ tạm (Temporary Hold) đã hết hạn 8 phút
setInterval(() => {
  const now = new Date();
  memSchedules.forEach(schedule => {
    schedule.seats.forEach(seat => {
      if (seat.status === 'holding' && seat.holdingExpiresAt && new Date(seat.holdingExpiresAt) < now) {
        seat.status = 'available';
        seat.holdingSessionId = null;
        seat.holdingExpiresAt = null;
      }
    });
  });
}, 15000);

// Kết nối MongoDB
mongoose
  .connect(MONGODB_URI, { serverSelectionTimeoutMS: 2500 })
  .then(() => {
    isMongoConnected = true;
    console.log('✅ Đã kết nối MongoDB thành công!');
  })
  .catch(err => {
    isMongoConnected = false;
    console.warn(`⚠️ Chưa bật MongoDB daemon (${err.message}). API đang vận hành ở chế độ Mock Store dự phòng.`);
  });

// ============================================================
// 3. API PHÂN HỆ 1: CUSTOMER PORTAL
// ============================================================

/**
 * POST /api/auth/check-user - Kiểm tra sự tồn tại của tài khoản (BPMN 2.2.2)
 */
app.post('/api/auth/check-user', (req, res) => {
  const { identifier } = req.body;
  if (!identifier) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp email hoặc số điện thoại' });
  }

  const clean = identifier.trim().toLowerCase();
  const exists = memUsers.some(u => 
    (u.email && u.email.toLowerCase() === clean) || 
    (u.phone && u.phone === clean)
  );

  res.status(200).json({ success: true, exists });
});

/**
 * POST /api/auth/login - Đăng nhập tài khoản (BPMN 2.2.2.1)
 */
app.post('/api/auth/login', (req, res) => {
  const { method, identifier, password, otp } = req.body;

  if (!identifier) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập Email hoặc Số điện thoại' });
  }

  const clean = identifier.trim().toLowerCase();
  let user = memUsers.find(u => 
    (u.email && u.email.toLowerCase() === clean) || 
    (u.phone && u.phone === clean)
  );

  // Bước 7 BPMN 2.2.2.1: Nếu tài khoản chưa tồn tại
  if (!user) {
    return res.status(404).json({
      success: false,
      notFound: true,
      message: 'Tài khoản chưa tồn tại trên hệ thống. Vui lòng chuyển sang Đăng ký để tạo tài khoản mới!'
    });
  }

  // Nếu là phương thức OTP qua số điện thoại
  if (method === 'phone') {
    if (otp && otp !== '123456') {
      return res.status(400).json({ success: false, message: 'Mã xác thực OTP không chính xác (Thử: 123456)' });
    }
  }

  res.status(200).json({
    success: true,
    message: 'Đăng nhập thành công!',
    data: {
      user: {
        _id: user._id || 'usr_customer_01',
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80'
      },
      token: 'mock_jwt_token_' + Date.now()
    }
  });
});

/**
 * POST /api/auth/register - Đăng ký tài khoản mới (BPMN 2.2.2.2)
 */
app.post('/api/auth/register', (req, res) => {
  const { method, fullName, email, phone, password } = req.body;

  if (!fullName) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập họ và tên' });
  }

  const checkEmail = (email || '').trim().toLowerCase();
  const checkPhone = (phone || '').trim();

  // Bước 7 BPMN 2.2.2.2: Kiểm tra tài khoản đã tồn tại
  const existingUser = memUsers.find(u => 
    (checkEmail && u.email && u.email.toLowerCase() === checkEmail) ||
    (checkPhone && u.phone && u.phone === checkPhone)
  );

  if (existingUser) {
    return res.status(409).json({
      success: false,
      alreadyExists: true,
      message: 'Tài khoản đã tồn tại trên hệ thống. Vui lòng chuyển sang Đăng nhập!'
    });
  }

  const newUser = {
    _id: 'usr_' + Date.now(),
    fullName,
    email: checkEmail || `${checkPhone || 'user'}@nhackichthanhpho.vn`,
    phone: checkPhone || '0909000111',
    role: 'customer',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
    isActive: true,
    createdAt: new Date()
  };

  memUsers.push(newUser);

  res.status(201).json({
    success: true,
    message: '🎉 Đăng ký tài khoản thành công! Chào mừng bạn đến với Nhà Hát Thành Phố.',
    data: {
      user: newUser,
      token: 'mock_jwt_token_' + Date.now()
    }
  });
});

/**
 * GET /api/musicals - Danh mục vở kịch với tìm kiếm, lọc thể loại, trạng thái & sắp xếp
 */
app.get('/api/musicals', async (req, res) => {
  try {
    const { search, genre, status, sort } = req.query;
    let list = memMusicals;

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(m => m.title.toLowerCase().includes(q) || m.director.toLowerCase().includes(q));
    }
    if (genre && genre !== 'all') {
      list = list.filter(m => m.genre === genre);
    }
    if (status && status !== 'all') {
      list = list.filter(m => m.status === status);
    }
    if (sort === 'price_asc') {
      list.sort((a, b) => a.ticketPrices[0].price - b.ticketPrices[0].price);
    } else if (sort === 'price_desc') {
      list.sort((a, b) => b.ticketPrices[0].price - a.ticketPrices[0].price);
    }

    res.status(200).json({ success: true, count: list.length, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/musicals/:slug - Chi tiết vở kịch theo slug + kèm suất chiếu
 */
app.get('/api/musicals/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const musical = memMusicals.find(m => m.slug === slug.toLowerCase());
    if (!musical) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy vở kịch' });
    }
    const schedules = memSchedules.filter(s => s.musicalSlug === slug.toLowerCase());
    res.status(200).json({ success: true, data: { ...musical, schedules } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/schedules - Danh sách tất cả suất chiếu
 */
app.get('/api/schedules', async (req, res) => {
  try {
    const { slug } = req.query;
    let result = memSchedules;
    if (slug) {
      result = result.filter(s => s.musicalSlug === slug);
    }
    res.status(200).json({ success: true, count: result.length, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/schedules/:scheduleId/seats - Lấy sơ đồ ghế ngồi thời gian thực
 */
app.get('/api/schedules/:scheduleId/seats', (req, res) => {
  const { scheduleId } = req.params;
  const schedule = memSchedules.find(s => s._id === scheduleId);
  if (!schedule) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy suất diễn' });
  }
  res.status(200).json({
    success: true,
    data: {
      scheduleId: schedule._id,
      musicalTitle: schedule.musicalTitle,
      performanceDate: schedule.performanceDate,
      time: schedule.time,
      hall: schedule.hall,
      seats: schedule.seats
    }
  });
});

/**
 * POST /api/schedules/:scheduleId/hold-seats - Giữ ghế tạm thời (Hold 8 phút) chống trùng lặp
 */
app.post('/api/schedules/:scheduleId/hold-seats', (req, res) => {
  const { scheduleId } = req.params;
  const { seatCodes, sessionId } = req.body;

  if (!seatCodes || !Array.isArray(seatCodes) || seatCodes.length === 0) {
    return res.status(400).json({ success: false, message: 'Vui lòng chọn ít nhất 1 ghế' });
  }

  const schedule = memSchedules.find(s => s._id === scheduleId);
  if (!schedule) {
    return res.status(404).json({ success: false, message: 'Suất diễn không tồn tại' });
  }

  // Kiểm tra ghế có đang bị giữ bởi người khác hoặc đã bán/khóa hay không
  const unavailable = [];
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 phút (theo BPMN 2.2.3)

  seatCodes.forEach(code => {
    const seat = schedule.seats.find(s => s.seatCode === code);
    if (!seat) {
      unavailable.push({ code, reason: 'Ghế không tồn tại' });
    } else if (seat.status === 'booked') {
      unavailable.push({ code, reason: 'Ghế đã bán' });
    } else if (seat.status === 'locked') {
      unavailable.push({ code, reason: 'Ghế khóa nội bộ: ' + (seat.lockedReason || 'Bảo mật') });
    } else if (seat.status === 'holding' && seat.holdingSessionId !== sessionId) {
      unavailable.push({ code, reason: 'Khán giả khác đang giữ ghế' });
    }
  });

  if (unavailable.length > 0) {
    return res.status(409).json({
      success: false,
      message: 'Một số ghế không thể chọn do đã được giữ hoặc đã bán',
      details: unavailable
    });
  }

  // Khóa giữ ghế tạm thời
  seatCodes.forEach(code => {
    const seat = schedule.seats.find(s => s.seatCode === code);
    if (seat) {
      seat.status = 'holding';
      seat.holdingSessionId = sessionId;
      seat.holdingExpiresAt = expiresAt;
    }
  });

  res.status(200).json({
    success: true,
    message: `Đã giữ tạm thời ${seatCodes.length} ghế trong 10 phút. Vui lòng thanh toán!`,
    expiresAt,
    holdDurationSeconds: 600
  });
});

/**
 * POST /api/schedules/:scheduleId/release-seats - Giải phóng ghế khi khách hủy hoặc hết giờ
 */
app.post('/api/schedules/:scheduleId/release-seats', (req, res) => {
  const { scheduleId } = req.params;
  const { seatCodes, sessionId } = req.body;

  const schedule = memSchedules.find(s => s._id === scheduleId);
  if (schedule && Array.isArray(seatCodes)) {
    seatCodes.forEach(code => {
      const seat = schedule.seats.find(s => s.seatCode === code);
      if (seat && (seat.holdingSessionId === sessionId || !sessionId)) {
        seat.status = 'available';
        seat.holdingSessionId = null;
        seat.holdingExpiresAt = null;
      }
    });
  }
  res.status(200).json({ success: true, message: 'Đã giải phóng ghế' });
});

/**
 * POST /api/vouchers/validate - Kiểm tra và áp dụng mã giảm giá
 */
app.post('/api/vouchers/validate', (req, res) => {
  const { code, subtotal } = req.body;
  if (!code) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập mã giảm giá' });
  }

  const voucher = memVouchers.find(v => v.code === code.toUpperCase().trim() && v.isActive);
  if (!voucher) {
    return res.status(404).json({ success: false, message: 'Mã giảm giá không tồn tại hoặc đã hết hạn' });
  }

  if (subtotal < voucher.minOrderValue) {
    return res.status(400).json({
      success: false,
      message: `Đơn hàng tối thiểu ${voucher.minOrderValue.toLocaleString('vi-VN')} đ để dùng mã này`
    });
  }

  let discount = 0;
  if (voucher.discountType === 'PERCENT') {
    discount = Math.round((subtotal * voucher.discountValue) / 100);
    if (voucher.maxDiscountAmount && discount > voucher.maxDiscountAmount) {
      discount = voucher.maxDiscountAmount;
    }
  } else {
    discount = voucher.discountValue;
  }

  res.status(200).json({
    success: true,
    message: `Áp dụng thành công mã ${voucher.code}: ${voucher.description}`,
    data: {
      code: voucher.code,
      discountAmount: discount,
      discountType: voucher.discountType,
      discountValue: voucher.discountValue
    }
  });
});

/**
 * POST /api/bookings - Tạo đơn đặt vé, xử lý thanh toán mô phỏng và sinh E-Ticket QR
 */
app.post('/api/bookings', (req, res) => {
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
  } = req.body;

  if (!customerName || !customerEmail || !customerPhone || !seats || seats.length === 0) {
    return res.status(400).json({ success: false, message: 'Thông tin đặt vé không đầy đủ' });
  }

  const schedule = memSchedules.find(s => s._id === scheduleId);
  const musical = memMusicals.find(m => m.slug === musicalSlug);

  // Tính tiền
  const subtotal = seats.reduce((sum, s) => sum + s.price, 0);
  let discountAmount = 0;

  if (voucherCode) {
    const voucher = memVouchers.find(v => v.code === voucherCode.toUpperCase() && v.isActive);
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
    venue: schedule ? schedule.venue : 'Nhà Hát Thành Phố HCM',
    hall: schedule ? schedule.hall : 'Khán phòng Grand A',
    customerName,
    customerEmail,
    customerPhone,
    seats,
    quantity: seats.length,
    subtotal,
    voucherCode,
    discountAmount,
    totalPrice,
    paymentMethod: paymentMethod || 'VIETQR',
    paymentStatus: 'PAID',
    bookingStatus: 'CONFIRMED',
    qrCodeData,
    checkInInfo: { checkedInAt: null, checkedInBy: null, gate: 'Cửa Chính Khán Phòng A' },
    refundInfo: null,
    notes: notes || '',
    createdAt: new Date()
  };

  memBookings.unshift(newBooking);

  // Cập nhật trạng thái ghế trong schedule thành 'booked'
  if (schedule) {
    seats.forEach(booked => {
      const targetSeat = schedule.seats.find(s => s.seatCode === booked.seatCode);
      if (targetSeat) {
        targetSeat.status = 'booked';
        targetSeat.holdingSessionId = null;
        targetSeat.holdingExpiresAt = null;
      }
    });
    schedule.bookedSeats += seats.length;
    if (schedule.bookedSeats >= schedule.totalSeats) {
      schedule.status = 'sold_out';
    }
  }

  // Tự động tạo bản ghi đối soát giao dịch
  memReconciliations.unshift({
    transactionId: `TXN-${paymentMethod || 'VIETQR'}-${Date.now().toString().slice(-6)}`,
    bookingCode,
    gateway: paymentMethod || 'VIETQR',
    systemAmount: totalPrice,
    gatewayAmount: totalPrice,
    fee: Math.round(totalPrice * 0.015),
    netAmount: Math.round(totalPrice * 0.985),
    status: 'MATCHED',
    transactionDate: new Date(),
    reconciledAt: new Date(),
    reconciledBy: 'Hệ thống tự động',
    notes: 'Giao dịch thanh toán thành công'
  });

  res.status(201).json({
    success: true,
    message: '🎉 Đặt vé và thanh toán thành công! E-Ticket đã được tạo.',
    data: newBooking
  });
});

/**
 * GET /api/bookings/my-bookings - Lịch sử vé khách hàng
 */
app.get('/api/bookings/my-bookings', (req, res) => {
  const { email, phone } = req.query;
  let list = memBookings;
  if (email || phone) {
    list = list.filter(b => (email && b.customerEmail === email) || (phone && b.customerPhone === phone));
  }
  res.status(200).json({ success: true, count: list.length, data: list });
});

/**
 * POST /api/bookings/:bookingCode/cancel - Khách hàng hủy vé và yêu cầu hoàn tiền theo chính sách
 */
app.post('/api/bookings/:bookingCode/cancel', (req, res) => {
  const { bookingCode } = req.params;
  const { reason } = req.body;

  const booking = memBookings.find(b => b.bookingCode === bookingCode);
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy đơn đặt vé' });
  }

  if (booking.bookingStatus === 'CANCELLED') {
    return res.status(400).json({ success: false, message: 'Đơn vé này đã được hủy trước đó' });
  }

  if (booking.bookingStatus === 'CHECKED_IN') {
    return res.status(400).json({ success: false, message: 'Vé đã sử dụng để vào rạp, không thể hủy' });
  }

  // Kiểm tra điều kiện thời gian (trước giờ diễn > 24h: hoàn 90%, từ 12-24h: hoàn 70%, < 12h: không hoàn)
  const now = new Date();
  const showDate = new Date(booking.performanceDate);
  const diffHours = (showDate - now) / (1000 * 60 * 60);

  let refundPercent = 0.9;
  if (diffHours < 12) {
    return res.status(400).json({
      success: false,
      message: 'Suất diễn diễn ra trong vòng 12 giờ tới. Theo quy định nhà hát, không thể hủy vé.'
    });
  } else if (diffHours < 24) {
    refundPercent = 0.7;
  }

  const refundAmount = Math.round(booking.totalPrice * refundPercent);
  const refundFee = booking.totalPrice - refundAmount;

  booking.bookingStatus = 'CANCELLED';
  booking.paymentStatus = 'REFUNDED';
  booking.refundInfo = {
    refundedAt: new Date(),
    refundAmount,
    refundFee,
    refundReason: reason || 'Khách hàng yêu cầu hủy vé trực tuyến'
  };

  // Trả lại ghế về trạng thái Available
  const schedule = memSchedules.find(s => s._id === booking.scheduleId);
  if (schedule && booking.seats) {
    booking.seats.forEach(s => {
      const seat = schedule.seats.find(st => st.seatCode === s.seatCode);
      if (seat) seat.status = 'available';
    });
    schedule.bookedSeats = Math.max(0, schedule.bookedSeats - booking.quantity);
    if (schedule.status === 'sold_out') schedule.status = 'available';
  }

  res.status(200).json({
    success: true,
    message: `Hủy vé thành công! Bạn được hoàn ${refundAmount.toLocaleString('vi-VN')} đ (phí hủy: ${refundFee.toLocaleString('vi-VN')} đ). Tiền sẽ chuyển về tài khoản trong 1-3 ngày làm việc.`,
    data: booking
  });
});

/**
 * GET /api/artists - Danh sách nghệ sĩ tiêu biểu
 */
app.get('/api/artists', (req, res) => {
  res.status(200).json({ success: true, data: sampleArtists });
});

// ============================================================
// 4. API PHÂN HỆ 2: CỔNG QUẢN TRỊ (ADMIN PORTAL - RBAC)
// ============================================================

/**
 * GET /api/admin/dashboard - Thống kê doanh thu, vé bán, occupancy rate
 */
app.get('/api/admin/dashboard', (req, res) => {
  const totalRevenue = memBookings
    .filter(b => b.paymentStatus === 'PAID')
    .reduce((sum, b) => sum + b.totalPrice, 0);

  const totalTicketsSold = memBookings
    .filter(b => b.bookingStatus !== 'CANCELLED')
    .reduce((sum, b) => sum + b.quantity, 0);

  const totalSeatsAllSchedules = memSchedules.reduce((sum, s) => sum + s.totalSeats, 0);
  const totalBookedAllSchedules = memSchedules.reduce((sum, s) => sum + s.bookedSeats, 0);
  const occupancyRate = Math.round((totalBookedAllSchedules / totalSeatsAllSchedules) * 100) || 68;

  // Thống kê theo cổng thanh toán
  const paymentBreakdown = {
    VIETQR: memBookings.filter(b => b.paymentMethod === 'VIETQR').reduce((sum, b) => sum + b.totalPrice, 0),
    VNPAY: memBookings.filter(b => b.paymentMethod === 'VNPAY').reduce((sum, b) => sum + b.totalPrice, 0),
    MOMO: memBookings.filter(b => b.paymentMethod === 'MOMO').reduce((sum, b) => sum + b.totalPrice, 0),
    ZALOPAY: memBookings.filter(b => b.paymentMethod === 'ZALOPAY').reduce((sum, b) => sum + b.totalPrice, 0),
    BANK_CARD: memBookings.filter(b => b.paymentMethod === 'BANK_CARD').reduce((sum, b) => sum + b.totalPrice, 0)
  };

  res.status(200).json({
    success: true,
    data: {
      totalRevenue,
      totalTicketsSold,
      totalOrders: memBookings.length,
      occupancyRate,
      activeShowsCount: memMusicals.filter(m => m.status === 'now_showing').length,
      paymentBreakdown
    }
  });
});

/**
 * POST /api/admin/seats/lock - KHÓA GHẾ NỘI BỘ (Báo chí, Khách mời ngoại giao, Kỹ thuật)
 */
app.post('/api/admin/seats/lock', (req, res) => {
  const { scheduleId, seatCodes, reason, lockedBy } = req.body;

  if (!scheduleId || !seatCodes || !Array.isArray(seatCodes) || seatCodes.length === 0) {
    return res.status(400).json({ success: false, message: 'Dữ liệu khóa ghế không hợp lệ' });
  }

  const schedule = memSchedules.find(s => s._id === scheduleId);
  if (!schedule) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy suất diễn' });
  }

  seatCodes.forEach(code => {
    const seat = schedule.seats.find(s => s.seatCode === code);
    if (seat) {
      seat.status = 'locked';
      seat.lockedReason = reason || 'Ghế nội bộ nhà hát';
      seat.lockedBy = lockedBy || 'Admin Quản Trị';
      seat.lockedAt = new Date();
    }
  });

  schedule.lockedSeatsCount = schedule.seats.filter(s => s.status === 'locked').length;

  res.status(200).json({
    success: true,
    message: `Đã khóa ${seatCodes.length} ghế nội bộ (${reason}) thành công! Đồng bộ tức thì tới khách hàng.`,
    data: { lockedCount: seatCodes.length, reason }
  });
});

/**
 * POST /api/admin/seats/unlock - MỞ KHÓA GHẾ NỘI BỘ
 */
app.post('/api/admin/seats/unlock', (req, res) => {
  const { scheduleId, seatCodes } = req.body;
  const schedule = memSchedules.find(s => s._id === scheduleId);
  if (!schedule) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy suất diễn' });
  }

  seatCodes.forEach(code => {
    const seat = schedule.seats.find(s => s.seatCode === code);
    if (seat && seat.status === 'locked') {
      seat.status = 'available';
      seat.lockedReason = null;
      seat.lockedBy = null;
      seat.lockedAt = null;
    }
  });

  schedule.lockedSeatsCount = schedule.seats.filter(s => s.status === 'locked').length;

  res.status(200).json({
    success: true,
    message: `Đã mở khóa ${seatCodes.length} ghế thành công. Khách hàng có thể đặt ngay bây giờ.`
  });
});

/**
 * GET /api/admin/orders - Tra cứu danh sách đơn hàng
 */
app.get('/api/admin/orders', (req, res) => {
  const { search, status } = req.query;
  let list = memBookings;
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(
      b =>
        b.bookingCode.toLowerCase().includes(q) ||
        b.customerName.toLowerCase().includes(q) ||
        b.customerPhone.includes(q) ||
        b.customerEmail.toLowerCase().includes(q)
    );
  }
  if (status && status !== 'all') {
    list = list.filter(b => b.bookingStatus === status);
  }
  res.status(200).json({ success: true, count: list.length, data: list });
});

/**
 * POST /api/admin/orders/:id/refund - Quản trị viên xử lý hoàn tiền đơn hàng
 */
app.post('/api/admin/orders/:id/refund', (req, res) => {
  const { id } = req.params;
  const { reason, refundAmount } = req.body;

  const order = memBookings.find(b => b._id === id || b.bookingCode === id);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' });
  }

  order.bookingStatus = 'CANCELLED';
  order.paymentStatus = 'REFUNDED';
  order.refundInfo = {
    refundedAt: new Date(),
    refundAmount: refundAmount || order.totalPrice,
    refundReason: reason || 'Hoàn tiền bởi Ban quản trị nhà hát'
  };

  // Mở lại ghế
  const schedule = memSchedules.find(s => s._id === order.scheduleId);
  if (schedule && order.seats) {
    order.seats.forEach(s => {
      const seat = schedule.seats.find(st => st.seatCode === s.seatCode);
      if (seat) seat.status = 'available';
    });
  }

  res.status(200).json({ success: true, message: 'Đã hoàn tiền đơn hàng thành công', data: order });
});

/**
 * GET /api/admin/vouchers & POST /api/admin/vouchers
 */
app.get('/api/admin/vouchers', (req, res) => {
  res.status(200).json({ success: true, data: memVouchers });
});

app.post('/api/admin/vouchers', (req, res) => {
  const { code, description, discountType, discountValue, minOrderValue, maxDiscountAmount, usageLimit, validUntil } = req.body;
  if (!code || !discountValue) {
    return res.status(400).json({ success: false, message: 'Mã voucher và giá trị giảm là bắt buộc' });
  }

  const newVoucher = {
    _id: 'vc_' + Date.now(),
    code: code.toUpperCase().trim(),
    description: description || 'Mã ưu đãi khán giả',
    discountType: discountType || 'PERCENT',
    discountValue: Number(discountValue),
    minOrderValue: Number(minOrderValue) || 0,
    maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
    usageLimit: Number(usageLimit) || 100,
    usedCount: 0,
    validUntil: validUntil ? new Date(validUntil) : new Date(Date.now() + 30 * 86400000),
    isActive: true
  };

  memVouchers.unshift(newVoucher);
  res.status(201).json({ success: true, message: 'Đã tạo mã giảm giá thành công!', data: newVoucher });
});

app.patch('/api/admin/vouchers/:id/toggle', (req, res) => {
  const { id } = req.params;
  const voucher = memVouchers.find(v => v._id === id || v.code === id);
  if (voucher) {
    voucher.isActive = !voucher.isActive;
    return res.status(200).json({ success: true, message: 'Đã cập nhật trạng thái voucher', data: voucher });
  }
  res.status(404).json({ success: false, message: 'Không tìm thấy voucher' });
});

/**
 * GET /api/admin/reports/reconciliation - Danh sách đối soát doanh thu & giao dịch
 */
app.get('/api/admin/reports/reconciliation', (req, res) => {
  res.status(200).json({ success: true, data: memReconciliations });
});

/**
 * GET /api/admin/users - Quản lý nhân sự nội bộ RBAC
 */
app.get('/api/admin/users', (req, res) => {
  res.status(200).json({ success: true, data: memUsers });
});

// ============================================================
// 5. API PHÂN HỆ 3: CỔNG SOÁT VÉ & VẬN HÀNH (OPS PORTAL)
// ============================================================

/**
 * POST /api/ops/check-in - Soát vé & Check-in thời gian thực (hỗ trợ nhập mã hoặc quét QR)
 */
app.post('/api/ops/check-in', (req, res) => {
  const { ticketCode, qrData, operatorName, gate } = req.body;

  // Lấy mã vé từ mã nhập tay hoặc parse từ dữ liệu QR code
  let searchCode = ticketCode ? ticketCode.trim().toUpperCase() : null;
  if (!searchCode && qrData) {
    try {
      const parsed = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
      searchCode = parsed.bookingCode || parsed.code;
    } catch (e) {
      searchCode = qrData.trim().toUpperCase();
    }
  }

  if (!searchCode) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập mã vé hoặc quét mã QR' });
  }

  const booking = memBookings.find(b => b.bookingCode === searchCode);

  if (!booking) {
    return res.status(404).json({
      success: false,
      code: 'INVALID_TICKET',
      message: `❌ VÉ KHÔNG TỒN TẠI! Mã vé "${searchCode}" không có trong hệ thống nhà hát.`
    });
  }

  if (booking.bookingStatus === 'CANCELLED') {
    return res.status(400).json({
      success: false,
      code: 'CANCELLED_TICKET',
      message: `❌ VÉ ĐÃ BỊ HỦY! Đơn vé "${searchCode}" đã được hoàn tiền vào ngày ${new Date(booking.refundInfo?.refundedAt).toLocaleDateString('vi-VN')}.`
    });
  }

  if (booking.bookingStatus === 'CHECKED_IN') {
    return res.status(409).json({
      success: false,
      code: 'ALREADY_CHECKED_IN',
      message: `⚠️ CẢNH BÁO TRÙNG LẶP: Vé "${searchCode}" ĐÃ ĐƯỢC CHECK-IN vào lúc ${new Date(booking.checkInInfo?.checkedInAt).toLocaleTimeString('vi-VN')} bởi ${booking.checkInInfo?.checkedInBy || 'Nhân viên soát vé'}!`,
      data: booking
    });
  }

  // Check-in thành công
  booking.bookingStatus = 'CHECKED_IN';
  booking.checkInInfo = {
    checkedInAt: new Date(),
    checkedInBy: operatorName || 'Nhân viên Soát vé Cửa A',
    gate: gate || 'Cửa Chính Khán Phòng A'
  };

  res.status(200).json({
    success: true,
    code: 'CHECK_IN_SUCCESS',
    message: `✅ CHECK-IN THÀNH CÔNG! Chào mừng quý khách ${booking.customerName} vào khán phòng.`,
    data: {
      bookingCode: booking.bookingCode,
      customerName: booking.customerName,
      musicalTitle: booking.musicalTitle,
      performanceTime: booking.performanceTime,
      hall: booking.hall,
      seats: booking.seats.map(s => s.seatCode).join(', '),
      quantity: booking.quantity,
      checkedInAt: booking.checkInInfo.checkedInAt,
      checkedInBy: booking.checkInInfo.checkedInBy
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    serverTime: new Date().toISOString(),
    database: isMongoConnected ? 'CONNECTED (MongoDB)' : 'IN-MEMORY STANDALONE (Mock Store Active)',
    totalShows: memMusicals.length,
    totalBookings: memBookings.length
  });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 CITY MUSICAL FULL-STACK API SERVER: PORT ${PORT}`);
  console.log(`🎭 Customer Portal API: http://localhost:${PORT}/api/musicals`);
  console.log(`🛡️ Admin Portal API:   http://localhost:${PORT}/api/admin/dashboard`);
  console.log(`🎫 Ops Check-in API:    http://localhost:${PORT}/api/ops/check-in`);
  console.log(`====================================================`);
});
