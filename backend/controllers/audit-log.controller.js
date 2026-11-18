/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ - BACKEND ARCHITECTURE
 * File: controllers/audit-log.controller.js
 * Chức năng: Controller Quản lý Nhật ký Hoạt động Hệ thống
 * ============================================================
 */

const auditLogService = require('../services/audit-log.service');

class AuditLogController {
  async getAuditLogs(req, res) {
    try {
      const { category, status, search, limit } = req.query;
      const logs = await auditLogService.getAuditLogs({ category, status, search, limit });
      return res.status(200).json({ success: true, count: logs.length, data: logs });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  getStatus(req, res) {
    try {
      const status = auditLogService.getStatus();
      return res.status(200).json({ success: true, ...status });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async toggleStatus(req, res) {
    try {
      const isEnabled = req.body.isEnabled !== undefined ? req.body.isEnabled : req.body.enabled;
      const result = await auditLogService.toggleStatus(isEnabled, req);
      return res.status(200).json({ success: true, ...result });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async clearLogs(req, res) {
    try {
      await auditLogService.clearLogs(req);
      return res.status(200).json({ success: true, message: 'Đã làm sạch toàn bộ nhật ký hệ thống' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new AuditLogController();
