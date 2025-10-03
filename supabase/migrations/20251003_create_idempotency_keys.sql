-- Idempotency keys table
create table if not exists idempotency_keys (
  scope text not null,
  key_hash text not null,
  first_result jsonb,
  created_at timestamptz not null default now(),
  primary key(scope, key_hash)
);
create index if not exists idx_idem_scope on idempotency_keys(scope);
