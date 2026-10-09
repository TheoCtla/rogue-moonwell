// Optional: npm install --prefix /tmp/moonwell-qa @electric-sql/pglite
const {PGlite}=require('@electric-sql/pglite');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const db=new PGlite();
 try{
 await db.exec(`create role anon;create role authenticated;create schema auth;
 create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql as 'select null::uuid';
 insert into auth.users values ('00000000-0000-0000-0000-000000000001');
 create table public.rogue_progress (
 slug text primary key check (slug ~ '^[a-z0-9-]{3,60}$'),
 owner_id uuid not null references auth.users(id) on delete cascade,
 level integer not null default 14 check(level between 10 and 70),
 checked jsonb not null default '[]' check(jsonb_typeof(checked)='array'),
 updated_at timestamptz not null default now());
 alter table public.rogue_progress enable row level security;
 create policy "public read rogue progress" on public.rogue_progress for select to anon,authenticated using(true);
 create policy "owner insert rogue progress" on public.rogue_progress for insert to authenticated with check(auth.uid()=owner_id);
 create policy "owner update rogue progress" on public.rogue_progress for update to authenticated using(auth.uid()=owner_id) with check(auth.uid()=owner_id);
 insert into public.rogue_progress (slug,owner_id,level,checked) values ('fandebr','00000000-0000-0000-0000-000000000001',26,'[3,2,4]');`);
 const migration=fs.readFileSync(path.join(__dirname,'..','supabase.sql'),'utf8');
 const before=(await db.query('select * from rogue_progress')).rows;
 await db.exec(migration);await db.exec(migration);
 assert.deepEqual((await db.query('select * from rogue_progress')).rows,before);
 await db.exec('set role anon');
 assert.equal((await db.query('select slug from rogue_progress')).rows[0].slug,'fandebr');
 await db.exec(`insert into rogue_progress(slug,level,checked,updated_at) values ('fandenibard',25,'[5,2,2,1,5,1]',now()) on conflict(slug) do update set level=excluded.level,checked=excluded.checked,updated_at=excluded.updated_at;`);
 assert.equal((await db.query("select level from rogue_progress where slug='fandebr'")).rows[0].level,26);
 await db.exec(`insert into rogue_progress(slug,level,checked,updated_at) values ('fandenibard',70,'[4,2]',now()) on conflict(slug) do update set level=excluded.level,checked=excluded.checked,updated_at=excluded.updated_at;`);
 await db.exec(`insert into rogue_progress(slug,level,checked,updated_at) values ('fandebr',27,'[5,2]',now()) on conflict(slug) do update set level=excluded.level,checked=excluded.checked,updated_at=excluded.updated_at;`);
 const after=(await db.query('select * from rogue_progress order by slug')).rows;
 assert.equal(after[0].owner_id,before[0].owner_id);
 assert.equal(after[0].level,27);assert.equal(after[1].level,70);assert.equal(after[1].owner_id,null);
 await assert.rejects(db.exec("insert into rogue_progress(slug,level) values ('unexpected',25)"));
 await assert.rejects(db.exec("delete from rogue_progress where slug='fandebr'"));
 await assert.rejects(db.exec("update rogue_progress set level=71 where slug='fandebr'"));
 await assert.rejects(db.exec("update rogue_progress set checked='{}' where slug='fandebr'"));
 console.log('PASS SQL migration twice, existing Rogue unchanged, anonymous read/insert/upsert, independent rows, old owner retained, invalid writes rejected.');
 }finally{await db.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
