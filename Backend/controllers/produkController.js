import db from "../config/db.js";
import multer from "multer";
import path from "path";
import Produk from "../models/Produk.js";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("File harus berupa gambar"), false);
    }
  },
});

export const uploadMiddleware = upload.single("gambar");

export const getAllProduk = (req, res) => {
  const sql = "SELECT * FROM produk ORDER BY created_at DESC";
  db.query(sql, (err, data) => {
    if (err) return res.status(500).json({ message: "Error mengambil data produk", error: err });

    const produkList = data.map(row => new Produk(row).toJSON());
    res.json(produkList);
  });
};

export const getProdukById = (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM produk WHERE id = ?";
  db.query(sql, [id], (err, data) => {
    if (err) return res.status(500).json({ message: "Error mengambil data produk", error: err });
    if (data.length === 0) return res.status(404).json({ message: "Produk tidak ditemukan" });

    const produk = new Produk(data[0]);
    res.json(produk.toJSON());
  });
};

export const createProduk = (req, res) => {
  const { namaProduk, detailProduk, tanggalProduksi, jumlahProduksi, hargaSatuan } = req.body;
  const gambar = req.file ? req.file.filename : null;

  const validationErrors = Produk.validate({
    nama_produk: namaProduk,
    detail_produk: detailProduk,
    tanggal_produksi: tanggalProduksi,
    jumlah_produksi: parseInt(jumlahProduksi),
    harga_satuan: hargaSatuan ? parseInt(hargaSatuan) : null
  });

  if (validationErrors.length > 0) {
    return res.status(400).json({ message: "Data tidak valid", errors: validationErrors });
  }

  const sql = "INSERT INTO produk (nama_produk, detail_produk, tanggal_produksi, jumlah_produksi, stok_tersedia, harga_satuan, gambar) VALUES (?, ?, ?, ?, ?, ?, ?)";
  db.query(sql, [namaProduk, detailProduk, tanggalProduksi, jumlahProduksi, jumlahProduksi, hargaSatuan || null, gambar], (err, result) => {
    if (err) return res.status(500).json({ message: "Error menambahkan produk", error: err });

    res.json({
      message: "Produk berhasil ditambahkan",
      id: result.insertId,
      produk: {
        id: result.insertId,
        nama_produk: namaProduk,
        detail_produk: detailProduk,
        tanggal_produksi: tanggalProduksi,
        jumlah_produksi: jumlahProduksi,
        stok_tersedia: jumlahProduksi,
        harga_satuan: hargaSatuan,
        gambar: gambar ? `/uploads/${gambar}` : null
      }
    });
  });
};

export const updateProduk = (req, res) => {
  const { id } = req.params;
  const { namaProduk, detailProduk, hargaSatuan, stokTersedia } = req.body;
  const gambar = req.file ? req.file.filename : null;

  if (!namaProduk) {
      return res.status(400).json({ message: "Nama produk wajib diisi" });
  }

  let sql, values;
  if (gambar) {
    sql = "UPDATE produk SET nama_produk = ?, detail_produk = ?, harga_satuan = ?, stok_tersedia = ?, gambar = ? WHERE id = ?";
    values = [namaProduk, detailProduk, parseInt(hargaSatuan) || null, parseInt(stokTersedia) || null, gambar, id];
  } else {
    sql = "UPDATE produk SET nama_produk = ?, detail_produk = ?, harga_satuan = ?, stok_tersedia = ? WHERE id = ?";
    values = [namaProduk, detailProduk, parseInt(hargaSatuan) || null, parseInt(stokTersedia) || null, id];
  }

  db.query(sql, values, (err, result) => {
    if (err) return res.status(500).json({ message: "Error memperbarui produk", error: err });
    if (result.affectedRows === 0) return res.status(404).json({ message: "Produk tidak ditemukan" });

    res.json({
      message: "Produk berhasil diperbarui",
      produk: {
        id: parseInt(id),
        nama_produk: namaProduk,
        detail_produk: detailProduk,
        harga_satuan: hargaSatuan,
        stok_tersedia: stokTersedia,
        gambar: gambar ? `/uploads/${gambar}` : null
      }
    });
  });
};

export const getProdukCustomers = (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT c.id, c.nama, c.alamat, c.produk
    FROM customers c
    WHERE c.produk_id = ?
    ORDER BY c.created_at DESC
  `;
  db.query(sql, [id], (err, data) => {
    if (err) return res.status(500).json({ message: "Error mengambil data customers", error: err });

    const customers = data.map(row => ({
      id: row.id,
      nama: row.nama,
      produk: row.produk,
      alamat: row.alamat
    }));
    res.json(customers);
  });
};

export const deleteProduk = (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM produk WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ message: "Error menghapus produk", error: err });
    if (result.affectedRows === 0) return res.status(404).json({ message: "Produk tidak ditemukan" });
    res.json({ message: "Produk berhasil dihapus" });
  });
};
