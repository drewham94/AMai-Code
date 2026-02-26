import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, RotateCcw, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RecorderProps {
  onRecordingComplete: (base64Audio: string, mimeType: string) => void;
  isAnalyzing: boolean;
}

export const Recorder: React.FC<RecorderProps> = ({ onRecordingComplete, isAnalyzing }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(',')[1];
          onRecordingComplete(base64String, mimeType);
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
      timerRef.current = window.setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access denied or not available.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const reset = () => {
    setAudioUrl(null);
    setDuration(0);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-6 p-8 bg-white rounded-3xl shadow-xl border border-black/5">
      <div className="relative">
        <AnimatePresence mode="wait">
          {isRecording && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 0.2 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="absolute inset-0 bg-red-500 rounded-full"
            />
          )}
        </AnimatePresence>
        
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isAnalyzing}
          className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all ${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
        >
          {isRecording ? <Square size={32} fill="currentColor" /> : <Mic size={32} />}
        </button>
      </div>

      <div className="text-center">
        <p className="text-2xl font-mono font-medium text-slate-800">
          {Math.floor(duration / 60).toString().padStart(2, '0')}:
          {(duration % 60).toString().padStart(2, '0')}
        </p>
        <p className="text-sm text-slate-500 mt-1">
          {isRecording ? "Recording..." : audioUrl ? "Recording complete" : "Tap to record (<60s)"}
        </p>
      </div>

      {audioUrl && !isRecording && (
        <div className="flex gap-4 w-full">
          <button
            onClick={() => new Audio(audioUrl).play()}
            className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center gap-2 text-slate-700 font-medium transition-colors"
          >
            <Play size={18} /> Playback
          </button>
          <button
            onClick={reset}
            className="flex-1 py-3 px-4 border border-slate-200 hover:bg-slate-50 rounded-xl flex items-center justify-center gap-2 text-slate-600 font-medium transition-colors"
          >
            <RotateCcw size={18} /> Retake
          </button>
        </div>
      )}

      {isAnalyzing && (
        <div className="flex items-center gap-3 text-indigo-600 font-medium animate-pulse">
          <Loader2 className="animate-spin" size={20} />
          Analyzing your accent...
        </div>
      )}
    </div>
  );
};
