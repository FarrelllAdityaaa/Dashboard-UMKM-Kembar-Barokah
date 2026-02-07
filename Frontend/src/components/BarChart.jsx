// src/components/BarChart.jsx
import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const BarChart = ({ rawData, referenceDate }) => {
  // LOGIKA PEMROSESAN DATA
  const chartData = useMemo(() => {
    if (!rawData || rawData.length === 0 || !referenceDate) return null;

    const weeksLabels = [];
    const productList = ['Kerupuk Kulit', 'Stik Bawang', 'Keripik Bawang'];
    
    // Inisialisasi struktur data per produk [minggu-4, minggu-3, minggu-2, minggu-1]
    const weeklyData = {};
    productList.forEach(p => weeklyData[p] = [0, 0, 0, 0]);

    // Loop 4 minggu mundur (i=0 adalah minggu audit terakhir)
    for (let i = 3; i >= 0; i--) {
        const searchStart = new Date(referenceDate);
        searchStart.setDate(referenceDate.getDate() - (i * 7));
        
        const searchEnd = new Date(searchStart);
        searchEnd.setDate(searchStart.getDate() + 6);
        searchEnd.setHours(23, 59, 59);

        // Helper format tanggal pendek
        const formatShort = (date) => {
            const d = date.getDate().toString().padStart(2, '0');
            const m = (date.getMonth() + 1).toString().padStart(2, '0');
            const y = date.getFullYear().toString().slice(-2); 
            return `${d}/${m}/${y}`;
        };

        const startStrShort = formatShort(searchStart);
        const endStrShort = formatShort(searchEnd);
        
        weeksLabels.push([`Minggu ${4-i}`, `(${startStrShort} - ${endStrShort})`]);

        // Filter data untuk minggu ini
        const weekData = rawData.filter(item => {
          const d = new Date(item.tanggal);
          return d >= searchStart && d <= searchEnd && 
             (item.jenis_transaksi.toLowerCase().includes('pemasukan') || item.jenis_transaksi.toLowerCase().includes('penjualan'));
        });

        // Agregasi jumlah per produk
        weekData.forEach(item => {
          const pName = item.produk?.nama_produk;
          if (weeklyData[pName]) {
             weeklyData[pName][3 - i] += item.jumlah; 
          }
        });
    }

    return {
      labels: weeksLabels,
      datasets: [
        { label: 'Kerupuk Kulit', data: weeklyData['Kerupuk Kulit'], backgroundColor: '#4CAF50' },
        { label: 'Stik Bawang', data: weeklyData['Stik Bawang'], backgroundColor: '#FF9800' },
        { label: 'Keripik Bawang', data: weeklyData['Keripik Bawang'], backgroundColor: '#2196F3' },
      ]
    };
  }, [rawData, referenceDate]); // Hanya hitung ulang jika data/tanggal berubah

  // RENDER
  if (!chartData) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Memuat data grafik...</div>;
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: false },
      datalabels: { display: false }
    },
    scales: {
        y: { beginAtZero: true, title: {display: true, text: 'Jumlah Terjual (Pcs)'} }
    }
  };

  return <Bar options={options} data={chartData} />;
};

export default BarChart;