/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ - BACKEND ARCHITECTURE
 * File: services/schedule.service.js
 * Model: Schedule (Collection: schedules)
 * Chức năng: Thao tác Database & Nghiệp vụ Lịch diễn & Khán phòng
 * ============================================================
 */

const Schedule = require('../models/schedule.model');
const store = require('../config/store');
const { generateSeatLayout } = require('../seed');

class ScheduleService {
  async getSchedules(filters = {}) {
    const { musicalSlug, musicalId, date } = filters;

    if (store.isMongoConnected) {
      try {
        const query = {};
        if (musicalSlug) query.musicalSlug = musicalSlug;
        if (musicalId) query.musicalId = musicalId;
        if (date) {
          const start = new Date(date);
          start.setHours(0, 0, 0, 0);
          const end = new Date(date);
          end.setHours(23, 59, 59, 999);
          query.performanceDate = { $gte: start, $lte: end };
        }

        const schedules = await Schedule.find(query).sort({ performanceDate: 1, time: 1 });
        if (schedules && schedules.length > 0) return schedules;
      } catch (e) {
        console.warn('⚠️ Lỗi truy vấn Schedule MongoDB:', e.message);
      }
    }

    let result = store.memSchedules;
    if (musicalSlug) {
      result = result.filter(s => s.musicalSlug === musicalSlug);
    }
    if (date) {
      const dStr = new Date(date).toISOString().slice(0, 10);
      result = result.filter(s => new Date(s.performanceDate).toISOString().slice(0, 10) === dStr);
    }
    return result;
  }

  async getScheduleById(scheduleId) {
    if (store.isMongoConnected) {
      try {
        const schedule = await Schedule.findById(scheduleId);
        if (schedule) return schedule;
      } catch (e) {
        console.warn('⚠️ Lỗi tìm Schedule theo ID MongoDB:', e.message);
      }
    }
    return store.memSchedules.find(s => s._id === scheduleId) || null;
  }

  async createSchedule(data, req) {
    const layout = generateSeatLayout(800000, 450000, 1200000);
    const newSchedule = {
      _id: 'sch_' + Date.now(),
      ...data,
      totalSeats: layout.length,
      bookedSeats: 0,
      lockedSeatsCount: 0,
      status: 'available',
      seats: layout,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (store.isMongoConnected) {
      try {
        await Schedule.create(newSchedule);
      } catch (e) {
        console.warn('⚠️ Lỗi tạo Schedule MongoDB:', e.message);
      }
    }

    store.memSchedules.unshift(newSchedule);

    await store.logAudit(req, {
      action: 'CREATE_SCHEDULE',
      category: 'SCHEDULE',
      description: `Mở thêm suất diễn cho vở "${newSchedule.musicalTitle}" vào ${newSchedule.time} ngày ${new Date(newSchedule.performanceDate).toLocaleDateString('vi-VN')}`,
      metadata: { scheduleId: newSchedule._id, musicalSlug: newSchedule.musicalSlug }
    });

    return newSchedule;
  }

  async updateSchedule(id, data, req) {
    let updated = null;

    if (store.isMongoConnected) {
      try {
        updated = await Schedule.findByIdAndUpdate(id, { $set: data }, { new: true });
      } catch (e) {
        console.warn('⚠️ Lỗi cập nhật Schedule MongoDB:', e.message);
      }
    }

    const idx = store.memSchedules.findIndex(s => s._id === id);
    if (idx !== -1) {
      store.memSchedules[idx] = { ...store.memSchedules[idx], ...data, updatedAt: new Date() };
      if (!updated) updated = store.memSchedules[idx];
    }

    if (updated) {
      await store.logAudit(req, {
        action: 'UPDATE_SCHEDULE',
        category: 'SCHEDULE',
        description: `Cập nhật thông tin suất diễn ${id}`,
        metadata: { scheduleId: id, changes: Object.keys(data) }
      });
    }

    return updated;
  }

  async cancelSchedule(id, req) {
    return await this.updateSchedule(id, { status: 'cancelled' }, req);
  }

  // --- Khán phòng (Auditoriums) ---
  getAuditoriums() {
    return store.memAuditoriums;
  }

  createAuditorium(data, req) {
    const newAud = {
      _id: 'AUD-0' + (store.memAuditoriums.length + 1),
      ...data,
      status: 'active'
    };
    store.memAuditoriums.push(newAud);
    return newAud;
  }

  updateAuditorium(code, data, req) {
    const idx = store.memAuditoriums.findIndex(a => a.code === code);
    if (idx !== -1) {
      store.memAuditoriums[idx] = { ...store.memAuditoriums[idx], ...data };
      return store.memAuditoriums[idx];
    }
    return null;
  }

  toggleAuditorium(code, req) {
    const aud = store.memAuditoriums.find(a => a.code === code);
    if (aud) {
      aud.status = aud.status === 'active' ? 'maintenance' : 'active';
      return aud;
    }
    return null;
  }
}

module.exports = new ScheduleService();
