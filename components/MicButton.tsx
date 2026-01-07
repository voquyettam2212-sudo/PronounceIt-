import React from 'react';

interface MicButtonProps {
  isRecording: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export const MicButton: React.FC<MicButtonProps> = ({ isRecording, onClick, disabled }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="relative">
        {isRecording && (
          <div className="absolute inset-0 -m-4 rounded-full bg-pink-400 opacity-30 ring-animation" />
        )}
        <button
          onClick={onClick}
          disabled={disabled}
          className={`
            relative z-10 w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300
            shadow-2xl hover:scale-110 active:scale-90 disabled:opacity-50
            ${isRecording 
              ? 'bg-gradient-to-br from-pink-500 to-rose-600 pulse-animation shadow-pink-200' 
              : 'bg-gradient-to-br from-indigo-500 to-blue-600 hover:shadow-indigo-200'
            }
          `}
        >
          {isRecording ? (
            <div className="flex items-center gap-1">
              <span className="w-2 h-8 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-2 h-12 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-2 h-8 bg-white rounded-full animate-bounce"></span>
            </div>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
        </button>
      </div>
      <p className={`mt-8 text-xl font-black tracking-wide ${isRecording ? 'text-pink-600' : 'text-indigo-600'}`}>
        {isRecording ? 'Dừng để xem kết quả 🛑' : 'Nhấn để bắt đầu luyện tập! 🎙️'}
      </p>
    </div>
  );
};