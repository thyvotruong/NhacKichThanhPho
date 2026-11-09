/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ (CITY MUSICAL WEBSITE) - BACKEND
 * File: seed.js
 * Chức năng: Khởi tạo dữ liệu mẫu toàn diện cho cả 3 phân hệ:
 * - Customer Portal: Musicals, Schedules, Sơ đồ ghế thời gian thực, Vouchers
 * - Admin Portal: Dashboard stats, Khóa ghế nội bộ, Báo cáo & Đối soát
 * - Ops Portal: Dữ liệu vé Check-in thời gian thực
 * ============================================================
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Musical = require('./models/musical.model');
const Schedule = require('./models/schedule.model');
const Booking = require('./models/booking.model');
const Voucher = require('./models/voucher.model');
const User = require('./models/user.model');
const Reconciliation = require('./models/reconciliation.model');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nhac_kich_thanh_pho';

// Hàm sinh sơ đồ ghế ngồi chi tiết cho một suất chiếu
function generateSeatLayout(baseVipPrice = 800000, baseStdPrice = 450000, baseCouplePrice = 1200000) {
  const seats = [];

  // TẦNG TRỆT (STALLS)
  // Hàng A, B, C: VIP
  ['A', 'B', 'C'].forEach(row => {
    for (let num = 1; num <= 12; num++) {
      const code = `${row}${num < 10 ? '0' + num : num}`;
      // Cố định vài ghế demo trạng thái:
      let status = 'available';
      let lockedReason = null;
      let lockedBy = null;

      if (row === 'A' && (num === 1 || num === 2)) {
        status = 'locked';
        lockedReason = 'Khách mời danh dự / Ngoại giao';
        lockedBy = 'Admin Trưởng Ban';
      } else if (row === 'A' && num === 12) {
        status = 'locked';
        lockedReason = 'Kỹ thuật âm thanh sân khấu';
        lockedBy = 'Admin Kỹ Thuật';
      } else if (row === 'B' && (num === 5 || num === 6)) {
        status = 'booked';
      }

      seats.push({
        seatCode: code,
        floor: 'Tầng Trệt',
        row,
        number: num,
        type: 'VIP',
        price: baseVipPrice,
        status,
        lockedReason,
        lockedBy
      });
    }
  });

  // Hàng D, E, F: Standard
  ['D', 'E', 'F'].forEach(row => {
    for (let num = 1; num <= 14; num++) {
      const code = `${row}${num < 10 ? '0' + num : num}`;
      let status = 'available';
      if (row === 'D' && (num === 7 || num === 8)) {
        status = 'booked';
      }
      seats.push({
        seatCode: code,
        floor: 'Tầng Trệt',
        row,
        number: num,
        type: 'Standard',
        price: baseStdPrice,
        status
      });
    }
  });

  // Hàng H: Ghế Đôi (Couple Sweetbox)
  for (let num = 1; num <= 6; num++) {
    const code = `H-CP${num}`;
    seats.push({
      seatCode: code,
      floor: 'Tầng Trệt',
      row: 'H',
      number: num,
      type: 'Couple',
      price: baseCouplePrice,
      status: 'available'
    });
  }

  // TẦNG LẦU (BALCONY)
  // Hàng J, K: Standard
  ['J', 'K'].forEach(row => {
    for (let num = 1; num <= 14; num++) {
      const code = `${row}${num < 10 ? '0' + num : num}`;
      seats.push({
        seatCode: code,
        floor: 'Tầng Lầu',
        row,
        number: num,
        type: 'Standard',
        price: Math.round(baseStdPrice * 0.8),
        status: 'available'
      });
    }
  });

  return seats;
}

