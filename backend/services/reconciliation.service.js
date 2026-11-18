/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ - BACKEND ARCHITECTURE
 * File: services/reconciliation.service.js
 * Model: Reconciliation (Collection: reconciliations)
 * Chức năng: Đối soát Doanh thu & Báo cáo Giao dịch Cổng thanh toán
 * ============================================================
 */

const Reconciliation = require('../models/reconciliation.model');
const store = require('../config/store');

class ReconciliationService {
  async getReconciliations() {
    if (store.isMongoConnected) {
      try {
        const records = await Reconciliation.find().sort({ createdAt: -1 });
        if (records && records.length > 0) return records;
      } catch (e) {}
    }
    return store.memReconciliations;
  }
}

module.exports = new ReconciliationService();
