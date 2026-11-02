create extension if not exists pgcrypto;

create type source_type as enum (
  'news', 'academic', 'government', 'report', 'social', 'interview', 'dataset', 'other'
);
create type review_status as enum ('unreviewed', 'in_review', 'verified', 'rejected');
create type claim_status as enum ('open', 'supported', 'contested', 'refuted');
create type claim_relation as enum ('supports', 'contradicts', 'context');

create function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  description text not null default '' check (char_length(description) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index workspaces_owner_idx on workspaces (owner_id, created_at desc);

create table claims (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id) on delete cascade,
  statement text not null check (char_length(btrim(statement)) between 1 and 500),
  conclusion text not null default '' check (char_length(conclusion) <= 5000),
  status claim_status not null default 'open',
  last_change_reason text check (char_length(last_change_reason) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, workspace_id)
);
create index claims_workspace_idx on claims (workspace_id, created_at desc);
create index claims_status_idx on claims (workspace_id, status);

create table sources (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id) on delete cascade,
  url text not null check (url ~* '^https?://' and char_length(url) <= 2048),
  title text not null check (char_length(btrim(title)) between 1 and 300),
  published_on date,
  source_type source_type not null default 'other',
  excerpt text not null default '' check (char_length(excerpt) <= 5000),
  note text not null default '' check (char_length(note) <= 5000),
  review_status review_status not null default 'unreviewed',
  flagged boolean not null default false,
  last_change_reason text check (char_length(last_change_reason) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, workspace_id)
);
create index sources_workspace_idx on sources (workspace_id, created_at desc);
create index sources_review_idx on sources (workspace_id, review_status);
create index sources_type_idx on sources (workspace_id, source_type);