const sampleMusicals = [
  {
    title: 'Bông Bóng Bay',
    slug: 'bong-bong-bay',
    subtitle: 'Bản trường ca thanh xuân rực rỡ và những ước mơ bay bổng',
    genre: 'Broadway',
    posterUrl: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=1920&q=80',
    trailerUrl: 'https://www.youtube.com/embed/RclpGv8673s',
    duration: 120,
    ageLimit: '12+',
    director: 'NSƯT Trần Minh Đức',
    cast: [
      'Lan Phương (vai Mai Nhi)',
      'Quang Tuấn (vai Hoàng Nam)',
      'Khả Như (vai Cúc Họa Mi)',
      'Huỳnh Lập (vai Chú Hề Bong Bóng)',
      'Dàn Hợp xướng & Vũ đoàn Nhà Hát Thành Phố'
    ],
    synopsis:
      'Vở nhạc kịch "Bông Bóng Bay" là câu chuyện hoài niệm đong đầy cảm xúc về tuổi thanh xuân rực rỡ, nơi những đứa trẻ lớn lên cùng những quả bóng bay chở đầy hoài bão giữa lòng Sài Gòn. Giữa những thăng trầm của đời sống thị thành, tình bạn và lý tưởng nghệ thuật sẽ là sợi dây vô hình kết nối tâm hồn. Được dàn dựng theo tiêu chuẩn nhạc kịch đương đại quốc tế kết hợp âm hưởng giao hưởng tuyệt mỹ.',
    ticketPrices: [
      { tier: 'VIP', name: 'Hạng VIP Hoàng Gia', price: 800000, description: 'Hàng ghế A-C trung tâm, tầm nhìn cận cảnh hoàn hảo, tặng kèm đồ uống đón tiếp' },
      { tier: 'Standard', name: 'Hạng Tiêu Chuẩn', price: 450000, description: 'Hàng D-G tầng trệt & tầng lầu, âm thanh vòm tiêu chuẩn quốc tế' },
      { tier: 'Couple', name: 'Hạng Ghế Đôi Sweetbox', price: 1200000, description: 'Khu vực ghế đôi êm ái hàng H, không gian riêng tư lãng mạn' }
    ],
    featured: true,
    status: 'now_showing',
    rating: 4.9,
    reviewCount: 142
  },
  {
    title: 'Giấc Mơ Mùa Hè',
    slug: 'giac-mo-mua-he',
    subtitle: 'Bản tình ca Broadway lãng mạn và nồng nàn bậc nhất',
    genre: 'Lãng Mạn',
    posterUrl: 'https://images.unsplash.com/photo-1469488865564-c2de10f69f96?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1920&q=80',
    trailerUrl: 'https://www.youtube.com/embed/RclpGv8673s',
    duration: 135,
    ageLimit: '16+',
    director: 'Đạo diễn Nguyễn Lê Hoàng',
    cast: [
      'Hoàng Dũng (vai Nhạc sĩ Tuấn Kiệt)',
      'Bùi Lan Hương (vai Nàng Thơ Hạ Vy)',
      'Trung Quân (vai Người dẫn chuyện)',
      'Dàn nhạc Giao hưởng Sài Gòn (SPO)'
    ],
    synopsis:
      'Lấy cảm hứng từ những bản tình ca bất hủ mang phong vị Broadway cổ điển, "Giấc Mơ Mùa Hè" dẫn dắt khán giả vào chuyến hành trình tìm kiếm ánh sáng nghệ thuật và tình yêu định mệnh của đôi nghệ sĩ trẻ bên bờ biển nhiệt đới. Với hơn 20 ca khúc hòa âm phối khí bởi dàn nhạc giao hưởng trực tiếp.',
    ticketPrices: [
      { tier: 'VIP', name: 'Hạng VIP Kim Cương', price: 950000, description: 'Hàng ghế VIP danh dự, chụp ảnh lưu niệm cùng nghệ sĩ sau đêm diễn' },
      { tier: 'Standard', name: 'Hạng Tiêu Chuẩn', price: 500000, description: 'Vị trí ghế ngồi êm ái khu vực trung tâm' },
      { tier: 'Couple', name: 'Hạng Ghế Đôi Sweetbox', price: 1350000, description: 'Ghế đôi nệm nhung sang trọng' }
    ],
    featured: true,
    status: 'now_showing',
    rating: 5.0,
    reviewCount: 96
  },
  {
    title: 'Huyền Thoại Ánh Sao',
    slug: 'huyen-thoai-anh-sao',
    subtitle: 'Bản anh hùng ca viễn tưởng kết hợp múa đương đại huyền ảo',
    genre: 'Dân Gian Đương Đại',
    posterUrl: 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1920&q=80',
    trailerUrl: 'https://www.youtube.com/embed/RclpGv8673s',
    duration: 110,
    ageLimit: '8+',
    director: 'NSND Bạch Tuyết (Cố vấn) & Đạo diễn Vũ Hà',
    cast: ['Vũ Luân (vai Tướng quân Thiên Hà)', 'Tú Sương (vai Công chúa Tinh Tú)', 'Đoàn Vũ kịch Đương đại TPHCM'],
    synopsis:
      'Một tác phẩm thể nghiệm táo bạo kết hợp giữa nghệ thuật sân khấu tuồng cổ truyền thống và nhạc kịch Broadway phương Tây. Sự hội tụ của âm thanh điện tử và nhạc cụ dân tộc tạo nên không gian vũ trụ kỳ ảo và bi tráng.',
    ticketPrices: [
      { tier: 'VIP', name: 'Hạng VIP Tinh Tú', price: 750000, description: 'Trải nghiệm Hologram 3D trực tiếp' },
      { tier: 'Standard', name: 'Hạng Tiêu Chuẩn', price: 400000, description: 'Khu vực khán phòng trung tâm' },
      { tier: 'Couple', name: 'Hạng Ghế Đôi', price: 1100000, description: 'Ghế đôi dành cho cặp đôi' }
    ],
    featured: false,
    status: 'coming_soon',
    rating: 4.8,
    reviewCount: 54
  }
];

