/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ - BACKEND ARCHITECTURE
 * File: services/seat.service.js
 * Model: Seat (Embedded trong Schedule / Collection: schedules)
 * Chức năng: Thao tác Giữ ghế 8p, Nhả ghế, Khóa ghế nội bộ VIP & Mở khóa ghế
 * ============================================================
 */

const Schedule = require('../models/schedule.model');
const store = require('../config/store');

class SeatService {
  async getSeatsByScheduleId(scheduleId) {
    if (store.isMongoConnected) {
      try {
        const schedule = await Schedule.findById(scheduleId);
        if (schedule && schedule.seats) return schedule.seats;
      } catch (e) {
        console.warn('⚠️ Lỗi lấy ghế MongoDB:', e.message);
      }
    }

    const schedule = store.memSchedules.find(s => s._id === scheduleId);
    return schedule ? schedule.seats : null;
  }

  async holdSeats(scheduleId, seatCodes, sessionId) {
    const expiresAt = new Date(Date.now() + 8 * 60 * 1000); // 8 phút theo BPMN 2.2.3
    const schedule = store.memSchedules.find(s => s._id === scheduleId);
    if (!schedule) throw new Error('Không tìm thấy suất diễn');

    const unavailable = schedule.seats.filter(s =>
      seatCodes.includes(s.seatCode) && s.status !== 'available' && s.holdingSessionId !== sessionId
    );

    if (unavailable.length > 0) {
      throw new Error(`Ghế ${unavailable.map(s => s.seatCode).join(', ')} đã có người chọn hoặc đã được bán`);
    }

    schedule.seats.forEach(s => {
      if (seatCodes.includes(s.seatCode)) {
        s.status = 'holding';
        s.holdingSessionId = sessionId;
        s.holdingExpiresAt = expiresAt;
      }
    });

    if (store.isMongoConnected) {
      try {
        await Schedule.updateOne(
          { _id: scheduleId },
          { $set: { seats: schedule.seats } }
        );
      } catch (e) {
        console.warn('⚠️ Lỗi cập nhật giữ ghế MongoDB:', e.message);
      }
    }

    return { expiresAt, heldSeats: seatCodes };
  }

  async releaseSeats(scheduleId, seatCodes, sessionId) {
    const schedule = store.memSchedules.find(s => s._id === scheduleId);
    if (!schedule) throw new Error('Không tìm thấy suất diễn');

    schedule.seats.forEach(s => {
      if (seatCodes.includes(s.seatCode) && (s.holdingSessionId === sessionId || !sessionId)) {
        s.status = 'available';
        s.holdingSessionId = null;
        s.holdingExpiresAt = null;
      }
    });

    if (store.isMongoConnected) {
      try {
        await Schedule.updateOne(
          { _id: scheduleId },
          { $set: { seats: schedule.seats } }
        );
      } catch (e) {
        console.warn('⚠️ Lỗi nhả ghế MongoDB:', e.message);
      }
    }

    return { releasedSeats: seatCodes };
  }

  async lockSeats(scheduleId, seatCodes, reason, lockedBy, req) {
    const schedule = store.memSchedules.find(s => s._id === scheduleId);
    if (!schedule) throw new Error('Không tìm thấy lịch diễn');

    const lockedAt = new Date();
    schedule.seats.forEach(seat => {
      if (seatCodes.includes(seat.seatCode)) {
        seat.status = 'locked';
        seat.lockedReason = reason;
        seat.lockedBy = lockedBy || 'Admin';
        seat.lockedAt = lockedAt;
      }
    });

    schedule.lockedSeatsCount = schedule.seats.filter(s => s.status === 'locked').length;

    if (store.isMongoConnected) {
      try {
        await Schedule.updateOne(
          { _id: scheduleId },
          {
            $set: {
              seats: schedule.seats,
              lockedSeatsCount: schedule.lockedSeatsCount
            }
          }
        );
      } catch (e) {
        console.warn('⚠️ Lỗi khóa ghế MongoDB:', e.message);
      }
    }

    await store.logAudit(req, {
      action: 'LOCK_SEATS',
      category: 'SEAT',
      description: `Khóa ${seatCodes.length} ghế (${seatCodes.join(', ')}) suất ${schedule.musicalTitle} - Lý do: ${reason}`,
      metadata: { scheduleId, seatCodes, reason }
    });

    return {
      lockedCount: seatCodes.length,
      lockedSeats: seatCodes,
      totalLockedInSchedule: schedule.lockedSeatsCount
    };
  }

  async unlockSeats(scheduleId, seatCodes, req) {
    const schedule = store.memSchedules.find(s => s._id === scheduleId);
    if (!schedule) throw new Error('Không tìm thấy lịch diễn');

    schedule.seats.forEach(seat => {
      if (seatCodes.includes(seat.seatCode) && seat.status === 'locked') {
        seat.status = 'available';
        seat.lockedReason = null;
        seat.lockedBy = null;
        seat.lockedAt = null;
      }
    });

    schedule.lockedSeatsCount = schedule.seats.filter(s => s.status === 'locked').length;

    if (store.isMongoConnected) {
      try {
        await Schedule.updateOne(
          { _id: scheduleId },
          {
            $set: {
              seats: schedule.seats,
              lockedSeatsCount: schedule.lockedSeatsCount
            }
          }
        );
      } catch (e) {
        console.warn('⚠️ Lỗi mở khóa ghế MongoDB:', e.message);
      }
    }

    await store.logAudit(req, {
      action: 'UNLOCK_SEATS',
      category: 'SEAT',
      description: `Mở khóa ${seatCodes.length} ghế (${seatCodes.join(', ')}) suất ${schedule.musicalTitle}`,
      metadata: { scheduleId, seatCodes }
    });

    return {
      unlockedCount: seatCodes.length,
      unlockedSeats: seatCodes,
      remainingLockedInSchedule: schedule.lockedSeatsCount
    };
  }
}

module.exports = new SeatService();
