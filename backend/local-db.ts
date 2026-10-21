import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import type {Database,Statement} from './worker/db.ts';
export function localDatabase(filename=':memory:'):Database {
  const db=new DatabaseSync(filename); db.exec(readFileSync(new URL('../database/schema.sql',import.meta.url),'utf8'));
  function prepare(sql:string):Statement {let params:any[]=[];const statement:Statement={bind(...values:unknown[]){params=values;return statement;},async first<T>(){return (db.prepare(sql).get(...params)||null) as T|null;},async all<T>(){return {results:db.prepare(sql).all(...params) as T[]};},async run(){return db.prepare(sql).run(...params);}};return statement;}
  return {prepare,async batch(statements){db.exec('BEGIN');try{const result=[];for(const s of statements)result.push(await s.run());db.exec('COMMIT');return result;}catch(e){db.exec('ROLLBACK');throw e;}}};
}
