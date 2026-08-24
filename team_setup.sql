-- 팀 생성 및 가입을 위한 추가 보안(RLS) 정책 설정

-- 1. 누구나 새로운 팀을 만들 수 있도록 허용
create policy "Users can create teams" on public.teams for insert with check (true);

-- 2. 누구나 초대 코드로 팀을 검색할 수 있도록 팀 조회 정책 수정 (기존 정책을 보완)
drop policy if exists "Users can view their teams" on public.teams;
create policy "Anyone can view teams" on public.teams for select using (true);

-- 3. 팀 멤버 테이블에 대한 CRUD 허용 (본인이 가입하거나 팀을 조회할 때 필요)
create policy "Users can view team members" on public.team_members for select using (true);
create policy "Users can join team" on public.team_members for insert with check (auth.uid() = user_id);
create policy "Users can leave team" on public.team_members for delete using (auth.uid() = user_id);
