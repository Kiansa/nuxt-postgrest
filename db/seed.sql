-- Dev/test schema for nuxt-postgrest. Loaded by docker-compose and CI.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create role authenticator noinherit login password 'authenticator';
grant anon, authenticated, service_role to authenticator;

create table public.todos (
  id bigint generated always as identity primary key,
  title text not null,
  is_public boolean not null default false,
  owner text
);

alter table public.todos enable row level security;

create policy "public todos are readable by everyone" on public.todos
  for select using (is_public);

create policy "owners read their todos" on public.todos
  for select to authenticated
  using (owner = current_setting('request.jwt.claims', true)::json ->> 'sub');

create policy "owners insert their todos" on public.todos
  for insert to authenticated
  with check (owner = current_setting('request.jwt.claims', true)::json ->> 'sub');

grant usage on schema public to anon, authenticated, service_role;
grant select on public.todos to anon;
grant select, insert on public.todos to authenticated;
grant all on public.todos to service_role;

-- A second schema to exercise `schema` / `.schema()` switching
create schema internal;
create table internal.audit_log (id bigint generated always as identity primary key, message text not null);
grant usage on schema internal to service_role;
grant all on internal.audit_log to service_role;

insert into public.todos (title, is_public, owner) values
  ('Public todo', true, null),
  ('Alice private todo', false, 'alice'),
  ('Bob private todo', false, 'bob');

insert into internal.audit_log (message) values ('seeded');
