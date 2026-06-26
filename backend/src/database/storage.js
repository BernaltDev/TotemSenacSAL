const fs = require("fs/promises");
const path = require("path");

const databasePath = path.resolve(__dirname, "localDatabase.json");

async function readDatabase() {
  const content = await fs.readFile(databasePath, "utf-8");
  return JSON.parse(content);
}

async function writeDatabase(database) {
  await fs.writeFile(databasePath, JSON.stringify(database, null, 2), "utf-8");
}

async function updateDatabase(mutator) {
  const database = await readDatabase();
  const result = await mutator(database);
  await writeDatabase(database);
  return result;
}

module.exports = {
  readDatabase,
  writeDatabase,
  updateDatabase,
};
