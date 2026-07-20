import { useState, useEffect } from 'react';

/** Formate un nombre de secondes en MM:SS. */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/** Chronomètre à décompte réutilisable (soutenance, entretiens...). */
export function useExamTimer(initialSeconds: number = 35 * 60) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (timerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timeLeft]);

  const toggleTimer = () => setTimerRunning((r) => !r);
  const resetTimer = (seconds: number = initialSeconds) => {
    setTimerRunning(false);
    setTimeLeft(seconds);
  };

  return { timeLeft, setTimeLeft, timerRunning, setTimerRunning, toggleTimer, resetTimer };
}
