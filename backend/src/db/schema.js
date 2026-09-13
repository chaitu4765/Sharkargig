import { exec } from './index.js';

export const initSchema = async () => {
  const schemaSQL = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('customer', 'worker', 'coop_admin', 'federation_admin')),
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      language_preference TEXT DEFAULT 'en',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS federations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      region TEXT NOT NULL,
      contact_email TEXT,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cooperative_societies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      federation_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      registration_no TEXT UNIQUE NOT NULL,
      region TEXT NOT NULL,
      city TEXT NOT NULL,
      address TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      contact_email TEXT,
      phone TEXT,
      status TEXT DEFAULT 'ACTIVE',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(federation_id) REFERENCES federations(id)
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      default_address TEXT,
      latitude REAL,
      longitude REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS workers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      society_id INTEGER NOT NULL,
      profile_photo_url TEXT,
      years_of_experience INTEGER DEFAULT 0,
      verification_status TEXT DEFAULT 'PENDING' CHECK(verification_status IN ('PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED')),
      is_available INTEGER DEFAULT 1,
      latitude REAL,
      longitude REAL,
      address TEXT,
      languages TEXT DEFAULT 'English, Hindi, Telugu',
      insurance_status TEXT DEFAULT 'ACTIVE',
      insurance_provider TEXT DEFAULT 'National Insurance Labour Welfare Scheme',
      policy_no TEXT,
      policy_expiry TEXT,
      welfare_eligibility TEXT DEFAULT 'ELIGIBLE',
      total_completed_jobs INTEGER DEFAULT 0,
      average_rating REAL DEFAULT 5.0,
      fair_allocation_score REAL DEFAULT 1.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(society_id) REFERENCES cooperative_societies(id)
    );

    CREATE TABLE IF NOT EXISTS service_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      description TEXT,
      icon_name TEXT
    );

    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      description TEXT,
      base_price REAL NOT NULL,
      estimated_duration_mins INTEGER DEFAULT 60,
      icon_name TEXT,
      is_emergency_capable INTEGER DEFAULT 0,
      FOREIGN KEY(category_id) REFERENCES service_categories(id)
    );

    CREATE TABLE IF NOT EXISTS skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      FOREIGN KEY(service_id) REFERENCES services(id)
    );

    CREATE TABLE IF NOT EXISTS worker_skills (
      worker_id INTEGER NOT NULL,
      skill_id INTEGER NOT NULL,
      PRIMARY KEY(worker_id, skill_id),
      FOREIGN KEY(worker_id) REFERENCES workers(id) ON DELETE CASCADE,
      FOREIGN KEY(skill_id) REFERENCES skills(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS certifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      issuing_authority TEXT NOT NULL,
      FOREIGN KEY(service_id) REFERENCES services(id)
    );

    CREATE TABLE IF NOT EXISTS worker_certifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_id INTEGER NOT NULL,
      certification_id INTEGER NOT NULL,
      certificate_no TEXT,
      issue_date TEXT,
      valid_till TEXT,
      verification_status TEXT DEFAULT 'VERIFIED',
      FOREIGN KEY(worker_id) REFERENCES workers(id) ON DELETE CASCADE,
      FOREIGN KEY(certification_id) REFERENCES certifications(id)
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_number TEXT UNIQUE NOT NULL,
      customer_id INTEGER NOT NULL,
      worker_id INTEGER,
      service_id INTEGER NOT NULL,
      society_id INTEGER NOT NULL,
      status TEXT DEFAULT 'PENDING_WORKER_ACCEPTANCE' CHECK(status IN ('PENDING_WORKER_ACCEPTANCE', 'CONFIRMED', 'WORKER_ON_THE_WAY', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REJECTED', 'DISPUTED')),
      is_emergency INTEGER DEFAULT 0,
      customer_lat REAL,
      customer_lng REAL,
      service_address TEXT NOT NULL,
      scheduled_date TEXT NOT NULL,
      scheduled_time TEXT NOT NULL,
      problem_description TEXT,
      base_amount REAL NOT NULL,
      material_amount REAL DEFAULT 0.0,
      total_amount REAL NOT NULL,
      payment_status TEXT DEFAULT 'PENDING' CHECK(payment_status IN ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'REFUNDED')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(customer_id) REFERENCES customers(id),
      FOREIGN KEY(worker_id) REFERENCES workers(id),
      FOREIGN KEY(service_id) REFERENCES services(id),
      FOREIGN KEY(society_id) REFERENCES cooperative_societies(id)
    );

    CREATE TABLE IF NOT EXISTS booking_status_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      notes TEXT,
      changed_by_user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(booking_id) REFERENCES bookings(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER UNIQUE NOT NULL,
      customer_id INTEGER NOT NULL,
      worker_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT DEFAULT 'DEMO_UPI',
      payment_status TEXT DEFAULT 'SUCCESS',
      transaction_ref TEXT UNIQUE NOT NULL,
      paid_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(booking_id) REFERENCES bookings(id)
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT UNIQUE NOT NULL,
      booking_id INTEGER UNIQUE NOT NULL,
      service_charge REAL NOT NULL,
      material_charge REAL DEFAULT 0.0,
      tax_amount REAL NOT NULL,
      total_amount REAL NOT NULL,
      issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(booking_id) REFERENCES bookings(id)
    );

    CREATE TABLE IF NOT EXISTS ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER UNIQUE NOT NULL,
      customer_id INTEGER NOT NULL,
      worker_id INTEGER NOT NULL,
      rating_score INTEGER NOT NULL CHECK(rating_score BETWEEN 1 AND 5),
      review_text TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(booking_id) REFERENCES bookings(id),
      FOREIGN KEY(customer_id) REFERENCES customers(id),
      FOREIGN KEY(worker_id) REFERENCES workers(id)
    );

    CREATE TABLE IF NOT EXISTS complaints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      issue_category TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT DEFAULT 'OPEN' CHECK(status IN ('OPEN', 'INVESTIGATING', 'RESOLVED')),
      resolution_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(booking_id) REFERENCES bookings(id)
    );

    CREATE TABLE IF NOT EXISTS insurance_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_id INTEGER NOT NULL,
      provider TEXT NOT NULL,
      policy_number TEXT NOT NULL,
      coverage_amount REAL NOT NULL,
      valid_from TEXT NOT NULL,
      valid_till TEXT NOT NULL,
      status TEXT DEFAULT 'ACTIVE',
      FOREIGN KEY(worker_id) REFERENCES workers(id)
    );

    CREATE TABLE IF NOT EXISTS welfare_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_id INTEGER NOT NULL,
      contribution_amount REAL NOT NULL,
      benefit_type TEXT NOT NULL,
      description TEXT,
      record_date TEXT NOT NULL,
      FOREIGN KEY(worker_id) REFERENCES workers(id)
    );

    CREATE TABLE IF NOT EXISTS training_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_id INTEGER NOT NULL,
      course_name TEXT NOT NULL,
      status TEXT DEFAULT 'RECOMMENDED' CHECK(status IN ('RECOMMENDED', 'ENROLLED', 'COMPLETED')),
      completion_date TEXT,
      recommended_by TEXT,
      FOREIGN KEY(worker_id) REFERENCES workers(id)
    );

    CREATE TABLE IF NOT EXISTS sos_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_id INTEGER NOT NULL,
      booking_id INTEGER,
      latitude REAL,
      longitude REAL,
      status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED')),
      triggered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME,
      FOREIGN KEY(worker_id) REFERENCES workers(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'INFO',
      is_read INTEGER DEFAULT 0,
      metadata_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS demand_predictions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      region TEXT NOT NULL,
      service_id INTEGER NOT NULL,
      target_date TEXT NOT NULL,
      predicted_demand_count INTEGER NOT NULL,
      available_worker_count INTEGER NOT NULL,
      projected_shortage INTEGER NOT NULL,
      confidence_score REAL DEFAULT 0.92,
      generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(service_id) REFERENCES services(id)
    );

    CREATE TABLE IF NOT EXISTS workforce_recommendations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      federation_id INTEGER NOT NULL,
      society_id INTEGER NOT NULL,
      recommendation_type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      priority TEXT DEFAULT 'MEDIUM',
      metadata_json TEXT,
      status TEXT DEFAULT 'PROPOSED',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(federation_id) REFERENCES federations(id),
      FOREIGN KEY(society_id) REFERENCES cooperative_societies(id)
    );

    -- Create essential indexes for fast lookup & geospatial matching
    CREATE INDEX IF NOT EXISTS idx_workers_location ON workers(latitude, longitude);
    CREATE INDEX IF NOT EXISTS idx_workers_status ON workers(verification_status, is_available);
    CREATE INDEX IF NOT EXISTS idx_workers_society ON workers(society_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_worker ON bookings(worker_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
    CREATE INDEX IF NOT EXISTS idx_bookings_society ON bookings(society_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
  `;

  await exec(schemaSQL);
  console.log('Database tables and indexes created successfully.');
};
