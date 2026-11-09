# 🎭 NHẠC KỊCH THÀNH PHỐ (CITY MUSICAL WEBSITE)
Ứng dụng Single Page Application (SPA) hoàn chỉnh theo kiến trúc chuẩn **Angular Standalone & Node.js Express + MongoDB**.

> **✨ THE GREATEST SHOWMAN VIBE - GRAND THEATER STAGE EDITION:**
> - **Sân khấu màn nhung đỏ hoàng gia:** Background Hero Banner được thiết kế với màn che nhung đỏ rực rỡ (`Ruby Velvet Curtains`) xếp nếp uốn lượn, viền tua rua vàng óng, vén sang hai bên mở ra không gian biểu diễn tráng lệ.
> - **Các vở kịch tỏa sáng trên sân khấu:** Vở diễn tâm điểm ("Bông Bóng Bay" / "Giấc Mơ Mùa Hè") được định vị trang trọng giữa thánh đường sân khấu với bục poster 3D, kèm **Thanh chuyển nhanh vở kịch (Interactive Show Switcher)** ngay trên màn nhung.
> - **Mật độ bụi tiên dày đặc (Dense Stardust & Magic Sparkles):** 12 ngôi sao lấp lánh (✦ & ★), 14 hạt bụi tiên vàng óng trôi nổi, cùng 5 quầng mờ Bokeh ánh sáng.
> - **Ánh đèn rọi Spotlight quét chuyển động:** Cặp đèn rọi sân khấu quét luồng sáng vàng và sapphire sống động qua màn nhung.
> - **Typography 100% Montserrat:** Áp dụng phông chữ **Montserrat** toàn diện với các trọng số từ 400 đến 900 dát vàng ánh kim.

---

## 🚀 HƯỚNG DẪN KHỞI CHẠY HỆ THỐNG Ở LOCAL

### Bước 1: Khởi động Backend API Server (Node.js & MongoDB)
```powershell
cd backend
npm install
npm run seed   # (Tùy chọn) Nạp dữ liệu mẫu
npm start
```

### Bước 2: Khởi động Frontend Single Page Application (Angular)
```powershell
cd frontend
npm install
npm start
```

### Bước 3: Chiêm Ngưỡng Sân Khấu Màn Nhung Đỏ Mới
Mở trình duyệt web và truy cập địa chỉ:
- 🌐 **Trang chủ rực rỡ:** `http://localhost:4200`
- 🎭 **Chi tiết & Đặt vé "Bông Bóng Bay":** `http://localhost:4200/musical/bong-bong-bay`
- 🎭 **Chi tiết & Đặt vé "Giấc Mơ Mùa Hè":** `http://localhost:4200/musical/giac-mo-mua-he`
- 📡 **Kiểm tra API Backend:** `http://localhost:5000/api/musicals`
