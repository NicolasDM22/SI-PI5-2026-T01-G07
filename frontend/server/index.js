const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ── Utils ─────────────────────────────────────────────────
function getLocalIp() {
  for (const iface of Object.values(os.networkInterfaces())) {
    for (const net of iface) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return '127.0.0.1';
}
const LOCAL_IP = getLocalIp();
const PORT = 3001;

// ── Uploads ────────────────────────────────────────────────
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// ── Estado ────────────────────────────────────────────────
let currentFlight = null;
const flightFrames = {};

// ── Express ───────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use('/uploads', express.static(uploadsDir));
app.use(express.static(path.join(__dirname, 'public')));

// ── WebSocket ─────────────────────────────────────────────
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach((c) => c.readyState === WebSocket.OPEN && c.send(msg));
}

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'CONNECTED', currentFlight }));
});

// ── API ───────────────────────────────────────────────────
app.post('/api/flight/start', (_req, res) => {
  if (currentFlight) return res.status(409).json({ error: 'Já existe um voo ativo' });

  const flightId = `live-${Date.now()}`;
  currentFlight = { id: flightId, startTs: new Date().toISOString(), status: 'active' };
  flightFrames[flightId] = [];
  fs.mkdirSync(path.join(uploadsDir, flightId), { recursive: true });

  broadcast({ type: 'FLIGHT_STARTED', flight: currentFlight });
  log(`✈  Voo iniciado: ${flightId}`);
  res.json({ flightId });
});

app.post('/api/flight/:id/frame', (req, res) => {
  const { id } = req.params;
  if (!flightFrames[id]) return res.status(404).json({ error: 'Voo não encontrado' });

  const { imageBase64 } = req.body;
  if (!imageBase64) return res.status(400).json({ error: 'imageBase64 obrigatório' });

  const idx = flightFrames[id].length;
  const fileName = `frame-${String(idx).padStart(4, '0')}.jpg`;
  const rawBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

  fs.writeFileSync(path.join(uploadsDir, id, fileName), Buffer.from(rawBase64, 'base64'));

  const frame = { index: idx, path: `/uploads/${id}/${fileName}`, ts: new Date().toISOString() };
  flightFrames[id].push(frame);

  broadcast({
    type: 'NEW_FRAME',
    flightId: id,
    frame,
    imageBase64: `data:image/jpeg;base64,${rawBase64}`,
    totalFrames: flightFrames[id].length,
  });

  if (idx % 10 === 0) log(`📷  frame ${idx}`);
  res.json({ frameIndex: idx, totalFrames: flightFrames[id].length });
});

app.post('/api/flight/:id/stop', (req, res) => {
  const { id } = req.params;
  if (!currentFlight || currentFlight.id !== id)
    return res.status(404).json({ error: 'Voo não encontrado' });

  const completed = {
    ...currentFlight,
    endTs: new Date().toISOString(),
    status: 'completed',
    frameCount: flightFrames[id]?.length ?? 0,
  };
  currentFlight = null;

  broadcast({ type: 'FLIGHT_STOPPED', flight: completed, frames: flightFrames[id] ?? [] });
  log(`🛬  Voo encerrado — ${completed.frameCount} frames`);
  res.json(completed);
});

app.get('/api/flight/:id', (req, res) => {
  const { id } = req.params;
  if (!flightFrames[id]) return res.status(404).json({ error: 'Não encontrado' });
  const meta = currentFlight?.id === id ? currentFlight : { id, status: 'completed' };
  res.json({ ...meta, frames: flightFrames[id], frameCount: flightFrames[id].length });
});

app.get('/api/status', (_req, res) =>
  res.json({ currentFlight, clients: wss.clients.size })
);

// ── Start ─────────────────────────────────────────────────
server.listen(PORT, '0.0.0.0', () => {
  console.log('\n┌──────────────────────────────────────────┐');
  console.log('│  🐄  AgriMonitor — Servidor POC          │');
  console.log('├──────────────────────────────────────────┤');
  console.log(`│  iPhone (Expo Go): exp://${LOCAL_IP}:8081  │`);
  console.log(`│  Servidor IP:      ${LOCAL_IP}:${PORT}         │`);
  console.log(`│  Monitor web:      http://localhost:8081  │`);
  console.log('└──────────────────────────────────────────┘\n');
});

function log(msg) {
  const t = new Date().toLocaleTimeString('pt-BR');
  console.log(`[${t}] ${msg}`);
}
