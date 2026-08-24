import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Dialog } from '@capacitor/dialog';
import type { Session } from '@supabase/supabase-js';

export default function Settings({ session }: { session: Session }) {
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('팀원');
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
    if (data) {
      setDisplayName(data.display_name || '');
      setRole(data.role || '팀원');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('profiles').update({
      display_name: displayName
    }).eq('id', session.user.id);
    setLoading(false);

    if (error) {
      await Dialog.alert({ title: '오류', message: '프로필 저장에 실패했습니다.' });
    } else {
      await Dialog.alert({ title: '성공', message: '프로필이 업데이트 되었습니다.' });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return;
    
    setIsPasswordLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsPasswordLoading(false);

    if (error) {
      await Dialog.alert({ title: '오류', message: '비밀번호 변경에 실패했습니다: ' + error.message });
    } else {
      await Dialog.alert({ title: '성공', message: '비밀번호가 성공적으로 변경되었습니다.' });
      setNewPassword('');
    }
  };

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  const toggleDarkMode = () => {
    const isDark = document.documentElement.classList.toggle('dark');
    setIsDarkMode(isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 p-6 flex flex-col min-h-[400px] animate-in fade-in duration-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-slate-50">내 정보</h2>
      </div>
      
      <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">이메일</label>
          <input type="text" disabled value={session.user.email} className="w-full px-4 py-3 bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-500 dark:text-slate-400" />
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">이름 (닉네임)</label>
          <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="이름을 입력하세요" className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">직책</label>
          <input type="text" disabled value={role} className="w-full px-4 py-3 bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-500 dark:text-slate-400 font-bold" />
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">직책은 차후 업데이트에서 자유롭게 변경할 수 있습니다.</p>
        </div>

        <button type="submit" disabled={loading} className="w-full mt-4 bg-gray-900 dark:bg-slate-700 text-white font-bold py-4 rounded-xl hover:bg-black dark:hover:bg-slate-600 transition-all cursor-pointer">
          {loading ? '저장 중...' : '프로필 저장'}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-700/50">
        <h3 className="text-lg font-bold text-gray-900 dark:text-slate-50 mb-4">화면 설정</h3>
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700">
          <div>
            <p className="font-bold text-gray-900 dark:text-slate-100">다크 모드</p>
            <p className="text-xs text-gray-500 dark:text-slate-400">어두운 테마를 사용합니다</p>
          </div>
          <button
            onClick={toggleDarkMode}
            className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${isDarkMode ? 'bg-blue-600 dark:bg-orange-500' : 'bg-gray-300 dark:bg-slate-600'}`}
          >
            <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
          </button>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-700/50">
        <h3 className="text-lg font-bold text-gray-900 dark:text-slate-50 mb-4">보안</h3>
        <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4">
          <div>
            <input 
              type="password" 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              placeholder="새 비밀번호 입력" 
              className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
              minLength={6}
            />
          </div>
          <button type="submit" disabled={isPasswordLoading || !newPassword} className="w-full bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-bold py-4 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all disabled:opacity-50 cursor-pointer">
            {isPasswordLoading ? '변경 중...' : '비밀번호 변경하기'}
          </button>
        </form>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-700/50">
        <button 
          onClick={handleLogout}
          className="w-full py-4 flex items-center justify-center gap-2 text-red-500 font-bold bg-red-50 dark:bg-red-900/10 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
        >
          로그아웃
        </button>
      </div>
    </div>
  );
}
