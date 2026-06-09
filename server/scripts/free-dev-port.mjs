import { execFileSync } from 'node:child_process';

const port = process.env.PORT ?? '4000';

function findPortOwners() {
  try {
    return execFileSync('lsof', ['-ti', `tcp:${port}`], { encoding: 'utf8' })
      .split('\n')
      .map((pid) => pid.trim())
      .filter(Boolean)
      .filter((pid, index, pids) => pids.indexOf(pid) === index);
  } catch {
    return [];
  }
}

const owners = findPortOwners();

if (owners.length === 0) {
  process.exit(0);
}

for (const pid of owners) {
  try {
    process.kill(Number(pid), 'SIGTERM');
    console.log(`Stopped existing dev server on port ${port} (pid ${pid}).`);
  } catch (error) {
    console.warn(`Could not stop pid ${pid} on port ${port}:`, error instanceof Error ? error.message : error);
  }
}

await new Promise((resolve) => setTimeout(resolve, 400));

for (const pid of findPortOwners()) {
  try {
    process.kill(Number(pid), 'SIGKILL');
    console.log(`Force stopped existing dev server on port ${port} (pid ${pid}).`);
  } catch {
    // Process already exited.
  }
}