const sampleVouchers = [
  {
    code: 'SHOWMAN20',
    description: 'Giảm 20% cho đơn vé từ 800.000 VNĐ (Tối đa 250.000 VNĐ)',
    discountType: 'PERCENT',
    discountValue: 20,
    minOrderValue: 800000,
    maxDiscountAmount: 250000,
    usageLimit: 500,
    usedCount: 42,
    validUntil: new Date('2026-12-31T23:59:59Z'),
    isActive: true
  },
  {
    code: 'TRIAN10',
    description: 'Giảm 10% tri ân khán giả thân thiết nhà hát',
    discountType: 'PERCENT',
    discountValue: 10,
    minOrderValue: 400000,
    maxDiscountAmount: 150000,
    usageLimit: 1000,
    usedCount: 125,
    validUntil: new Date('2026-12-31T23:59:59Z'),
    isActive: true
  },
  {
    code: 'VIP50K',
    description: 'Giảm trực tiếp 50.000 VNĐ cho mọi đơn đặt vé',
    discountType: 'FIXED',
    discountValue: 50000,
    minOrderValue: 300000,
    usageLimit: 300,
    usedCount: 18,
    validUntil: new Date('2026-12-31T23:59:59Z'),
    isActive: true
  }
];

const sampleUsers = [
  {
    fullName: 'Trần Minh Đức (Giám đốc Điều hành)',
    email: 'admin@nhackichthanhpho.vn',
    phone: '0901888999',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
    isActive: true
  },
  {
    fullName: 'Lê Thảo My (Ban Biên Tập & Truyền Thông)',
    email: 'editor@nhackichthanhpho.vn',
    phone: '0902777888',
    role: 'editor',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    isActive: true
  },
  {
    fullName: 'Nguyễn Thị Bích Ngọc (Kế Toán Trưởng)',
    email: 'ketoan@nhackichthanhpho.vn',
    phone: '0903666777',
    role: 'accountant',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    isActive: true
  },
  {
    fullName: 'Phạm Hùng Cường (Tổ Trưởng Soát Vé)',
    email: 'soatve@nhackichthanhpho.vn',
    phone: '0904555666',
    role: 'ticket_checker',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    isActive: true
  },
  {
    fullName: 'Nguyễn Văn An (Khách Hàng Thân Thiết)',
    email: 'khachhang@gmail.com',
    phone: '0909123456',
    role: 'customer',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
    isActive: true
  }
];

