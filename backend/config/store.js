/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ - BACKEND ARCHITECTURE
 * File: config/store.js
 * Chức năng: Quản lý Store đồng bộ, In-Memory fallback & State toàn hệ thống
 * ============================================================
 */

const {
  sampleMusicals,
  sampleVouchers,
  sampleUsers,
  sampleArtists,
  sampleReconciliations,
  generateSeatLayout
} = require('../seed');

let sampleMusicalsFromFile = [];
try {
  sampleMusicalsFromFile = require('../musicals.json');
} catch (e) {
  sampleMusicalsFromFile = sampleMusicals;
}

const musicalLookup = new Map(sampleMusicalsFromFile.map(m => [m.slug, m]));

const standardScheduleDefinitions = [
  // 1. Lọ Lem - Chiếc Giày Thủy Tinh (Tỷ lệ lấp đầy rạp 94.0%)
  { _id: 'sch_lo-lem_20261118_1930', slug: 'lo-lem-chiec-giay-thuy-tinh', dateStr: '2026-11-18T19:30:00+07:00', time: '19:30', hall: 'Khán phòng Grand A - Hoàng Gia', bookedSeats: 168 },
  { _id: 'sch_lo-lem-chiec-giay-thuy-tinh', slug: 'lo-lem-chiec-giay-thuy-tinh', dateStr: '2026-11-20T19:30:00+07:00', time: '19:30', hall: 'Khán phòng Grand A - Hoàng Gia', bookedSeats: 168 },
  { _id: 'sch_lo-lem_20261121_1500', slug: 'lo-lem-chiec-giay-thuy-tinh', dateStr: '2026-11-21T15:00:00+07:00', time: '15:00', hall: 'Khán phòng Grand A - Hoàng Gia', bookedSeats: 168 },
  { _id: 'sch_lo-lem_20261127_1930', slug: 'lo-lem-chiec-giay-thuy-tinh', dateStr: '2026-11-27T19:30:00+07:00', time: '19:30', hall: 'Khán phòng Grand A - Hoàng Gia', bookedSeats: 168 },
  { _id: 'sch_lo-lem_20261129_1930', slug: 'lo-lem-chiec-giay-thuy-tinh', dateStr: '2026-11-29T19:30:00+07:00', time: '19:30', hall: 'Khán phòng Grand A - Hoàng Gia', bookedSeats: 168 },

  // 2. Hồn Trương Ba, Da Hàng Thịt (Tỷ lệ lấp đầy rạp 88.5% ~ 89.0%)
  { _id: 'sch_hon-truong-ba-da-hang-thit', slug: 'hon-truong-ba-da-hang-thit', dateStr: '2026-11-23T19:30:00+07:00', time: '19:30', hall: 'Khán phòng Grand A - Hoàng Gia', bookedSeats: 158 },
  { _id: 'sch_hon-truong-ba_20261127_2000', slug: 'hon-truong-ba-da-hang-thit', dateStr: '2026-11-27T20:00:00+07:00', time: '20:00', hall: 'Khán phòng Broadway Opera', bookedSeats: 158 },
  { _id: 'sch_hon-truong-ba_20261130_2000', slug: 'hon-truong-ba-da-hang-thit', dateStr: '2026-11-30T20:00:00+07:00', time: '20:00', hall: 'Khán phòng Broadway Opera', bookedSeats: 158 },
  { _id: 'sch_hon-truong-ba_extra', slug: 'hon-truong-ba-da-hang-thit', dateStr: '2026-11-28T20:00:00+07:00', time: '20:00', hall: 'Khán phòng Grand A - Hoàng Gia', bookedSeats: 158 },

  // 3. Tuổi Thơ Dữ Dội (Tỷ lệ lấp đầy rạp 85.7% ~ 86.0%)
  { _id: 'sch_tuoi-tho-du-doi', slug: 'tuoi-tho-du-doi', dateStr: '2026-11-21T19:30:00+07:00', time: '19:30', hall: 'Khán phòng Grand A - Hoàng Gia', bookedSeats: 153 },
  { _id: 'sch_tuoi-tho-du-doi_20261126_1930', slug: 'tuoi-tho-du-doi', dateStr: '2026-11-26T19:30:00+07:00', time: '19:30', hall: 'Khán phòng Grand A - Hoàng Gia', bookedSeats: 153 },
  { _id: 'sch_tuoi-tho-du-doi_20261129_1500', slug: 'tuoi-tho-du-doi', dateStr: '2026-11-29T15:00:00+07:00', time: '15:00', hall: 'Khán phòng Grand A - Hoàng Gia', bookedSeats: 153 },
  { _id: 'sch_tuoi-tho-du-doi_extra', slug: 'tuoi-tho-du-doi', dateStr: '2026-11-30T15:00:00+07:00', time: '15:00', hall: 'Khán phòng Grand A - Hoàng Gia', bookedSeats: 153 },

  // 4. Giấc Mơ Của Bờm (Tỷ lệ lấp đầy rạp 83.0%)
  { _id: 'sch_giac-mo-cua-bom_20261120_2000', slug: 'giac-mo-cua-bom', dateStr: '2026-11-20T20:00:00+07:00', time: '20:00', hall: 'Khán phòng Broadway Opera', bookedSeats: 148 },
  { _id: 'sch_giac-mo-cua-bom_20261122_1500', slug: 'giac-mo-cua-bom', dateStr: '2026-11-22T15:00:00+07:00', time: '15:00', hall: 'Khán phòng Grand A - Hoàng Gia', bookedSeats: 148 },
  { _id: 'sch_giac-mo-cua-bom', slug: 'giac-mo-cua-bom', dateStr: '2026-11-25T19:30:00+07:00', time: '19:30', hall: 'Khán phòng Grand A - Hoàng Gia', bookedSeats: 148 },
  { _id: 'sch_giac-mo-cua-bom_20261128_1500', slug: 'giac-mo-cua-bom', dateStr: '2026-11-28T15:00:00+07:00', time: '15:00', hall: 'Khán phòng Grand A - Hoàng Gia', bookedSeats: 148 },

  // 5. Lời Thề Thứ 9 (Tỷ lệ lấp đầy rạp 79.1% ~ 79.0%)
  { _id: 'sch_loi-the-thu-9_20261119_2000', slug: 'loi-the-thu-9', dateStr: '2026-11-19T20:00:00+07:00', time: '20:00', hall: 'Khán phòng Grand A - Hoàng Gia', bookedSeats: 141 },
  { _id: 'sch_loi-the-thu-9', slug: 'loi-the-thu-9', dateStr: '2026-11-24T20:00:00+07:00', time: '20:00', hall: 'Khán phòng Grand A - Hoàng Gia', bookedSeats: 141 },
  { _id: 'sch_loi-the-thu-9_20261130_1930', slug: 'loi-the-thu-9', dateStr: '2026-11-30T19:30:00+07:00', time: '19:30', hall: 'Khán phòng Grand A - Hoàng Gia', bookedSeats: 141 },

  // 6. Quân Khu Nam Đồng (Tỷ lệ lấp đầy rạp 76.4% ~ 76.0%)
  { _id: 'sch_quan-khu-nam-dong', slug: 'quan-khu-nam-dong', dateStr: '2026-11-22T20:00:00+07:00', time: '20:00', hall: 'Khán phòng Broadway Opera', bookedSeats: 136 },
  { _id: 'sch_quan-khu-nam-dong_20261128_1930', slug: 'quan-khu-nam-dong', dateStr: '2026-11-28T19:30:00+07:00', time: '19:30', hall: 'Khán phòng Grand A - Hoàng Gia', bookedSeats: 136 }
];

