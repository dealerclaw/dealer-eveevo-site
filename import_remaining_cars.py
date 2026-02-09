#!/usr/bin/env python3.11
import pandas as pd
import mysql.connector
import os
import json
from datetime import datetime

# Database connection
db = mysql.connector.connect(
    host=os.environ.get('DB_HOST', 'gateway01.us-west-2.prod.aws.tidbcloud.com'),
    port=int(os.environ.get('DB_PORT', '4000')),
    user=os.environ.get('DB_USER', '3xfgLHwFPKNMXVd.root'),
    password=os.environ.get('DB_PASSWORD', 'xNQZMEy8dF8qqPfz'),
    database=os.environ.get('DB_NAME', 'eveevo_web'),
    ssl_ca='/etc/ssl/certs/ca-certificates.crt'
)

cursor = db.cursor()

print("Loading Excel file...")
df = pd.read_excel('/home/ubuntu/upload/onautoaip-FULL-EXPORT-Ev-Petrol-Hybrid18-12-25(1).xlsx')

# Skip first 10,000 rows (already imported)
df = df.iloc[10000:]

print(f"Total rows to import: {len(df)}")

# Process in batches of 1000
batch_size = 1000
total_imported = 0

for start_idx in range(0, len(df), batch_size):
    end_idx = min(start_idx + batch_size, len(df))
    batch = df.iloc[start_idx:end_idx]
    
    values = []
    for _, row in batch.iterrows():
        # Parse images
        images = []
        if pd.notna(row.get('image_links')):
            img_str = str(row['image_links'])
            if img_str.startswith('[') and img_str.endswith(']'):
                try:
                    images = json.loads(img_str.replace("'", '"'))
                except:
                    images = [url.strip().strip("'") for url in img_str.strip('[]').split(',') if url.strip()]
            else:
                images = [img_str]
        
        # Prepare values
        car_id = str(row.get('id', ''))
        make = str(row.get('make', ''))[:100] if pd.notna(row.get('make')) else ''
        model = str(row.get('model', ''))[:100] if pd.notna(row.get('model')) else ''
        year = int(row.get('year', 0)) if pd.notna(row.get('year')) and str(row.get('year')).replace('.', '').isdigit() else None
        price = float(row.get('price', 0)) if pd.notna(row.get('price')) and str(row.get('price')).replace('.', '').replace('-', '').isdigit() else None
        mileage = int(row.get('mileage', 0)) if pd.notna(row.get('mileage')) and str(row.get('mileage')).replace('.', '').isdigit() else None
        body_type = str(row.get('bodyType', ''))[:50] if pd.notna(row.get('bodyType')) else None
        fuel_type = str(row.get('fuel', ''))[:50] if pd.notna(row.get('fuel')) else None
        transmission = str(row.get('trans', ''))[:50] if pd.notna(row.get('trans')) else None
        range_val = int(row.get('rangeReal', 0)) if pd.notna(row.get('rangeReal')) and str(row.get('rangeReal')).replace('.', '').isdigit() else None
        battery_capacity = str(row.get('batteryCapacityUseable', '')) if pd.notna(row.get('batteryCapacityUseable')) else None
        images_json = json.dumps(images)
        
        values.append((
            car_id, make, model, year, price, mileage, body_type,
            fuel_type, transmission, range_val, battery_capacity, images_json
        ))
    
    if values:
        insert_query = """
        INSERT INTO cars (id, make, model, year, price, mileage, bodyType, fuelType, transmission, `range`, batteryCapacity, images)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            make=VALUES(make),
            model=VALUES(model),
            year=VALUES(year),
            price=VALUES(price),
            mileage=VALUES(mileage),
            bodyType=VALUES(bodyType),
            fuelType=VALUES(fuelType),
            transmission=VALUES(transmission),
            `range`=VALUES(`range`),
            batteryCapacity=VALUES(batteryCapacity),
            images=VALUES(images)
        """
        
        cursor.executemany(insert_query, values)
        db.commit()
        
        total_imported += len(values)
        print(f"Imported batch {start_idx//batch_size + 1}: {total_imported}/{len(df)} cars ({(total_imported/len(df)*100):.1f}%)")

print(f"\n✅ Successfully imported {total_imported} additional cars!")
print(f"Total cars in database: {9604 + total_imported}")

cursor.close()
db.close()
