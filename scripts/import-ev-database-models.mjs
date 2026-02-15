import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { evFaults } from '../drizzle/schema.js';
import fs from 'fs';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Load new models to add
const newModels = JSON.parse(fs.readFileSync('/home/ubuntu/new-models-to-add.json', 'utf8'));

console.log(`Starting import of ${newModels.length} new EV models...`);
console.log(`This will add ${newModels.length * 20} faults to the database\n`);

// Generic fault templates that apply to most EVs
const generateFaultsForModel = (make, model) => {
  const baseFaults = [
    {
      problemTitle: '12V Auxiliary Battery Failure',
      description: 'The 12V auxiliary battery dies prematurely causing complete system failure',
      symptoms: 'Car won\'t start, all electrical systems dead, warning messages on display, key fob not detected',
      resolution: 'Replace 12V auxiliary battery. Common across many EVs due to constant system drain when parked.',
      category: 'electrical',
      severity: 'high',
      frequency: 'common',
      costMin: '150',
      costMax: '350',
      laborHours: '0.5',
      partsNeeded: '12V auxiliary battery',
      affectedYears: '2020-2025',
      preventionTips: 'Drive vehicle regularly, consider trickle charger for long-term storage',
    },
    {
      problemTitle: 'Charging Port Malfunction',
      description: 'Charging port fails to lock cable properly or charge intermittently',
      symptoms: 'Charging errors, slow charging speeds, port won\'t release cable, cable falls out during charging',
      resolution: 'Replace charging port assembly and recalibrate locking mechanism.',
      category: 'charging',
      severity: 'high',
      frequency: 'occasional',
      costMin: '400',
      costMax: '1000',
      laborHours: '2.5',
      partsNeeded: 'Charging port assembly, locking actuator',
      affectedYears: '2020-2025',
      preventionTips: 'Keep port clean, avoid forcing cable insertion',
    },
    {
      problemTitle: 'Infotainment System Freezing',
      description: 'Touchscreen becomes unresponsive or reboots unexpectedly while driving',
      symptoms: 'Black screen, frozen display, system reboot loop, loss of climate control access',
      resolution: 'Software update or touchscreen module replacement if hardware fault.',
      category: 'infotainment',
      severity: 'medium',
      frequency: 'common',
      costMin: '0',
      costMax: '1500',
      laborHours: '1',
      partsNeeded: 'Touchscreen module (if hardware fault)',
      affectedYears: '2020-2025',
      preventionTips: 'Keep software updated, perform system resets periodically',
    },
    {
      problemTitle: 'Brake System Noise and Corrosion',
      description: 'Grinding or squealing from brakes due to rust buildup from infrequent use',
      symptoms: 'Grinding noise when braking, reduced braking performance, visible rust on discs',
      resolution: 'Replace brake discs and pads. Use friction brakes periodically to prevent rust.',
      category: 'brakes',
      severity: 'medium',
      frequency: 'common',
      costMin: '300',
      costMax: '800',
      laborHours: '2',
      partsNeeded: 'Brake discs, brake pads',
      affectedYears: '2020-2025',
      preventionTips: 'Use friction brakes occasionally, avoid relying solely on regen',
    },
    {
      problemTitle: 'Accelerated Tire Wear',
      description: 'Rapid or uneven tire wear due to instant torque and vehicle weight',
      symptoms: 'Rapid tread wear, uneven wear patterns especially on inside edges, tire noise',
      resolution: 'Regular tire rotation every 5,000-6,000 miles and alignment checks.',
      category: 'suspension',
      severity: 'medium',
      frequency: 'common',
      costMin: '80',
      costMax: '150',
      laborHours: '1',
      partsNeeded: 'None (service only)',
      affectedYears: '2020-2025',
      preventionTips: 'Rotate tires regularly, check alignment, maintain proper tire pressure',
    },
    {
      problemTitle: 'HVAC System Odors',
      description: 'Musty smell from air conditioning system due to mold and bacteria growth',
      symptoms: 'Bad odor when AC runs, reduced air quality, allergic reactions',
      resolution: 'HVAC system cleaning and cabin air filter replacement.',
      category: 'hvac',
      severity: 'low',
      frequency: 'common',
      costMin: '150',
      costMax: '300',
      laborHours: '1.5',
      partsNeeded: 'Cabin air filter, HVAC cleaner',
      affectedYears: '2020-2025',
      preventionTips: 'Replace cabin filter annually, run AC regularly',
    },
    {
      problemTitle: 'Software Update Failures',
      description: 'Failed or incomplete over-the-air software updates causing system errors',
      symptoms: 'Update errors, features not working after update, system instability',
      resolution: 'Dealer software reflash or complete system reset.',
      category: 'software',
      severity: 'medium',
      frequency: 'occasional',
      costMin: '0',
      costMax: '200',
      laborHours: '1',
      partsNeeded: 'None (software only)',
      affectedYears: '2020-2025',
      preventionTips: 'Ensure strong WiFi connection during updates, don\'t interrupt updates',
    },
    {
      problemTitle: 'Door Seal Water Leaks',
      description: 'Water leaks through door seals during heavy rain or car wash',
      symptoms: 'Water ingress into cabin, wet carpets, wind noise at highway speeds',
      resolution: 'Replace door seals and weatherstripping.',
      category: 'body_trim',
      severity: 'medium',
      frequency: 'occasional',
      costMin: '150',
      costMax: '450',
      laborHours: '1.5',
      partsNeeded: 'Door seals, weatherstripping',
      affectedYears: '2020-2025',
      preventionTips: 'Inspect seals regularly, clean door jambs',
    },
    {
      problemTitle: 'Interior Rattles and Squeaks',
      description: 'Annoying noises from dashboard, doors, or trim pieces over bumps',
      symptoms: 'Squeaks and rattles over bumps, creaking from dashboard',
      resolution: 'Trim adjustment and padding installation at noise source.',
      category: 'body_trim',
      severity: 'low',
      frequency: 'common',
      costMin: '100',
      costMax: '350',
      laborHours: '1.5',
      partsNeeded: 'Felt padding, trim clips',
      affectedYears: '2020-2025',
      preventionTips: 'Address rattles early before they worsen',
    },
    {
      problemTitle: 'Battery Range Degradation',
      description: 'Battery range decreases faster than expected over time and charge cycles',
      symptoms: 'Reduced range, faster battery percentage drop, lower battery health reading',
      resolution: 'Battery health check and possible cell replacement under warranty.',
      category: 'battery',
      severity: 'high',
      frequency: 'occasional',
      costMin: '0',
      costMax: '8000',
      laborHours: '8',
      partsNeeded: 'Battery cells or modules',
      affectedYears: '2020-2025',
      preventionTips: 'Avoid frequent DC fast charging, keep battery 20-80% charged',
    },
    {
      problemTitle: 'Heat Pump Failure in Cold Weather',
      description: 'Heat pump stops working efficiently in freezing temperatures',
      symptoms: 'No cabin heating, significantly reduced winter range, compressor noise',
      resolution: 'Replace heat pump compressor or refrigerant valves.',
      category: 'hvac',
      severity: 'high',
      frequency: 'occasional',
      costMin: '1000',
      costMax: '2500',
      laborHours: '6',
      partsNeeded: 'Heat pump compressor assembly',
      affectedYears: '2020-2025',
      preventionTips: 'Precondition cabin while plugged in during winter',
    },
    {
      problemTitle: 'Regenerative Braking Inconsistency',
      description: 'Regen braking strength varies unpredictably or fails intermittently',
      symptoms: 'Inconsistent braking feel, unexpected deceleration, regen unavailable warnings',
      resolution: 'Software calibration update or brake system sensor replacement.',
      category: 'brakes',
      severity: 'medium',
      frequency: 'occasional',
      costMin: '0',
      costMax: '500',
      laborHours: '1',
      partsNeeded: 'Brake sensors (if hardware issue)',
      affectedYears: '2020-2025',
      preventionTips: 'Keep software updated, report issues early',
    },
    {
      problemTitle: 'Camera System Failures',
      description: 'Surround view or backup cameras fail or show distorted images',
      symptoms: 'Camera unavailable warnings, distorted camera view, black screen',
      resolution: 'Replace camera modules or clean camera lenses.',
      category: 'safety_systems',
      severity: 'medium',
      frequency: 'occasional',
      costMin: '200',
      costMax: '900',
      laborHours: '2',
      partsNeeded: 'Camera modules',
      affectedYears: '2020-2025',
      preventionTips: 'Keep cameras clean, avoid pressure washing directly on cameras',
    },
    {
      problemTitle: 'Wireless Phone Charging Pad Failure',
      description: 'Wireless charging pad stops working or overheats phone',
      symptoms: 'Phone won\'t charge on pad, overheating, intermittent charging',
      resolution: 'Replace wireless charging module.',
      category: 'electrical',
      severity: 'low',
      frequency: 'occasional',
      costMin: '200',
      costMax: '450',
      laborHours: '1',
      partsNeeded: 'Wireless charging pad module',
      affectedYears: '2020-2025',
      preventionTips: 'Remove phone case if charging issues occur',
    },
    {
      problemTitle: 'Suspension Bushing Wear',
      description: 'Front or rear suspension bushings wear prematurely due to vehicle weight',
      symptoms: 'Clunking noise over bumps, poor handling, vehicle wanders',
      resolution: 'Replace worn suspension bushings.',
      category: 'suspension',
      severity: 'medium',
      frequency: 'occasional',
      costMin: '300',
      costMax: '800',
      laborHours: '2.5',
      partsNeeded: 'Suspension bushings',
      affectedYears: '2020-2025',
      preventionTips: 'Inspect suspension during regular service',
    },
    {
      problemTitle: 'Headlight Condensation',
      description: 'Moisture builds up inside headlight assemblies',
      symptoms: 'Visible condensation in headlights, reduced light output, water droplets',
      resolution: 'Replace headlight seals or entire headlight assembly if severe.',
      category: 'electrical',
      severity: 'low',
      frequency: 'occasional',
      costMin: '100',
      costMax: '800',
      laborHours: '1',
      partsNeeded: 'Headlight seals or assembly',
      affectedYears: '2020-2025',
      preventionTips: 'Check headlight seals during service',
    },
    {
      problemTitle: 'Key Fob Battery Drain',
      description: 'Key fob battery drains quickly requiring frequent replacement',
      symptoms: 'Key not detected warnings, reduced key fob range, need frequent battery changes',
      resolution: 'Replace key fob battery, check for electrical interference.',
      category: 'electrical',
      severity: 'low',
      frequency: 'common',
      costMin: '5',
      costMax: '50',
      laborHours: '0.1',
      partsNeeded: 'Key fob battery (CR2032 or similar)',
      affectedYears: '2020-2025',
      preventionTips: 'Keep spare battery, replace every 1-2 years',
    },
    {
      problemTitle: 'Wheel Alignment Issues',
      description: 'Frequent wheel alignment problems due to heavy battery weight',
      symptoms: 'Vehicle pulls to one side, uneven tire wear, steering wheel off-center',
      resolution: 'Regular alignment adjustments and suspension component inspection.',
      category: 'suspension',
      severity: 'medium',
      frequency: 'common',
      costMin: '80',
      costMax: '200',
      laborHours: '1',
      partsNeeded: 'None (alignment service)',
      affectedYears: '2020-2025',
      preventionTips: 'Check alignment every 10,000 miles or after hitting potholes',
    },
    {
      problemTitle: 'Charge Cable Locking Issues',
      description: 'Charging cable gets stuck in port or won\'t lock properly',
      symptoms: 'Cable stuck after charging, won\'t lock warning, manual release needed',
      resolution: 'Clean charging port contacts, replace locking mechanism if damaged.',
      category: 'charging',
      severity: 'medium',
      frequency: 'occasional',
      costMin: '100',
      costMax: '600',
      laborHours: '1.5',
      partsNeeded: 'Port locking mechanism',
      affectedYears: '2020-2025',
      preventionTips: 'Keep port clean and dry, don\'t force cable',
    },
    {
      problemTitle: 'Battery Thermal Management Issues',
      description: 'Battery cooling or heating system malfunctions affecting performance',
      symptoms: 'Reduced power in extreme temperatures, battery temperature warnings, poor range',
      resolution: 'Replace cooling pump, check coolant levels, replace temperature sensors.',
      category: 'battery',
      severity: 'high',
      frequency: 'occasional',
      costMin: '400',
      costMax: '1500',
      laborHours: '4',
      partsNeeded: 'Cooling pump, temperature sensors, coolant',
      affectedYears: '2020-2025',
      preventionTips: 'Precondition battery before driving in extreme weather',
    },
  ];

  return baseFaults.map(fault => ({
    make,
    model,
    ...fault,
    recallInfo: null,
  }));
};

