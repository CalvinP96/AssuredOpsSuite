const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'assuredops.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  -- Employees table (HR manages)
  CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    department TEXT NOT NULL,
    position TEXT NOT NULL,
    hire_date TEXT NOT NULL,
    termination_date TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  -- Equipment catalog (what items exist and their cost)
  CREATE TABLE IF NOT EXISTS equipment_catalog (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    unit_cost REAL NOT NULL DEFAULT 0,
    description TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  -- Equipment assignments (who has what)
  CREATE TABLE IF NOT EXISTS equipment_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    equipment_catalog_id INTEGER NOT NULL,
    serial_number TEXT,
    assigned_date TEXT NOT NULL,
    returned_date TEXT,
    condition_on_return TEXT,
    assigned_by TEXT,
    department TEXT NOT NULL,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (equipment_catalog_id) REFERENCES equipment_catalog(id)
  );

  -- KPIs
  CREATE TABLE IF NOT EXISTS kpis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    target_value REAL,
    current_value REAL DEFAULT 0,
    unit TEXT,
    department TEXT,
    period TEXT,
    status TEXT DEFAULT 'on_track',
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  -- KPI history for tracking over time
  CREATE TABLE IF NOT EXISTS kpi_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kpi_id INTEGER NOT NULL,
    value REAL NOT NULL,
    recorded_date TEXT NOT NULL DEFAULT (date('now')),
    notes TEXT,
    FOREIGN KEY (kpi_id) REFERENCES kpis(id)
  );

  -- Termination billing summary
  CREATE TABLE IF NOT EXISTS termination_bills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    total_equipment_cost REAL NOT NULL DEFAULT 0,
    items_returned INTEGER DEFAULT 0,
    items_not_returned INTEGER DEFAULT 0,
    amount_due REAL NOT NULL DEFAULT 0,
    bill_date TEXT DEFAULT (date('now')),
    status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (employee_id) REFERENCES employees(id)
  );
`);

module.exports = db;
