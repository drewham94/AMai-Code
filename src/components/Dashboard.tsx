import React, { useState, useEffect } from 'react';
import { UserProfile, PracticeSession, PracticeMode, SavedPassage, PracticeFlavor, SlangTerm, PracticePrompt, Language, Flashcard, FocusSession } from '../types';
import { ACCENTS, TONGUE_TWISTERS, TTS_VOICES, ENGLISH_ACCENTS, LANGUAGES, PRACTICE_FLAVORS, SKILL_LEVELS, REGIONAL_NAMES, QUICK_CONTEXTS } from '../constants';
import { Recorder } from './Recorder';
import { generatePracticePrompt, analyzeSpeech, generateSpeech, generateAssistantResponse, generateSlangPrompt, translateDefinition } from '../services/geminiService';
import { 
  TrendingUp, 
  Award, 
  Calendar, 
  PlayCircle, 
  BookOpen, 
  ChevronLeft, 
  CheckCircle2, 
  AlertCircle,
  BarChart3,
  History,
  Volume2,
  Mic2,
  Settings,
  Loader2,
  RefreshCw,
  Zap,
  Library,
  Plus,
  Rotate3d,
  Languages as LanguagesIcon,
  ThumbsUp,
  ThumbsDown,
  Trophy,
  Timer,
  Target,
  Focus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  profile: UserProfile;
  sessions: PracticeSession[];
  flashcards: Flashcard[];
  focusSessions: FocusSession[];
  onNewSession: (session: PracticeSession) => void;
  onAddFlashcard: (card: Flashcard) => void;
  onUpdateFlashcards: (cards: Flashcard[]) => void;
  onAddFocusSession: (session: FocusSession) => void;
}

