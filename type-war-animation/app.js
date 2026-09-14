/**
 * THE GREAT TYPE WAR: ANIMATION ENGINE
 * Static Citadel vs. Dynamic Swarm
 * Orchestrated for Sijaz Ahmed Portfolio Showcase
 */

(function () {
  'use strict';

  // --- Audio Synthesis Engine (Web Audio API, Zero Assets) ---
  class SoundFX {
    constructor() {
      this.ctx = null;
      this.enabled = false;
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggle() {
      this.init();
      this.enabled = !this.enabled;
      return this.enabled;
    }

    playLaser(freq = 600, duration = 0.15) {
      if (!this.enabled || !this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + duration);
        gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {}
    }

    playExplosion(isMega = false) {
      if (!this.enabled || !this.ctx) return;
      try {
        const duration = isMega ? 0.8 : 0.4;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(isMega ? 150 : 120, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime + duration);
        gain.gain.setValueAtTime(isMega ? 0.25 : 0.12, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {}
    }

    playSynthesisChime() {
      if (!this.enabled || !this.ctx) return;
      try {
        const freqs = [440, 554.37, 659.25, 880];
        freqs.forEach((f, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = f;
          const startTime = this.ctx.currentTime + idx * 0.12;
          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(0.1, startTime + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.2);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(startTime);
          osc.stop(startTime + 1.3);
        });
      } catch (e) {}
    }

    playShieldHum() {
      if (!this.enabled || !this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(440, this.ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.6);
      } catch (e) {}
    }
  }

  const audio = new SoundFX();

  // --- Battle Animation Engine ---
  const canvas = document.getElementById('battleCanvas');
  const ctx = canvas.getContext('2d');
  const feedBody = document.getElementById('feedBody');
  const nexusOverlay = document.getElementById('nexusOverlay');
  const actPills = document.querySelectorAll('.act-pill');
  const staticGauge = document.getElementById('staticGauge');
  const dynamicGauge = document.getElementById('dynamicGauge');

  let width = 1200;
  let height = 640;
  let dpr = window.devicePixelRatio || 1;
  let isPlaying = true;
  let timeScale = 1.0;
  let battleTime = 0; // seconds
  let screenShake = 0;

  // Act durations in seconds
  const ACT_DURATIONS = {
    1: 7,   // Mobilization
    2: 12,  // Skirmish
    3: 10,  // Super Moves
    4: 10   // Architect's Synthesis
  };
  const TOTAL_LOOP_TIME = 39; // seconds

  // Active Act
  let currentAct = 1;

  // Particles & Entities
  const particles = [];
  const floatingTokens = [];
  const projectiles = [];
  const shockwaves = [];
  const goroutines = [];

  // Terminal Logging Helper
  function logFeed(msg, type = 'sys') {
    if (!feedBody) return;
    const now = new Date();
    const ts = `[${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}]`;
    const row = document.createElement('div');
    row.className = `feed-row log-${type}`;
    row.textContent = `${ts} ${msg}`;
    feedBody.appendChild(row);
    feedBody.scrollTop = feedBody.scrollHeight;

    while (feedBody.children.length > 25) {
      feedBody.removeChild(feedBody.firstChild);
    }
  }

  // Handle Canvas Resizing
  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Code token symbols that float in ambient air
  const STATIC_TOKENS = ['&mut T', 'impl Trait', '0x7FFE20', 'template<T>', 'constexpr', 'chan<- int', 'interface{}', 'int64', 'Box<dyn>', 'Final', 'noexcept'];
  const DYNAMIC_TOKENS = ['eval()', 'async/await', 'undefined', 'NaN', '**kwargs', '__init__', 'monkey_patch', '===', 'nil', '[object Object]', 'def __call__'];

  // Seed initial floating tokens
  for (let i = 0; i < 28; i++) {
    const isStatic = i % 2 === 0;
    floatingTokens.push({
      x: isStatic ? Math.random() * (width * 0.45) : width * 0.55 + Math.random() * (width * 0.45),
      y: 60 + Math.random() * (height - 140),
      vx: (Math.random() - 0.5) * 0.4,
      vy: -0.2 - Math.random() * 0.3,
      text: isStatic ? STATIC_TOKENS[Math.floor(Math.random() * STATIC_TOKENS.length)] : DYNAMIC_TOKENS[Math.floor(Math.random() * DYNAMIC_TOKENS.length)],
      isStatic: isStatic,
      alpha: 0.15 + Math.random() * 0.4,
      size: 10 + Math.random() * 4
    });
  }

  // --- Warriors Definitions ---
  const staticWarriors = [
    {
      id: 'rust',
      name: 'Rust',
      label: '🦀 Rust',
      color: '#00f0ff',
      subColor: '#ff5722',
      baseX: 0.14,
      baseY: 0.36,
      currentX: 0.14,
      currentY: 0.36,
      size: 38,
      hoverOffset: 0,
      attackCooldown: 1.8,
      shieldActive: false,
      shieldRadius: 0
    },
    {
      id: 'cpp',
      name: 'C++',
      label: '⚔️ C++',
      color: '#38bdf8',
      subColor: '#0369a1',
      baseX: 0.22,
      baseY: 0.62,
      currentX: 0.22,
      currentY: 0.62,
      size: 44,
      hoverOffset: 0.5,
      attackCooldown: 2.2,
      firingLaser: false
    },
    {
      id: 'go',
      name: 'Go',
      label: '⚡ Go',
      color: '#22d3ee',
      subColor: '#06b6d4',
      baseX: 0.28,
      baseY: 0.25,
      currentX: 0.28,
      currentY: 0.25,
      size: 32,
      hoverOffset: 1.2,
      attackCooldown: 1.4
    },
    {
      id: 'ts',
      name: 'TypeScript',
      label: '🔷 TS',
      color: '#60a5fa',
      subColor: '#2563eb',
      baseX: 0.35,
      baseY: 0.48,
      currentX: 0.35,
      currentY: 0.48,
      size: 34,
      hoverOffset: 0.8,
      attackCooldown: 2.0
    },
    {
      id: 'java',
      name: 'Java',
      label: '☕ Java',
      color: '#f59e0b',
      subColor: '#ea580c',
      baseX: 0.08,
      baseY: 0.55,
      currentX: 0.08,
      currentY: 0.55,
      size: 46,
      hoverOffset: 1.8,
      attackCooldown: 3.0
    }
  ];

  const dynamicWarriors = [
    {
      id: 'python',
      name: 'Python',
      label: '🐍 Python',
      color: '#10b981',
      subColor: '#fbbf24',
      baseX: 0.86,
      baseY: 0.35,
      currentX: 0.86,
      currentY: 0.35,
      size: 42,
      hoverOffset: 0.3,
      attackCooldown: 1.7,
      summoningHydra: false
    },
    {
      id: 'js',
      name: 'JavaScript',
      label: '⚡ JS',
      color: '#facc15',
      subColor: '#eab308',
      baseX: 0.76,
      baseY: 0.62,
      currentX: 0.76,
      currentY: 0.62,
      size: 36,
      hoverOffset: 1.5,
      attackCooldown: 1.3
    },
    {
      id: 'ruby',
      name: 'Ruby',
      label: '💎 Ruby',
      color: '#f43f5e',
      subColor: '#e11d48',
      baseX: 0.70,
      baseY: 0.26,
      currentX: 0.70,
      currentY: 0.26,
      size: 32,
      hoverOffset: 0.7,
      attackCooldown: 2.1
    },
    {
      id: 'php',
      name: 'PHP',
      label: '🐘 PHP',
      color: '#818cf8',
      subColor: '#4f46e5',
      baseX: 0.90,
      baseY: 0.58,
      currentX: 0.90,
      currentY: 0.58,
      size: 44,
      hoverOffset: 1.9,
      attackCooldown: 2.8
    }
  ];

  // --- Visual Helper Functions ---
  function drawGlowCircle(x, y, r, color, glowColor, lineWidth = 2) {
    ctx.save();
    ctx.shadowColor = glowColor || color;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    ctx.restore();
  }

  function drawCyberHexagon(x, y, r, color, glowColor) {
    ctx.save();
    ctx.shadowColor = glowColor || color;
    ctx.shadowBlur = 18;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const hx = x + r * Math.cos(angle);
      const hy = y + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  // --- Drawing Warriors ---
  function drawRust(w, t) {
    const x = w.currentX * width;
    const y = (w.currentY + Math.sin(t * 2 + w.hoverOffset) * 0.02) * height;
    
    // Crab Claws / Shield
    ctx.save();
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 18;
    
    // Body (Iron Crab shell)
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(x, y, w.size * 0.8, w.size * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Energy Claws
    const clawAngle = Math.sin(t * 4) * 0.2;
    // Left Claw
    ctx.beginPath();
    ctx.arc(x - 28, y - 10, 14, -0.4 + clawAngle, Math.PI + clawAngle);
    ctx.strokeStyle = '#ff5722';
    ctx.lineWidth = 4;
    ctx.stroke();
    // Right Claw
    ctx.beginPath();
    ctx.arc(x + 28, y - 10, 14, -clawAngle, Math.PI - clawAngle, true);
    ctx.stroke();

    // Glowing Eyes
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.arc(x - 10, y - 6, 4, 0, Math.PI * 2);
    ctx.arc(x + 10, y - 6, 4, 0, Math.PI * 2);
    ctx.fill();

    // Borrow Checker Shield Indicator
    if (w.shieldActive) {
      drawCyberHexagon(x, y, w.shieldRadius, '#00f0ff', '#00f0ff');
      ctx.fillStyle = 'rgba(0, 240, 255, 0.12)';
      ctx.beginPath();
      ctx.arc(x, y, w.shieldRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '10px Fira Code';
      ctx.fillStyle = '#00f0ff';
      ctx.textAlign = 'center';
      ctx.fillText('&mut lifetime', x, y - w.shieldRadius - 8);
    }

    // Badge Label
    ctx.font = 'bold 11px Outfit, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(w.label, x, y + w.size + 14);
    ctx.restore();
  }

  function drawCpp(w, t) {
    const x = w.currentX * width;
    const y = (w.currentY + Math.sin(t * 1.5 + w.hoverOffset) * 0.015) * height;

    ctx.save();
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 20;

    // Dreadnought Mech Chassis
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.rect(x - 26, y - 22, 52, 44);
    ctx.fill();
    ctx.stroke();

    // Turret Cannons
    ctx.fillStyle = '#64748b';
    ctx.fillRect(x + 24, y - 14, 18, 7);
    ctx.fillRect(x + 24, y + 7, 18, 7);

    // Pointer core `*ptr`
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px Fira Code';
    ctx.textAlign = 'center';
    ctx.fillText('*ptr', x, y + 5);

    // Badge Label
    ctx.font = 'bold 11px Outfit, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(w.label, x, y + w.size + 14);
    ctx.restore();
  }

  function drawGo(w, t) {
    const x = w.currentX * width;
    const y = (w.currentY + Math.sin(t * 3.5 + w.hoverOffset) * 0.025) * height;

    ctx.save();
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = 16;

    // Gopher Helm
    ctx.fillStyle = '#0891b2';
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Giant Gopher Goggles
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x - 7, y - 4, 7, 0, Math.PI * 2);
    ctx.arc(x + 7, y - 4, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(x - 5, y - 4, 3, 0, Math.PI * 2);
    ctx.arc(x + 9, y - 4, 3, 0, Math.PI * 2);
    ctx.fill();

    // Jetpack flame
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(x - 14, y + 15);
    ctx.lineTo(x - 10, y + 26 + Math.sin(t * 15) * 6);
    ctx.lineTo(x - 6, y + 15);
    ctx.fill();

    // Badge Label
    ctx.font = 'bold 11px Outfit, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(w.label, x, y + w.size + 12);
    ctx.restore();
  }

  function drawTypeScript(w, t) {
    const x = w.currentX * width;
    const y = (w.currentY + Math.sin(t * 2.5 + w.hoverOffset) * 0.02) * height;

    ctx.save();
    ctx.shadowColor = '#60a5fa';
    ctx.shadowBlur = 18;

    // Cyber Diamond Ninja
    ctx.fillStyle = '#1e3a8a';
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x, y - 22);
    ctx.lineTo(x + 22, y);
    ctx.lineTo(x, y + 22);
    ctx.lineTo(x - 22, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Dual Strict Katanas
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 18, y - 18);
    ctx.lineTo(x + 36, y - 32);
    ctx.moveTo(x + 18, y + 18);
    ctx.lineTo(x + 36, y + 32);
    ctx.stroke();

    ctx.font = 'bold 12px Fira Code';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('TS', x, y + 4);

    ctx.font = 'bold 11px Outfit, sans-serif';
    ctx.fillText(w.label, x, y + w.size + 14);
    ctx.restore();
  }

  function drawJava(w, t) {
    const x = w.currentX * width;
    const y = (w.currentY + Math.sin(t * 1.2 + w.hoverOffset) * 0.01) * height;

    ctx.save();
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 22;

    // Enterprise Bastion
    ctx.fillStyle = '#33200a';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Coffee Steam Glyph
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 6, y - 12);
    ctx.quadraticCurveTo(x - 10, y - 22, x - 4, y - 28);
    ctx.moveTo(x + 4, y - 12);
    ctx.quadraticCurveTo(x, y - 22, x + 6, y - 28);
    ctx.stroke();

    ctx.font = 'bold 10px Fira Code';
    ctx.fillStyle = '#f59e0b';
    ctx.textAlign = 'center';
    ctx.fillText('JVM', x, y + 5);

    ctx.font = 'bold 11px Outfit, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(w.label, x, y + w.size + 14);
    ctx.restore();
  }

  function drawPython(w, t) {
    const x = w.currentX * width;
    const y = (w.currentY + Math.sin(t * 2 + w.hoverOffset) * 0.02) * height;

    ctx.save();
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 24;

    // Coiled Serpent Body
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#10b981';
    ctx.beginPath();
    const length = 40;
    for (let i = 0; i < length; i++) {
      const sx = x + (i * 1.2) - 20;
      const sy = y + Math.sin(t * 4 + i * 0.2) * 14;
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();

    // Serpent Head (Dual tone Green & Gold)
    ctx.fillStyle = '#065f46';
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x - 22, y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Glowing Eyes
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(x - 26, y - 4, 3, 0, Math.PI * 2);
    ctx.fill();

    // Floating PyTorch Tensor Orbs
    const orbAngle = t * 3;
    for (let o = 0; o < 3; o++) {
      const ox = x + Math.cos(orbAngle + (o * Math.PI * 2) / 3) * 28;
      const oy = y + Math.sin(orbAngle + (o * Math.PI * 2) / 3) * 28;
      ctx.fillStyle = '#ee4c2c'; // PyTorch Flame Red
      ctx.beginPath();
      ctx.arc(ox, oy, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.font = 'bold 11px Outfit, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(w.label, x, y + w.size + 14);
    ctx.restore();
  }

  function drawJavaScript(w, t) {
    const x = w.currentX * width;
    const y = (w.currentY + Math.sin(t * 3.2 + w.hoverOffset) * 0.022) * height;

    ctx.save();
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 20;

    // Asynchronous Event Loop Disk
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, 22, t * 4, t * 4 + Math.PI * 1.6);
    ctx.stroke();

    // Core Jester Hex
    ctx.fillStyle = '#854d0e';
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '900 13px Fira Code';
    ctx.fillStyle = '#facc15';
    ctx.textAlign = 'center';
    ctx.fillText('JS', x, y + 4);

    // Floating {} glyphs
    ctx.font = '12px Fira Code';
    ctx.fillStyle = 'rgba(250, 204, 21, 0.8)';
    ctx.fillText('{ }', x + 24, y - 14);

    ctx.font = 'bold 11px Outfit, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(w.label, x, y + w.size + 14);
    ctx.restore();
  }

  function drawRuby(w, t) {
    const x = w.currentX * width;
    const y = (w.currentY + Math.sin(t * 2.8 + w.hoverOffset) * 0.02) * height;

    ctx.save();
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 22;

    // Faceted Ruby Gem
    ctx.fillStyle = '#881337';
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x - 18, y - 10);
    ctx.lineTo(x + 18, y - 10);
    ctx.lineTo(x + 24, y);
    ctx.lineTo(x, y + 22);
    ctx.lineTo(x - 24, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Internal Facets
    ctx.strokeStyle = '#fda4af';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 18, y - 10);
    ctx.lineTo(x, y + 22);
    ctx.lineTo(x + 18, y - 10);
    ctx.stroke();

    ctx.font = 'bold 11px Outfit, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(w.label, x, y + w.size + 14);
    ctx.restore();
  }

  function drawPhp(w, t) {
    const x = w.currentX * width;
    const y = (w.currentY + Math.sin(t * 1.6 + w.hoverOffset) * 0.015) * height;

    ctx.save();
    ctx.shadowColor = '#818cf8';
    ctx.shadowBlur = 18;

    // ElePHPant Body
    ctx.fillStyle = '#312e81';
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(x, y, 26, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Trunk Cannon
    ctx.strokeStyle = '#a5b4fc';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x - 18, y + 2);
    ctx.quadraticCurveTo(x - 30, y + 10, x - 32, y - 6);
    ctx.stroke();

    ctx.font = 'bold 11px Fira Code';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('PHP', x + 4, y + 4);

    ctx.font = 'bold 11px Outfit, sans-serif';
    ctx.fillText(w.label, x, y + w.size + 14);
    ctx.restore();
  }

  // --- Attack & FX Creators ---
  function spawnLaser(x1, y1, x2, y2, color, isStatic = true) {
    projectiles.push({
      type: 'laser',
      x1, y1, x2, y2,
      progress: 0,
      speed: 3.5,
      color,
      isStatic
    });
    audio.playLaser(isStatic ? 750 : 520);
  }

  function spawnShockwave(x, y, color, maxRadius = 140) {
    shockwaves.push({
      x, y,
      radius: 5,
      maxRadius,
      color,
      alpha: 1
    });
    audio.playExplosion(maxRadius > 180);
    screenShake = maxRadius > 180 ? 16 : 7;
  }

  function spawnGoroutine(originX, originY, targetX, targetY) {
    goroutines.push({
      x: originX,
      y: originY,
      targetX,
      targetY,
      vx: (targetX - originX) * 0.04 + (Math.random() - 0.5) * 4,
      vy: (targetY - originY) * 0.04 + (Math.random() - 0.5) * 4,
      life: 1.0
    });
  }

  function spawnParticleExplosion(x, y, color, count = 20) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 5;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 2 + Math.random() * 4,
        alpha: 1,
        life: 0.6 + Math.random() * 0.5
      });
    }
  }

  // --- Super Moves Implementation ---
  function triggerSegfault() {
    logFeed("C++ throws SEGMENTATION FAULT (core dumped) at 0x7FFFDEADBEEF!", 'super');
    const cpp = staticWarriors.find(w => w.id === 'cpp');
    const x = cpp.currentX * width;
    const y = cpp.currentY * height;
    spawnShockwave(width * 0.5, height * 0.5, '#38bdf8', 260);
    spawnParticleExplosion(width * 0.5, height * 0.5, '#38bdf8', 50);
    
    // Spawn floating error text
    for (let i = 0; i < 8; i++) {
      particles.push({
        x: width * 0.5 + (Math.random() - 0.5) * 300,
        y: height * 0.5 + (Math.random() - 0.5) * 150,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -1.5,
        text: 'SIGSEGV: 11',
        isText: true,
        color: '#ef4444',
        alpha: 1,
        life: 1.6
      });
    }
  }

  function triggerTensorLightning() {
    logFeed("Python executes torch.compile() -> PyTorch Tensor Lightning storm unleashed!", 'dynamic');
    const py = dynamicWarriors.find(w => w.id === 'python');
    const x = py.currentX * width;
    const y = py.currentY * height;

    // Strike 3 random static warriors with lightning
    staticWarriors.slice(0, 3).forEach(target => {
      const tx = target.currentX * width;
      const ty = target.currentY * height;
      projectiles.push({
        type: 'lightning',
        x1: x, y1: y,
        x2: tx, y2: ty,
        color: '#10b981',
        life: 0.35
      });
      spawnShockwave(tx, ty, '#fbbf24', 90);
      spawnParticleExplosion(tx, ty, '#10b981', 15);
    });
    audio.playLaser(900, 0.4);
  }

  function triggerNpmMeteor() {
    logFeed("JavaScript summons `node_modules` (480GB) gravity meteor! Crushing disk space!", 'super');
    projectiles.push({
      type: 'meteor',
      x: width * 0.5,
      y: -60,
      targetY: height * 0.55,
      size: 65,
      speed: 7
    });
  }

  function triggerBorrowShield() {
    logFeed("Rust compiler grants &mut exclusive lifetime: 100% thread safety barrier active!", 'static');
    const rust = staticWarriors.find(w => w.id === 'rust');
    rust.shieldActive = true;
    rust.shieldRadius = 70;
    audio.playShieldHum();
    setTimeout(() => {
      rust.shieldActive = false;
    }, 3500);
  }

  function triggerSynthesis() {
    logFeed("SIJAZ AHMED NEXUS ACTIVATED: Static high-throughput stream fused with Dynamic AI models!", 'nexus');
    currentAct = 4;
    battleTime = 28;
    audio.playSynthesisChime();
    updateActUI(4);
  }

  // --- Update UI State ---
  function updateActUI(actNum) {
    currentAct = actNum;
    actPills.forEach(pill => {
      pill.classList.toggle('active', parseInt(pill.dataset.act, 10) === actNum);
    });

    if (actNum === 4) {
      nexusOverlay.classList.add('active');
      staticGauge.style.width = '100%';
      dynamicGauge.style.width = '100%';
    } else {
      nexusOverlay.classList.remove('active');
      // Natural fluctuation in power gauges
      if (actNum === 1) {
        staticGauge.style.width = '75%';
        dynamicGauge.style.width = '75%';
      } else if (actNum === 2) {
        staticGauge.style.width = '88%';
        dynamicGauge.style.width = '82%';
      } else if (actNum === 3) {
        staticGauge.style.width = '94%';
        dynamicGauge.style.width = '92%';
      }
    }
  }

  // --- Main Render & Update Loop ---
  let lastTime = performance.now();

  function animate(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.1) * timeScale;
    lastTime = now;

    if (isPlaying) {
      battleTime += dt;
      if (battleTime >= TOTAL_LOOP_TIME) {
        battleTime = 0;
        logFeed("--- Cycle Reset: New Deployment Epoch Initiated ---", 'sys');
      }

      // Determine Act based on battleTime
      let targetAct = 1;
      if (battleTime < ACT_DURATIONS[1]) {
        targetAct = 1;
      } else if (battleTime < ACT_DURATIONS[1] + ACT_DURATIONS[2]) {
        targetAct = 2;
      } else if (battleTime < ACT_DURATIONS[1] + ACT_DURATIONS[2] + ACT_DURATIONS[3]) {
        targetAct = 3;
      } else {
        targetAct = 4;
      }

      if (targetAct !== currentAct) {
        updateActUI(targetAct);
        if (targetAct === 2) {
          logFeed("ACT II: The Clash of Paradigms begins! Compilers meet Interpreters.", 'sys');
        } else if (targetAct === 3) {
          logFeed("ACT III: Super Moves charged! Maximum system strain!", 'super');
          triggerTensorLightning();
        } else if (targetAct === 4) {
          logFeed("ACT IV: The Architect's Synthesis! Harmonizing production architectures.", 'nexus');
          audio.playSynthesisChime();
        }
      }
    }

    // Screen Shake decay
    let offsetX = 0;
    let offsetY = 0;
    if (screenShake > 0) {
      offsetX = (Math.random() - 0.5) * screenShake;
      offsetY = (Math.random() - 0.5) * screenShake;
      screenShake = Math.max(0, screenShake - dt * 30);
    }

    // Clear Screen
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.fillStyle = '#04060d';
    ctx.fillRect(0, 0, width, height);

    // Draw Cyber Grid Lines (Perspective Floor)
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let gx = 0; gx < width; gx += 40) {
      ctx.beginPath();
      ctx.moveTo(gx, height * 0.7);
      ctx.lineTo(width * 0.5 + (gx - width * 0.5) * 1.8, height);
      ctx.stroke();
    }
    for (let gy = height * 0.7; gy < height; gy += 25) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(width, gy);
      ctx.stroke();
    }
    ctx.restore();

    // Draw Center Divider / Nexus Beam
    ctx.save();
    if (currentAct === 4) {
      // Radiant Architect Pillar
      const grad = ctx.createLinearGradient(width * 0.5 - 40, 0, width * 0.5 + 40, 0);
      grad.addColorStop(0, 'rgba(139, 92, 246, 0)');
      grad.addColorStop(0.5, 'rgba(250, 204, 21, 0.35)');
      grad.addColorStop(1, 'rgba(0, 240, 255, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(width * 0.5 - 60, 0, 120, height);

      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.moveTo(width * 0.5, 0);
      ctx.lineTo(width * 0.5, height);
      ctx.stroke();
    } else {
      // Subtle demarcation line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(width * 0.5, 30);
      ctx.lineTo(width * 0.5, height - 30);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();

    // Ambient Floating Code Tokens
    floatingTokens.forEach(token => {
      if (isPlaying) {
        token.x += token.vx * dt * 60;
        token.y += token.vy * dt * 60;
        if (token.y < 30) {
          token.y = height - 50;
          token.x = token.isStatic ? Math.random() * (width * 0.45) : width * 0.55 + Math.random() * (width * 0.45);
        }
      }
      ctx.save();
      ctx.font = `${token.size}px Fira Code`;
      ctx.fillStyle = token.isStatic ? `rgba(0, 240, 255, ${token.alpha})` : `rgba(245, 158, 11, ${token.alpha})`;
      ctx.fillText(token.text, token.x, token.y);
      ctx.restore();
    });

    // Automated Combat Skirmish Actions (Acts 2 & 3)
    if (isPlaying && (currentAct === 2 || currentAct === 3)) {
      // Random firing from warriors
      if (Math.random() < (currentAct === 3 ? 0.08 : 0.04)) {
        const attacker = staticWarriors[Math.floor(Math.random() * staticWarriors.length)];
        const target = dynamicWarriors[Math.floor(Math.random() * dynamicWarriors.length)];
        const x1 = attacker.currentX * width;
        const y1 = attacker.currentY * height;
        const x2 = target.currentX * width;
        const y2 = target.currentY * height;
        spawnLaser(x1, y1, x2, y2, attacker.color, true);
        if (Math.random() < 0.3) {
          logFeed(`${attacker.name} fires compiled beam at ${target.name}!`, 'static');
        }
      }

      if (Math.random() < (currentAct === 3 ? 0.08 : 0.04)) {
        const attacker = dynamicWarriors[Math.floor(Math.random() * dynamicWarriors.length)];
        const target = staticWarriors[Math.floor(Math.random() * staticWarriors.length)];
        const x1 = attacker.currentX * width;
        const y1 = attacker.currentY * height;
        const x2 = target.currentX * width;
        const y2 = target.currentY * height;
        spawnLaser(x1, y1, x2, y2, attacker.color, false);
        if (Math.random() < 0.3) {
          logFeed(`${attacker.name} hurls dynamic payload at ${target.name}!`, 'dynamic');
        }
      }

      // Go spawns goroutines towards enemies
      if (Math.random() < 0.03) {
        const go = staticWarriors.find(w => w.id === 'go');
        const target = dynamicWarriors[Math.floor(Math.random() * dynamicWarriors.length)];
        spawnGoroutine(go.currentX * width, go.currentY * height, target.currentX * width, target.currentY * height);
      }
    }

    // Act 4: Harmony Connection Beams between Static and Dynamic
    if (currentAct === 4) {
      ctx.save();
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 15;
      
      // Beam 1: Python -> C++ (AI to Triton Inference)
      const py = dynamicWarriors.find(w => w.id === 'python');
      const cpp = staticWarriors.find(w => w.id === 'cpp');
      ctx.strokeStyle = '#10b981';
      ctx.shadowColor = '#10b981';
      ctx.beginPath();
      ctx.moveTo(py.currentX * width, py.currentY * height);
      ctx.quadraticCurveTo(width * 0.5, height * 0.45, cpp.currentX * width, cpp.currentY * height);
      ctx.stroke();

      // Beam 2: TS -> Go (Fullstack React to Streaming Kafka)
      const ts = staticWarriors.find(w => w.id === 'ts');
      const js = dynamicWarriors.find(w => w.id === 'js');
      const go = staticWarriors.find(w => w.id === 'go');
      ctx.strokeStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.beginPath();
      ctx.moveTo(js.currentX * width, js.currentY * height);
      ctx.quadraticCurveTo(width * 0.5, height * 0.55, go.currentX * width, go.currentY * height);
      ctx.stroke();

      ctx.restore();
    }

    // Update & Draw Projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];
      if (p.type === 'laser') {
        p.progress += p.speed * dt;
        const curX = p.x1 + (p.x2 - p.x1) * p.progress;
        const curY = p.y1 + (p.y2 - p.y1) * p.progress;
        const tailX = p.x1 + (p.x2 - p.x1) * Math.max(0, p.progress - 0.15);
        const tailY = p.y1 + (p.y2 - p.y1) * Math.max(0, p.progress - 0.15);

        ctx.save();
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(curX, curY);
        ctx.stroke();
        ctx.restore();

        if (p.progress >= 1.0) {
          spawnShockwave(p.x2, p.y2, p.color, 45);
          spawnParticleExplosion(p.x2, p.y2, p.color, 8);
          projectiles.splice(i, 1);
        }
      } else if (p.type === 'lightning') {
        p.life -= dt;
        ctx.save();
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 4;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.moveTo(p.x1, p.y1);
        const midX = (p.x1 + p.x2) / 2 + (Math.random() - 0.5) * 60;
        const midY = (p.y1 + p.y2) / 2 + (Math.random() - 0.5) * 60;
        ctx.lineTo(midX, midY);
        ctx.lineTo(p.x2, p.y2);
        ctx.stroke();
        ctx.restore();

        if (p.life <= 0) projectiles.splice(i, 1);
      } else if (p.type === 'meteor') {
        p.y += p.speed * dt * 60;
        ctx.save();
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#eab308';
        ctx.shadowBlur = 30;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        ctx.strokeRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        ctx.font = 'bold 11px Fira Code';
        ctx.fillStyle = '#facc15';
        ctx.textAlign = 'center';
        ctx.fillText('node_modules', p.x, p.y + 4);
        ctx.restore();

        if (p.y >= p.targetY) {
          spawnShockwave(p.x, p.y, '#eab308', 220);
          spawnParticleExplosion(p.x, p.y, '#facc15', 35);
          projectiles.splice(i, 1);
        }
      }
    }

    // Update & Draw Goroutines
    for (let i = goroutines.length - 1; i >= 0; i--) {
      const g = goroutines[i];
      g.x += g.vx * dt * 60;
      g.y += g.vy * dt * 60;
      g.life -= dt * 0.8;

      ctx.save();
      ctx.fillStyle = '#22d3ee';
      ctx.shadowColor = '#22d3ee';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(g.x, g.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      if (g.life <= 0) goroutines.splice(i, 1);
    }

    // Update & Draw Shockwaves
    for (let i = shockwaves.length - 1; i >= 0; i--) {
      const sw = shockwaves[i];
      sw.radius += (sw.maxRadius - sw.radius) * dt * 8;
      sw.alpha -= dt * 1.5;

      ctx.save();
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = Math.max(0, sw.alpha);
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      if (sw.alpha <= 0) shockwaves.splice(i, 1);
    }

    // Update & Draw Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;
      p.alpha -= dt / p.life;

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      if (p.isText) {
        ctx.font = 'bold 12px Fira Code';
        ctx.fillStyle = p.color;
        ctx.fillText(p.text, p.x, p.y);
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      if (p.alpha <= 0) particles.splice(i, 1);
    }

    // Draw Static Warriors
    drawRust(staticWarriors[0], battleTime);
    drawCpp(staticWarriors[1], battleTime);
    drawGo(staticWarriors[2], battleTime);
    drawTypeScript(staticWarriors[3], battleTime);
    drawJava(staticWarriors[4], battleTime);

    // Draw Dynamic Warriors
    drawPython(dynamicWarriors[0], battleTime);
    drawJavaScript(dynamicWarriors[1], battleTime);
    drawRuby(dynamicWarriors[2], battleTime);
    drawPhp(dynamicWarriors[3], battleTime);

    ctx.restore(); // restore from screen shake

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);

  // --- Interactive Event Listeners ---
  const playPauseBtn = document.getElementById('playPauseBtn');
  const restartBtn = document.getElementById('restartBtn');
  const audioToggleBtn = document.getElementById('audioToggleBtn');
  const audioIcon = document.getElementById('audioIcon');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const toggleFeedBtn = document.getElementById('toggleFeedBtn');
  const combatFeedPanel = document.getElementById('combatFeedPanel');

  playPauseBtn.addEventListener('click', () => {
    isPlaying = !isPlaying;
    playPauseBtn.querySelector('.btn-icon').textContent = isPlaying ? '⏸' : '▶';
    playPauseBtn.querySelector('.btn-text').textContent = isPlaying ? 'PAUSE' : 'PLAY';
    logFeed(isPlaying ? "Animation resumed." : "Animation paused.", 'sys');
  });

  restartBtn.addEventListener('click', () => {
    battleTime = 0;
    updateActUI(1);
    logFeed("Restarted battle from Act I: Mobilization.", 'sys');
  });

  document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      timeScale = parseFloat(btn.dataset.speed);
      logFeed(`Simulation velocity changed to ${timeScale}x`, 'sys');
    });
  });

  actPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const act = parseInt(pill.dataset.act, 10);
      updateActUI(act);
      if (act === 1) battleTime = 0;
      else if (act === 2) battleTime = ACT_DURATIONS[1] + 0.1;
      else if (act === 3) battleTime = ACT_DURATIONS[1] + ACT_DURATIONS[2] + 0.1;
      else if (act === 4) battleTime = ACT_DURATIONS[1] + ACT_DURATIONS[2] + ACT_DURATIONS[3] + 0.1;
      logFeed(`Jumped to ACT ${act}`, 'sys');
    });
  });

  // Super Moves Triggers
  document.getElementById('btnTriggerSegfault').addEventListener('click', triggerSegfault);
  document.getElementById('btnTriggerLightning').addEventListener('click', triggerTensorLightning);
  document.getElementById('btnTriggerMeteor').addEventListener('click', triggerNpmMeteor);
  document.getElementById('btnTriggerShield').addEventListener('click', triggerBorrowShield);
  document.getElementById('btnTriggerSynthesis').addEventListener('click', triggerSynthesis);

  // Sound FX Toggle
  audioToggleBtn.addEventListener('click', () => {
    const isEnabled = audio.toggle();
    audioIcon.textContent = isEnabled ? '🔊' : '🔇';
    audioToggleBtn.classList.toggle('active', isEnabled);
    logFeed(isEnabled ? "Audio Synthesizer: ON" : "Audio Synthesizer: MUTED", 'sys');
    if (isEnabled) audio.playLaser(600);
  });

  // Fullscreen
  fullscreenBtn.addEventListener('click', () => {
    const elem = document.getElementById('canvasWrapper');
    if (!document.fullscreenElement) {
      elem.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });

  // Toggle Log Feed
  toggleFeedBtn.addEventListener('click', () => {
    combatFeedPanel.classList.toggle('minimized');
    toggleFeedBtn.textContent = combatFeedPanel.classList.contains('minimized') ? '□' : '_';
  });

  logFeed("Autonomous Combat Choreography Loaded Successfully. Ready.", 'sys');
})();
