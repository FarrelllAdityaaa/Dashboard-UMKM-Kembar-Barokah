// Model untuk Audit Data
class AuditData {
  constructor(data) {
    this.id = data.id;
    this.produk_id = data.produk_id;
    this.sumber_pengeluaran = data.sumber_pengeluaran || null; 
    this.tanggal = data.tanggal;
    this.jenis_transaksi = data.jenis_transaksi; 
    this.jumlah = data.jumlah; 
    this.satuan = data.satuan || null; 
    this.harga_satuan = data.harga_satuan;
    this.total_pendapatan = data.total_pendapatan || (data.jumlah * data.harga_satuan); 
    this.keterangan = data.keterangan || '';
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;

    this.produk = data.produk || null;
  }

  static validate(data) {
    const errors = [];

    if (!data.produk_id) {
      errors.push('ID produk tidak boleh kosong');
    }

    if (!data.tanggal) {
      errors.push('Tanggal tidak boleh kosong');
    }

    if (!data.jenis_transaksi || !['penjualan', 'pengeluaran'].includes(data.jenis_transaksi)) {
      errors.push('Jenis transaksi harus "penjualan" atau "pengeluaran"');
    }

    if (!data.jumlah || data.jumlah <= 0) {
      errors.push('Jumlah harus lebih dari 0');
    }

    if (!data.harga_satuan || data.harga_satuan < 0) {
      errors.push('Harga satuan tidak boleh negatif');
    }

    return errors;
  }

  toJSON() {
    return {
      id: this.id,
      produk_id: this.produk_id,
      sumber_pengeluaran: this.sumber_pengeluaran,
      tanggal: this.tanggal,
      jenis_transaksi: this.jenis_transaksi,
      jumlah: this.jumlah,
      satuan: this.satuan,
      harga_satuan: this.harga_satuan,
      total_pendapatan: this.total_pendapatan,
      keterangan: this.keterangan,
      created_at: this.created_at,
      updated_at: this.updated_at,
      produk: this.produk ? {
        id: this.produk.id,
        nama_produk: this.produk.nama_produk,
        unit: this.produk.unit,
        harga_satuan: this.produk.harga_satuan
      } : null
    };
  }
}

export default AuditData;
