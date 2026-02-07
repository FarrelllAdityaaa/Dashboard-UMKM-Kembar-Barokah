// Model untuk Customer
class Customer {
  constructor(data) {
    this.id = data.id;
    this.nama = data.nama;
    this.produk_id = data.produk_id;
    this.alamat = data.alamat;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static validate(data) {
    const errors = [];

    if (!data.nama || data.nama.trim().length === 0) {
      errors.push('Nama customer tidak boleh kosong');
    }

    if (!data.produk_id || isNaN(data.produk_id)) {
      errors.push('Produk ID harus valid');
    }

    if (!data.alamat || data.alamat.trim().length === 0) {
      errors.push('Alamat tidak boleh kosong');
    }

    return errors;
  }

  // Method untuk format response
  toJSON() {
    return {
      id: this.id,
      nama: this.nama,
      produk_id: this.produk_id,
      alamat: this.alamat,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

export default Customer;
