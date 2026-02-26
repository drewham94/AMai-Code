import React, { useState } from 'react';
import { UserProfile, Language, SkillLevel, PracticeFlavor } from '../types';
import { LANGUAGES, SKILL_LEVELS, PRACTICE_FLAVORS, ACCENTS, TTS_VOICES, ENGLISH_ACCENTS, REGIONAL_NAMES } from '../constants';
import { ChevronRight, Globe, Target, BookOpen, Mic2, Volume2, Languages, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { generateSpeech } from '../services/geminiService';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    name: '',
    targetLanguage: 'French',
    targetAccent: ACCENTS.French[0].id,
    skillLevel: 'Beginner',
    preferredFlavor: 'Casual',
    dailyGoal: 15,
    preferredVoice: 'Kore',
    assistantLanguage: 'Target',
    assistantEnglishAccent: 'American',
    isLiveAssistantEnabled: true
  });
  const [isPlayingSample, setIsPlayingSample] = useState<string | null>(null);

  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => s - 1);

  const getVoiceName = (voiceId: string, accentId: string) => {
    const regionalNames = REGIONAL_NAMES[accentId];
    if (!regionalNames) return voiceId;
    
    const voiceIndex = TTS_VOICES.findIndex(v => v.id === voiceId);
    return regionalNames[voiceIndex] || voiceId;
  };

  const playAudio = async (base64: string) => {
    if (!base64) return null;
    try {
      const binaryString = window.atob(base64.trim());
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const buffer = new ArrayBuffer(44 + bytes.length);
      const view = new DataView(buffer);
      view.setUint32(0, 0x52494646, false);
      view.setUint32(4, 36 + bytes.length, true);
      view.setUint32(8, 0x57415645, false);
      view.setUint32(12, 0x666d7420, false);
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, 1, true);
      view.setUint32(24, 24000, true);
      view.setUint32(28, 24000 * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      view.setUint32(36, 0x64617461, false);
      view.setUint32(40, bytes.length, true);
      for (let i = 0; i < bytes.length; i++) {
        view.setUint8(44 + i, bytes[i]);
      }
      const blob = new Blob([buffer], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      return new Audio(url);
    } catch (err) {
      console.error("Audio playback setup failed", err);
      return null;
    }
  };

  const handleVoiceSelect = async (voiceId: string) => {
    setProfile({ ...profile, preferredVoice: voiceId });
    setIsPlayingSample(voiceId);
    
    try {
      const voiceName = getVoiceName(voiceId, profile.targetAccent || '');
      const language = profile.targetLanguage as Language;
      const sampleText = language === 'French' 
        ? `Bonjour, je m'appelle ${voiceName}.` 
        : `Hola, me llamo ${voiceName}.`;
        
      const accent = ACCENTS[language].find(a => a.id === profile.targetAccent);
      
      const base64 = await generateSpeech(sampleText, voiceId, accent?.name);
      const audio = await playAudio(base64);
      if (audio) {
        audio.onended = () => setIsPlayingSample(null);
        await audio.play();
      } else {
        setIsPlayingSample(null);
      }
    } catch (err) {
      console.error("Failed to play voice sample", err);
      setIsPlayingSample(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-10 border border-slate-100"
      >
        {step === 1 && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight text-slate-900">Welcome!</h1>
              <p className="text-slate-500 text-lg">Let's start your journey to a perfect accent.</p>
            </div>
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-slate-700 uppercase tracking-wider">What's your name?</label>
              <input
                type="text"
                value={profile.name}
                onChange={e => setProfile({ ...profile, name: e.target.value })}
                placeholder="Enter your name"
                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all text-lg"
              />
            </div>
            <button
              disabled={!profile.name}
              onClick={next}
              className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              Get Started <ChevronRight size={20} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8">
            <div className="space-y-2">
              <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 mb-4">
                <Globe size={24} />
              </div>
              <h2 className="text-3xl font-bold text-slate-900">Choose Language</h2>
              <p className="text-slate-500">Which language are you mastering?</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {LANGUAGES.map(lang => (
                <button
                  key={lang}
                  onClick={() => setProfile({ ...profile, targetLanguage: lang, targetAccent: ACCENTS[lang][0].id })}
                  className={`p-6 rounded-2xl border-2 text-left transition-all ${
                    profile.targetLanguage === lang 
                      ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600' 
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <span className="text-xl font-bold text-slate-800">{lang}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={back}
                className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-2xl font-bold text-lg hover:bg-slate-200 transition-all"
              >
                Back
              </button>
              <button
                onClick={next}
                className="flex-[2] py-5 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
              >
                Continue <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8">
            <div className="space-y-2">
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mb-4">
                <Target size={24} />
              </div>
              <h2 className="text-3xl font-bold text-slate-900">Target Accent</h2>
              <p className="text-slate-500">Pick the specific regional accent you want.</p>
            </div>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {ACCENTS[profile.targetLanguage as Language].map(accent => (
                <button
                  key={accent.id}
                  onClick={() => setProfile({ ...profile, targetAccent: accent.id })}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                    profile.targetAccent === accent.id 
                      ? 'border-indigo-600 bg-indigo-50/50' 
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="font-bold text-slate-800">{accent.name}</div>
                  <div className="text-sm text-slate-500">{accent.region}</div>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={back}
                className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-2xl font-bold text-lg hover:bg-slate-200 transition-all"
              >
                Back
              </button>
              <button
                onClick={next}
                className="flex-[2] py-5 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
              >
                Continue <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-8">
            <div className="space-y-2">
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 mb-4">
                <Volume2 size={24} />
              </div>
              <h2 className="text-3xl font-bold text-slate-900">Choose a Voice</h2>
              <p className="text-slate-500">Select the AI voice for practice passages.</p>
            </div>
            <div className="space-y-3">
              {TTS_VOICES.map(voice => (
                <button
                  key={voice.id}
                  onClick={() => handleVoiceSelect(voice.id)}
                  disabled={isPlayingSample !== null}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                    profile.preferredVoice === voice.id 
                      ? 'border-indigo-600 bg-indigo-50/50' 
                      : 'border-slate-100 hover:border-slate-200'
                  } ${isPlayingSample !== null && isPlayingSample !== voice.id ? 'opacity-50' : ''}`}
                >
                  <div className="font-bold text-slate-800">{getVoiceName(voice.id, profile.targetAccent || '')}</div>
                  {isPlayingSample === voice.id ? (
                    <Loader2 size={16} className="animate-spin text-indigo-600" />
                  ) : (
                    <Volume2 size={16} className={profile.preferredVoice === voice.id ? 'text-indigo-600' : 'text-slate-300'} />
                  )}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={back}
                className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-2xl font-bold text-lg hover:bg-slate-200 transition-all"
              >
                Back
              </button>
              <button
                onClick={next}
                className="flex-[2] py-5 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
              >
                Continue <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-8">
            <div className="space-y-2">
              <div className="w-12 h-12 bg-violet-100 rounded-2xl flex items-center justify-center text-violet-600 mb-4">
                <Mic2 size={24} />
              </div>
              <h2 className="text-3xl font-bold text-slate-900">AI Assistant</h2>
              <p className="text-slate-500">Configure your personal accent tutor.</p>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <span className="font-bold text-slate-700">Enable Live Assistant</span>
                <button
                  onClick={() => setProfile({ ...profile, isLiveAssistantEnabled: !profile.isLiveAssistantEnabled })}
                  className={`w-12 h-6 rounded-full transition-colors relative ${profile.isLiveAssistantEnabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${profile.isLiveAssistantEnabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              {profile.isLiveAssistantEnabled && (
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-slate-700 uppercase tracking-wider">Assistant Language</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setProfile({ ...profile, assistantLanguage: 'Target' })}
                      className={`p-4 rounded-2xl border-2 text-center transition-all ${
                        profile.assistantLanguage === 'Target' 
                          ? 'border-indigo-600 bg-indigo-50/50' 
                          : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <span className="font-bold text-slate-800">{profile.targetLanguage}</span>
                    </button>
                    <button
                      onClick={() => setProfile({ ...profile, assistantLanguage: 'English' })}
                      className={`p-4 rounded-2xl border-2 text-center transition-all ${
                        profile.assistantLanguage === 'English' 
                          ? 'border-indigo-600 bg-indigo-50/50' 
                          : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <span className="font-bold text-slate-800">English</span>
                    </button>
                  </div>

                  {profile.assistantLanguage === 'English' && (
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-slate-700 uppercase tracking-wider">English Accent</label>
                      <select
                        value={profile.assistantEnglishAccent}
                        onChange={e => setProfile({ ...profile, assistantEnglishAccent: e.target.value })}
                        className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500"
                      >
                        {ENGLISH_ACCENTS.map(acc => (
                          <option key={acc} value={acc}>{acc}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={back}
                className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-2xl font-bold text-lg hover:bg-slate-200 transition-all"
              >
                Back
              </button>
              <button
                onClick={next}
                className="flex-[2] py-5 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
              >
                Continue <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-8">
            <div className="space-y-2">
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 mb-4">
                <BookOpen size={24} />
              </div>
              <h2 className="text-3xl font-bold text-slate-900">Your Level</h2>
              <p className="text-slate-500">Be honest! This helps us tailor prompts.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {SKILL_LEVELS.map(level => (
                <button
                  key={level}
                  onClick={() => setProfile({ ...profile, skillLevel: level })}
                  className={`p-4 rounded-2xl border-2 text-center transition-all ${
                    profile.skillLevel === level 
                      ? 'border-indigo-600 bg-indigo-50/50' 
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <span className="font-bold text-slate-800">{level}</span>
                </button>
              ))}
            </div>
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-slate-700 uppercase tracking-wider">Practice Flavor</label>
              <div className="grid grid-cols-2 gap-3">
                {PRACTICE_FLAVORS.map(flavor => (
                  <button
                    key={flavor}
                    onClick={() => setProfile({ ...profile, preferredFlavor: flavor })}
                    className={`p-4 rounded-2xl border-2 text-center transition-all ${
                      profile.preferredFlavor === flavor 
                        ? 'border-indigo-600 bg-indigo-50/50' 
                        : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <span className="font-bold text-slate-800">{flavor}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={back}
                className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-2xl font-bold text-lg hover:bg-slate-200 transition-all"
              >
                Back
              </button>
              <button
                onClick={() => onComplete(profile as UserProfile)}
                className="flex-[2] py-5 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
              >
                Complete Setup <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
