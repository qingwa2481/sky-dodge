
import React, { useState, useEffect, useCallback } from 'react';
import GameCanvas from './components/GameCanvas';
import { GameStatus, GameState } from './types';
import { getPerformanceAnalysis } from './services/geminiService';
import { Trophy, Play, RotateCcw, Twitter, Github, Rocket } from 'lucide-react';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    status: GameStatus.START,
    score: 0,
    highScore: parseFloat(localStorage.getItem('sky-dodge-highscore') || '0'),
    analysis: null
  });

  const startGame = () => {
    setGameState(prev => ({ ...prev, status: GameStatus.PLAYING, score: 0, analysis: null }));
  };

  const handleGameOver = useCallback(async (finalScore: number) => {
    setGameState(prev => {
      const newHigh = Math.max(prev.highScore, finalScore);
      localStorage.setItem('sky-dodge-highscore', newHigh.toString());
      return {
        ...prev,
        status: GameStatus.GAMEOVER,
        score: finalScore,
        highScore: newHigh
      };
    });

    // Fetch AI Analysis
    const analysis = await getPerformanceAnalysis(finalScore);
    setGameState(prev => ({ ...prev, analysis }));
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-900 select-none">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800 to-slate-950 opacity-50 pointer-events-none" />
      
      {/* Game Layer */}
      <GameCanvas status={gameState.status} onGameOver={handleGameOver} />

      {/* Start UI */}
      {gameState.status === GameStatus.START && (
        <div className="absolute inset-0 flex items-center justify-center z-50 p-6 bg-slate-950/40 backdrop-blur-sm">
          <div className="max-w-md w-full bg-slate-900/80 border border-slate-700 p-8 rounded-3xl shadow-2xl text-center">
            <div className="mb-6 flex justify-center">
              <div className="p-4 bg-cyan-500/10 rounded-full animate-pulse">
                <Rocket className="w-12 h-12 text-cyan-400" />
              </div>
            </div>
            <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
              SKY <span className="text-cyan-400">DODGE</span>
            </h1>
            <p className="text-slate-400 mb-8 text-sm leading-relaxed">
              你是男人就撑过 20 秒！<br/>
              移动鼠标/手指控制小飞机，躲避红色子弹。
            </p>
            
            <button
              onClick={startGame}
              className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-cyan-600 font-pj rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-600 hover:bg-cyan-500 w-full"
            >
              <Play className="mr-2 fill-current" />
              开始挑战
            </button>

            {gameState.highScore > 0 && (
              <div className="mt-6 flex items-center justify-center text-amber-400 gap-2 font-mono">
                <Trophy className="w-4 h-4" />
                <span>最高纪录: {gameState.highScore.toFixed(2)}s</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Game Over UI */}
      {gameState.status === GameStatus.GAMEOVER && (
        <div className="absolute inset-0 flex items-center justify-center z-50 p-6 bg-slate-950/60 backdrop-blur-md animate-in fade-in zoom-in duration-300">
          <div className="max-w-md w-full bg-slate-900 border-2 border-slate-700/50 p-8 rounded-3xl shadow-2xl text-center">
            <h2 className="text-2xl font-bold text-slate-400 mb-1">挑战结束</h2>
            <div className="text-6xl font-black text-white mb-4 font-mono tracking-tighter">
              {gameState.score.toFixed(2)}<span className="text-2xl ml-1 text-slate-500">s</span>
            </div>

            {gameState.score >= 20 ? (
              <div className="mb-6 p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg text-sm font-bold uppercase tracking-widest">
                🏆 你是真正的男人！
              </div>
            ) : (
              <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm font-bold uppercase tracking-widest">
                还需努力，男人要持久！
              </div>
            )}

            {gameState.analysis && (
              <div className="mb-8 p-4 bg-slate-800/50 rounded-xl text-slate-300 text-sm italic border-l-4 border-cyan-500">
                “{gameState.analysis}”
                <div className="mt-2 text-[10px] text-slate-500 uppercase font-bold text-right">— Gemini 飞行助手</div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={startGame}
                className="flex items-center justify-center px-6 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-colors col-span-2"
              >
                <RotateCcw className="mr-2 w-5 h-5" />
                重新挑战
              </button>
            </div>

            <div className="mt-8 flex items-center justify-center gap-6 text-slate-500">
               <div className="flex items-center gap-1 text-xs">
                  <Trophy className="w-3 h-3 text-amber-500" />
                  <span>最佳: {gameState.highScore.toFixed(2)}s</span>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center text-slate-600 text-[10px] uppercase tracking-[0.2em] pointer-events-none">
        Developed with React & Gemini API
      </div>
    </div>
  );
};

export default App;
