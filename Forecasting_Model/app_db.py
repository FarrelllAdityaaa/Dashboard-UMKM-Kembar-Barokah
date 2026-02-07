import pandas as pd
import numpy as np
import joblib
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from tensorflow.keras.models import load_model
from sklearn.preprocessing import MinMaxScaler
from pandas.tseries.offsets import DateOffset
from sqlalchemy import create_engine
from datetime import datetime, timedelta

# Inisialisasi Aplikasi Flask
# Membuat instance aplikasi Flask dan mengaktifkan CORS agar bisa diakses dari frontend berbeda domain
app = Flask(__name__)
CORS(app) 

# DEKLARASI KONEKSI DB & VARIABEL GLOBAL
# Konfigurasi database mysql bernama kembarbarokahdb
DB_USER = "root"
DB_PASS = ""
DB_HOST = "localhost"
DB_PORT = "3306"
DB_NAME = "kembarbarokahdb"

# Membuat string koneksi dan inisialisasi engine SQLAlchemy
DATABASE_URI = f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
g_db_engine = create_engine(DATABASE_URI)

# Variabel global untuk menyimpan model dan scaler di memori (agar tidak load berulang kali)
g_models = {}
g_scalers = {}
g_scalers_features_only = {} 
g_holiday_set = None
g_window_size = 4  # Menggunakan 4 minggu data ke belakang untuk prediksi

# Referensi harga produk hardcoded untuk perhitungan estimasi pendapatan
g_product_prices = {
    "Kerupuk Kulit": 7500,
    "Stik Bawang": 6000,
    "Keripik Bawang": 5000
}
g_product_list = ["Kerupuk Kulit", "Stik Bawang", "Keripik Bawang"]


# FUNGSI HELPER

def load_holidays(holiday_csv_path):
    # Membaca file CSV hari libur dan mengubahnya menjadi format tanggal untuk pencarian cepat
    print(f"Memuat data hari libur dari: {holiday_csv_path}")
    try:
        df_holidays = pd.read_csv(holiday_csv_path)
        date_column_name = 'Tanggal'
        # Menambahkan tahun 2025 secara eksplisit (sesuai kebutuhan dataset)
        df_holidays['Tanggal_Penuh'] = df_holidays[date_column_name] + ' 2025'
        df_holidays['Tanggal_Datetime'] = pd.to_datetime(df_holidays['Tanggal_Penuh'], format='%d %B %Y')
        holiday_set = set(df_holidays['Tanggal_Datetime'].dt.normalize())
        print("Data hari libur berhasil dimuat.")
        return holiday_set
    except Exception as e:
        print(f"Error memuat data hari libur: {e}")
        return None

def inverse_transform_helper(scaled_values, scaler, n_features):
    # Mengembalikan nilai hasil prediksi (skala 0-1) kembali ke nilai asli (jumlah produk)
    scaled_values = np.array(scaled_values).flatten()
    dummy = np.zeros((len(scaled_values), n_features))
    dummy[:, 0] = scaled_values
    inv = scaler.inverse_transform(dummy)[:, 0]
    return inv

def get_future_calendar_features(date_range, holiday_set):
    # Menghasilkan fitur kalender (minggu gajian & libur nasional) untuk tanggal masa depan
    features = []
    for date in date_range:
        start_week = (date - DateOffset(days=6)).normalize()
        end_week = date.normalize()
        week_range = pd.date_range(start_week, end_week)
        
        # Logika: Minggu gajian jika tanggal jatuh antara 25 s/d 3
        is_gajian = any(d.day >= 25 or d.day <= 3 for d in week_range)
        is_libur = any(d in holiday_set for d in week_range)
        
        features.append({
            'Tanggal_Audit': date,
            'is_minggu_gajian': 1 if is_gajian else 0,
            'is_libur_nasional': 1 if is_libur else 0
        })
    return pd.DataFrame(features)

