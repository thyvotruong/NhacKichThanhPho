/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ - BACKEND ARCHITECTURE
 * File: controllers/schedule.controller.js
 * Chức năng: Controller Xử lý Lịch diễn & Quản lý Khán phòng
 * ============================================================
 */

const scheduleService = require('../services/schedule.service');

class ScheduleController {
  async getSchedules(req, res) {
    try {
      const { musicalSlug, musicalId, date } = req.query;
      const schedules = await scheduleService.getSchedules({ musicalSlug, musicalId, date });
      return res.status(200).json({ success: true, count: schedules.length, data: schedules });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getAuditoriums(req, res) {
    try {
      const auditoriums = scheduleService.getAuditoriums();
      return res.status(200).json({ success: true, count: auditoriums.length, data: auditoriums });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async createAuditorium(req, res) {
    try {
      const aud = scheduleService.createAuditorium(req.body, req);
      return res.status(201).json({ success: true, data: aud });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  async updateAuditorium(req, res) {
    try {
      const aud = scheduleService.updateAuditorium(req.params.code, req.body, req);
      if (!aud) return res.status(404).json({ success: false, message: 'Không tìm thấy khán phòng' });
      return res.status(200).json({ success: true, data: aud });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  async toggleAuditorium(req, res) {
    try {
      const aud = scheduleService.toggleAuditorium(req.params.code, req);
      if (!aud) return res.status(404).json({ success: false, message: 'Không tìm thấy khán phòng' });
      return res.status(200).json({ success: true, data: aud });
    } catch (err) {
      return res.status(404).json({ success: false, message: err.message });
    }
  }

  async createSchedule(req, res) {
    try {
      const schedule = await scheduleService.createSchedule(req.body, req);
      return res.status(201).json({ success: true, data: schedule });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  async updateSchedule(req, res) {
    try {
      const schedule = await scheduleService.updateSchedule(req.params.id, req.body, req);
      if (!schedule) return res.status(404).json({ success: false, message: 'Không tìm thấy suất diễn' });
      return res.status(200).json({ success: true, data: schedule });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  async cancelSchedule(req, res) {
    try {
      const schedule = await scheduleService.cancelSchedule(req.params.id, req);
      if (!schedule) return res.status(404).json({ success: false, message: 'Không tìm thấy suất diễn' });
      return res.status(200).json({ success: true, data: schedule });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }
}

module.exports = new ScheduleController();
