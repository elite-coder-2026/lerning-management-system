# Repository Rules

All PostgreSQL access for the LMS API lives in this directory.

- Use `pg` only.
- Accept a `Queryable` so services can pass either the pool or a transaction client.
- Use `$1`, `$2`, `$3` placeholders for user-provided values.
- Pass values separately as the second `query` argument.
- Return typed TypeScript objects, not raw database rows.
- Do not add ORM models, query builders, or SQL assembled from user input.
