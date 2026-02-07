// File: src/components/PredictionChart.jsx
import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import PropTypes from 'prop-types';

// --- 1. Registrasi Komponen Chart.js ---
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// --- 2. Helper Functions ---
const formatRupiah = (value) => 
  new Intl.NumberFormat('id-ID', { 
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0 
  }).format(value);

const formatDateShort = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2); 
    return `${day}/${month}/${year}`;
};

const PredictionChart = ({ title, chartData, dataType }) => {
  
  // Gunakan useMemo agar kalkulasi data chart tidak dijalankan ulang jika props tidak berubah
  const { data, options } = useMemo(() => {
    // Fallback jika data kosong
    if (!chartData || !chartData.historical_data || !chartData.forecast_data) {
        return { data: null, options: null };
    }

    const { historical_data, forecast_data } = chartData;

    // Persiapan Label (Sumbu X)
    const histLabels = historical_data.map(d => d.tanggal);
    const forecastLabels = forecast_data.map(d => d.tanggal_audit);
    const allLabels = [...histLabels, ...forecastLabels];

    // Estimasi Harga (Untuk konversi jika dataType='pendapatan' pada data historis)
    // Karena data historis di DB mungkin hanya simpan jumlah, kita butuh estimasi harga dari prediksi pertama
    let estimatedPrice = 0;
    if (forecast_data.length > 0 && forecast_data[0].prediksi_jumlah_terjual > 0) {
        estimatedPrice = forecast_data[0].prediksi_pendapatan / forecast_data[0].prediksi_jumlah_terjual;
    }

    // Mapping Data Historis
    const histValues = historical_data.map(d => {
        if (dataType === 'pendapatan') {
            // Jika chart pendapatan, kalikan jumlah historis dengan estimasi harga
            return d.jumlah * estimatedPrice; 
        }
        return d.jumlah; 
    });

    // Mapping Data Prediksi
    const forecastValues = forecast_data.map(d => 
        dataType === 'jumlah' ? d.prediksi_jumlah_terjual : d.prediksi_pendapatan
    );

    // Konstruksi Dataset (Agar garis nyambung dan warna beda)
    // 1. Dataset Historis: Isi nilai historis, sisanya null
    const histDataset = [...histValues, ...Array(forecast_data.length).fill(null)];

    // 2. Dataset Prediksi: Isi null sepanjang historis (kecuali poin terakhir), lalu nilai prediksi
    // Ambil poin terakhir historis agar garis prediksi menyambung dari titik tersebut
    const lastHistValue = histValues[histValues.length - 1];
    const forecastPrefix = Array(histValues.length - 1).fill(null);
    const forecastDataset = [...forecastPrefix, lastHistValue, ...forecastValues];

    const chartDataConfig = {
      labels: allLabels,
      datasets: [
        {
          label: 'Data Historis',
          data: histDataset,
          borderColor: '#FCAA0B', // Kuning
          backgroundColor: 'rgba(252, 170, 11, 0.2)',
          tension: 0.1,
          pointRadius: 3,
        },
        {
          label: 'Prediksi Masa Depan',
          data: forecastDataset,
          borderColor: '#00A86B', // Hijau
          backgroundColor: 'rgba(0, 168, 107, 0.2)',
          borderDash: [5, 5], // Garis putus-putus
          tension: 0.1,
          pointRadius: 3,
        },
      ],
    };

    // Konfigurasi Options
    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        title: { display: true, text: title },
        datalabels: { display: false },
        tooltip: {
          callbacks: {
            title: (context) => formatDateShort(context[0].label),
            label: (context) => {
              let label = context.dataset.label || '';
              if (label) label += ': ';
              if (context.parsed.y !== null) {
                if (dataType === 'pendapatan') label += formatRupiah(context.parsed.y);
                else label += `${context.parsed.y} Pcs`;
              }
              return label;
            }
          }
        }
      },
      scales: {
          y: { 
              beginAtZero: false, 
              title: { 
                  display: true, 
                  text: dataType === 'jumlah' ? 'Jumlah (Pcs)' : 'Pendapatan (Rp)' 
              },
              ticks: {
                  callback: function(value) {
                      if (dataType === 'pendapatan') {
                          if (value >= 1000000) return `${(value / 1000000).toFixed(1)} Jt`;
                          if (value >= 1000) return `${(value / 1000).toFixed(0)} Rb`;
                      }
                      return value;
                  }
              }
          },
          x: {
              title: { display: true, text: 'Tanggal Audit' },
              ticks: {
                  callback: function(val) {
                      const label = this.getLabelForValue(val);
                      return label ? formatDateShort(label) : label;
                  },
                  maxRotation: 45,
                  minRotation: 45
              }
          }
      }
    };

    return { data: chartDataConfig, options: chartOptions };

  }, [chartData, title, dataType]); // Recalculate only if dependencies change

  // --- 3. Render ---
  if (!data) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gray-50 border rounded-lg text-gray-400">
        <svg className="w-10 h-10 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
        <p>Data belum tersedia</p>
      </div>
    );
  }

  return <Line options={options} data={data} />;
};

PredictionChart.propTypes = {
  title: PropTypes.string,
  dataType: PropTypes.oneOf(['jumlah', 'pendapatan']),
  chartData: PropTypes.shape({
    historical_data: PropTypes.array,
    forecast_data: PropTypes.array,
  }),
};

export default PredictionChart;