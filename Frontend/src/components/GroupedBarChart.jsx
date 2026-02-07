// Frontend/src/components/GroupedBarChart.jsx
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
// Import Plugin Data Labels
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels // Jangan lupa diregister
);

export default function GroupedBarChart({ data }) {
  
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return { labels: [], datasets: [] };
    }

    // 1. Cari Tanggal Paling Baru
    const allDates = data.map(item => new Date(item.tanggal).getTime());
    const maxDateVal = Math.max(...allDates);
    const latestDate = new Date(maxDateVal);

    // 2. Start of Current Week (Senin)
    const startOfCurrentWeek = new Date(latestDate);
    const day = startOfCurrentWeek.getDay() || 7; 
    if (day !== 1) startOfCurrentWeek.setDate(startOfCurrentWeek.getDate() - (day - 1));
    startOfCurrentWeek.setHours(0, 0, 0, 0);

    // Mundur 1 minggu
    const anchorDate = new Date(startOfCurrentWeek);
    anchorDate.setDate(anchorDate.getDate() - 7); 

    const formatShort = (date) => {
      const d = date.getDate().toString().padStart(2, '0');
      const m = (date.getMonth() + 1).toString().padStart(2, '0');
      const y = date.getFullYear().toString().slice(-2);
      return `${d}/${m}/${y}`;
    };

    const weeks = [];
    
    // Loop 4 minggu ke belakang
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(anchorDate);
      weekStart.setDate(anchorDate.getDate() - (i * 7)); 
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); 
      weekEnd.setHours(23, 59, 59, 999);

      const labelMinggu = `Minggu ${4 - i}`;
      const labelTanggal = `(${formatShort(weekStart)} - ${formatShort(weekEnd)})`;

      const currentWeekBucket = {
        label: [labelMinggu, labelTanggal],
        pendapatan: 0,
        pengeluaran: 0
      };

      data.forEach(item => {
        const itemDate = new Date(item.tanggal);
        const nominal = Number(item.total_pendapatan) || 0;

        if (itemDate >= weekStart && itemDate <= weekEnd) {
          if (item.jenis_transaksi === 'penjualan' || item.jenis_transaksi === 'pemasukan') {
            currentWeekBucket.pendapatan += nominal;
          } else if (item.jenis_transaksi === 'pengeluaran') {
            currentWeekBucket.pengeluaran += nominal;
          }
        }
      });

      weeks.push(currentWeekBucket);
    }

    return {
      labels: weeks.map(w => w.label),
      datasets: [
        {
          label: 'Pemasukan',
          data: weeks.map(w => w.pendapatan),
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          borderColor: 'rgba(34, 197, 94, 1)',
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: 'Pengeluaran',
          data: weeks.map(w => w.pengeluaran),
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };
  }, [data]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 25, 
      }
    },
    plugins: {
      legend: { position: 'top' },
      title: {
        display: true,
        text: 'Statistik 4 Minggu Terakhir',
        font: { size: 16, family: "'Poppins', sans-serif" }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('id-ID', {
                style: 'currency', currency: 'IDR', minimumFractionDigits: 0
              }).format(context.parsed.y);
            }
            return label;
          }
        }
      },
      // --- KONFIGURASI LABEL DATA (ANGKA DI DALAM BATANG) ---
      datalabels: {
        display: (context) => {
           return context.dataset.data[context.dataIndex] > 0; // Hanya tampil jika nilai > 0
        },
        color: '#333', // Warna teks (Abu gelap agar kontras di background hijau/merah muda)
        anchor: 'end', // Posisi di tengah batang
        align: 'end',
        offset: -2, // Sedikit di dalam batang
        font: {
           size: 10, // Ukuran font sedikit diperkecil agar muat
           weight: 'bold'
        },
        formatter: (value) => {
            // Format Juta (30.94 Jt)
            if (value >= 1000000) {
               return (value / 1000000).toFixed(2).replace(/\.00$/, '') + ' Jt';
            }
            // Format Ribu (500 Rb)
            if (value >= 1000) {
               return (value / 1000).toFixed(0) + ' Rb';
            }
            return value;
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Total (Rp)',
          font: {
            size: 12,
            weight: 'bold',
            family: "'Poppins', sans-serif"
          },
          padding: { bottom: 8 } // Jarak label ke angka sumbu
        },
        ticks: {
          // Format Sumbu Y (Tetap ringkas)
          callback: function(value) {
            if (value >= 1000000000) return (value / 1000000000).toFixed(1) + ' M';
            if (value >= 1000000) return (value / 1000000).toFixed(1) + ' Jt';
            if (value >= 1000) return (value / 1000).toFixed(0) + ' Rb';
            return value;
          },
          font: { size: 11 }
        }
      },
      x: {
        ticks: { font: { size: 11 } }
      }
    }
  };

  return (
    <div className="w-full h-full">
       <Bar data={chartData} options={options} />
    </div>
  );
}