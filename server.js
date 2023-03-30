const WebSocket = require('ws');
const Server = new WebSocket.Server({ port: 3000 });

Server.on('connection', function (ws) {

  ws.on('message', function (data, isBinary) {
    var request = JSON.parse(data);

    // gets data first opening
    if (request.action == 'first' && Server.clients.size > 1) {
      for (const client of Server.clients) {
        if (ws === client) return;
        client.send(JSON.stringify({
          action: 'getData',
          data: null
        }), { binary: isBinary });
        break;
      }
    }

    // sends data all clients
    Server.clients.forEach(function (client) {
      client.send(data, { binary: isBinary });
    });
  });
});