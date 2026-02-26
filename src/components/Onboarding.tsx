import React, { useState } from 'react';
import { UserProfile, Language, SkillLevel, PracticeFlavor } from '../types';
import { LANGUAGES, SKILL_LEVELS, PRACTICE_FLAVORS, ACCENTS, TTS_VOICES, ENGLISH_ACCENTS } from '../constants';
import { ChevronRight, Globe, Target, BookOpen, Mic2, Volume2, Languages } from 'lucide-react';
import { motion } from 'motion/react';

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

  const next = () => setStep(s => s + 1);

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
            <button
              onClick={next}
              className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
            >
              Continue <ChevronRight size={20} />
            </button>
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
            <button
              onClick={next}
              className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
            >
              Continue <ChevronRight size={20} />
            </button>
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
                  onClick={() => setProfile({ ...profile, preferredVoice: voice.id })}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                    profile.preferredVoice === voice.id 
                      ? 'border-indigo-600 bg-indigo-50/50' 
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="font-bold text-slate-800">{voice.name}</div>
                </button>
              ))}
            </div>
            <button
              onClick={next}
              className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
            >
              Continue <ChevronRight size={20} />
            </button>
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

            <button
              onClick={next}
              className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
            >
              Continue <ChevronRight size={20} />
            </button>
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
            <button
              onClick={() => onComplete(profile as UserProfile)}
              className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
            >
              Complete Setup <ChevronRight size={20} />
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
