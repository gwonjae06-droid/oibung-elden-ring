-- Additive production schema. Browser roles cannot read or write participant analytics.
create table public.oden_skill_attempts (
 participant_id uuid not null references public.oden_event_participants(id) on delete cascade,
 attempt_id uuid not null,
 event_id text not null,
 revision integer not null check (revision between 1 and 100000),
 boss text not null check (boss in ('kwon','clown','dice','blood','gyuwon')),
 weapon text not null check (weapon in ('sword','hammer','bow','cards')),
 device text not null check (device in ('touch','keyboard-mouse','unknown')),
 ruleset text not null check (ruleset in ('story','standalone')),
 build text not null,
 forge text not null default '',
 outcome text not null check (outcome in ('playing','won','lost','interrupted')),
 started_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 ended_at timestamptz,
 combat_seconds double precision not null default 0 check (combat_seconds between 0 and 86400),
 performance_seconds double precision not null default 0 check (performance_seconds between 0 and 86400),
 damage_dealt double precision not null default 0 check (damage_dealt between 0 and 10000000),
 confirmed_hits integer not null default 0 check (confirmed_hits between 0 and 1000000),
 attacks integer not null default 0 check (attacks between 0 and 1000000),
 connected_attacks integer not null default 0 check (connected_attacks between 0 and attacks),
 hits_taken integer not null default 0 check (hits_taken between 0 and 1000000),
 damage_taken double precision not null default 0 check (damage_taken between 0 and 10000000),
 rolls integer not null default 0 check (rolls between 0 and 1000000),
 potions_used integer not null default 0 check (potions_used between 0 and 1000000),
 heals_completed integer not null default 0 check (heals_completed between 0 and potions_used),
 remaining_hp double precision not null,
 max_hp double precision not null check (max_hp between 1 and 10000),
 max_phase integer not null check (max_phase between 1 and 20),
 best_boss_progress double precision not null check (best_boss_progress between 0 and 100),
 death_pattern text,
 phases jsonb not null default '{}'::jsonb check (jsonb_typeof(phases)='object'),
 patterns jsonb not null default '{}'::jsonb check (jsonb_typeof(patterns)='object'),
 primary key (participant_id,attempt_id),
 check (remaining_hp between 0 and max_hp)
);
create index oden_skill_event_boss_started on public.oden_skill_attempts(event_id,boss,started_at desc);
alter table public.oden_skill_attempts enable row level security;
revoke all on public.oden_skill_attempts from public,anon,authenticated;
grant select,insert,update,delete on public.oden_skill_attempts to service_role;
comment on table public.oden_skill_attempts is 'Client-reported aggregate gameplay; not verified evidence for prizes. No raw input or coordinates.';

-- A stale heartbeat is disconnected, not a fabricated defeat.
create view public.oden_skill_attempt_status with (security_invoker=true) as
 select a.*,p.nickname,
 case when a.outcome='playing' and a.updated_at<now()-interval '2 minutes' then 'disconnected' else a.outcome end as observed_outcome
 from public.oden_skill_attempts a join public.oden_event_participants p on p.id=a.participant_id and p.event_id=a.event_id;

-- Compare only matching boss, build, weapon, forge, device and ruleset.
create view public.oden_skill_player_boss with (security_invoker=true) as
 select event_id,participant_id,nickname,boss,weapon,forge,device,ruleset,build,
 count(*) as attempts,
 count(*) filter(where outcome='won') as wins,
 count(*) filter(where outcome='lost') as losses,
 count(*) filter(where observed_outcome in ('interrupted','disconnected')) as incomplete,
 count(*) filter(where observed_outcome='playing') as active,
 round(100.0*count(*) filter(where outcome='won')/nullif(count(*) filter(where outcome in ('won','lost')),0),1) as win_percent,
 max(max_phase) as max_phase,max(best_boss_progress) as best_boss_progress,
 min(combat_seconds+performance_seconds) filter(where outcome='won') as fastest_win_seconds,
 sum(hits_taken) as hits_taken,sum(damage_taken) as damage_taken,
 sum(damage_dealt) as damage_dealt,sum(potions_used) as potions_used,
 sum(attacks) as normal_attacks,sum(connected_attacks) as connected_normal_attacks,
 round((100.0*sum(connected_attacks)/nullif(sum(attacks),0))::numeric,1) as normal_attack_accuracy_percent,
 -- Song-controlled encounters have separate scoring, never a fabricated combat DPS rank.
 case when boss<>'gyuwon' then round((sum(damage_dealt)/nullif(sum(combat_seconds),0))::numeric,2) end as combat_dps,
 max(updated_at) as last_seen
 from public.oden_skill_attempt_status
 group by event_id,participant_id,nickname,boss,weapon,forge,device,ruleset,build;