# FUNGSI AGREGASI DATA HARIAN KE MINGGUAN
def get_historical_data_from_db(product_name, n_weeks):
    """
    Fungsi Utama: Mengambil data transaksi dari MySQL, melakukan filter tanggal (Cutoff),
    dan mengubah data harian menjadi mingguan (Resampling).
    """
    print(f"Mengambil data historis harian untuk {product_name}...")
    
    # 1. Tentukan Cutoff Date (Hanya ambil data sampai Senin minggu lalu)
    today = datetime.now()
    monday_this_week = today - timedelta(days=today.weekday()) 
    monday_this_week = monday_this_week.replace(hour=0, minute=0, second=0, microsecond=0)

    # Cutoff adalah hari Minggu kemarin jam 23:59:59
    cutoff_date = monday_this_week - timedelta(seconds=1)

    print(f"DEBUG: Hari ini {today}, Cutoff Data History: {cutoff_date}")

    # 2. Query SQL untuk mengambil data penjualan yang valid sebelum cutoff
    query = f"""
        SELECT 
            t1.tanggal as Tanggal_Transaksi, 
            t1.jumlah as Jumlah_Produk_Terjual
        FROM audit_data t1
        JOIN produk t2 ON t1.produk_id = t2.id
        WHERE 
            t2.nama_produk = '{product_name}'
            AND t1.jenis_transaksi = 'penjualan' 
            AND t1.tanggal <= '{cutoff_date}' 
        ORDER BY t1.tanggal ASC
    """
    
    with g_db_engine.connect() as conn:
        df = pd.read_sql(query, conn)
    
    if df.empty:
        print(f"WARNING: Data kosong setelah filter tanggal {cutoff_date}")
        return pd.DataFrame(columns=['Jumlah_Produk_Terjual', 'Jumlah_Terjual_Minggu_Lalu', 'is_minggu_gajian', 'is_libur_nasional'])

    # 3. Preprocessing Data Frame
    df['Tanggal_Transaksi'] = pd.to_datetime(df['Tanggal_Transaksi'])
    df = df.set_index('Tanggal_Transaksi')

    # 4. RESAMPLING: Ubah data harian menjadi mingguan (setiap Senin/W-MON)
    df_weekly = df.resample('W-MON').sum()
    
    df_weekly = df_weekly.reset_index().rename(columns={'Tanggal_Transaksi': 'Tanggal_Audit'})
    df_weekly = df_weekly.sort_values('Tanggal_Audit', ascending=True)
    
    # Feature Engineering: Membuat fitur Lag (penjualan minggu sebelumnya)
    df_weekly['Nama_Produk'] = product_name 
    df_weekly['Jumlah_Terjual_Minggu_Lalu'] = df_weekly['Jumlah_Produk_Terjual'].shift(1)
    
    # Menggabungkan dengan fitur kalender (Libur & Gajian)
    df_calendar_features = get_future_calendar_features(df_weekly['Tanggal_Audit'], g_holiday_set)
    df_final = pd.merge(df_weekly, df_calendar_features, on='Tanggal_Audit', how='left')

    # Menghapus baris NaN (biasanya baris pertama karena shift/lag)
    df_final = df_final.dropna()
    
    # Membatasi pengambilan hanya n_weeks terakhir sesuai kebutuhan
    if len(df_final) > n_weeks:
        df_final = df_final.tail(n_weeks)
    
    return df_final.set_index('Tanggal_Audit')

# FUNGSI STARTUP
def load_all_artifacts():
    # Memuat semua model Machine Learning (.h5) dan Scaler (.save) saat server dinyalakan
    global g_holiday_set, g_models, g_scalers, g_scalers_features_only
    
    print("Memuat semua artefak...")
    
    # Cek file CSV hari libur
    holiday_csv_path = 'Tanggal Libur Nasional 2025.csv' 
    if not os.path.exists(holiday_csv_path):
         print(f"WARNING: File {holiday_csv_path} tidak ditemukan.")
         g_holiday_set = set()
    else:
         g_holiday_set = load_holidays(holiday_csv_path)

    # Loop untuk memuat model per produk
    for product in g_product_list:
        product_key = product.replace(' ', '_')
        model_path = os.path.join('models', f'model_{product_key}.h5')
        scaler_path = os.path.join('models', f'scaler_{product_key}.save')
        scaler_features_path = os.path.join('models', f'scaler_features_{product_key}.save')
        
        if all(os.path.exists(p) for p in [model_path, scaler_path, scaler_features_path]):
            g_models[product] = load_model(model_path, compile=False)
            g_scalers[product] = joblib.load(scaler_path)
            g_scalers_features_only[product] = joblib.load(scaler_features_path)
        else:
            print(f"SKIP: Artefak untuk {product} tidak lengkap.")
    print("--- Server siap. ---")


