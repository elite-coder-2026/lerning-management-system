import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = new URL('..', import.meta.url).pathname;

function filesUnder(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? filesUnder(path) : [path];
  });
}

test('server package uses pg and no ORM dependencies', () => {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  const dependencies = { ...pkg.dependencies, ...pkg.devDependencies };

  assert.ok(dependencies.pg, 'pg dependency is required');
  for (const forbidden of ['@prisma/client', 'prisma', 'drizzle-orm', 'sequelize', 'typeorm']) {
    assert.equal(dependencies[forbidden], undefined, `${forbidden} must not be installed`);
  }
});

test('database query calls stay inside repositories and transaction helper', () => {
  const sourceFiles = filesUnder(join(root, 'src')).filter((file) => file.endsWith('.ts'));
  const offenders = sourceFiles.filter((file) => {
    const relative = file.replace(root, '');
    const source = readFileSync(file, 'utf8');

    if (relative.includes('/repositories/') || relative.includes('/db/transaction.ts')) {
      return false;
    }

    return source.includes('.query(');
  });

  assert.deepEqual(offenders, []);
});

test('repository SQL with dynamic values uses pg placeholders', () => {
  const repositoryFiles = filesUnder(join(root, 'src', 'repositories')).filter((file) => file.endsWith('.ts'));

  for (const file of repositoryFiles) {
    const source = readFileSync(file, 'utf8');
    const queryCalls = source.matchAll(/\.query(?:<[^>]+>)?\(\s*`([\s\S]*?)`\s*,\s*\[([\s\S]*?)\]/g);

    for (const match of queryCalls) {
      const sql = match[1] ?? '';
      const values = match[2] ?? '';
      if (values.trim().length > 0) {
        assert.match(sql, /\$\d+/, `${file} has query values without $n placeholders`);
      }
    }
  }
});
