-- Drafts are private review records. Generation never inserts public products.
begin;

create schema if not exists private;

create table private.catalog_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table private.catalog_admins enable row level security;
revoke all on table private.catalog_admins from public, anon, authenticated;

create table public.product_drafts (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  sku text not null unique check (pg_catalog.char_length(sku) between 1 and 128),
  category text not null check (pg_catalog.char_length(pg_catalog.btrim(category)) between 1 and 80),
  name text not null check (pg_catalog.char_length(pg_catalog.btrim(name)) between 1 and 200),
  description text not null default '' check (pg_catalog.char_length(description) <= 6000),
  price numeric(12,2) check (price is null or (price >= 0 and price < 10000000000)),
  stock integer check (stock is null or stock >= 0),
  colors text[] not null default '{}' check (pg_catalog.cardinality(colors) <= 30 and pg_catalog.array_position(colors, null) is null),
  types text[] not null default '{}' check (pg_catalog.cardinality(types) <= 30 and pg_catalog.array_position(types, null) is null),
  images text[] not null default '{}' check (pg_catalog.cardinality(images) <= 20 and pg_catalog.array_position(images, null) is null),
  status text not null default 'draft' check (status in ('draft', 'published', 'rejected')),
  verified boolean not null default false,
  product_id bigint,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  approved_by uuid,
  approved_at timestamptz,
  constraint product_drafts_publication_state check (
    (status = 'published' and product_id is not null and approved_by is not null and approved_at is not null)
    or (status <> 'published' and product_id is null and approved_by is null and approved_at is null)
  )
);
create index product_drafts_category_status_created_idx
  on public.product_drafts (category, status, created_at, id);
create index product_drafts_pending_idx
  on public.product_drafts (created_at, id) where status = 'draft' and verified;

-- Add metadata without changing existing product values, permissions or policies.
alter table public.products add column if not exists catalog_category text;
alter table public.products add column if not exists catalog_sku text;
create unique index if not exists products_catalog_sku_unique
  on public.products (catalog_sku) where catalog_sku is not null;
create index if not exists products_catalog_category_created_idx
  on public.products (catalog_category, created_at desc, id desc)
  where catalog_category is not null;

create function private.catalog_is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from private.catalog_admins as a
    where a.user_id = (select auth.uid())
  );
$$;

create function public.catalog_is_admin()
returns boolean language sql stable security invoker set search_path = ''
as $$ select private.catalog_is_admin(); $$;

create function private.catalog_touch_draft()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;
create trigger catalog_touch_draft before update on public.product_drafts
  for each row execute function private.catalog_touch_draft();

alter table public.product_drafts enable row level security;
revoke all on table public.product_drafts from public, anon, authenticated;
grant select on table public.product_drafts to authenticated;
grant update (name, description, price, stock, colors, types, images, verified)
  on public.product_drafts to authenticated;
create policy catalog_admin_read on public.product_drafts for select to authenticated
  using ((select private.catalog_is_admin()));
create policy catalog_admin_edit on public.product_drafts for update to authenticated
  using ((select private.catalog_is_admin()) and status = 'draft' and product_id is null)
  with check ((select private.catalog_is_admin()) and status = 'draft' and product_id is null);

create function private.catalog_generate_drafts(categories text[], per_category integer default 5000)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_category text;
  v_inserted integer;
  v_total bigint;
  v_inserted_total integer := 0;
  v_total_count bigint := 0;
  v_categories jsonb := '[]'::jsonb;
