import React, { useEffect, useRef } from 'react';
import { CrashPlayerState } from '../types';

interface CrashCanvasProps {
  currentMultiplier: number;
  crashPoint: number;
  isCrashed: boolean;
  isFlying: boolean;
  players: CrashPlayerState[];
  localPlayerId: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export const CrashCanvas: React.FC<CrashCanvasProps> = ({
  currentMultiplier,
  crashPoint,
  isCrashed,
  isFlying,
  players,
  localPlayerId,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const flameTimeRef = useRef<number>(0);

  // Dynamic falling crash animation state
  const crashPhysicsRef = useRef<{
    initialized: boolean;
    x: number;
    y: number;
    vx: number;
    vy: number;
    rotation: number;
    rotSpeed: number;
    landed: boolean;
    shockwave: number;
  }>({
    initialized: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    rotation: 0,
    rotSpeed: 0,
    landed: false,
    shockwave: 0,
  });

  // Store latest props in ref so RAF loop never gets recreated/stacked
  const propsRef = useRef({
    currentMultiplier,
    crashPoint,
    isCrashed,
    isFlying,
    players,
    localPlayerId,
  });

  useEffect(() => {
    propsRef.current = {
      currentMultiplier,
      crashPoint,
      isCrashed,
      isFlying,
      players,
      localPlayerId,
    };

    // Reset crash physics if new round started or not crashed
    if (!isCrashed) {
      crashPhysicsRef.current.initialized = false;
      crashPhysicsRef.current.landed = false;
      crashPhysicsRef.current.shockwave = 0;
    }
  }, [currentMultiplier, crashPoint, isCrashed, isFlying, players, localPlayerId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;
    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      const {
        currentMultiplier: mult,
        crashPoint: cPoint,
        isCrashed: crashed,
        isFlying: flying,
        players: curPlayers,
      } = propsRef.current;

      const safeMult = isFinite(mult) && mult >= 1 ? mult : 1.0;
      const width = canvas.width;
      const height = canvas.height;
      flameTimeRef.current += 0.05;

      const bgIntensity = Math.min(1, Math.max(0, (safeMult - 1) / 10));

      // 1. Draw dynamic background
      ctx.clearRect(0, 0, width, height);

      const grad = ctx.createLinearGradient(0, height, width, 0);
      if (crashed) {
        grad.addColorStop(0, 'rgba(40, 10, 10, 0.95)');
        grad.addColorStop(0.5, 'rgba(90, 20, 15, 0.95)');
        grad.addColorStop(1, 'rgba(180, 40, 20, 0.95)');
      } else {
        const r1 = Math.floor(15 + bgIntensity * 85);
        const g1 = Math.floor(18 + bgIntensity * 20);
        const b1 = Math.floor(35 - bgIntensity * 25);

        const r2 = Math.floor(25 + bgIntensity * 150);
        const g2 = Math.floor(22 + bgIntensity * 70);
        const b2 = Math.floor(45 - bgIntensity * 35);

        grad.addColorStop(0, `rgb(${r1}, ${g1}, ${b1})`);
        grad.addColorStop(0.7, `rgb(${r2}, ${g2}, ${b2})`);
        grad.addColorStop(
          1,
          flying && safeMult > 5 ? 'rgba(235, 120, 30, 0.95)' : 'rgba(45, 30, 60, 0.95)'
        );
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // 2. Draw subtle grid lines
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.07)';
      ctx.lineWidth = 1;
      const gridSpacingY = height / 6;
      for (let y = height - gridSpacingY; y > 0; y -= gridSpacingY) {
        ctx.beginPath();
        ctx.moveTo(40, y);
        ctx.lineTo(width - 20, y);
        ctx.stroke();
      }

      // Origin and plotting bounds
      const startX = 50;
      const startY = height - 45;
      const maxPlotW = width - 110;
      const maxPlotH = height - 80;

      // Coordinate mapping
      const maxDisplayMult = Math.max(10, safeMult * 1.25);
      const getCoord = (m: number) => {
        const safeVal = Math.max(1, isFinite(m) ? m : 1);
        const logCurrent = Math.log(safeVal);
        const logMax = Math.log(Math.max(1.05, maxDisplayMult));
        const norm = Math.min(1, Math.max(0, logCurrent / logMax));
        const px = startX + norm * maxPlotW;
        const py = startY - Math.pow(norm, 0.9) * maxPlotH;
        return { x: px, y: py };
      };

      const currentCoord = getCoord(safeMult);

      // 3. Draw curve glow & line
      if (safeMult > 1.01 || flying || crashed) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(startX, startY);

        const steps = 60;
        for (let i = 1; i <= steps; i++) {
          const stepM = 1 + (safeMult - 1) * (i / steps);
          const c = getCoord(stepM);
          ctx.lineTo(c.x, c.y);
        }

        // Fill area under curve
        ctx.lineTo(currentCoord.x, startY);
        ctx.closePath();
        const areaGrad = ctx.createLinearGradient(0, startY, 0, currentCoord.y);
        areaGrad.addColorStop(0, 'rgba(232, 200, 74, 0.02)');
        areaGrad.addColorStop(
          1,
          crashed ? 'rgba(220, 60, 40, 0.25)' : 'rgba(255, 170, 0, 0.22)'
        );
        ctx.fillStyle = areaGrad;
        ctx.fill();

        // Stroke line with fiery glow
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        for (let i = 1; i <= steps; i++) {
          const stepM = 1 + (safeMult - 1) * (i / steps);
          const c = getCoord(stepM);
          ctx.lineTo(c.x, c.y);
        }

        ctx.lineWidth = 4;
        ctx.strokeStyle = crashed ? '#e53e3e' : '#ffd700';
        ctx.shadowColor = crashed ? 'rgba(255, 50, 0, 0.8)' : 'rgba(255, 200, 0, 0.9)';
        ctx.shadowBlur = 14;
        ctx.stroke();
        ctx.restore();
      }

      // 4. Draw cashout markers for players
      // Privacy rule: During active flight, only show marker for localPlayerId!
      if (curPlayers && curPlayers.length > 0) {
        curPlayers.forEach(p => {
          const isMe = p.id === propsRef.current.localPlayerId;
          // Hide opponent cashout during flight to keep secrecy
          if (!crashed && flying && !isMe) {
            return;
          }

          if (p.cashedOutAt && p.cashedOutAt <= safeMult) {
            const markCoord = getCoord(p.cashedOutAt);
            ctx.save();
            ctx.beginPath();
            ctx.arc(markCoord.x, markCoord.y, 6, 0, Math.PI * 2);
            ctx.fillStyle = p.color || '#50e3c2';
            ctx.shadowColor = p.color || '#50e3c2';
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Pill tag
            const label = `${p.name.split(' ')[0]}: x${p.cashedOutAt.toFixed(2)}`;
            ctx.font = 'bold 10px "Cinzel", serif, sans-serif';
            const textW = ctx.measureText(label).width;
            const pillX = Math.min(width - textW - 20, Math.max(10, markCoord.x - textW / 2));
            const pillY = markCoord.y - 18;

            ctx.fillStyle = 'rgba(20, 20, 25, 0.88)';
            ctx.beginPath();
            if (typeof ctx.roundRect === 'function') {
              ctx.roundRect(pillX - 6, pillY - 12, textW + 12, 18, 6);
            } else {
              ctx.rect(pillX - 6, pillY - 12, textW + 12, 18);
            }
            ctx.fill();
            ctx.strokeStyle = p.color || '#50e3c2';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.fillStyle = '#ffd700';
            ctx.fillText(label, pillX, pillY);
            ctx.restore();
          }
        });
      }

      // 5. Particles spawn & update (Smoke, embers & flames)
      if (flying && !crashed) {
        for (let i = 0; i < 2; i++) {
          particlesRef.current.push({
            x: currentCoord.x - 8 + (Math.random() * 10 - 5),
            y: currentCoord.y + 4 + (Math.random() * 10 - 5),
            vx: -1.5 - Math.random() * 2,
            vy: 0.5 + Math.random() * 2,
            radius: Math.random() * 4 + 2,
            color: Math.random() > 0.4 ? '#ff7700' : Math.random() > 0.5 ? '#ffd700' : '#ff2200',
            alpha: 0.9,
            life: 0,
            maxLife: 20 + Math.random() * 20,
          });
        }
      }

      // Draw & update particles
      particlesRef.current = particlesRef.current.filter(p => {
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.alpha = Math.max(0, 1 - p.life / p.maxLife);
        p.radius *= 0.97;

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, p.radius), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();

        return p.life < p.maxLife;
      });

      // 6. Draw Dragon Icon / Sprite & Falling Crash Physics Animation
      const wingFlap = Math.sin(flameTimeRef.current * 8) * 6;
      const groundY = height - 42;

      if (crashed) {
        // Initialize physics on first frame of crash
        if (!crashPhysicsRef.current.initialized) {
          crashPhysicsRef.current = {
            initialized: true,
            x: currentCoord.x,
            y: currentCoord.y,
            vx: 1.8,
            vy: -3.5, // Initial blast recoil upward
            rotation: 0.2,
            rotSpeed: 0.15,
            landed: false,
            shockwave: 0,
          };

          // Initial explosion burst at crash point
          for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            particlesRef.current.push({
              x: currentCoord.x,
              y: currentCoord.y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              radius: Math.random() * 6 + 3,
              color: Math.random() > 0.5 ? '#ff1100' : '#ffaa00',
              alpha: 1,
              life: 0,
              maxLife: 35 + Math.random() * 20,
            });
          }
        }

        const phys = crashPhysicsRef.current;

        if (!phys.landed) {
          // Physics step
          phys.x += phys.vx;
          phys.y += phys.vy;
          phys.vy += 0.28; // Gravity pulling dragon down
          phys.rotation += phys.rotSpeed;

          // Spawn heavy smoke and flame trail while falling
          for (let i = 0; i < 3; i++) {
            particlesRef.current.push({
              x: phys.x + (Math.random() * 12 - 6),
              y: phys.y + (Math.random() * 12 - 6),
              vx: -phys.vx * 0.4 + (Math.random() * 2 - 1),
              vy: -1 + (Math.random() * 2 - 1),
              radius: Math.random() * 5 + 3,
              color: Math.random() > 0.5 ? '#333333' : Math.random() > 0.5 ? '#ff4400' : '#ff9900',
              alpha: 0.9,
              life: 0,
              maxLife: 30,
            });
          }

          // Check if dragon hit the ground
          if (phys.y >= groundY) {
            phys.y = groundY;
            phys.landed = true;
            phys.shockwave = 1;

            // Ground impact explosion
            for (let i = 0; i < 25; i++) {
              const angle = -Math.PI * Math.random(); // upward semicircle burst
              const speed = Math.random() * 6 + 1.5;
              particlesRef.current.push({
                x: phys.x,
                y: groundY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: Math.random() * 5 + 2,
                color: Math.random() > 0.5 ? '#ff3300' : '#ffd700',
                alpha: 1,
                life: 0,
                maxLife: 35,
              });
            }
          }
        } else {
          // Landed state: expand shockwave ring on the ground
          if (phys.shockwave > 0 && phys.shockwave < 60) {
            phys.shockwave += 2.2;
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(phys.x, groundY, phys.shockwave, phys.shockwave * 0.35, 0, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 70, 20, ${Math.max(0, 1 - phys.shockwave / 60)})`;
            ctx.lineWidth = 3;
            ctx.shadowColor = '#ff2200';
            ctx.shadowBlur = 12;
            ctx.stroke();
            ctx.restore();
          }

          // Smoke continuously rising from downed dragon
          if (Math.random() < 0.4) {
            particlesRef.current.push({
              x: phys.x + (Math.random() * 16 - 8),
              y: groundY - 10,
              vx: (Math.random() - 0.5) * 0.8,
              vy: -1.2 - Math.random() * 0.8,
              radius: Math.random() * 5 + 3,
              color: '#444444',
              alpha: 0.7,
              life: 0,
              maxLife: 40,
            });
          }
        }

        // Draw falling or crashed dragon
        ctx.save();
        ctx.translate(phys.x, phys.y);
        ctx.rotate(phys.rotation);

        if (!phys.landed) {
          // Falling dragon with motion glow
          ctx.font = '36px serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.shadowColor = 'rgba(255, 50, 0, 0.95)';
          ctx.shadowBlur = 18;
          ctx.fillText('🐉', 0, 0);
          ctx.font = '22px serif';
          ctx.fillText('🔥', -12, -8);
        } else {
          // Downed dragon on ground
          ctx.font = '34px serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.shadowColor = 'rgba(255, 50, 0, 0.9)';
          ctx.shadowBlur = 15;
          ctx.fillText('🐉', 0, 0);
          ctx.font = '24px serif';
          ctx.fillText('💥', 0, -12);
          ctx.font = '16px serif';
          ctx.fillText('💫', 12, -24);
        }
        ctx.restore();

      } else {
        // Normal flying or prep dragon
        ctx.save();
        const dragonX = currentCoord.x;
        const dragonY = currentCoord.y;
        const angle = -0.35 + Math.sin(flameTimeRef.current * 4) * 0.05;
        ctx.translate(dragonX, dragonY);
        ctx.rotate(angle);

        const thrustGlow = ctx.createRadialGradient(-16, 8, 2, -16, 8, 22);
        thrustGlow.addColorStop(0, 'rgba(255, 230, 100, 0.9)');
        thrustGlow.addColorStop(0.5, 'rgba(255, 100, 0, 0.6)');
        thrustGlow.addColorStop(1, 'rgba(255, 0, 0, 0)');
        ctx.fillStyle = thrustGlow;
        ctx.beginPath();
        ctx.arc(-16, 8, 22, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '36px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = safeMult > 5 ? 'rgba(255, 100, 0, 0.95)' : 'rgba(255, 215, 0, 0.8)';
        ctx.shadowBlur = 18;
        ctx.fillText('🐉', 0, wingFlap * 0.5);
        ctx.restore();
      }

      animFrameId = requestAnimationFrame(render);
    };

    animFrameId = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      cancelAnimationFrame(animFrameId);
    };
  }, []); // Run single continuous loop on mount

  return (
    <div className="relative w-full h-full min-h-[260px] sm:min-h-[320px] rounded-2xl overflow-hidden border border-[#ffd700]/30 shadow-2xl bg-[#0e1018]">
      <canvas
        ref={canvasRef}
        width={700}
        height={380}
        className="w-full h-full object-cover block"
      />
    </div>
  );
};
