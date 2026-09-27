const http = require('http');
const net  = require('net');
const PORT = 3001;

function encodeCP1251(str) {
  const buf = [];
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    if (c < 128) buf.push(c);
    else if (c >= 0x0410 && c <= 0x044F) buf.push(c - 0x0410 + 192);
    else if (c === 0x0401) buf.push(168);
    else if (c === 0x0451) buf.push(184);
    else if (c === 0x2116) buf.push(185);
    else buf.push(32);
  }
  return Buffer.from(buf);
}

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(200); return res.end(); }

  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    if (req.url.includes('status')) {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ status: 'ok', server: 'Local Node Bridge (Port 3001)' }));
    }
    if (req.url.includes('print') && req.method === 'POST') {
      const data = JSON.parse(body || '{}');
      const ip = data.ip || '192.168.1.17';
      const port = data.port || 9100;
      const payload = encodeCP1251((data.tspl || '') + '\r\n');

      const sock = new net.Socket();
      sock.setTimeout(2500);
      sock.connect(port, ip, () => {
        sock.write(payload, () => {
          sock.destroy();
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ status: 'ok', message: 'Напечатано на ' + ip + ':' + port + ' (CP1251)' }));
        });
      });
      sock.on('error', (e) => {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ status: 'sim', message: 'Принтер ' + ip + ' вне сети (' + e.message + ')' }));
      });
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
  });
}).listen(PORT, () => console.log('🟢 Local TSC TE310 Bridge on http://localhost:' + PORT));
