import { useState } from 'react'
import { supabase } from './supabaseClient'
import { Lock, Mail } from 'lucide-react'
import { Dialog } from '@capacitor/dialog'
import { Capacitor } from '@capacitor/core'
import { Browser } from '@capacitor/browser'

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
    } catch (error: any) {
      await Dialog.alert({ title: '오류', message: error.error_description || error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!email) {
      await Dialog.alert({ title: '안내', message: '비밀번호를 재설정할 이메일을 먼저 입력해주세요.' });
      return;
    }
    setLoading(true)
    try {
      const isNative = Capacitor.isNativePlatform();
      const redirectUrl = isNative 
        ? 'gongdoori://login-callback'
        : window.location.origin + window.location.pathname;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      })
      if (error) throw error
      await Dialog.alert({ title: '성공', message: '비밀번호 재설정 메일이 전송되었습니다. 이메일함을 확인해주세요.' })
    } catch (error: any) {
      await Dialog.alert({ title: '오류', message: error.error_description || error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthLogin = async (provider: string) => {
    try {
      setLoading(true)
      const isNative = Capacitor.isNativePlatform();
      const redirectUrl = isNative 
        ? 'gongdoori://login-callback'
        : window.location.origin + window.location.pathname
        
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider as any,
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: isNative // 모바일에서는 자동 리다이렉트 방지
        }
      })
      
      if (error) {
        throw error;
      }
      
      // 모바일인 경우 인앱 브라우저로 열기
      if (isNative) {
        if (data?.url) {
          await Browser.open({ url: data.url });
        } else {
          await Dialog.alert({ title: '디버그', message: 'data.url이 없습니다.' });
        }
      } else {
        // 웹 플랫폼인데 isNative가 false로 잡혔을 경우 (안전장치)
        if (data?.url) {
          window.location.href = data.url;
        }
      }
      
      // 브라우저가 열린 후 로딩 상태 복구
      setLoading(false);
      
    } catch (error: any) {
      await Dialog.alert({ title: '오류', message: error.message || '알 수 없는 오류가 발생했습니다.' })
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 flex flex-col items-center justify-center p-4 transition-colors duration-500">
      <div className="w-full max-w-md bg-white/80 dark:bg-slate-800/80 backdrop-blur-2xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-white/50 dark:border-slate-700/50 p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 rounded-[2rem] flex items-center justify-center shadow-xl shadow-blue-200/50 dark:shadow-orange-900/30 mb-5 overflow-hidden border-4 border-white dark:border-slate-800">
            <img src={`${import.meta.env.BASE_URL}app_icon_v2.jpg`} alt="공돌이 앱 아이콘" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-slate-50 tracking-tight">공돌이</h1>
          <p className="text-gray-500 dark:text-slate-400 font-medium mt-2">스마트한 일당 & 현장 관리</p>
        </div>

        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">이메일</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-900 dark:text-gray-400 dark:text-slate-500" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일을 입력하세요" 
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:bg-slate-800 transition-all"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">비밀번호</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-900 dark:text-gray-400 dark:text-slate-500" />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요" 
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:bg-slate-800 transition-all"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-blue-600 dark:bg-orange-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 dark:shadow-orange-900/50 hover:bg-blue-700 dark:bg-orange-600 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? '처리중...' : '이메일로 로그인'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button 
            type="button" 
            onClick={handleResetPassword}
            disabled={loading}
            className="text-sm font-semibold text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:text-slate-100 transition-colors cursor-pointer"
          >
            비밀번호를 잊으셨나요?
          </button>
        </div>

        <div className="relative flex items-center py-6">
          <div className="flex-grow border-t border-gray-200 dark:border-slate-700"></div>
          <span className="flex-shrink-0 mx-4 text-gray-400 dark:text-slate-500 text-sm font-semibold">또는 3초만에 로그인</span>
          <div className="flex-grow border-t border-gray-200 dark:border-slate-700"></div>
        </div>

        <div className="flex justify-center items-center gap-5 mt-4">
          {/* Kakao */}
          <button 
            type="button" 
            onClick={() => handleOAuthLogin('kakao')} 
            className="w-14 h-14 flex items-center justify-center bg-[#FEE500] hover:bg-[#FADA0A] text-black font-extrabold rounded-full transition-transform active:scale-95 cursor-pointer shadow-md"
            aria-label="카카오로 로그인"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
              <path d="M12 3c-5.52 0-10 3.51-10 7.84 0 2.8 1.83 5.25 4.6 6.55-.31 1.13-1.12 4.14-1.14 4.26-.03.18.14.28.28.2.17-.11 3.54-2.39 4.9-3.32.74.1 1.54.16 2.36.16 5.52 0 10-3.51 10-7.84S17.52 3 12 3z"/>
            </svg>
          </button>
          
          {/* Google */}
          <button 
            type="button" 
            onClick={() => handleOAuthLogin('google')} 
            className="w-14 h-14 flex items-center justify-center bg-white dark:bg-gray-100 hover:bg-gray-50 text-gray-800 font-extrabold rounded-full border border-gray-200 transition-transform active:scale-95 cursor-pointer shadow-md"
            aria-label="Google로 로그인"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </button>

          {/* Discord */}
          <button 
            type="button" 
            onClick={() => handleOAuthLogin('discord')} 
            className="w-14 h-14 flex items-center justify-center bg-[#5865F2] hover:bg-[#4752C4] text-white font-extrabold rounded-full transition-transform active:scale-95 cursor-pointer shadow-md"
            aria-label="Discord로 로그인"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
          </button>

          {/* GitHub */}
          <button 
            type="button" 
            onClick={() => handleOAuthLogin('github')} 
            className="w-14 h-14 flex items-center justify-center bg-[#24292e] hover:bg-[#1b1f23] text-white font-extrabold rounded-full transition-transform active:scale-95 cursor-pointer shadow-md"
            aria-label="GitHub으로 로그인"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
