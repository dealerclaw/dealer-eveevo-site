import pandas as pd
import json
import sys

# Read Excel
df = pd.read_excel('/home/ubuntu/upload/onautoaip-FULL-EXPORT-Ev-Petrol-Hybrid18-12-25(1).xlsx')

print(f"Processing {len(df)} cars...")

# Convert to JSON for Node.js to process
cars_data = []
for idx, row in df.iterrows():
    try:
        # Parse image links
        images = []
        if pd.notna(row.get('image_links')):
            try:
                images = eval(row['image_links']) if isinstance(row['image_links'], str) else []
            except:
                images = []
        
        car = {
            'make': str(row.get('vehicle_data.manufacturer_desc', '')),
            'model': str(row.get('vehicle_data.model_range_desc', '')),
            'year': int(row.get('vehicle_data.first_registration_year')) if pd.notna(row.get('vehicle_data.first_registration_year')) else None,
            'price': str(row.get('advertised_price_gbp')) if pd.notna(row.get('advertised_price_gbp')) else None,
            'mileage': int(row.get('mileage_observed')) if pd.notna(row.get('mileage_observed')) else None,
            'condition': 'used' if row.get('ownership_condition') == 'used' else 'new',
            'bodyType': str(row.get('vehicle_data.body_type_desc', '')),
            'color': str(row.get('colour', '')),
            'fuelType': str(row.get('vehicle_data.fuel_type_desc', 'Electric')),
            'transmission': str(row.get('vehicle_data.transmission_desc', 'Automatic')),
            'mainImage': images[0] if images else None,
            'images': json.dumps(images[:10]),  # Store first 10 images
            'description': str(row.get('advert_heading', '')),
            'vin': str(row.get('vehicle_registration_mark', '')),
            'isAvailable': True,
            'isFeatured': False,
            'dealerId': None,
            'location': str(row.get('dealer_details.city', ''))
        }
        cars_data.append(car)
    except Exception as e:
        print(f"Error processing row {idx}: {e}", file=sys.stderr)
        continue

# Save to JSON
with open('/home/ubuntu/eveevo-web/cars_import.json', 'w') as f:
    json.dump(cars_data, f)

print(f"Exported {len(cars_data)} cars to cars_import.json")
