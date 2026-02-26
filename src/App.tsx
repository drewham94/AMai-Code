/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserProfile, PracticeSession } from './types';
import { Onboarding } from './components/Onboarding';
import { Dashboard } from './components/Dashboard';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, sessionsRes] = await Promise.all([
          fetch('/api/profile'),
          fetch('/api/sessions')
        ]);
        
        const profileData = await profileRes.json();
        const sessionsData = await sessionsRes.json();
        
        setProfile(profileData);
        setSessions(sessionsData);
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
      onNewSession={handleNewSession} 
    />
  );
}

