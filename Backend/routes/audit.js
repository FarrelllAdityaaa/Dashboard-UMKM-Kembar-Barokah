  import express from 'express';
import AuditController from '../controllers/auditController.js';
import verifyToken from '../middleware/verifyToken.js';

const router = express.Router();

// Semua route audit memerlukan autentikasi
router.use(verifyToken);

// Route untuk mendapatkan semua data audit
router.get('/', AuditController.getAllAuditData);

// Route untuk menambah data penjualan (pemasukan)
router.post('/penjualan', AuditController.addPenjualan);

// Route untuk menambah data pengeluaran
router.post('/pengeluaran', AuditController.addPengeluaran);

// Route untuk menghapus data audit
router.delete('/:id', AuditController.deleteAuditData);

// Route untuk mendapatkan data audit berdasarkan produk
router.get('/produk/:produk_id', AuditController.getAuditByProduct);

// Route untuk mendapatkan data audit berdasarkan ID
router.get('/:id', AuditController.getAuditDataById);

// Route untuk mengupdate data audit
router.put('/:id', AuditController.updateAuditData);

export default router;
