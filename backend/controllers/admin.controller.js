/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ - BACKEND ARCHITECTURE
 * File: controllers/admin.controller.js
 * Chức năng: Controller Dashboard Thống kê, Doanh thu & Đối soát Tài chính
 * ============================================================
 */

const dashboardService = require('../services/dashboard.service');
const reconciliationService = require('../services/reconciliation.service');
const store = require('../config/store');

class AdminController {
  async getDashboardStats(req, res) {
    try {
      const stats = await dashboardService.getDashboardStats();
      return res.status(200).json({ success: true, data: stats });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getRevenueReport(req, res) {
    try {
      const { period } = req.query;
      const report = await dashboardService.getRevenueReport(period);
      return res.status(200).json({ success: true, data: report });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getReconciliationReport(req, res) {
    try {
      const records = await reconciliationService.getReconciliations();
      return res.status(200).json({ success: true, count: records.length, data: records });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  healthCheck(req, res) {
    return res.status(200).json({
      status: 'UP',
      service: 'Nhac Kich Thanh Pho - Backend RESTful API Gateway',
      environment: process.env.NODE_ENV || 'development',
      database: store.isMongoConnected ? 'CONNECTED (MongoDB)' : 'IN-MEMORY STANDALONE (Mock Store Active)',
      timestamp: new Date()
    });
  }
}

module.exports = new AdminController();
