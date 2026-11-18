/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ - BACKEND ARCHITECTURE
 * File: services/audit-log.service.js
 * Model: AuditLog (Collection: auditlogs)
 * Chức năng: Quản lý Nhật ký Hoạt động Hệ thống (System Audit Log)
 * ============================================================
 */

const AuditLog = require('../models/audit-log.model');
const store = require('../config/store');

class AuditLogService {
  async getAuditLogs(filters = {}) {
    const { category, status, search, limit = 200 } = filters;

    if (store.isMongoConnected) {
      try {
        const query = {};
        if (category && category !== 'ALL') query.category = category;
        if (status && status !== 'ALL') query.status = status;
        if (search) {
          query.$or = [
            { description: { $regex: search, $options: 'i' } },
            { 'performer.username': { $regex: search, $options: 'i' } },
            { 'performer.fullName': { $regex: search, $options: 'i' } },
            { ipAddress: { $regex: search, $options: 'i' } }
          ];
        }

        const logs = await AuditLog.find(query).sort({ createdAt: -1 }).limit(Number(limit));
        if (logs && logs.length > 0) return logs;
      } catch (e) {
        console.warn('⚠️ Lỗi truy vấn AuditLog MongoDB:', e.message);
      }
    }

    let result = store.memAuditLogs;
    if (category && category !== 'ALL') {
      result = result.filter(l => l.category === category);
    }
    if (status && status !== 'ALL') {
      result = result.filter(l => l.status === status);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(l =>
        (l.description && l.description.toLowerCase().includes(q)) ||
        (l.performer?.username && l.performer.username.toLowerCase().includes(q)) ||
        (l.performer?.fullName && l.performer.fullName.toLowerCase().includes(q)) ||
        (l.ipAddress && l.ipAddress.toLowerCase().includes(q))
      );
    }
    return result.slice(0, Number(limit));
  }

  getStatus() {
    return {
      isEnabled: store.isAuditLogEnabled,
      totalLogs: store.memAuditLogs.length
    };
  }

  async toggleStatus(enabled, req) {
    store.isAuditLogEnabled = typeof enabled === 'boolean' ? enabled : !store.isAuditLogEnabled;

    await store.logAudit(req, {
      action: 'TOGGLE_AUDIT_LOG',
      category: 'SYSTEM',
      description: `Đã ${store.isAuditLogEnabled ? 'BẬT' : 'TẮT'} cơ chế ghi log hệ thống tự động`,
      metadata: { isEnabled: store.isAuditLogEnabled }
    });

    return {
      success: true,
      enabled: store.isAuditLogEnabled,
      isEnabled: store.isAuditLogEnabled,
      message: `Đã ${store.isAuditLogEnabled ? 'bật' : 'tắt'} chức năng ghi Log hoạt động thành công!`
    };
  }

  async clearLogs(req) {
    store.memAuditLogs = [];
    if (store.isMongoConnected) {
      try {
        await AuditLog.deleteMany({});
      } catch (e) {}
    }

    await store.logAudit(req, {
      action: 'CLEAR_AUDIT_LOGS',
      category: 'SYSTEM',
      description: 'Đã xóa toàn bộ lịch sử nhật ký hoạt động',
      metadata: {}
    });

    return true;
  }
}

module.exports = new AuditLogService();
