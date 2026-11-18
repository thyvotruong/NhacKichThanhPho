/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ - BACKEND ARCHITECTURE
 * File: services/ticket.service.js
 * Model: Ticket (Collection: tickets)
 * Chức năng: Thao tác Truy vấn Vé, Đối soát Vé Check-in QR & Thống kê Vé
 * ============================================================
 */

const Ticket = require('../models/ticket.model');
const store = require('../config/store');

class TicketService {
  async getTickets(filters = {}) {
    if (store.isMongoConnected) {
      try {
        const query = {};
        if (filters.bookingCode) query.bookingCode = filters.bookingCode;
        if (filters.status) query.status = filters.status;
        if (filters.musicalSlug) query.musicalSlug = filters.musicalSlug;
        return await Ticket.find(query).sort({ createdAt: -1 });
      } catch (e) {
        console.warn('⚠️ Lỗi truy vấn Ticket từ MongoDB:', e.message);
      }
    }
    return store.memTickets || [];
  }

  async getTicketByCode(ticketCode) {
    if (store.isMongoConnected) {
      try {
        const ticket = await Ticket.findOne({ ticketCode });
        if (ticket) return ticket;
      } catch (e) {}
    }
    return (store.memTickets || []).find(t => t.ticketCode === ticketCode) || null;
  }

  async checkInTicket(ticketCode, staffName, gate = 'Cửa Chính') {
    if (store.isMongoConnected) {
      try {
        const ticket = await Ticket.findOne({ ticketCode });
        if (!ticket) throw new Error('Không tìm thấy vé trong hệ thống');
        if (ticket.status === 'USED') {
          return { success: false, message: 'Vé đã được sử dụng trước đó', ticket };
        }
        ticket.status = 'USED';
        ticket.checkedInAt = new Date();
        ticket.checkedInBy = staffName;
        ticket.gate = gate;
        await ticket.save();
        return { success: true, message: 'Soát vé thành công', ticket };
      } catch (e) {
        throw e;
      }
    }

    const t = (store.memTickets || []).find(tk => tk.ticketCode === ticketCode);
    if (!t) throw new Error('Không tìm thấy vé trong hệ thống');
    if (t.status === 'USED') return { success: false, message: 'Vé đã được sử dụng trước đó', ticket: t };
    t.status = 'USED';
    t.checkedInAt = new Date();
    t.checkedInBy = staffName;
    t.gate = gate;
    return { success: true, message: 'Soát vé thành công', ticket: t };
  }
}

module.exports = new TicketService();
