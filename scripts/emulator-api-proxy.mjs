#!/usr/bin/env node
/** Emulator API proxy — PC uzerinden canli API'ye yonlendirir. */
import http from 'node:http';
import { request as httpsRequest } from 'node:https';

const LISTEN_HOST = '0.0.0.0';
const LISTEN_PORT = 8888;
const BACKEND_HOST = 'api.passla.com.tr';
const BACKEND_PORT = 443;

const server = http.createServer((clientReq, clientRes) => {
  const path = clientReq.url ?? '/';
  console.log(`${clientReq.method} ${path}`);

  const upstream = httpsRequest(
    {
      hostname: BACKEND_HOST,
      port: BACKEND_PORT,
      path,
      method: clientReq.method,
      headers: {
        ...clientReq.headers,
        host: BACKEND_HOST,
        connection: 'close',
      },
    },
    (upstreamRes) => {
      clientRes.writeHead(upstreamRes.statusCode ?? 502, upstreamRes.headers);
      upstreamRes.pipe(clientRes);
    },
  );

  upstream.on('error', (err) => {
    console.error('upstream error:', err.message);
    if (!clientRes.headersSent) {
      clientRes.writeHead(502, { 'content-type': 'text/plain' });
    }
    clientRes.end(err.message);
  });

  clientReq.pipe(upstream);
});

server.listen(LISTEN_PORT, LISTEN_HOST, () => {
  console.log(`Emulator proxy: http://10.0.2.2:${LISTEN_PORT} -> https://${BACKEND_HOST}`);
  console.log('Durdurmak icin Ctrl+C');
});
