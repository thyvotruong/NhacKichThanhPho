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

// Hàm sinh sơ đồ ghế ngồi chi tiết chuẩn hóa khớp 100% giữa Admin & Client
function generateSeatLayout(baseVipPrice = 800000, baseStdPrice = 450000, baseCouplePrice = 1200000) {
  const seats = [];

  // ==========================================
  // 1. TẦNG TRỆT (STALLS): Hàng A -> H
  // ==========================================

  // Hàng A, B, C: VIP (12 ghế / hàng: 01 - 12)
  ['A', 'B', 'C'].forEach(row => {
    for (let num = 1; num <= 12; num++) {
      const code = `${row}${num < 10 ? '0' + num : num}`;
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

  // Hàng D, E, F, G: Standard / Thường (14 ghế / hàng: 01 - 14)
  ['D', 'E', 'F', 'G'].forEach(row => {
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

  // Hàng H: Ghế Đôi (Couple Sweetbox) (6 ghế đôi: H-CP01 - H-CP06)
  for (let num = 1; num <= 6; num++) {
    const code = `H-CP0${num}`;
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

  // ==========================================
  // 2. TẦNG LẦU (BALCONY): Hàng J -> P
  // ==========================================

  // Hàng J, K, L, M, N, P: Standard / Thường (14 ghế / hàng: 01 - 14)
  ['J', 'K', 'L', 'M', 'N', 'P'].forEach(row => {
    for (let num = 1; num <= 14; num++) {
      const code = `${row}${num < 10 ? '0' + num : num}`;
      seats.push({
        seatCode: code,
        floor: 'Tầng Lầu',
        row,
        number: num,
        type: 'Standard',
        price: baseStdPrice, // Chuẩn cố định 450,000 đ
        status: 'available'
      });
    }
  });

  return seats;
}

const sampleMusicals = require('./musicals.json');

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
    fullName: 'Trần Minh Đức',
    email: 'admin@nhackichthanhpho.vn',
    phone: '0901888999',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
    isActive: true
  },
  {
    fullName: 'Lê Thảo My',
    email: 'editor@nhackichthanhpho.vn',
    phone: '0902777888',
    role: 'editor',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    isActive: true
  },
  {
    fullName: 'Phạm Hùng Cường',
    email: 'soatve@nhackichthanhpho.vn',
    phone: '0904555666',
    role: 'ticket_checker',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    isActive: true
  },
  {
    fullName: 'Nguyễn Văn An',
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
    bio: 'Tốt nghiệp London, đạo diễn sáng tạo của "Lọ Lem - Chiếc giày thủy tinh", "Lời thề thứ 9" và nhiều kiệt tác đương đại.'
  },
  {
    name: 'Đạo diễn Nguyễn Lê Hoàng',
    role: 'Giám đốc Âm nhạc & Dàn dựng Sân khấu',
    title: 'Nhạc sĩ / Chỉ huy Dàn nhạc',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
    bio: 'Nhạc trưởng tài hoa với phong cách hòa âm phối khí Broadway sang trọng và đầy cảm xúc cho dàn nhạc giao hưởng.'
  },
  {
    name: 'Nghệ sĩ Lan Phương',
    role: 'Ngôi sao Sân khấu & Diễn viên chính',
    title: 'Nữ Diễn viên Nhạc kịch Hàng đầu',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    bio: 'Hóa thân trọn vẹn trong các vai diễn kinh điển, biểu tượng diễn xuất cảm xúc tại Nhà Hát Thành Phố.'
  }
];

const sampleReconciliations = [
  {
    transactionId: 'TXN-VIETQR-20261115-08192',
    bookingCode: 'NK-20261115-LL82A',
    gateway: 'VIETQR',
    systemAmount: 1600000,
    gatewayAmount: 1600000,
    fee: 0,
    netAmount: 1600000,
    status: 'MATCHED',
    notes: 'Khớp 100% đối soát tự động Napas 24/7'
  },
  {
    transactionId: 'TXN-VNPAY-20261115-08204',
    bookingCode: 'NK-20261115-TT44B',
    gateway: 'VNPAY',
    systemAmount: 2400000,
    gatewayAmount: 2400000,
    fee: 36000,
    netAmount: 2364000,
    status: 'MATCHED',
    notes: 'Khớp đối soát tự động VNPAY QR'
  },
  {
    transactionId: 'TXN-MOMO-20261115-08221',
    bookingCode: 'NK-20261115-QK91C',
    gateway: 'MOMO',
    systemAmount: 900000,
    gatewayAmount: 900000,
    fee: 13500,
    netAmount: 886500,
    status: 'MATCHED',
    notes: 'Khớp đối soát ví điện tử MoMo'
  },
  {
    transactionId: 'TXN-VIETQR-20261115-08250',
    bookingCode: 'NK-20261115-HT19D',
    gateway: 'VIETQR',
    systemAmount: 1250000,
    gatewayAmount: 1250000,
    fee: 0,
    netAmount: 1250000,
    status: 'MATCHED',
    notes: 'Khớp 100% VietQR tức thì'
  },
  {
    transactionId: 'TXN-BANK-20261116-08312',
    bookingCode: 'NK-20261116-LT38E',
    gateway: 'BANK_CARD',
    systemAmount: 3200000,
    gatewayAmount: 3200000,
    fee: 64000,
    netAmount: 3136000,
    status: 'MATCHED',
    notes: 'Khớp cổng thẻ quốc tế Visa 3D-Secure'
  },
  {
    transactionId: 'TXN-VNPAY-20261116-08345',
    bookingCode: 'NK-20261116-GM72F',
    gateway: 'VNPAY',
    systemAmount: 800000,
    gatewayAmount: 800000,
    fee: 12000,
    netAmount: 788000,
    status: 'MATCHED',
    notes: 'Khớp đối soát VNPAY Gateway'
  },
  {
    transactionId: 'TXN-VIETQR-20261116-08389',
    bookingCode: 'NK-20261116-LL63G',
    gateway: 'VIETQR',
    systemAmount: 2000000,
    gatewayAmount: 2000000,
    fee: 0,
    netAmount: 2000000,
    status: 'MATCHED',
    notes: 'Khớp chuyển khoản nhanh VietQR Napas'
  },
  {
    transactionId: 'TXN-MOMO-20261116-08410',
    bookingCode: 'NK-20261116-TT55H',
    gateway: 'MOMO',
    systemAmount: 1350000,
    gatewayAmount: 1350000,
    fee: 20250,
    netAmount: 1329750,
    status: 'MATCHED',
    notes: 'Khớp đối soát MoMo QR Gateway'
  },
  {
    transactionId: 'TXN-VIETQR-20261116-08455',
    bookingCode: 'NK-20261116-QK27J',
    gateway: 'VIETQR',
    systemAmount: 1600000,
    gatewayAmount: 1600000,
    fee: 0,
    netAmount: 1600000,
    status: 'MATCHED',
    notes: 'Khớp giao dịch Napas VietQR 24/7'
  },
  {
    transactionId: 'TXN-ZALO-20261117-08502',
    bookingCode: 'NK-20261117-HT84K',
    gateway: 'ZALOPAY',
    systemAmount: 950000,
    gatewayAmount: 950000,
    fee: 14250,
    netAmount: 935750,
    status: 'MATCHED',
    notes: 'Khớp đối soát ví điện tử ZaloPay'
  },
  {
    transactionId: 'TXN-VNPAY-20261117-08533',
    bookingCode: 'NK-20261117-LT12L',
    gateway: 'VNPAY',
    systemAmount: 1600000,
    gatewayAmount: 1600000,
    fee: 24000,
    netAmount: 1576000,
    status: 'MATCHED',
    notes: 'Khớp 100% đối soát định kỳ VNPAY'
  },
  {
    transactionId: 'TXN-VIETQR-20261117-08571',
    bookingCode: 'NK-20261117-GM90M',
    gateway: 'VIETQR',
    systemAmount: 2400000,
    gatewayAmount: 2400000,
    fee: 0,
    netAmount: 2400000,
    status: 'MATCHED',
    notes: 'Khớp lệnh VietQR chuyển khoản liên ngân hàng'
  },
  {
    transactionId: 'TXN-MOMO-20261117-08604',
    bookingCode: 'NK-20261117-LL18N',
    gateway: 'MOMO',
    systemAmount: 800000,
    gatewayAmount: 800000,
    fee: 12000,
    netAmount: 788000,
    status: 'MATCHED',
    notes: 'Khớp đối soát giao dịch MoMo 1 chạm'
  },
  {
    transactionId: 'TXN-BANK-20261117-08640',
    bookingCode: 'NK-20261117-TT73P',
    gateway: 'BANK_CARD',
    systemAmount: 1800000,
    gatewayAmount: 1800000,
    fee: 36000,
    netAmount: 1764000,
    status: 'MATCHED',
    notes: 'Khớp cổng Visa/Mastercard quốc tế'
  },
  {
    transactionId: 'TXN-VIETQR-20261117-08695',
    bookingCode: 'NK-20261117-QK61Q',
    gateway: 'VIETQR',
    systemAmount: 1200000,
    gatewayAmount: 1200000,
    fee: 0,
    netAmount: 1200000,
    status: 'MATCHED',
    notes: 'Khớp 100% chuyển khoản tức thì VietQR'
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

    console.log('📅 Khởi tạo Lịch Diễn & Sơ Đồ Ghế Ngồi Chi Tiết (20 suất diễn từ 18/11 đến 30/11/2026)...');
    const standardScheduleDefinitions = [
      {
        _id: 'sch_lo-lem_20261118_1930',
        slug: 'lo-lem-chiec-giay-thuy-tinh',
        dateStr: '2026-11-18T19:30:00+07:00',
        time: '19:30',
        hall: 'Khán phòng Grand A - Hoàng Gia',
        bookedSeats: 32
      },
      {
        _id: 'sch_loi-the-thu-9_20261119_2000',
        slug: 'loi-the-thu-9',
        dateStr: '2026-11-19T20:00:00+07:00',
        time: '20:00',
        hall: 'Khán phòng Grand A - Hoàng Gia',
        bookedSeats: 45
      },
      {
        _id: 'sch_lo-lem-chiec-giay-thuy-tinh',
        slug: 'lo-lem-chiec-giay-thuy-tinh',
        dateStr: '2026-11-20T19:30:00+07:00',
        time: '19:30',
        hall: 'Khán phòng Grand A - Hoàng Gia',
        bookedSeats: 62
      },
      {
        _id: 'sch_giac-mo-cua-bom_20261120_2000',
        slug: 'giac-mo-cua-bom',
        dateStr: '2026-11-20T20:00:00+07:00',
        time: '20:00',
        hall: 'Khán phòng Broadway Opera',
        bookedSeats: 40
      },
      {
        _id: 'sch_lo-lem_20261121_1500',
        slug: 'lo-lem-chiec-giay-thuy-tinh',
        dateStr: '2026-11-21T15:00:00+07:00',
        time: '15:00',
        hall: 'Khán phòng Grand A - Hoàng Gia',
        bookedSeats: 58
      },
      {
        _id: 'sch_tuoi-tho-du-doi',
        slug: 'tuoi-tho-du-doi',
        dateStr: '2026-11-21T19:30:00+07:00',
        time: '19:30',
        hall: 'Khán phòng Grand A - Hoàng Gia',
        bookedSeats: 70
      },
      {
        _id: 'sch_giac-mo-cua-bom_20261122_1500',
        slug: 'giac-mo-cua-bom',
        dateStr: '2026-11-22T15:00:00+07:00',
        time: '15:00',
        hall: 'Khán phòng Grand A - Hoàng Gia',
        bookedSeats: 55
      },
      {
        _id: 'sch_quan-khu-nam-dong',
        slug: 'quan-khu-nam-dong',
        dateStr: '2026-11-22T20:00:00+07:00',
        time: '20:00',
        hall: 'Khán phòng Broadway Opera',
        bookedSeats: 48
      },
      {
        _id: 'sch_hon-truong-ba-da-hang-thit',
        slug: 'hon-truong-ba-da-hang-thit',
        dateStr: '2026-11-23T19:30:00+07:00',
        time: '19:30',
        hall: 'Khán phòng Grand A - Hoàng Gia',
        bookedSeats: 64
      },
      {
        _id: 'sch_loi-the-thu-9',
        slug: 'loi-the-thu-9',
        dateStr: '2026-11-24T20:00:00+07:00',
        time: '20:00',
        hall: 'Khán phòng Grand A - Hoàng Gia',
        bookedSeats: 52
      },
      {
        _id: 'sch_giac-mo-cua-bom',
        slug: 'giac-mo-cua-bom',
        dateStr: '2026-11-25T19:30:00+07:00',
        time: '19:30',
        hall: 'Khán phòng Grand A - Hoàng Gia',
        bookedSeats: 42
      },
      {
        _id: 'sch_tuoi-tho-du-doi_20261126_1930',
        slug: 'tuoi-tho-du-doi',
        dateStr: '2026-11-26T19:30:00+07:00',
        time: '19:30',
        hall: 'Khán phòng Grand A - Hoàng Gia',
        bookedSeats: 50
      },
      {
        _id: 'sch_lo-lem_20261127_1930',
        slug: 'lo-lem-chiec-giay-thuy-tinh',
        dateStr: '2026-11-27T19:30:00+07:00',
        time: '19:30',
        hall: 'Khán phòng Grand A - Hoàng Gia',
        bookedSeats: 66
      },
      {
        _id: 'sch_hon-truong-ba_20261127_2000',
        slug: 'hon-truong-ba-da-hang-thit',
        dateStr: '2026-11-27T20:00:00+07:00',
        time: '20:00',
        hall: 'Khán phòng Broadway Opera',
        bookedSeats: 54
      },
      {
        _id: 'sch_giac-mo-cua-bom_20261128_1500',
        slug: 'giac-mo-cua-bom',
        dateStr: '2026-11-28T15:00:00+07:00',
        time: '15:00',
        hall: 'Khán phòng Grand A - Hoàng Gia',
        bookedSeats: 48
      },
      {
        _id: 'sch_quan-khu-nam-dong_20261128_1930',
        slug: 'quan-khu-nam-dong',
        dateStr: '2026-11-28T19:30:00+07:00',
        time: '19:30',
        hall: 'Khán phòng Grand A - Hoàng Gia',
        bookedSeats: 60
      },
      {
        _id: 'sch_tuoi-tho-du-doi_20261129_1500',
        slug: 'tuoi-tho-du-doi',
        dateStr: '2026-11-29T15:00:00+07:00',
        time: '15:00',
        hall: 'Khán phòng Grand A - Hoàng Gia',
        bookedSeats: 58
      },
      {
        _id: 'sch_lo-lem_20261129_1930',
        slug: 'lo-lem-chiec-giay-thuy-tinh',
        dateStr: '2026-11-29T19:30:00+07:00',
        time: '19:30',
        hall: 'Khán phòng Grand A - Hoàng Gia',
        bookedSeats: 72
      },
      {
        _id: 'sch_loi-the-thu-9_20261130_1930',
        slug: 'loi-the-thu-9',
        dateStr: '2026-11-30T19:30:00+07:00',
        time: '19:30',
        hall: 'Khán phòng Grand A - Hoàng Gia',
        bookedSeats: 85
      },
      {
        _id: 'sch_hon-truong-ba_20261130_2000',
        slug: 'hon-truong-ba-da-hang-thit',
        dateStr: '2026-11-30T20:00:00+07:00',
        time: '20:00',
        hall: 'Khán phòng Broadway Opera',
        bookedSeats: 80
      }
    ];

    const musicalMap = new Map(createdMusicals.map(m => [m.slug, m]));
    const schedulesToInsert = standardScheduleDefinitions.map(def => {
      const m = musicalMap.get(def.slug);
      const layout = generateSeatLayout(800000, 450000, 1200000);
      return {
        _id: def._id,
        musicalId: m ? m._id : def.slug,
        musicalTitle: m ? m.title : def.slug,
        musicalSlug: def.slug,
        genre: m ? (Array.isArray(m.genre) ? m.genre.join(' • ') : m.genre) : '',
        posterUrl: m ? m.posterUrl : `/images/musicals/${def.slug.replace(/-/g, '_')}.jpg`,
        subtitle: m ? (m.subtitle || m.synopsis) : '',
        performanceDate: new Date(def.dateStr),
        time: def.time,
        venue: 'Nhà Hát Thành Phố - Số 07 Công Trường Lam Sơn, Q.1',
        hall: def.hall,
        totalSeats: layout.length,
        bookedSeats: def.bookedSeats,
        lockedSeatsCount: 3,
        status: 'available',
        seats: layout
      };
    });

    const createdSchedules = await Schedule.insertMany(schedulesToInsert);

    // Khởi tạo một số vé mẫu để test:
    // 1 vé CHƯA DÙNG (hợp lệ để nhân viên soát vé quét Check-in)
    // 1 vé ĐÃ SỬ DỤNG (để test cảnh báo trùng vé)
    // Sample bookings for active and checked-in tickets.
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
