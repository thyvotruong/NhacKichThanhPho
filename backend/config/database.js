/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ - BACKEND ARCHITECTURE
 * File: config/database.js
 * Chức năng: Khởi tạo kết nối MongoDB và đồng bộ Seed Data tự động
 * ============================================================
 */

const mongoose = require('mongoose');
const store = require('./store');

const Musical = require('../models/musical.model');
const Schedule = require('../models/schedule.model');
const Booking = require('../models/booking.model');
const Voucher = require('../models/voucher.model');
const User = require('../models/user.model');
const Reconciliation = require('../models/reconciliation.model');
const Artist = require('../models/artist.model');
const Subscriber = require('../models/subscriber.model');
const AuditLog = require('../models/audit-log.model');
const Ticket = require('../models/ticket.model');

const THEATER_ADDRESS = 'Nhạc kịch Thành phố - 669 Đỗ Mười, khu phố 3, Linh Xuân, TP.HCM';

const connectDatabase = async () => {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nhac_kich_thanh_pho';

  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 2500 });
    store.isMongoConnected = true;
    console.log('✅ Đã kết nối MongoDB thành công!');

    try {
      // 1. Xóa hoàn toàn các vở cũ nếu còn sót
      await Musical.deleteMany({
        $or: [
          { slug: { $in: ['bong-bong-bay', 'giac-mo-mua-he', 'huyen-thoai-anh-sao', 'demo-da-khuc-sai-gon', 'demo-vu-dieu-anh-trang'] } },
          { title: { $in: ['Bông Bóng Bay', 'Giấc Mơ Mùa Hè', 'Huyền Thoại Ánh Sao'] } }
        ]
      });

      // 2. Xóa các lịch diễn của các vở cũ
      await Schedule.deleteMany({
        $or: [
          { musicalSlug: { $in: ['bong-bong-bay', 'giac-mo-mua-he', 'huyen-thoai-anh-sao'] } },
          { musicalTitle: { $in: ['Bông Bóng Bay', 'Giấc Mơ Mùa Hè', 'Huyền Thoại Ánh Sao'] } }
        ]
      });

      // 3. Đồng bộ 8 vở kịch mới từ musicals.json vào MongoDB
      if (await Musical.countDocuments() === 0) {
        for (const musical of store.memMusicals) {
          await Musical.create(musical);
        }
      }

      // 4. Đồng bộ 20 suất diễn chuẩn phủ kín từ 18/11 đến 30/11/2026 vào MongoDB an toàn
      for (const schedule of store.memSchedules) {
        const { _id, ...sData } = schedule;
        await Schedule.findOneAndUpdate(
          { _id: schedule._id },
          { $set: sData, $setOnInsert: { _id: schedule._id } },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
      await Schedule.updateMany(
        { venue: { $ne: THEATER_ADDRESS } },
        { $set: { venue: THEATER_ADDRESS } }
      );

      // 5. Đồng bộ bảng đối soát giao dịch mẫu vào MongoDB
      await Reconciliation.deleteMany({ gateway: { $nin: ['VIETQR', 'VNPAY', 'MOMO', 'ZALOPAY'] } });
      for (const rec of store.memReconciliations) {
        await Reconciliation.findOneAndUpdate(
          { transactionId: rec.transactionId },
          { $set: rec },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }

      // 6. Xóa tài khoản kế toán nếu có
      await User.deleteMany({
        $or: [
          { role: 'accountant' },
          { email: 'ketoan@nhackichthanhpho.vn' },
          { username: 'ketoan' }
        ]
      });

      // 7. Đồng bộ tài khoản nhân sự nội bộ (Admin, Editor, Staff, Customer) vào MongoDB
      for (const u of store.memUsers) {
        await User.findOneAndUpdate(
          { $or: [{ username: u.username }, { email: u.email }] },
          { $set: { ...u } },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }

      // 8. Đồng bộ danh sách nghệ sĩ vào MongoDB
      if (await Artist.countDocuments() === 0) {
        await Artist.insertMany(store.memArtists);
      }

      // 9. Đồng bộ danh sách đăng ký nhận tin mẫu vào MongoDB
      if (await Subscriber.countDocuments() === 0) {
        await Subscriber.insertMany(store.memSubscribers);
      }

      // 10. Đồng bộ nhật ký hoạt động mẫu vào MongoDB
      if (await AuditLog.countDocuments() === 0) {
        await AuditLog.insertMany(store.memAuditLogs);
      }

      // 11. Đồng bộ 485 đơn hàng mẫu (740.000.000 VNĐ) vào MongoDB
      if (await Booking.countDocuments() === 0) {
        await Booking.insertMany(store.memBookings);
      }
      await Booking.updateMany(
        { venue: { $ne: THEATER_ADDRESS } },
        { $set: { venue: THEATER_ADDRESS } }
      );

      // 12. Đồng bộ 1.270 vé xem kịch (Tickets) vào MongoDB
      if (await Ticket.countDocuments() === 0) {
        await Ticket.insertMany(store.memTickets);
      }

      console.log('✅ Đã đồng bộ thành công dữ liệu vở kịch, suất diễn, đơn hàng và quản trị vào MongoDB!');
    } catch (seedErr) {
      console.warn('⚠️ Ghi chú khi đồng bộ MongoDB:', seedErr.message);
    }
  } catch (err) {
    store.isMongoConnected = false;
    console.warn(`⚠️ Chưa bật MongoDB daemon (${err.message}). API đang vận hành ở chế độ Mock Store dự phòng.`);
  }
};

module.exports = connectDatabase;
