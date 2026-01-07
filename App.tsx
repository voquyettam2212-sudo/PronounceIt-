import React, { useState, useRef, useEffect } from 'react';
import { AppState, PronunciationAnalysis, UserStats, BADGES } from './types';
import { MicButton } from './components/MicButton';
import { AnalysisDisplay } from './components/AnalysisDisplay';
import { analyzeSpeech } from './services/geminiService';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [analysis, setAnalysis] = useState<PronunciationAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userStats, setUserStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('pronounce_stats');
    return saved ? JSON.parse(saved) : { xp: 0, level: 1, totalPractices: 0, badges: [] };
  });

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    localStorage.setItem('pronounce_stats', JSON.stringify(userStats));
  }, [userStats]);

  const startPractice = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        throw new Error("Speech recognition not supported in this browser.");
      }
      
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript + ' ';
          }
        }
        if (final) setLiveTranscript(prev => (prev + ' ' + final).trim());
      };

      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          await processAnalysis(base64Audio);
        };
        reader.readAsDataURL(audioBlob);
      };

      setAppState(AppState.RECORDING);
      setLiveTranscript('');
      setAnalysis(null);
      setError(null);
      
      recognitionRef.current.start();
      mediaRecorderRef.current.start();
    } catch (err: any) {
      console.error(err);
      setError("Không thể truy cập Microphone. Vui lòng kiểm tra quyền cài đặt!");
    }
  };

  const stopPractice = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
    setAppState(AppState.ANALYZING);
  };

  const processAnalysis = async (audioBase64: string) => {
    try {
      const result = await analyzeSpeech(audioBase64, liveTranscript);
      setAnalysis(result);
      
      // Update Stats
      setUserStats(prev => {
        const newXp = prev.xp + result.overallScore;
        const newLevel = Math.floor(newXp / 100) + 1;
        const newPractices = prev.totalPractices + 1;
        const newBadges = [...prev.badges];
        
        // Badge Logic
        if (newPractices === 1 && !newBadges.find(b => b.id === 'first_step')) {
          newBadges.push(BADGES.find(b => b.id === 'first_step')!);
        }
        if (result.overallScore >= 80 && !newBadges.find(b => b.id === 'perfect_80')) {
          newBadges.push(BADGES.find(b => b.id === 'perfect_80')!);
        }
        if (result.grammarErrors.length === 0 && !newBadges.find(b => b.id === 'grammar_god')) {
          newBadges.push(BADGES.find(b => b.id === 'grammar_god')!);
        }
        if (newPractices >= 3 && !newBadges.find(b => b.id === 'streak_3')) {
          newBadges.push(BADGES.find(b => b.id === 'streak_3')!);
        }

        return {
          xp: newXp,
          level: newLevel,
          totalPractices: newPractices,
          badges: newBadges
        };
      });

      setAppState(AppState.RESULT);
    } catch (err: any) {
      console.error(err);
      setError("AI đang bận một chút, bạn thử lại nhé! 🙏");
      setAppState(AppState.IDLE);
    }
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
      {/* Colorful Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-[120px]" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-pink-100/50 rounded-full blur-[120px]" />
         <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-yellow-100/50 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-50 border-b-2 border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-[1.2rem] flex items-center justify-center text-white shadow-xl rotate-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 leading-tight">Pronounce<span className="text-indigo-600 italic underline decoration-pink-400 decoration-4">It!</span></h1>
            <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Your AI Bestie</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="hidden sm:flex flex-col items-end">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">LVL {userStats.level}</span>
             <span className="text-sm font-black text-indigo-600">{userStats.xp} XP</span>
           </div>
           <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 shadow-lg flex items-center justify-center text-white font-black text-xs ring-4 ring-white">
              {userStats.level}
           </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 flex flex-col items-center">
        
        {appState === AppState.IDLE && (
          <div className="text-center space-y-10 py-10 animate-in fade-in zoom-in duration-700">
            <div className="float-animation inline-block mb-4">
               <div className="bg-white p-4 rounded-[2.5rem] shadow-2xl border-4 border-indigo-100">
                  <span className="text-6xl">✨</span>
               </div>
            </div>
            <h2 className="text-5xl md:text-7xl font-black text-slate-800 leading-[1.1]">
              Ready to <br/>
              <span className="gradient-text">Speak Like a Pro?</span>
            </h2>
            <p className="text-xl text-slate-600 font-bold max-w-xl mx-auto leading-relaxed">
              Hãy nói bất kỳ câu tiếng Anh nào bạn muốn. <br/>
              AI sẽ giúp bạn sửa phát âm và ngữ pháp ngay lập tức!
            </p>
            <div className="pt-8">
              <MicButton isRecording={false} onClick={startPractice} />
            </div>
          </div>
        )}

        {appState === AppState.RECORDING && (
          <div className="w-full flex flex-col items-center space-y-12 py-20 animate-in fade-in slide-in-from-top duration-500">
            <MicButton isRecording={true} onClick={stopPractice} />
            
            <div className="w-full max-w-2xl bg-white p-12 rounded-[3rem] shadow-2xl border-4 border-dashed border-pink-200 flex flex-col items-center justify-center gap-6 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-400 via-rose-500 to-pink-400 animate-pulse" />
               <p className="text-3xl font-black text-slate-700 text-center leading-relaxed">
                 Đang lắng nghe... 🎧
               </p>
               <p className="text-slate-400 font-bold">Hãy cứ tự tin nói nhé, AI không hiện chữ lúc này đâu!</p>
            </div>
          </div>
        )}

        {appState === AppState.ANALYZING && (
          <div className="flex flex-col items-center space-y-10 py-28 animate-in fade-in duration-500">
            <div className="relative">
              <div className="w-32 h-32 border-[12px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl animate-bounce">🧠</span>
              </div>
            </div>
            <div className="text-center space-y-3">
              <h3 className="text-3xl font-black text-slate-800">AI đang "soi" tiếng Anh của bạn...</h3>
              <p className="text-slate-500 text-xl font-bold">Chờ xíu nhé, kết quả sẽ rất bất ngờ! 🎁</p>
            </div>
          </div>
        )}

        {appState === AppState.RESULT && analysis && (
          <div className="w-full space-y-12">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <h2 className="text-4xl font-black text-slate-800">Kết Quả Luyện Tập ✨</h2>
              <button 
                onClick={startPractice}
                className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-black text-xl rounded-[2rem] shadow-xl hover:shadow-indigo-200 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                Thử lại nào! 🚀
              </button>
            </div>
            <AnalysisDisplay analysis={analysis} userStats={userStats} />
          </div>
        )}

        {error && (
          <div className="mt-12 p-6 bg-rose-50 text-rose-600 rounded-[2rem] font-black text-lg border-4 border-rose-100 flex items-center gap-4 animate-bounce">
            <span className="text-3xl">⚠️</span>
            {error}
          </div>
        )}
      </main>

      {/* Footer Decoration */}
      <footer className="py-12 text-center text-slate-400 font-black text-xs tracking-[0.3em] uppercase opacity-50">
        Proudly Built with ❤️ and Gemini AI
      </footer>
    </div>
  );
};

export default App;