create table claim_sources (
  claim_id uuid not null,
  source_id uuid not null,
  workspace_id uuid not null,
  relation claim_relation not null,
  relation_note text not null default '' check (char_length(relation_note) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (claim_id, source_id),
  foreign key (claim_id, workspace_id) references claims (id, workspace_id) on delete cascade,
  foreign key (source_id, workspace_id) references sources (id, workspace_id) on delete cascade
);
create index claim_sources_source_idx on claim_sources (source_id);
create index claim_sources_workspace_idx on claim_sources (workspace_id);

create table activity (
  id bigint generated always as identity primary key,
  workspace_id uuid not null references workspaces (id) on delete cascade,
  entity_type text not null check (entity_type in ('workspace', 'claim', 'source', 'link')),
  entity_id uuid not null,
  claim_id uuid,
  source_id uuid,
  action text not null check (action in ('created', 'updated', 'deleted')),
  summary text not null,
  changes jsonb not null default '{}'::jsonb,
  reason text,
  actor_id uuid default auth.uid(),
  actor_email text,
  created_at timestamptz not null default now()
);
create index activity_workspace_idx on activity (workspace_id, created_at desc, id desc);
create index activity_entity_idx on activity (entity_id, created_at desc);

create trigger workspaces_updated_at before update on workspaces
  for each row execute function set_updated_at();
create trigger claims_updated_at before update on claims
  for each row execute function set_updated_at();
create trigger sources_updated_at before update on sources
  for each row execute function set_updated_at();
create trigger claim_sources_updated_at before update on claim_sources
  for each row execute function set_updated_at();

create function owns_workspace(target uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from workspaces where id = target and owner_id = auth.uid()
  );
$$;

create function diff_columns(old_row jsonb, new_row jsonb, tracked text[]) returns jsonb
language sql immutable as $$
  select coalesce(
    jsonb_object_agg(col, jsonb_build_object('from', old_row -> col, 'to', new_row -> col)),
    '{}'::jsonb
  )
  from unnest(tracked) as col
  where old_row -> col is distinct from new_row -> col;
$$;

create function current_actor_email() returns text
language sql stable as $$
  select nullif(auth.jwt() ->> 'email', '');
$$;

create function log_claim_activity() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  changed jsonb;
begin
  if tg_op = 'INSERT' then
    insert into activity (workspace_id, entity_type, entity_id, claim_id, action, summary, actor_email)
    values (new.workspace_id, 'claim', new.id, new.id, 'created',
            'Created claim: ' || left(new.statement, 120), current_actor_email());
    return new;
  elsif tg_op = 'UPDATE' then
    changed := diff_columns(to_jsonb(old), to_jsonb(new), array['statement', 'conclusion', 'status']);
    if changed <> '{}'::jsonb then
      insert into activity (workspace_id, entity_type, entity_id, claim_id, action, summary, changes, reason, actor_email)
      values (new.workspace_id, 'claim', new.id, new.id, 'updated',
              'Updated claim: ' || left(new.statement, 120), changed,
              new.last_change_reason, current_actor_email());
    end if;
    return new;
  else
    if exists (select 1 from workspaces where id = old.workspace_id) then
      insert into activity (workspace_id, entity_type, entity_id, claim_id, action, summary, actor_email)
      values (old.workspace_id, 'claim', old.id, old.id, 'deleted',
              'Deleted claim: ' || left(old.statement, 120), current_actor_email());
    end if;
    return old;
  end if;
end;
$$;

create function log_source_activity() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  changed jsonb;
begin
  if tg_op = 'INSERT' then
    insert into activity (workspace_id, entity_type, entity_id, source_id, action, summary, actor_email)
    values (new.workspace_id, 'source', new.id, new.id, 'created',
            'Added source: ' || left(new.title, 120), current_actor_email());
    return new;
  elsif tg_op = 'UPDATE' then
    changed := diff_columns(
      to_jsonb(old), to_jsonb(new),
      array['url', 'title', 'published_on', 'source_type', 'excerpt', 'note', 'review_status', 'flagged']
    );
    if changed <> '{}'::jsonb then
      insert into activity (workspace_id, entity_type, entity_id, source_id, action, summary, changes, reason, actor_email)
      values (new.workspace_id, 'source', new.id, new.id, 'updated',
              'Updated source: ' || left(new.title, 120), changed,
              new.last_change_reason, current_actor_email());
    end if;
    return new;
  else
    if exists (select 1 from workspaces where id = old.workspace_id) then
      insert into activity (workspace_id, entity_type, entity_id, source_id, action, summary, actor_email)
      values (old.workspace_id, 'source', old.id, old.id, 'deleted',
              'Deleted source: ' || left(old.title, 120), current_actor_email());
    end if;
    return old;
  end if;
end;
$$;

create function log_link_activity() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  claim_text text;
  source_text text;
  changed jsonb;
begin
  if tg_op = 'DELETE' then
    if not exists (select 1 from workspaces where id = old.workspace_id) then
      return old;
    end if;
    select left(statement, 80) into claim_text from claims where id = old.claim_id;
    select left(title, 80) into source_text from sources where id = old.source_id;
    if claim_text is null or source_text is null then
      return old;
    end if;
    insert into activity (workspace_id, entity_type, entity_id, claim_id, source_id, action, summary, changes, actor_email)
    values (old.workspace_id, 'link', old.claim_id, old.claim_id, old.source_id, 'deleted',
            'Unlinked source "' || source_text || '" from claim "' || claim_text || '"',
            jsonb_build_object('relation', jsonb_build_object('from', old.relation, 'to', null)),
            current_actor_email());
    return old;
  end if;

  select left(statement, 80) into claim_text from claims where id = new.claim_id;
  select left(title, 80) into source_text from sources where id = new.source_id;

  if tg_op = 'INSERT' then
    insert into activity (workspace_id, entity_type, entity_id, claim_id, source_id, action, summary, changes, actor_email)
    values (new.workspace_id, 'link', new.claim_id, new.claim_id, new.source_id, 'created',
            'Linked source "' || source_text || '" to claim "' || claim_text || '" as ' || new.relation,
            jsonb_build_object('relation', jsonb_build_object('from', null, 'to', new.relation)),
            current_actor_email());
  else
    changed := diff_columns(to_jsonb(old), to_jsonb(new), array['relation', 'relation_note']);
    if changed <> '{}'::jsonb then
      insert into activity (workspace_id, entity_type, entity_id, claim_id, source_id, action, summary, changes, actor_email)
      values (new.workspace_id, 'link', new.claim_id, new.claim_id, new.source_id, 'updated',
              'Changed relation of source "' || source_text || '" on claim "' || claim_text || '"',
              changed, current_actor_email());
    end if;
  end if;
  return new;
end;
$$;

create trigger claims_activity after insert or update or delete on claims
  for each row execute function log_claim_activity();
create trigger sources_activity after insert or update or delete on sources
  for each row execute function log_source_activity();
create trigger claim_sources_activity after insert or update or delete on claim_sources
  for each row execute function log_link_activity();

alter table workspaces enable row level security;
alter table claims enable row level security;
alter table sources enable row level security;
alter table claim_sources enable row level security;
alter table activity enable row level security;

create policy workspaces_select on workspaces for select to authenticated
  using (owner_id = auth.uid());
create policy workspaces_insert on workspaces for insert to authenticated
  with check (owner_id = auth.uid());
create policy workspaces_update on workspaces for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy workspaces_delete on workspaces for delete to authenticated
  using (owner_id = auth.uid());

create policy claims_all on claims for all to authenticated
  using (owns_workspace(workspace_id)) with check (owns_workspace(workspace_id));
create policy sources_all on sources for all to authenticated
  using (owns_workspace(workspace_id)) with check (owns_workspace(workspace_id));
create policy claim_sources_all on claim_sources for all to authenticated
  using (owns_workspace(workspace_id)) with check (owns_workspace(workspace_id));

create policy activity_select on activity for select to authenticated
  using (owns_workspace(workspace_id));

revoke all on all tables in schema public from anon;
grant select, insert, update, delete on workspaces, claims, sources, claim_sources to authenticated;
grant select on activity to authenticated;

create function log_workspace_activity() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  changed jsonb;
begin
  if tg_op = 'INSERT' then
    insert into activity (workspace_id, entity_type, entity_id, action, summary, actor_email)
    values (new.id, 'workspace', new.id, 'created', 'Created workspace: ' || left(new.name, 120), current_actor_email());
  else
    changed := diff_columns(to_jsonb(old), to_jsonb(new), array['name', 'description']);
    if changed <> '{}'::jsonb then
      insert into activity (workspace_id, entity_type, entity_id, action, summary, changes, actor_email)
      values (new.id, 'workspace', new.id, 'updated', 'Updated workspace: ' || left(new.name, 120), changed, current_actor_email());
    end if;
  end if;
  return new;
end;
$$;

create trigger workspaces_activity after insert or update on workspaces
  for each row execute function log_workspace_activity();