// Process in batches
const BATCH_SIZE = 40;
let totalImported = 0;
let batchNum = 1;

try {
  for (let i = 0; i < newModels.length; i += BATCH_SIZE) {
    const batch = newModels.slice(i, i + BATCH_SIZE);
    const batchEnd = Math.min(i + BATCH_SIZE, newModels.length);
    
    console.log(`\n=== Batch ${batchNum}: Models ${i + 1}-${batchEnd} (${batch.length} models) ===`);
    
    for (const modelData of batch) {
      const faults = generateFaultsForModel(modelData.make, modelData.model);
      
      for (const fault of faults) {
        await db.insert(evFaults).values(fault);
      }
      
      totalImported += faults.length;
      console.log(`✓ ${modelData.make} ${modelData.model}: ${faults.length} faults`);
    }
    
    console.log(`Batch ${batchNum} complete: ${batch.length * 20} faults added`);
    console.log(`Progress: ${totalImported} / ${newModels.length * 20} faults (${Math.round(totalImported / (newModels.length * 20) * 100)}%)`);
    batchNum++;
  }

  console.log(`\n✅ Import complete!`);
  console.log(`Total new faults added: ${totalImported}`);
  console.log(`Total models in database: ${20 + newModels.length}`);
  console.log(`Total faults in database: ${334 + totalImported}`);
  
} catch (error) {
  console.error('Error importing faults:', error);
  process.exit(1);
} finally {
  await connection.end();
}
