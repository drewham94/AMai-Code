import React, { useState } from 'react';
import { Accent, Language, SkillLevel, UserProfile } from '../types';
import { ACCENTS, LANGUAGES, SKILL_LEVELS } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (profile: UserProfile) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [targetLanguage, setTargetLanguage] = useState<Language>('French');
  const [targetAccent, setTargetAccent] = useState('');
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('Beginner');
  const [error, setError] = useState('');

  // Initialize targetAccent when targetLanguage changes
  React.useEffect(() => {
    if (targetLanguage && ACCENTS[targetLanguage].length > 0) {
      setTargetAccent(ACCENTS[targetLanguage][0].id);
    }
  }, [targetLanguage]);

  const handleEmailSubmit = async () => {
    setError('');
    if (!email) {
      setError('Email is required.');
      return;
    }

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Login failed');
      }

      const data = await response.json();
      if (data.profile) {
        // User exists, log them in directly
        onLoginSuccess(data.profile);
      } else {
        // New user, proceed to profile setup
        setStep(1);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    }
  };

  const handleProfileSetup = async () => {
    setError('');
    if (!name || !targetLanguage || !targetAccent || !skillLevel) {
      setError('All fields are required.');
      return;
    }

    const newProfile: UserProfile = {
      name,
      targetLanguage,
      targetAccent,
      skillLevel,
      preferredFlavor: 'Conversational', // Default
      dailyGoal: 15, // Default
      preferredVoice: 'Kore', // Default
      assistantLanguage: 'Target', // Default
      assistantEnglishAccent: 'American', // Default
      isLiveAssistantEnabled: false, // Default
      email, // Set email for new profile
    };

    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProfile),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Profile setup failed');
      }

      onLoginSuccess(newProfile);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <motion.div
            key="step0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <h2 className="text-3xl font-bold text-slate-900">Welcome to AccentMaster AI</h2>
            <p className="text-slate-600">Enter your email to get started or log in.</p>
            <input
              type="email"
              placeholder="Your Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 rounded-xl border border-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button
              onClick={handleEmailSubmit}
              className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors"
            >
              Continue <ChevronRight size={20} />
            </button>
          </motion.div>
        );
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <h2 className="text-3xl font-bold text-slate-900">Tell us about yourself</h2>
            <input
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-4 rounded-xl border border-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
            />

            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">Target Language</label>
              <div className="grid grid-cols-2 gap-2">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setTargetLanguage(lang)}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${targetLanguage === lang ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100'}`}
                  >
                    <span className="font-bold text-slate-800">{lang}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">Target Accent</label>
              <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                {ACCENTS[targetLanguage]?.map((accent) => (
                  <button
                    key={accent.id}
                    onClick={() => setTargetAccent(accent.id)}
                    className={`w-full p-3 rounded-xl border-2 text-left transition-all ${targetAccent === accent.id ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100'}`}
                  >
                    <div className="font-bold text-slate-800 text-sm">{accent.name}</div>
                    <div className="text-xs text-slate-500">{accent.region}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">Skill Level</label>
              <div className="grid grid-cols-2 gap-2">
                {SKILL_LEVELS.map((level) => (
                  <button
                    key={level}
                    onClick={() => setSkillLevel(level)}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${skillLevel === level ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100'}`}
                  >
                    <span className="font-bold text-slate-800 text-sm">{level}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleProfileSetup}
              className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors"
            >
              Start Learning <ChevronRight size={20} />
            </button>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 max-w-md w-full text-center space-y-8">
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>
        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
      </div>
    </div>
  );
};
