const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();

// Change this if you want a different port
const PORT = process.env.PORT || 3000;

// Path to the JSON file that stores the roster
const DATA_FILE = path.join(__dirname, 'test-data.json');

app.use(express.json());

let players = [];
let nextId = 1;

// Some basic allowed positions (you can expand this if you like)
const VALID_POSITIONS = new Set([
  'QB', 'RB', 'HB', 'FB',
  'WR', 'TE',
  'OT', 'OG', 'OC', 'OL',
  'DE', 'DT', 'DL',
  'LB', 'ILB', 'OLB',
  'CB', 'S', 'FS', 'SS',
  'K', 'P', 'LS'
]);

// ---------- Data loading / saving ----------

function loadPlayersFromFile() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const data = JSON.parse(raw);

    players = data.map((p, index) => ({
      id: index + 1,
      ...p,
    }));

    nextId = players.length
      ? Math.max(...players.map((p) => p.id)) + 1
      : 1;

    console.log(`Loaded ${players.length} players from test-data.json`);
  } catch (err) {
    console.error('Error loading players from file:', err.message);
    players = [];
    nextId = 1;
  }
}

function savePlayersToFile() {
  // Don’t write to disk when running tests
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  try {
    const dataToSave = players.map(({ id, ...rest }) => rest);
    fs.writeFileSync(DATA_FILE, JSON.stringify(dataToSave, null, 2));
    console.log('Players saved to test-data.json');
  } catch (err) {
    console.error('Error saving players to file:', err.message);
  }
}


// Initial load
loadPlayersFromFile();

// ---------- Validation helpers ----------

function parseNumberField(fieldName, value, errors) {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    errors.push(`${fieldName} must be a valid number`);
    return null;
  }
  if (!Number.isInteger(num) || num <= 0) {
    errors.push(`${fieldName} must be a positive integer`);
    return null;
  }
  return num;
}

/**
 * Validate player payload.
 * - If requireAllFields = true → all fields must be present and valid.
 * - If requireAllFields = false → only validate fields that are present (for partial updates).
 *
 * Returns: { errors: string[], player: object }
 */
function validatePlayerPayload(body, { requireAllFields = true } = {}) {
  const errors = [];
  const player = {};

  // name
  if (requireAllFields || Object.prototype.hasOwnProperty.call(body, 'name')) {
    if (typeof body.name !== 'string' || !body.name.trim()) {
      errors.push('name is required and must be a non-empty string');
    } else {
      player.name = body.name.trim();
    }
  }

  // number
  if (requireAllFields || Object.prototype.hasOwnProperty.call(body, 'number')) {
    if (body.number === undefined || body.number === null) {
      errors.push('number is required');
    } else {
      const n = parseNumberField('number', body.number, errors);
      if (n !== null) player.number = n;
    }
  }

  // position
  if (requireAllFields || Object.prototype.hasOwnProperty.call(body, 'position')) {
    if (typeof body.position !== 'string' || !body.position.trim()) {
      errors.push('position is required and must be a non-empty string');
    } else {
      const posUpper = body.position.trim().toUpperCase();
      if (!VALID_POSITIONS.has(posUpper)) {
        errors.push(
          `position must be one of: ${Array.from(VALID_POSITIONS).join(', ')}`
        );
      } else {
        player.position = posUpper;
      }
    }
  }

  // age
  if (requireAllFields || Object.prototype.hasOwnProperty.call(body, 'age')) {
    if (body.age === undefined || body.age === null) {
      errors.push('age is required');
    } else {
      const a = parseNumberField('age', body.age, errors);
      if (a !== null) player.age = a;
    }
  }

  // height
  if (requireAllFields || Object.prototype.hasOwnProperty.call(body, 'height')) {
    if (typeof body.height !== 'string' || !body.height.trim()) {
      errors.push('height is required and must be a non-empty string');
    } else {
      // Light validation: e.g., "6-4", "5-11"
      const h = body.height.trim();
      const heightPattern = /^\d+-\d+$/;
      if (!heightPattern.test(h)) {
        errors.push('height must be in the format "feet-inches" (e.g., "6-4")');
      } else {
        player.height = h;
      }
    }
  }

  // weight
  if (requireAllFields || Object.prototype.hasOwnProperty.call(body, 'weight')) {
    if (body.weight === undefined || body.weight === null) {
      errors.push('weight is required');
    } else {
      const w = parseNumberField('weight', body.weight, errors);
      if (w !== null) player.weight = w;
    }
  }

  // college
  if (requireAllFields || Object.prototype.hasOwnProperty.call(body, 'college')) {
    if (typeof body.college !== 'string' || !body.college.trim()) {
      errors.push('college is required and must be a non-empty string');
    } else {
      player.college = body.college.trim();
    }
  }

  return { errors, player };
}

// ---------- ROUTES ----------

