const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'job_command.db');
const schemaPath = path.join(__dirname, 'schema.sql');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
    initializeDatabase();
  }
});

// Helper to run query as a promise
db.runAsync = function (sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

db.allAsync = function (sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

db.getAsync = function (sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

function initializeDatabase() {
  try {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema, (err) => {
      if (err) {
        console.error('Error executing schema.sql:', err);
      } else {
        console.log('Database schema initialized successfully.');
        runMigrations();
      }
    });
  } catch (err) {
    console.error('Failed to read schema.sql:', err);
  }
}

function runMigrations() {
  db.all("PRAGMA table_info(applications)", (err, columns) => {
    if (err) {
      console.error('Error running table_info for migrations:', err);
      return;
    }
    const columnNames = columns.map(c => c.name);
    
    const migrations = [
      { name: 'tailored_resume', sql: 'ALTER TABLE applications ADD COLUMN tailored_resume TEXT' },
      { name: 'tailor_changes', sql: 'ALTER TABLE applications ADD COLUMN tailor_changes TEXT' },
      { name: 'score_after_tailor', sql: 'ALTER TABLE applications ADD COLUMN score_after_tailor INTEGER' }
    ];

    migrations.forEach(migration => {
      if (!columnNames.includes(migration.name)) {
        db.run(migration.sql, (alterErr) => {
          if (alterErr) {
            console.error(`Migration error adding column ${migration.name}:`, alterErr);
          } else {
            console.log(`Successfully added database column: ${migration.name}`);
          }
        });
      }
    });
  });
}

module.exports = db;