const memMusicals = JSON.parse(JSON.stringify(sampleMusicalsFromFile));
const memMusicalNotificationSubscriptions = [];
const memSubscribers = [
  { _id: 'sub_001', email: 'nguyen.anhthu@gmail.com', source: 'homepage_vip', musicalTitle: '', createdAt: new Date('2026-11-15T09:30:00.000Z') },
  { _id: 'sub_002', email: 'tran.quangkhai@outlook.com', source: 'coming_soon_musical', musicalTitle: 'Chú bé người gỗ - Pinocchio', createdAt: new Date('2026-11-16T14:15:00.000Z') },
  { _id: 'sub_003', email: 'pham.minhtri@yahoo.com', source: 'homepage_vip', musicalTitle: '', createdAt: new Date('2026-11-17T08:45:00.000Z') },
  { _id: 'sub_004', email: 'hoang.yenlinh@gmail.com', source: 'coming_soon_musical', musicalTitle: 'Nơi tình yêu bắt đầu', createdAt: new Date('2026-11-17T18:20:00.000Z') },
  { _id: 'sub_005', email: 'doan.ngoctrinh@fpt.edu.vn', source: 'homepage_vip', musicalTitle: '', createdAt: new Date('2026-11-18T10:10:00.000Z') },
  { _id: 'sub_006', email: 'vu.hoangnam@gmail.com', source: 'coming_soon_musical', musicalTitle: 'Chú bé người gỗ - Pinocchio', createdAt: new Date('2026-11-18T15:40:00.000Z') }
];

let isAuditLogEnabled = true;
const memAuditLogs = [
  { _id: 'audit_001', action: 'LOGIN', category: 'AUTH', description: 'Đăng nhập phân hệ Quản trị thành công', performer: { username: 'admin', fullName: 'Trần Minh Đức', role: 'admin' }, ipAddress: '192.168.1.10', status: 'SUCCESS', metadata: { userAgent: 'Mozilla/5.0' }, createdAt: new Date(Date.now() - 4 * 3600000) },
  { _id: 'audit_002', action: 'LOCK_SEATS', category: 'SEAT', description: 'Khóa 4 ghế nội bộ hàng A (A01, A02, A13, A14) cho khách VIP', performer: { username: 'admin', fullName: 'Trần Minh Đức', role: 'admin' }, ipAddress: '192.168.1.10', status: 'SUCCESS', metadata: { hall: 'Khán Phòng Grand A', seatCount: 4, reason: 'VIP Guest' }, createdAt: new Date(Date.now() - 3 * 3600000) },
  { _id: 'audit_003', action: 'UPDATE_MUSICAL', category: 'MUSICAL', description: 'Cập nhật thông tin và trạng thái trình diễn vở "Lời thề thứ 9"', performer: { username: 'editor', fullName: 'Lê Thảo My', role: 'editor' }, ipAddress: '192.168.1.15', status: 'SUCCESS', metadata: { musicalSlug: 'loi-the-thu-9' }, createdAt: new Date(Date.now() - 2.5 * 3600000) },
  { _id: 'audit_004', action: 'UPDATE_ARTIST', category: 'ARTIST', description: 'Cập nhật hồ sơ và vở diễn tiêu biểu của NSƯT Thành Lộc', performer: { username: 'editor', fullName: 'Lê Thảo My', role: 'editor' }, ipAddress: '192.168.1.15', status: 'SUCCESS', metadata: { artistName: 'NSƯT Thành Lộc' }, createdAt: new Date(Date.now() - 2 * 3600000) },
  { _id: 'audit_005', action: 'CREATE_VOUCHER', category: 'VOUCHER', description: 'Tạo mã ưu đãi mở bán SHOWMANVIP20 giảm giá 20%', performer: { username: 'admin', fullName: 'Trần Minh Đức', role: 'admin' }, ipAddress: '192.168.1.10', status: 'SUCCESS', metadata: { voucherCode: 'SHOWMANVIP20', discount: '20%' }, createdAt: new Date(Date.now() - 1.5 * 3600000) },
  { _id: 'audit_006', action: 'CHECKIN_TICKET', category: 'OPS', description: 'Quét QR soát vé thành công tại Cổng A (Mã vé: NK-20261118-HTD4K)', performer: { username: 'staff', fullName: 'Nguyễn Văn Tuấn', role: 'staff' }, ipAddress: '192.168.1.25', status: 'SUCCESS', metadata: { ticketCode: 'NK-20261118-HTD4K' }, createdAt: new Date(Date.now() - 45 * 60000) },
  { _id: 'audit_007', action: 'LOGIN', category: 'AUTH', description: 'Đăng nhập phân hệ Quản trị thành công', performer: { username: 'admin', fullName: 'Trần Minh Đức', role: 'admin' }, ipAddress: '127.0.0.1 (Localhost)', status: 'SUCCESS', metadata: { directLogin: true }, createdAt: new Date(Date.now() - 10 * 60000) }
];

