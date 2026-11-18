/**
 * ============================================================
 * NHẠC KỊCH THÀNH PHỐ - BACKEND ARCHITECTURE
 * File: services/artist.service.js
 * Model: Artist (Collection: artists)
 * Chức năng: Quản lý Danh mục Nghệ sĩ, Đạo diễn, Diễn viên Nhạc kịch
 * ============================================================
 */

const Artist = require('../models/artist.model');
const store = require('../config/store');

class ArtistService {
  async getArtists() {
    if (store.isMongoConnected) {
      try {
        const artists = await Artist.find().sort({ order: 1, createdAt: -1 });
        if (artists && artists.length > 0) return artists;
      } catch (e) {}
    }
    return store.memArtists;
  }

  async createArtist(artistData, req) {
    const newArtist = {
      _id: 'art_' + Date.now(),
      ...artistData,
      createdAt: new Date()
    };

    if (store.isMongoConnected) {
      try {
        await Artist.create(newArtist);
      } catch (e) {}
    }
    store.memArtists.unshift(newArtist);

    await store.logAudit(req, {
      action: 'CREATE_ARTIST',
      category: 'ARTIST',
      description: `Thêm nghệ sĩ mới: ${newArtist.name} (${newArtist.roles?.join(', ') || 'Diễn viên'})`,
      metadata: { artistName: newArtist.name }
    });

    return newArtist;
  }

  async updateArtist(id, artistData, req) {
    let updated = null;
    if (store.isMongoConnected) {
      try {
        updated = await Artist.findByIdAndUpdate(id, { $set: artistData }, { new: true });
      } catch (e) {}
    }

    const idx = store.memArtists.findIndex(a => a._id === id || a.id === id);
    if (idx !== -1) {
      store.memArtists[idx] = { ...store.memArtists[idx], ...artistData };
      if (!updated) updated = store.memArtists[idx];
    }

    if (updated) {
      await store.logAudit(req, {
        action: 'UPDATE_ARTIST',
        category: 'ARTIST',
        description: `Cập nhật hồ sơ nghệ sĩ: ${updated.name}`,
        metadata: { artistId: id, name: updated.name }
      });
    }

    return updated;
  }

  async deleteArtist(id, req) {
    const artist = store.memArtists.find(a => a._id === id || a.id === id);
    store.memArtists = store.memArtists.filter(a => a._id !== id && a.id !== id);

    if (store.isMongoConnected) {
      try {
        await Artist.findByIdAndDelete(id);
      } catch (e) {}
    }

    if (artist) {
      await store.logAudit(req, {
        action: 'DELETE_ARTIST',
        category: 'ARTIST',
        description: `Xóa nghệ sĩ ${artist.name} khỏi hệ thống`,
        metadata: { artistId: id, name: artist.name }
      });
    }

    return artist;
  }
}

module.exports = new ArtistService();
