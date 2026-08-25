import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Dialog } from '@capacitor/dialog';
import type { Session } from '@supabase/supabase-js';
import { ChevronRight, Sparkles, Hammer, Wallet, Palette, Monitor, HelpCircle, CalendarDays, DollarSign, Calculator, Bug, Users, KeyRound, LogOut, Trash2 } from 'lucide-react';

export default function Settings({ session }: { session: Session }) {
  const [displayName, setDisplayName] = useState('');
  
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
    if (data) {
      setDisplayName(data.display_name || '');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const ListItem = ({ icon: Icon, title, subtitle, value, onClick, highlight = false }: any) => (
    <div onClick={onClick} className={`flex items-center justify-between p-4 cursor-pointer active:bg-gray-50 dark:active:bg-slate-700/50 transition-colors ${highlight ? 'bg-amber-50 dark:bg-amber-900/10 rounded-2xl mb-2 border border-amber-100 dark:border-amber-900/20' : 'border-b border-gray-100 dark:border-slate-800 last:border-0'}`}>
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-xl ${highlight ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400'}`}>
          <Icon size={20} />
        </div>
        <div>
          <div className={`font-extrabold text-[15px] ${highlight ? 'text-amber-700 dark:text-amber-500' : 'text-gray-900 dark:text-slate-50'}`}>{title}</div>
          {subtitle && <div className="text-[12px] font-semibold text-gray-500 mt-0.5">{subtitle}</div>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {value && <span className="text-sm font-bold text-gray-600 dark:text-gray-300">{value}</span>}
        <ChevronRight size={18} className="text-gray-300 dark:text-gray-600" />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col pb-10 animate-in fade-in duration-300">
      <div className="px-4 py-2">
        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-6">설정</h2>
        
        {/* Profile Section */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 mb-6 shadow-sm border border-gray-100 dark:border-slate-700/50 flex justify-between items-center cursor-pointer active:scale-95 transition-transform" onClick={() => Dialog.alert({ title: '안내', message: '프로필 수정 기능은 준비 중입니다.' })}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-extrabold text-xl">
              {displayName ? displayName.charAt(0) : '나'}
            </div>
            <div>
              <div className="font-extrabold text-lg text-gray-900 dark:text-white">{displayName || '이름 없음'}</div>
              <div className="text-sm font-medium text-gray-500">{session.user.email}</div>
            </div>
          </div>
          <div className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-sm font-bold text-gray-600 dark:text-gray-300 rounded-xl">
            수정
          </div>
        </div>

        {/* Premium */}
        <ListItem 
          icon={Sparkles} 
          title="프리미엄" 
          subtitle="더 많은 기능 살펴보기" 
          highlight={true}
          onClick={() => Dialog.alert({ title: '안내', message: '프리미엄 구독은 준비 중입니다.' })}
        />

        {/* General Settings */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden mb-6 shadow-sm border border-gray-100 dark:border-slate-700/50">
          <ListItem icon={Hammer} title="내 직종" value="🏗️ 종합" onClick={() => {}} />
          <ListItem icon={Wallet} title="계좌번호" subtitle="정산 요청 시 자동으로 같이 보내드려요" value="미설정" onClick={() => {}} />
          <ListItem icon={Monitor} title="테마" value="시스템" onClick={() => {}} />
          <ListItem icon={Palette} title="메인 색상" onClick={() => {}} />
          <ListItem icon={HelpCircle} title="앱 사용법 다시 보기" subtitle="달력·정산·통계 등 각 탭 설명을 처음부터 다시 봐요" onClick={() => {}} />
          <ListItem icon={CalendarDays} title="달력 주간 합계" subtitle="각 주 수입 합계를 달력에 표시" onClick={() => {}} />
        </div>

        {/* Work Settings */}
        <h3 className="text-sm font-extrabold text-gray-500 px-4 mb-3">작업</h3>
        <div className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden mb-6 shadow-sm border border-gray-100 dark:border-slate-700/50">
          <ListItem icon={DollarSign} title="기본 일당" subtitle="새 현장 추가 시 자동 입력" value="미설정" onClick={() => {}} />
          <ListItem icon={Calculator} title="인적공제 3.3% 기본값" subtitle="새 현장 추가 시 공제 체크 자동 적용" onClick={() => {}} />
        </div>

        {/* Support */}
        <h3 className="text-sm font-extrabold text-gray-500 px-4 mb-3">지원</h3>
        <div className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden mb-6 shadow-sm border border-gray-100 dark:border-slate-700/50">
          <ListItem icon={Bug} title="버그 제보 / 문의하기" subtitle="사진 첨부해서 문의하면 답변을 알려드려요" onClick={() => {}} />
        </div>

        {/* Team */}
        <h3 className="text-sm font-extrabold text-gray-500 px-4 mb-3">팀</h3>
        <div className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden mb-6 shadow-sm border border-gray-100 dark:border-slate-700/50">
          <ListItem icon={Users} title="팀 만들기" subtitle="팀원들과 현장을 함께 관리해요" onClick={() => {}} />
          <ListItem icon={KeyRound} title="코드로 참여하기" subtitle="초대 코드를 입력해 팀 가입을 신청해요" onClick={() => {}} />
        </div>

        {/* Account Actions */}
        <div className="flex flex-col gap-3 mt-8 mb-8">
          <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 font-extrabold hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
            <LogOut size={18} /> 로그아웃
          </button>
          <button onClick={() => Dialog.alert({ title: '안내', message: '계정 삭제 처리는 준비 중입니다.' })} className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-500 font-extrabold hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors">
            <Trash2 size={18} /> 계정 삭제
          </button>
        </div>
      </div>
    </div>
  );
}
