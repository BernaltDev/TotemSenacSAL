const clients = new Set();

function registerClient(response) {
  response.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  response.write(`event: connected\n`);
  response.write(`data: ${JSON.stringify({ connected: true, at: new Date().toISOString() })}\n\n`);

  clients.add(response);

  response.on("close", () => {
    clients.delete(response);
  });
}

function notifyTotem(type, payload = {}) {
  const event = {
    type,
    payload,
    at: new Date().toISOString(),
  };

  for (const client of clients) {
    client.write(`event: totem-update\n`);
    client.write(`data: ${JSON.stringify(event)}\n\n`);
  }
}

module.exports = {
  registerClient,
  notifyTotem,
};