const sampleArtists = [
  {
    name: 'NSND Bạch Tuyết',
    role: 'Cố vấn Nghệ thuật Cấp cao',
    title: 'Tiến sĩ Nghệ thuật học - Biểu tượng Sân khấu Việt Nam',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
    bio: 'Hơn 60 năm cống hiến cho nghệ thuật sân khấu nước nhà, người tiên phong đổi mới và đưa văn hóa Việt vươn tầm quốc tế.'
  },
  {
    name: 'NSƯT Trần Minh Đức',
    role: 'Giám đốc Nghệ thuật & Tổng Đạo diễn',
    title: 'Đạo diễn Nhạc kịch Quốc tế',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
    bio: 'Tốt nghiệp London, đạo diễn sáng tạo của "Bông Bóng Bay" và nhiều kiệt tác đương đại.'
  },
  {
    name: 'Đạo diễn Nguyễn Lê Hoàng',
    role: 'Giám đốc Âm nhạc & Dàn dựng Sân khấu',
    title: 'Nhạc sĩ / Chỉ huy Dàn nhạc',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
    bio: 'Nhạc trưởng tài hoa với phong cách hòa âm phối khí Broadway sang trọng và đầy cảm xúc.'
  },
  {
    name: 'Nghệ sĩ Lan Phương',
    role: 'Ngôi sao Sân khấu & Diễn viên chính',
    title: 'Nữ Diễn viên Nhạc kịch Hàng đầu',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    bio: 'Hóa thân trọn vẹn trong vai Mai Nhi - linh hồn xúc động của vở nhạc kịch "Bông Bóng Bay".'
  }
];

const sampleReconciliations = [
  {
    transactionId: 'TXN-VNPAY-20261101-001',
    bookingCode: 'NK-20261101-A7K9M',
    gateway: 'VNPAY',
    systemAmount: 1600000,
    gatewayAmount: 1600000,
    fee: 24000,
    netAmount: 1576000,
    status: 'MATCHED',
    notes: 'Khớp 100% đối soát tự động VNPAY'
  },
  {
    transactionId: 'TXN-MOMO-20261101-002',
    bookingCode: 'NK-20261101-B3X8L',
    gateway: 'MOMO',
    systemAmount: 950000,
    gatewayAmount: 950000,
    fee: 14250,
    netAmount: 935750,
    status: 'MATCHED',
    notes: 'Khớp đối soát MoMo Gateway'
  },
  {
    transactionId: 'TXN-VIETQR-20261101-003',
    bookingCode: 'NK-20261101-C9W2P',
    gateway: 'VIETQR',
    systemAmount: 1200000,
    gatewayAmount: 1200000,
    fee: 0,
    netAmount: 1200000,
    status: 'MATCHED',
    notes: 'Chuyển khoản VietQR 24/7 khớp hoàn toàn'
  }
];

