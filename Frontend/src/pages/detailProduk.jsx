// File: src/pages/DetailProduk.jsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";
import kosong from "../assets/kosong.png";
import garis from "../assets/garis.svg";
import editIcon from "../assets/edit.svg";
import deleteIcon from "../assets/delete.svg";
import { showSuccessToast, showErrorToast, showConfirmToast } from "../components/Toast";

// --- Constants / Fallback Data ---
const initialProdukData = {
  id: 0,
  name: "Memuat...",
  description: "Sedang memuat data produk...",
  image: kosong,
  stock: 0,
  price: "Rp 0",
  unit: "Pcs"
};

export default function DetailProduk() {
  // --- State Management ---
  const [user, setUser] = useState(null);
  const [produk, setProduk] = useState(initialProdukData);
  const [customers, setCustomers] = useState([]); 
  
  // --- Hooks ---
  const navigate = useNavigate();
  const { id } = useParams();

  // --- Side Effects (Data Fetching) ---
  useEffect(() => {
    // 1. Verifikasi User (Auth Check)
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

    // 2. Ambil Detail Produk
    const fetchProduk = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await api.get(`/produk/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Normalisasi Data (Backend -> Frontend format)
        const transformedProduk = {
          id: res.data.id,
          name: res.data.nama_produk,
          description: res.data.detail_produk || "Tidak ada deskripsi.",
          image: res.data.gambar ? `http://localhost:5000${res.data.gambar}` : kosong,
          stock: res.data.stok_tersedia,
          price: res.data.harga_satuan ? `Rp ${parseInt(res.data.harga_satuan).toLocaleString('id-ID')}` : "Rp 0",
          unit: res.data.unit || "Pcs"
        };
        setProduk(transformedProduk);
      } catch (err) {
        console.error("Error fetching produk:", err);
      }
    };

    // 3. Ambil Daftar Customer Terkait Produk Ini
    const fetchCustomers = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await api.get(`/customer/produk/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCustomers(res.data);
      } catch (err) {
        console.error("Error fetching customers:", err);
        setCustomers([]);
      }
    };

    // Eksekusi fungsi
    fetchUser();
    if (id) {
      fetchProduk();
      fetchCustomers();
    }

  }, [navigate, id]);

  // --- Event Handlers (Produk) ---
  const handleEditProduk = () => {
    navigate(`/produk/edit/${id}`);
  };

  // --- Event Handlers (Customer) ---
  const handleAddCostumer = () => {
    navigate(`/produk/add-customer/${id}`);
  };

  const handleEditCustomer = (customerId) => {
    navigate(`/produk/customer/edit/${customerId}`);
  };

  const handleDeleteCustomer = async (customerId) => {
    showConfirmToast(
      "Apakah Anda yakin ingin menghapus customer ini?",
      async () => {
        try {
          const token = localStorage.getItem("token");
          await api.delete(`/customer/${customerId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          // Update state lokal (optimistic update)
          setCustomers(customers.filter(customer => customer.id !== customerId));
          showSuccessToast("Customer berhasil dihapus!");
        } catch (err) {
          console.error("Error deleting customer:", err);
          showErrorToast("Gagal menghapus customer. Silakan coba lagi.");
        }
      }
    );
  };

  // --- Render UI ---
  return (
    <div className="min-h-screen bg-gray-100 font-poppins pb-20">
      
      {/* 1. Header Section */}
      <div className="pt-4 flex justify-center items-center text-center gap-3">
        <img src={garis} alt="" className="w-[30%]" />
        <h1 className="text-2xl font-bold text-red-900">DETAIL PRODUK</h1>
        <img src={garis} alt="" className="w-[30%]" />
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        
        {/* 2. Product Detail Card */}
        <div className="bg-[#FEF8C1] rounded-xl shadow-md p-8 mb-8 border border-yellow-200">
          <div className="flex flex-col lg:flex-row gap-10 items-center lg:items-start">
            
            {/* A. Product Image */}
            <div className="flex-shrink-0">
              <div className="w-64 h-64 rounded-full overflow-hidden border-4 border-white shadow-lg bg-white flex items-center justify-center">
                 <img
                   src={produk.image}
                   alt={produk.name}
                   className="w-full h-full object-cover"
                   onError={(e) => { e.target.onerror = null; e.target.src = kosong; }}
                 />
              </div>
            </div>

            {/* B. Product Info */}
            <div className="flex-grow w-full">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-3xl font-bold text-gray-800">{produk.name}</h2>
                <button
                  onClick={handleEditProduk}
                  className="bg-black hover:bg-gray-800 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-md"
                >
                  <img src={editIcon} className="w-4 h-4 invert brightness-0 invert" alt="" /> 
                  Edit
                </button>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Deskripsi Produk</h3>
                <p className="text-gray-700 leading-relaxed text-justify bg-white/50 p-4 rounded-lg border border-yellow-100">
                  {produk.description}
                </p>
              </div>

              {/* Stock and Price Grid */}
              <div className="grid grid-cols-2 gap-6 mb-2">
                <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
                  <p className="text-sm text-gray-500 font-medium">Stok Tersedia</p>
                  <p className="text-xl font-bold text-gray-800">{produk.stock} <span className="text-sm font-normal text-gray-500">{produk.unit}</span></p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
                  <p className="text-sm text-gray-500 font-medium">Harga Satuan</p>
                  <p className="text-xl font-bold text-green-600">{produk.price}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Customers Section (Table) */}
        <div className="bg-white rounded-xl shadow-md p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 border-l-4 border-red-500 pl-3">DETAIL CUSTOMERS</h2>
            <button
              onClick={handleAddCostumer}
              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg font-medium transition-colors"
            >
              +
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-center border-collapse">
              <thead className="bg-gray-100 text-gray-600 uppercase text-xs tracking-wide">
                <tr>
                  <th className="py-3 px-4 font-semibold border-b w-16">No</th>
                  <th className="py-3 px-4 font-semibold border-b text-left">Nama Pelanggan</th>
                  <th className="py-3 px-4 font-semibold border-b">Jenis Produk</th>
                  <th className="py-3 px-4 font-semibold border-b">Alamat Pelanggan</th>
                  <th className="py-3 px-4 font-semibold border-b w-32">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {customers.map((customer, index) => (
                  <tr key={customer.id} className="hover:bg-gray-50 border-b last:border-0 transition-colors">
                    <td className="py-3 px-4">{index + 1}</td>
                    <td className="py-3 px-4 font-medium text-gray-800 text-left">{customer.nama}</td>
                    <td className="py-3 px-4">
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                            {produk.name}
                        </span>
                    </td>
                    
                    {/* Kolom Alamat dengan Ikon SVG Inline */}
                    <td className="py-3 px-4 text-left">
                      <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-sm text-gray-700 break-words max-w-[300px]">
                            {customer.alamat}
                        </span>
                      </div>
                    </td>

                    {/* Kolom Aksi (Edit/Hapus) */}
                    <td className="py-3 px-4">
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={() => handleEditCustomer(customer.id)}
                            className="text-blue-500 hover:text-blue-700 transition-transform hover:scale-110"
                            title="Edit"
                          >
                            <img src={editIcon} alt="Edit" className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCustomer(customer.id)}
                            className="text-red-500 hover:text-red-700 transition-transform hover:scale-110"
                            title="Hapus"
                          >
                            <img src={deleteIcon} alt="Delete" className="w-5 h-5" />
                          </button>
                        </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {customers.length === 0 && (
            <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-b-lg border-t border-gray-100">
              <p className="text-lg">Tidak ada data customers untuk produk ini</p>
            </div>
          )}
        </div>

        {/* 4. Footer Actions (Back Button) */}
        <div className="flex justify-end mt-8">
          <button
            onClick={() => navigate("/menu-produk")}
            className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-2.5 rounded-lg font-medium transition-colors shadow-md flex items-center gap-2"
          >
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
             Kembali ke Menu
          </button>
        </div>
      </div>
    </div>
  );
}