const LoadingPrompt = () => (
  <div className="flex flex-col items-center justify-center py-12 space-y-6 w-full">
    <div className="flex gap-3">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{ 
            y: [0, -15, 0],
            opacity: [0.5, 1, 0.5],
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 0.8, 
            delay: i * 0.15,
            ease: "easeInOut" 
          }}
          className="w-4 h-4 bg-indigo-600 rounded-full shadow-lg shadow-indigo-200"
        />
      ))}
    </div>
    <div className="space-y-2 text-center">
      <p className="text-sm font-black text-indigo-600 uppercase tracking-[0.2em] animate-pulse">
        Generating Challenge
      </p>
      <p className="text-xs text-slate-400 font-medium">Gemini is crafting a custom prompt for you...</p>
    </div>
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ profile, sessions, flashcards, focusSessions, onNewSession, onAddFlashcard, onUpdateFlashcards, onAddFocusSession }) => {
  const [view, setView] = useState<'home' | 'practice' | 'reports' | 'history' | 'slang_bank' | 'flashcards'>('home');
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('Read');
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [currentPromptData, setCurrentPromptData] = useState<PracticePrompt | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [selectedWord, setSelectedWord] = useState<{ word: string; definition: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPlayingPrompt, setIsPlayingPrompt] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [lastFeedback, setLastFeedback] = useState<PracticeSession | null>(null);
  const [localProfile, setLocalProfile] = useState(profile);
  const [stagedProfile, setStagedProfile] = useState(profile);
  const [savedPassages, setSavedPassages] = useState<SavedPassage[]>([]);
  const [slangBank, setSlangBank] = useState<SlangTerm[]>([]);
  const [selectedFlavor, setSelectedFlavor] = useState<PracticeFlavor>(localProfile.preferredFlavor);
  const [currentSlangTerms, setCurrentSlangTerms] = useState<{ term: string; meaning: string }[]>([]);
  const [passageContext, setPassageContext] = useState('');
  const [isFlipped, setIsFlipped] = useState<Record<string, boolean>>({});
  const [showTargetDefinition, setShowTargetDefinition] = useState<Record<string, boolean>>({});
  const [isAddingFlashcard, setIsAddingFlashcard] = useState(false);
  const [newFlashcard, setNewFlashcard] = useState({ word: '', definitionEn: '', wordType: 'noun' });
  const [flashcardFilter, setFlashcardFilter] = useState<string>('All');
  const [flashcardSort, setFlashcardSort] = useState<'date' | 'practice' | 'alphabetical'>('date');
  const [showFlashcardStats, setShowFlashcardStats] = useState(false);
  const [flashcardSubView, setFlashcardSubView] = useState<'library' | 'study'>('library');
  const [studySession, setStudySession] = useState<{
    cards: Flashcard[];
    currentIndex: number;
    maxCards: number;
    isComplete: boolean;
  } | null>(null);
  const [studySettings, setStudySettings] = useState({ maxCards: 10 });
  const [focusTimeRemaining, setFocusTimeRemaining] = useState<number | null>(null);
  const [isFocusModeActive, setIsFocusModeActive] = useState(false);
  const [showFocusPopup, setShowFocusPopup] = useState(false);
  const [focusDuration, setFocusDuration] = useState<number>(10); // Default 10 mins
  const [isFocusExpanded, setIsFocusExpanded] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isFocusModeActive && focusTimeRemaining !== null && focusTimeRemaining > 0) {
      interval = setInterval(() => {
        setFocusTimeRemaining(prev => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (focusTimeRemaining === 0) {
      handleFocusComplete();
    }
    return () => clearInterval(interval);
  }, [isFocusModeActive, focusTimeRemaining]);

  const handleFocusComplete = () => {
    if (isFocusModeActive && focusDuration) {
      onAddFocusSession({
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString(),
        minutes: focusDuration
      });
    }
    setIsFocusModeActive(false);
    setFocusTimeRemaining(null);
  };

  const startFocusSession = (mins: number) => {
    setFocusDuration(mins);
    setFocusTimeRemaining(mins * 60);
    setIsFocusModeActive(true);
    setShowFocusPopup(true);
    setTimeout(() => setShowFocusPopup(false), 5000);
  };

  useEffect(() => {
    fetchPassages();
    fetchSlang();
  }, []);

  useEffect(() => {
    if (currentPromptData?.vocabulary) {
      currentPromptData.vocabulary.forEach(v => {
        addFlashcardFromVocab(v.word, v.definition, v.wordType);
      });
    }
  }, [currentPromptData]);

  const fetchSlang = async () => {
    try {
      const res = await fetch('/api/slang');
      const data = await res.json();
      setSlangBank(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch slang", err);
      setSlangBank([]);
    }
  };

  const saveSlang = async (terms: { term: string; meaning: string; wordType: string }[], example: string) => {
    const accent = ACCENTS[localProfile.targetLanguage].find(a => a.id === localProfile.targetAccent);
    
    for (const t of terms) {
      // Check if already in bank
      if (safeSlangBank.some(s => s.term.toLowerCase() === t.term.toLowerCase() && s.language === localProfile.targetLanguage)) {
        continue;
      }

      const newSlang: SlangTerm = {
        id: Math.random().toString(36).substr(2, 9),
        term: t.term,
        meaning: t.meaning,
        example,
        region: accent?.region || 'Universal',
        language: localProfile.targetLanguage,
        dateLearned: new Date().toISOString()
      };

      try {
        await fetch('/api/slang', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSlang)
        });
        setSlangBank(prev => [newSlang, ...prev]);
        
        // Also add to flashcards
        addFlashcardFromVocab(t.term, t.meaning, t.wordType);
      } catch (err) {
        console.error("Failed to save slang", err);
      }
    }
  };

  const addFlashcardFromVocab = async (word: string, definitionEn: string, wordType?: string) => {
    // Check if already exists
    if (flashcards.some(f => f.word.toLowerCase() === word.toLowerCase() && f.language === localProfile.targetLanguage)) {
      return;
    }

    const card: Flashcard = {
      id: Math.random().toString(36).substr(2, 9),
      word,
      definitionEn,
      wordType: wordType || 'expression',
      practiceCount: 0,
      consecutiveCorrect: 0,
      frequency: 3,
      language: localProfile.targetLanguage,
      dateAdded: new Date().toISOString(),
      isCustom: false
    };

    onAddFlashcard(card);
  };

  const fetchPassages = async () => {
    try {
      const res = await fetch('/api/passages');
      const data = await res.json();
      setSavedPassages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch passages", err);
      setSavedPassages([]);
    }
  };

  const savePassage = async (text: string) => {
    const newPassage: SavedPassage = {
      id: Math.random().toString(36).substr(2, 9),
      text,
      date: new Date().toISOString(),
      language: localProfile.targetLanguage
    };
    try {
      await fetch('/api/passages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPassage)
      });
      setSavedPassages(prev => [newPassage, ...prev]);
    } catch (err) {
      console.error("Failed to save passage", err);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    const updated = { ...localProfile, ...updates };
    setLocalProfile(updated);
    try {
      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (err) {
      console.error("Failed to update profile", err);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stagedProfile)
      });
      
      const oldProfile = { ...localProfile };
      setLocalProfile(stagedProfile);
      setShowSettings(false);

      // If we are in practice mode and core settings changed, refresh the prompt
      if (view === 'practice') {
        const coreChanged = 
          stagedProfile.targetLanguage !== oldProfile.targetLanguage ||
          stagedProfile.targetAccent !== oldProfile.targetAccent ||
          stagedProfile.skillLevel !== oldProfile.skillLevel;
        
        if (coreChanged) {
          startPractice(practiceMode, undefined, stagedProfile);
        }
      }
    } catch (err) {
      console.error("Failed to save settings", err);
      setShowSettings(false);
    }
  };

  const handleToggleDefinitionLanguage = async (cardId: string) => {
    const card = flashcards.find(f => f.id === cardId);
    if (!card) return;

    if (!showTargetDefinition[cardId]) {
      // If we are switching to target language and don't have it yet, translate it
      if (!card.definitionTarget) {
        try {
          const translated = await translateDefinition(card.definitionEn, card.language);
          const updatedCards = flashcards.map(f => 
            f.id === cardId ? { ...f, definitionTarget: translated } : f
          );
          onUpdateFlashcards(updatedCards);
        } catch (err) {
          console.error("Translation failed", err);
        }
      }
    }
    
    setShowTargetDefinition(prev => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  const handleManualAddFlashcard = () => {
    if (!newFlashcard.word || !newFlashcard.definitionEn) return;

    const card: Flashcard = {
      id: Math.random().toString(36).substr(2, 9),
      word: newFlashcard.word,
      definitionEn: newFlashcard.definitionEn,
      wordType: newFlashcard.wordType,
      practiceCount: 0,
      consecutiveCorrect: 0,
      frequency: 3,
      language: localProfile.targetLanguage,
      dateAdded: new Date().toISOString(),
      isCustom: true
    };

    onAddFlashcard(card);
    setNewFlashcard({ word: '', definitionEn: '', wordType: 'noun' });
    setIsAddingFlashcard(false);
  };

  const updateFlashcardFrequency = (cardId: string, frequency: number) => {
    const updatedCards = flashcards.map(f => 
      f.id === cardId ? { ...f, frequency } : f
    );
    onUpdateFlashcards(updatedCards);
  };

  const startStudySession = () => {
    // Filter cards for current language and not mastered (consecutiveCorrect < 3)
    const availableCards = flashcards.filter(f => 
      f.language === localProfile.targetLanguage && 
      f.consecutiveCorrect < 3
    );

    // Shuffle and pick up to maxCards
    const shuffled = [...availableCards].sort(() => Math.random() - 0.5);
    const sessionCards = shuffled.slice(0, studySettings.maxCards);

    setStudySession({
      cards: sessionCards,
      currentIndex: 0,
      maxCards: sessionCards.length,
      isComplete: false
    });
    setFlashcardSubView('study');
    setIsFlipped({}); // Reset flips
  };

  const handleStudyFeedback = (cardId: string, isCorrect: boolean) => {
    if (!studySession) return;

    const card = flashcards.find(f => f.id === cardId);
    if (!card) return;

    let newConsecutive = isCorrect ? card.consecutiveCorrect + 1 : 0;
    let newFrequency = card.frequency;

    if (isCorrect) {
      if (newConsecutive === 1) newFrequency = 3; // Average
      else if (newConsecutive === 2) newFrequency = 2; // Less frequent
      else if (newConsecutive >= 3) newFrequency = 1; // Mastered (will be excluded next time)
    } else {
      newFrequency = 5; // More frequent
    }

    const updatedFlashcards = flashcards.map(f => 
      f.id === cardId ? { 
        ...f, 
        consecutiveCorrect: newConsecutive, 
        frequency: newFrequency,
        practiceCount: f.practiceCount + 1 
      } : f
    );
    onUpdateFlashcards(updatedFlashcards);

    // Move to next card or complete
    if (studySession.currentIndex < studySession.cards.length - 1) {
      setStudySession({
        ...studySession,
        currentIndex: studySession.currentIndex + 1
      });
      setIsFlipped({}); // Reset flip for next card
    } else {
      setStudySession({
        ...studySession,
        isComplete: true
      });
    }
  };

  const playAudio = async (base64: string) => {
    if (!base64) {
      console.error("No audio data received");
      return null;
    }
    try {
      // Gemini TTS returns raw PCM 16-bit 24kHz. We need to wrap it in a WAV header.
      const binaryString = window.atob(base64.trim());
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const buffer = new ArrayBuffer(44 + bytes.length);
      const view = new DataView(buffer);

      // RIFF identifier
      view.setUint32(0, 0x52494646, false); // "RIFF"
      view.setUint32(4, 36 + bytes.length, true);
      view.setUint32(8, 0x57415645, false); // "WAVE"
      view.setUint32(12, 0x666d7420, false); // "fmt "
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true); // PCM
      view.setUint16(22, 1, true); // Mono
      view.setUint32(24, 24000, true); // Sample Rate
      view.setUint32(28, 24000 * 2, true); // Byte Rate
      view.setUint16(32, 2, true); // Block Align
      view.setUint16(34, 16, true); // Bits per sample
      view.setUint32(36, 0x64617461, false); // "data"
      view.setUint32(40, bytes.length, true);

      for (let i = 0; i < bytes.length; i++) {
        view.setUint8(44 + i, bytes[i]);
      }

      const blob = new Blob([buffer], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio();
      audio.src = url;
      
      // Wait for metadata to be loaded to ensure it's a valid source
      await new Promise((resolve, reject) => {
        audio.onloadedmetadata = resolve;
        audio.onerror = reject;
      });
      
      return audio;
    } catch (err) {
      console.error("Audio processing failed", err);
      throw err;
    }
  };

  const playPrompt = async () => {
    if (!currentPrompt || isPlayingPrompt) return;
    setIsPlayingPrompt(true);
    try {
      const accent = ACCENTS[localProfile.targetLanguage].find(a => a.id === localProfile.targetAccent);
      const base64 = await generateSpeech(currentPrompt, localProfile.preferredVoice, accent?.name);
      const audio = await playAudio(base64);
      if (audio) {
        audio.onended = () => setIsPlayingPrompt(false);
        await audio.play();
      } else {
        setIsPlayingPrompt(false);
      }
    } catch (err) {
      console.error(err);
      setIsPlayingPrompt(false);
    }
  };

  const playAssistantFeedback = async (text: string) => {
    try {
      const accent = ACCENTS[localProfile.targetLanguage].find(a => a.id === localProfile.targetAccent);
      const base64 = await generateSpeech(text, localProfile.preferredVoice, accent?.name);
      const audio = await playAudio(base64);
      if (audio) {
        await audio.play();
      }
    } catch (err) {
      console.error("Assistant speech failed", err);
    }
  };

  const startPractice = async (mode: PracticeMode, specificPrompt?: string, profileOverride?: UserProfile) => {
    const activeProfile = profileOverride || localProfile;
    setPracticeMode(mode);
    setView('practice');
    setLastFeedback(null);
    setCurrentSlangTerms([]);
    setShowTranslation(false);
    setSelectedWord(null);
    
    if (specificPrompt) {
      setCurrentPrompt(specificPrompt);
      setCurrentPromptData(null);
    } else {
      setIsGenerating(true);
      setCurrentPrompt('');
      setCurrentPromptData(null);
      setCurrentSlangTerms([]);
      try {
        if (mode === 'Slang') {
          const accent = ACCENTS[activeProfile.targetLanguage].find(a => a.id === activeProfile.targetAccent);
          const slangData = await generateSlangPrompt(
            activeProfile.targetLanguage,
            accent?.name || activeProfile.targetLanguage,
            accent?.region || '',
            passageContext
          );
          setCurrentPrompt(slangData.sentence);
          setCurrentSlangTerms(slangData.terms);
          setCurrentPromptData(null);
          await saveSlang(slangData.terms, slangData.sentence);
        } else {
          const priorityCards = flashcards
            .filter(f => f.language === activeProfile.targetLanguage)
            .sort((a, b) => b.frequency - a.frequency)
            .slice(0, 5)
            .map(f => ({ word: f.word, frequency: f.frequency }));

          const promptData = await generatePracticePrompt(
            activeProfile.targetLanguage,
            activeProfile.skillLevel,
            selectedFlavor,
            mode,
            priorityCards,
            passageContext
          );
          setCurrentPrompt(promptData.text);
          setCurrentPromptData(promptData);
          if (mode === 'Read') {
            await savePassage(promptData.text);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const handleRecordingComplete = async (audioBase64: string, mimeType: string) => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeSpeech(
        audioBase64,
        currentPrompt,
        localProfile.targetLanguage,
        ACCENTS[localProfile.targetLanguage].find(a => a.id === localProfile.targetAccent)?.name || localProfile.targetAccent,
        practiceMode,
        localProfile.skillLevel,
        mimeType
      );

      let assistantResponseText = "";
      if (localProfile.isLiveAssistantEnabled) {
        try {
          assistantResponseText = await generateAssistantResponse(
            { strengths: result.strengths, improvements: result.improvements, detailedAnalysis: result.detailedAnalysis },
            result.score,
            localProfile.assistantLanguage,
            localProfile.targetLanguage,
            localProfile.assistantEnglishAccent
          );
        } catch (err) {
          console.error("Assistant response generation failed", err);
        }
      }

      const newSession: PracticeSession = {
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString(),
        language: localProfile.targetLanguage,
        accent: localProfile.targetAccent,
        skillLevel: localProfile.skillLevel,
        flavor: localProfile.preferredFlavor,
        mode: practiceMode,
        prompt: currentPrompt,
        score: result.score,
        assistantResponse: assistantResponseText || undefined,
        feedback: {
          strengths: result.strengths,
          improvements: result.improvements,
          detailedAnalysis: result.detailedAnalysis
        }
      };

      // Increment practice count for flashcards in this prompt
      const updatedFlashcards = flashcards.map(f => {
        if (f.language === localProfile.targetLanguage && currentPrompt.toLowerCase().includes(f.word.toLowerCase())) {
          return { ...f, practiceCount: f.practiceCount + 1 };
        }
        return f;
      });
      onUpdateFlashcards(updatedFlashcards);

      setLastFeedback(newSession);
      onNewSession(newSession);

      if (assistantResponseText) {
        await playAssistantFeedback(assistantResponseText);
      }
    } catch (err) {
      console.error(err);
      alert("Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderHighlightedText = (text: string, vocabulary: { word: string; definition: string }[]) => {
    if (!vocabulary || vocabulary.length === 0) return <ReactMarkdown>{text}</ReactMarkdown>;

    let parts: (string | React.ReactNode)[] = [text];

    vocabulary.forEach((v) => {
      const newParts: (string | React.ReactNode)[] = [];
      parts.forEach((part) => {
        if (typeof part === 'string') {
          const regex = new RegExp(`(${v.word})`, 'gi');
          const split = part.split(regex);
          split.forEach((s, i) => {
            if (s.toLowerCase() === v.word.toLowerCase()) {
              newParts.push(
                <button
                  key={`${v.word}-${i}`}
                  onClick={() => setSelectedWord(v)}
                  className="text-indigo-600 font-bold underline decoration-indigo-300 decoration-2 underline-offset-4 hover:text-indigo-800 transition-colors"
                >
                  {s}
                </button>
              );
            } else {
              newParts.push(s);
            }
          });
        } else {
          newParts.push(part);
        }
      });
      parts = newParts;
    });

    return <div className="inline-wrap">{parts}</div>;
  };

  const getVoiceName = (voiceId: string, accentId: string) => {
    const regionalNames = REGIONAL_NAMES[accentId];
    if (!regionalNames) return voiceId;
    
    const voiceIndex = TTS_VOICES.findIndex(v => v.id === voiceId);
    return regionalNames[voiceIndex] || voiceId;
  };

  const safeSessions = Array.isArray(sessions) ? sessions : [];
  const safeSavedPassages = Array.isArray(savedPassages) ? savedPassages : [];
  const safeSlangBank = Array.isArray(slangBank) ? slangBank : [];

  const averageScore = safeSessions.length > 0 
    ? Math.round(safeSessions.reduce((acc, s) => acc + s.score, 0) / safeSessions.length) 
    : 0;

  const chartData = Object.values(
    safeSessions.reduce((acc, s) => {
      const dateStr = new Date(s.date).toLocaleDateString([], { month: 'short', day: 'numeric' });
      if (!acc[dateStr]) {
        acc[dateStr] = { date: dateStr, totalScore: 0, count: 0, timestamp: new Date(s.date).getTime() };
      }
      acc[dateStr].totalScore += s.score;
      acc[dateStr].count += 1;
      return acc;
    }, {} as Record<string, { date: string; totalScore: number; count: number; timestamp: number }>)
  )
    .sort((a, b) => a.timestamp - b.timestamp)
    .map(d => ({
      date: d.date,
      score: Math.round(d.totalScore / d.count)
    }));

  const calculateStreak = () => {
    if (safeSessions.length === 0) return 0;

    const uniqueDates = Array.from(new Set(
      safeSessions.map(s => {
        const d = new Date(s.date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      })
    )).sort((a, b) => b.localeCompare(a));

    if (uniqueDates.length === 0) return 0;

    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;

    if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
      return 0;
    }

    let streak = 0;
    let checkDate = new Date(uniqueDates[0]);
    
    for (const dateStr of uniqueDates) {
      const expectedStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
      if (dateStr === expectedStr) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  };

  const currentStreak = calculateStreak();

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const safeFocusSessions = Array.isArray(focusSessions) ? focusSessions : [];
  const todayFocusMinutes = safeFocusSessions
    .filter(s => {
      const d = new Date(s.date);
      const today = new Date();
      return d.toDateString() === today.toDateString();
    })
    .reduce((acc, s) => acc + s.minutes, 0);

  return (
    <div className={`min-h-screen bg-slate-50 pb-24 transition-all duration-500 ${isFocusModeActive ? 'ring-[12px] ring-indigo-600 ring-inset' : ''}`}>
      {/* Focus Overlay Note */}
      {isFocusModeActive && (
        <div className="fixed top-0 left-1/2 -translate-x-1/2 z-[100] bg-indigo-600 text-white px-6 py-1 rounded-b-xl font-black text-[10px] uppercase tracking-[0.3em] shadow-lg">
          Focus
        </div>
      )}

      {/* Focus Popup */}
      <AnimatePresence>
        {showFocusPopup && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 20 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-12 left-1/2 -translate-x-1/2 z-[110] bg-white p-6 rounded-3xl shadow-2xl border border-indigo-100 max-w-xs w-full text-center space-y-3"
          >
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto">
              <Target size={24} />
            </div>
            <h4 className="text-lg font-bold text-slate-900">Focus Activated</h4>
            <p className="text-slate-500 text-xs leading-relaxed">
              100% focus accelerates language learning by strengthening neural pathways and improving memory retention.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-6 py-8 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-slate-900">Hello, {localProfile.name}!</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                  {localProfile.skillLevel}
                </span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Volume2 size={10} /> {getVoiceName(localProfile.preferredVoice, localProfile.targetAccent)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Compact Focus Pill */}
              <div className="relative">
                <button 
                  onClick={() => setIsFocusExpanded(!isFocusExpanded)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-2xl transition-all border ${
                    isFocusModeActive 
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-200 animate-pulse' 
                      : todayFocusMinutes >= 30 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                        : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'
                  }`}
                >
                  {todayFocusMinutes >= 30 && !isFocusModeActive ? <CheckCircle2 size={16} /> : <Focus size={16} />}
                  <span className="text-xs font-bold tabular-nums">
                    {isFocusModeActive ? formatTime(focusTimeRemaining || 0) : `${todayFocusMinutes}m`}
                  </span>
                </button>

                {/* Focus Dropdown */}
                <AnimatePresence>
                  {isFocusExpanded && (
                    <>
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-30"
                        onClick={() => setIsFocusExpanded(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-64 bg-white rounded-3xl shadow-2xl border border-slate-100 p-5 z-40 space-y-4"
                      >
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <h4 className="text-sm font-bold text-slate-900">Focus Attention</h4>
                            {todayFocusMinutes >= 30 && (
                              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[8px] font-black uppercase tracking-wider">
                                Goal Met
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 leading-relaxed">
                            {isFocusModeActive 
                              ? "Stay focused! Neural pathways are strengthening." 
                              : "Switch gears and fully focus on your practice."}
                          </p>
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between items-end">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Progress</span>
                            <span className="text-[10px] font-bold text-slate-900">{todayFocusMinutes}/30m</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min((todayFocusMinutes / 30) * 100, 100)}%` }}
                              className={`h-full transition-all ${todayFocusMinutes >= 30 ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                            />
                          </div>
                        </div>

                        {isFocusModeActive ? (
                          <button 
                            onClick={() => {
                              setIsFocusModeActive(false);
                              setFocusTimeRemaining(null);
                              setIsFocusExpanded(false);
                            }}
                            className="w-full py-3 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-rose-100 hover:bg-rose-100 transition-colors"
                          >
                            End Session
                          </button>
                        ) : (
                          <div className="grid grid-cols-3 gap-2">
                            {[5, 10, 15].map(mins => (
                              <button
                                key={mins}
                                onClick={() => {
                                  startFocusSession(mins);
                                  setIsFocusExpanded(false);
                                }}
                                className="py-2 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-slate-100 hover:border-indigo-200 hover:text-indigo-600 transition-all"
                              >
                                {mins}m
                              </button>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              <button 
                onClick={() => {
                  setStagedProfile(localProfile);
                  setShowSettings(true);
                }}
                className="p-3 bg-slate-50 text-slate-600 rounded-2xl hover:bg-slate-100 transition-colors"
              >
                <Settings size={20} />
              </button>
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-100">
                {localProfile.name[0]}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-6 space-y-8">
        <AnimatePresence>
          {selectedWord && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[60] flex items-center justify-center p-4"
              onClick={() => setSelectedWord(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white p-6 rounded-3xl shadow-2xl border border-slate-100 max-w-xs w-full space-y-3"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex justify-between items-start">
                  <h4 className="text-xl font-bold text-indigo-600">{selectedWord.word}</h4>
                  <button onClick={() => setSelectedWord(null)} className="text-slate-400 hover:text-slate-600">
                    <ChevronLeft size={20} className="rotate-90" />
                  </button>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {selectedWord.definition}
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
              onClick={() => setShowSettings(false)}
            >
              <motion.div
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                exit={{ y: 100 }}
                className="bg-white w-full max-w-md rounded-[2.5rem] p-8 space-y-8 overflow-y-auto max-h-[80vh]"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
                  <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600">
                    <ChevronLeft size={24} className="rotate-90" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">Target Language</label>
                    <div className="grid grid-cols-2 gap-2">
                      {LANGUAGES.map(lang => (
                        <button
                          key={lang}
                          onClick={() => {
                            const defaultAccent = ACCENTS[lang][0].id;
                            setStagedProfile({ ...stagedProfile, targetLanguage: lang, targetAccent: defaultAccent });
                          }}
                          className={`p-3 rounded-xl border-2 text-center transition-all ${stagedProfile.targetLanguage === lang ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100'}`}
                        >
                          <span className="font-bold text-slate-800">{lang}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">Target Accent</label>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                      {ACCENTS[stagedProfile.targetLanguage].map(accent => (
                        <button
                          key={accent.id}
                          onClick={() => setStagedProfile({ ...stagedProfile, targetAccent: accent.id })}
                          className={`w-full p-3 rounded-xl border-2 text-left transition-all ${stagedProfile.targetAccent === accent.id ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100'}`}
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
                      {SKILL_LEVELS.map(level => (
                        <button
                          key={level}
                          onClick={() => setStagedProfile({ ...stagedProfile, skillLevel: level })}
                          className={`p-3 rounded-xl border-2 text-center transition-all ${stagedProfile.skillLevel === level ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100'}`}
                        >
                          <span className="font-bold text-slate-800 text-sm">{level}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">Voice Preference</label>
                    <div className="grid grid-cols-2 gap-2">
                      {TTS_VOICES.map(voice => (
                        <button
                          key={voice.id}
                          onClick={() => setStagedProfile({ ...stagedProfile, preferredVoice: voice.id })}
                          className={`p-4 rounded-2xl border-2 text-center transition-all ${stagedProfile.preferredVoice === voice.id ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100'}`}
                        >
                          <span className="font-bold text-slate-800">{getVoiceName(voice.id, stagedProfile.targetAccent)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSaveSettings}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold"
                >
                  Done
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-4">
                    <TrendingUp size={20} />
                  </div>
                  <div className="text-3xl font-bold text-slate-900">{averageScore}%</div>
                  <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">Avg. Accent Score</div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mb-4">
                    <Award size={20} />
                  </div>
                  <div className="text-3xl font-bold text-slate-900">{safeSessions.length}</div>
                  <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">Sessions Completed</div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm col-span-2 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                      <Focus size={20} />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-slate-900">{todayFocusMinutes}m</div>
                      <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Focused Today</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Daily Goal</div>
                    <div className="text-[10px] text-slate-400 font-medium">30m recommended</div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 px-1">Start Practice</h2>
                <div className="grid grid-cols-1 gap-4">
                  <button 
                    onClick={() => startPractice('Read')}
                    className="group bg-indigo-600 p-6 rounded-3xl text-left flex items-center justify-between shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white">
                        <PlayCircle size={24} />
                      </div>
                      <div>
                        <div className="text-white font-bold text-lg">Guided Reading</div>
                        <div className="text-indigo-100 text-sm">Read AI-generated phrases</div>
                      </div>
                    </div>
                    <ChevronLeft size={20} className="text-white/50 rotate-180 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button 
                    onClick={() => startPractice('Respond')}
                    className="group bg-white p-6 rounded-3xl text-left flex items-center justify-between border border-slate-100 shadow-sm hover:border-indigo-200 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600">
                        <Calendar size={24} />
                      </div>
                      <div>
                        <div className="text-slate-900 font-bold text-lg">Open Response</div>
                        <div className="text-slate-500 text-sm">Answer conversational questions</div>
                      </div>
                    </div>
                    <ChevronLeft size={20} className="text-slate-300 rotate-180 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button 
                    onClick={() => startPractice('Slang')}
                    className="group bg-white p-6 rounded-3xl text-left flex items-center justify-between border border-slate-100 shadow-sm hover:border-indigo-200 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                        <Zap size={24} />
                      </div>
                      <div>
                        <div className="text-slate-900 font-bold text-lg">Slang Tutor</div>
                        <div className="text-slate-500 text-sm">Learn local regional slang</div>
                      </div>
                    </div>
                    <ChevronLeft size={20} className="text-slate-300 rotate-180 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button 
                    onClick={() => setView('slang_bank')}
                    className="group bg-white p-6 rounded-3xl text-left flex items-center justify-between border border-slate-100 shadow-sm hover:border-indigo-200 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                        <Library size={24} />
                      </div>
                      <div>
                        <div className="text-slate-900 font-bold text-lg">Slang Bank</div>
                        <div className="text-slate-500 text-sm">Review learned vocabulary</div>
                      </div>
                    </div>
                    <ChevronLeft size={20} className="text-slate-300 rotate-180 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button 
                    onClick={() => setView('flashcards')}
                    className="group bg-white p-6 rounded-3xl text-left flex items-center justify-between border border-slate-100 shadow-sm hover:border-indigo-200 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                        <Rotate3d size={24} />
                      </div>
                      <div>
                        <div className="text-slate-900 font-bold text-lg">Flashcards</div>
                        <div className="text-slate-500 text-sm">Study your vocabulary</div>
                      </div>
                    </div>
                    <ChevronLeft size={20} className="text-slate-300 rotate-180 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Tongue Twisters */}
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 px-1">Tongue Twisters</h2>
                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                  {TONGUE_TWISTERS[localProfile.targetLanguage].map((twister, i) => (
                    <button
                      key={i}
                      onClick={() => startPractice('TongueTwister', twister)}
                      className="flex-shrink-0 w-64 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:border-indigo-200 transition-all text-left space-y-3"
                    >
                      <div className="text-indigo-600 font-bold text-xs uppercase tracking-widest">Level {i + 1}</div>
                      <p className="text-slate-700 font-medium line-clamp-3 leading-relaxed">"{twister}"</p>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {view === 'practice' && (
            <motion.div 
              key="practice"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => setView('home')}
                  className="flex items-center gap-2 text-slate-500 font-medium hover:text-slate-900 transition-colors"
                >
                  <ChevronLeft size={20} /> Back to Dashboard
                </button>
                {practiceMode === 'Read' && (
                  <button
                    onClick={() => startPractice('Read')}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-all disabled:opacity-50"
                  >
                    <RefreshCw size={16} className={isGenerating ? 'animate-spin' : ''} />
                    Generate New
                  </button>
                )}
                {practiceMode === 'Slang' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setView('slang_bank')}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-sm hover:bg-emerald-100 transition-all"
                    >
                      <Library size={16} />
                      Slang Bank
                    </button>
                    <button
                      onClick={() => startPractice('Slang')}
                      disabled={isGenerating}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-all disabled:opacity-50"
                    >
                      <RefreshCw size={16} className={isGenerating ? 'animate-spin' : ''} />
                      New Slang
                    </button>
                  </div>
                )}
              </div>

              <div className={`grid grid-cols-1 ${practiceMode === 'Read' ? 'lg:grid-cols-4' : ''} gap-8`}>
                {/* Sidebar for Read Mode */}
                {practiceMode === 'Read' && (
                  <div className="lg:col-span-1 space-y-4 order-2 lg:order-1">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-2">Previous Passages</h3>
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                      {safeSavedPassages.filter(p => p.language === localProfile.targetLanguage).map((passage) => (
                        <button
                          key={passage.id}
                          onClick={() => setCurrentPrompt(passage.text)}
                          className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                            currentPrompt === passage.text 
                              ? 'border-indigo-600 bg-indigo-50' 
                              : 'border-white bg-white shadow-sm hover:border-slate-200'
                          }`}
                        >
                          <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                            {new Date(passage.date).toLocaleDateString()}
                          </div>
                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                            {passage.text}
                          </p>
                        </button>
                      ))}
                      {safeSavedPassages.length === 0 && (
                        <div className="p-4 text-center text-slate-400 text-xs italic">
                          No saved passages yet.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className={`${practiceMode === 'Read' ? 'lg:col-span-3' : ''} space-y-8 order-1 lg:order-2`}>
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                    <div className="space-y-4">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Passage Style</label>
                      <div className="flex flex-wrap gap-2">
                        {PRACTICE_FLAVORS.map(flavor => (
                          <button
                            key={flavor}
                            onClick={() => setSelectedFlavor(flavor)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                              selectedFlavor === flavor 
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {flavor}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Passage Context</label>
                      <div className="space-y-3">
                        <div className="relative">
                          <input 
                            type="text"
                            value={passageContext}
                            onChange={(e) => {
                              const words = e.target.value.trim().split(/\s+/).filter(Boolean);
                              if (words.length <= 20 || e.target.value.length < passageContext.length) {
                                setPassageContext(e.target.value);
                              }
                            }}
                            placeholder="Describe a scenario (e.g. 'Ordering at a cafe')"
                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300 uppercase">
                            {passageContext.trim().split(/\s+/).filter(Boolean).length}/20 words
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {QUICK_CONTEXTS.map(ctx => (
                            <button
                              key={ctx}
                              onClick={() => setPassageContext(ctx)}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                                passageContext === ctx 
                                  ? 'bg-indigo-100 text-indigo-700 border-indigo-200' 
                                  : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'
                              }`}
                            >
                              {ctx}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-6">
                    <div className="flex justify-between items-center">
                      <div className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold uppercase tracking-wider">
                        {practiceMode} Mode
                      </div>
                      {isGenerating && <div className="text-xs text-slate-400 animate-pulse">Generating prompt...</div>}
                    </div>

                    <div className="min-h-[160px] flex flex-col items-center justify-center text-center gap-4">
                      {isGenerating ? (
                        <LoadingPrompt />
                      ) : (
                        <>
                          <div className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">
                            {renderHighlightedText(currentPrompt || "...", currentPromptData?.vocabulary || [])}
                          </div>
                          
                          {currentPromptData && (
                            <div className="space-y-4 w-full">
                              <button 
                                onClick={() => setShowTranslation(!showTranslation)}
                                className="text-xs font-bold text-indigo-600 uppercase tracking-widest hover:text-indigo-800 transition-colors"
                              >
                                {showTranslation ? 'Hide Translation' : 'Show Translation'}
                              </button>
                              {showTranslation && (
                                <div className="text-sm text-slate-400 italic max-w-md mx-auto">
                                  <ReactMarkdown>{currentPromptData.translation}</ReactMarkdown>
                                </div>
                              )}
                            </div>
                          )}

                          {currentSlangTerms.length > 0 && (
                            <div className="flex flex-wrap justify-center gap-2 mt-4">
                              {currentSlangTerms.map((t, i) => (
                                <div key={i} className="px-3 py-1 bg-amber-50 border border-amber-100 rounded-lg text-xs">
                                  <span className="font-bold text-amber-700">{t.term}</span>: <span className="text-slate-600">{t.meaning}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {currentPrompt && (
                            <button
                              onClick={playPrompt}
                              disabled={isPlayingPrompt}
                              className={`p-3 rounded-full transition-all ${isPlayingPrompt ? 'bg-indigo-100 text-indigo-400' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100'}`}
                            >
                              {isPlayingPrompt ? <Loader2 className="animate-spin" size={20} /> : <Volume2 size={20} />}
                            </button>
                          )}
                        </>
                      )}
                    </div>

                    {!lastFeedback && (
                      <Recorder 
                        onRecordingComplete={handleRecordingComplete}
                        isAnalyzing={isAnalyzing}
                      />
                    )}
                  </div>

                  {lastFeedback && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-8">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-bold text-slate-900">Analysis Result</h3>
                          <div className={`text-3xl font-black ${
                            lastFeedback.score > 80 ? 'text-emerald-500' : 
                            lastFeedback.score > 60 ? 'text-amber-500' : 'text-red-500'
                          }`}>
                            {lastFeedback.score}%
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm uppercase tracking-wider">
                              <CheckCircle2 size={18} /> Strengths
                            </div>
                            <ul className="space-y-2">
                              {lastFeedback.feedback.strengths.map((s, i) => (
                                <li key={i} className="text-slate-600 text-sm flex gap-2">
                                  <span className="text-emerald-500">•</span> {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 text-amber-600 font-bold text-sm uppercase tracking-wider">
                              <AlertCircle size={18} /> To Improve
                            </div>
                            <ul className="space-y-2">
                              {lastFeedback.feedback.improvements.map((s, i) => (
                                <li key={i} className="text-slate-600 text-sm flex gap-2">
                                  <span className="text-amber-500">•</span> {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100">
                          <div className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-4">Detailed Breakdown</div>
                          <div className="prose prose-slate prose-sm max-w-none">
                            <ReactMarkdown>{lastFeedback.feedback.detailedAnalysis}</ReactMarkdown>
                          </div>
                        </div>

                        <button 
                          onClick={() => startPractice(practiceMode)}
                          className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all"
                        >
                          Practice Again
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {view === 'slang_bank' && (
            <motion.div 
              key="slang_bank"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <button 
                onClick={() => setView('home')}
                className="flex items-center gap-2 text-slate-500 font-medium hover:text-slate-900 transition-colors"
              >
                <ChevronLeft size={20} /> Back to Dashboard
              </button>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-900">Slang Bank</h2>
                  <div className="text-sm font-medium text-slate-500">{safeSlangBank.filter(s => s.language === localProfile.targetLanguage).length} terms learned</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {safeSlangBank.filter(s => s.language === localProfile.targetLanguage).map((slang) => (
                    <div key={slang.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-indigo-600">{slang.term}</span>
                        <span className="px-2 py-1 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-500 uppercase tracking-wider">{slang.region}</span>
                      </div>
                      <p className="text-slate-700 font-medium">{slang.meaning}</p>
                      <div className="pt-3 border-t border-slate-50">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Example</div>
                        <p className="text-sm text-slate-500 italic leading-relaxed">
                          <ReactMarkdown>{slang.example}</ReactMarkdown>
                        </p>
                      </div>
                    </div>
                  ))}
                  {safeSlangBank.filter(s => s.language === localProfile.targetLanguage).length === 0 && (
                    <div className="col-span-full py-20 text-center space-y-4">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto">
                        <Zap size={32} />
                      </div>
                      <p className="text-slate-500 font-medium">No slang terms learned yet. Start a Slang Tutor session!</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {view === 'flashcards' && (
            <motion.div 
              key="flashcards"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => {
                    setView('home');
                    setFlashcardSubView('library');
                  }}
                  className="flex items-center gap-2 text-slate-500 font-medium hover:text-slate-900 transition-colors"
                >
                  <ChevronLeft size={20} /> Back to Dashboard
                </button>
                
                {flashcardSubView === 'library' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => startStudySession()}
                      disabled={flashcards.filter(f => f.language === localProfile.targetLanguage && f.consecutiveCorrect < 3).length === 0}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all disabled:opacity-50"
                    >
                      <PlayCircle size={16} />
                      Study Deck
                    </button>
                    <button
                      onClick={() => setIsAddingFlashcard(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all"
                    >
                      <Plus size={16} />
                      Add Card
                    </button>
                  </div>
                )}
              </div>

              {flashcardSubView === 'library' ? (
                <div className="space-y-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-slate-900">Flashcards</h2>
                      <div className="text-sm font-medium text-slate-500">
                        {flashcards.filter(f => f.language === localProfile.targetLanguage).length} cards
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {['All', 'Noun', 'Verb', 'Adjective', 'Adverb', 'Expression', 'Slang'].map(type => (
                        <button
                          key={type}
                          onClick={() => setFlashcardFilter(type)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            flashcardFilter === type 
                              ? 'bg-indigo-600 text-white shadow-md' 
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sort By:</label>
                      <div className="flex bg-slate-100 p-1 rounded-xl">
                        {(['date', 'practice', 'alphabetical'] as const).map(sort => (
                          <button
                            key={sort}
                            onClick={() => setFlashcardSort(sort)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                              flashcardSort === sort 
                                ? 'bg-white text-indigo-600 shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            {sort}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {flashcards
                      .filter(f => f.language === localProfile.targetLanguage)
                      .filter(f => flashcardFilter === 'All' || f.wordType?.toLowerCase() === flashcardFilter.toLowerCase())
                      .sort((a, b) => {
                        if (flashcardSort === 'date') return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
                        if (flashcardSort === 'practice') return b.practiceCount - a.practiceCount;
                        return a.word.localeCompare(b.word);
                      })
                      .map((card) => (
                      <div key={card.id} className="space-y-3">
                        <div className="perspective-1000 h-64">
                          <motion.div
                            animate={{ rotateY: isFlipped[card.id] ? 180 : 0 }}
                            transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
                            className="relative w-full h-full preserve-3d cursor-pointer"
                            onClick={() => setIsFlipped(prev => ({ ...prev, [card.id]: !prev[card.id] }))}
                          >
                            {/* Front */}
                            <div className="absolute inset-0 backface-hidden bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl flex flex-col items-center justify-center text-center">
                              <div className="absolute top-6 left-6 px-2 py-1 bg-slate-50 rounded-lg text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {card.wordType}
                              </div>
                              {card.consecutiveCorrect >= 3 && (
                                <div className="absolute top-6 right-6 text-emerald-500">
                                  <CheckCircle2 size={16} />
                                </div>
                              )}
                              <span className="text-3xl font-bold text-slate-900">{card.word}</span>
                              <div className="mt-4 text-slate-400 flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                                <Rotate3d size={14} /> Tap to flip
                              </div>
                              <div className="absolute bottom-6 flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                <div className="flex items-center gap-1">
                                  <History size={12} /> {card.practiceCount} practices
                                </div>
                                <div>
                                  {new Date(card.dateAdded).toLocaleDateString()}
                                </div>
                              </div>
                            </div>

                            {/* Back */}
                            <div 
                              className="absolute inset-0 backface-hidden bg-indigo-600 p-8 rounded-[2.5rem] border border-indigo-500 shadow-xl flex flex-col items-center justify-center text-center text-white"
                              style={{ transform: 'rotateY(180deg)' }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="absolute top-6 right-6 flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                                  {showTargetDefinition[card.id] ? localProfile.targetLanguage : 'English'}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleDefinitionLanguage(card.id);
                                  }}
                                  className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                                >
                                  <LanguagesIcon size={16} />
                                </button>
                              </div>
                              
                              <p className="text-xl font-medium leading-relaxed">
                                {showTargetDefinition[card.id] ? (
                                  card.definitionTarget || (
                                    <div className="flex gap-1.5 justify-center items-center h-8">
                                      {[0, 1, 2].map((i) => (
                                        <motion.div
                                          key={i}
                                          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                                          transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                                          className="w-2 h-2 bg-white rounded-full"
                                        />
                                      ))}
                                    </div>
                                  )
                                ) : card.definitionEn}
                              </p>
                              
                              <button
                                className="mt-6 text-indigo-200 flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsFlipped(prev => ({ ...prev, [card.id]: false }));
                                }}
                              >
                                <Rotate3d size={14} /> Back to word
                              </button>
                            </div>
                          </motion.div>
                        </div>
                        
                        {/* Frequency Slider */}
                        <div className="px-6 py-4 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Practice Frequency</label>
                            <span className="text-xs font-bold text-indigo-600">{card.frequency}x</span>
                          </div>
                          <input 
                            type="range" 
                            min="1" 
                            max="5" 
                            step="1"
                            value={card.frequency}
                            onChange={(e) => updateFlashcardFrequency(card.id, parseInt(e.target.value))}
                            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                          />
                          <div className="flex justify-between text-[8px] font-bold text-slate-300 uppercase tracking-tighter">
                            <span>Rarely</span>
                            <span>Frequently</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {flashcards.filter(f => f.language === localProfile.targetLanguage).length === 0 && (
                    <div className="py-20 text-center space-y-4">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto">
                        <Rotate3d size={32} />
                      </div>
                      <p className="text-slate-500 font-medium">No flashcards yet. Words you learn will appear here!</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="max-w-xl mx-auto space-y-8">
                  {studySession && !studySession.isComplete ? (
                    <div className="space-y-8">
                      <div className="flex items-center justify-between px-2">
                        <div className="space-y-1">
                          <h2 className="text-2xl font-bold text-slate-900">Study Session</h2>
                          <p className="text-slate-500 text-sm font-medium">
                            {studySession.maxCards - studySession.currentIndex} cards remaining
                          </p>
                        </div>
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                          {[5, 10, 15, 20].map(num => (
                            <button
                              key={num}
                              onClick={() => setStudySettings({ maxCards: num })}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                                studySettings.maxCards === num 
                                  ? 'bg-white text-indigo-600 shadow-sm' 
                                  : 'text-slate-500 hover:text-slate-700'
                              }`}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="relative h-96">
                        {studySession.cards[studySession.currentIndex] && (
                          <motion.div
                            key={studySession.cards[studySession.currentIndex].id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="perspective-1000 h-full"
                          >
                            <motion.div
                              animate={{ rotateY: isFlipped['study'] ? 180 : 0 }}
                              transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
                              className="relative w-full h-full preserve-3d cursor-pointer"
                              onClick={() => setIsFlipped(prev => ({ ...prev, study: !prev.study }))}
                            >
                              {/* Front */}
                              <div className="absolute inset-0 backface-hidden bg-white p-12 rounded-[3rem] border border-slate-100 shadow-2xl flex flex-col items-center justify-center text-center">
                                <div className="absolute top-8 left-8 px-3 py-1 bg-slate-50 rounded-lg text-xs font-bold text-slate-400 uppercase tracking-widest">
                                  {studySession.cards[studySession.currentIndex].wordType}
                                </div>
                                <span className="text-5xl font-bold text-slate-900">
                                  {studySession.cards[studySession.currentIndex].word}
                                </span>
                                <div className="mt-8 text-slate-400 flex items-center gap-2 text-sm font-bold uppercase tracking-widest">
                                  <Rotate3d size={18} /> Tap to flip
                                </div>
                              </div>

                              {/* Back */}
                              <div 
                                className="absolute inset-0 backface-hidden bg-indigo-600 p-12 rounded-[3rem] border border-indigo-500 shadow-2xl flex flex-col items-center justify-center text-center text-white"
                                style={{ transform: 'rotateY(180deg)' }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <p className="text-3xl font-medium leading-relaxed">
                                  {studySession.cards[studySession.currentIndex].definitionEn}
                                </p>
                                
                                <div className="mt-12 flex gap-6">
                                  <button
                                    onClick={() => handleStudyFeedback(studySession.cards[studySession.currentIndex].id, false)}
                                    className="w-16 h-16 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all hover:scale-110"
                                  >
                                    <ThumbsDown size={28} />
                                  </button>
                                  <button
                                    onClick={() => handleStudyFeedback(studySession.cards[studySession.currentIndex].id, true)}
                                    className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-indigo-600 transition-all hover:scale-110 shadow-lg"
                                  >
                                    <ThumbsUp size={28} />
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          </motion.div>
                        )}
                      </div>

                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(studySession.currentIndex / studySession.maxCards) * 100}%` }}
                          className="h-full bg-indigo-600"
                        />
                      </div>
                    </div>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-xl text-center space-y-8"
                    >
                      <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mx-auto">
                        <Trophy size={48} />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-3xl font-bold text-slate-900">Session Complete!</h3>
                        <p className="text-slate-500 font-medium">Great job studying your vocabulary today.</p>
                      </div>
                      <button
                        onClick={() => setFlashcardSubView('library')}
                        className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                      >
                        Back to Library
                      </button>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Add Card Modal */}
              <AnimatePresence>
                {isAddingFlashcard && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
                    onClick={() => setIsAddingFlashcard(false)}
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 max-w-md w-full space-y-6"
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="flex justify-between items-center">
                        <h3 className="text-2xl font-bold text-slate-900">New Flashcard</h3>
                        <button onClick={() => setIsAddingFlashcard(false)} className="text-slate-400 hover:text-slate-600">
                          <ChevronLeft size={24} className="rotate-90" />
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Word or Phrase</label>
                          <input
                            type="text"
                            value={newFlashcard.word}
                            onChange={e => setNewFlashcard({ ...newFlashcard, word: e.target.value })}
                            placeholder="Enter word in target language"
                            className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Word Type</label>
                          <select
                            value={newFlashcard.wordType}
                            onChange={e => setNewFlashcard({ ...newFlashcard, wordType: e.target.value })}
                            className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all"
                          >
                            <option value="noun">Noun</option>
                            <option value="verb">Verb</option>
                            <option value="adjective">Adjective</option>
                            <option value="adverb">Adverb</option>
                            <option value="expression">Expression</option>
                            <option value="slang">Slang</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Definition (English)</label>
                          <textarea
                            value={newFlashcard.definitionEn}
                            onChange={e => setNewFlashcard({ ...newFlashcard, definitionEn: e.target.value })}
                            placeholder="Enter English definition"
                            rows={3}
                            className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                          />
                        </div>
                      </div>

                      <button
                        onClick={handleManualAddFlashcard}
                        disabled={!newFlashcard.word || !newFlashcard.definitionEn}
                        className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50"
                      >
                        Add to Bank
                      </button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {view === 'reports' && (
            <motion.div 
              key="reports"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-900">Progress Report</h2>
                  <BarChart3 className="text-indigo-600" />
                </div>

                <div className="h-[300px] w-full">
                  {safeSessions.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="date" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#94a3b8', fontSize: 12 }}
                          dy={10}
                        />
                        <YAxis 
                          domain={[0, 100]} 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#94a3b8', fontSize: 12 }}
                        />
                        <Tooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="score" 
                          stroke="#4f46e5" 
                          strokeWidth={4} 
                          dot={{ r: 6, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                      <History size={48} strokeWidth={1} />
                      <p>No practice data yet</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="p-6 bg-slate-50 rounded-3xl flex items-center justify-between">
                    <div>
                      <div className="text-slate-500 text-xs font-bold uppercase tracking-widest">Current Streak</div>
                      <div className="text-2xl font-bold text-slate-900">{currentStreak} {currentStreak === 1 ? 'Day' : 'Days'}</div>
                    </div>
                    <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
                      <TrendingUp />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'history' && (
            <motion.div 
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold text-slate-900 px-1">Practice History</h2>
              <div className="space-y-4">
                {safeSessions.map((session) => (
                  <div key={session.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="font-bold text-slate-900 line-clamp-1">{session.prompt}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                          <span>{new Date(session.date).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{session.mode}</span>
                        </div>
                      </div>
                      <div className={`text-xl font-bold ${
                        session.score > 80 ? 'text-emerald-500' : 
                        session.score > 60 ? 'text-amber-500' : 'text-red-500'
                      }`}>
                        {session.score}%
                      </div>
                    </div>
                    {session.assistantResponse && (
                      <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                        <div className="flex items-center gap-2 text-indigo-600 font-bold text-[10px] uppercase tracking-widest mb-1">
                          <Mic2 size={12} /> Assistant Feedback
                        </div>
                        <p className="text-slate-600 text-sm italic">"{session.assistantResponse}"</p>
                      </div>
                    )}
                  </div>
                ))}
                {safeSessions.length === 0 && (
                  <div className="text-center py-12 text-slate-400">
                    Your practice history will appear here.
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 px-6 py-4 z-30">
        <div className="max-w-2xl mx-auto flex justify-around items-center">
          <button 
            onClick={() => setView('home')}
            className={`flex flex-col items-center gap-1 transition-colors ${view === 'home' || view === 'practice' ? 'text-indigo-600' : 'text-slate-400'}`}
          >
            <PlayCircle size={24} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Practice</span>
          </button>
          <button 
            onClick={() => setView('reports')}
            className={`flex flex-col items-center gap-1 transition-colors ${view === 'reports' ? 'text-indigo-600' : 'text-slate-400'}`}
          >
            <BarChart3 size={24} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Reports</span>
          </button>
          <button 
            onClick={() => setView('flashcards')}
            className={`flex flex-col items-center gap-1 transition-colors ${view === 'flashcards' ? 'text-indigo-600' : 'text-slate-400'}`}
          >
            <Rotate3d size={24} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Cards</span>
          </button>
          <button 
            onClick={() => setView('history')}
            className={`flex flex-col items-center gap-1 transition-colors ${view === 'history' ? 'text-indigo-600' : 'text-slate-400'}`}
          >
            <History size={24} />
            <span className="text-[10px] font-bold uppercase tracking-widest">History</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