create view public.oden_skill_growth with (security_invoker=true) as
 with ranked as (
  select a.*,row_number() over(partition by event_id,participant_id,boss,weapon,forge,device,ruleset,build order by started_at desc,attempt_id) as n
  from public.oden_skill_attempts a where outcome in ('won','lost') and combat_seconds+performance_seconds>=10
 )
 select event_id,participant_id,boss,weapon,forge,device,ruleset,build,count(*) as completed_samples,
 count(*)>=10 as enough_for_comparison,
 avg(hits_taken*60.0/nullif(combat_seconds+performance_seconds,0)) filter(where n<=5) as recent_five_hits_per_minute,
 avg(hits_taken*60.0/nullif(combat_seconds+performance_seconds,0)) filter(where n between 6 and 10) as prior_five_hits_per_minute,
 avg(best_boss_progress) filter(where n<=5) as recent_five_progress,
 avg(best_boss_progress) filter(where n between 6 and 10) as prior_five_progress
 from ranked where n<=10
 group by event_id,participant_id,boss,weapon,forge,device,ruleset,build;

create view public.oden_skill_boss_bottlenecks with (security_invoker=true) as
 select event_id,boss,weapon,forge,device,ruleset,build,count(distinct participant_id) as participants,
 count(*) filter(where outcome='won') as wins,count(*) filter(where outcome='lost') as deaths,
 count(*) filter(where observed_outcome in ('interrupted','disconnected')) as incomplete,
 percentile_cont(.5) within group(order by combat_seconds+performance_seconds) filter(where outcome='won') as median_win_seconds,
 avg(best_boss_progress) filter(where outcome='lost') as average_progress_at_death
 from public.oden_skill_attempt_status group by event_id,boss,weapon,forge,device,ruleset,build;

create view public.oden_skill_pattern_failures with (security_invoker=true) as
 select event_id,participant_id,boss,weapon,forge,device,build,death_pattern,count(*) as deaths
 from public.oden_skill_attempts where outcome='lost'
 group by event_id,participant_id,boss,weapon,forge,device,build,death_pattern;

create view public.oden_skill_phase_stats with (security_invoker=true) as
 select a.event_id,a.participant_id,a.boss,a.weapon,a.forge,a.device,a.build,v.key as phase,
 count(*) as attempts_reached,sum((v.value->>'seconds')::double precision) as seconds,
 sum((v.value->>'hits')::integer) as hits_taken,sum((v.value->>'damage')::double precision) as damage_taken,
 sum((v.value->>'score')::double precision) as performance_score
 from public.oden_skill_attempts a cross join lateral jsonb_each(a.phases) v
 group by a.event_id,a.participant_id,a.boss,a.weapon,a.forge,a.device,a.build,v.key;

revoke all on public.oden_skill_attempt_status,public.oden_skill_player_boss,public.oden_skill_growth,
 public.oden_skill_boss_bottlenecks,public.oden_skill_pattern_failures,public.oden_skill_phase_stats from public,anon,authenticated;
grant select on public.oden_skill_attempt_status,public.oden_skill_player_boss,public.oden_skill_growth,
 public.oden_skill_boss_bottlenecks,public.oden_skill_pattern_failures,public.oden_skill_phase_stats to service_role;
