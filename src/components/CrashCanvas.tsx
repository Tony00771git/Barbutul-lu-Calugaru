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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const flameTimeRef = useRef<number>(0);

  // Dynamic falling crash & stock plummet animation state
  const crashPhysicsRef = useRef<{
    initialized: boolean;
    peakX: number;
    peakY: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    rotation: number;
    rotSpeed: number;
    landed: boolean;
    shockwave: number;
    shakeIntensity: number;
  }>({
    initialized: false,
    peakX: 0,
    peakY: 0,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    rotation: 0,
    rotSpeed: 0,
    landed: false,
    shockwave: 0,
    shakeIntensity: 0,
  });

  // Store latest props in ref so RAF loop runs at full native refresh rate without re-mounting
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
      crashPhysicsRef.current.shakeIntensity = 0;
    }
  }, [currentMultiplier, crashPoint, isCrashed, isFlying, players, localPlayerId]);

  // Handle Dynamic Sizing and Device Pixel Ratio for Retina Crispness
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let resizeRafId: number | null = null;

    const updateSize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const w = container.clientWidth || 700;
      const h = container.clientHeight || 380;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      const targetW = Math.max(100, Math.floor(w * dpr));
      const targetH = Math.max(100, Math.floor(h * dpr));

      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }
    };

    updateSize();

    const ro = new ResizeObserver(() => {
      if (resizeRafId !== null) {
        cancelAnimationFrame(resizeRafId);
      }
      resizeRafId = window.requestAnimationFrame(() => {
        updateSize();
        resizeRafId = null;
      });
    });
    ro.observe(container);

    return () => {
      if (resizeRafId !== null) {
        cancelAnimationFrame(resizeRafId);
      }
      ro.disconnect();
    };
  }, []);

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
        isCrashed: crashed,
        isFlying: flying,
        players: curPlayers,
        crashPoint: targetCrashPoint,
        localPlayerId: myId,
      } = propsRef.current;

      const safeMult = isFinite(mult) && mult >= 1 ? mult : 1.0;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      flameTimeRef.current += 0.05;

      ctx.save();
      ctx.scale(dpr, dpr);

      // 0. Screen shake on ground impact
      const phys = crashPhysicsRef.current;
      if (phys.shakeIntensity > 0.1) {
        const shakeX = (Math.random() - 0.5) * phys.shakeIntensity;
        const shakeY = (Math.random() - 0.5) * phys.shakeIntensity;
        ctx.translate(shakeX, shakeY);
        phys.shakeIntensity *= 0.84;
      } else {
        phys.shakeIntensity = 0;
      }

      const bgIntensity = Math.min(1, Math.max(0, (safeMult - 1) / 10));

      // 1. Draw dynamic background
      ctx.clearRect(0, 0, width, height);

      const grad = ctx.createLinearGradient(0, height, width, 0);
      if (crashed) {
        grad.addColorStop(0, 'rgba(38, 10, 10, 0.96)');
        grad.addColorStop(0.4, 'rgba(75, 15, 12, 0.96)');
        grad.addColorStop(1, 'rgba(140, 25, 15, 0.96)');
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

      // 2. Draw subtle grid lines & price axes
      ctx.strokeStyle = crashed ? 'rgba(255, 60, 40, 0.12)' : 'rgba(255, 215, 0, 0.07)';
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

      // 3. Draw ascending curve & golden glow
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

        // Fill area under ascending curve
        ctx.lineTo(currentCoord.x, startY);
        ctx.closePath();
        const areaGrad = ctx.createLinearGradient(0, startY, 0, currentCoord.y);
        areaGrad.addColorStop(0, 'rgba(232, 200, 74, 0.02)');
        areaGrad.addColorStop(
          1,
          crashed ? 'rgba(220, 50, 30, 0.18)' : 'rgba(255, 170, 0, 0.22)'
        );
        ctx.fillStyle = areaGrad;
        ctx.fill();

        // Stroke ascending line
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        for (let i = 1; i <= steps; i++) {
          const stepM = 1 + (safeMult - 1) * (i / steps);
          const c = getCoord(stepM);
          ctx.lineTo(c.x, c.y);
        }

        ctx.lineWidth = 4;
        ctx.strokeStyle = crashed ? '#ff4d4d' : '#ffd700';
        ctx.shadowColor = crashed ? 'rgba(255, 40, 20, 0.8)' : 'rgba(255, 200, 0, 0.9)';
        ctx.shadowBlur = 14;
        ctx.stroke();
        ctx.restore();
      }

      // Initialize crash physics on first frame of crash
      if (crashed) {
        if (!phys.initialized) {
          phys.initialized = true;
          phys.peakX = currentCoord.x;
          phys.peakY = currentCoord.y;
          phys.x = currentCoord.x;
          phys.y = currentCoord.y;
          phys.vx = 1.2 + Math.random() * 0.8;
          phys.vy = 2.2; // Immediate nose-dive plunge downward
          phys.rotation = 0.85; // Steep downward dive angle (like a plunging stock)
          phys.rotSpeed = 0.04;
          phys.landed = false;
          phys.shockwave = 0;
          phys.shakeIntensity = 0;

          // Initial burst explosion at peak
          for (let k = 0; k < 30; k++) {
            const burstAngle = Math.random() * Math.PI * 2;
            const burstSpeed = 2 + Math.random() * 6;
            particlesRef.current.push({
              x: phys.peakX,
              y: phys.peakY,
              vx: Math.cos(burstAngle) * burstSpeed,
              vy: Math.sin(burstAngle) * burstSpeed,
              radius: 2 + Math.random() * 4,
              color: Math.random() > 0.4 ? '#ff3b30' : '#ffcc00',
              alpha: 1.0,
              life: 0,
              maxLife: 25 + Math.random() * 15,
            });
          }
        }

        // Apply downward gravity plunge if in flight/fall
        if (!phys.landed) {
          phys.vy += 0.65; // Strong gravity acceleration
          phys.x += phys.vx;
          phys.y += phys.vy;
          phys.rotation = Math.min(1.4, phys.rotation + 0.03); // Tilt further downward into dive

          // Trailing black smoke and burning sparks behind the falling dragon
          if (particlesRef.current.length < 90) {
            particlesRef.current.push({
              x: phys.x - Math.cos(phys.rotation) * 16 + (Math.random() - 0.5) * 6,
              y: phys.y - Math.sin(phys.rotation) * 16 + (Math.random() - 0.5) * 6,
              vx: -phys.vx * 0.4 + (Math.random() - 0.5) * 2,
              vy: -2 + (Math.random() - 0.5) * 2,
              radius: 3 + Math.random() * 4,
              color: Math.random() > 0.5 ? 'rgba(255, 60, 20, 0.9)' : 'rgba(30, 20, 20, 0.8)',
              alpha: 1.0,
              life: 0,
              maxLife: 20 + Math.random() * 10,
            });
          }

          // Floor / ground impact check
          if (phys.y >= startY) {
            phys.y = startY;
            phys.landed = true;
            phys.rotSpeed = 0;
            phys.rotation = 0;
            phys.shockwave = 1;
            phys.shakeIntensity = 8.5; // Trigger camera shake on impact

            // Fiery ground impact explosion: burst of fiery sparks & rising smoke
            for (let k = 0; k < 45; k++) {
              const impactAngle = Math.PI + (Math.random() - 0.5) * 1.8; // Fan upwards
              const impactSpeed = 2 + Math.random() * 7;
              const isEmber = Math.random() > 0.35;
              particlesRef.current.push({
                x: phys.x + (Math.random() - 0.5) * 10,
                y: startY,
                vx: Math.cos(impactAngle) * impactSpeed,
                vy: Math.sin(impactAngle) * impactSpeed,
                radius: isEmber ? 2.5 + Math.random() * 3.5 : 4 + Math.random() * 5,
                color: isEmber
                  ? (Math.random() > 0.5 ? '#ffea00' : '#ff4400')
                  : 'rgba(50, 30, 30, 0.85)',
                alpha: 1.0,
                life: 0,
                maxLife: 30 + Math.random() * 20,
              });
            }
          }
        }

        // Draw Stock Market Crash Plummet Line (Red Drop Trace 📉)
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(phys.peakX, phys.peakY);
        ctx.lineTo(phys.x, phys.y);
        ctx.lineWidth = 3.5;
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = '#ff2a2a';
        ctx.shadowColor = 'rgba(255, 0, 0, 0.9)';
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.setLineDash([]); // Reset line dash

        // Red danger drop shadow fill under plummet
        ctx.beginPath();
        ctx.moveTo(phys.peakX, phys.peakY);
        ctx.lineTo(phys.x, phys.y);
        ctx.lineTo(phys.x, startY);
        ctx.lineTo(phys.peakX, startY);
        ctx.closePath();
        const dropGrad = ctx.createLinearGradient(0, phys.peakY, 0, startY);
        dropGrad.addColorStop(0, 'rgba(255, 30, 20, 0.35)');
        dropGrad.addColorStop(1, 'rgba(180, 0, 0, 0.05)');
        ctx.fillStyle = dropGrad;
        ctx.fill();

        // Draw Peak Crash Node & Badge
        ctx.beginPath();
        ctx.arc(phys.peakX, phys.peakY, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ff2222';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        const crashBadge = `💥 CRASH x${(targetCrashPoint || safeMult).toFixed(2)}`;
        ctx.font = 'bold 11px "Cinzel", serif, sans-serif';
        const badgeW = ctx.measureText(crashBadge).width;
        const badgeX = Math.min(width - badgeW - 15, Math.max(10, phys.peakX - badgeW / 2));
        const badgeY = phys.peakY - 14;

        ctx.fillStyle = 'rgba(180, 15, 15, 0.92)';
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(badgeX - 6, badgeY - 12, badgeW + 12, 18, 6);
        } else {
          ctx.rect(badgeX - 6, badgeY - 12, badgeW + 12, 18);
        }
        ctx.fill();
        ctx.strokeStyle = '#ff4d4d';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText(crashBadge, badgeX, badgeY + 1);
        ctx.restore();
      }

      // 4. Draw cashout markers for players
      if (curPlayers && curPlayers.length > 0) {
        curPlayers.forEach(p => {
          const isMe = p.id === myId;
          // Hide opponent cashout during active flight to keep secrecy
          if (!crashed && flying && !isMe) {
            return;
          }

          if (p.cashedOutAt && p.cashedOutAt <= (crashed ? targetCrashPoint || safeMult : safeMult)) {
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

            ctx.fillStyle = 'rgba(20, 20, 25, 0.9)';
            ctx.beginPath();
            if (typeof ctx.roundRect === 'function') {
              ctx.roundRect(pillX - 6, pillY - 12, textW + 12, 18, 6);
            } else {
              ctx.rect(pillX - 6, pillY - 12, textW + 12, 18);
            }
            ctx.fill();
            ctx.strokeStyle = p.color || '#50e3c2';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'left';
            ctx.fillText(label, pillX, pillY + 1);
            ctx.restore();
          }
        });
      }

      // 5. Emit fiery exhaust particles during flight
      if (flying && !crashed) {
        const pCount = safeMult > 5 ? 3 : 2;
        for (let i = 0; i < pCount; i++) {
          if (particlesRef.current.length < 80) {
            const angle = Math.PI * 0.85 + (Math.random() - 0.5) * 0.7;
            const speed = 2 + Math.random() * (safeMult > 5 ? 5 : 3);
            const isSpark = Math.random() > 0.6;
            particlesRef.current.push({
              x: currentCoord.x - 12,
              y: currentCoord.y + 4,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              radius: isSpark ? 1.5 + Math.random() * 2 : 3 + Math.random() * 4,
              color: isSpark
                ? 'rgba(255, 240, 150, 0.95)'
                : Math.random() > 0.4
                ? 'rgba(255, 120, 20, 0.85)'
                : 'rgba(235, 40, 20, 0.75)',
              alpha: 1.0,
              life: 0,
              maxLife: 20 + Math.random() * 15,
            });
          }
        }
      }

      // 6. Draw & update particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        p.alpha = Math.max(0, 1 - p.life / p.maxLife);

        if (p.life >= p.maxLife || p.alpha <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 7. Ground Impact Shockwaves & Scorch Mark
      if (crashed && phys.landed) {
        // Scorch Crater Mark
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(phys.x, startY + 4, 36, 9, 0, 0, Math.PI * 2);
        const craterGrad = ctx.createRadialGradient(phys.x, startY + 4, 2, phys.x, startY + 4, 36);
        craterGrad.addColorStop(0, 'rgba(20, 10, 10, 0.9)');
        craterGrad.addColorStop(0.7, 'rgba(80, 20, 10, 0.5)');
        craterGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = craterGrad;
        ctx.fill();
        ctx.restore();

        // Expanding Fiery Shockwave Ring
        if (phys.shockwave > 0 && phys.shockwave < 60) {
          phys.shockwave += 2.8;
          ctx.save();
          ctx.beginPath();
          ctx.ellipse(phys.x, startY, phys.shockwave * 2.2, phys.shockwave * 0.7, 0, 0, Math.PI * 2);
          const alphaWave = Math.max(0, 1 - phys.shockwave / 60);
          ctx.strokeStyle = `rgba(255, 80, 20, ${alphaWave})`;
          ctx.lineWidth = 3.5;
          ctx.shadowColor = '#ff3b30';
          ctx.shadowBlur = 12;
          ctx.stroke();

          // Inner shockwave
          ctx.beginPath();
          ctx.ellipse(phys.x, startY, phys.shockwave * 1.4, phys.shockwave * 0.45, 0, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 220, 80, ${alphaWave * 0.8})`;
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();
        }
      }

      // 8. Render Dragon Character
      const wingFlap = Math.sin(flameTimeRef.current * 12) * 6;

      if (crashed) {
        // Fallen / Plummeting Dragon
        ctx.save();
        ctx.translate(phys.x, phys.y);
        ctx.rotate(phys.rotation);

        if (!phys.landed) {
          // Fiery dive aura
          const diveGlow = ctx.createRadialGradient(0, 0, 4, 0, 0, 36);
          diveGlow.addColorStop(0, 'rgba(255, 80, 20, 0.9)');
          diveGlow.addColorStop(0.6, 'rgba(180, 30, 10, 0.4)');
          diveGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = diveGlow;
          ctx.beginPath();
          ctx.arc(0, 0, 36, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.font = '36px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(255, 30, 0, 0.9)';
        ctx.shadowBlur = 22;
        ctx.fillText('🐉', 0, 0);

        if (phys.landed) {
          // Impact explosion burst symbol & dizzy stars
          ctx.font = '30px serif';
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#ffcc00';
          ctx.fillText('💥', 0, -14);

          const dizzyAngle = flameTimeRef.current * 4;
          const starX = Math.cos(dizzyAngle) * 14;
          const starY = -28 + Math.sin(dizzyAngle) * 4;
          ctx.font = '16px serif';
          ctx.shadowBlur = 8;
          ctx.shadowColor = '#ffffaa';
          ctx.fillText('💫', starX, starY);
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

      ctx.restore();
      animFrameId = requestAnimationFrame(render);
    };

    animFrameId = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      cancelAnimationFrame(animFrameId);
    };
  }, []); // Run single continuous loop on mount

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[280px] xs:h-[320px] sm:h-[380px] md:h-[420px] rounded-2xl overflow-hidden border border-[#ffd700]/30 shadow-2xl bg-[#0e1018]"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block"
      />
    </div>
  );
};