begin
  if not private.catalog_is_admin() then
    raise exception 'Catalog administrator access required.' using errcode = '42501';
  end if;
  if categories is null or pg_catalog.cardinality(categories) not between 1 and 20
    or pg_catalog.array_ndims(categories) <> 1 or per_category is null
    or per_category not between 1 and 5000 then
    raise exception 'Choose 1–20 categories and 1–5000 drafts per category.' using errcode = '22023';
  end if;
  if exists (
    select 1 from pg_catalog.unnest(categories) as c(value)
    where c.value is null or pg_catalog.char_length(pg_catalog.btrim(c.value)) not between 1 and 80
  ) then
    raise exception 'Each category must contain 1–80 characters.' using errcode = '22023';
  end if;

  for v_category in
    select pg_catalog.min(pg_catalog.btrim(c.value))
    from pg_catalog.unnest(categories) as c(value)
    group by pg_catalog.lower(pg_catalog.btrim(c.value))
    order by 1
  loop
    insert into public.product_drafts (sku, category, name, description)
    select
      'DRAFT-' || pg_catalog.md5(pg_catalog.lower(v_category)) || '-' || pg_catalog.lpad(n.value::text, 5, '0'),
      v_category,
      v_category || ' draft ' || pg_catalog.lpad(n.value::text, 5, '0'),
      'Unverified generated product concept. Replace this placeholder with genuine supplier details and verify all information before approval.'
    from pg_catalog.generate_series(1, per_category) as n(value)
    on conflict (sku) do nothing;
    get diagnostics v_inserted = row_count;
    select pg_catalog.count(*) into v_total from public.product_drafts as d
      where pg_catalog.lower(d.category) = pg_catalog.lower(v_category);
    v_inserted_total := v_inserted_total + v_inserted;
    v_total_count := v_total_count + v_total;
    v_categories := v_categories || pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object(
      'category', v_category, 'inserted_count', v_inserted, 'total_count', v_total
    ));
  end loop;
  return pg_catalog.jsonb_build_object(
    'inserted_count', v_inserted_total, 'total_count', v_total_count, 'categories', v_categories
  );
end;
$$;

create function private.catalog_update_drafts(rows jsonb)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_row jsonb;
  v_field text;
  v_price numeric;
  v_stock numeric;
  v_changed integer;
  v_updated integer := 0;
