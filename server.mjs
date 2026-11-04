import { createServer } from "node:http";
import { randomInt } from "node:crypto";
import { WebSocketServer, WebSocket } from "ws";

const port = Number(process.env.PORT ?? 8787);
const allowedOrigins = new Set([
  "https://person616.github.io",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);
const rooms = new Map();
const send = (socket, message) => {
  if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
};

const broadcast = (room, message, except) => {
  room.players.forEach((side, socket) => {
    if (socket !== except) send(socket, message);
  });
};

const createRoomCode = () => {
  let code;
  do {
    code = String(randomInt(1, 10_000_000)).padStart(7, "0");
  } while (rooms.has(code));
  return code;
};

const isValidMatch = (match) =>
  match && typeof match === "object"
  && Array.isArray(match.tokens) && match.tokens.length >= 2 && match.tokens.length <= 22
  && match.tokens.every((token) => token
    && ["home", "away"].includes(token.side)
    && Number.isInteger(token.x) && token.x >= 0 && token.x <= 21
    && Number.isInteger(token.y) && token.y >= 0 && token.y <= 10)
  && match.ball && Number.isInteger(match.ball.x) && match.ball.x >= 0 && match.ball.x <= 21
  && Number.isInteger(match.ball.y) && match.ball.y >= 0 && match.ball.y <= 10
  && ["home", "away"].includes(match.turn)
  && Array.isArray(match.score) && match.score.length === 2;

const server = createServer((request, response) => {
  if (request.url === "/health") {
    response.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
    response.end(JSON.stringify({ status: "ok", rooms: rooms.size }));
    return;
  }
  response.writeHead(404);
  response.end("Not found");
});

const webSocketServer = new WebSocketServer({ noServer: true, maxPayload: 256 * 1024 });
server.on("upgrade", (request, socket, head) => {
  const origin = request.headers.origin;
  if (!origin || !allowedOrigins.has(origin)) {
    socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
    socket.destroy();
    return;
  }
  webSocketServer.handleUpgrade(request, socket, head, (client) => {
    webSocketServer.emit("connection", client, request);
  });
});

webSocketServer.on("connection", (socket) => {
  let roomCode;
  socket.on("message", (raw) => {
    let message;
    try {
      message = JSON.parse(raw.toString());
    } catch {
      send(socket, { type: "error", message: "Invalid server message." });
      return;
    }

    if (message.type === "create-room") {
      if (roomCode || !isValidMatch(message.match)) {
        send(socket, { type: "error", message: "Could not create a room with that match." });
        return;
      }
      roomCode = createRoomCode();
      const room = { players: new Map([[socket, "home"]]), match: message.match };
      rooms.set(roomCode, room);
      send(socket, { type: "room-created", code: roomCode, side: "home", match: room.match });
      return;
    }

    if (message.type === "join-room") {
      const code = String(message.code ?? "").replace(/\D/g, "");
      const room = rooms.get(code);
      if (roomCode || code.length !== 7 || !room) {
        send(socket, { type: "error", message: "Room not found. Check the code and try again." });
        return;
      }
      if (room.players.size >= 2) {
        send(socket, { type: "error", message: "That room already has two players." });
        return;
      }
      roomCode = code;
      room.players.set(socket, "away");
      send(socket, { type: "room-joined", code, side: "away", match: room.match });
      broadcast(room, { type: "player-joined" }, socket);
      return;
    }

    if (message.type === "match-state") {
      const room = rooms.get(roomCode);
      const side = room?.players.get(socket);
      if (!room || !side || room.players.size !== 2) {
        send(socket, { type: "error", message: "Wait for the other player to join." });
        return;
      }
      if (room.match.turn !== side || !isValidMatch(message.match)) {
        send(socket, { type: "error", message: "It is not your turn to send a game update." });
        return;
      }
      room.match = message.match;
      broadcast(room, { type: "match-state", match: room.match }, socket);
    }
  });

  socket.on("close", () => {
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room) return;
    const side = room.players.get(socket);
    room.players.delete(socket);
    if (side === "home") {
      broadcast(room, { type: "room-closed", message: "The host disconnected." });
      rooms.delete(roomCode);
    } else {
      broadcast(room, { type: "player-left" });
    }
  });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Blitz League self-hosted game server listening on port ${port}`);
});
