-- 1. 프로필(profiles) 테이블 확장
-- 직종, 계좌번호, 테마, 기본 일당, 3.3% 공제 기본값 추가
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS job_role text CHECK (job_role IN ('목수', '타일', '도장', '전기', '설비', '도배', '마루', '종합')),
ADD COLUMN IF NOT EXISTS account_number text,
ADD COLUMN IF NOT EXISTS theme text DEFAULT 'system' CHECK (theme IN ('system', 'light', 'dark')),
ADD COLUMN IF NOT EXISTS default_wage integer,
ADD COLUMN IF NOT EXISTS default_tax_deduction boolean DEFAULT false;

-- 2. 일당 기록(wage_records) 테이블 확장
-- 작업 내용, 품수, 3.3% 공제 여부, 경비, 색상, 정산 상태 등 추가
ALTER TABLE public.wage_records
ADD COLUMN IF NOT EXISTS task_content text,
ADD COLUMN IF NOT EXISTS tax_deduction boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS poomsu numeric DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS expenses integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS color text DEFAULT '#3B82F6', -- 기본 파란색
ADD COLUMN IF NOT EXISTS status text DEFAULT '미수금' CHECK (status IN ('미수금', '완료')),
ADD COLUMN IF NOT EXISTS settlement_date date,
ADD COLUMN IF NOT EXISTS settlement_memo text,
ADD COLUMN IF NOT EXISTS google_event_id text;

-- 3. (선택) 기존 데이터 마이그레이션 방어코드
-- 만약 기존에 입력된 데이터 중 NULL 값이 있으면 곤란한 필드들을 초기화합니다.
UPDATE public.wage_records SET poomsu = 1.0 WHERE poomsu IS NULL;
UPDATE public.wage_records SET expenses = 0 WHERE expenses IS NULL;
UPDATE public.wage_records SET status = '미수금' WHERE status IS NULL;
UPDATE public.wage_records SET tax_deduction = false WHERE tax_deduction IS NULL;

-- 변경 완료 후 Supabase Dashboard 에서 확인하세요!
