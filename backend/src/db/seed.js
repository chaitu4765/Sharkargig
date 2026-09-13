import bcrypt from 'bcryptjs';
import { run, query, get, exec } from './index.js';
import { initSchema } from './schema.js';

export const seedDatabase = async () => {
  console.log('Resetting and seeding database...');
  
  // Initialize schema
  await initSchema();

  // Clear existing tables
  const tables = [
    'workforce_recommendations', 'demand_predictions', 'notifications', 'sos_alerts',
    'training_records', 'welfare_records', 'insurance_records', 'complaints',
    'ratings', 'invoices', 'payments', 'booking_status_history', 'bookings',
    'worker_certifications', 'certifications', 'worker_skills', 'skills',
    'services', 'service_categories', 'workers', 'customers', 'cooperative_societies',
    'federations', 'users'
  ];

  for (const t of tables) {
    await exec(`DELETE FROM ${t};`);
  }

  const salt = await bcrypt.genSalt(10);
  const defaultPasswordHash = await bcrypt.hash('Password123!', salt);

  // 1. Create Federations
  const fed1 = await run(
    `INSERT INTO federations (name, code, region, contact_email, phone) VALUES (?, ?, ?, ?, ?)`,
    ['Telangana State Labour Cooperatives Federation', 'TSLCF', 'Telangana State', 'contact@tslcf.org', '+91 40 2345 6789']
  );
  const fed2 = await run(
    `INSERT INTO federations (name, code, region, contact_email, phone) VALUES (?, ?, ?, ?, ?)`,
    ['Andhra Pradesh Federation of Worker Cooperatives', 'APFWC', 'Andhra Pradesh', 'info@apfwc.gov.in', '+91 866 244 1122']
  );
  const fed3 = await run(
    `INSERT INTO federations (name, code, region, contact_email, phone) VALUES (?, ?, ?, ?, ?)`,
    ['National Federation of Labour Cooperatives', 'NFLC', 'National Level', 'hq@nflc.coop', '+91 11 2618 9090']
  );

  // 2. Create Cooperative Societies
  const coop1 = await run(
    `INSERT INTO cooperative_societies (federation_id, name, registration_no, region, city, address, latitude, longitude, contact_email, phone)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [fed1.id, 'Hyderabad Central Skilled Artisans Cooperative Society Ltd', 'HYD-COOP-2018-091', 'Central Hyderabad', 'Hyderabad', 'Banjara Hills, Road No 12, Hyderabad', 17.4126, 78.4482, 'admin.hyderabad@sahakar.in', '+91 40 9876 5432']
  );
  const coop2 = await run(
    `INSERT INTO cooperative_societies (federation_id, name, registration_no, region, city, address, latitude, longitude, contact_email, phone)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [fed1.id, 'Cyberabad Tech Services & Tradesmen Labour Cooperative', 'CYB-COOP-2020-142', 'Cyberabad / Hitec', 'Hyderabad', 'Madhapur Main Road, Near Image Hospitals, Hitec City', 17.4483, 78.3808, 'cyberabad@sahakar.in', '+91 40 8765 4321']
  );
  const coop3 = await run(
    `INSERT INTO cooperative_societies (federation_id, name, registration_no, region, city, address, latitude, longitude, contact_email, phone)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [fed1.id, 'Secunderabad Domestic & Caregiving Workers Society', 'SEC-COOP-2016-044', 'Secunderabad', 'Secunderabad', 'RP Road, Near Railway Station, Secunderabad', 17.4399, 78.4983, 'secunderabad@sahakar.in', '+91 40 7654 3210']
  );
  const coop4 = await run(
    `INSERT INTO cooperative_societies (federation_id, name, registration_no, region, city, address, latitude, longitude, contact_email, phone)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [fed2.id, 'Vijayawada Multi-Skilled Labour Cooperative Guild', 'VJA-COOP-2019-301', 'Krishna Region', 'Vijayawada', 'Eluru Road, Governorpet, Vijayawada', 16.5062, 80.6480, 'vijayawada@sahakar.in', '+91 866 665 4321']
  );

  // 3. Create Service Categories & Services
  const categories = [
    { name: 'Electrical & Power', code: 'ELEC', desc: 'Wiring, switchboards, fan repair, fuse fixing', icon: 'Zap' },
    { name: 'Plumbing & Sanitation', code: 'PLUMB', desc: 'Water leakage, pipe fitting, tap installation', icon: 'Droplet' },
    { name: 'Carpentry & Furniture', code: 'CARP', desc: 'Door alignment, furniture assembly, lock replacement', icon: 'Hammer' },
    { name: 'AC & Refrigeration', code: 'AC', desc: 'AC servicing, gas refilling, fridge repair', icon: 'Wind' },
    { name: 'Appliance & Electronics Repair', code: 'APPL', desc: 'Washing machine, microwave, TV repair', icon: 'Tv' },
    { name: 'Home Cleaning & Sanitation', code: 'CLEAN', desc: 'Deep cleaning, bathroom sanitization, sofa wash', icon: 'Sparkles' },
    { name: 'Caregiving & Senior Assistance', code: 'CARE', desc: 'Elderly care, nursing aid, post-surgery assistance', icon: 'HeartPulse' },
    { name: 'Painting & Waterproofing', code: 'PAINT', desc: 'Wall painting, damp proofing, texture art', icon: 'Paintbrush' },
    { name: 'Gardening & Landscaping', code: 'GARDEN', desc: 'Lawn trimming, plant potting, pest removal', icon: 'Trees' },
    { name: 'Domestic Help & Cooking', code: 'DOMESTIC', desc: 'Daily housekeeping, meal preparation', icon: 'Home' },
    { name: 'Driver & Transportation', code: 'DRIVER', desc: 'Personal driver, city trips, outstation driving', icon: 'Car' }
  ];

  const catMap = {};
  for (const c of categories) {
    const res = await run(
      `INSERT INTO service_categories (name, code, description, icon_name) VALUES (?, ?, ?, ?)`,
      [c.name, c.code, c.desc, c.icon]
    );
    catMap[c.code] = res.id;
  }

  const servicesData = [
    { cat: 'PLUMB', name: 'Emergency Leakage Repair', code: 'PLUMB-LEAK', price: 450, dur: 45, icon: 'Droplet', emergency: 1, desc: 'Fix sudden pipe bursts, tap leakages, and water overflow.' },
    { cat: 'PLUMB', name: 'Tap & Mixer Installation', code: 'PLUMB-TAP', price: 350, dur: 45, icon: 'Droplet', emergency: 0, desc: 'Mount new bathroom taps, sink mixers, and health faucets.' },
    { cat: 'PLUMB', name: 'Drainage Unclogging', code: 'PLUMB-DRAIN', price: 600, dur: 60, icon: 'Droplet', emergency: 1, desc: 'Clear blocked kitchen sinks, bathroom drains, and main pipes.' },
    { cat: 'PLUMB', name: 'Overhead Tank Cleaning & Sanitization', code: 'PLUMB-TANK', price: 999, dur: 120, icon: 'Droplet', emergency: 0, desc: 'Complete mechanical scrubbing and UV sanitization of overhead water tanks.' },
    { cat: 'PLUMB', name: 'Wash Basin & Counter Fitting', code: 'PLUMB-BASIN', price: 400, dur: 60, icon: 'Droplet', emergency: 0, desc: 'Mount new ceramic wash basin, bottle trap, and waste pipe assembly.' },
    
    { cat: 'ELEC', name: 'Electrical Short Circuit Troubleshooting', code: 'ELEC-SHORT', price: 500, dur: 60, icon: 'Zap', emergency: 1, desc: 'Diagnose tripped MCBs, burnt sockets, and sudden blackout.' },
    { cat: 'ELEC', name: 'Ceiling Fan Installation & Repair', code: 'ELEC-FAN', price: 300, dur: 40, icon: 'Zap', emergency: 0, desc: 'Assemble, mount ceiling fan or replace regular fan motor.' },
    { cat: 'ELEC', name: 'Switchboard & Socket Fitting', code: 'ELEC-SWITCH', price: 350, dur: 45, icon: 'Zap', emergency: 0, desc: 'Replace faulty switches, install modular sockets, and earthing.' },
    { cat: 'ELEC', name: 'Whole House Electrical Safety Inspection', code: 'ELEC-INSPECT', price: 750, dur: 90, icon: 'Zap', emergency: 0, desc: 'Comprehensive thermal scanning of wiring, earth resistance check, and MCB testing.' },
    { cat: 'ELEC', name: 'Inverter & Heavy Duty Battery Wiring', code: 'ELEC-INVERTER', price: 850, dur: 90, icon: 'Zap', emergency: 1, desc: 'Install power backup inverter, high capacity tubular battery, and selector switch.' },

    { cat: 'AC', name: 'AC Deep Foam Cleaning & Service', code: 'AC-SERVICE', price: 699, dur: 75, icon: 'Wind', emergency: 0, desc: 'High-pressure jet wash, filter cleaning, and cooling check.' },
    { cat: 'AC', name: 'AC Gas Charging & Leak Detection', code: 'AC-GAS', price: 1800, dur: 90, icon: 'Wind', emergency: 1, desc: 'Recharge eco-friendly refrigerant gas and seal pipe pinholes.' },
    { cat: 'AC', name: 'Split AC Uninstallation & Reinstallation', code: 'AC-INSTALL', price: 1499, dur: 120, icon: 'Wind', emergency: 0, desc: 'Dismantle outdoor/indoor unit, copper pipe braze, and remount.' },

    { cat: 'CARP', name: 'Door Lock Repair & Installation', code: 'CARP-LOCK', price: 400, dur: 50, icon: 'Hammer', emergency: 1, desc: 'Fix jammed door handles, mortise locks, or add safety latches.' },
    { cat: 'CARP', name: 'Furniture Assembly & Repair', code: 'CARP-FURN', price: 550, dur: 90, icon: 'Hammer', emergency: 0, desc: 'Assemble modular beds, wardrobes, and align cabinet hinges.' },
    { cat: 'CARP', name: 'Modular Kitchen Drawer & Cabinet Repair', code: 'CARP-KITCHEN', price: 600, dur: 75, icon: 'Hammer', emergency: 0, desc: 'Fix hydraulic hinges, soft-close drawer channels, and cabinet handles.' },
    { cat: 'CARP', name: 'Wooden Floor & Laminate Polishing', code: 'CARP-FLOOR', price: 1200, dur: 180, icon: 'Hammer', emergency: 0, desc: 'Scuff removal, scratch filling, and polyurethane shine coat for wooden flooring.' },

    { cat: 'APPL', name: 'Washing Machine Repair & Drum Service', code: 'APPL-WASH', price: 550, dur: 60, icon: 'Tv', emergency: 0, desc: 'Fix water drain errors, spin motor noise, and PCB board issues.' },
    { cat: 'APPL', name: 'Microwave Oven & Kitchen Hob Service', code: 'APPL-MICRO', price: 450, dur: 45, icon: 'Tv', emergency: 0, desc: 'Replace heating magnetron, touch panel repair, and hob burner cleaning.' },
    { cat: 'APPL', name: 'Smart TV Wall Mounting & Concealed Cabling', code: 'APPL-TV', price: 399, dur: 45, icon: 'Tv', emergency: 0, desc: 'Heavy duty TV wall bracket fitting, alignment, and HDMI cable concealment.' },

    { cat: 'CLEAN', name: 'Full Home Deep Sanitation', code: 'CLEAN-FULL', price: 2499, dur: 240, icon: 'Sparkles', emergency: 0, desc: 'Complete scrubbing of kitchen, washrooms, balcony & windows.' },
    { cat: 'CLEAN', name: 'Sofa & Upholstery Shampoo Deep Wash', code: 'CLEAN-SOFA', price: 899, dur: 90, icon: 'Sparkles', emergency: 0, desc: 'Extraction vacuuming, fabric stain removal, and anti-allergen treatment.' },
    { cat: 'CLEAN', name: 'Kitchen Chimney & Hood Scrubbing', code: 'CLEAN-CHIMNEY', price: 699, dur: 60, icon: 'Sparkles', emergency: 0, desc: 'Degreasing mesh filters, rotor fan cleaning, and stainless steel polish.' },

    { cat: 'CARE', name: 'Elderly Nursing Care (Daily Shift)', code: 'CARE-ELDER', price: 800, dur: 480, icon: 'HeartPulse', emergency: 0, desc: 'Assistance with mobility, medicine reminder, hygiene care.' },
    { cat: 'CARE', name: 'Post-Surgery Patient Assistance & Aid', code: 'CARE-SURGERY', price: 950, dur: 480, icon: 'HeartPulse', emergency: 0, desc: 'Physiotherapy assistance, wound hygiene monitoring, and vital checks.' },
    { cat: 'CARE', name: 'Childcare & Special Needs Day Support', code: 'CARE-CHILD', price: 700, dur: 480, icon: 'HeartPulse', emergency: 0, desc: 'Attentive child monitoring, feeding aid, and educational activity assistance.' },

    { cat: 'PAINT', name: 'Interior Wall Painting & Texture Art', code: 'PAINT-INT', price: 1999, dur: 360, icon: 'Paintbrush', emergency: 0, desc: 'Premium acrylic emulsion coating, wall putty sanding, and accent wall design.' },
    { cat: 'PAINT', name: 'Waterproofing & Damp Shield Treatment', code: 'PAINT-WATERPROOF', price: 2800, dur: 360, icon: 'Paintbrush', emergency: 1, desc: 'Terrace crack filling, silicone sealant coating, and dampness barrier application.' },

    { cat: 'GARDEN', name: 'Lawn Trimming & Garden Maintenance', code: 'GARDEN-MAINT', price: 500, dur: 90, icon: 'Trees', emergency: 0, desc: 'Grass cutting, shrub pruning, organic fertilizer application, and weeding.' },
    { cat: 'GARDEN', name: 'Balcony Plant Potting & Soil Setup', code: 'GARDEN-POTTING', price: 450, dur: 60, icon: 'Trees', emergency: 0, desc: 'Potting mix preparation, coco peat blending, and plant health treatment.' },

    { cat: 'DOMESTIC', name: 'Daily Home Maid & Floor Housekeeping', code: 'DOMESTIC-MAID', price: 400, dur: 120, icon: 'Home', emergency: 0, desc: 'Sweeping, floor mopping, utensil washing, and dust removal.' },
    { cat: 'DOMESTIC', name: 'Home Cook - Meal Preparation (2 Meals)', code: 'DOMESTIC-COOK', price: 650, dur: 120, icon: 'Home', emergency: 0, desc: 'Fresh South/North Indian lunch and dinner preparation for household.' },

    { cat: 'DRIVER', name: 'On-Demand City Personal Driver', code: 'DRIVER-CITY', price: 500, dur: 240, icon: 'Car', emergency: 0, desc: 'Experienced local driver for manual/automatic cars across Hyderabad city.' },
    { cat: 'DRIVER', name: 'Outstation Highway Professional Driver', code: 'DRIVER-OUTSTATION', price: 1200, dur: 720, icon: 'Car', emergency: 0, desc: 'Safe highway driving for long distance trips across Telangana & AP.' }
  ];

  const serviceMap = {};
  for (const s of servicesData) {
    const catId = catMap[s.cat] || catMap['PLUMB'];
    const res = await run(
      `INSERT INTO services (category_id, name, code, description, base_price, estimated_duration_mins, icon_name, is_emergency_capable)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [catId, s.name, s.code, s.desc, s.price, s.dur, s.icon, s.emergency]
    );
    serviceMap[s.code] = res.id;
  }

  // 4. Create Skills & Certifications
  const skillsData = [
    { serviceCode: 'ELEC-SHORT', name: 'High-Voltage Wiring Diagnostics', code: 'SKILL-WIRING' },
    { serviceCode: 'ELEC-SHORT', name: 'MCB & Fuse Troubleshooting', code: 'SKILL-MCB' },
    { serviceCode: 'ELEC-FAN', name: 'Regulator & Fan Motor Winding', code: 'SKILL-FAN' },
    { serviceCode: 'PLUMB-LEAK', name: 'CPVC & GI Pipe Joint Welding', code: 'SKILL-PIPE' },
    { serviceCode: 'PLUMB-DRAIN', name: 'Pressure Drain Jetting', code: 'SKILL-DRAIN' },
    { serviceCode: 'AC-SERVICE', name: 'Inverter Compressor Testing', code: 'SKILL-COMPRESSOR' },
    { serviceCode: 'CARP-LOCK', name: 'Mortise & Digital Lock Fitting', code: 'SKILL-LOCK' },
    { serviceCode: 'CARE-ELDER', name: 'Post-Operative Patient Monitoring', code: 'SKILL-NURSING' }
  ];

  const skillMap = {};
  for (const sk of skillsData) {
    const sId = serviceMap[sk.serviceCode] || 1;
    const res = await run(
      `INSERT INTO skills (service_id, name, code) VALUES (?, ?, ?)`,
      [sId, sk.name, sk.code]
    );
    skillMap[sk.code] = res.id;
  }

  const certData = [
    { serviceCode: 'ELEC-SHORT', name: 'Electrical Safety Level 2', authority: 'Telangana State Skill Development Corporation' },
    { serviceCode: 'AC-SERVICE', name: 'HVAC Certified Technician', authority: 'National Skill Development Corporation (NSDC)' },
    { serviceCode: 'PLUMB-LEAK', name: 'Master Plumbing & Sanitation Trade Certificate', authority: 'Indian Plumbing Association' },
    { serviceCode: 'CARE-ELDER', name: 'Certified Geriatric Nursing Aid', authority: 'St. John Ambulance Caregiver Division' }
  ];

  const certMap = {};
  for (const cr of certData) {
    const sId = serviceMap[cr.serviceCode] || 1;
    const res = await run(
      `INSERT INTO certifications (service_id, name, issuing_authority) VALUES (?, ?, ?)`,
      [sId, cr.name, cr.authority]
    );
    certMap[cr.name] = res.id;
  }

  // 5. Create Core Users & Demo Accounts
  
  // Customer Demo
  const userCust = await run(
    `INSERT INTO users (email, password_hash, role, full_name, phone, language_preference) VALUES (?, ?, ?, ?, ?, ?)`,
    ['customer@sahakar.in', defaultPasswordHash, 'customer', 'Lakshmi Narayana', '+91 98490 12345', 'en']
  );
  const cust1 = await run(
    `INSERT INTO customers (user_id, default_address, latitude, longitude) VALUES (?, ?, ?, ?)`,
    [userCust.id, 'Plot 42, Jubilee Hills, Road No 36, Hyderabad', 17.4325, 78.4071]
  );

  // Worker Demo 1 (Ravi Kumar - Verified Electrician)
  const userWorkerRavi = await run(
    `INSERT INTO users (email, password_hash, role, full_name, phone, language_preference) VALUES (?, ?, ?, ?, ?, ?)`,
    ['ravi.worker@sahakar.in', defaultPasswordHash, 'worker', 'Ravi Kumar', '+91 97001 55443', 'te']
  );
  const workerRavi = await run(
    `INSERT INTO workers (user_id, society_id, years_of_experience, verification_status, is_available, latitude, longitude, address, languages, average_rating, total_completed_jobs, fair_allocation_score, insurance_status, policy_no, policy_expiry)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [userWorkerRavi.id, coop1.id, 7, 'VERIFIED', 1, 17.4190, 78.4410, 'Ameerpet Labour Colony, Hyderabad', 'Telugu, Hindi, English', 4.85, 34, 0.92, 'ACTIVE', 'LABOUR-INS-9921', '2027-03-31']
  );
  // Attach skills & certifications to Ravi
  await run(`INSERT INTO worker_skills (worker_id, skill_id) VALUES (?, ?)`, [workerRavi.id, skillMap['SKILL-WIRING'] || 1]);
  await run(`INSERT INTO worker_skills (worker_id, skill_id) VALUES (?, ?)`, [workerRavi.id, skillMap['SKILL-MCB'] || 2]);
  await run(`INSERT INTO worker_skills (worker_id, skill_id) VALUES (?, ?)`, [workerRavi.id, skillMap['SKILL-FAN'] || 3]);
  await run(
    `INSERT INTO worker_certifications (worker_id, certification_id, certificate_no, issue_date, valid_till) VALUES (?, ?, ?, ?, ?)`,
    [workerRavi.id, certMap['Electrical Safety Level 2'] || 1, 'TSSDC-ELEC-8831', '2022-05-10', '2027-05-10']
  );

  // Coop Admin Demo
  const userCoopAdmin = await run(
    `INSERT INTO users (email, password_hash, role, full_name, phone, language_preference) VALUES (?, ?, ?, ?, ?, ?)`,
    ['admin.hyderabad@sahakar.in', defaultPasswordHash, 'coop_admin', 'Srinivas Rao (Coop Manager)', '+91 94400 66778', 'en']
  );

  // Federation Admin Demo
  const userFedAdmin = await run(
    `INSERT INTO users (email, password_hash, role, full_name, phone, language_preference) VALUES (?, ?, ?, ?, ?, ?)`,
    ['admin.state@sahakar.in', defaultPasswordHash, 'federation_admin', 'Dr. Venkat Reddy (Federation Director)', '+91 98850 33221', 'en']
  );

  // 6. Seed Additional 25+ Workers across different cooperatives & statuses
  const seedWorkers = [
    { name: 'Kameshwar Rao', email: 'kamesh.plumb@sahakar.in', role: 'worker', society: coop1.id, exp: 9, status: 'VERIFIED', lat: 17.4100, lng: 78.4350, rating: 4.9, jobs: 42, fair: 0.88, skillCode: 'SKILL-PIPE' },
    { name: 'Suresh Varma', email: 'suresh.ac@sahakar.in', role: 'worker', society: coop2.id, exp: 5, status: 'VERIFIED', lat: 17.4450, lng: 78.3850, rating: 4.7, jobs: 28, fair: 0.95, skillCode: 'SKILL-COMPRESSOR' },
    { name: 'Mahesh Babu', email: 'mahesh.carp@sahakar.in', role: 'worker', society: coop1.id, exp: 6, status: 'VERIFIED', lat: 17.4250, lng: 78.4150, rating: 4.6, jobs: 19, fair: 0.98, skillCode: 'SKILL-LOCK' },
    { name: 'Sunitha Caregiver', email: 'sunitha.care@sahakar.in', role: 'worker', society: coop3.id, exp: 8, status: 'VERIFIED', lat: 17.4350, lng: 78.4900, rating: 4.95, jobs: 51, fair: 0.85, skillCode: 'SKILL-NURSING' },
    { name: 'Ramesh Kumar', email: 'ramesh.elec@sahakar.in', role: 'worker', society: coop1.id, exp: 10, status: 'VERIFIED', lat: 17.4180, lng: 78.4420, rating: 4.88, jobs: 64, fair: 0.78, skillCode: 'SKILL-WIRING' },
    { name: 'Satish Babu', email: 'satish.ac@sahakar.in', role: 'worker', society: coop2.id, exp: 7, status: 'VERIFIED', lat: 17.4410, lng: 78.3820, rating: 4.82, jobs: 39, fair: 0.91, skillCode: 'SKILL-COMPRESSOR' },
    { name: 'Govind Rao', email: 'govind.plumb@sahakar.in', role: 'worker', society: coop1.id, exp: 12, status: 'VERIFIED', lat: 17.4210, lng: 78.4490, rating: 4.92, jobs: 88, fair: 0.72, skillCode: 'SKILL-PIPE' },
    { name: 'Mallesham K.', email: 'mallesham.carp@sahakar.in', role: 'worker', society: coop1.id, exp: 8, status: 'VERIFIED', lat: 17.4130, lng: 78.4390, rating: 4.79, jobs: 31, fair: 0.93, skillCode: 'SKILL-LOCK' },
    { name: 'Priya Sharma', email: 'priya.care@sahakar.in', role: 'worker', society: coop3.id, exp: 6, status: 'VERIFIED', lat: 17.4380, lng: 78.4950, rating: 4.91, jobs: 27, fair: 0.96, skillCode: 'SKILL-NURSING' },
    { name: 'Ganesh Reddy', email: 'ganesh.cook@sahakar.in', role: 'worker', society: coop3.id, exp: 11, status: 'VERIFIED', lat: 17.4310, lng: 78.4850, rating: 4.86, jobs: 73, fair: 0.75, skillCode: 'SKILL-DRAIN' },
    { name: 'Nageshwar Rao', email: 'nagesh.driver@sahakar.in', role: 'worker', society: coop2.id, exp: 14, status: 'VERIFIED', lat: 17.4520, lng: 78.3750, rating: 4.96, jobs: 105, fair: 0.68, skillCode: 'SKILL-COMPRESSOR' },
    { name: 'Suhasini Devi', email: 'suhasini.clean@sahakar.in', role: 'worker', society: coop3.id, exp: 5, status: 'VERIFIED', lat: 17.4420, lng: 78.4930, rating: 4.84, jobs: 36, fair: 0.92, skillCode: 'SKILL-NURSING' },
    { name: 'Bala Krishna', email: 'balakrishna.paint@sahakar.in', role: 'worker', society: coop1.id, exp: 9, status: 'VERIFIED', lat: 17.4160, lng: 78.4460, rating: 4.77, jobs: 45, fair: 0.89, skillCode: 'SKILL-WIRING' },
    { name: 'Venkata Ramana', email: 'venkat.garden@sahakar.in', role: 'worker', society: coop2.id, exp: 8, status: 'VERIFIED', lat: 17.4460, lng: 78.3880, rating: 4.85, jobs: 41, fair: 0.90, skillCode: 'SKILL-PIPE' },
    { name: 'Srikanth M.', email: 'srikanth.appl@sahakar.in', role: 'worker', society: coop2.id, exp: 7, status: 'VERIFIED', lat: 17.4470, lng: 78.3790, rating: 4.78, jobs: 33, fair: 0.94, skillCode: 'SKILL-COMPRESSOR' },
    
    // Workers with PENDING verification status (for Coop Admin Verification Queue testing)
    { name: 'Praveen Goud', email: 'praveen.pending@sahakar.in', role: 'worker', society: coop1.id, exp: 3, status: 'PENDING', lat: 17.4050, lng: 78.4200, rating: 5.0, jobs: 0, fair: 1.0, skillCode: 'SKILL-WIRING' },
    { name: 'Anil Kumar', email: 'anil.pending@sahakar.in', role: 'worker', society: coop2.id, exp: 4, status: 'PENDING', lat: 17.4500, lng: 78.3700, rating: 5.0, jobs: 0, fair: 1.0, skillCode: 'SKILL-PIPE' },
    { name: 'Venkatesh Naik', email: 'venky.pending@sahakar.in', role: 'worker', society: coop3.id, exp: 2, status: 'PENDING', lat: 17.4400, lng: 78.5000, rating: 5.0, jobs: 0, fair: 1.0, skillCode: 'SKILL-DRAIN' },
    { name: 'Madhuri Latha', email: 'madhuri.pending@sahakar.in', role: 'worker', society: coop3.id, exp: 4, status: 'PENDING', lat: 17.4320, lng: 78.4910, rating: 5.0, jobs: 0, fair: 1.0, skillCode: 'SKILL-NURSING' },
    { name: 'Vijay Chander', email: 'vijay.pending@sahakar.in', role: 'worker', society: coop4.id, exp: 5, status: 'PENDING', lat: 16.5080, lng: 80.6450, rating: 5.0, jobs: 0, fair: 1.0, skillCode: 'SKILL-PIPE' },

    // Additional Vijayawada workers
    { name: 'Lakshman Rao', email: 'lakshman.vja@sahakar.in', role: 'worker', society: coop4.id, exp: 11, status: 'VERIFIED', lat: 16.5070, lng: 80.6490, rating: 4.89, jobs: 58, fair: 0.81, skillCode: 'SKILL-PIPE' },
    { name: 'Durga Prasad', email: 'durga.vja@sahakar.in', role: 'worker', society: coop4.id, exp: 8, status: 'VERIFIED', lat: 16.5050, lng: 80.6510, rating: 4.81, jobs: 37, fair: 0.92, skillCode: 'SKILL-COMPRESSOR' }
  ];

  for (const w of seedWorkers) {
    const u = await run(
      `INSERT INTO users (email, password_hash, role, full_name, phone, language_preference) VALUES (?, ?, ?, ?, ?, ?)`,
      [w.email, defaultPasswordHash, 'worker', w.name, `+91 9${Math.floor(100000000 + Math.random() * 900000000)}`, 'en']
    );
    const wk = await run(
      `INSERT INTO workers (user_id, society_id, years_of_experience, verification_status, is_available, latitude, longitude, address, languages, average_rating, total_completed_jobs, fair_allocation_score)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [u.id, w.society, w.exp, w.status, 1, w.lat, w.lng, 'Cooperative Quarters, Hyderabad', 'Telugu, English', w.rating, w.jobs, w.fair]
    );
    if (skillMap[w.skillCode]) {
      await run(`INSERT INTO worker_skills (worker_id, skill_id) VALUES (?, ?)`, [wk.id, skillMap[w.skillCode]]);
    }
  }

  // 7. Seed Bookings, Payments, Invoices & Ratings
  const booking1 = await run(
    `INSERT INTO bookings (booking_number, customer_id, worker_id, service_id, society_id, status, is_emergency, customer_lat, customer_lng, service_address, scheduled_date, scheduled_time, problem_description, base_amount, material_amount, total_amount, payment_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'BOOK-2026-0001', cust1.id, workerRavi.id, serviceMap['ELEC-SHORT'], coop1.id,
      'COMPLETED', 1, 17.4325, 78.4071, 'Plot 42, Jubilee Hills, Road No 36, Hyderabad',
      '2026-09-12', '10:30 AM', 'Main switchboard tripped suddenly with burning smell',
      500.0, 250.0, 750.0, 'SUCCESS'
    ]
  );

  await run(
    `INSERT INTO booking_status_history (booking_id, status, notes, changed_by_user_id) VALUES (?, ?, ?, ?)`,
    [booking1.id, 'COMPLETED', 'Job completed cleanly by Ravi Kumar. 1 year guarantee provided by coop.', userWorkerRavi.id]
  );

  const pay1 = await run(
    `INSERT INTO payments (booking_id, customer_id, worker_id, amount, payment_method, payment_status, transaction_ref)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [booking1.id, cust1.id, workerRavi.id, 750.0, 'DEMO_UPI', 'SUCCESS', 'TXN-SAHAKAR-883921']
  );

  await run(
    `INSERT INTO invoices (invoice_number, booking_id, service_charge, material_charge, tax_amount, total_amount)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['INV-2026-9901', booking1.id, 500.0, 250.0, 0.0, 750.0]
  );

  await run(
    `INSERT INTO ratings (booking_id, customer_id, worker_id, rating_score, review_text)
     VALUES (?, ?, ?, ?, ?)`,
    [booking1.id, cust1.id, workerRavi.id, 5, 'Ravi arrived within 20 mins! Very polite, cooperative certified electrician. Fixed the short circuit safely. Excellent service!']
  );

  // 8. Seed Welfare, Insurance, SOS & Training Records for Ravi Kumar
  await run(
    `INSERT INTO insurance_records (worker_id, provider, policy_number, coverage_amount, valid_from, valid_till, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [workerRavi.id, 'National Labour Cooperative Insurance Scheme', 'NLC-POL-559021', 500000.0, '2026-01-01', '2027-01-01', 'ACTIVE']
  );

  await run(
    `INSERT INTO welfare_records (worker_id, contribution_amount, benefit_type, description, record_date)
     VALUES (?, ?, ?, ?, ?)`,
    [workerRavi.id, 150.0, 'Cooperative Provident Fund & Safety Net', 'Monthly contribution deducted from completed bookings', '2026-09-01']
  );

  await run(
    `INSERT INTO training_records (worker_id, course_name, status, completion_date, recommended_by)
     VALUES (?, ?, ?, ?, ?)`,
    [workerRavi.id, 'Advanced Solar Inverter Installation & Safety', 'RECOMMENDED', null, 'Telangana State Labour Federation']
  );

  // 9. Seed AI Demand Predictions & Explainable Workforce Recommendations
  await run(
    `INSERT INTO demand_predictions (region, service_id, target_date, predicted_demand_count, available_worker_count, projected_shortage, confidence_score)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['Cyberabad / Hitec City', serviceMap['ELEC-SHORT'], '2026-09-14', 42, 27, 15, 0.94]
  );

  await run(
    `INSERT INTO demand_predictions (region, service_id, target_date, predicted_demand_count, available_worker_count, projected_shortage, confidence_score)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['Secunderabad East', serviceMap['AC-SERVICE'], '2026-09-14', 38, 20, 18, 0.91]
  );

  await run(
    `INSERT INTO workforce_recommendations (federation_id, society_id, recommendation_type, title, description, priority, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      fed1.id, coop2.id, 'WORKFORCE_REALLOCATION',
      'Deploy 15 Electricians to Cyberabad Society',
      'AI predicts surge in commercial & residential short circuit requests due to monsoon weather. Hyderabad Central has 8 available verified electricians with low workload.',
      'HIGH', 'PROPOSED'
    ]
  );

  await run(
    `INSERT INTO workforce_recommendations (federation_id, society_id, recommendation_type, title, description, priority, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      fed1.id, coop1.id, 'SKILL_UPGRADATION',
      'Enroll 10 Plumbers in Solar Water Heater Installation Training',
      'Demand for Solar Plumbing in Jubilee Hills & Banjara Hills exceeded supply by 65% last month.',
      'MEDIUM', 'PROPOSED'
    ]
  );

  console.log('Database seeded successfully!');
  console.log('----------------------------------------------------');
  console.log('DEMO ACCOUNTS READY FOR 1-CLICK EVALUATION:');
  console.log('Customer:         customer@sahakar.in / Password123!');
  console.log('Worker (Ravi):    ravi.worker@sahakar.in / Password123!');
  console.log('Coop Admin:       admin.hyderabad@sahakar.in / Password123!');
  console.log('Federation Admin: admin.state@sahakar.in / Password123!');
  console.log('----------------------------------------------------');
};

// Run directly if executed as standalone script
if (process.argv[1].endsWith('seed.js')) {
  seedDatabase().catch(err => console.error('Seeding error:', err));
}
