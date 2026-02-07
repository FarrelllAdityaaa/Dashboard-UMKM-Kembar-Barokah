// src/components/PieChart.jsx
import React, { useMemo } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Registrasi Plugin
ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

const PieChart = ({ rawData, referenceDate }) => {
  
  // --- LOGIKA PEMROSESAN DATA ---
  const chartData = useMemo(() => {
    if (!rawData || rawData.length === 0 || !referenceDate) return null;

    // 1. Tentukan Range Tanggal (4 Minggu berakhir di referenceDate)
    const lastAuditStart = new Date(referenceDate);
    
    const lastAuditEnd = new Date(lastAuditStart);
    lastAuditEnd.setDate(lastAuditStart.getDate() + 6);
    lastAuditEnd.setHours(23, 59, 59, 999);

    const startOf4Weeks = new Date(lastAuditStart);
    startOf4Weeks.setDate(startOf4Weeks.getDate() - 21); // Mundur 3 minggu ke belakang

    // 2. Filter Data
    const pieDataFiltered = rawData.filter(item => {
      const d = new Date(item.tanggal);
      return d >= startOf4Weeks && d <= lastAuditEnd && 
             (item.jenis_transaksi.toLowerCase().includes('pemasukan') || item.jenis_transaksi.toLowerCase().includes('penjualan'));
    });

    if (pieDataFiltered.length === 0) return null;

    // 3. Agregasi per Produk
    const productStats = {};
    pieDataFiltered.forEach(item => {
      const pName = item.produk?.nama_produk || 'Lainnya';
      productStats[pName] = (productStats[pName] || 0) + item.jumlah;
    });

    // 4. Mapping Warna
    const bgColors = {
        'Kerupuk Kulit': '#4CAF50', 
        'Stik Bawang': '#FF9800',   
        'Keripik Bawang': '#2196F3',
        'Lainnya': '#9E9E9E'
    };

    const labels = Object.keys(productStats);
    const dataPie = Object.values(productStats);
    const colors = labels.map(label => bgColors[label] || '#607D8B');

    return {
      labels: labels,
      datasets: [{
        data: dataPie,
        backgroundColor: colors,
        borderWidth: 1,
      }]
    };
  }, [rawData, referenceDate]); // Recalculate hanya jika data berubah

  // --- RENDER ---
  if (!chartData) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Belum ada data penjualan</div>;
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: { usePointStyle: true, padding: 20, font: { size: 13 } }
      },
      // Konfigurasi Data Labels (Persentase)
      datalabels: {
        color: '#fff',
        font: {
          weight: 'bold',
          size: 16
        },
        formatter: (value, ctx) => {
          const datasets = ctx.chart.data.datasets;
          if (datasets.indexOf(ctx.dataset) === datasets.length - 1) {
            const sum = datasets[0].data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / sum) * 100) + '%';
            // Hanya tampilkan jika persentase > 5%
            return (value / sum) > 0.05 ? percentage : '';
          } else {
            return '';
          }
        }
      }
    }
  };

  return <Pie data={chartData} options={options} />;
};

export default PieChart;