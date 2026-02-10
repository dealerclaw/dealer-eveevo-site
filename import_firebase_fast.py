#!/usr/bin/env python3.11
import pandas as pd
import mysql.connector
import json
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get database connection from DATABASE_URL
db_url = os.getenv('DATABASE_URL')
if db_url:
    parts = db_url.replace('mysql://', '').split('@')
    user_pass = parts[0].split(':')
    host_db = parts[1].split('/')
    host_port = host_db[0].split(':')
    
    db_config = {
        'user': user_pass[0],
        'password': user_pass[1],
        'host': host_port[0],
        'port': int(host_port[1]) if len(host_port) > 1 else 3306,
        'database': host_db[1].split('?')[0]
    }
else:
    print("DATABASE_URL not found")
    sys.exit(1)

print("Reading Excel file in chunks...")
sys.stdout.flush()

# Read Excel file
df = pd.read_excel('/home/ubuntu/upload/Firebase-export-merged-data-to-send.xlsx')
print(f"Loaded {len(df)} rows")
sys.stdout.flush()

# Connect to database
print("Connecting to database...")
sys.stdout.flush()
conn = mysql.connector.connect(**db_config)
cursor = conn.cursor()

# Clear existing data
print("Clearing existing data...")
sys.stdout.flush()
cursor.execute("DELETE FROM reservations")
cursor.execute("DELETE FROM cars")
conn.commit()

# Prepare batch insert
print("Importing vehicles in batches...")
sys.stdout.flush()

batch_size = 100
imported = 0
errors = 0
batch_data = []

for idx, row in df.iterrows():
    try:
        # Parse images from photoURLs column
        images = []
        if pd.notna(row.get('photoURLs')):
            try:
                images = json.loads(row['photoURLs']) if isinstance(row['photoURLs'], str) else row['photoURLs']
                if not isinstance(images, list):
                    images = []
            except:
                images = []
        
        main_image = images[0] if images else None
        
        # Extract fields
        make = str(row.get('make', '')).strip() if pd.notna(row.get('make')) else ''
        model = str(row.get('model', '')).strip() if pd.notna(row.get('model')) else ''
        
        if not make or not model:
            continue
            
        year = int(row['year']) if pd.notna(row.get('year')) else None
        price = float(row['PriceRetailIncludingVAT']) if pd.notna(row.get('PriceRetailIncludingVAT')) else None
        mileage = int(row['Mileage']) if pd.notna(row.get('Mileage')) else None
        
        range_miles = None
        if pd.notna(row.get('Range_WLTP_Miles')):
            try:
                range_miles = int(float(row['Range_WLTP_Miles']))
            except:
                pass
        
        battery_capacity = str(row.get('Battery_Capacity_Full', '')) if pd.notna(row.get('Battery_Capacity_Full')) else None
        charging_time = str(row.get('Charging_Time_Hours_10_100_DC', '')) if pd.notna(row.get('Charging_Time_Hours_10_100_DC')) else None
        condition = 'used' if pd.notna(row.get('Condition')) and 'used' in str(row['Condition']).lower() else 'new'
        body_type = str(row.get('BodyStyle', '')) if pd.notna(row.get('BodyStyle')) else None
        fuel_type = str(row.get('FuelType', 'Electric')) if pd.notna(row.get('FuelType')) else 'Electric'
        transmission = str(row.get('Transmission', '')) if pd.notna(row.get('Transmission')) else None
        color = str(row.get('CarColour', '')) if pd.notna(row.get('CarColour')) else None
        description = str(row.get('Description', '')) if pd.notna(row.get('Description')) else None
        # Add to batch
        batch_data.append((
            make, model, year, price, mileage, range_miles, battery_capacity, charging_time,
            condition, body_type, fuel_type, transmission, color, description,
            main_image, json.dumps(images)
        ))
        
        # Insert batch when full
        if len(batch_data) >= batch_size:
            sql = """
            INSERT INTO cars (
                make, model, year, price, mileage, `range`, batteryCapacity, chargingTime,
                `condition`, bodyType, fuelType, transmission, color, description,
                mainImage, images, createdAt, updatedAt
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW()
            )
            """
            cursor.executemany(sql, batch_data)
            conn.commit()
            imported += len(batch_data)
            print(f"Imported {imported} vehicles...")
            sys.stdout.flush()
            batch_data = []
            
    except Exception as e:
        errors += 1
        if errors < 5:
            print(f"Error at row {idx}: {e}")
            sys.stdout.flush()

# Insert remaining batch
if batch_data:
    sql = """
    INSERT INTO cars (
        make, model, year, price, mileage, `range`, batteryCapacity, chargingTime,
        `condition`, bodyType, fuelType, transmission, color, description,
        mainImage, images, createdAt, updatedAt
    ) VALUES (
        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW()
    )
    """
    cursor.executemany(sql, batch_data)
    conn.commit()
    imported += len(batch_data)

cursor.close()
conn.close()

print(f"\nImport complete!")
print(f"Successfully imported: {imported} vehicles")
print(f"Errors: {errors}")
sys.stdout.flush()
