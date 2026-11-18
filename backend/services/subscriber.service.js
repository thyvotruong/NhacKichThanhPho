/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ - BACKEND ARCHITECTURE
 * File: services/subscriber.service.js
 * Model: Subscriber (Collection: subscribers)
 * Chức năng: Quản lý Email Khách hàng quan tâm (Customer Leads)
 * ============================================================
 */

const Subscriber = require('../models/subscriber.model');
const store = require('../config/store');

class SubscriberService {
  async createSubscriber(email, source = 'homepage_vip', musicalTitle = '', req) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      throw new Error('Địa chỉ email không đúng định dạng');
    }

    // Kiểm tra trùng lặp
    let exists = false;
    if (store.isMongoConnected) {
      try {
        const found = await Subscriber.findOne({
          email: cleanEmail,
          musicalTitle: (musicalTitle || '').trim()
        });
        if (found) exists = true;
      } catch (e) {}
    }

    if (!exists) {
      const memFound = store.memSubscribers.find(s =>
        s.email.toLowerCase() === cleanEmail &&
        (s.musicalTitle || '').trim().toLowerCase() === (musicalTitle || '').trim().toLowerCase()
      );
      if (memFound) exists = true;
    }

    if (exists) {
      const msg = musicalTitle
        ? `Email ${cleanEmail} đã đăng ký nhận thông báo cho vở kịch "${musicalTitle}" rồi!`
        : `Email ${cleanEmail} đã có trong danh sách nhận thông tin ưu đãi VIP của nhà hát!`;
      throw new Error(msg);
    }

    const newSub = {
      _id: 'sub_' + Date.now(),
      email: cleanEmail,
      source,
      musicalTitle: musicalTitle || '',
      createdAt: new Date()
    };

    if (store.isMongoConnected) {
      try {
        const created = await Subscriber.create({
          email: cleanEmail,
          source,
          musicalTitle: musicalTitle || ''
        });
        newSub._id = created._id.toString();
      } catch (e) {
        console.warn('⚠️ Lỗi lưu Subscriber MongoDB:', e.message);
      }
    }

    store.memSubscribers.unshift(newSub);

    await store.logAudit(req, {
      action: 'SUBSCRIBE_LEAD',
      category: 'MARKETING',
      description: `Thu thập email khách hàng ${cleanEmail} từ nguồn ${source}${musicalTitle ? ` (Vở: ${musicalTitle})` : ''}`,
      metadata: { email: cleanEmail, source, musicalTitle }
    });

    return newSub;
  }

  async getSubscribers() {
    if (store.isMongoConnected) {
      try {
        const subs = await Subscriber.find().sort({ createdAt: -1 });
        if (subs && subs.length > 0) return subs;
      } catch (e) {}
    }
    return store.memSubscribers;
  }

  async deleteSubscriber(id, req) {
    let deleted = null;
    if (store.isMongoConnected) {
      try {
        deleted = await Subscriber.findByIdAndDelete(id);
      } catch (e) {}
    }

    const idx = store.memSubscribers.findIndex(s => s._id === id || String(s._id) === String(id));
    if (idx !== -1) {
      deleted = store.memSubscribers.splice(idx, 1)[0];
    }

    if (deleted) {
      await store.logAudit(req, {
        action: 'DELETE_SUBSCRIBER',
        category: 'MARKETING',
        description: `Xóa email ${deleted.email} khỏi danh sách khách hàng quan tâm`,
        metadata: { subscriberId: id, email: deleted.email }
      });
    }

    return deleted;
  }
}

module.exports = new SubscriberService();
