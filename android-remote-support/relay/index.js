import http from 'node:http';
import WebSocket, { WebSocketServer } from 'ws';

const PORT = Number(process.env.PORT || 8080);
const MAX_CLIENTS = 200;
const rooms = new Map();
const connections = new Set();
const codeOK = code => typeof code === 'string' && /^[a-f0-9]{24}$/.test(code);
const send = (ws, payload) => {
  if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
};

const server = http.createServer((req, res) => {
  res.writeHead(req.url === '/health' ? 200 : 404, { 'content-type': 'text/plain' });
  res.end(req.url === '/health' ? 'ok' : 'not found');
});
const wss = new WebSocketServer({ server, maxPayload: 256 * 1024, perMessageDeflate: false });

wss.on('connection', ws => {
  if (connections.size >= MAX_CLIENTS) return ws.close(1013, 'busy');
  connections.add(ws);
  let room = null;
  let role = null;
  let alive = true;
  ws.on('pong', () => { alive = true; });
  ws.on('message', raw => {
    let m;
    try { m = JSON.parse(raw.toString()); } catch { return ws.close(1003, 'json required'); }
    if (!m || typeof m !== 'object') return;
    if (m.type === 'hello' && !role) {
      if (!codeOK(m.code) || !['client', 'controller'].includes(m.role)) return ws.close(1008, 'invalid pairing');
      role = m.role;
      if (role === 'client') {
        if (rooms.has(m.code)) return ws.close(1008, 'already online');
        room = { code: m.code, client: ws, controller: null, sharing: false };
        rooms.set(m.code, room);
        send(ws, { type: 'registered' });
      } else {
        room = rooms.get(m.code);
        if (!room || room.controller) return ws.close(1008, 'client offline/busy');
        room.controller = ws;
        send(ws, { type: 'waiting_approval' });
        send(room.client, { type: 'controller_joined' });
      }
      return;
    }
    if (!room || !role) return ws.close(1008, 'register first');
    if (role === 'client') {
      if (m.type === 'sharing_started') {
        room.sharing = true;
        send(room.controller, { type: 'sharing_started' });
      } else if (m.type === 'sharing_stopped') {
        room.sharing = false;
        send(room.controller, { type: 'sharing_stopped' });
      } else if (m.type === 'deny') {
        send(room.controller, { type: 'denied' });
        room.controller?.close(1008, 'client declined');
      } else if (m.type === 'frame' && room.sharing && typeof m.jpeg === 'string' && m.jpeg.length < 210000) {
        send(room.controller, { type: 'frame', jpeg: m.jpeg });
      }
    } else if (m.type === 'touch' && room.sharing) {
      const clean = Number.isFinite(m.x) && Number.isFinite(m.y)
        && m.x >= 0 && m.x <= 1 && m.y >= 0 && m.y <= 1;
      if (!clean || !['tap', 'swipe'].includes(m.action)) return;
      if (m.action === 'swipe' &&
         (!Number.isFinite(m.endX) || !Number.isFinite(m.endY) ||
          m.endX < 0 || m.endX > 1 || m.endY < 0 || m.endY > 1)) return;
      send(room.client, { type: 'touch', action: m.action, x: m.x, y: m.y,
        endX: m.endX, endY: m.endY });
    }
  });
  ws.on('close', () => {
    connections.delete(ws);
    if (!room) return;
    if (role === 'client') {
      if (rooms.get(room.code) === room) rooms.delete(room.code);
      send(room.controller, { type: 'client_offline' });
      room.controller?.close(1001, 'client offline');
    } else if (room.controller === ws) {
      room.controller = null;
      room.sharing = false;
      send(room.client, { type: 'controller_left' });
    }
  });
  ws.on('error', () => {});
});

const heartbeat = setInterval(() => {
  for (const ws of connections) {
    if (!ws.isAlive && ws.readyState !== WebSocket.OPEN) continue;
    if (ws._missedHeartbeat) { ws.terminate(); continue; }
    ws._missedHeartbeat = true;
    ws.ping();
  }
}, 30000);
wss.on('connection', ws => ws.on('pong', () => { ws._missedHeartbeat = false; }));
server.listen(PORT, '0.0.0.0', () => console.log('Relay listening on', PORT));
process.on('SIGTERM', () => { clearInterval(heartbeat); wss.close(); server.close(); });
