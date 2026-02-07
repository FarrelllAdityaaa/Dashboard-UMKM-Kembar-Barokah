// File: src/pages/menuProduk.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import kosong from "../assets/kosong.png";
import garis from "../assets/garis.svg";
import tambah from "../assets/tambah.svg";
import { showSuccessToast, showErrorToast, showConfirmToast } from "../components/Toast";

export default function MenuProduk() {
  // --- State Declaration ---
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();

  // --- Side Effects (Data Fetching) ---
  useEffect(() => {
    // 1. Fungsi Mengambil Data User
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

    // 2. Fungsi Mengambil Data Produk
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const token = localStorage.getItem("token");
        
        const res = await api.get("/produk", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Transformasi data API agar sesuai format frontend
        const transformedProducts = res.data.map((product) => ({
          id: product.id,
          name: product.nama_produk,
          stock: product.stok_tersedia,
          // Gunakan gambar dari DB atau fallback ke gambar 'kosong'
          image: product.gambar || null, 
        }));

        setProducts(transformedProducts);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Gagal memuat data produk");
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
    fetchProducts();
  }, [navigate]);

  // --- Event Handlers ---

  const handleDetail = (product) => {
    // Navigasi ke halaman detail produk
    navigate(`/detailProduk/${product.id}`);
  };

  const handleEditProduk = (product) => {
    // Navigasi ke halaman edit (sebelumnya bernama handleTambahStok)
    navigate(`/produk/edit/${product.id}`);
  };

  const handleTambahProduk = () => {
    // Navigasi ke halaman input produk baru
    navigate("/produk/input");
  };

  const handleDeleteProduk = async (product) => {
    // Tampilkan konfirmasi sebelum hapus
    showConfirmToast(
      `Apakah Anda yakin ingin menghapus produk "${product.name}"?`,
      async () => {
        try {
          const token = localStorage.getItem("token");
          await api.delete(`/produk/${product.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          // Update state lokal setelah berhasil hapus di DB
          setProducts(products.filter((p) => p.id !== product.id));
          showSuccessToast("Produk berhasil dihapus!");
        } catch (error) {
          console.error("Error deleting product:", error);
          showErrorToast("Gagal menghapus produk. Silakan coba lagi.");
        }
      }
    );
  };

  // --- Render UI ---
  return (
    <div className="min-h-screen bg-gray-100 font-poppins">

      {/* 1. Header Section */}
      <div className="pt-4 flex justify-center items-center text-center gap-3">
        <img src={garis} alt="" className="w-[40%]" />
        <h1 className="text-2xl font-bold text-red-900">MENU PRODUK</h1>
        <img src={garis} alt="" className="w-[40%]" />
      </div>

      {/* 2. Main Content (Grid System) */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Loading State */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-900"></div>
            <p className="mt-2 text-gray-600">Memuat produk...</p>
          </div>
        ) : error ? (
          /* Error State */
          <div className="text-center py-8">
            <div className="text-red-500 mb-4">
              <i className="fas fa-exclamation-triangle text-4xl"></i>
            </div>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-900 text-white px-4 py-2 rounded-lg hover:bg-red-800 transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        ) : (
          /* Success State (Data Grid) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Loop Data Produk */}
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-[#FEF8C1] rounded-xl shadow-lg p-3 flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border border-amber-200/50"
              >
                {/* Gambar Produk */}
                <div className="flex justify-center mb-4">
                  <div className="w-full h-60 overflow-hidden rounded-lg">
                    <img
                      src={product.image ? `http://localhost:5000${product.image}` : kosong}
                      alt={product.name}
                      className="w-contain h-full object-cover"
                    />
                  </div>
                </div>

                {/* Info Produk */}
                <h3 className="text-xl font-semibold text-gray-800 text-left">
                  {product.name}
                </h3>
                <div className="flex text-gray-600 mb-4">
                  <span>Sisa Stok: {product.stock}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => handleDetail(product)}
                    className="flex items-center justify-center gap-2 bg-black text-white py-2 px-4 rounded-lg flex-1 hover:from-amber-500 hover:to-amber-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    <span>Detail</span>
                  </button>
                  <button
                    onClick={() => handleEditProduk(product)}
                    className="flex items-center justify-center gap-2 bg-[#004A1C] text-white py-2 px-4 rounded-lg flex-1 hover:from-emerald-500 hover:to-emerald-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteProduk(product)}
                    className="flex items-center justify-center gap-2 bg-red-500 text-white py-2 px-4 rounded-lg hover:from-rose-400 hover:to-rose-500 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            ))}

            {/* Tombol Tambah Produk (Card Statis) */}
            <div className="bg-white rounded-xl shadow-md p-6 flex flex-col transition-all duration-300 hover:shadow-lg">
              <button
                onClick={handleTambahProduk}
                className="flex flex-col items-center justify-center h-full text-gray-700 hover:bg-gray-100 rounded-lg py-8 transition-colors"
              >
                <img
                  src={tambah}
                  alt="Tambah Produk"
                  className="w-32 h-32 mb-4"
                />
                <p className="text-lg font-medium">Tambah Produk</p>
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}