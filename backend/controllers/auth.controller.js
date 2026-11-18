/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ - BACKEND ARCHITECTURE
 * File: controllers/auth.controller.js
 * Chức năng: Controller Xử lý Xác thực Người dùng & Phân quyền RBAC
 * ============================================================
 */

const userService = require('../services/user.service');

class AuthController {
  async checkUser(req, res) {
    try {
      const { email, username } = req.body;
      const target = email || username;
      if (!target) {
        return res.status(400).json({ success: false, message: 'Vui lòng cung cấp email hoặc username' });
      }
      const result = await userService.checkUser(target);
      return res.status(200).json({ success: true, ...result });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async login(req, res) {
    try {
      const { username, email, identifier, password, method, otp } = req.body;
      const accountIdentifier = identifier || username || email;
      if (!accountIdentifier) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập tài khoản hoặc email' });
      }
      if (method !== 'google' && method !== 'phone' && !password && !otp) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập mật khẩu' });
      }
      const result = await userService.login(accountIdentifier, password, req, { method, otp });
      return res.status(200).json({
        success: true,
        message: 'Đăng nhập thành công',
        data: result,
        ...result
      });
    } catch (err) {
      return res.status(401).json({ success: false, message: err.message });
    }
  }

  async staffLogin(req, res) {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập tài khoản và mật khẩu nội bộ' });
      }
      const result = await userService.staffLogin(username, password, req);
      return res.status(200).json({
        success: true,
        message: 'Đăng nhập phân hệ quản trị thành công',
        data: result,
        ...result
      });
    } catch (err) {
      return res.status(401).json({ success: false, message: err.message });
    }
  }

  async register(req, res) {
    try {
      const { fullName, email, password, phone } = req.body;
      if (!fullName || !email || !password) {
        return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ họ tên, email và mật khẩu' });
      }
      const newUser = await userService.register({ fullName, email, password, phone }, req);
      return res.status(201).json({
        success: true,
        message: 'Đăng ký tài khoản thành công',
        data: { user: newUser },
        user: newUser
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  async resetPassword(req, res) {
    try {
      const { identifier, otp, newPassword } = req.body;
      if (!identifier || !newPassword) {
        return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ thông tin' });
      }
      const result = await userService.resetPassword(identifier, newPassword, req);
      return res.status(200).json({ success: true, message: 'Cập nhật mật khẩu thành công', data: result });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  async changePassword(req, res) {
    try {
      const { userId, email, username, currentPassword, newPassword } = req.body;
      const userRef = userId || email || username;

      if (!userRef || !currentPassword || !newPassword) {
        return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ thông tin đổi mật khẩu' });
      }

      await userService.changePassword(userRef, currentPassword, newPassword, req);
      return res.status(200).json({ success: true, message: 'Đổi mật khẩu thành công!' });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  async getUsers(req, res) {
    try {
      const { role } = req.query;
      const users = await userService.getUsers(role);
      return res.status(200).json({ success: true, count: users.length, data: users });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async createUser(req, res) {
    try {
      const user = await userService.createUser(req.body, req);
      return res.status(201).json({ success: true, data: user });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  async updateUser(req, res) {
    try {
      const user = await userService.updateUser(req.params.id, req.body, req);
      if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });
      return res.status(200).json({ success: true, data: user });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  async toggleUser(req, res) {
    try {
      const user = await userService.toggleUser(req.params.id, req);
      return res.status(200).json({ success: true, data: user });
    } catch (err) {
      return res.status(404).json({ success: false, message: err.message });
    }
  }

  async deleteUser(req, res) {
    try {
      const user = await userService.deleteUser(req.params.id, req);
      return res.status(200).json({ success: true, message: 'Đã xóa tài khoản nhân sự', data: user });
    } catch (err) {
      return res.status(404).json({ success: false, message: err.message });
    }
  }
}

module.exports = new AuthController();
