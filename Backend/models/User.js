// Model untuk User
class User {
  constructor(data) {
    this.id = data.id;
    this.username = data.username;
    this.password = data.password; // Dalam praktik nyata, password tidak boleh disimpan di model
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Method untuk validasi data registrasi
  static validateRegister(data) {
    const errors = [];

    if (!data.username || data.username.trim().length === 0) {
      errors.push('Username tidak boleh kosong');
    }

    if (!data.password || data.password.length < 6) {
      errors.push('Password minimal 6 karakter');
    }

    return errors;
  }

  // Method untuk validasi data login
  static validateLogin(data) {
    const errors = [];

    if (!data.username || data.username.trim().length === 0) {
      errors.push('Username tidak boleh kosong');
    }

    if (!data.password || data.password.trim().length === 0) {
      errors.push('Password tidak boleh kosong');
    }

    return errors;
  }

  // Method untuk format response (tanpa password)
  toJSON() {
    return {
      id: this.id,
      username: this.username,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  // Method untuk format response lengkap (untuk admin)
  toFullJSON() {
    return {
      id: this.id,
      username: this.username,
      password: this.password, // Hati-hati: jangan expose password di production
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

export default User;
