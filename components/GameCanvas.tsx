
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Bullet, Player, GameStatus } from '../types';

interface GameCanvasProps {
  status: GameStatus;
  onGameOver: (score: number) => void;
}

const BULLET_INITIAL_COUNT = 30; // Increased from 15
const BULLET_GROWTH_RATE = 4; // Increased from 1.5
const SCALING_INTERVAL_SEC = 2; // Faster ramp-up (was 5)
const MAX_BULLETS = 200; // Increased from 80
const PLAYER_RADIUS = 10; // Slightly smaller hitbox for better maneuverability in crowds
const BULLET_RADIUS = 5;

const GameCanvas: React.FC<GameCanvasProps> = ({ status, onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  
  // Game engine refs to avoid re-renders
  const gameStateRef = useRef({
    player: { x: 0, y: 0, radius: PLAYER_RADIUS, angle: 0 } as Player,
    bullets: [] as Bullet[],
    startTime: 0,
    lastTime: 0,
    mousePos: { x: 0, y: 0 }
  });

  const requestRef = useRef<number | undefined>(undefined);

  const createBullet = (width: number, height: number): Bullet => {
    const side = Math.floor(Math.random() * 4);
    let x = 0, y = 0;
    
    // Spawn from one of 4 sides
    if (side === 0) { x = Math.random() * width; y = -20; }
    else if (side === 1) { x = width + 20; y = Math.random() * height; }
    else if (side === 2) { x = Math.random() * width; y = height + 20; }
    else { x = -20; y = Math.random() * height; }

    const speed = 2.5 + Math.random() * 4.5; // Slightly faster (was 2-5)
    // Aim towards the general center area
    const targetX = width / 2 + (Math.random() - 0.5) * (width * 0.8);
    const targetY = height / 2 + (Math.random() - 0.5) * (height * 0.8);
    const angle = Math.atan2(targetY - y, targetX - x);

    return {
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: BULLET_RADIUS,
      color: `hsl(${Math.random() * 50 + 10}, 100%, 60%)` // Orange/Red tones
    };
  };

  const initGame = useCallback((width: number, height: number) => {
    gameStateRef.current.player = {
      x: width / 2,
      y: height / 2,
      radius: PLAYER_RADIUS,
      angle: 0
    };
    gameStateRef.current.mousePos = { x: width / 2, y: height / 2 };
    gameStateRef.current.bullets = [];
    gameStateRef.current.startTime = Date.now();
    
    // Initial bullets from edges
    for (let i = 0; i < BULLET_INITIAL_COUNT; i++) {
      gameStateRef.current.bullets.push(createBullet(width, height));
    }
    setScore(0);
  }, []);

  const update = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { player, bullets, mousePos, startTime } = gameStateRef.current;
    const currentTime = Date.now();
    const elapsed = (currentTime - startTime) / 1000;
    setScore(elapsed);

    // 1. Move player (smooth follow mouse)
    const dx = mousePos.x - player.x;
    const dy = mousePos.y - player.y;
    player.x += dx * 0.18; // Slightly more responsive
    player.y += dy * 0.18;
    player.angle = Math.atan2(dy, dx) + Math.PI / 2;

    // 2. Clear canvas with trail effect
    ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 3. Update & Draw Bullets
    let collision = false;
    bullets.forEach((b) => {
      b.x += b.vx;
      b.y += b.vy;

      // Respawn if out of bounds
      if (b.x < -60 || b.x > canvas.width + 60 || b.y < -60 || b.y > canvas.height + 60) {
        const nb = createBullet(canvas.width, canvas.height);
        Object.assign(b, nb);
      }

      // Check collision
      const dist = Math.hypot(b.x - player.x, b.y - player.y);
      if (dist < player.radius + b.radius - 3) {
        collision = true;
      }

      // Draw bullet
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fillStyle = b.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = b.color;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // 4. Draw Player (Plane)
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    
    // Draw Plane Shape
    ctx.beginPath();
    ctx.moveTo(0, -player.radius * 1.2);
    ctx.lineTo(player.radius, player.radius);
    ctx.lineTo(0, player.radius * 0.4);
    ctx.lineTo(-player.radius, player.radius);
    ctx.closePath();
    ctx.fillStyle = '#22d3ee'; // Cyan
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#22d3ee';
    ctx.fill();
    ctx.restore();

    // 5. Difficulty Scaling: Spawn more bullets over time
    const targetCount = BULLET_INITIAL_COUNT + Math.floor(elapsed / SCALING_INTERVAL_SEC) * BULLET_GROWTH_RATE;
    const currentTarget = Math.min(targetCount, MAX_BULLETS);
    
    if (bullets.length < currentTarget) {
       bullets.push(createBullet(canvas.width, canvas.height));
    }

    if (collision) {
      onGameOver(elapsed);
      return;
    }

    requestRef.current = requestAnimationFrame(update);
  }, [onGameOver]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      gameStateRef.current.mousePos = { x: e.clientX, y: e.clientY };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        e.preventDefault(); // Prevent scrolling while playing
        gameStateRef.current.mousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    handleResize();

    if (status === GameStatus.PLAYING) {
      initGame(canvas.width, canvas.height);
      requestRef.current = requestAnimationFrame(update);
    } else {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [status, initGame, update]);

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="block w-full h-full" />
      {status === GameStatus.PLAYING && (
        <div className="absolute top-8 left-0 right-0 text-center pointer-events-none">
          <div className="text-5xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] font-mono italic">
            {score.toFixed(2)}<span className="text-xl ml-1 opacity-60">s</span>
          </div>
          <div className="text-xs text-red-500 font-bold uppercase tracking-[0.3em] mt-2 animate-pulse">
            Density: {Math.floor((gameStateRef.current.bullets.length / MAX_BULLETS) * 100)}%
          </div>
        </div>
      )}
    </div>
  );
};

export default GameCanvas;
