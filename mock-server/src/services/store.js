const fs = require('fs');
const path = require('path');
const { createSeedDb } = require('../seed');

const dbPath = path.join(__dirname, '..', 'db.json');

let writeQueue = Promise.resolve();

function ensureDb() {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(createSeedDb(), null, 2), 'utf8');
  }
}

function readDb() {
  ensureDb();
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function writeDb(db) {
  writeQueue = writeQueue.then(() => fs.promises.writeFile(dbPath, JSON.stringify(db, null, 2), 'utf8'));
  return writeQueue;
}

async function resetDb() {
  const db = createSeedDb();
  await writeDb(db);
  return db;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

module.exports = { clone, readDb, resetDb, writeDb };
