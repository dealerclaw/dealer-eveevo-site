#!/usr/bin/env python3.11
import pandas as pd
import mysql.connector
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get database connection from DATABASE_URL
db_url = os.getenv('DATABASE_URL')
# Parse mysql://user:pass@host:port/dbname
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
    exit(1)

print("Reading Excel file...")
df = pd.read_excel('/home/ubuntu/upload/Firebase-export-merged-data-to-send.xlsx')
print(f"Total rows: {len(df)}")

# Connect to database
print("Connecting to database...")
conn = mysql.connector.connect(**db_config)
cursor = conn.cursor()

# Clear existing data (delete reservations first due to foreign key)
print("Clearing existing reservations...")
cursor.execute("DELETE FROM reservations")
conn.commit()

print("Clearing existing cars...")
cursor.execute("DELETE FROM cars")
conn.commit()

# Import new data
print("Importing merged Firebase data...")
imported = 0
errors = 0

for idx, row in df.iterrows():
    try:
        # Parse images from image_links column
        images = []
        if pd.notna(row.get('image_links')):
            try:
                images = json.loads(row['image_links']) if isinstance(row['image_links'], str) else row['image_links']
                if not isinstance(images, list):
                    images = []
            except:
                images = []
        
        main_image = images[0] if images else None
        
        # Extract key fields
        make = str(row.get('make', '')).strip() if pd.notna(row.get('make')) else ''
        model = str(row.get('model', '')).strip() if pd.notna(row.get('model')) else ''
        
        if not make or not model:
            continue
            
        year = int(row['year']) if pd.notna(row.get('year')) else None
        price = float(row['PriceRetailIncludingVAT']) if pd.notna(row.get('PriceRetailIncludingVAT')) else None
        mileage = int(row['Mileage']) if pd.notna(row.get('Mileage')) else None
        
        # EV-specific fields
        range_miles = None
        if pd.notna(row.get('Range_WLTP_Miles')):
            try:
                range_miles = int(float(row['Range_WLTP_Miles']))
            except:
                pass
        
        battery_capacity = str(row.get('Battery_Capacity_Full', '')) if pd.notna(row.get('Battery_Capacity_Full')) else None
        charging_time = str(row.get('Charging_Time_Hours_10_100_DC', '')) if pd.notna(row.get('Charging_Time_Hours_10_100_DC')) else None
        
        # Additional fields
        condition = 'used' if pd.notna(row.get('Condition')) and 'used' in str(row['Condition']).lower() else 'new'
        body_type = str(row.get('BodyStyle', '')) if pd.notna(row.get('BodyStyle')) else None
        fuel_type = str(row.get('FuelType', 'Electric')) if pd.notna(row.get('FuelType')) else 'Electric'
        transmission = str(row.get('Transmission', '')) if pd.notna(row.get('Transmission')) else None
        color = str(row.get('CarColour', '')) if pd.notna(row.get('CarColour')) else None
        
        # Description
        description = str(row.get('Description', '')) if pd.notna(row.get('Description')) else None
        
        # Dealer info
        dealer_name = str(row.get('DealerName', '')) if pd.notna(row.get('DealerName')) else None
        dealer_location = str(row.get('DealerAddress', '')) if pd.notna(row.get('DealerAddress')) else None
        
        # Insert into database
        sql = """
        INSERT INTO cars (
            make, model, year, price, mileage, `range`, batteryCapacity, chargingTime,
            `condition`, bodyType, fuelType, transmission, color, description,
            mainImage, images, dealerName, dealerLocation, createdAt, updatedAt
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW()
        )
        """
        
        cursor.execute(sql, (
            make, model, year, price, mileage, range_miles, battery_capacity, charging_time,
            condition, body_type, fuel_type, transmission, color, description,
            main_image, json.dumps(images), dealer_name, dealer_location
        ))
        
        imported += 1
        if imported % 100 == 0:
            print(f"Imported {imported} vehicles...")
            conn.commit()
            
    except Exception as e:
        errors += 1
        if errors < 10:
            print(f"Error importing row {idx}: {e}")

# Final commit
conn.commit()
cursor.close()
conn.close()

print(f"\nImport complete!")
print(f"Successfully imported: {imported} vehicles")
print(f"Errors: {errors}")
