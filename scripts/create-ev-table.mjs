import { createConnection } from 'mysql2/promise';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Get DB URL from environment
const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const conn = await createConnection(DB_URL);

// Create the table
try {
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`evVehicles\` (
    \`id\` int NOT NULL,
    \`make\` varchar(100),
    \`model\` varchar(100),
    \`version\` varchar(200),
    \`availability_status\` int,
    \`availability_date_from\` varchar(20),
    \`availability_date_to\` varchar(20),
    \`price_from_uk\` int,
    \`drivetrain_type\` varchar(20),
    \`drivetrain_propulsion\` varchar(50),
    \`drivetrain_power\` int,
    \`drivetrain_power_hp\` int,
    \`drivetrain_torque\` int,
    \`performance_acceleration\` decimal(5,1),
    \`performance_topspeed\` int,
    \`range_wltp\` int,
    \`range_real\` int,
    \`range_real_w_hwy\` int,
    \`range_real_w_cmb\` int,
    \`range_real_w_cty\` int,
    \`range_real_b_hwy\` int,
    \`range_real_b_cmb\` int,
    \`range_real_b_cty\` int,
    \`efficiency_real\` int,
    \`efficiency_real_fuel_eq_v\` int,
    \`fastcharge_plug\` varchar(50),
    \`fastcharge_power_max\` int,
    \`fastcharge_power_avg\` int,
    \`fastcharge_charge_time\` int,
    \`fastcharge_charge_speed\` int,
    \`fastcharge_optional\` boolean,
    \`fastcharge_table\` json,
    \`battery_capacity_useable\` decimal(6,1),
    \`battery_capacity_full\` decimal(6,1),
    \`dims_length\` int,
    \`dims_width\` int,
    \`dims_height\` int,
    \`dims_wheelbase\` int,
    \`dims_weight\` int,
    \`dims_weight_gvwr\` int,
    \`dims_bootspace\` int,
    \`dims_bootspace_max\` int,
    \`dims_bootspace_frunk\` int,
    \`dims_tow_hitch\` boolean,
    \`dims_tow_weight_braked\` int,
    \`misc_body\` varchar(50),
    \`misc_segment\` varchar(10),
    \`misc_seats\` int,
    \`bik_uk_year\` varchar(20),
    \`bik_uk_rate\` int,
    \`bik_uk_amount\` int,
    \`evdb_detail_url\` varchar(500),
    \`images\` json,
    \`related_successor_id\` int,
    CONSTRAINT \`evVehicles_id\` PRIMARY KEY(\`id\`)
  )`);
  console.log('✅ evVehicles table created');
} catch(e) {
  if (e.code === 'ER_TABLE_EXISTS_ERROR') {
    console.log('✅ evVehicles table already exists');
  } else {
    console.error('Error creating table:', e.message);
    process.exit(1);
  }
}

// Load and import the EV database JSON
const jsonPath = '/tmp/ev-clean.json'; // cleaned version of /home/ubuntu/upload/ev-database.json
let vehicles;
try {
  const raw = readFileSync(jsonPath, 'utf8');
  vehicles = JSON.parse(raw);
  console.log(`📦 Loaded ${vehicles.length} vehicles from JSON`);
} catch(e) {
  console.error('Could not load ev-database.json:', e.message);
  process.exit(1);
}

// Insert all vehicles
let inserted = 0;
let skipped = 0;
for (const v of vehicles) {
  try {
    await conn.execute(
      `INSERT IGNORE INTO \`evVehicles\` (
        id, make, model, version, availability_status, availability_date_from, availability_date_to,
        price_from_uk, drivetrain_type, drivetrain_propulsion, drivetrain_power, drivetrain_power_hp,
        drivetrain_torque, performance_acceleration, performance_topspeed, range_wltp, range_real,
        range_real_w_hwy, range_real_w_cmb, range_real_w_cty, range_real_b_hwy, range_real_b_cmb,
        range_real_b_cty, efficiency_real, efficiency_real_fuel_eq_v, fastcharge_plug,
        fastcharge_power_max, fastcharge_power_avg, fastcharge_charge_time, fastcharge_charge_speed,
        fastcharge_optional, fastcharge_table, battery_capacity_useable, battery_capacity_full,
        dims_length, dims_width, dims_height, dims_wheelbase, dims_weight, dims_weight_gvwr,
        dims_bootspace, dims_bootspace_max, dims_bootspace_frunk, dims_tow_hitch, dims_tow_weight_braked,
        misc_body, misc_segment, misc_seats, bik_uk_year, bik_uk_rate, bik_uk_amount,
        evdb_detail_url, images, related_successor_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        v.Vehicle_ID, v.Vehicle_Make, v.Vehicle_Model, v.Vehicle_Model_Version,
        v.Availability_Status,
        v.Availability_Date_From, v.Availability_Date_To,
        v.Price_From_UK, v.Drivetrain_Type, v.Drivetrain_Propulsion,
        v.Drivetrain_Power, v.Drivetrain_Power_HP, v.Drivetrain_Torque,
        v.Performance_Acceleration, v.Performance_Topspeed,
        v.Range_WLTP, v.Range_Real,
        v.Range_Real_WHwy, v.Range_Real_WCmb, v.Range_Real_WCty,
        v.Range_Real_BHwy, v.Range_Real_BCmb, v.Range_Real_BCty,
        v.Efficiency_Real, v.Efficiency_Real_FuelEq_V,
        v.Fastcharge_Plug, v.Fastcharge_Power_Max, v.Fastcharge_Power_Avg,
        v.Fastcharge_ChargeTime, v.Fastcharge_ChargeSpeed,
        v.Fastcharge_Optional ? 1 : 0,
        v.Fastcharge_Table ? JSON.stringify(v.Fastcharge_Table) : null,
        v.Battery_Capacity_Useable, v.Battery_Capacity_Full,
        v.Dims_Length, v.Dims_Width, v.Dims_Height, v.Dims_Wheelbase,
        v.Dims_Weight, v.Dims_Weight_GVWR,
        v.Dims_Bootspace, v.Dims_Bootspace_Max, v.Dims_Bootspace_Frunk,
        v.Dims_Tow_Hitch ? 1 : 0, v.Dims_TowWeight_Braked,
        v.Misc_Body, v.Misc_Segment, v.Misc_Seats,
        v.BIK_UK_Year, v.BIK_UK_Rate, v.BIK_UK_Amount,
        v.EVDB_Detail_URL,
        v.Images ? JSON.stringify(v.Images) : null,
        v.Related_Vehicle_ID_Succesor || null
      ]
    );
    inserted++;
  } catch(e) {
    console.error(`Failed to insert vehicle ${v.Vehicle_ID}:`, e.message);
    skipped++;
  }
}

console.log(`✅ Imported ${inserted} vehicles, skipped ${skipped}`);

// Verify count
const [countRows] = await conn.execute('SELECT COUNT(*) as cnt FROM `evVehicles`');
console.log(`📊 Total records in evVehicles: ${countRows[0].cnt}`);

await conn.end();