async function seedDatabase() {
  try {
    console.log('🔄 Đang kết nối MongoDB:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Kết nối MongoDB thành công!');

    console.log('🧹 Dọn dẹp dữ liệu cũ...');
    await Musical.deleteMany({});
    await Schedule.deleteMany({});
    await Booking.deleteMany({});
    await Voucher.deleteMany({});
    await User.deleteMany({});
    await Reconciliation.deleteMany({});

    console.log('🎭 Khởi tạo Vở Nhạc Kịch...');
    const createdMusicals = await Musical.insertMany(sampleMusicals);

    console.log('🎟️ Khởi tạo Mã Giảm Giá Vouchers...');
    await Voucher.insertMany(sampleVouchers);

    console.log('👥 Khởi tạo Người Dùng & Nhân Sự RBAC...');
    await User.insertMany(sampleUsers);

    console.log('💳 Khởi tạo Dữ Liệu Đối Soát Doanh Thu...');
    await Reconciliation.insertMany(sampleReconciliations);

    console.log('📅 Khởi tạo Lịch Diễn & Sơ Đồ Ghế Ngồi Chi Tiết...');
    const schedulesToInsert = [];

    const bongBongBay = createdMusicals.find(m => m.slug === 'bong-bong-bay');
    const giacMoMuaHe = createdMusicals.find(m => m.slug === 'giac-mo-mua-he');

    if (bongBongBay) {
      schedulesToInsert.push(
        {
          musicalId: bongBongBay._id,
          musicalTitle: bongBongBay.title,
          musicalSlug: bongBongBay.slug,
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
          musicalId: bongBongBay._id,
          musicalTitle: bongBongBay.title,
          musicalSlug: bongBongBay.slug,
          performanceDate: new Date('2026-11-20T20:00:00Z'),
          time: '20:00',
          venue: 'Nhà Hát Thành Phố - Số 07 Công Trường Lam Sơn, Q.1',
          hall: 'Khán phòng Grand A',
          totalSeats: 110,
          bookedSeats: 110,
          lockedSeatsCount: 0,
          status: 'sold_out',
          seats: generateSeatLayout(800000, 450000, 1200000).map(s => ({ ...s, status: 'booked' }))
        }
      );
    }

    if (giacMoMuaHe) {
      schedulesToInsert.push({
        musicalId: giacMoMuaHe._id,
        musicalTitle: giacMoMuaHe.title,
        musicalSlug: giacMoMuaHe.slug,
        performanceDate: new Date('2026-11-18T19:30:00Z'),
        time: '19:30',
        venue: 'Nhà Hát Thành Phố - Số 07 Công Trường Lam Sơn, Q.1',
        hall: 'Khán phòng Broadway Opera',
        totalSeats: 110,
        bookedSeats: 2,
        lockedSeatsCount: 2,
        status: 'available',
        seats: generateSeatLayout(950000, 500000, 1350000)
      });
    }

    const createdSchedules = await Schedule.insertMany(schedulesToInsert);

    // Khởi tạo một số vé mẫu để test:
    // 1 vé CHƯA DÙNG (hợp lệ để nhân viên soát vé quét Check-in)
    // 1 vé ĐÃ SỬ DỤNG (để test cảnh báo trùng vé)
    // 1 vé ĐÃ HỦY (để test tính năng hoàn tiền)
    const firstSchedule = createdSchedules[0];
    const sampleBookings = [
      {
        bookingCode: 'NK-20261102-VALID',
        musicalId: firstSchedule.musicalId,
        musicalTitle: firstSchedule.musicalTitle,
        musicalSlug: firstSchedule.musicalSlug,
        scheduleId: firstSchedule._id,
        performanceDate: firstSchedule.performanceDate,
        performanceTime: firstSchedule.time,
        venue: firstSchedule.venue,
        hall: firstSchedule.hall,
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
        notes: 'Ghế VIP gần lối đi'
      },
      {
        bookingCode: 'NK-20261102-USED1',
        musicalId: firstSchedule.musicalId,
        musicalTitle: firstSchedule.musicalTitle,
        musicalSlug: firstSchedule.musicalSlug,
        scheduleId: firstSchedule._id,
        performanceDate: firstSchedule.performanceDate,
        performanceTime: firstSchedule.time,
        venue: firstSchedule.venue,
        hall: firstSchedule.hall,
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
        checkInInfo: {
          checkedInAt: new Date(),
          checkedInBy: 'Phạm Hùng Cường (Soát vé Cửa A)',
          gate: 'Cửa Chính Khán Phòng A'
        }
      },
      {
        bookingCode: 'NK-20261102-CNCLD',
        musicalId: firstSchedule.musicalId,
        musicalTitle: firstSchedule.musicalTitle,
        musicalSlug: firstSchedule.musicalSlug,
        scheduleId: firstSchedule._id,
        performanceDate: firstSchedule.performanceDate,
        performanceTime: firstSchedule.time,
        venue: firstSchedule.venue,
        hall: firstSchedule.hall,
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
          refundAmount: 405000, // Hoàn 90% theo quy định hủy trước 48h
          refundFee: 45000,
          refundReason: 'Khách bận công tác đột xuất'
        }
      }
    ];

    await Booking.insertMany(sampleBookings);
    console.log('✅ Khởi tạo toàn bộ dữ liệu mẫu thành công!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khởi tạo dữ liệu mẫu:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = {
  sampleMusicals,
  sampleVouchers,
  sampleUsers,
  sampleArtists,
  sampleReconciliations,
  generateSeatLayout
};
