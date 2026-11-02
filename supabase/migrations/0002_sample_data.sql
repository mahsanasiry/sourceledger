create function seed_sample_workspace(target_owner uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  ws uuid;
  claim_commute uuid;
  claim_safety uuid;
  src_survey uuid;
  src_city_report uuid;
  src_paper uuid;
  src_news uuid;
  src_ministry uuid;
  src_blog uuid;
  src_interview uuid;
begin
  insert into workspaces (owner_id, name, description)
  values (
    target_owner,
    'Sample: city cycling policy',
    'Illustrative data that shows how an evidence file works. The sources use reserved example domains and are not real publications.'
  )
  returning id into ws;

  insert into claims (workspace_id, statement, conclusion, status)
  values (
    ws,
    'Protected bike lanes shorten average commute times in mid-sized cities',
    'Two independent studies point the same way, but the city report measures a single corridor. Treat as probably true for corridors with heavy car traffic.',
    'supported'
  )
  returning id into claim_commute;

  insert into claims (workspace_id, statement, conclusion, status)
  values (
    ws,
    'Protected bike lanes reduce serious injuries for cyclists',
    '',
    'contested'
  )
  returning id into claim_safety;

  insert into sources (workspace_id, url, title, published_on, source_type, excerpt, note, review_status)
  values (
    ws, 'https://example.org/transport-survey-2024', 'Regional commuter survey 2024',
    '2024-03-12', 'report',
    'Among 4,100 respondents, median door-to-door time fell from 34 to 29 minutes after a protected lane opened on their route.',
    'Self-reported times. Sample skews toward people who already cycle.', 'verified'
  )
  returning id into src_survey;

  insert into sources (workspace_id, url, title, published_on, source_type, excerpt, note, review_status)
  values (
    ws, 'https://example.org/city-hall/corridor-evaluation', 'Corridor evaluation after lane opening',
    '2023-11-02', 'government',
    'Bus travel time on the corridor increased by 40 seconds on average; cycling trips grew 31 percent.',
    'Only one corridor. Measures bus time, not door-to-door time.', 'in_review'
  )
  returning id into src_city_report;

  insert into sources (workspace_id, url, title, published_on, source_type, excerpt, note, review_status)
  values (
    ws, 'https://example.org/journal/lane-network-effects', 'Network effects of connected cycling lanes',
    '2022-06-20', 'academic',
    'Connected lane networks produced measurable travel time reductions only when more than 60 percent of trips used a continuous protected route.',
    'Peer reviewed. Authors note that isolated segments showed no effect.', 'verified'
  )
  returning id into src_paper;

  insert into sources (workspace_id, url, title, published_on, source_type, excerpt, note, review_status, flagged)
  values (
    ws, 'https://example.org/news/lanes-slow-drivers', 'Drivers say new lanes add ten minutes to the commute',
    '2024-01-09', 'news',
    'Several drivers interviewed said their trips now take ten minutes longer during rush hour.',
    'Anecdotal. No measurements cited.', 'unreviewed', true
  )
  returning id into src_news;

  insert into sources (workspace_id, url, title, published_on, source_type, excerpt, note, review_status)
  values (
    ws, 'https://example.org/ministry/road-safety-statistics', 'National road safety statistics',
    '2023-09-01', 'government',
    'Serious cyclist injuries per million trips were 38 percent lower on streets with physical separation than on streets with painted lanes.',
    'Compares street types, not before and after.', 'verified'
  )
  returning id into src_ministry;

  insert into sources (workspace_id, url, title, published_on, source_type, excerpt, note, review_status)
  values (
    ws, 'https://example.org/blog/dooring-incidents', 'Why separated lanes create new junction risks',
    '2024-02-14', 'social',
    'Most of the collisions I documented happened at driveways and junctions where the separation ends.',
    'Personal blog with a small sample of incidents. Useful as context for where risk moves.', 'in_review'
  )
  returning id into src_blog;

  insert into sources (workspace_id, url, title, published_on, source_type, excerpt, note, review_status)
  values (
    ws, 'https://example.org/interviews/transport-planner', 'Interview with the city transport planner',
    '2024-04-05', 'interview',
    'We saw fewer injuries on the corridor, but the counts are too small to be confident yet.',
    'Planner has an interest in the programme succeeding.', 'unreviewed'
  )
  returning id into src_interview;

  insert into claim_sources (claim_id, source_id, workspace_id, relation, relation_note) values
    (claim_commute, src_survey, ws, 'supports', 'Direct measurement of door-to-door time.'),
    (claim_commute, src_paper, ws, 'supports', 'Explains when the effect appears.'),
    (claim_commute, src_city_report, ws, 'context', 'Different outcome measure, one corridor.'),
    (claim_commute, src_news, ws, 'contradicts', 'Anecdotal account from drivers.'),
    (claim_safety, src_ministry, ws, 'supports', 'Compares injury rates by street type.'),
    (claim_safety, src_blog, ws, 'contradicts', 'Documents junction collisions.'),
    (claim_safety, src_interview, ws, 'context', 'Early counts, not conclusive.'),
    (claim_safety, src_city_report, ws, 'context', 'Reports a rise in cycling trips, which changes exposure.');

  update sources
  set review_status = 'verified', last_change_reason = 'Methodology section checked against the published appendix.'
  where id = src_survey;

  return ws;
end;
$$;

revoke all on function seed_sample_workspace(uuid) from public;

create function create_sample_workspace() returns uuid
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;
  return seed_sample_workspace(auth.uid());
end;
$$;

revoke all on function create_sample_workspace() from public;
grant execute on function create_sample_workspace() to authenticated;

create function seed_workspace_for_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform seed_sample_workspace(new.id);
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function seed_workspace_for_new_user();
