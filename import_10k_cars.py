#!/usr/bin/env python3.11
"""
Fast import script for first 10,000 OneAuto vehicles with real images
"""
import pandas as pd
import mysql.connector
import json
import os

# Database connection
DATABASE_URL = os.getenv('DATABASE_URL', '')
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

print(f"Connecting to database...")

# Read Excel file - only first 10,000 rows
excel_path = '/home/ubuntu/upload/onautoaip-FULL-EXPORT-Ev-Petrol-Hybrid18-12-25(1).xlsx'
print(f"Reading first 10,000 vehicles from Excel...")

df = pd.read_excel(excel_path, nrows=10000)
print(f"Loaded {len(df)} vehicles")

try:
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    
    # Clear existing data
    print("Clearing existing cars...")
    cursor.execute("DELETE FROM cars")
    conn.commit()
    
    total_imported = 0
    total_skipped = 0
    
    print("\nImporting vehicles...")
    
    for idx, row in df.iterrows():
        try:
            # Parse images from image_links column
            images = []
            if pd.notna(row.get('image_links')):
                try:
                    img_str = str(row['image_links'])
                    # Handle both list format and string format
                    if img_str.startswith('['):
                        images = eval(img_str)
                    else:
                        images = [img_str]
                    if not isinstance(images, list):
                        images = []
                except:
                    images = []
            
            # Get make and model
            make = str(row.get('vehicle_data.manufacturer_desc', ''))[:100] if pd.notna(row.get('vehicle_data.manufacturer_desc')) else None
            model = str(row.get('vehicle_data.model_range_desc', ''))[:100] if pd.notna(row.get('vehicle_data.model_range_desc')) else None
            
            if not make or not model or not images:
                total_skipped += 1
                continue
            
            # Prepare data
            year = int(row.get('vehicle_data.first_registration_year')) if pd.notna(row.get('vehicle_data.first_registration_year')) else None
            price = float(row.get('advertised_price_gbp')) if pd.notna(row.get('advertised_price_gbp')) else None
            mileage = int(row.get('mileage_observed')) if pd.notna(row.get('mileage_observed')) else None
            condition = 'used' if str(row.get('ownership_condition')).lower() == 'used' else 'new'
            body_type = str(row.get('vehicle_data.body_type_desc', ''))[:50] if pd.notna(row.get('vehicle_data.body_type_desc')) else None
            color = str(row.get('colour', ''))[:50] if pd.notna(row.get('colour')) else None
            fuel_type = str(row.get('vehicle_data.fuel_type_desc', 'Electric'))[:50]
            transmission = str(row.get('vehicle_data.transmission_desc', 'Automatic'))[:50]
            main_image = images[0] if images else None
            images_json = json.dumps(images[:10])
            description = str(row.get('advert_heading', ''))[:500] if pd.notna(row.get('advert_heading')) else None
            vin = str(row.get('vehicle_registration_mark', ''))[:50] if pd.notna(row.get('vehicle_registration_mark')) else None
            
            # Insert
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
            
            # Progress update every 500 rows
            if total_imported % 500 == 0:
                conn.commit()
                print(f"  Imported {total_imported} vehicles...")
            
        except Exception as e:
            total_skipped += 1
            if total_skipped <= 5:
                print(f"  Skipped row {idx}: {str(e)[:80]}")
    
    conn.commit()
    print(f"\n✓ Import complete!")
    print(f"  Total imported: {total_imported}")
    print(f"  Total skipped: {total_skipped}")
    
except Exception as e:
    print(f"\n✗ Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    if 'cursor' in locals():
        cursor.close()
    if 'conn' in locals():
        conn.close()
