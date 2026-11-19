/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ - BACKEND ARCHITECTURE
 * File: services/musical.service.js
 * Model: Musical (Collection: musicals)
 * Chức năng: Thao tác Database & Nghiệp vụ danh mục Vở Nhạc Kịch
 * ============================================================
 */

const Musical = require('../models/musical.model');
const MusicalNotificationSubscription = require('../models/musical-notification-subscription.model');
const store = require('../config/store');

class MusicalService {
  async getMusicals(filters = {}) {
    const { genre, status, search } = filters;

    const isAllGenre = !genre || String(genre).trim().toLowerCase() === 'all';
    const isAllStatus = !status || String(status).trim().toLowerCase() === 'all';

    if (store.isMongoConnected) {
      try {
        const query = {};
        if (!isAllGenre) {
          query.genre = { $regex: new RegExp(genre, 'i') };
        }
        if (!isAllStatus) {
          query.status = status;
        }
        if (search && search.trim()) {
          const q = search.trim();
          query.$or = [
            { title: { $regex: q, $options: 'i' } },
            { director: { $regex: q, $options: 'i' } }
          ];
        }

        const musicals = await Musical.find(query).sort({ releaseDate: -1, createdAt: -1 });
        if (musicals && musicals.length > 0) return musicals;
      } catch (e) {
        console.warn('⚠️ Lỗi truy vấn Musical từ MongoDB:', e.message);
      }
    }

    // In-memory Fallback
    let result = [...store.memMusicals];
    if (!isAllGenre) {
      const gLower = String(genre).trim().toLowerCase();
      result = result.filter(m => {
        if (Array.isArray(m.genre)) {
          return m.genre.some(g => String(g).toLowerCase().includes(gLower));
        }
        return String(m.genre || '').toLowerCase().includes(gLower);
      });
    }
    if (!isAllStatus) {
      result = result.filter(m => m.status === status);
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(m =>
        (m.title && m.title.toLowerCase().includes(q)) ||
        (m.director && m.director.toLowerCase().includes(q))
      );
    }
    return result;
  }

  async getMusicalBySlug(slug) {
    let found = null;
    if (store.isMongoConnected) {
      try {
        const musical = await Musical.findOne({ slug });
        if (musical) found = musical.toObject ? musical.toObject() : { ...musical._doc };
      } catch (e) {
        console.warn('⚠️ Lỗi tìm Musical theo slug MongoDB:', e.message);
      }
    }
    if (!found) {
      const mem = store.memMusicals.find(m => m.slug === slug);
      if (mem) found = JSON.parse(JSON.stringify(mem));
    }
    if (!found) return null;

    // Đính kèm danh sách suất diễn thực tế tương ứng với vở nhạc kịch
    const schedules = store.memSchedules.filter(s =>
      s.musicalSlug === slug ||
      (s.musicalTitle && found.title && s.musicalTitle.toLowerCase() === found.title.toLowerCase())
    );

    found.schedules = schedules.map(s => ({
      _id: s._id,
      musicalId: s.musicalId || found._id || slug,
      musicalTitle: s.musicalTitle || found.title,
      musicalSlug: s.musicalSlug || found.slug,
      performanceDate: s.performanceDate,
      time: s.time,
      venue: s.venue || 'Nhà Hát Lớn Thành Phố',
      hall: s.hall || 'Khán phòng Grand A - Hoàng Gia',
      totalSeats: s.totalSeats || (s.seats ? s.seats.length : 182),
      bookedSeats: s.bookedSeats || 0,
      lockedSeatsCount: s.lockedSeatsCount || 0,
      status: s.status || 'available'
    }));

    return found;
  }

  async subscribeNotification(slug, payload) {
    const { email, phone, name } = payload;
    const subscription = {
      musicalSlug: slug,
      email,
      phone: phone || '',
      name: name || '',
      createdAt: new Date()
    };

    if (store.isMongoConnected) {
      try {
        await MusicalNotificationSubscription.create(subscription);
      } catch (e) {
        console.warn('⚠️ Lỗi lưu MusicalNotificationSubscription MongoDB:', e.message);
      }
    }

    store.memMusicalNotificationSubscriptions.push(subscription);
    return subscription;
  }

  async createMusical(data, req) {
    let newMusical = {
      _id: 'mus_' + Date.now(),
      ...data,
      rating: 5.0,
      reviewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (store.isMongoConnected) {
      try {
        const created = await Musical.create(data);
        newMusical = created.toObject();
      } catch (e) {
        console.warn('⚠️ Lỗi tạo Musical MongoDB:', e.message);
      }
    }

    store.memMusicals.unshift(newMusical);

    await store.logAudit(req, {
      action: 'CREATE_MUSICAL',
      category: 'MUSICAL',
      description: `Tạo mới vở nhạc kịch "${newMusical.title}" (${newMusical.slug})`,
      metadata: { musicalSlug: newMusical.slug, title: newMusical.title }
    });

    return newMusical;
  }

  async updateMusical(slugOrId, data, req) {
    let updated = null;

    if (store.isMongoConnected) {
      try {
        updated = await Musical.findOneAndUpdate(
          { $or: [{ slug: slugOrId }, { _id: slugOrId }] },
          { $set: data },
          { new: true }
        );
      } catch (e) {
        console.warn('⚠️ Lỗi cập nhật Musical MongoDB:', e.message);
      }
    }

    const idx = store.memMusicals.findIndex(m => m.slug === slugOrId || m._id === slugOrId);
    if (idx !== -1) {
      store.memMusicals[idx] = { ...store.memMusicals[idx], ...data, updatedAt: new Date() };
      if (!updated) updated = store.memMusicals[idx];
    }

    if (updated) {
      await store.logAudit(req, {
        action: 'UPDATE_MUSICAL',
        category: 'MUSICAL',
        description: `Cập nhật thông tin vở kịch "${updated.title}"`,
        metadata: { musicalSlug: updated.slug, changes: Object.keys(data) }
      });
    }

    return updated;
  }

  async deleteMusical(slugOrId, req) {
    let target = store.memMusicals.find(m => m.slug === slugOrId || m._id === slugOrId);

    if (store.isMongoConnected) {
      try {
        const found = await Musical.findOneAndDelete({ $or: [{ slug: slugOrId }, { _id: slugOrId }] });
        if (found) target = found;
      } catch (e) {
        console.warn('⚠️ Lỗi xóa Musical MongoDB:', e.message);
      }
    }

    store.memMusicals = store.memMusicals.filter(m => m.slug !== slugOrId && m._id !== slugOrId);

    if (target) {
      await store.logAudit(req, {
        action: 'DELETE_MUSICAL',
        category: 'MUSICAL',
        description: `Xóa vở nhạc kịch "${target.title}" khỏi hệ thống`,
        metadata: { musicalSlug: target.slug }
      });
    }

    return target;
  }

  async toggleMusical(slugOrId, req) {
    let target = store.memMusicals.find(m => m.slug === slugOrId || m._id === slugOrId);
    if (!target) return null;

    const newStatus = target.status === 'now_showing' ? 'coming_soon' : 'now_showing';
    return await this.updateMusical(slugOrId, { status: newStatus }, req);
  }
}

module.exports = new MusicalService();
