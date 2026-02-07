// File: src/pages/editPengeluaran.jsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";
import garis from "../assets/garis.svg";
import { showSuccessToast, showErrorToast } from "../components/Toast";

export default function EditPengeluaran() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    sumber_pengeluaran: "",
    jumlah: "",
    harga_satuan: "",
    tanggal: "",
    keterangan: ""
  });
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
    fetchAuditData();
  }, []);

  const fetchAuditData = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get(`/audit/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data;
      setFormData({
        sumber_pengeluaran: data.sumber_pengeluaran || "",
        jumlah: data.jumlah || "",
        harga_satuan: data.harga_satuan || "",
        tanggal: data.tanggal ? data.tanggal.split('T')[0] : "",
        keterangan: data.keterangan || ""
      });
    } catch (error) {
      console.error("Error fetching audit data:", error);
      showErrorToast("Gagal memuat data audit");
    }
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

      showSuccessToast("Data pengeluaran berhasil diperbarui!");
      navigate("/auditdata");
    } catch (error) {
      console.error("Error updating pengeluaran:", error);
      showErrorToast("Gagal memperbarui data pengeluaran. Silakan coba lagi.");
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
          EDIT PENGELUARAN
        </h1>
        <img src={garis} alt="" className="w-[40%]" />
      </div>

      <div className="flex justify-center p-4">
        <div className="max-w-2xl mt-10 mx-auto bg-white rounded-xl shadow-md p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sumber Pengeluaran</label>
              <input
                type="text"
                name="sumber_pengeluaran"
                value={formData.sumber_pengeluaran}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Masukkan sumber pengeluaran (contoh: Listrik, Air, Bahan Baku, dll)"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah</label>
                <input
                  type="number"
                  name="jumlah"
                  value={formData.jumlah}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Masukkan jumlah"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Harga Satuan</label>
                <input
                  type="number"
                  name="harga_satuan"
                  value={formData.harga_satuan}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Masukkan harga satuan"
                  min="0"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Pengeluaran</label>
              <input
                type="date"
                name="tanggal"
                value={formData.tanggal}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Keterangan (Opsional)</label>
              <textarea
                name="keterangan"
                value={formData.keterangan}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Tambahkan keterangan jika diperlukan"
                rows="3"
              />
            </div>

            {formData.jumlah && formData.harga_satuan && (
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-2">Total Pengeluaran</h3>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(parseInt(formData.jumlah || 0) * parseInt(formData.harga_satuan || 0))}
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
                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
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