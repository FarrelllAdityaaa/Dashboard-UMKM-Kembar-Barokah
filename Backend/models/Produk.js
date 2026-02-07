// Model untuk Produk
class Produk {
  constructor(data) {
    this.id = data.id;
    this.nama_produk = data.nama_produk;
    this.detail_produk = data.detail_produk;
    this.tanggal_produksi = data.tanggal_produksi;
    this.jumlah_produksi = data.jumlah_produksi;
    this.stok_tersedia = data.stok_tersedia || 0;
    this.harga_satuan = data.harga_satuan;
    this.unit = data.unit || 'Pcs';
    this.gambar = data.gambar;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static validate(data) {
    const errors = [];

    if (!data.nama_produk || data.nama_produk.trim().length === 0) {
      errors.push('Nama produk tidak boleh kosong');
    }

    if (!data.detail_produk || data.detail_produk.trim().length === 0) {
      errors.push('Detail produk tidak boleh kosong');
    }

    if (!data.tanggal_produksi) {
      errors.push('Tanggal produksi tidak boleh kosong');
    }

    if (!data.jumlah_produksi || data.jumlah_produksi <= 0) {
      errors.push('Jumlah produksi harus lebih dari 0');
    }

    return errors;
  }

  // Method untuk format response
  toJSON() {
    return {
      id: this.id,
      nama_produk: this.nama_produk,
      detail_produk: this.detail_produk,
      tanggal_produksi: this.tanggal_produksi,
      jumlah_produksi: this.jumlah_produksi,
      stok_tersedia: this.stok_tersedia,
      harga_satuan: this.harga_satuan,
      unit: this.unit,
      gambar: this.gambar ? `/uploads/${this.gambar}` : null,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

export default Produk;
