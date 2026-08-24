import { createClient } from '@supabase/supabase-js'

// TODO: .env 파일이나 환경 변수에 아래 키를 설정해야 합니다.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://example.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