/**
 * Base URL: http://localhost:3000
 *
 * GET    /players              -> all players (with optional filters)
 * GET    /players/:id          -> single player by id
 * POST   /players              -> add new player
 * PUT    /players/:id          -> update existing player by id
 * DELETE /players/:id          -> delete player by id
 *
 * POST   /admin/refresh        -> reload from test-data.json
 */

// GET all players, with filters:
//   /players
//   /players?position=WR
//   /players?name=burrow
//   /players?number=9
//   /players?college=lsu
//   /players?minAge=25&maxAge=30
//   /players?minWeight=200&maxWeight=230
app.get('/players', (req, res) => {
  let result = [...players];
  const {
    position,
    number,
    name,
    college,
    minAge,
    maxAge,
    minWeight,
    maxWeight,
  } = req.query;

  // position filter (case-insensitive)
  if (position) {
    const posUpper = String(position).toUpperCase();
    result = result.filter((p) => p.position.toUpperCase() === posUpper);
  }

  // number filter
  if (number !== undefined) {
    const n = Number(number);
    if (!Number.isFinite(n)) {
      return res.status(400).json({ error: 'number filter must be numeric' });
    }
    result = result.filter((p) => p.number === n);
  }

  // name substring filter (case-insensitive)
  if (name) {
    const nameLower = String(name).toLowerCase();
    result = result.filter((p) =>
      p.name.toLowerCase().includes(nameLower)
    );
  }

  // college substring filter (case-insensitive)
  if (college) {
    const collegeLower = String(college).toLowerCase();
    result = result.filter((p) =>
      p.college.toLowerCase().includes(collegeLower)
    );
  }

  // age range filters
  if (minAge !== undefined) {
    const min = Number(minAge);
    if (!Number.isFinite(min)) {
      return res.status(400).json({ error: 'minAge filter must be numeric' });
    }
    result = result.filter((p) => p.age >= min);
  }

  if (maxAge !== undefined) {
    const max = Number(maxAge);
    if (!Number.isFinite(max)) {
      return res.status(400).json({ error: 'maxAge filter must be numeric' });
    }
    result = result.filter((p) => p.age <= max);
  }

  // weight range filters
  if (minWeight !== undefined) {
    const minW = Number(minWeight);
    if (!Number.isFinite(minW)) {
      return res.status(400).json({ error: 'minWeight filter must be numeric' });
    }
    result = result.filter((p) => p.weight >= minW);
  }

  if (maxWeight !== undefined) {
    const maxW = Number(maxWeight);
    if (!Number.isFinite(maxW)) {
      return res.status(400).json({ error: 'maxWeight filter must be numeric' });
    }
    result = result.filter((p) => p.weight <= maxW);
  }

  res.json(result);
});

// GET single player by id
app.get('/players/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'id must be a positive integer' });
  }

  const player = players.find((p) => p.id === id);

  if (!player) {
    return res.status(404).json({ error: 'Player not found' });
  }

  res.json(player);
});

// POST new player
// Requires: name, number, position, age, height, weight, college
app.post('/players', (req, res) => {
  const { errors, player } = validatePlayerPayload(req.body, {
    requireAllFields: true,
  });

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  const newPlayer = {
    id: nextId++,
    ...player,
  };

  players.push(newPlayer);
  savePlayersToFile();

  res.status(201).json(newPlayer);
});

// PUT update player by id
// Requires: id param; body can include any of the player fields to update
app.put('/players/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'id must be a positive integer' });
  }

  const index = players.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Player not found' });
  }

  // If no fields provided, bail out early
  const hasUpdatableField = ['name', 'number', 'position', 'age', 'height', 'weight', 'college']
    .some((field) => Object.prototype.hasOwnProperty.call(req.body, field));

  if (!hasUpdatableField) {
    return res.status(400).json({
      error: 'At least one of name, number, position, age, height, weight, college must be provided',
    });
  }

  const { errors, player } = validatePlayerPayload(req.body, {
    requireAllFields: false,
  });

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  const updatedPlayer = {
    ...players[index],
    ...player,
  };

  players[index] = updatedPlayer;
  savePlayersToFile();

  res.json(updatedPlayer);
});

// DELETE player by id
app.delete('/players/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'id must be a positive integer' });
  }

  const index = players.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Player not found' });
  }

  const removedPlayer = players.splice(index, 1)[0];
  savePlayersToFile();

  res.json({
    message: 'Player deleted',
    player: removedPlayer,
  });
});

// OPTIONAL: Refresh data from test-data.json without restarting the server
app.post('/admin/refresh', (req, res) => {
  loadPlayersFromFile();
  res.json({
    message: 'Roster reloaded from test-data.json',
    count: players.length,
  });
});

// Only start listening if this file is run directly (npm start)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Bengals roster API running at http://localhost:${PORT}`);
  });
}

// For tests: export the Express app (NOT app.listen(...))
module.exports = app;