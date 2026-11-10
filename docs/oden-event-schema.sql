-- Review in Supabase SQL Editor before running. Existing tables are not touched.
-- Only the Edge Function (service-role) may access event records.
create table if not exists public.oden_event_participants (
 id uuid primary key default gen_random_uuid(),
 event_id text not null,
 nickname text not null check (char_length(nickname) between 2 and 18),
 token_hash text not null unique check (length(token_hash)=64),
 stage smallint not null default -1 check(stage between -1 and 4),
 last_progress_at timestamptz,
 final_started_at timestamptz,
 completed_at timestamptz,
 claim_code text unique,
 review_status text not null default 'pending' check(review_status in ('pending','approved','rejected')),
 paid_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint completed_has_code check ((completed_at is null)=(claim_code is null)),
 constraint paid_requires_approved check (paid_at is null or review_status='approved')
);
create unique index if not exists oden_event_one_nickname
 on public.oden_event_participants(event_id,lower(nickname));
create index if not exists oden_event_review_queue
 on public.oden_event_participants(event_id,review_status,completed_at desc);

alter table public.oden_event_participants enable row level security;
revoke all on public.oden_event_participants from public,anon,authenticated;
grant select,insert,update on public.oden_event_participants to service_role;
-- Intentionally NO anon/authenticated SELECT/INSERT/UPDATE policies.
-- Never put the service-role/secret API key in the browser or GitHub.

-- After a verified photo and matching account, approve in Table Editor:
-- review_status = 'approved'
-- After actually delivering the prize, set paid_at to the current UTC timestamp.
-- Do not change stage or claim_code by hand.
