const WebSocket = require('ws');
const Server = new WebSocket.Server({ port: 3000 });

Server.on('connection', function (ws) {

  ws.on('message', function (data) {

    var incomingData = JSON.parse(data);

    if (incomingData.action == 'first' && Server.clients.size > 1) {

      for (const client of Server.clients) {

        if (ws === client) return;

        client.send(JSON.stringify({
          action: 'getData',
          data: null
        }));

        break;
      }
    }

    Server.clients.forEach(function (client) {
      client.send(data);
    });

  });
});