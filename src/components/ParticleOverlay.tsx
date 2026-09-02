import React, { useEffect, useRef } from 'react';

interface ParticleOverlayProps {
  type: 'heaven' | 'chug' | 'upgrade' | null;
  onComplete?: () => void;
}

export const ParticleOverlay: React.FC<ParticleOverlayProps> = ({ type, onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!type) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    let animationFrameId: number;
    const particles: Particle[] = [];
    const count = type === 'heaven' ? 120 : type === 'upgrade' ? 80 : 150;

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      color: string;
      life: number;
      maxLife: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = type === 'heaven' || type === 'upgrade' ? height + Math.random() * 40 : height + 20;
        this.vx = (Math.random() - 0.5) * (type === 'heaven' ? 1.5 : type === 'upgrade' ? 2 : 3);
        this.vy = type === 'heaven' ? -(Math.random() * 3 + 1) : type === 'upgrade' ? -(Math.random() * 4 + 2) : -(Math.random() * 6 + 2);
        this.size = Math.random() * (type === 'heaven' ? 5 : type === 'upgrade' ? 4.5 : 8) + 2;
        this.alpha = Math.random() * 0.8 + 0.2;
        this.maxLife = Math.random() * 100 + 60;
        this.life = this.maxLife;

        if (type === 'heaven') {
          const goldHues = ['#e8c84a', '#ffd700', '#fff8dc', '#f0e68c'];
          this.color = goldHues[Math.floor(Math.random() * goldHues.length)];
        } else if (type === 'upgrade') {
          const upgradeHues = ['#10b981', '#34d399', '#6ee7b7', '#ffd700', '#f59e0b', '#ffffff'];
          this.color = upgradeHues[Math.floor(Math.random() * upgradeHues.length)];
        } else {
          const flameHues = ['#e05c3a', '#ff4500', '#ff8c00', '#ffd700', '#8b0000'];
          this.color = flameHues[Math.floor(Math.random() * flameHues.length)];
        }
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        this.alpha = Math.max(0, (this.life / this.maxLife) * 0.9);

        if (this.life <= 0 || this.y < -20) {
          this.x = Math.random() * width;
          this.y = height + 10;
          this.life = this.maxLife;
          this.alpha = Math.random() * 0.8 + 0.2;
        }
      }

      draw(context: CanvasRenderingContext2D) {
        context.save();
        context.globalAlpha = this.alpha;
        context.fillStyle = this.color;
        context.shadowBlur = 12;
        context.shadowColor = this.color;

        if (type === 'heaven' || type === 'upgrade') {
          // Draw sparkling star / diamond
          context.beginPath();
          context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          context.fill();
        } else {
          // Draw flame particle
          context.beginPath();
          context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          context.fill();
        }
        context.restore();
      }
    }

    for (let i = 0; i < count; i++) {
      particles.push(new Particle());
    }

    let startTime = Date.now();
    const duration = type === 'heaven' ? 4500 : type === 'upgrade' ? 2600 : 4000;

    const render = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed > duration) {
        if (onComplete) onComplete();
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // Background gradient overlay
      if (type === 'heaven') {
        const bgGrad = ctx.createRadialGradient(
          width / 2, height / 2, 50,
          width / 2, height / 2, Math.max(width, height)
        );
        bgGrad.addColorStop(0, 'rgba(13, 27, 42, 0.85)');
        bgGrad.addColorStop(0.5, 'rgba(20, 40, 70, 0.75)');
        bgGrad.addColorStop(1, 'rgba(10, 15, 30, 0.92)');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Rays of golden light
        ctx.save();
        ctx.translate(width / 2, 0);
        ctx.fillStyle = 'rgba(232, 200, 74, 0.08)';
        for (let r = 0; r < 8; r++) {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          const angle1 = (r * Math.PI / 4) + (elapsed * 0.0003);
          const angle2 = angle1 + 0.15;
          ctx.lineTo(Math.cos(angle1) * width * 1.5, Math.sin(angle1) * height * 1.5);
          ctx.lineTo(Math.cos(angle2) * width * 1.5, Math.sin(angle2) * height * 1.5);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      } else if (type === 'upgrade') {
        const bgGrad = ctx.createRadialGradient(
          width / 2, height / 2, 50,
          width / 2, height / 2, Math.max(width, height)
        );
        bgGrad.addColorStop(0, 'rgba(6, 44, 25, 0.82)');
        bgGrad.addColorStop(0.5, 'rgba(14, 30, 20, 0.75)');
        bgGrad.addColorStop(1, 'rgba(8, 12, 10, 0.88)');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);
      } else {
        const bgGrad = ctx.createRadialGradient(
          width / 2, height / 2, 40,
          width / 2, height / 2, Math.max(width, height)
        );
        bgGrad.addColorStop(0, 'rgba(139, 0, 0, 0.85)');
        bgGrad.addColorStop(0.5, 'rgba(60, 0, 0, 0.75)');
        bgGrad.addColorStop(1, 'rgba(15, 0, 0, 0.92)');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // Update and draw particles
      particles.forEach(p => {
        p.update();
        p.draw(ctx);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [type, onComplete]);

  if (!type) return null;

  return (
    <div
      onClick={() => onComplete && onComplete()}
      className={`fixed inset-0 z-50 pointer-events-auto cursor-pointer overflow-hidden flex flex-col items-center justify-center select-none ${type === 'chug' ? 'animate-shake' : ''}`}
      title="Apasă oriunde pentru a da SKIP"
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div className="relative z-10 text-center px-4 animate-bounce">
        {type === 'heaven' ? (
          <div className="bg-[#161616]/90 border-2 border-[#e8c84a] rounded-2xl p-6 gold-glow max-w-sm mx-auto backdrop-blur-md">
            <div className="text-5xl mb-2">✨ 🕊️ 👑</div>
            <h2 className="text-3xl font-cinzel text-[#e8c84a] font-bold gold-text-glow">RAI / HEAVEN</h2>
            <p className="text-lg font-barlow text-[#f0ebe0] mt-2">
              Dublu 1-1! Ești iertat de Dumnezeu și de Mănăstire, dar tot bei gurile din tură!
            </p>
          </div>
        ) : type === 'upgrade' ? (
          <div className="bg-[#0f1712]/95 border-2 border-emerald-400 rounded-3xl p-6 shadow-[0_0_30px_rgba(16,185,129,0.6)] max-w-sm mx-auto backdrop-blur-md space-y-2">
            <div className="text-5xl mb-1 flex items-center justify-center gap-1">
              <span>🏗️</span>
              <span>🏠</span>
              <span>✨</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-cinzel text-emerald-300 font-black tracking-wide">
              UPGRADE FINALIZAT!
            </h2>
            <p className="text-sm font-barlow text-gray-200">
              Clădirea a crescut în nivel! Chiria și penalizarea de băutură au fost majorate! 🍺
            </p>
          </div>
        ) : (
          <div className="bg-[#161616]/90 border-2 border-[#e05c3a] rounded-2xl p-6 flame-glow max-w-sm mx-auto backdrop-blur-md">
            <div className="text-5xl mb-2">🔥 💀 🍺</div>
            <h2 className="text-3xl font-cinzel text-[#e05c3a] font-bold flame-text-glow">CHUG IT ALL / GROAPĂ</h2>
            <p className="text-lg font-barlow text-[#f0ebe0] mt-2">
              Ai picat la Groapă! Bei tot paharul dintr-o răsuflare!
            </p>
          </div>
        )}
      </div>

      {/* Tap to Skip indicator */}
      <div className="relative z-20 mt-6 animate-pulse">
        <span className="px-4 py-1.5 rounded-full bg-black/80 border border-[#ffd700] text-xs font-cinzel font-bold text-[#ffd700] shadow-lg flex items-center gap-1.5 backdrop-blur-sm">
          <span>⏩</span>
          <span>Apasă oriunde pentru SKIP</span>
        </span>
      </div>
    </div>
  );
};
