#!/usr/bin/env python3.11
"""
Batch import script for OneAuto vehicle inventory
Processes the Excel file in chunks and inserts into database
"""
import pandas as pd
import mysql.connector
import json
import os
from datetime import datetime

# Database connection from environment
DATABASE_URL = os.getenv('DATABASE_URL', '')
if not DATABASE_URL:
    print("ERROR: DATABASE_URL not set")
    exit(1)

# Parse connection string: mysql://user:pass@host:port/dbname
parts = DATABASE_URL.replace('mysql://', '').split('@')
user_pass = parts[0].split(':')
host_port_db = parts[1].split('/')
host_port = host_port_db[0].split(':')

db_config = {
    'user': user_pass[0],
    'password': user_pass[1],
    'host': host_port[0],
    'port': int(host_port[1]) if len(host_port) > 1 else 3306,
    'database': host_port_db[1].split('?')[0]
}

print(f"Connecting to database: {db_config['host']}:{db_config['port']}/{db_config['database']}")

# Read Excel file
excel_path = '/home/ubuntu/upload/onautoaip-FULL-EXPORT-Ev-Petrol-Hybrid18-12-25(1).xlsx'
print(f"\nReading Excel file: {excel_path}")

# Read in chunks to avoid memory issues
chunk_size = 1000
total_imported = 0
total_errors = 0

try:
    # Connect to database
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    
    # Clear existing sample data
    print("\nClearing sample data...")
    cursor.execute("DELETE FROM cars WHERE id <= 5")
    conn.commit()
    
    # Read Excel file
    df = pd.read_excel(excel_path)
    total_rows = len(df)
    print(f"Total vehicles in Excel: {total_rows}")
    
    # Process in chunks
    for start_idx in range(0, total_rows, chunk_size):
        end_idx = min(start_idx + chunk_size, total_rows)
        chunk = df.iloc[start_idx:end_idx]
        
        print(f"\nProcessing rows {start_idx+1} to {end_idx}...")
        
        for idx, row in chunk.iterrows():
            try:
                # Parse images
                images = []
                if pd.notna(row.get('image_links')):
                    try:
                        images = eval(str(row['image_links']))
                        if not isinstance(images, list):
                            images = []
                    except:
                        images = []
                
                # Prepare car data
                make = str(row.get('vehicle_data.manufacturer_desc', ''))[:100] if pd.notna(row.get('vehicle_data.manufacturer_desc')) else None
                model = str(row.get('vehicle_data.model_range_desc', ''))[:100] if pd.notna(row.get('vehicle_data.model_range_desc')) else None
                
                if not make or not model:
                    continue  # Skip if no make/model
                
                year = int(row.get('vehicle_data.first_registration_year')) if pd.notna(row.get('vehicle_data.first_registration_year')) else None
                price = str(row.get('advertised_price_gbp')) if pd.notna(row.get('advertised_price_gbp')) else None
                mileage = int(row.get('mileage_observed')) if pd.notna(row.get('mileage_observed')) else None
                condition = 'used' if row.get('ownership_condition') == 'used' else 'new'
                body_type = str(row.get('vehicle_data.body_type_desc', ''))[:50] if pd.notna(row.get('vehicle_data.body_type_desc')) else None
                color = str(row.get('colour', ''))[:50] if pd.notna(row.get('colour')) else None
                fuel_type = str(row.get('vehicle_data.fuel_type_desc', 'Electric'))[:50]
                transmission = str(row.get('vehicle_data.transmission_desc', 'Automatic'))[:50]
                main_image = images[0] if images else None
                images_json = json.dumps(images[:10]) if images else None
                description = str(row.get('advert_heading', '')) if pd.notna(row.get('advert_heading')) else None
                vin = str(row.get('vehicle_registration_mark', ''))[:50] if pd.notna(row.get('vehicle_registration_mark')) else None
                
                # Insert into database
                sql = """
                INSERT INTO cars (
                    make, model, year, price, mileage, `condition`, bodyType, color,
                    fuelType, transmission, mainImage, images, description, vin, 
                    isAvailable, isFeatured
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
                """
                
                cursor.execute(sql, (
                    make, model, year, price, mileage, condition, body_type, color,
                    fuel_type, transmission, main_image, images_json, description, vin,
                    True, False
                ))
                
                total_imported += 1
                
            except Exception as e:
                total_errors += 1
                if total_errors <= 10:  # Only print first 10 errors
                    print(f"  Error on row {idx}: {str(e)[:100]}")
        
        # Commit after each chunk
        conn.commit()
        print(f"  Committed {end_idx - start_idx} rows. Total imported: {total_imported}, Errors: {total_errors}")
    
    print(f"\n✓ Import complete!")
    print(f"  Total imported: {total_imported}")
    print(f"  Total errors: {total_errors}")
    
except Exception as e:
    print(f"\n✗ Fatal error: {e}")
    import traceback
    traceback.print_exc()
finally:
    if 'cursor' in locals():
        cursor.close()
    if 'conn' in locals():
        conn.close()
