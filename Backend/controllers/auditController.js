import AuditData from '../models/AuditData.js';
import Produk from '../models/Produk.js';
import db from '../config/db.js';

class AuditController {
  static async getAllAuditData(req, res) {
    try {
      const query = `
        SELECT
          ad.*,
          p.nama_produk,
          p.unit,
          p.harga_satuan as harga_produk
        FROM audit_data ad
        LEFT JOIN produk p ON ad.produk_id = p.id
        ORDER BY ad.tanggal DESC, ad.created_at DESC
      `;

      const [rows] = await db.promise().execute(query);

      const auditData = rows.map(row => {
        const audit = new AuditData({
          id: row.id,
          produk_id: row.produk_id,
          sumber_pengeluaran: row.sumber_pengeluaran,
          tanggal: row.tanggal,
          jenis_transaksi: row.jenis_transaksi,
          jumlah: row.jumlah,
          satuan: row.satuan,
          harga_satuan: row.harga_satuan,
          total_pendapatan: row.total_pendapatan,
          keterangan: row.keterangan,
          created_at: row.created_at,
          updated_at: row.updated_at
        });

        if (row.produk_id) {
          audit.produk = {
            id: row.produk_id,
            nama_produk: row.nama_produk,
            unit: row.unit,
            harga_satuan: row.harga_produk
          };
        }

        return audit.toJSON();
      });

      res.json({
        success: true,
        data: auditData
      });
    } catch (error) {
      console.error('Error getting audit data:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data audit'
      });
    }
  }

  static async addPenjualan(req, res) {
    try {
      const { produk_id, tanggal, jumlah, keterangan } = req.body;

      if (!produk_id || !tanggal || !jumlah) {
        return res.status(400).json({
          success: false,
          message: 'Produk ID, tanggal, dan jumlah harus diisi'
        });
      }

      const [produkRows] = await db.promise().execute(
        'SELECT * FROM produk WHERE id = ?',
        [produk_id]
      );

      if (produkRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Produk tidak ditemukan'
        });
      }

      const produk = produkRows[0];
      const harga_satuan = produk.harga_satuan;
      const total_pendapatan = jumlah * harga_satuan;

      if (produk.stok_tersedia < jumlah) {
        return res.status(400).json({
          success: false,
          message: `Stok tidak mencukupi. Stok tersedia: ${produk.stok_tersedia}`
        });
      }

      const query = `
        INSERT INTO audit_data (produk_id, tanggal, jenis_transaksi, jumlah, harga_satuan, total_pendapatan, keterangan, created_at, updated_at)
        VALUES (?, ?, 'penjualan', ?, ?, ?, ?, NOW(), NOW())
      `;

      const [result] = await db.promise().execute(query, [
        produk_id,
        tanggal,
        jumlah,
        harga_satuan,
        total_pendapatan,
        keterangan || ''
      ]);

      await db.promise().execute(
        'UPDATE produk SET stok_tersedia = stok_tersedia - ?, updated_at = NOW() WHERE id = ?',
        [jumlah, produk_id]
      );

      res.status(201).json({
        success: true,
        message: 'Data penjualan berhasil ditambahkan',
        data: {
          id: result.insertId,
          produk_id,
          tanggal,
          jenis_transaksi: 'penjualan',
          jumlah,
          harga_satuan,
          total_pendapatan,
          keterangan
        }
      });
    } catch (error) {
      console.error('Error adding penjualan:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal menambahkan data penjualan'
      });
    }
  }

  static async addPengeluaran(req, res) {
    try {
      const { sumber_pengeluaran, tanggal, jumlah, satuan, harga_satuan, keterangan } = req.body;

      if (!sumber_pengeluaran || !tanggal || !jumlah || harga_satuan === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Sumber pengeluaran, tanggal, jumlah, dan harga satuan harus diisi'
        });
      }

      const total_pendapatan = jumlah * harga_satuan;

      const query = `
        INSERT INTO audit_data (produk_id, sumber_pengeluaran, tanggal, jenis_transaksi, jumlah, harga_satuan, total_pendapatan, keterangan, created_at, updated_at)
        VALUES (NULL, ?, ?, 'pengeluaran', ?, ?, ?, ?, NOW(), NOW())
      `;

      const [result] = await db.promise().execute(query, [
        sumber_pengeluaran,
        tanggal,
        jumlah,
        harga_satuan,
        total_pendapatan,
        keterangan || ''
      ]);

      res.status(201).json({
        success: true,
        message: 'Data pengeluaran berhasil ditambahkan',
        data: {
          id: result.insertId,
          produk_id: null,
          sumber_pengeluaran,
          tanggal,
          jenis_transaksi: 'pengeluaran',
          jumlah,
          harga_satuan,
          total_pendapatan,
          keterangan
        }
      });
    } catch (error) {
      console.error('Error adding pengeluaran:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal menambahkan data pengeluaran'
      });
    }
  }

  static async deleteAuditData(req, res) {
    try {
      const { id } = req.params;

      const [auditRows] = await db.promise().execute(
        'SELECT * FROM audit_data WHERE id = ?',
        [id]
      );

      if (auditRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Data audit tidak ditemukan'
        });
      }

      const auditData = auditRows[0];

      if (auditData.jenis_transaksi === 'penjualan') {
        await db.promise().execute(
          'UPDATE produk SET stok_tersedia = stok_tersedia + ?, updated_at = NOW() WHERE id = ?',
          [auditData.jumlah, auditData.produk_id]
        );
      }

      await db.promise().execute('DELETE FROM audit_data WHERE id = ?', [id]);

      res.json({
        success: true,
        message: 'Data audit berhasil dihapus'
      });
    } catch (error) {
      console.error('Error deleting audit data:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal menghapus data audit'
      });
    }
  }

  static async getAuditByProduct(req, res) {
    try {
      const { produk_id } = req.params;

      const query = `
        SELECT
          ad.*,
          p.nama_produk,
          p.unit,
          p.harga_satuan as harga_produk
        FROM audit_data ad
        LEFT JOIN produk p ON ad.produk_id = p.id
        WHERE ad.produk_id = ?
        ORDER BY ad.tanggal DESC, ad.created_at DESC
      `;

      const [rows] = await db.promise().execute(query, [produk_id]);

      const auditData = rows.map(row => {
        const audit = new AuditData({
          id: row.id,
          produk_id: row.produk_id,
          tanggal: row.tanggal,
          jenis_transaksi: row.jenis_transaksi,
          jumlah: row.jumlah,
          harga_satuan: row.harga_satuan,
          total_pendapatan: row.total_pendapatan,
          keterangan: row.keterangan,
          created_at: row.created_at,
          updated_at: row.updated_at
        });

        audit.produk = {
          id: row.produk_id,
          nama_produk: row.nama_produk,
          unit: row.unit,
          harga_satuan: row.harga_produk
        };

        return audit.toJSON();
      });

      res.json({
        success: true,
        data: auditData
      });
    } catch (error) {
      console.error('Error getting audit by product:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data audit produk'
      });
    }
  }

  static async getAuditDataById(req, res) {
    try {
      const { id } = req.params;

      const query = `
        SELECT
          ad.*,
          p.nama_produk,
          p.unit,
          p.harga_satuan as harga_produk
        FROM audit_data ad
        LEFT JOIN produk p ON ad.produk_id = p.id
        WHERE ad.id = ?
      `;

      const [rows] = await db.promise().execute(query, [id]);

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Data audit tidak ditemukan'
        });
      }

      const row = rows[0];
      const audit = new AuditData({
        id: row.id,
        produk_id: row.produk_id,
        sumber_pengeluaran: row.sumber_pengeluaran,
        tanggal: row.tanggal,
        jenis_transaksi: row.jenis_transaksi,
        jumlah: row.jumlah,
        satuan: row.satuan,
        harga_satuan: row.harga_satuan,
        total_pendapatan: row.total_pendapatan,
        keterangan: row.keterangan,
        created_at: row.created_at,
        updated_at: row.updated_at
      });

      if (row.produk_id) {
        audit.produk = {
          id: row.produk_id,
          nama_produk: row.nama_produk,
          unit: row.unit,
          harga_satuan: row.harga_produk
        };
      }

      res.json(audit.toJSON());
    } catch (error) {
      console.error('Error getting audit data by id:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data audit'
      });
    }
  }

  static async updateAuditData(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const [auditRows] = await db.promise().execute(
        'SELECT * FROM audit_data WHERE id = ?',
        [id]
      );

      if (auditRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Data audit tidak ditemukan'
        });
      }

      const oldAudit = auditRows[0];
      let newTotalPendapatan = 0;
      let produkId = oldAudit.produk_id;
      let sumberPengeluaran = oldAudit.sumber_pengeluaran;

      if (oldAudit.jenis_transaksi === 'penjualan') {
        const { produk_id, jumlah, tanggal, keterangan } = updateData;

        if (!produk_id || !jumlah || !tanggal) {
          return res.status(400).json({
            success: false,
            message: 'Produk ID, jumlah, dan tanggal harus diisi'
          });
        }

        let hargaSatuan;
        if (produk_id !== oldAudit.produk_id) {
          const [produkRows] = await db.promise().execute(
            'SELECT * FROM produk WHERE id = ?',
            [produk_id]
          );

          if (produkRows.length === 0) {
            return res.status(404).json({
              success: false,
              message: 'Produk tidak ditemukan'
            });
          }

          hargaSatuan = produkRows[0].harga_satuan;
          produkId = produk_id;
        } else {
          hargaSatuan = oldAudit.harga_satuan;
        }

        newTotalPendapatan = jumlah * hargaSatuan;

        const stokChange = jumlah - oldAudit.jumlah;

        if (produk_id !== oldAudit.produk_id) {
          await db.promise().execute(
            'UPDATE produk SET stok_tersedia = stok_tersedia + ?, updated_at = NOW() WHERE id = ?',
            [oldAudit.jumlah, oldAudit.produk_id]
          );

          const [newProdukRows] = await db.promise().execute(
            'SELECT stok_tersedia FROM produk WHERE id = ?',
            [produk_id]
          );

          if (newProdukRows[0].stok_tersedia < jumlah) {
            return res.status(400).json({
              success: false,
              message: `Stok tidak mencukupi. Stok tersedia: ${newProdukRows[0].stok_tersedia}`
            });
          }

          await db.promise().execute(
            'UPDATE produk SET stok_tersedia = stok_tersedia - ?, updated_at = NOW() WHERE id = ?',
            [jumlah, produk_id]
          );
        } else {
          if (stokChange > 0) {
            const [produkRows] = await db.promise().execute(
              'SELECT stok_tersedia FROM produk WHERE id = ?',
              [produk_id]
            );

            if (produkRows[0].stok_tersedia < stokChange) {
              return res.status(400).json({
                success: false,
                message: `Stok tidak mencukupi. Stok tersedia: ${produkRows[0].stok_tersedia}`
              });
            }

            await db.promise().execute(
              'UPDATE produk SET stok_tersedia = stok_tersedia - ?, updated_at = NOW() WHERE id = ?',
              [stokChange, produk_id]
            );
          } else if (stokChange < 0) {
            await db.promise().execute(
              'UPDATE produk SET stok_tersedia = stok_tersedia + ?, updated_at = NOW() WHERE id = ?',
              [Math.abs(stokChange), produk_id]
            );
          }
        }

        const updateQuery = `
          UPDATE audit_data
          SET produk_id = ?, tanggal = ?, jumlah = ?, harga_satuan = ?, total_pendapatan = ?, keterangan = ?, updated_at = NOW()
          WHERE id = ?
        `;

        await db.promise().execute(updateQuery, [
          produkId,
          tanggal,
          jumlah,
          hargaSatuan,
          newTotalPendapatan,
          keterangan || '',
          id
        ]);

      } else if (oldAudit.jenis_transaksi === 'pengeluaran') {
        const { sumber_pengeluaran, jumlah, harga_satuan, tanggal, keterangan } = updateData;

        if (!sumber_pengeluaran || !jumlah || harga_satuan === undefined || !tanggal) {
          return res.status(400).json({
            success: false,
            message: 'Sumber pengeluaran, jumlah, harga satuan, dan tanggal harus diisi'
          });
        }

        newTotalPendapatan = jumlah * harga_satuan;
        sumberPengeluaran = sumber_pengeluaran;

        const updateQuery = `
          UPDATE audit_data
          SET sumber_pengeluaran = ?, tanggal = ?, jumlah = ?, harga_satuan = ?, total_pendapatan = ?, keterangan = ?, updated_at = NOW()
          WHERE id = ?
        `;

        await db.promise().execute(updateQuery, [
          sumberPengeluaran,
          tanggal,
          jumlah,
          harga_satuan,
          newTotalPendapatan,
          keterangan || '',
          id
        ]);
      }

      res.json({
        success: true,
        message: 'Data audit berhasil diperbarui'
      });
    } catch (error) {
      console.error('Error updating audit data:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal memperbarui data audit'
      });
    }
  }
}

export default AuditController;