const memVouchers = JSON.parse(JSON.stringify(sampleVouchers));
const memUsers = [
  { _id: 'usr_admin_01', fullName: 'Trần Minh Đức', email: 'admin@nhackichthanhpho.vn', username: 'admin', password: 'Admin@gr06', phone: '0901888999', role: 'admin', department: 'Ban Giám Đốc Điều Hành', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80', isActive: true, createdAt: new Date() },
  { _id: 'usr_editor_02', fullName: 'Lê Thảo My', email: 'editor@nhackichthanhpho.vn', username: 'editor', password: 'Editor@gr06', phone: '0902777888', role: 'editor', department: 'Ban Biên Tập Sân Khấu & Truyền Thông', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80', isActive: true, createdAt: new Date() },
  { _id: 'usr_staff_03', fullName: 'Phạm Hùng Cường', email: 'staff@nhackichthanhpho.vn', username: 'staff', password: 'Staff@gr06', phone: '0904555666', role: 'staff', department: 'Tổ Trực Soát Vé Cửa Rạp', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80', isActive: true, createdAt: new Date() },
  { _id: 'usr_customer_01', fullName: 'Nguyễn Văn An', email: 'khachhang@gmail.com', username: 'khachhang', password: 'Customer@gr06', phone: '0909123456', role: 'customer', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80', isActive: true, createdAt: new Date() },
  { _id: 'usr_customer_02', fullName: 'Lê Hoàng Nam (Khách VIP)', email: 'vip.khachhang@gmail.com', username: 'khachhang_vip', password: 'Customer@gr06', phone: '0908888999', role: 'customer', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80', isActive: true, createdAt: new Date() }
];

const memReconciliations = JSON.parse(JSON.stringify(sampleReconciliations));

const memArtists = JSON.parse(JSON.stringify(sampleArtists));
const memAuditoriums = [
  { _id: 'AUD-01', code: 'HALL_A', name: 'Khán Phòng Grand A - Hoàng Gia', venue: 'Nhà hát Lớn Thành phố', totalCapacity: 340, floors: ['Tầng Trệt', 'Tầng Lầu'], totalRows: 14, seatsPerRow: 14, vipRows: ['A', 'B', 'C'], standardRows: ['D', 'E', 'F', 'G', 'J', 'K', 'L', 'M', 'N', 'P'], coupleRows: ['H'], aisleColumns: [4, 11], status: 'active', description: 'Khán phòng vòm acoustic gỗ sồi hoàng gia, sân khấu xoay 360 độ hiện đại.' },
  { _id: 'AUD-02', code: 'HALL_B', name: 'Khán Phòng Blackbox - Thể Nghiệm', venue: 'Nhà hát Lớn Thành phố', totalCapacity: 180, floors: ['Tầng Trệt'], totalRows: 10, seatsPerRow: 18, vipRows: ['A', 'B'], standardRows: ['C', 'D', 'E', 'F', 'G', 'H'], coupleRows: ['J'], aisleColumns: [5, 14], status: 'active', description: 'Không gian kịch đương đại thể nghiệm, ghế linh hoạt mở rộng.' },
  { _id: 'AUD-03', code: 'HALL_C', name: 'Phòng Thính Phòng Chamber', venue: 'Cơ sở 2 - Trung tâm Biểu diễn Nghệ thuật', totalCapacity: 220, floors: ['Tầng Trệt', 'Tầng Lầu'], totalRows: 11, seatsPerRow: 14, vipRows: ['A', 'B'], standardRows: ['C', 'D', 'E', 'F', 'G'], coupleRows: ['H', 'K'], aisleColumns: [4, 11], status: 'maintenance', description: 'Đang bảo dưỡng hệ thống tiêu âm và nâng cấp dàn âm thanh Dolby Atmos 7.1.4.' }
];

const memSchedules = standardScheduleDefinitions.map(def => {
  const m = musicalLookup.get(def.slug);
  const layout = generateSeatLayout(800000, 450000, 1200000, def.bookedSeats);
  return {
    _id: def._id,
    musicalId: m ? (m._id || def.slug) : def.slug,
    musicalSlug: def.slug,
    musicalTitle: m ? m.title : def.slug,
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

// Hàm khởi tạo và cân bằng chuẩn bộ dữ liệu 485 đơn hàng & 1.270 vé xem kịch (740.000.000 VNĐ)
function initGoldenBookingsAndTickets() {
  const sampleBookings = [
    {
      _id: 'bk_001',
      bookingCode: 'NK-20261115-LL82A',
      musicalSlug: 'lo-lem-chiec-giay-thuy-tinh',
      musicalTitle: 'Lọ Lem - Chiếc giày thủy tinh',
      scheduleId: 'sch_lo-lem-chiec-giay-thuy-tinh',
      performanceDate: new Date('2026-11-20T19:30:00Z'),
      performanceTime: '19:30',
      venue: 'Nhà Hát Thành Phố HCM',
      hall: 'Khán phòng Grand A - Hoàng Gia',
      customerName: 'Nguyễn Văn An',
      customerEmail: '84customer@nhackichthanhpho.vn',
      customerPhone: '0901888999',
      seats: [
        { seatCode: 'B05', floor: 'Tầng Trệt', row: 'B', number: 5, type: 'VIP', price: 800000 },
        { seatCode: 'B06', floor: 'Tầng Trệt', row: 'B', number: 6, type: 'VIP', price: 800000 }
      ],
      quantity: 2,
      subtotal: 1600000,
      voucherCode: null,
      discountAmount: 0,
      totalPrice: 1600000,
      paymentMethod: 'VIETQR',
      paymentStatus: 'PAID',
      bookingStatus: 'CONFIRMED',
      qrCodeData: JSON.stringify({ code: 'NK-20261115-LL82A', seats: 'B05, B06' }),
      checkInInfo: { checkedInAt: null, checkedInBy: null, gate: 'Cửa Chính Khán Phòng A' },
      createdAt: new Date('2026-11-15T08:19:20Z')
    },
    {
      _id: 'bk_002',
      bookingCode: 'NK-20261115-TT44B',
      musicalSlug: 'tuoi-tho-du-doi',
      musicalTitle: 'Tuổi thơ dữ dội',
      scheduleId: 'sch_tuoi-tho-du-doi',
      performanceDate: new Date('2026-11-21T19:30:00Z'),
      performanceTime: '19:30',
      venue: 'Nhà Hát Thành Phố HCM',
      hall: 'Khán phòng Grand A - Hoàng Gia',
      customerName: 'Nguyễn Văn An',
      customerEmail: '84customer@nhackichthanhpho.vn',
      customerPhone: '0901888999',
      seats: [
        { seatCode: 'A03', floor: 'Tầng Trệt', row: 'A', number: 3, type: 'VIP', price: 800000 },
        { seatCode: 'A04', floor: 'Tầng Trệt', row: 'A', number: 4, type: 'VIP', price: 800000 },
        { seatCode: 'A05', floor: 'Tầng Trệt', row: 'A', number: 5, type: 'VIP', price: 800000 }
      ],
      quantity: 3,
      subtotal: 2400000,
      voucherCode: null,
      discountAmount: 0,
      totalPrice: 2400000,
      paymentMethod: 'VNPAY',
      paymentStatus: 'PAID',
      bookingStatus: 'CHECKED_IN',
      qrCodeData: JSON.stringify({ code: 'NK-20261115-TT44B', seats: 'A03, A04, A05' }),
      checkInInfo: { checkedInAt: new Date('2026-11-15T19:15:00Z'), checkedInBy: 'Phạm Hùng Cường (Soát vé Cửa A)', gate: 'Cửa Chính' },
      createdAt: new Date('2026-11-15T08:20:45Z')
    },
    {
      _id: 'bk_003',
      bookingCode: 'NK-20261115-HT350',
      musicalSlug: 'hon-truong-ba-da-hang-thit',
      musicalTitle: 'Hồn Trương Ba, Da Hàng Thịt',
      scheduleId: 'sch_hon-truong-ba-da-hang-thit',
      performanceDate: new Date('2026-11-23T19:30:00Z'),
      performanceTime: '19:30',
      venue: 'Nhà Hát Thành Phố HCM',
      hall: 'Khán phòng Grand A - Hoàng Gia',
      customerName: 'Trần Hoàng Long',
      customerEmail: 'longth@gmail.com',
      customerPhone: '0918234567',
      seats: [
        { seatCode: 'H-CP02', floor: 'Tầng Trệt', row: 'H', number: 2, type: 'Couple', price: 1250000 }
      ],
      quantity: 1,
      subtotal: 1250000,
      voucherCode: null,
      discountAmount: 0,
      totalPrice: 1250000,
      paymentMethod: 'VIETQR',
      paymentStatus: 'PAID',
      bookingStatus: 'CONFIRMED',
      qrCodeData: JSON.stringify({ code: 'NK-20261115-HT350', seats: 'H-CP02' }),
      checkInInfo: { checkedInAt: null, checkedInBy: null, gate: 'Cửa Ghế Đôi' },
      createdAt: new Date('2026-11-15T08:25:00Z')
    },
    {
      _id: 'bk_004',
      bookingCode: 'NK-20261116-GM72F',
      musicalSlug: 'giac-mo-cua-bom',
      musicalTitle: 'Giấc mơ của Bờm',
      scheduleId: 'sch_giac-mo-cua-bom_20261120_2000',
      performanceDate: new Date('2026-11-20T20:00:00Z'),
      performanceTime: '20:00',
      venue: 'Nhà Hát Thành Phố HCM',
      hall: 'Khán phòng Broadway Opera',
      customerName: 'Lê Minh Khang',
      customerEmail: 'khangle@yahoo.com',
      customerPhone: '0908765432',
      seats: [
        { seatCode: 'D01', floor: 'Tầng Trệt', row: 'D', number: 1, type: 'Standard', price: 400000 },
        { seatCode: 'D02', floor: 'Tầng Trệt', row: 'D', number: 2, type: 'Standard', price: 400000 }
      ],
      quantity: 2,
      subtotal: 800000,
      voucherCode: null,
      discountAmount: 0,
      totalPrice: 800000,
      paymentMethod: 'VNPAY',
      paymentStatus: 'PAID',
      bookingStatus: 'CONFIRMED',
      qrCodeData: JSON.stringify({ code: 'NK-20261116-GM72F', seats: 'D01, D02' }),
      checkInInfo: { checkedInAt: null, checkedInBy: null, gate: 'Cửa Tiêu Chuẩn' },
      createdAt: new Date('2026-11-16T08:34:50Z')
    },
    {
      _id: 'bk_005',
      bookingCode: 'NK-20261116-TT38E',
      musicalSlug: 'tuoi-tho-du-doi',
      musicalTitle: 'Tuổi thơ dữ dội',
      scheduleId: 'sch_tuoi-tho-du-doi',
      performanceDate: new Date('2026-11-21T19:30:00Z'),
      performanceTime: '19:30',
      venue: 'Nhà Hát Thành Phố HCM',
      hall: 'Khán phòng Grand A - Hoàng Gia',
      customerName: 'Hoàng Kim Yến',
      customerEmail: 'yenhk@gmail.com',
      customerPhone: '0938112233',
      seats: [
        { seatCode: 'B01', floor: 'Tầng Trệt', row: 'B', number: 1, type: 'VIP', price: 800000 },
        { seatCode: 'B02', floor: 'Tầng Trệt', row: 'B', number: 2, type: 'VIP', price: 800000 },
        { seatCode: 'B03', floor: 'Tầng Trệt', row: 'B', number: 3, type: 'VIP', price: 800000 },
        { seatCode: 'B04', floor: 'Tầng Trệt', row: 'B', number: 4, type: 'VIP', price: 800000 }
      ],
      quantity: 4,
      subtotal: 3200000,
      voucherCode: null,
      discountAmount: 0,
      totalPrice: 3200000,
      paymentMethod: 'ZALOPAY',
      paymentStatus: 'PAID',
      bookingStatus: 'CHECKED_IN',
      qrCodeData: JSON.stringify({ code: 'NK-20261116-TT38E', seats: 'B01-B04' }),
      checkInInfo: { checkedInAt: new Date('2026-11-16T19:20:00Z'), checkedInBy: 'Phạm Hùng Cường (Soát vé Cửa A)', gate: 'Cửa VIP' },
      createdAt: new Date('2026-11-16T08:31:20Z')
    },
    {
      _id: 'bk_006',
      bookingCode: 'NK-20261116-TT55H',
      musicalSlug: 'tuoi-tho-du-doi',
      musicalTitle: 'Tuổi thơ dữ dội',
      scheduleId: 'sch_tuoi-tho-du-doi',
      performanceDate: new Date('2026-11-21T19:30:00Z'),
      performanceTime: '19:30',
      venue: 'Nhà Hát Thành Phố HCM',
      hall: 'Khán phòng Grand A - Hoàng Gia',
      customerName: 'Phạm Văn Hùng',
      customerEmail: 'hungpv@gmail.com',
      customerPhone: '0977889900',
      seats: [
        { seatCode: 'F01', floor: 'Tầng Trệt', row: 'F', number: 1, type: 'Standard', price: 450000 },
        { seatCode: 'F02', floor: 'Tầng Trệt', row: 'F', number: 2, type: 'Standard', price: 450000 },
        { seatCode: 'F03', floor: 'Tầng Trệt', row: 'F', number: 3, type: 'Standard', price: 450000 }
      ],
      quantity: 3,
      subtotal: 1350000,
      voucherCode: null,
      discountAmount: 0,
      totalPrice: 1350000,
      paymentMethod: 'MOMO',
      paymentStatus: 'PAID',
      bookingStatus: 'CONFIRMED',
      qrCodeData: JSON.stringify({ code: 'NK-20261116-TT55H', seats: 'F01, F02, F03' }),
      checkInInfo: { checkedInAt: null, checkedInBy: null, gate: 'Cửa Khán Đài B' },
      createdAt: new Date('2026-11-16T08:41:00Z')
    },
    {
      _id: 'bk_007',
      bookingCode: 'NK-20261117-HTD4K',
      musicalSlug: 'hon-truong-ba-da-hang-thit',
      musicalTitle: 'Hồn Trương Ba, Da Hàng Thịt',
      scheduleId: 'sch_hon-truong-ba-da-hang-thit',
      performanceDate: new Date('2026-11-23T19:30:00Z'),
      performanceTime: '19:30',
      venue: 'Nhà Hát Thành Phố HCM',
      hall: 'Khán phòng Grand A - Hoàng Gia',
      customerName: 'Võ Thị Thanh',
      customerEmail: 'thanhvo@gmail.com',
      customerPhone: '0903445566',
      seats: [
        { seatCode: 'D10', floor: 'Tầng Trệt', row: 'D', number: 10, type: 'Standard', price: 475000 },
        { seatCode: 'D11', floor: 'Tầng Trệt', row: 'D', number: 11, type: 'Standard', price: 475000 }
      ],
      quantity: 2,
      subtotal: 950000,
      voucherCode: null,
      discountAmount: 0,
      totalPrice: 950000,
      paymentMethod: 'ZALOPAY',
      paymentStatus: 'PAID',
      bookingStatus: 'CHECKED_IN',
      qrCodeData: JSON.stringify({ code: 'NK-20261117-HTD4K', seats: 'D10, D11' }),
      checkInInfo: { checkedInAt: new Date('2026-11-17T19:10:00Z'), checkedInBy: 'Nguyễn Văn Tuấn (Soát vé Cửa B)', gate: 'Cửa Tiêu Chuẩn' },
      createdAt: new Date('2026-11-17T08:50:00Z')
    },
    {
      _id: 'bk_008',
      bookingCode: 'NK-20261117-LT12L',
      musicalSlug: 'loi-the-thu-9',
      musicalTitle: 'Lời thề thứ 9',
      scheduleId: 'sch_loi-the-thu-9',
      performanceDate: new Date('2026-11-24T20:00:00Z'),
      performanceTime: '20:00',
      venue: 'Nhà Hát Thành Phố HCM',
      hall: 'Khán phòng Grand A - Hoàng Gia',
      customerName: 'Đặng Quốc Huy',
      customerEmail: 'huydq@gmail.com',
      customerPhone: '0988112244',
      seats: [
        { seatCode: 'A09', floor: 'Tầng Trệt', row: 'A', number: 9, type: 'VIP', price: 800000 },
        { seatCode: 'A10', floor: 'Tầng Trệt', row: 'A', number: 10, type: 'VIP', price: 800000 }
      ],
      quantity: 2,
      subtotal: 1600000,
      voucherCode: null,
      discountAmount: 0,
      totalPrice: 1600000,
      paymentMethod: 'VNPAY',
      paymentStatus: 'PAID',
      bookingStatus: 'CONFIRMED',
      qrCodeData: JSON.stringify({ code: 'NK-20261117-LT12L', seats: 'A09, A10' }),
      checkInInfo: { checkedInAt: null, checkedInBy: null, gate: 'Cửa VIP' },
      createdAt: new Date('2026-11-17T08:53:30Z')
    },
    {
      _id: 'bk_009',
      bookingCode: 'NK-20261117-LL11N',
      musicalSlug: 'lo-lem-chiec-giay-thuy-tinh',
      musicalTitle: 'Lọ Lem - Chiếc giày thủy tinh',
      scheduleId: 'sch_lo-lem-chiec-giay-thuy-tinh',
      performanceDate: new Date('2026-11-20T19:30:00Z'),
      performanceTime: '19:30',
      venue: 'Nhà Hát Thành Phố HCM',
      hall: 'Khán phòng Grand A - Hoàng Gia',
      customerName: 'Bùi Lan Phương',
      customerEmail: 'phuongbl@gmail.com',
      customerPhone: '0933556677',
      seats: [
        { seatCode: 'E09', floor: 'Tầng Trệt', row: 'E', number: 9, type: 'Standard', price: 400000 },
        { seatCode: 'E10', floor: 'Tầng Trệt', row: 'E', number: 10, type: 'Standard', price: 400000 }
      ],
      quantity: 2,
      subtotal: 800000,
      voucherCode: null,
      discountAmount: 0,
      totalPrice: 800000,
      paymentMethod: 'MOMO',
      paymentStatus: 'PAID',
      bookingStatus: 'CONFIRMED',
      qrCodeData: JSON.stringify({ code: 'NK-20261117-LL11N', seats: 'E09, E10' }),
      checkInInfo: { checkedInAt: null, checkedInBy: null, gate: 'Cửa Tiêu Chuẩn' },
      createdAt: new Date('2026-11-17T08:58:00Z')
    },
    {
      _id: 'bk_010',
      bookingCode: 'NK-20261117-QK61Q',
      musicalSlug: 'quan-khu-nam-dong',
      musicalTitle: 'Quân khu Nam Đồng',
      scheduleId: 'sch_quan-khu-nam-dong',
      performanceDate: new Date('2026-11-22T20:00:00Z'),
      performanceTime: '20:00',
      venue: 'Nhà Hát Thành Phố HCM',
      hall: 'Khán phòng Broadway Opera',
      customerName: 'Ngô Kiến Huy',
      customerEmail: 'huyngo@gmail.com',
      customerPhone: '0912334455',
      seats: [
        { seatCode: 'H-CP03', floor: 'Tầng Trệt', row: 'H', number: 3, type: 'Couple', price: 1200000 }
      ],
      quantity: 1,
      subtotal: 1200000,
      voucherCode: null,
      discountAmount: 0,
      totalPrice: 1200000,
      paymentMethod: 'VIETQR',
      paymentStatus: 'PAID',
      bookingStatus: 'CONFIRMED',
      qrCodeData: JSON.stringify({ code: 'NK-20261117-QK61Q', seats: 'H-CP03' }),
      checkInInfo: { checkedInAt: null, checkedInBy: null, gate: 'Cửa Ghế Đôi' },
      createdAt: new Date('2026-11-17T08:59:50Z')
    }
  ];

  const targetGateways = {
    VIETQR: 325600000,
    VNPAY: 229400000,
    MOMO: 125800000,
    ZALOPAY: 59200000
  };

  const targetMusicals = [
    { slug: 'lo-lem-chiec-giay-thuy-tinh', title: 'Lọ Lem - Chiếc giày thủy tinh', revenue: 168500000, tickets: 286, orders: 110 },
    { slug: 'hon-truong-ba-da-hang-thit', title: 'Hồn Trương Ba, Da Hàng Thịt', revenue: 142800000, tickets: 242, orders: 93 },
    { slug: 'tuoi-tho-du-doi', title: 'Tuổi thơ dữ dội', revenue: 126500000, tickets: 215, orders: 82 },
    { slug: 'giac-mo-cua-bom', title: 'Giấc mơ của Bờm', revenue: 118400000, tickets: 198, orders: 78 },
    { slug: 'loi-the-thu-9', title: 'Lời thề thứ 9', revenue: 98600000, tickets: 175, orders: 67 },
    { slug: 'quan-khu-nam-dong', title: 'Quân khu Nam Đồng', revenue: 85200000, tickets: 154, orders: 55 }
  ];

  const gwKeys = ['VIETQR', 'VNPAY', 'MOMO', 'ZALOPAY'];
  const revMatrix = [];
  targetMusicals.forEach((m, mIdx) => {
    const row = [];
    let rowSum = 0;
    gwKeys.forEach((gw, gIdx) => {
      let cell = (gIdx < 3) ? Math.round(m.revenue * (targetGateways[gw] / 740000000) / 10000) * 10000 : (m.revenue - rowSum);
      rowSum += cell;
      row.push(cell);
    });
    revMatrix.push(row);
  });
  revMatrix[5][1] -= 10000;
  revMatrix[5][2] -= 10000;
  revMatrix[5][3] += 20000;

  sampleBookings.forEach(b => {
    const mIdx = targetMusicals.findIndex(m => m.slug === b.musicalSlug);
    const gIdx = gwKeys.indexOf(b.paymentMethod);
    if (mIdx >= 0 && gIdx >= 0) {
      revMatrix[mIdx][gIdx] -= b.totalPrice;
    }
  });

  const ordersMatrix = [];
  targetMusicals.forEach((m) => {
    const currSamples = sampleBookings.filter(b => b.musicalSlug === m.slug).length;
    let mRemOrders = m.orders - currSamples;
    const row = [];
    gwKeys.forEach((gw, gIdx) => {
      let cell = (gIdx < 3) ? Math.round(mRemOrders * (targetGateways[gw] / 740000000)) : mRemOrders;
      mRemOrders -= cell;
      row.push(cell);
    });
    ordersMatrix.push(row);
  });

  const ticketsMatrix = [];
  targetMusicals.forEach((m) => {
    const currTix = sampleBookings.filter(b => b.musicalSlug === m.slug).reduce((s, b) => s + b.quantity, 0);
    let mRemTix = m.tickets - currTix;
    const row = [];
    gwKeys.forEach((gw, gIdx) => {
      let cell = (gIdx < 3) ? Math.round(mRemTix * (targetGateways[gw] / 740000000)) : mRemTix;
      mRemTix -= cell;
      row.push(cell);
    });
    ticketsMatrix.push(row);
  });

  const allBookings = [...sampleBookings];
  const allTickets = [];

  sampleBookings.forEach(b => {
    b.seats.forEach((s, idx) => {
      allTickets.push({
        _id: 'tk_' + b._id + '_' + (idx + 1),
        ticketCode: 'TK-' + b.bookingCode.slice(3) + '-' + s.seatCode,
        bookingCode: b.bookingCode,
        bookingId: b._id,
        musicalTitle: b.musicalTitle,
        musicalSlug: b.musicalSlug,
        scheduleId: b.scheduleId,
        performanceDate: b.performanceDate,
        performanceTime: b.performanceTime,
        hall: b.hall,
        seatCode: s.seatCode,
        floor: s.floor,
        row: s.row,
        number: s.number,
        seatType: s.type,
        price: s.price,
        customerName: b.customerName,
        customerEmail: b.customerEmail,
        customerPhone: b.customerPhone,
        paymentMethod: b.paymentMethod,
        status: b.bookingStatus === 'CHECKED_IN' ? 'USED' : 'VALID'
      });
    });
  });

  let bId = 11;
  const custNames = ['Trần Bảo Nam', 'Phạm Thùy Linh', 'Vũ Quốc Anh', 'Đoàn Mai Chi', 'Hoàng Nhật Minh', 'Lê Hải Yến', 'Nguyễn Gia Huy', 'Dương Thúy Quỳnh', 'Bùi Đức Anh', 'Đỗ Phương Thảo'];

  targetMusicals.forEach((m, mIdx) => {
    gwKeys.forEach((gw, gIdx) => {
      const ordersCount = ordersMatrix[mIdx][gIdx];
      let remainingRev = revMatrix[mIdx][gIdx];
      let remainingTix = ticketsMatrix[mIdx][gIdx];

      for (let i = 0; i < ordersCount; i++) {
        const isLast = (i === ordersCount - 1);
        const tix = isLast ? remainingTix : Math.max(1, Math.min(remainingTix - (ordersCount - 1 - i), Math.round(remainingTix / (ordersCount - i))));
        remainingTix -= tix;

        const price = isLast ? remainingRev : Math.round(remainingRev / (ordersCount - i) / 10000) * 10000;
        remainingRev -= price;

        const cust = custNames[(bId + i) % custNames.length];
        const day = 15 + ((bId + i) % 5);
        const bCode = 'NK-202611' + day + '-' + m.slug.substring(0, 2).toUpperCase() + (100 + bId);

        const seats = [];
        for (let sIdx = 1; sIdx <= tix; sIdx++) {
          const row = String.fromCharCode(65 + ((bId + sIdx) % 10));
          const num = 1 + ((bId * 3 + sIdx) % 12);
          const sCode = row + (num < 10 ? '0' + num : num);
          const sPrice = Math.round(price / tix);
          seats.push({
            seatCode: sCode,
            floor: 'Tầng Trệt',
            row,
            number: num,
            type: row <= 'C' ? 'VIP' : 'Standard',
            price: sPrice
          });

          allTickets.push({
            _id: 'tk_' + bId + '_' + sIdx,
            ticketCode: 'TK-202611' + day + '-' + (10000 + bId * 10 + sIdx),
            bookingCode: bCode,
            bookingId: 'bk_' + bId,
            musicalTitle: m.title,
            musicalSlug: m.slug,
            scheduleId: 'sch_' + m.slug,
            performanceDate: new Date('2026-11-' + day + 'T19:30:00Z'),
            performanceTime: '19:30',
            hall: 'Khán phòng Grand A - Hoàng Gia',
            seatCode: sCode,
            floor: 'Tầng Trệt',
            row,
            number: num,
            seatType: row <= 'C' ? 'VIP' : 'Standard',
            price: sPrice,
            customerName: cust,
            customerEmail: 'khachhang_' + bId + '@nhackichthanhpho.vn',
            customerPhone: '090' + (1000000 + bId),
            paymentMethod: gw,
            status: (bId % 4 === 0) ? 'USED' : 'VALID'
          });
        }

        allBookings.push({
          _id: 'bk_' + (bId < 100 ? (bId < 10 ? '00' + bId : '0' + bId) : bId),
          bookingCode: bCode,
          musicalSlug: m.slug,
          musicalTitle: m.title,
          scheduleId: 'sch_' + m.slug,
          performanceDate: new Date('2026-11-' + day + 'T19:30:00Z'),
          performanceTime: '19:30',
          venue: 'Nhà Hát Thành Phố HCM',
          hall: 'Khán phòng Grand A - Hoàng Gia',
          customerName: cust,
          customerEmail: 'khachhang_' + bId + '@nhackichthanhpho.vn',
          customerPhone: '090' + (1000000 + bId),
          seats,
          quantity: tix,
          subtotal: price,
          voucherCode: null,
          discountAmount: 0,
          totalPrice: price,
          paymentMethod: gw,
          paymentStatus: 'PAID',
          bookingStatus: (bId % 4 === 0) ? 'CHECKED_IN' : 'CONFIRMED',
          createdAt: new Date('2026-11-' + day + 'T10:00:00Z')
        });
        bId++;
      }
    });
  });

  return { bookings: allBookings, tickets: allTickets };
}

const { bookings: memBookings, tickets: memTickets } = initGoldenBookingsAndTickets();

// Định kỳ quét giải phóng các ghế giữ tạm (Temporary Hold) đã hết hạn 8 phút
const holdCleanupTimer = setInterval(() => {
  const now = new Date();
  memSchedules.forEach(schedule => {
    if (schedule.seats && Array.isArray(schedule.seats)) {
      schedule.seats.forEach(seat => {
        if (seat.status === 'holding' && seat.holdingExpiresAt && new Date(seat.holdingExpiresAt) < now) {
          seat.status = 'available';
          seat.holdingSessionId = null;
          seat.holdingExpiresAt = null;
        }
      });
    }
  });
}, 15000);
if (holdCleanupTimer.unref) holdCleanupTimer.unref();

const store = {
  isMongoConnected: false,
  isAuditLogEnabled,
  memMusicals,
  memMusicalNotificationSubscriptions,
  memSubscribers,
  memAuditLogs,
  memVouchers,
  memUsers,
  memReconciliations,
  memArtists,
  memAuditoriums,
  standardScheduleDefinitions,
  memSchedules,
  memBookings,
  memTickets,

  logAudit: async (req, { action, category = 'SYSTEM', description, performer, status = 'SUCCESS', metadata = {} }) => {
    if (!store.isAuditLogEnabled && action !== 'TOGGLE_AUDIT_LOG') {
      return null;
    }
    const rawIp = (req && req.headers && req.headers['x-forwarded-for']) || (req && req.socket && req.socket.remoteAddress) || (req && req.ip) || '127.0.0.1';
    let cleanIp = String(rawIp).replace(/^::ffff:/, '').trim();
    if (cleanIp === '::1' || cleanIp === '127.0.0.1') {
      cleanIp = '127.0.0.1 (Localhost)';
    }
    const user = performer || (req && req.user) || { username: 'admin', fullName: 'Trần Minh Đức', role: 'admin' };
    const entry = {
      action: String(action || 'UNKNOWN').toUpperCase(),
      category: String(category || 'SYSTEM').toUpperCase(),
      description: String(description || ''),
      performer: {
        username: user.username || 'admin',
        fullName: user.fullName || user.username || 'Quản Trị Viên',
        role: user.role || 'admin'
      },
      ipAddress: cleanIp,
      status: String(status || 'SUCCESS').toUpperCase(),
      metadata: metadata || {},
      createdAt: new Date()
    };

    if (store.isMongoConnected) {
      try {
        const AuditLog = require('../models/audit-log.model');
        await AuditLog.create(entry);
      } catch (e) {
        console.warn('⚠️ Lỗi lưu AuditLog vào MongoDB:', e.message);
      }
    }

    const inMemoryEntry = {
      _id: 'audit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      ...entry
    };
    store.memAuditLogs.unshift(inMemoryEntry);
    if (store.memAuditLogs.length > 500) store.memAuditLogs.pop();
    return inMemoryEntry;
  }
};

module.exports = store;
