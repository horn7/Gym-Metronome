import React, { useEffect, useRef, useState } from 'react'

export default function GymTimer() {
  const [status, setStatus] = useState('paused'); // 'running', 'paused', 'restart'
  const [time, setTime] = useState(0); // seconds since start
  const [exerciseTime, setExerciseTime] = useState(0); // seconds since start
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [setIndex, setSetIndex] = useState(1);
  const [cycles, setCycles] = useState(0);
  const intervalRef = useRef(null);
  const audioCtxRef = useRef(null);

  const workoutPlan = [
    { exercise: 1, sets: 4 },
    { exercise: 2, sets: 3 },
    { exercise: 3, sets: 3 }
  ];

  // Start or resume
  const handleStart = () => {
    if (status === 'restart') {
      setTime(0);
      setExerciseTime(0);
      setExerciseIndex(0);
      setSetIndex(1);
      setCycles(0);
    }
    setStatus('running');
  };

  useEffect(() => {
    if (status === 'restart') {
      handleStart();
    }
  }, [status]);

  const handlePause = () => setStatus('paused');
  const handleRestart = () => setStatus('restart');

  // Advance set manually
  const handleNextSet = () => {
    advanceSet();
  };

  // Advance logic
  const advanceSet = () => {
    setExerciseTime(0);
    const current = workoutPlan[exerciseIndex];
    if (setIndex < current.sets) {
      setSetIndex(prev => prev + 1);
    } else {
      const nextExercise = (exerciseIndex + 1) % workoutPlan.length;
      if (nextExercise === 0) setCycles(prev => prev + 1);
      setExerciseIndex(nextExercise);
      setSetIndex(1);
    }
  };

  // Timer effect
  useEffect(() => {
    if (status === 'running') {
      intervalRef.current = setInterval(() => {
        setTime(t => t + 1)
        setExerciseTime(t => t + 1)
      }, 1000);
    } else clearInterval(intervalRef.current);
    return () => clearInterval(intervalRef.current);
  }, [status]);

  // Auto advance every 2 min and beep
  useEffect(() => {
    if (status !== 'running') return;
    if (time > 0 && time % 120 === 0) {
      playBeep();
      flashScreen();
      advanceSet();
    }
  }, [time, status]);

  const playBeep = () => {
  try {
    if (!audioCtxRef.current)
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = audioCtxRef.current;
    const o = ctx.createOscillator();
    const g = ctx.createGain();

    o.type = 'sine';
    o.frequency.setValueAtTime(880, ctx.currentTime);

    // Zwiększamy głośność i długość
    g.gain.setValueAtTime(0.002, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + 0.05); // szybciej i głośniej
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6); // wolniej wygasa

    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.65); // dłuższy czas działania
  } catch (e) {}
};

  const flashScreen = () => {
    document.documentElement.classList.add('flash');
    setTimeout(() => document.documentElement.classList.remove('flash'), 700);
  };

  return (
    <div className="w-full max-w-lg ">
      <div className="backdrop-blur-md bg-neutral-800/60 rounded-2xl shadow-xl p-6 border border-white/50">
        <h1 className="text-2xl font-bold mb-4 text-center">Gym Metronome</h1>

        <div className="flex justify-between mb-4 text-white">
          <div>
            <div className="text-xs text-neutral-300">Current</div>
            <div className="text-lg font-semibold">
              Exercise {workoutPlan[exerciseIndex].exercise} • Set {setIndex}/{workoutPlan[exerciseIndex].sets}
            </div>
          </div>
          <div>
          <div className="text-xs text-neutral-300 text-white/50">NEXT</div>
          <div className="text-lg font-semibold text-white/50">
            {(() => {
              const current = workoutPlan[exerciseIndex];
              let nextExerciseIndex = exerciseIndex;
              let nextSet = setIndex;

              if (nextSet < current.sets) {
                nextSet += 1;
              } else {
                nextExerciseIndex = (exerciseIndex + 1) % workoutPlan.length;
                nextSet = 1;
              }
              const next = workoutPlan[nextExerciseIndex];
              return `Exercise ${next.exercise} • Set ${nextSet}/${next.sets}`;
            })()}
          </div>
        </div>
          <div className="text-right">
            <div className="text-xs text-neutral-300">Cycles (mussle set)</div>
            <div className="text-lg font-mono font-semibold">{cycles+1}</div>
          </div>
        </div>

        <div className="bg-neutral-900 rounded-xl p-4 text-center mb-4">
          <div className="text-5xl font-mono font-bold">
            {Math.floor(exerciseTime / 60)}:{(exerciseTime % 60).toString().padStart(2,'0')}
          </div>
          <div className="text-xs text-neutral-400 mt-2">Total time: {Math.floor(time / 60)}:{(time % 60).toString().padStart(2,'0')}</div>
        </div>

        <div className="flex gap-3 justify-center">
          {status !== 'running' ? (
            <button onClick={handleStart} className="px-4 py-2 rounded-lg bg-green-600/30 hover:bg-green-700 font-semibold">Start</button>
          ) : (
            <button onClick={handlePause} className="px-4 py-2 rounded-lg bg-yellow-600/30 hover:bg-yellow-700 font-semibold">Pause</button>
          )}
          <button onClick={handleNextSet} className="px-4 py-2 rounded-lg bg-blue-600/30 hover:bg-blue-700 font-semibold">Next Set</button>
          <button onClick={handleRestart} className="px-4 py-2 rounded-lg bg-red-600/30 hover:bg-red-700 font-semibold">Restart</button>
        </div>

        <div className="mt-4 text-sm text-neutral-400">
          Plan: ex1×4, ex2×3, ex3×3 — loop x2. Beep every 2 minutes. Pause preserves state.
        </div>
      </div>
    </div>
  );
}
