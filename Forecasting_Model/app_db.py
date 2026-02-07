import pandas as pd
import numpy as np
import joblib, os
from flask import Flask, request, jsonify
from flask_cors import CORS
from tensorflow.keras.models import load_model
from sklearn.preprocessing import MinMaxScaler
from pandas.tseries.offsets import DateOffset
from sqlalchemy import create_engine
from datetime import datetime, timedelta


# ============================================================
# FLASK APPLICATION INITIALIZATION
# Aplikasi Flask berfungsi sebagai backend service
# untuk forecasting penjualan berbasis LSTM
# ============================================================

app = Flask(__name__)
CORS(app)  # Mengizinkan akses API dari frontend berbeda domain


# ============================================================
# DATABASE CONFIGURATION & GLOBAL VARIABLES
# Konfigurasi database dan variabel global yang digunakan
# selama runtime aplikasi
# ============================================================

# Konfigurasi database MySQL (UMKM Kembar Barokah)
DB_USER = "root"
DB_PASS = ""
DB_HOST = "localhost"
DB_PORT = "3306"
DB_NAME = "kembarbarokahdb"

# Inisialisasi SQLAlchemy engine
DATABASE_URI = f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
g_db_engine = create_engine(DATABASE_URI)

# Cache global untuk model dan scaler
# (dimuat sekali saat server startup)
g_models = {}
g_scalers = {}
g_scalers_features_only = {}
g_holiday_set = None

# Parameter window time-series (mingguan)
g_window_size = 4  # Menggunakan 4 minggu data historis

# Harga produk (digunakan untuk estimasi pendapatan)
g_product_prices = {
    "Kerupuk Kulit": 7500,
    "Stik Bawang": 6000,
    "Keripik Bawang": 5000
}

# Daftar produk yang didukung sistem forecasting
g_product_list = ["Kerupuk Kulit", "Stik Bawang", "Keripik Bawang"]


# ============================================================
# HELPER FUNCTIONS
# Fungsi-fungsi pendukung untuk preprocessing dan
# feature engineering
# ============================================================

def load_holidays(holiday_csv_path):
    """
    Membaca data hari libur nasional dari file CSV
    dan mengonversinya menjadi set tanggal
    untuk pengecekan cepat (O(1)).
    """
    print(f"Memuat data hari libur dari: {holiday_csv_path}")
    try:
        df_holidays = pd.read_csv(holiday_csv_path)
        date_column_name = 'Tanggal'

        # Menambahkan tahun eksplisit (sesuai kebutuhan dataset)
        df_holidays['Tanggal_Penuh'] = df_holidays[date_column_name] + ' 2025'
        df_holidays['Tanggal_Datetime'] = pd.to_datetime(
            df_holidays['Tanggal_Penuh'],
            format='%d %B %Y'
        )

        holiday_set = set(df_holidays['Tanggal_Datetime'].dt.normalize())
        print("Data hari libur berhasil dimuat.")
        return holiday_set

    except Exception as e:
        print(f"Error memuat data hari libur: {e}")
        return None


def inverse_transform_helper(scaled_values, scaler, n_features):
    """
    Mengembalikan nilai prediksi dari skala normalisasi
    ke nilai asli (jumlah produk terjual).
    """
    scaled_values = np.array(scaled_values).flatten()
    dummy = np.zeros((len(scaled_values), n_features))
    dummy[:, 0] = scaled_values

    inv = scaler.inverse_transform(dummy)[:, 0]
    return inv


def get_future_calendar_features(date_range, holiday_set):
    """
    Membuat fitur kalender untuk periode masa depan,
    meliputi indikator minggu gajian dan libur nasional.
    """
    features = []

    for date in date_range:
        start_week = (date - DateOffset(days=6)).normalize()
        end_week = date.normalize()
        week_range = pd.date_range(start_week, end_week)

        # Minggu gajian: tanggal 25 sampai 3
        is_gajian = any(d.day >= 25 or d.day <= 3 for d in week_range)
        is_libur = any(d in holiday_set for d in week_range)

        features.append({
            'Tanggal_Audit': date,
            'is_minggu_gajian': 1 if is_gajian else 0,
            'is_libur_nasional': 1 if is_libur else 0
        })

    return pd.DataFrame(features)


# ============================================================
# DATA ACCESS & AGGREGATION
# Mengambil data transaksi dari database dan
# mengonversinya menjadi data mingguan
# ============================================================

