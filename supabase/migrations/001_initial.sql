create extension if not exists pgcrypto;

create table if not exists public.teachers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 1),
  phone text,
  iban text,
  account_holder text,
  group_rate numeric(12,2) check (group_rate is null or group_rate >= 0),
  private_rate numeric(12,2) check (private_rate is null or private_rate >= 0),
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.work_entries (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers(id) on delete restrict,
  work_month text not null check (work_month ~ '^\\d{4}-(0[1-9]|1[0-2])$'),
  entry_type text not null check (entry_type in ('group','private','extra')),
  description text,
  quantity numeric(12,3) not null check (quantity >= 0),
  unit_rate_snapshot numeric(12,2) not null check (unit_rate_snapshot >= 0),
  total_amount numeric(12,2) not null check (total_amount >= 0),
  rate_override_reason text,
  source_type text not null default 'manual' check (source_type in ('manual','excel')),
  source_reference text unique,
  requires_review boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers(id) on delete restrict,
  payment_month text not null check (payment_month ~ '^\\d{4}-(0[1-9]|1[0-2])$'),
  amount numeric(12,2) not null check (amount > 0),
  paid_at date not null default current_date,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  table_name text not null,
  record_id uuid,
  action text not null,
  user_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_work_entries_month_teacher on public.work_entries(work_month, teacher_id);
create index if not exists idx_payments_month_teacher on public.payments(payment_month, teacher_id);

alter table public.teachers enable row level security;
alter table public.work_entries enable row level security;
alter table public.payments enable row level security;
alter table public.audit_log enable row level security;

create policy "authenticated_manage_teachers" on public.teachers for all to authenticated using (true) with check (true);
create policy "authenticated_manage_work_entries" on public.work_entries for all to authenticated using (true) with check (true);
create policy "authenticated_manage_payments" on public.payments for all to authenticated using (true) with check (true);
create policy "authenticated_read_audit" on public.audit_log for select to authenticated using (true);

create or replace function public.write_audit_log() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_log(table_name, record_id, action, user_id, old_data, new_data)
  values (tg_table_name, coalesce(new.id, old.id), tg_op, auth.uid(), to_jsonb(old), to_jsonb(new));
  return coalesce(new, old);
end;
$$;

drop trigger if exists teachers_audit on public.teachers;
create trigger teachers_audit after insert or update or delete on public.teachers for each row execute function public.write_audit_log();
drop trigger if exists work_entries_audit on public.work_entries;
create trigger work_entries_audit after insert or update or delete on public.work_entries for each row execute function public.write_audit_log();
drop trigger if exists payments_audit on public.payments;
create trigger payments_audit after insert or update or delete on public.payments for each row execute function public.write_audit_log();
