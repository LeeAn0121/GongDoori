-- 팀 관리용 Supabase RLS 보안 정책 (V2)
-- 이전 정책이 설정되어 있더라도, 아래 코드들을 실행하면 권한이 추가되어 '팀 삭제' 및 '내보내기'가 가능해집니다.

-- 1. 팀 삭제: 내가 팀장으로 소속된 팀만 삭제(DELETE) 가능
CREATE POLICY "Team leaders can delete teams" ON public.teams FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM team_members tm
    JOIN profiles p ON p.id = tm.user_id
    WHERE tm.team_id = teams.id
    AND tm.user_id = auth.uid()
    AND p.role = '팀장'
  )
);

-- 2. 팀원 강제 내보내기: 내가 팀장으로 소속된 팀의 멤버만 강제 퇴장(DELETE) 가능
CREATE POLICY "Team leaders can kick members" ON public.team_members FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM team_members tm
    JOIN profiles p ON p.id = tm.user_id
    WHERE tm.team_id = team_members.team_id
    AND tm.user_id = auth.uid()
    AND p.role = '팀장'
  )
);
