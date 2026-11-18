/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ (CITY MUSICAL WEBSITE) - BACKEND API SERVER
 * Kiến trúc: ExpressJS RESTful API, Phân tầng Layered Architecture (Service Pattern)
 * Hỗ trợ 3 phân hệ:
 * 1. Customer Portal (Trang chủ, Lọc vở diễn, Sơ đồ ghế, Giữ ghế 8p, Đặt vé, Voucher)
 * 2. Admin Portal (Dashboard, Khóa ghế nội bộ, Quản lý đơn, Vouchers, Đối soát doanh thu, RBAC)
 * 3. Ops Portal (Soát vé, Check-in thời gian thực, Quét mã QR)
 * ============================================================
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDatabase = require('./config/database');
const apiRoutes = require('./routes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Middlewares cơ bản
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 2. Khởi tạo kết nối MongoDB & đồng bộ dữ liệu
connectDatabase();

// 3. Đăng ký toàn bộ API Routes
app.use('/api', apiRoutes);

// 4. Root Endpoint & Health check
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Nhà Hát Nhạc Kịch Thành Phố API Server đang hoạt động',
    docs: '/api/health',
    version: '2.0.0-enterprise'
  });
});

// 5. Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Lỗi máy chủ nội bộ'
  });
});

// 6. Start HTTP Server
if (require.main === module && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`============================================================`);
    console.log(`🎭 NHẠC KỊCH THÀNH PHỐ - BACKEND API SERVER (SERVICE PATTERN)`);
    console.log(`🚀 Server đang lắng nghe tại: http://localhost:${PORT}`);
    console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`============================================================`);
  });
}

module.exports = app;