begin
  if not private.catalog_is_admin() then
    raise exception 'Catalog administrator access required.' using errcode = '42501';
  end if;
  if rows is null or pg_catalog.jsonb_typeof(rows) <> 'array' then
    raise exception 'Supply an array of 1–100 draft updates.' using errcode = '22023';
  end if;
  if pg_catalog.jsonb_array_length(rows) not between 1 and 100 then
    raise exception 'Supply an array of 1–100 draft updates.' using errcode = '22023';
  end if;

  -- Validate the complete batch before changing any row.
  for v_row in select x.value from pg_catalog.jsonb_array_elements(rows) as x(value)
  loop
    if pg_catalog.jsonb_typeof(v_row) <> 'object' or not (v_row ?& array[
      'sku', 'name', 'description', 'price', 'stock', 'colors', 'types', 'images', 'verified'
    ]) then
      raise exception 'Each draft update must provide all editable fields and its SKU.' using errcode = '22023';
    end if;
    if pg_catalog.jsonb_typeof(v_row->'sku') <> 'string'
      or pg_catalog.char_length(pg_catalog.btrim(v_row->>'sku')) not between 1 and 128
      or pg_catalog.jsonb_typeof(v_row->'name') <> 'string'
      or pg_catalog.char_length(pg_catalog.btrim(v_row->>'name')) not between 1 and 200
      or pg_catalog.jsonb_typeof(v_row->'description') <> 'string'
      or pg_catalog.char_length(v_row->>'description') > 6000
      or pg_catalog.jsonb_typeof(v_row->'verified') <> 'boolean' then
      raise exception 'Invalid draft SKU, name, description or verification value.' using errcode = '22023';
    end if;
    if pg_catalog.jsonb_typeof(v_row->'price') not in ('null', 'number')
      or pg_catalog.jsonb_typeof(v_row->'stock') not in ('null', 'number') then
      raise exception 'Price and stock must be numbers or null.' using errcode = '22023';
    end if;
    v_price := (v_row->>'price')::numeric;
    v_stock := (v_row->>'stock')::numeric;
    if v_price is not null and (v_price < 0 or v_price >= 10000000000 or v_price <> pg_catalog.round(v_price, 2)) then
      raise exception 'Price must be nonnegative, within range and have at most two decimal places.' using errcode = '22023';
    end if;
    if v_stock is not null and (v_stock < 0 or v_stock > 2147483647 or v_stock <> pg_catalog.trunc(v_stock)) then
      raise exception 'Stock must be a nonnegative integer within range.' using errcode = '22023';
    end if;
    foreach v_field in array array['colors', 'types', 'images']
    loop
      if pg_catalog.jsonb_typeof(v_row->v_field) <> 'array' then
        raise exception 'Colours, types and images must be arrays.' using errcode = '22023';
      end if;
      if pg_catalog.jsonb_array_length(v_row->v_field) > case when v_field = 'images' then 20 else 30 end then
        raise exception 'Too many colours, types or images.' using errcode = '22023';
      end if;
      if exists (
        select 1 from pg_catalog.jsonb_array_elements(v_row->v_field) as entry(value)
        where pg_catalog.jsonb_typeof(entry.value) <> 'string'
          or pg_catalog.char_length(pg_catalog.btrim(entry.value #>> '{}')) = 0
          or pg_catalog.char_length(entry.value #>> '{}') > case when v_field = 'images' then 2000 else 100 end
          or (v_field = 'images' and (entry.value #>> '{}') !~* '^https://[[:alnum:]][[:alnum:].-]*(:[0-9]{1,5})?([/?#][^[:space:]]*)?$')
      ) then
        raise exception 'Use nonempty short colour/type values and valid HTTPS image URLs.' using errcode = '22023';
      end if;
    end loop;
  end loop;
  if (select pg_catalog.count(distinct x.value->>'sku') from pg_catalog.jsonb_array_elements(rows) as x(value))
    <> pg_catalog.jsonb_array_length(rows) then
    raise exception 'A batch cannot contain duplicate SKUs.' using errcode = '22023';
  end if;

  for v_row in select x.value from pg_catalog.jsonb_array_elements(rows) as x(value)
  loop
    update public.product_drafts as d set
      name = pg_catalog.btrim(v_row->>'name'),
      description = v_row->>'description',
      price = (v_row->>'price')::numeric,
      stock = ((v_row->>'stock')::numeric)::integer,
      colors = array(select pg_catalog.jsonb_array_elements_text(v_row->'colors')),
      types = array(select pg_catalog.jsonb_array_elements_text(v_row->'types')),
      images = array(select pg_catalog.jsonb_array_elements_text(v_row->'images')),
      verified = (v_row->>'verified')::boolean,
      status = 'draft'
    where d.sku = v_row->>'sku' and d.status in ('draft', 'rejected') and d.product_id is null;
    get diagnostics v_changed = row_count;
    v_updated := v_updated + v_changed;
  end loop;
  return pg_catalog.jsonb_build_object('updated_count', v_updated);
end;
$$;

create function private.catalog_approve_drafts(ids uuid[] default null, category_filter text default null)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_draft public.product_drafts%rowtype;
  v_product_id bigint;
  v_ids uuid[] := '{}';
  v_products bigint[] := '{}';
  v_filter text := pg_catalog.btrim(category_filter);
begin
  if not private.catalog_is_admin() then
    raise exception 'Catalog administrator access required.' using errcode = '42501';
  end if;
  if ids is not null and (pg_catalog.cardinality(ids) > 100 or pg_catalog.array_ndims(ids) > 1) then
    raise exception 'Approve at most 100 drafts per request.' using errcode = '22023';
  end if;
  if v_filter is not null and pg_catalog.char_length(v_filter) not between 1 and 80 then
    raise exception 'Invalid category filter.' using errcode = '22023';
  end if;

  for v_draft in
    select d.* from public.product_drafts as d
    where d.status = 'draft' and d.product_id is null and d.verified
      and (ids is null or d.id = any(ids))
      and (v_filter is null or d.category = v_filter)
      and pg_catalog.char_length(pg_catalog.btrim(d.name)) > 0
      and pg_catalog.btrim(d.name) !~* '\mdraft[[:space:]_-]*[0-9]+$'
      and pg_catalog.lower(pg_catalog.btrim(d.name)) not in
        ('draft', 'untitled', 'new product', 'placeholder', 'sample product', 'test product')
      and d.price > 0 and d.stock >= 0
      and pg_catalog.cardinality(d.images) > 0
      and not exists (
        select 1 from pg_catalog.unnest(d.images) as image(value)
        where image.value is null or image.value !~* '^https://[[:alnum:]][[:alnum:].-]*(:[0-9]{1,5})?([/?#][^[:space:]]*)?$'
      )
    order by d.created_at, d.id
    limit 100 for update of d skip locked
  loop
    v_product_id := null;
    insert into public.products (name, price, description, stock, colors, types, images, catalog_category, catalog_sku)
    select p.name, p.price, p.description, p.stock, p.colors, p.types, p.images, p.catalog_category, p.catalog_sku
    from pg_catalog.jsonb_populate_record(null::public.products, pg_catalog.jsonb_build_object(
      'name', pg_catalog.btrim(v_draft.name), 'price', v_draft.price,
      'description', nullif(v_draft.description, 'Unverified generated product concept. Replace this placeholder with genuine supplier details and verify all information before approval.'),
      'stock', v_draft.stock, 'colors', v_draft.colors, 'types', v_draft.types, 'images', v_draft.images,
      'catalog_category', v_draft.category, 'catalog_sku', v_draft.sku
    )) as p
    where true
    on conflict (catalog_sku) where catalog_sku is not null do nothing
    returning id into v_product_id;
    if v_product_id is null then
      select p.id into strict v_product_id from public.products as p where p.catalog_sku = v_draft.sku;
    end if;
    update public.product_drafts as d set
      status = 'published', product_id = v_product_id, approved_by = auth.uid(), approved_at = pg_catalog.now()
    where d.id = v_draft.id;
    v_ids := pg_catalog.array_append(v_ids, v_draft.id);
    v_products := pg_catalog.array_append(v_products, v_product_id);
  end loop;
  return pg_catalog.jsonb_build_object(
    'published_count', pg_catalog.cardinality(v_ids), 'published_ids', v_ids, 'product_ids', v_products
  );
end;
$$;

create function private.catalog_reject_drafts(ids uuid[])
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_id uuid;
  v_ids uuid[] := '{}';
begin
  if not private.catalog_is_admin() then
    raise exception 'Catalog administrator access required.' using errcode = '42501';
  end if;
  if ids is null or pg_catalog.cardinality(ids) not between 1 and 100 or pg_catalog.array_ndims(ids) <> 1 then
    raise exception 'Reject 1–100 drafts per request.' using errcode = '22023';
  end if;
  for v_id in
    select d.id from public.product_drafts as d
    where d.id = any(ids) and d.status = 'draft' and d.product_id is null
    order by d.created_at, d.id limit 100 for update of d skip locked
  loop
    update public.product_drafts as d set status = 'rejected' where d.id = v_id;
    v_ids := pg_catalog.array_append(v_ids, v_id);
  end loop;
  return pg_catalog.jsonb_build_object('rejected_count', pg_catalog.cardinality(v_ids), 'rejected_ids', v_ids);
end;
$$;

create function private.catalog_draft_summary()
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare v_summary jsonb;
begin
  if not private.catalog_is_admin() then
    raise exception 'Catalog administrator access required.' using errcode = '42501';
  end if;
  select coalesce(pg_catalog.jsonb_agg(pg_catalog.to_jsonb(s) order by s.category), '[]'::jsonb)
    into v_summary
  from (
    select d.category, pg_catalog.count(*) as total_count,
      pg_catalog.count(*) filter (where d.status = 'draft') as draft_count,
      pg_catalog.count(*) filter (where d.status = 'published') as published_count,
      pg_catalog.count(*) filter (where d.status = 'rejected') as rejected_count,
      pg_catalog.count(*) filter (where
        d.status = 'draft' and d.product_id is null and d.verified
        and pg_catalog.char_length(pg_catalog.btrim(d.name)) > 0
        and pg_catalog.btrim(d.name) !~* '\mdraft[[:space:]_-]*[0-9]+$'
        and pg_catalog.lower(pg_catalog.btrim(d.name)) not in
          ('draft', 'untitled', 'new product', 'placeholder', 'sample product', 'test product')
        and d.price > 0 and d.stock >= 0 and pg_catalog.cardinality(d.images) > 0
        and not exists (
          select 1 from pg_catalog.unnest(d.images) as image(value)
          where image.value is null or image.value !~* '^https://[[:alnum:]][[:alnum:].-]*(:[0-9]{1,5})?([/?#][^[:space:]]*)?$'
        )
      ) as ready_count
    from public.product_drafts as d group by d.category
  ) as s;
  return v_summary;
end;
$$;

-- Public RPCs keep invoker security; elevated implementations remain private.
create function public.catalog_generate_drafts(categories text[], per_category integer default 5000)
returns jsonb language sql security invoker set search_path = ''
as $$ select private.catalog_generate_drafts(categories, per_category); $$;
create function public.catalog_update_drafts(rows jsonb)
returns jsonb language sql security invoker set search_path = ''
as $$ select private.catalog_update_drafts(rows); $$;
create function public.catalog_approve_drafts(ids uuid[] default null, category_filter text default null)
returns jsonb language sql security invoker set search_path = ''
as $$ select private.catalog_approve_drafts(ids, category_filter); $$;
create function public.catalog_reject_drafts(ids uuid[])
returns jsonb language sql security invoker set search_path = ''
as $$ select private.catalog_reject_drafts(ids); $$;
create function public.catalog_draft_summary()
returns jsonb language sql stable security invoker set search_path = ''
as $$ select private.catalog_draft_summary(); $$;
create function public.catalog_public_categories()
returns text[] language sql stable security invoker set search_path = ''
as $$
  select coalesce(pg_catalog.array_agg(distinct p.catalog_category order by p.catalog_category), '{}'::text[])
  from public.products as p where p.catalog_category is not null and pg_catalog.btrim(p.catalog_category) <> '';
$$;

-- Schema usage permits calling helpers, not reading or changing the allowlist.
grant usage on schema private to authenticated;
revoke all on function private.catalog_touch_draft() from public, anon, authenticated;
revoke all on function private.catalog_is_admin() from public, anon, authenticated;
revoke all on function private.catalog_generate_drafts(text[], integer) from public, anon, authenticated;
revoke all on function private.catalog_update_drafts(jsonb) from public, anon, authenticated;
revoke all on function private.catalog_approve_drafts(uuid[], text) from public, anon, authenticated;
revoke all on function private.catalog_reject_drafts(uuid[]) from public, anon, authenticated;
revoke all on function private.catalog_draft_summary() from public, anon, authenticated;
grant execute on function private.catalog_is_admin(), private.catalog_generate_drafts(text[], integer),
  private.catalog_update_drafts(jsonb), private.catalog_approve_drafts(uuid[], text),
  private.catalog_reject_drafts(uuid[]), private.catalog_draft_summary() to authenticated;
revoke all on function public.catalog_is_admin() from public, anon, authenticated;
revoke all on function public.catalog_generate_drafts(text[], integer) from public, anon, authenticated;
revoke all on function public.catalog_update_drafts(jsonb) from public, anon, authenticated;
revoke all on function public.catalog_approve_drafts(uuid[], text) from public, anon, authenticated;
revoke all on function public.catalog_reject_drafts(uuid[]) from public, anon, authenticated;
revoke all on function public.catalog_draft_summary() from public, anon, authenticated;
grant execute on function public.catalog_is_admin(), public.catalog_generate_drafts(text[], integer),
  public.catalog_update_drafts(jsonb), public.catalog_approve_drafts(uuid[], text),
  public.catalog_reject_drafts(uuid[]), public.catalog_draft_summary() to authenticated;
revoke all on function public.catalog_public_categories() from public, anon, authenticated;
grant execute on function public.catalog_public_categories() to anon, authenticated;

commit;
