import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Dialog } from '@capacitor/dialog';
import type { Session } from '@supabase/supabase-js';
import { ChevronRight, Sparkles, Hammer, Wallet, Palette, Monitor, HelpCircle, CalendarDays, DollarSign, Calculator, Bug, Users, KeyRound, LogOut, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Settings({ session }: { session: Session }) {
  const [displayName, setDisplayName] = useState('');
  
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [isJoinTeamOpen, setIsJoinTeamOpen] = useState(false);
  const [isPremiumOpen, setIsPremiumOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isCalSubOpen, setIsCalSubOpen] = useState(false);
  const [isTeamManageOpen, setIsTeamManageOpen] = useState(false);

  const [newTeamName, setNewTeamName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [joinMessage, setJoinMessage] = useState('');
  const [supportContent, setSupportContent] = useState('');
  
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
          onClick={() => setIsPremiumOpen(true)}
        />

        {/* General Settings */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden mb-6 shadow-sm border border-gray-100 dark:border-slate-700/50">
          <ListItem icon={Hammer} title="내 직종" value="🏗️ 종합" onClick={() => {}} />
          <ListItem icon={Wallet} title="계좌번호" subtitle="정산 요청 시 자동으로 같이 보내드려요" value="미설정" onClick={() => {}} />
          <ListItem icon={Monitor} title="테마" value="시스템" onClick={() => {}} />
          <ListItem icon={Palette} title="메인 색상" onClick={() => {}} />
          <ListItem icon={CalendarDays} title="캘린더 구독" subtitle="다른 캘린더 앱(구글, 애플 등)과 연동해요" onClick={() => setIsCalSubOpen(true)} />
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
          <ListItem icon={Bug} title="버그 제보 / 문의하기" subtitle="사진 첨부해서 문의하면 답변을 알려드려요" onClick={() => setIsSupportOpen(true)} />
        </div>

        {/* Team */}
        <h3 className="text-sm font-extrabold text-gray-500 px-4 mb-3">팀</h3>
        <div className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden mb-6 shadow-sm border border-gray-100 dark:border-slate-700/50">
          <ListItem icon={Users} title="팀 관리" subtitle="현재 소속된 팀을 관리해요" onClick={() => setIsTeamManageOpen(true)} />
          <ListItem icon={Users} title="팀 만들기" subtitle="팀원들과 현장을 함께 관리해요" onClick={() => setIsCreateTeamOpen(true)} />
          <ListItem icon={KeyRound} title="코드로 참여하기" subtitle="초대 코드를 입력해 팀 가입을 신청해요" onClick={() => setIsJoinTeamOpen(true)} />
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

      {/* 팀 만들기 모달 */}
      <AnimatePresence>
        {isCreateTeamOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4"
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-slate-800 w-full max-w-md rounded-t-[2rem] sm:rounded-3xl p-7 shadow-2xl border-t sm:border border-white/20 dark:border-slate-700"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-extrabold text-gray-900 dark:text-slate-50 tracking-tight">
                  팀 만들기
                </h3>
                <button 
                  onClick={() => setIsCreateTeamOpen(false)}
                  className="p-2 bg-gray-100 dark:bg-slate-700 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex flex-col gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">새 팀 이름</label>
                  <input 
                    type="text"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="팀 이름을 입력하세요"
                    className="w-full px-4 py-3.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-lg text-gray-900 dark:text-white placeholder:text-gray-400 placeholder:font-medium"
                  />
                  <p className="text-xs font-semibold text-gray-500 mt-2 ml-1">무료 플랜은 팀장 포함 최대 3명까지</p>
                </div>

                <button 
                  onClick={() => { Dialog.alert({ title: '안내', message: '팀 만들기 기능은 백엔드 준비 중입니다.' }); setIsCreateTeamOpen(false); }}
                  className="w-full mt-4 bg-blue-600 text-white font-extrabold text-lg py-4 rounded-xl shadow-md hover:bg-blue-700 active:scale-[0.98] transition-all cursor-pointer"
                >
                  만들기
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 팀 가입 신청 모달 */}
      <AnimatePresence>
        {isJoinTeamOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4"
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-slate-800 w-full max-w-md rounded-t-[2rem] sm:rounded-3xl p-7 shadow-2xl border-t sm:border border-white/20 dark:border-slate-700"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-extrabold text-gray-900 dark:text-slate-50 tracking-tight">
                  팀 가입 신청
                </h3>
                <button 
                  onClick={() => setIsJoinTeamOpen(false)}
                  className="p-2 bg-gray-100 dark:bg-slate-700 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex flex-col gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">초대 코드 6자리</label>
                  <input 
                    type="text"
                    maxLength={6}
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="예: A1B2C3"
                    className="w-full px-4 py-3.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-extrabold text-2xl text-center text-gray-900 dark:text-white placeholder:text-gray-300 placeholder:font-medium uppercase tracking-widest"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">한마디 (선택)</label>
                  <input 
                    type="text"
                    value={joinMessage}
                    onChange={(e) => setJoinMessage(e.target.value)}
                    placeholder="팀장에게 남길 메시지"
                    className="w-full px-4 py-3.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-[15px]"
                  />
                </div>

                <button 
                  onClick={() => { Dialog.alert({ title: '안내', message: '팀 가입 신청 기능은 백엔드 준비 중입니다.' }); setIsJoinTeamOpen(false); }}
                  className="w-full mt-4 bg-gray-900 dark:bg-slate-700 text-white font-extrabold text-lg py-4 rounded-xl shadow-md hover:bg-black dark:hover:bg-slate-600 active:scale-[0.98] transition-all cursor-pointer"
                >
                  가입 신청
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 프리미엄 안내 모달 */}
      <AnimatePresence>
        {isPremiumOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4"
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-slate-800 w-full max-w-md rounded-t-[2rem] sm:rounded-3xl p-7 shadow-2xl border-t sm:border border-white/20 dark:border-slate-700"
            >
              <div className="flex flex-col items-center text-center mt-4 mb-6">
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-500 rounded-2xl flex items-center justify-center mb-4">
                  <Sparkles size={32} />
                </div>
                <h3 className="text-2xl font-extrabold text-gray-900 dark:text-slate-50 tracking-tight mb-2">
                  ✨ 프리미엄
                </h3>
                <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">
                  결제 즉시 프리미엄 혜택이 영구적으로 적용되며,<br/>
                  모든 프리미엄 기능을 제한 없이 사용할 수 있습니다.
                </p>
              </div>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => { Dialog.alert({ title: '안내', message: '프리미엄 결제 준비 중입니다.' }); setIsPremiumOpen(false); }}
                  className="w-full bg-amber-500 text-white font-extrabold text-lg py-4 rounded-xl shadow-lg shadow-amber-500/20 hover:bg-amber-600 active:scale-[0.98] transition-all cursor-pointer"
                >
                  프리미엄 시작하기
                </button>
                <button 
                  onClick={() => setIsPremiumOpen(false)}
                  className="w-full bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 font-extrabold text-lg py-4 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 active:scale-[0.98] transition-all cursor-pointer"
                >
                  다음에 할게요
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 고객 지원 모달 */}
      <AnimatePresence>
        {isSupportOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4"
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-slate-800 w-full max-w-md rounded-t-[2rem] sm:rounded-3xl p-7 shadow-2xl border-t sm:border border-white/20 dark:border-slate-700 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-extrabold text-gray-900 dark:text-slate-50 tracking-tight">
                  문의 내역
                </h3>
                <button 
                  onClick={() => setIsSupportOpen(false)}
                  className="p-2 bg-gray-100 dark:bg-slate-700 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex flex-col gap-6">
                <div className="border-b border-gray-100 dark:border-slate-700 pb-6">
                  <h4 className="text-sm font-extrabold text-gray-500 mb-3">새 문의하기</h4>
                  <textarea 
                    value={supportContent}
                    onChange={(e) => setSupportContent(e.target.value)}
                    placeholder="버그나 개선사항을 자유롭게 남겨주세요"
                    className="w-full px-4 py-3.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-[15px] h-32 resize-none mb-3"
                  />
                  <div className="flex gap-2">
                    <button className="flex-1 py-3.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 font-bold rounded-xl hover:bg-gray-200 transition-colors text-sm">
                      사진 첨부
                    </button>
                    <button className="flex-1 py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors text-sm">
                      문의 등록
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-extrabold text-gray-500 mb-3">전체 문의 관리</h4>
                  <div className="flex flex-col items-center justify-center py-10 bg-gray-50 dark:bg-slate-900 rounded-xl">
                    <p className="text-sm font-semibold text-gray-400">등록된 문의 내역이 없습니다.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* 캘린더 구독 모달 */}
      <AnimatePresence>
        {isCalSubOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4"
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-slate-800 w-full max-w-md rounded-t-[2rem] sm:rounded-3xl p-7 shadow-2xl border-t sm:border border-white/20 dark:border-slate-700"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-extrabold text-gray-900 dark:text-slate-50 tracking-tight">
                  캘린더 구독
                </h3>
                <button 
                  onClick={() => setIsCalSubOpen(false)}
                  className="p-2 bg-gray-100 dark:bg-slate-700 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex flex-col gap-6">
                <div>
                  <p className="text-sm font-semibold text-gray-600 dark:text-slate-400 mb-4">
                    구독 링크를 복사하여 구글 캘린더, 애플 캘린더 등 즐겨 쓰는 앱에서 공도리 일정을 확인하세요.
                  </p>
                  <div className="p-4 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden mb-3">
                    <p className="text-xs font-mono text-gray-500 truncate">https://gongdoori.app/cal/sub/a1b2c3d4e5f6</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => { Dialog.alert({ title: '안내', message: '링크가 복사되었습니다.' }) }}
                    className="w-full bg-blue-600 text-white font-extrabold text-lg py-4 rounded-xl shadow-md hover:bg-blue-700 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    링크 복사
                  </button>
                  <button 
                    onClick={() => { Dialog.alert({ title: '안내', message: '링크 재발급 기능 준비 중입니다.' }) }}
                    className="w-full bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 font-extrabold text-lg py-4 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    링크 재발급
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 팀 관리 모달 */}
      <AnimatePresence>
        {isTeamManageOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4"
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-slate-800 w-full max-w-md rounded-t-[2rem] sm:rounded-3xl p-7 shadow-2xl border-t sm:border border-white/20 dark:border-slate-700 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-extrabold text-gray-900 dark:text-slate-50 tracking-tight">
                  팀 관리
                </h3>
                <button 
                  onClick={() => setIsTeamManageOpen(false)}
                  className="p-2 bg-gray-100 dark:bg-slate-700 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex flex-col gap-8">
                {/* 팀 이름 수정 */}
                <div>
                  <h4 className="text-sm font-extrabold text-gray-500 mb-3">팀 이름 수정</h4>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="새 팀 이름"
                      className="flex-1 px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm text-gray-900 dark:text-white"
                    />
                    <button className="px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors text-sm whitespace-nowrap">
                      변경하기
                    </button>
                  </div>
                </div>

                {/* 가입 신청 관리 */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-extrabold text-gray-500">가입 신청 관리</h4>
                    <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-[10px] font-black">1건</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-700">
                    <div>
                      <p className="font-bold text-sm text-gray-900 dark:text-white">김목수</p>
                      <p className="text-xs text-gray-500 mt-0.5">"잘 부탁드립니다!"</p>
                    </div>
                    <div className="flex gap-1.5">
                      <button className="px-3 py-1.5 bg-blue-100 text-blue-600 font-bold rounded-lg text-xs">수락</button>
                      <button className="px-3 py-1.5 bg-gray-200 text-gray-600 font-bold rounded-lg text-xs">거절</button>
                    </div>
                  </div>
                </div>

                {/* 팀원 목록 */}
                <div>
                  <h4 className="text-sm font-extrabold text-gray-500 mb-3">팀원 목록</h4>
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">나</div>
                        <span className="font-bold text-sm text-gray-900 dark:text-white">전종욱 (팀장)</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center font-bold text-sm">이</div>
                        <span className="font-bold text-sm text-gray-900 dark:text-white">이반장 (팀원)</span>
                      </div>
                      <button className="text-xs font-bold text-red-500 px-2 py-1 bg-red-50 rounded-lg">추방</button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
