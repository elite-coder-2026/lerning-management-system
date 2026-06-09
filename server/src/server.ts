import 'dotenv/config';
import { app } from './app.js';
import { pool } from './db/pool.js';

const port = Number(process.env.PORT ?? 4000);

const server = app.listen(port, () => {
  console.log(`LMS API listening on http://localhost:${port}`);
});

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Stop the existing API process before starting another one.`);
    process.exit(1);
  }

  throw error;
});

async function shutdown(signal: NodeJS.Signals) {
  console.log(`Received ${signal}; closing LMS API server.`);

  server.close(async () => {
    await pool.end();
    process.exit(0);
  });

  setTimeout(() => process.exit(0), 3000).unref();
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
