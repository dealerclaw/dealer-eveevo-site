import { createConnection } from 'mysql2/promise';
import { readFileSync } from 'fs';

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const conn = await createConnection(DB_URL);

// Load PHEV JSON
let vehicles;
try {
  const raw = readFileSync('/home/ubuntu/upload/ev_database_export_phev.json', 'utf8');
  vehicles = JSON.parse(raw);
  console.log(`📦 Loaded ${vehicles.length} PHEV vehicles from JSON`);
} catch(e) {
  console.error('Could not load PHEV JSON:', e.message);
  process.exit(1);
}

// Helper to convert undefined/null to SQL null
const n = (val) => (val === undefined || val === null ? null : val);

const SQL = `INSERT IGNORE INTO \`evVehicles\` (
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
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

// Insert all vehicles using INSERT IGNORE to skip duplicates
let inserted = 0;
let skipped = 0;
for (const v of vehicles) {
  try {
    const params = [
      n(v.Vehicle_ID), n(v.Vehicle_Make), n(v.Vehicle_Model), n(v.Vehicle_Model_Version),
      n(v.Availability_Status),
      n(v.Availability_Date_From), n(v.Availability_Date_To),
      n(v.Price_From_UK), n(v.Drivetrain_Type), n(v.Drivetrain_Propulsion),
      n(v.Drivetrain_Power), n(v.Drivetrain_Power_HP), n(v.Drivetrain_Torque),
      n(v.Performance_Acceleration), n(v.Performance_Topspeed),
      n(v.Range_WLTP), n(v.Range_Real),
      n(v.Range_Real_WHwy), n(v.Range_Real_WCmb), n(v.Range_Real_WCty),
      n(v.Range_Real_BHwy), n(v.Range_Real_BCmb), n(v.Range_Real_BCty),
      n(v.Efficiency_Real), n(v.Efficiency_Real_FuelEq_V),
      n(v.Fastcharge_Plug), n(v.Fastcharge_Power_Max), n(v.Fastcharge_Power_Avg),
      n(v.Fastcharge_ChargeTime), n(v.Fastcharge_ChargeSpeed),
      v.Fastcharge_Optional ? 1 : 0,
      v.Fastcharge_Table ? JSON.stringify(v.Fastcharge_Table) : null,
      n(v.Battery_Capacity_Useable), n(v.Battery_Capacity_Full),
      n(v.Dims_Length), n(v.Dims_Width), n(v.Dims_Height), n(v.Dims_Wheelbase),
      n(v.Dims_Weight), n(v.Dims_Weight_GVWR),
      n(v.Dims_Bootspace), n(v.Dims_Bootspace_Max), n(v.Dims_Bootspace_Frunk),
      v.Dims_Tow_Hitch ? 1 : 0, n(v.Dims_TowWeight_Braked),
      n(v.Misc_Body), n(v.Misc_Segment), n(v.Misc_Seats),
      n(v.BIK_UK_Year), n(v.BIK_UK_Rate), n(v.BIK_UK_Amount),
      n(v.EVDB_Detail_URL),
      v.Images ? JSON.stringify(v.Images) : null,
      v.Related_Vehicle_ID_Succesor || null
    ];
    const [result] = await conn.execute(SQL, params);
    if (result.affectedRows > 0) {
      inserted++;
    } else {
      skipped++; // Already exists (duplicate ID)
    }
  } catch(e) {
    console.error(`Failed to insert vehicle ${v.Vehicle_ID}:`, e.message);
    skipped++;
  }
}

console.log(`✅ Imported ${inserted} new PHEV vehicles, skipped ${skipped} duplicates`);

// Verify total count
const [countRows] = await conn.execute('SELECT COUNT(*) as cnt FROM `evVehicles`');
console.log(`📊 Total records in evVehicles: ${countRows[0].cnt}`);

await conn.end();