def get_historical_data_from_db(product_name, n_weeks):
    """
    Mengambil data transaksi harian dari database,
    menerapkan cutoff date, lalu mengagregasi
    menjadi data mingguan sebagai input model.
    """
    print(f"Mengambil data historis harian untuk {product_name}...")

    # Menentukan cutoff (data hanya sampai minggu lalu)
    today = datetime.now()
    monday_this_week = today - timedelta(days=today.weekday())
    monday_this_week = monday_this_week.replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    cutoff_date = monday_this_week - timedelta(seconds=1)

    print(f"DEBUG: Hari ini {today}, Cutoff Data History: {cutoff_date}")

    # Query data transaksi penjualan
    query = f"""
        SELECT 
            t1.tanggal AS Tanggal_Transaksi,
            t1.jumlah AS Jumlah_Produk_Terjual
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
        print("WARNING: Data kosong setelah filter cutoff date")
        return pd.DataFrame(columns=[
            'Jumlah_Produk_Terjual',
            'Jumlah_Terjual_Minggu_Lalu',
            'is_minggu_gajian',
            'is_libur_nasional'
        ])

    # Konversi ke datetime dan resampling mingguan
    df['Tanggal_Transaksi'] = pd.to_datetime(df['Tanggal_Transaksi'])
    df = df.set_index('Tanggal_Transaksi')

    df_weekly = df.resample('W-MON').sum().reset_index()
    df_weekly = df_weekly.rename(columns={'Tanggal_Transaksi': 'Tanggal_Audit'})
    df_weekly = df_weekly.sort_values('Tanggal_Audit')

    # Feature lag (penjualan minggu sebelumnya)
    df_weekly['Jumlah_Terjual_Minggu_Lalu'] = df_weekly['Jumlah_Produk_Terjual'].shift(1)

    # Tambahkan fitur kalender
    df_calendar = get_future_calendar_features(df_weekly['Tanggal_Audit'], g_holiday_set)
    df_final = pd.merge(df_weekly, df_calendar, on='Tanggal_Audit', how='left')

    df_final = df_final.dropna()

    if len(df_final) > n_weeks:
        df_final = df_final.tail(n_weeks)

    return df_final.set_index('Tanggal_Audit')


# ============================================================
# STARTUP FUNCTION
# Memuat seluruh artefak model dan data eksternal
# saat server pertama kali dijalankan
# ============================================================

def load_all_artifacts():
    global g_holiday_set, g_models, g_scalers, g_scalers_features_only

    print("Memuat semua artefak...")

    # Load data hari libur nasional
    holiday_csv_path = os.path.join(
        'data', 'external', 'Tanggal_Libur_Nasional_2025.csv'
    )

    if not os.path.exists(holiday_csv_path):
        print(f"WARNING: File {holiday_csv_path} tidak ditemukan.")
        g_holiday_set = set()
    else:
        g_holiday_set = load_holidays(holiday_csv_path)

    # Load model dan scaler per produk
    for product in g_product_list:
        product_key = product.replace(' ', '_')

        model_path = os.path.join('models', f'model_{product_key}.h5')
        scaler_path = os.path.join('models', f'scaler_{product_key}.save')
        scaler_features_path = os.path.join(
            'models', f'scaler_features_{product_key}.save'
        )

        if all(os.path.exists(p) for p in [model_path, scaler_path, scaler_features_path]):
            g_models[product] = load_model(model_path, compile=False)
            g_scalers[product] = joblib.load(scaler_path)
            g_scalers_features_only[product] = joblib.load(scaler_features_path)
        else:
            print(f"SKIP: Artefak untuk {product} tidak lengkap.")

    print("--- Server siap. ---")


# ============================================================
# API ENDPOINT
# Endpoint utama untuk melakukan forecasting penjualan
# ============================================================

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        product_name = data.get('product_name')
        forecast_steps = int(data.get('forecast_steps', 1))

        n_history_weeks = 5  # Data historis untuk visualisasi

        if product_name not in g_models:
            return jsonify({"error": f"Model untuk {product_name} belum tersedia."}), 400

        model = g_models[product_name]
        scaler = g_scalers[product_name]
        scaler_features_only = g_scalers_features_only[product_name]

        # Ambil data historis dari database
        df_hist_window = get_historical_data_from_db(
            product_name, n_weeks=g_window_size
        )

        if len(df_hist_window) < 1:
            return jsonify({"error": "Data historis belum mencukupi."}), 400

        # Persiapan input model
        df_hist_features = df_hist_window[
            ['Jumlah_Produk_Terjual', 'Jumlah_Terjual_Minggu_Lalu',
             'is_minggu_gajian', 'is_libur_nasional']
        ]
        n_features = df_hist_features.shape[1]

        scaled_data = scaler.transform(df_hist_features)
        current_window = scaled_data.copy()

        # Tanggal prediksi ke depan
        last_date = df_hist_window.index[-1]
        future_dates = pd.date_range(
            start=last_date + DateOffset(weeks=1),
            periods=forecast_steps,
            freq='W-MON'
        )

        # Fitur kalender masa depan
        df_future_raw = get_future_calendar_features(future_dates, g_holiday_set)
        future_features_scaled = scaler_features_only.transform(
            df_future_raw[['is_minggu_gajian', 'is_libur_nasional']]
        )

        # Rolling forecast
        forecast_scaled = []
        for i in range(forecast_steps):
            input_seq = current_window[-g_window_size:]
            pred_scaled = model.predict(np.expand_dims(input_seq, axis=0))[0]
            forecast_scaled.append(pred_scaled[0])

            new_row = np.array([
                pred_scaled[0],
                current_window[-1, 0],
                future_features_scaled[i, 0],
                future_features_scaled[i, 1]
            ])
            current_window = np.append(current_window, [new_row], axis=0)

        forecast_values = inverse_transform_helper(
            forecast_scaled, scaler, n_features
        )
        forecast_values = np.ceil(np.maximum(forecast_values, 0))

        # Siapkan response JSON
        df_hist_chart = get_historical_data_from_db(
            product_name, n_weeks=n_history_weeks
        )

        historical_json = [
            {
                "tanggal": date.strftime('%Y-%m-%d'),
                "jumlah": int(row['Jumlah_Produk_Terjual'])
            }
            for date, row in df_hist_chart.iterrows()
        ]

        forecast_json = []
        product_price = g_product_prices.get(product_name, 0)

        for date, value in zip(future_dates, forecast_values):
            forecast_json.append({
                "tanggal_audit": date.strftime('%Y-%m-%d'),
                "produk": product_name,
                "prediksi_jumlah_terjual": int(value),
                "prediksi_pendapatan": int(value * product_price)
            })

        return jsonify({
            "historical_data": historical_json,
            "forecast_data": forecast_json
        }), 200

    except Exception as e:
        print(f"Error pada endpoint /predict: {e}")
        return jsonify({"error": str(e)}), 500


# ============================================================
# APPLICATION ENTRY POINT
# ============================================================

if __name__ == '__main__':
    load_all_artifacts()
    app.run(host='0.0.0.0', port=5001, debug=False)
