import express from "express";
import {
  getAllProduk,
  getProdukById,
  getProdukCustomers,
  createProduk,
  updateProduk,
  deleteProduk,
  uploadMiddleware
} from "../controllers/produkController.js";
import verifyToken from "../middleware/verifyToken.js";

const router = express.Router();

// Semua route produk memerlukan autentikasi
router.use(verifyToken);

// Routes
router.get("/", getAllProduk);
router.get("/:id", getProdukById);
router.get("/:id/customers", getProdukCustomers);
router.post("/", uploadMiddleware, createProduk);
router.put("/:id", uploadMiddleware, updateProduk);
router.delete("/:id", deleteProduk);

export default router;
