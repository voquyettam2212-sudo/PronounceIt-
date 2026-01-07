import React, { useState, useEffect } from 'react';
import { PronunciationAnalysis, AnalyzedWord, GrammarError, UserStats, LEVELS, BADGES } from '../types';
import { speakWord } from '../services/geminiService';

interface AnalysisDisplayProps {
  analysis: PronunciationAnalysis;
  userStats: UserStats;
}

export const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ analysis, userStats }) => {
  const [activeError, setActiveError] = useState<GrammarError | null>(null);

  useEffect(() => {
    if (analysis.overallScore >= 80) {
      // Trigger global confetti if score is high
      (window as any).confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#ec4899', '#f59e0b', '#10b981']
      });
    }
  }, [analysis.overallScore]);

  const getWordStyle = (word: AnalyzedWord) => {
    if (word.status === 'mispronounced') return 'text-rose-600 border-b-4 border-rose-300 cursor-pointer hover:bg-rose-50 transition-colors px-1 rounded-lg';
    return 'text-emerald-600 px-1';
  };

  const handleWordClick = (word: AnalyzedWord) => {
    if (word.status === 'mispronounced') {
      speakWord(word.text);
    }
  };

  const isPhraseInGrammarError = (wordText: string) => {
    return analysis.grammarErrors.some(err => err.phrase.toLowerCase().includes(wordText.toLowerCase()));
  };

  const currentLevel = LEVELS.find((l, i) => {
    const next = LEVELS[i + 1];
    return userStats.xp >= l.minXp && (!next || userStats.xp < next.minXp);
  }) || LEVELS[0];

  return (
    <div className="w-full space-y-10 animate-in fade-in slide-in-from-bottom duration-700">
      {/* Gamified Header / Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-[2rem] shadow-xl border-t-8 border-indigo-400">
           <div className="flex items-center justify-between mb-4">
             <div>
                <p className="text-slate-400 font-black text-xs uppercase">Your Progress</p>
                <h3 className="text-2xl font-black text-slate-800">{currentLevel.name}</h3>
             </div>
             <div className="bg-indigo-100 px-4 py-1 rounded-full text-indigo-600 font-black text-sm">
                Lvl {userStats.level}
             </div>
           </div>
           <div className="h-6 w-full bg-slate-100 rounded-full overflow-hidden relative">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-1000"
                style={{ width: `${Math.min(100, (userStats.xp % 100))}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-slate-600">
                {userStats.xp % 100} / 100 XP TO NEXT LEVEL
              </span>
           </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-xl border-t-8 border-rose-400 flex flex-col items-center justify-center text-center">
          <p className="text-slate-400 font-black text-xs uppercase mb-1">Accuracy</p>
          <div className="text-5xl font-black text-rose-600 mb-2">{analysis.overallScore}%</div>
          <p className="text-slate-600 font-bold italic">"{analysis.summaryVi}"</p>
        </div>
      </div>

      {/* Transcript Card */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border-t-8 border-blue-400 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
            <svg className="w-24 h-24 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21L14.017 18C14.017 16.8954 13.1216 16 12.017 16H9.01703V14H12.017C14.2262 14 16.017 12.2091 16.017 10V7C16.017 5.89543 15.1216 5 14.017 5H5.01703C3.91246 5 3.01703 5.89543 3.01703 7V16C3.01703 17.1046 3.91246 18 5.01703 18H8.01703V21H14.017Z"/></svg>
        </div>
        <h3 className="text-blue-600 font-black text-xl uppercase mb-8 flex items-center gap-2">
          <span>Your Speech</span>
          <span className="text-sm bg-blue-100 px-3 py-1 rounded-full lowercase">click words for help</span>
        </h3>
        <div className="flex flex-wrap gap-x-2 gap-y-4 text-3xl font-black leading-normal">
          {analysis.words.map((word, idx) => {
            const hasGrammarErr = isPhraseInGrammarError(word.text);
            return (
              <span 
                key={idx} 
                onClick={() => handleWordClick(word)}
                className={`
                  ${getWordStyle(word)} 
                  ${hasGrammarErr ? 'bg-amber-100 rounded-lg px-2 border-b-4 border-amber-300 cursor-help' : ''}
                  transition-all transform hover:scale-105
                `}
              >
                {word.text}
              </span>
            );
          })}
        </div>
      </div>

      {/* Badges Section */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border-t-8 border-emerald-400">
        <h3 className="text-emerald-600 font-black text-xl uppercase mb-6">Your Trophies</h3>
        <div className="flex flex-wrap gap-6">
          {BADGES.map(badge => {
            const isUnlocked = userStats.badges.some(b => b.id === badge.id);
            return (
              <div key={badge.id} className={`flex flex-col items-center gap-2 group ${isUnlocked ? 'opacity-100' : 'opacity-20 grayscale'}`}>
                 <div className={`w-16 h-16 rounded-full ${badge.color} flex items-center justify-center text-3xl shadow-inner transition-transform group-hover:scale-110`}>
                    {badge.icon}
                 </div>
                 <span className="text-xs font-black text-slate-700">{badge.name}</span>
                 {!isUnlocked && <div className="hidden group-hover:block absolute bg-slate-800 text-white p-2 rounded text-[10px] w-32 text-center -mt-20">{badge.requirement}</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Grammar Corrections */}
      {analysis.grammarErrors.length > 0 && (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border-t-8 border-amber-400">
          <h3 className="text-amber-600 font-black text-xl uppercase mb-8">Language Lab 🧪</h3>
          <div className="grid grid-cols-1 gap-6">
            {analysis.grammarErrors.map((err, idx) => (
              <div 
                key={idx} 
                className="p-6 bg-slate-50 rounded-[2rem] border-2 border-slate-100 hover:border-amber-300 transition-all cursor-pointer group"
                onClick={() => setActiveError(activeError === err ? null : err)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="line-through text-slate-400 text-xl font-bold">{err.phrase}</span>
                    <span className="text-amber-500 text-2xl font-black">→</span>
                    <span className="text-emerald-600 font-black text-2xl">{err.correction}</span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); speakWord(err.correction, 'Puck'); }} className="p-4 bg-white rounded-full shadow-lg hover:shadow-xl text-indigo-500 hover:scale-110 active:scale-95 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                  </button>
                </div>
                
                <div className={`mt-6 space-y-4 overflow-hidden transition-all duration-500 ${activeError === err ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="p-5 bg-white rounded-2xl border-2 border-amber-100 shadow-sm">
                    <p className="text-amber-700 font-black mb-2 flex items-center gap-2">
                       <span className="text-xl">💡</span> Giải thích:
                    </p>
                    <p className="text-slate-700 font-bold leading-relaxed">{err.explanationVi}</p>
                  </div>
                  <div className="p-5 bg-emerald-50 rounded-2xl">
                    <p className="text-emerald-800 font-black mb-2 flex items-center gap-2">
                       <span className="text-xl">✨</span> Cách dùng khác:
                    </p>
                    <ul className="space-y-2">
                      {err.examples.map((ex, i) => (
                        <li key={i} className="text-emerald-700 font-bold flex items-start gap-2">
                           <span className="mt-1 text-xs">●</span> {ex}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};