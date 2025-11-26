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

// Load players from test-data.json and assign internal IDs
function loadPlayersFromFile() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const data = JSON.parse(raw);

    // Add an internal numeric "id" to each player
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

// Save players back to test-data.json (without "id" field)
function savePlayersToFile() {
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

/**
 * ROUTES
 *
 * Base URL: http://localhost:3000
 *
 * GET    /players          -> all players
 * GET    /players/:id      -> single player by id
 * POST   /players          -> add new player
 * PUT    /players/:id      -> update existing player by id
 * DELETE /players/:id      -> delete player by id
 *
 * POST   /admin/refresh    -> reload from test-data.json (optional helper)
 */

// GET all players
app.get('/players', (req, res) => {
  res.json(players);
});

// GET single player by id
app.get('/players/:id', (req, res) => {
  const id = Number(req.params.id);
  const player = players.find((p) => p.id === id);

  if (!player) {
    return res.status(404).json({ error: 'Player not found' });
  }

  res.json(player);
});

// POST new player
// Requires: name, number, position, age, height, weight, college
app.post('/players', (req, res) => {
  const { name, number, position, age, height, weight, college } = req.body;

  if (
    !name ||
    number === undefined ||
    !position ||
    age === undefined ||
    !height ||
    weight === undefined ||
    !college
  ) {
    return res.status(400).json({
      error:
        'Missing required fields: name, number, position, age, height, weight, college',
    });
  }

  const newPlayer = {
    id: nextId++,
    name,
    number,
    position,
    age,
    height,
    weight,
    college,
  };

  players.push(newPlayer);
  savePlayersToFile();

  res.status(201).json(newPlayer);
});

// PUT update player by id
// Requires: id param; body can include any of the player fields to update
app.put('/players/:id', (req, res) => {
  const id = Number(req.params.id);
  const index = players.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Player not found' });
  }

  const { name, number, position, age, height, weight, college } = req.body;

  const updatedPlayer = {
    ...players[index],
    ...(name !== undefined && { name }),
    ...(number !== undefined && { number }),
    ...(position !== undefined && { position }),
    ...(age !== undefined && { age }),
    ...(height !== undefined && { height }),
    ...(weight !== undefined && { weight }),
    ...(college !== undefined && { college }),
  };

  players[index] = updatedPlayer;
  savePlayersToFile();

  res.json(updatedPlayer);
});

// DELETE player by id
app.delete('/players/:id', (req, res) => {
  const id = Number(req.params.id);
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

app.listen(PORT, () => {
  console.log(`Bengals roster API running at http://localhost:${PORT}`);
});
