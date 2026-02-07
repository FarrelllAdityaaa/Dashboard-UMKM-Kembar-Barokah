// File: src/pages/tambahProduk.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../layout/navbar";
import api from "../api";
import kosong from "../assets/kosong.png";
import garis from "../assets/garis.svg";
import { showSuccessToast, showErrorToast } from "../components/Toast";

export default function InputProduk() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    namaProduk: "",
    detailProduk: "",
    tanggalProduksi: "",
    jumlahProduksi: "",
    hargaSatuan: "",
    gambar: null
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [fileName, setFileName] = useState("Tidak Ada Gambar");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // 1. Fetch User (Auth Check)
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/");
            return;
        }
        const res = await api.get("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch (err) {
        console.error("Auth Error:", err);
        localStorage.removeItem("token");
        navigate("/");
      }
    };
    fetchUser();
  }, [navigate]);

  // 2. Handle Input Change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 3. Handle Image Upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validasi Ukuran (500KB)
      if (file.size > 500 * 1024) {
        showErrorToast("Ukuran gambar melebihi 500KB. Silakan pilih gambar yang lebih kecil.");
        return;
      }

      // Validasi Tipe File
      if (!file.type.startsWith('image/')) {
        showErrorToast("File harus berupa gambar (JPG, PNG, dsb).");
        return;
      }

      setFormData(prev => ({
        ...prev,
        gambar: file
      }));

      setFileName(file.name);

      // Preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({
      ...prev,
      gambar: null
    }));
    setPreviewImage(null);
    setFileName("Tidak Ada Gambar");
    // Reset input file value agar bisa upload file yang sama lagi jika dihapus
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = "";
  };

  // 4. Handle Submit (Simpan Produk)
  const handleSubmit = async (e) => {
    e.preventDefault(); // Mencegah reload halaman
    
    // Validasi Input Wajib
    if (!formData.namaProduk || !formData.hargaSatuan || !formData.jumlahProduksi) {
        showErrorToast("Mohon lengkapi semua data yang wajib diisi.");
        return;
    }

    setIsLoading(true);

    try {
      const submitData = new FormData();
      submitData.append('namaProduk', formData.namaProduk);
      submitData.append('detailProduk', formData.detailProduk);
      submitData.append('tanggalProduksi', formData.tanggalProduksi);
      submitData.append('jumlahProduksi', formData.jumlahProduksi);
      // Bersihkan format harga (hapus titik/koma) sebelum kirim ke API
      const hargaBersih = formData.hargaSatuan.toString().replace(/[^\d]/g, '');
      submitData.append('hargaSatuan', hargaBersih);
      
      if (formData.gambar) {
        submitData.append('gambar', formData.gambar);
      }

      const token = localStorage.getItem("token");

      await api.post("/produk", submitData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      showSuccessToast("Produk berhasil ditambahkan!");
      // Navigasi ke Menu Produk (Gunakan path yang benar sesuai router Anda)
      navigate("/menu-produk"); 

    } catch (error) {
      console.error("Error adding product:", error);
      const errorMsg = error.response?.data?.message || "Gagal menambahkan produk. Silakan coba lagi.";
      showErrorToast(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/menu-produk"); // Pastikan konsisten dengan handleSubmit
  };

  return (
    <div className="min-h-screen bg-gray-100 font-poppins">
      
      {/* Navbar opsional jika diperlukan di halaman ini, atau sudah ada di layout utama */}
      <Navbar username={user ? user.username : "User"} />

      {/* Header Section */}
      <div className="pt-6 flex justify-center items-center text-center gap-3">
        <img src={garis} alt="" className="w-[30%]" />
        <h1 className="text-2xl font-bold text-red-900">
          INPUT PRODUK
        </h1>
        <img src={garis} alt="" className="w-[30%]" />
      </div>

      {/* Form Section */}
      <div className="max-w-2xl mx-auto px-4 py-8 mb-20">
        <div className="bg-white rounded-xl shadow-md p-8">
          <form onSubmit={handleSubmit}>
            
            {/* Image Upload Section - Responsive Fix */}
            <div className="mb-8 flex flex-col md:flex-row items-center gap-6 justify-center">
              {/* Kotak Preview */}
              <div className="flex-shrink-0 w-32 h-32 md:w-24 md:h-24 bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center overflow-hidden relative group">
                <img
                  src={previewImage || kosong}
                  alt="Preview"
                  className="w-full h-full object-cover rounded-lg border border-gray-300"
                />
              </div>

              {/* Tombol Upload */}
              <div className="w-full md:w-auto flex flex-col items-center md:items-start">
                <label className="block text-sm font-medium text-gray-700 mb-2 text-center md:text-left">
                  Unggah gambar produk, maks 500kb
                </label>
                
                <div className="flex gap-3 items-center w-full max-w-xs p-2 bg-gray-50 rounded-lg border border-gray-200">
                  <label className="cursor-pointer flex-shrink-0">
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                    <div className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors text-sm">
                      Unggah
                    </div>
                  </label>

                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex-1 min-w-0 truncate text-sm text-left"
                    title={fileName}
                  >
                    {fileName}
                  </button>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              
              {/* Nama Produk */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Produk <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="namaProduk"
                  value={formData.namaProduk}
                  onChange={handleInputChange}
                  placeholder="Contoh: Keripik Bawang"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow"
                  required
                />
              </div>

              {/* Detail Produk */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Detail Produk
                </label>
                <textarea
                  name="detailProduk"
                  value={formData.detailProduk}
                  onChange={handleInputChange}
                  placeholder="Deskripsi singkat produk..."
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none transition-shadow"
                />
              </div>

              {/* Tanggal & Jumlah */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tanggal Produksi
                  </label>
                  <input
                    type="date"
                    name="tanggalProduksi"
                    value={formData.tanggalProduksi}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jumlah Produksi/Stok <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="jumlahProduksi"
                    value={formData.jumlahProduksi}
                    onChange={handleInputChange}
                    placeholder="0"
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow"
                    required
                  />
                </div>
              </div>

              {/* Harga Satuan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Harga Satuan (Rp) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="hargaSatuan"
                  // Menampilkan format Rupiah saat diketik
                  value={formData.hargaSatuan ? Number(formData.hargaSatuan.toString().replace(/[^\d]/g, '')).toLocaleString('id-ID') : ''}
                  onChange={(e) => {
                    // Hanya ambil angka
                    const value = e.target.value.replace(/[^\d]/g, '');
                    setFormData(prev => ({
                      ...prev,
                      hargaSatuan: value
                    }));
                  }}
                  placeholder="Masukkan harga satuan"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow"
                  required
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-3 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors focus:ring-2 focus:ring-gray-400 focus:outline-none"
                disabled={isLoading}
              >
                Batal
              </button>
              <button
                type="submit"
                className={`px-6 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center gap-2 focus:ring-2 focus:ring-green-400 focus:outline-none ${
                    isLoading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    Simpan Produk
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}