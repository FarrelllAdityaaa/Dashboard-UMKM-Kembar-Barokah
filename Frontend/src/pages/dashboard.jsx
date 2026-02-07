import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../layout/navbar";
import api from "../api";

// Import Assets
import searchIcon from "../assets/search.svg";
import pemasukanIcon from "../assets/pemasukan.svg";
import pengeluaranIcon from "../assets/pengeluaran.svg";
import profitIcon from "../assets/profit.svg";
import garis from "../assets/garis.svg";

// Import Charts
import PieChart from "../components/PieChart";
import BarChart from "../components/BarChart";

export default function Beranda() {
  const [user, setUser] = useState(null);
  const [auditData, setAuditData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // State Summary
  const [summary, setSummary] = useState({
    totalPendapatan: 0,
    diffPendapatan: 0,
    totalPengeluaran: 0,
    diffPengeluaran: 0,
    totalProfit: 0,
    diffProfit: 0,
    mingguData: ""
  });

  // State Charts & Table
  const [chartRefDate, setChartRefDate] = useState(null); 
  const [filteredTableData, setFilteredTableData] = useState([]);

  const navigate = useNavigate();

  // --- FORMATTERS ---
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(amount);
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const userRes = await api.get("/auth/me", { headers: { Authorization: `Bearer ${token}` } });
        setUser(userRes.data);

        const auditRes = await api.get("/audit", { headers: { Authorization: `Bearer ${token}` } });
        setAuditData(auditRes.data.data);

      } catch (err) {
        console.error("Error fetching data:", err);
        localStorage.removeItem("token");
        navigate("/"); 
      }
    };
    fetchData();
  }, [navigate]);

  // --- PROCESS DATA ---
  useEffect(() => {
    if (auditData.length > 0) {
      processDashboardData();
      filterTableData();
    }
  }, [auditData]);

  useEffect(() => {
    filterTableData();
  }, [searchTerm]);


  // --- LOGIKA UTAMA ---
  const processDashboardData = () => {
    if (!auditData || auditData.length === 0) return;

    // 1. Sorting Data (Data terbaru di index 0)
    const sortedData = [...auditData].sort((a, b) => {
        const dateA = new Date(a.tanggal).getTime() || 0;
        const dateB = new Date(b.tanggal).getTime() || 0;
        return dateB - dateA;
    });

    const latestDataDate = new Date(sortedData[0].tanggal);

    // 2. Cari Hari Senin dari MINGGU TERBARU
    const currentWeekMonday = new Date(latestDataDate);
    const day = currentWeekMonday.getDay() || 7; 
    if (day !== 1) currentWeekMonday.setDate(currentWeekMonday.getDate() - (day - 1));
    currentWeekMonday.setHours(0, 0, 0, 0);

    // 3. TENTUKAN PERIODE AUDIT TERAKHIR
    const auditStartWeek = new Date(currentWeekMonday);
    auditStartWeek.setDate(auditStartWeek.getDate() - 7); 
    
    const auditEndWeek = new Date(auditStartWeek);
    auditEndWeek.setDate(auditStartWeek.getDate() + 6);   
    auditEndWeek.setHours(23, 59, 59, 999);

    // Simpan tanggal acuan untuk Charts (Bar & Pie) ke state
    setChartRefDate(auditStartWeek);

    // 4. Tentukan Range Minggu Sebelumnya Lagi
    const prevStartWeek = new Date(auditStartWeek);
    prevStartWeek.setDate(prevStartWeek.getDate() - 7);
    
    const prevEndWeek = new Date(auditEndWeek);
    prevEndWeek.setDate(prevEndWeek.getDate() - 7);

    // Helper: Cek Range
    const isInRange = (dateStr, start, end) => {
        const d = new Date(dateStr).getTime();
        return d >= start.getTime() && d <= end.getTime();
    };

    // Filter Data Scorecard
    const thisWeekData = auditData.filter(item => isInRange(item.tanggal, auditStartWeek, auditEndWeek));
    const prevWeekData = auditData.filter(item => isInRange(item.tanggal, prevStartWeek, prevEndWeek));

    // --- FUNGSI HITUNG TOTAL ---
    const calcTotal = (data, type) => {
        return data.filter(item => {
            const t = (item.jenis_transaksi || '').toLowerCase().trim(); 
            
            if (type === 'pemasukan') {
                return t === 'pemasukan' || t === 'penjualan';
            }
            
            if (type === 'pengeluaran') {
                return t.includes('pengeluaran') || item.produk_id === null;
            }
            return false;
        }).reduce((sum, item) => {
            const val = Number(item.total_pendapatan) || 0;
            return sum + Math.abs(val);
        }, 0);
    };

    // Hitung Nilai Scorecard
    const currPendapatan = calcTotal(thisWeekData, 'pemasukan');
    const currPengeluaran = calcTotal(thisWeekData, 'pengeluaran');
    const currProfit = currPendapatan - currPengeluaran;

    const prevPendapatan = calcTotal(prevWeekData, 'pemasukan');
    const prevPengeluaran = calcTotal(prevWeekData, 'pengeluaran');
    const prevProfit = prevPendapatan - prevPengeluaran;

    const formatHeaderDate = (date) => {
        return date.toLocaleDateString('id-ID', { 
            day: 'numeric', month: 'long', year: 'numeric' 
        });
    };
    
    const startStr = formatHeaderDate(auditStartWeek);
    const endStr = formatHeaderDate(auditEndWeek);

    setSummary({
      totalPendapatan: currPendapatan,
      diffPendapatan: currPendapatan - prevPendapatan,
      totalPengeluaran: currPengeluaran,
      diffPengeluaran: currPengeluaran - prevPengeluaran,
      totalProfit: currProfit,
      diffProfit: currProfit - prevProfit,
      mingguData: `${startStr} - ${endStr}`
    });
  };

  // --- FILTER DATA TABEL ---
  const filterTableData = () => {
      const filtered = auditData.filter(item => {
          const pName = item.produk?.nama_produk || '';
          const sumber = item.sumber_pengeluaran || '';
          const combinedSearch = (pName + sumber + item.jenis_transaksi).toLowerCase();
          return combinedSearch.includes(searchTerm.toLowerCase());
      });
      filtered.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
      setFilteredTableData(filtered);
  };

  // --- KOMPONEN SUMMARY CARD ---
  const SummaryCard = ({ title, value, diff, icon, baseColor, borderColor, forceRed }) => {
    const isPositive = diff > 0;
    const isNegative = diff < 0;
    const isNeutral = diff === 0;

    let badgeClass = "text-gray-500 bg-gray-100";
    if (isPositive) badgeClass = "text-green-700 bg-green-100";
    else if (isNegative) badgeClass = "text-red-700 bg-red-100";
    if (forceRed && !isNeutral) badgeClass = "text-red-700 bg-red-100";

    let sign = "";
    let iconTrend = null;
    if (isPositive) {
        sign = "+";
        iconTrend = <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>;
    } else if (isNegative) {
        sign = "-";
        iconTrend = <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>;
    }

    return (
      <div className={`bg-white rounded-xl shadow-sm p-6 border-l-4 ${borderColor} flex items-center justify-between hover:shadow-md transition w-full md:w-[30%]`}>
         <div>
            <p className={`text-sm font-semibold ${baseColor}`}>{title}</p>
            <h3 className="text-2xl font-bold text-gray-800">{formatCurrency(value)}</h3>
            
            <div className={`inline-flex items-center gap-1 text-[10px] font-bold mt-2 px-2 py-0.5 rounded-full ${badgeClass}`}>
                <span>{sign}{formatCurrency(Math.abs(diff))}</span>
                {iconTrend}
                {isNeutral && <span>Stabil</span>}
            </div>
         </div>
         
         <div className={`p-3 rounded-full ${
            baseColor.includes('green') ? 'bg-green-100' : 
            baseColor.includes('red') ? 'bg-red-100' : 'bg-blue-100'
         }`}>
            <img src={icon} alt="Icon" className="w-6 h-6" />
         </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 font-poppins pb-20">
      <Navbar username={user ? user.username : "User"} />

      {/* --- Header --- */}
      <div className="pt-6 pb-4 flex justify-center items-center text-center gap-3">
        <img src={garis} alt="" className="w-[30%]" />
        <div className="text-center">
            <h1 className="text-2xl font-bold text-red-900 tracking-wide">SELAMAT DATANG</h1>
            <h2 className="text-lg font-bold text-[#D8A400] mt-1">UMKM KEMBAR BAROKAH</h2>
            {summary.mingguData && (
                <p className="text-xs text-gray-500 mt-1 font-medium bg-white px-3 py-1 rounded-full shadow-sm inline-block">
                    Data Audit Minggu: {summary.mingguData}
                </p>
            )}
        </div>
        <img src={garis} alt="" className="w-[30%]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-12">
        
        {/* --- Score Cards --- */}
        <div className="flex flex-col md:flex-row justify-center gap-6 mt-4">
            <SummaryCard 
                title="Total Pendapatan" 
                value={summary.totalPendapatan} 
                diff={summary.diffPendapatan}
                icon={pemasukanIcon} 
                baseColor="text-green-600" 
                borderColor="border-green-500"
            />
            <SummaryCard 
                title="Total Pengeluaran" 
                value={summary.totalPengeluaran} 
                diff={summary.diffPengeluaran}
                icon={pengeluaranIcon} 
                baseColor="text-red-600" 
                borderColor="border-red-500"
                forceRed={true} 
            />
            <SummaryCard 
                title="Profit Penjualan" 
                value={summary.totalProfit} 
                diff={summary.diffProfit}
                icon={profitIcon} 
                baseColor="text-blue-600" 
                borderColor="border-blue-500"
            />
        </div>

        {/* --- Charts Section --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            
            {/* Pie Chart */}
            <div className="bg-white p-6 rounded-xl shadow-md lg:col-span-1 flex flex-col">
                <h3 className="text-lg font-bold text-gray-800 mb-6 text-center border-b pb-2">Persentase Penjualan</h3>
                <div className="flex-1 relative min-h-[250px]">
                    {/* Mengirim rawData dan referenceDate, PieChart akan memproses sendiri */}
                    <PieChart rawData={auditData} referenceDate={chartRefDate} />
                </div>
                <div className="mt-6 flex items-start justify-center gap-2 bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-medium text-gray-700">
                        Proporsi produk terjual dalam akumulasi <span className="font-bold text-blue-600">4 minggu terakhir</span>.
                    </p>
                </div>
            </div>

            {/* Bar Chart */}
            <div className="bg-white p-6 rounded-xl shadow-md lg:col-span-2 flex flex-col">
                <h3 className="text-lg font-bold text-gray-800 mb-6 border-b pb-2">Grafik Penjualan (4 Minggu Terakhir)</h3>
                <div className="flex-1 relative min-h-[300px]">
                    <BarChart rawData={auditData} referenceDate={chartRefDate} />
                </div>
            </div>

        </div>

        {/* --- Table Section --- */}
        <div className="flex flex-col bg-white p-6 rounded-xl shadow-md mt-8 w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Riwayat Transaksi Terakhir</h3>
              <div className="relative w-full max-w-md">
                <input
                  type="text"
                  placeholder="Cari Data..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border border-gray-300 rounded-full px-4 py-2 pr-12 w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button className="absolute right-0 top-0 h-full w-10 bg-gray-800 rounded-r-full flex items-center justify-center hover:bg-gray-700 transition">
                  <img src={searchIcon} alt="Search" className="w-4 h-4 invert brightness-0 invert" />
                </button>
              </div>
            </div>

            {/* Tabel Scrollable */}
            <div className="overflow-x-auto overflow-y-auto max-h-[400px] border rounded-lg custom-scrollbar">
              <table className="w-full text-sm text-center border-collapse relative">
                <thead className="sticky top-0 z-10 shadow-sm uppercase text-xs tracking-wide">
                  <tr>
                    {["No", "Jenis", "Sumber/Produk", "Harga", "Jml", "Tanggal", "Total"].map((h, i) => (
                        <th key={i} className="py-3 px-4 font-semibold border-b bg-gray-100">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  {filteredTableData.slice(0, 20).map((item, i) => (
                    <tr key={i} className="hover:bg-gray-50 border-b last:border-0 transition-colors">
                      <td className="py-3 px-4">{i + 1}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            item.jenis_transaksi.toLowerCase() === 'penjualan' || item.jenis_transaksi.toLowerCase() === 'pemasukan'
                            ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                            {item.jenis_transaksi.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-800 text-left">
                        {item.produk ? item.produk.nama_produk : (item.sumber_pengeluaran || '-')}
                      </td>
                      <td className="py-3 px-4">{formatCurrency(item.harga_satuan || 0)}</td>
                      <td className="py-3 px-4 font-bold text-blue-600">{item.jumlah}</td>
                      <td className="py-3 px-4 whitespace-nowrap text-xs">{formatDate(item.tanggal)}</td>
                      <td className={`py-3 px-4 font-semibold ${
                          item.jenis_transaksi.toLowerCase() === 'penjualan' || item.jenis_transaksi.toLowerCase() === 'pemasukan'
                          ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(item.total_pendapatan)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredTableData.length === 0 && (
                <div className="text-center py-8 text-gray-500">Data tidak ditemukan</div>
              )}
            </div>
        </div>

      </div>
    </div>
  );
}