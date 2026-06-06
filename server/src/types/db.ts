import type { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

export type DbClient = Pool | PoolClient;

export type Queryable = {
  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    values: readonly unknown[],
  ): Promise<QueryResult<T>>;
};