# ENDPOINT API
@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Menerima data JSON dari request client
        data = request.get_json()
        product_name = data.get('product_name')
        forecast_steps = int(data.get('forecast_steps', 1))
        
        # Setting jumlah data historis yang ingin ditampilkan di grafik respon
        n_history_weeks = 5 

        # Validasi ketersediaan model
        if product_name not in g_models:
            return jsonify({"error": f"Model untuk {product_name} belum tersedia."}), 400

        model = g_models[product_name]
        scaler = g_scalers[product_name]
        scaler_features_only = g_scalers_features_only[product_name]
        
        # 1. Ambil Data Real dari Database untuk Input Model (Window Size terakhir)
        df_hist_window = get_historical_data_from_db(product_name, n_weeks=g_window_size)
        
        if len(df_hist_window) < 1:
             return jsonify({"error": "Data transaksi mingguan belum cukup (setelah filter)."}), 400

        # PREPARASI PREDIKSI
        # Memilih fitur yang digunakan untuk prediksi
        df_hist_features = df_hist_window[[
            'Jumlah_Produk_Terjual', 'Jumlah_Terjual_Minggu_Lalu', 
            'is_minggu_gajian', 'is_libur_nasional'
        ]]
        n_features = df_hist_features.shape[1]

        # Normalisasi data input menggunakan scaler
        scaled_data = scaler.transform(df_hist_features)
        current_window = scaled_data.copy()
        
        # Membuat rentang tanggal masa depan untuk forecast
        last_hist_date = df_hist_window.index[-1]
        future_dates = pd.date_range(start=last_hist_date + DateOffset(weeks=1), periods=forecast_steps, freq='W-MON')
        
        # Menyiapkan fitur kalender masa depan dan normalisasinya
        df_future_features_raw = get_future_calendar_features(future_dates, g_holiday_set)
        future_features_scaled = scaler_features_only.transform(df_future_features_raw[['is_minggu_gajian', 'is_libur_nasional']])
        
        # LOOP PREDIKSI (ROLLING FORECAST)
        forecast_scaled = []
        for i in range(forecast_steps):
            # Mengambil window terakhir untuk input ke LSTM
            input_seq = current_window[-g_window_size:] if len(current_window) > g_window_size else current_window
            
            # Padding jika data kurang dari window size (safety check)
            if len(input_seq) < g_window_size:
                pad = np.zeros((g_window_size - len(input_seq), n_features))
                input_seq = np.vstack([pad, input_seq])

            # Melakukan prediksi 1 langkah ke depan
            pred_scaled = model.predict(np.expand_dims(input_seq, axis=0))[0]
            forecast_scaled.append(pred_scaled[0])
            
            # Update window dengan hasil prediksi baru (untuk langkah berikutnya)
            new_row = np.array([
                pred_scaled[0], current_window[-1, 0], # Hasil prediksi jadi 'minggu lalu' di step berikutnya
                future_features_scaled[i, 0], future_features_scaled[i, 1]
            ])
            current_window = np.append(current_window, [new_row], axis=0)

        # Mengembalikan hasil prediksi ke skala asli (Inverse Transform)
        forecast_values = inverse_transform_helper(forecast_scaled, scaler, n_features)
        forecast_values = np.maximum(forecast_values, 0) # Pastikan tidak ada nilai negatif
        forecast_values = np.ceil(forecast_values) # Bulatkan ke atas (karena produk tidak bisa desimal)
        
        # MENYIAPKAN RESPONSE JSON
        # Mengambil data historis murni untuk chart
        df_hist_chart = get_historical_data_from_db(product_name, n_weeks=n_history_weeks)
        
        historical_json = []
        for date, row in df_hist_chart.iterrows():
            historical_json.append({
                "tanggal": date.strftime('%Y-%m-%d'),
                "jumlah": int(row['Jumlah_Produk_Terjual'])
            })
            
        forecast_json = []
        product_price = g_product_prices.get(product_name, 0)
        for date, value in zip(future_dates, forecast_values):
            revenue = float(value) * product_price
            forecast_json.append({
                "tanggal_audit": date.strftime('%Y-%m-%d'),
                "produk": product_name,
                "prediksi_jumlah_terjual": int(value),
                "prediksi_pendapatan": int(revenue)
            })

        return jsonify({
            "historical_data": historical_json,
            "forecast_data": forecast_json
        }), 200

    except Exception as e:
        print(f"Error pada endpoint /predict: {e}")
        return jsonify({"error": f"Terjadi kesalahan internal: {str(e)}"}), 500
    
if __name__ == '__main__':
    # Memuat model dan menjalankan server pada port 5001
    load_all_artifacts()
    app.run(host='0.0.0.0', port=5001, debug=False)