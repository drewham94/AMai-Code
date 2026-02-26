/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserProfile, PracticeSession, Flashcard, FocusSession } from './types';
import { Onboarding } from './components/Onboarding';
import { Dashboard } from './components/Dashboard';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, sessionsRes, flashcardsRes, focusRes] = await Promise.all([
          fetch('/api/profile'),
          fetch('/api/sessions'),
          fetch('/api/flashcards'),
          fetch('/api/focus-sessions')
        ]);
        
        const profileData = await profileRes.json();
        const sessionsData = await sessionsRes.json();
        const flashcardsData = await flashcardsRes.json();
        const focusData = await focusRes.json();
        
        setProfile(profileRes.ok ? profileData : null);
        setSessions(Array.isArray(sessionsData) ? sessionsData : []);
        setFocusSessions(Array.isArray(focusData) ? focusData : []);
        setFlashcards(Array.isArray(flashcardsData) ? flashcardsData.map((f: any) => ({
          ...f,
          consecutiveCorrect: f.consecutiveCorrect ?? 0
        })) : []);
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleOnboardingComplete = async (newProfile: UserProfile) => {
    try {
      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProfile)
      });
      setProfile(newProfile);
    } catch (err) {
      console.error("Failed to save profile", err);
    }
  };

  const handleNewSession = async (session: PracticeSession) => {
    try {
      await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(session)
      });
      setSessions(prev => [session, ...prev]);
    } catch (err) {
      console.error("Failed to save session", err);
    }
  };

  const handleUpdateFlashcards = async (newFlashcards: Flashcard[]) => {
    // This is a helper to update local state and sync with server
    // In a real app, we'd probably have individual POST/DELETE endpoints
    setFlashcards(newFlashcards);
    try {
      await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFlashcards)
      });
    } catch (err) {
      console.error("Failed to sync flashcards", err);
    }
  };

  const handleAddFlashcard = async (card: Flashcard) => {
    try {
      await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([...flashcards, card])
      });
      setFlashcards(prev => [...prev, card]);
    } catch (err) {
      console.error("Failed to save flashcard", err);
    }
  };

  const handleAddFocusSession = async (session: FocusSession) => {
    try {
      await fetch('/api/focus-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(session)
      });
      setFocusSessions(prev => [...prev, session]);
    } catch (err) {
      console.error("Failed to save focus session", err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  if (!profile) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <Dashboard 
      profile={profile} 
      sessions={sessions} 
      flashcards={flashcards}
      focusSessions={focusSessions}
      onNewSession={handleNewSession} 
      onAddFlashcard={handleAddFlashcard}
      onUpdateFlashcards={handleUpdateFlashcards}
      onAddFocusSession={handleAddFocusSession}
    />
  );
}

