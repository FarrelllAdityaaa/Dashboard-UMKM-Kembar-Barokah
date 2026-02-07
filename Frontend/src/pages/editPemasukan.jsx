// File: src/pages/editPemasukan.jsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";
import garis from "../assets/garis.svg";
import { showSuccessToast, showErrorToast } from "../components/Toast";

export default function EditPemasukan() {
  const [user, setUser] = useState(null);
  const [produkList, setProdukList] = useState([]);
  const [formData, setFormData] = useState({
    produk_id: "",
    jumlah: "",
    tanggal: "",
    keterangan: ""
  });
  const [selectedProduk, setSelectedProduk] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await api.get("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch (err) {
        localStorage.removeItem("token");
        navigate("/");
      }
    };
    fetchUser();
  }, [navigate]);

  useEffect(() => {
    fetchProduk();
    fetchAuditData();
  }, []);

  const fetchProduk = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/produk", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProdukList(res.data);
    } catch (error) {
      console.error("Error fetching produk:", error);
    }
  };

  const fetchAuditData = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get(`/audit/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data;
      setFormData({
        produk_id: data.produk_id || "",
        jumlah: data.jumlah || "",
        tanggal: data.tanggal ? data.tanggal.split('T')[0] : "",
        keterangan: data.keterangan || ""
      });
      if (data.produk_id) {
        const produk = produkList.find(p => p.id == data.produk_id);
        setSelectedProduk(produk);
      }
    } catch (error) {
      console.error("Error fetching audit data:", error);
      showErrorToast("Gagal memuat data audit");
    }
  };

  const handleProdukChange = (e) => {
    const produkId = e.target.value;
    const produk = produkList.find(p => p.id == produkId);
    setSelectedProduk(produk);
    setFormData(prev => ({
      ...prev,
      produk_id: produkId
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await api.put(`/audit/${id}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      showSuccessToast("Data pemasukan berhasil diperbarui!");
      navigate("/auditdata");
    } catch (error) {
      console.error("Error updating pemasukan:", error);
      showErrorToast("Gagal memperbarui data pemasukan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-100 font-poppins">
      {/* Welcome Section */}
      <div className="pt-4 flex justify-center items-center text-center gap-3">
        <img src={garis} alt="" className="w-[40%]" />
        <h1 className="text-2xl font-bold text-red-900">
          EDIT PEMASUKAN
        </h1>
        <img src={garis} alt="" className="w-[40%]" />
      </div>

      <div className="flex justify-center p-4">
        <div className="max-w-2xl mt-10 mx-auto bg-white rounded-xl shadow-md p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Produk</label>
              <select
                name="produk_id"
                value={formData.produk_id}
                onChange={handleProdukChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">Pilih Produk</option>
                {produkList.map(produk => (
                  <option key={produk.id} value={produk.id}>
                    {produk.nama_produk} - {formatCurrency(produk.harga_satuan)}/{produk.unit}
                  </option>
                ))}
              </select>
            </div>

            {selectedProduk && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-2">Detail Produk</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Harga Satuan:</span>
                    <p className="text-green-600 font-semibold">{formatCurrency(selectedProduk.harga_satuan)}</p>
                  </div>
                  <div>
                    <span className="font-medium">Satuan:</span>
                    <p>{selectedProduk.unit}</p>
                  </div>
                  <div>
                    <span className="font-medium">Stok Tersedia:</span>
                    <p>{selectedProduk.stok_tersedia} {selectedProduk.unit}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah Terjual</label>
                <input
                  type="number"
                  name="jumlah"
                  value={formData.jumlah}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Masukkan jumlah"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Penjualan</label>
                <input
                  type="date"
                  name="tanggal"
                  value={formData.tanggal}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Keterangan (Opsional)</label>
              <textarea
                name="keterangan"
                value={formData.keterangan}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Tambahkan keterangan jika diperlukan"
                rows="3"
              />
            </div>

            {selectedProduk && formData.jumlah && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-2">Total Pendapatan</h3>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(selectedProduk.harga_satuan * parseInt(formData.jumlah || 0))}
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate("/auditdata")}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                disabled={isLoading}
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save"></i>
                    Simpan Perubahan
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