-- Concierge requests: honest request log. Pearl Club has no reservation system, so nothing here is a booking.
-- Rows are written only through create_concierge_request() (security definer); the table itself has RLS
-- on with no policies, so nobody can read or write it directly through the API.

create table if not exists public.concierge_requests (
  id           bigint generated always as identity primary key,
  request_type text not null check (request_type in ('venue', 'hotel_service')),
  place_id     bigint references public.places (id) on delete set null,
  place_name   text,                                  -- copied from places at insert time, so it survives a re-seed
  service_type text check (service_type in ('spa', 'late_checkout', 'airport_transfer', 'restaurant_reservation', 'other')),
  city         text not null,                         -- city slug
  date         date not null,
  time         time not null,
  party_size   smallint not null check (party_size between 1 and 20),
  name         text not null check (char_length(name) between 1 and 100),
  email        text not null check (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  notes        text check (char_length(notes) <= 500),
  created_at   timestamptz not null default now(),
  constraint concierge_requests_shape check (
    (request_type = 'venue' and place_id is not null and place_name is not null and service_type is null)
    or (request_type = 'hotel_service' and place_id is null and place_name is null and service_type is not null)
  )
);

alter table public.concierge_requests enable row level security;

create or replace function public.create_concierge_request(
  p_request_type text,
  p_place_id     bigint,
  p_service_type text,
  p_city         text,
  p_date         date,
  p_time         time,
  p_party_size   int,
  p_name         text,
  p_email        text,
  p_notes        text
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_place public.places%rowtype;
  v_city  text := p_city;
  v_id    bigint;
begin
  -- Server enforces the same rules as the form. Constraints above reject the rest (SQLSTATE 23514).
  if p_date is null or p_date < current_date - 1 or p_date > current_date + 365 then
    raise exception 'invalid_date' using errcode = '22023';
  end if;

  if p_request_type = 'venue' then
    select * into v_place from public.places where id = p_place_id;
    if not found then
      raise exception 'invalid_place' using errcode = '22023';
    end if;
    v_city := v_place.city_slug;
  elsif p_request_type = 'hotel_service' then
    if not exists (select 1 from public.places where city_slug = p_city) then
      raise exception 'invalid_city' using errcode = '22023';
    end if;
  else
    raise exception 'invalid_type' using errcode = '22023';
  end if;

  insert into public.concierge_requests
    (request_type, place_id, place_name, service_type, city, date, time, party_size, name, email, notes)
  values
    (p_request_type,
     case when p_request_type = 'venue' then v_place.id end,
     case when p_request_type = 'venue' then v_place.name end,
     case when p_request_type = 'hotel_service' then p_service_type end,
     v_city, p_date, p_time, p_party_size, btrim(p_name), btrim(p_email), nullif(btrim(coalesce(p_notes, '')), ''))
  returning id into v_id;

  return v_id;
end;
$$;

-- Callable with the publishable key. It can only insert validated rows and returns just the new id.
revoke execute on function public.create_concierge_request(text, bigint, text, text, date, time, int, text, text, text) from public;
grant execute on function public.create_concierge_request(text, bigint, text, text, date, time, int, text, text, text) to anon, authenticated, service_role;
