import pandas as pd
from sqlalchemy import create_engine, text  
import sys

# KONFIGURASI
DB_USER = "root"
DB_PASS = ""
DB_HOST = "localhost"
DB_NAME = "kembarbarokahdb"
CSV_FILE = 'Susunan Data Audit UMKM Kembar Barokah - Ready for Model - Capstone Project (Final).csv'

try:
    # 1. Koneksi DB
    engine = create_engine(f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}:3306/{DB_NAME}")
    print("Terhubung ke database.")

    # 2. Baca CSV
    df = pd.read_csv(CSV_FILE)
    df.rename(columns={'Tanggal_Audit (dd-mm-yy)': 'tanggal'}, inplace=True)
    df['tanggal'] = pd.to_datetime(df['tanggal'], format='%d-%m-%y')
    
    # 3. ISI TABEL 'produk' (Master Data)
    print("Mengisi tabel 'produk'...")
    products = [
        {'nama': 'Kerupuk Kulit', 'harga': 7500, 'unit': 'Pcs'},
        {'nama': 'Stik Bawang', 'harga': 6000, 'unit': 'Pcs'},
        {'nama': 'Keripik Bawang', 'harga': 5000, 'unit': 'Pcs'}
    ]
    
    with engine.connect() as conn:
        # PERBAIKAN 1: Gunakan text() untuk perintah SQL mentah
        print("Membersihkan data lama...")
        conn.execute(text("SET FOREIGN_KEY_CHECKS = 0;"))
        conn.execute(text("TRUNCATE TABLE audit_data;"))
        conn.execute(text("TRUNCATE TABLE produk;"))
        conn.execute(text("SET FOREIGN_KEY_CHECKS = 1;"))
        conn.commit() # PERBAIKAN 2: Wajib commit transaksi

        for p in products:
            # Insert produk dan simpan
            sql = text(f"""
                INSERT INTO produk (nama_produk, harga_satuan, unit, stok_tersedia, created_at, updated_at)
                VALUES ('{p['nama']}', {p['harga']}, '{p['unit']}', 100, NOW(), NOW())
            """)
            conn.execute(sql)
            conn.commit() # Commit setiap insert
            
    # 4. ISI TABEL 'audit_data' (Transaksi)
    print("Mengisi tabel 'audit_data'...")
    
    # Ambil ID produk yang baru dibuat
    df_prod_ids = pd.read_sql(text("SELECT id, nama_produk FROM produk"), con=engine)
    
    # Gabungkan CSV dengan ID Produk
    df_merged = pd.merge(df, df_prod_ids, left_on='Nama_Produk', right_on='nama_produk', how='left')
    
    # Siapkan data insert
    price_map = {'Kerupuk Kulit': 7500, 'Stik Bawang': 6000, 'Keripik Bawang': 5000}
    
    with engine.connect() as conn:
        for _, row in df_merged.iterrows():
            harga = price_map.get(row['Nama_Produk'], 0)
            total = row['Jumlah_Produk_Terjual'] * harga
            
            # Pastikan tanggal dalam format string SQL yang benar
            tgl_sql = row['tanggal'].strftime('%Y-%m-%d')
            
            sql = text(f"""
                INSERT INTO audit_data (produk_id, tanggal, jenis_transaksi, jumlah, harga_satuan, total_pendapatan, created_at, updated_at)
                VALUES ({row['id']}, '{tgl_sql}', 'pemasukan', {row['Jumlah_Produk_Terjual']}, {harga}, {total}, NOW(), NOW())
            """)
            conn.execute(sql)
        
        conn.commit() # Commit akhir
            
    print("--- SUKSES! Data Dummy berhasil dipindahkan ke tabel PRODUKSI (audit_data & produk). ---")

except Exception as e:
    print(f"Error: {e}")