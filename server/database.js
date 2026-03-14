const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'assuredops.db');

let db;

// Wrapper to make sql.js feel like better-sqlite3's API
class DatabaseWrapper {
  constructor(sqlDb) {
    this._db = sqlDb;
  }

  exec(sql) {
    this._db.run(sql);
    this._save();
  }

  prepare(sql) {
    const self = this;
    return {
      run(...params) {
        self._db.run(sql, params);
        self._save();
        const lastId = self._db.exec("SELECT last_insert_rowid() as id")[0];
        return { lastInsertRowid: lastId ? lastId.values[0][0] : 0 };
      },
      get(...params) {
        const stmt = self._db.prepare(sql);
        stmt.bind(params);
        if (stmt.step()) {
          const cols = stmt.getColumnNames();
          const vals = stmt.get();
          stmt.free();
          const row = {};
          cols.forEach((c, i) => row[c] = vals[i]);
          return row;
        }
        stmt.free();
        return undefined;
      },
      all(...params) {
        const result = [];
        const stmt = self._db.prepare(sql);
        stmt.bind(params);
        while (stmt.step()) {
          const cols = stmt.getColumnNames();
          const vals = stmt.get();
          const row = {};
          cols.forEach((c, i) => row[c] = vals[i]);
          result.push(row);
        }
        stmt.free();
        return result;
      }
    };
  }

  _save() {
    const data = this._db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  }
}

async function initDatabase() {
  const SQL = await initSqlJs();

  let sqlDb;
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    sqlDb = new SQL.Database(fileBuffer);
  } else {
    sqlDb = new SQL.Database();
  }

  db = new DatabaseWrapper(sqlDb);

  db.exec(`
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

    CREATE TABLE IF NOT EXISTS equipment_catalog (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      unit_cost REAL NOT NULL DEFAULT 0,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

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

    CREATE TABLE IF NOT EXISTS kpi_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kpi_id INTEGER NOT NULL,
      value REAL NOT NULL,
      recorded_date TEXT NOT NULL DEFAULT (date('now')),
      notes TEXT,
      FOREIGN KEY (kpi_id) REFERENCES kpis(id)
    );

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

    CREATE TABLE IF NOT EXISTS programs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      description TEXT,
      manager_name TEXT,
      manager_title TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS program_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      program_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      doc_type TEXT NOT NULL,
      status TEXT DEFAULT 'draft',
      version TEXT DEFAULT '1.0',
      assigned_to TEXT,
      due_date TEXT,
      completed_date TEXT,
      file_url TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (program_id) REFERENCES programs(id)
    );

    CREATE TABLE IF NOT EXISTS program_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      program_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'todo',
      assigned_to TEXT,
      due_date TEXT,
      completed_date TEXT,
      category TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (program_id) REFERENCES programs(id)
    );

    CREATE TABLE IF NOT EXISTS program_milestones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      program_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      target_date TEXT,
      completed_date TEXT,
      status TEXT DEFAULT 'upcoming',
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (program_id) REFERENCES programs(id)
    );
  `);

  return db;
}

function getDb() {
  return db;
}

module.exports = { initDatabase, getDb };
