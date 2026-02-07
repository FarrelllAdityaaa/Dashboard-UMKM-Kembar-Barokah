import pandas as pd
from sqlalchemy import create_engine, text
import sys


# ============================================================
# DATABASE & FILE CONFIGURATION
# ============================================================

DB_USER = "root"
DB_PASS = ""
DB_HOST = "localhost"
DB_PORT = "3306"
DB_NAME = "kembarbarokahdb"

# File CSV berisi data dummy hasil observasi UMKM
CSV_FILE = 'data/seed/Susunan Data Audit UMKM Kembar Barokah - Ready for Model - Capstone Project (Final).csv'


try:
    # ========================================================
    # DATABASE CONNECTION
    # ========================================================
    engine = create_engine(
        f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    )
    print("Terhubung ke database.")

    # ========================================================
    # LOAD & PREPROCESS CSV DATA
    # ========================================================
    df = pd.read_csv(CSV_FILE)

    # Menyesuaikan nama kolom tanggal agar konsisten dengan database
    df.rename(
        columns={'Tanggal_Audit (dd-mm-yy)': 'tanggal'},
        inplace=True
    )
    df['tanggal'] = pd.to_datetime(df['tanggal'], format='%d-%m-%y')

    # ========================================================
    # INSERT MASTER DATA: TABEL PRODUK
    # ========================================================
    print("Mengisi tabel 'produk'...")

    products = [
        {'nama': 'Kerupuk Kulit', 'harga': 7500, 'unit': 'Pcs'},
        {'nama': 'Stik Bawang', 'harga': 6000, 'unit': 'Pcs'},
        {'nama': 'Keripik Bawang', 'harga': 5000, 'unit': 'Pcs'}
    ]

    with engine.connect() as conn:
        # Membersihkan data lama (khusus untuk seed awal)
        print("Membersihkan data lama pada tabel produksi...")
        conn.execute(text("SET FOREIGN_KEY_CHECKS = 0;"))
        conn.execute(text("TRUNCATE TABLE audit_data;"))
        conn.execute(text("TRUNCATE TABLE produk;"))
        conn.execute(text("SET FOREIGN_KEY_CHECKS = 1;"))
        conn.commit()

        # Insert data produk
        for p in products:
            sql = text("""
                INSERT INTO produk 
                (nama_produk, harga_satuan, unit, stok_tersedia, created_at, updated_at)
                VALUES (:nama, :harga, :unit, :stok, NOW(), NOW())
            """)
            conn.execute(sql, {
                'nama': p['nama'],
                'harga': p['harga'],
                'unit': p['unit'],
                'stok': 100
            })
            conn.commit()

    # ========================================================
    # INSERT TRANSACTION DATA: TABEL AUDIT_DATA
    # ========================================================
    print("Mengisi tabel 'audit_data'...")

    # Ambil ID produk yang baru saja dimasukkan
    df_prod_ids = pd.read_sql(
        text("SELECT id, nama_produk FROM produk"),
        con=engine
    )

    # Gabungkan data CSV dengan ID produk
    df_merged = pd.merge(
        df,
        df_prod_ids,
        left_on='Nama_Produk',
        right_on='nama_produk',
        how='left'
    )

    # Mapping harga untuk perhitungan total pendapatan
    price_map = {
        'Kerupuk Kulit': 7500,
        'Stik Bawang': 6000,
        'Keripik Bawang': 5000
    }

    with engine.connect() as conn:
        for _, row in df_merged.iterrows():
            harga = price_map.get(row['Nama_Produk'], 0)
            total = row['Jumlah_Produk_Terjual'] * harga
            tanggal_sql = row['tanggal'].strftime('%Y-%m-%d')

            sql = text("""
                INSERT INTO audit_data
                (produk_id, tanggal, jenis_transaksi, jumlah,
                 harga_satuan, total_pendapatan, created_at, updated_at)
                VALUES
                (:produk_id, :tanggal, 'penjualan', :jumlah,
                 :harga, :total, NOW(), NOW())
            """)

            conn.execute(sql, {
                'produk_id': row['id'],
                'tanggal': tanggal_sql,
                'jumlah': row['Jumlah_Produk_Terjual'],
                'harga': harga,
                'total': total
            })

        conn.commit()

    print("--- SUKSES! Data dummy berhasil dimasukkan ke database produksi. ---")


except Exception as e:
    print(f"ERROR saat proses seed data: {e}")
    sys.exit(1)