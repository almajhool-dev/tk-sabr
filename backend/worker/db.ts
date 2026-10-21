export interface Statement {
  bind(...values:unknown[]):Statement;
  first<T=Record<string,unknown>>():Promise<T|null>;
  all<T=Record<string,unknown>>():Promise<{results:T[]}>;
  run():Promise<unknown>;
}
export interface Database {prepare(sql:string):Statement;batch(statements:Statement[]):Promise<unknown>}
export async function cleanExpired(db:Database) {
  const now=Date.now();
  await db.batch([
    db.prepare('DELETE FROM scans WHERE expires_at < ?').bind(now),
    db.prepare('DELETE FROM reports WHERE created_at < ?').bind(now-30*86400000),
    db.prepare('DELETE FROM events WHERE created_at < ?').bind(now-7*86400000),
    db.prepare('DELETE FROM rate_limits WHERE reset_at < ?').bind(now),
  ]);
}
