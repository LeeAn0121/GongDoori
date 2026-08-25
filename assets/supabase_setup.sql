-- 1. 회원 정보 (Profiles) 테이블 생성
-- Supabase Auth 사용자(auth.users)와 1:1 매칭되는 커스텀 프로필 테이블입니다.
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text not null,
  display_name text,
  role text check (role in ('팀장', '반장', '팀원')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- auth.users 테이블에 새 유저가 가입할 때 profiles 테이블에 자동 삽입하는 트리거 설정
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, role)
  values (new.id, new.email, split_part(new.email, '@', 1), '팀원');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. 팀 (Teams) 테이블 생성
create table public.teams (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  invite_code text unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. 팀 멤버 (Team Members) 테이블 생성
create table public.team_members (
  team_id uuid references public.teams(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (team_id, user_id)
);

-- 4. 일당 기록 (Wage Records) 테이블 생성
create table public.wage_records (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  team_id uuid references public.teams(id) on delete set null,
  date date not null,
  site_name text not null,
  amount integer not null,
  memo text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS (Row Level Security) 설정 (데이터 보안)
alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.wage_records enable row level security;

-- 본인 프로필만 조회/수정 가능
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- 자신이 속한 팀만 조회 가능 (기본적인 예시)
create policy "Users can view their teams" on public.teams for select using (
  id in (select team_id from public.team_members where user_id = auth.uid())
);

-- 본인의 일당 기록만 조회/삽입/수정/삭제 가능
create policy "Users can CRUD own wage records" on public.wage_records
  for all using (auth.uid() = user_id);
