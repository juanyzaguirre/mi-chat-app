import http from "http";
import fs from "fs";
import { WebSocketServer } from "ws";

const PORT = 3001;

const server = http.createServer((req, res) => {
  let filePath = "./public/index.html";
  let contentType = "text/html";

  if (req.url === "/script.js") {
    filePath = "./public/script.js";
    contentType = "application/javascript";
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
      return;
    }

    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });
});

const wss = new WebSocketServer({ server });

wss.on("connection", (socket, req) => {
  const username = new URL(req.url, "http://localhost").searchParams.get("username");

  const joinMessage = JSON.stringify({ type: "system", text: `${username} joined` });
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(joinMessage);
    }
  });

  socket.on("message", (message) => {
    try {
      const parsedData = JSON.parse(message);
      const chatMessage = JSON.stringify({
        type: "chat",
        username: parsedData.username,
        text: parsedData.text,
      });

      wss.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(chatMessage);
        }
      });
    } catch (err) {
      console.error("Failed to parse message:", err);
    }
  });

  socket.on("close", () => {
    const leaveMessage = JSON.stringify({ type: "system", text: `${username} left` });
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(leaveMessage);
      }
    });
  });
});

server.listen(PORT, () => {
  console.log(`Chat server running at http://localhost:${PORT}`);
});