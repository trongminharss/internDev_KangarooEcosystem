import {useCallback, useEffect, useState} from 'react';

export const useCountdown = (initialSeconds: number = 30) => {
  const [seconds, setSeconds] = useState(initialSeconds);
  const isDone = seconds <= 0;

  useEffect(() => {
    if (isDone) {
      return;
    }
    const timer = setInterval(() => {
      setSeconds(s => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [isDone]);

  const restart = useCallback(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  return {seconds, isDone, restart};
};

export default useCountdown;
