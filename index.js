const { createServer } = require('http');
const { WebSocketServer, OPEN } = require('ws');
const { networkInterfaces } = require('os');

let wss = null;
let latestHR = -1;

function sendHR(hr){
  if (!wss) return;
  for (const client of wss.clients){
    if (client.readyState === OPEN){
      client.send(`hr:${hr}`);
    }
  }
}

const server = createServer((req, res) => {
  if (req.method === 'POST'){
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      res.writeHead(200);
      res.end('OK');
      const recText = Buffer.concat(chunks).toString('utf-8');
      const hr = recText.split('=')[1];
      latestHR = hr;
      sendHR(hr);
      console.log(`Received BPM: ${hr}`);
    });
  }else if (req.method === 'GET' && req.url === '/hr'){
    res.writeHead(200, {'Access-Control-Allow-Origin': '*'});
    res.end(`${latestHR}`);
  }
});
wss = new WebSocketServer({ server });

const port = process.argv[2] ?? 6547;
server.listen(port);
const lanIP = Object.values(networkInterfaces()).flat().find(i => i.family == 'IPv4' && !i.internal).address;
console.log(`Your IP: ${lanIP}`);
console.log(`Port: ${port}`);