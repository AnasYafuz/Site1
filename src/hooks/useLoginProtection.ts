import { useState, useCallback } from 'react';

interface LoginAttempt {
  count: number;
  lockedUntil: number | null;
  lockCount: number;
}

const STORAGE_KEY_PREFIX = 'login_attempts_';
const MAX_ATTEMPTS = 5;
const FIRST_LOCK_DURATION = 15 * 60 * 1000; // 15 minutes
const SECOND_LOCK_DURATION = 30 * 60 * 1000; // 30 minutes

export const useLoginProtection = (loginType: 'admin' | 'user') => {
  const storageKey = STORAGE_KEY_PREFIX + loginType;

  const getAttempts = useCallback((): LoginAttempt => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return { count: 0, lockedUntil: null, lockCount: 0 };
      }
    }
    return { count: 0, lockedUntil: null, lockCount: 0 };
  }, [storageKey]);

  const saveAttempts = useCallback((attempts: LoginAttempt) => {
    localStorage.setItem(storageKey, JSON.stringify(attempts));
  }, [storageKey]);

  const [attempts, setAttempts] = useState<LoginAttempt>(getAttempts);

  const getRemainingLockTime = useCallback((): number => {
    const currentAttempts = getAttempts();
    if (currentAttempts.lockedUntil && currentAttempts.lockedUntil > Date.now()) {
      return Math.ceil((currentAttempts.lockedUntil - Date.now()) / 1000);
    }
    return 0;
  }, [getAttempts]);

  const isLocked = useCallback((): boolean => {
    const currentAttempts = getAttempts();
    if (currentAttempts.lockedUntil) {
      if (currentAttempts.lockedUntil > Date.now()) {
        return true;
      } else {
        // Lock expired, reset count but keep lockCount
        const newAttempts = { 
          count: 0, 
          lockedUntil: null, 
          lockCount: currentAttempts.lockCount 
        };
        saveAttempts(newAttempts);
        setAttempts(newAttempts);
        return false;
      }
    }
    return false;
  }, [getAttempts, saveAttempts]);

  const recordFailedAttempt = useCallback((): { locked: boolean; remainingAttempts: number } => {
    const currentAttempts = getAttempts();
    const newCount = currentAttempts.count + 1;

    if (newCount >= MAX_ATTEMPTS) {
      // Determine lock duration based on lock count
      const lockDuration = currentAttempts.lockCount >= 1 ? SECOND_LOCK_DURATION : FIRST_LOCK_DURATION;
      const newAttempts: LoginAttempt = {
        count: 0,
        lockedUntil: Date.now() + lockDuration,
        lockCount: currentAttempts.lockCount + 1
      };
      saveAttempts(newAttempts);
      setAttempts(newAttempts);
      return { locked: true, remainingAttempts: 0 };
    }

    const newAttempts = { 
      ...currentAttempts, 
      count: newCount 
    };
    saveAttempts(newAttempts);
    setAttempts(newAttempts);
    return { locked: false, remainingAttempts: MAX_ATTEMPTS - newCount };
  }, [getAttempts, saveAttempts]);

  const resetAttempts = useCallback(() => {
    const newAttempts = { count: 0, lockedUntil: null, lockCount: 0 };
    saveAttempts(newAttempts);
    setAttempts(newAttempts);
  }, [saveAttempts]);

  const formatRemainingTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  return {
    isLocked,
    recordFailedAttempt,
    resetAttempts,
    getRemainingLockTime,
    formatRemainingTime,
    attempts
  };
};

