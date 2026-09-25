import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameCanvas from './components/GameCanvas';
import { portfolioData, Project } from './data/portfolioData';

type GameState = 'loading' | 'title' | 'dialogue' | 'explore';
type ModalType = 'home' | 'school' | 'tech' | 'projects' | 'experience' | 'workshop' | 'contact' | null;

const BUILDING_TO_MODAL: Record<string, ModalType> = {
  'About Me': 'home',
  'Education': 'school',
  'Skills': 'tech',
  'Projects': 'projects',
  'Experience': 'experience',
  'Developer Workshop': 'workshop',
  'Contact': 'contact',
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>('explore');
  const [currentModal, setCurrentModal] = useState<ModalType>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isNight, setIsNight] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeQuest, setActiveQuest] = useState('Explore the village! Walk along the path or use the top menu.');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [projectFilter, setProjectFilter] = useState<'all' | 'web' | 'game' | 'ai'>('all');
  const [dialogueLine, setDialogueLine] = useState(0);
  const [proximityText, setProximityText] = useState<string | null>(null);
  const [progress, setProgress] = useState(100);
  const [showControlsHint, setShowControlsHint] = useState(false);

  // 🎯 Archery Mini-Game State
  const [isArcheryMode, setIsArcheryMode] = useState(false);
  const [archeryScore, setArcheryScore] = useState(0);
  const [archeryHighScore, setArcheryHighScore] = useState(0);
  const [archeryPower, setArcheryPower] = useState(0);
  const [archeryHitText, setArcheryHitText] = useState<string | null>(null);
  const [archeryShots, setArcheryShots] = useState(0);

  const dialogueLines = [
    "Hi, I'm Gohul.",
    "Full Stack Developer & MSc CS Graduate",
    "Welcome to my cozy 3D countryside village portfolio!",
    "Press ENTER or CLICK below to begin exploring."
  ];

  // Preloader
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setGameState('title'), 400);
          return 100;
        }
        return Math.min(100, prev + Math.floor(Math.random() * 15) + 6);
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Keyboard navigation & interaction handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isArcheryMode) {
          handleExitArchery();
          return;
        }
        if (selectedProject) {
          setSelectedProject(null);
          return;
        }
        if (currentModal) {
          handleCloseModal();
          return;
        }
      }
      if (gameState === 'dialogue' && (e.key === 'Enter' || e.key === ' ')) {
        advanceDialogue();
      } else if (gameState === 'explore' && (e.key === 'Enter' || e.key === 'e' || e.key === 'E')) {
        if (proximityText && !currentModal && !isArcheryMode) {
          handleEnterBuilding();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, dialogueLine, proximityText, currentModal, selectedProject, isArcheryMode]);

  const advanceDialogue = () => {
    if (dialogueLine < dialogueLines.length - 1) {
      setDialogueLine(d => d + 1);
    } else {
      setGameState('explore');
      setShowControlsHint(true);
      setActiveQuest('Explore the village! WASD / Arrow Keys to walk. Press E near a house to enter.');
      setTimeout(() => setShowControlsHint(false), 8000);
    }
  };

  const handleStartGame = () => {
    setGameState('dialogue');
    setDialogueLine(0);
    setActiveQuest('Listening to Gohul...');
  };

  const handleEnterBuilding = () => {
    if (!proximityText) return;
    if (proximityText === 'Archery Range') {
      handleStartArchery();
      return;
    }
    const modalType = BUILDING_TO_MODAL[proximityText] ?? null;
    if (modalType) {
      setCurrentModal(modalType);
      setActiveQuest(`Visiting: ${proximityText}`);
    }
  };

  const handleStartArchery = () => {
    setIsArcheryMode(true);
    setProximityText(null);
    setActiveQuest('🎯 Archery Mode: Move mouse to aim · Hold Left Mouse Button to draw bow · Release to shoot!');
  };

  const handleExitArchery = () => {
    setIsArcheryMode(false);
    setArcheryPower(0);
    setActiveQuest('Explore the village! Walk along the path or use the top menu.');
  };

  const handleScorePoints = (points: number, hitType: string) => {
    setArcheryScore(prev => {
      const nextScore = prev + points;
      setArcheryHighScore(hs => Math.max(hs, nextScore));
      return nextScore;
    });
    setArcheryHitText(hitType);
    setTimeout(() => setArcheryHitText(null), 2500);
  };

  const handlePowerChange = (power: number) => {
    setArcheryPower(power);
  };

  const handleShootArrow = () => {
    setArcheryShots(prev => prev + 1);
  };

  const handleCloseModal = () => {
    setCurrentModal(null);
    setSelectedProject(null);
    setActiveQuest('Explore the village! Walk along the path or use the menu above.');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => { });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => { });
      setIsFullscreen(false);
    }
  };

  const filteredProjects = portfolioData.projects.filter(
    p => projectFilter === 'all' || p.category === projectFilter
  );

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>

      {/* ── 3D WebGL Canvas ── */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <GameCanvas
          gameState={gameState}
          isNight={isNight}
          currentModal={currentModal}
          setProximityText={setProximityText}
          isArcheryMode={isArcheryMode}
          onScorePoints={handleScorePoints}
          onPowerChange={handlePowerChange}
          onShootArrow={handleShootArrow}
        />
      </div>

      {/* ── PRELOADER SCREEN ── */}
      {gameState === 'loading' && (
        <div id="preloader" style={{ zIndex: 100 }}>
          <div className="preloader-content">
            <h1 className="game-logo">Gohul's <span>Village</span></h1>
            <p className="game-subtitle">3D Stylized Countryside Portfolio</p>
            <div className="loader-box">
              <div className="loader-bar" style={{ width: `${progress}%` }} />
            </div>
            <p className="loader-status">Building environment: {progress}%</p>
          </div>
          <div className="preloader-footer"><p>Use WASD / Arrow Keys to walk · Drag mouse to look around · Press E to enter houses</p></div>
        </div>
      )}

      {/* ── TITLE SCREEN ── */}
      {gameState === 'title' && (
        <div id="preloader" style={{ zIndex: 90 }}>
          <div className="preloader-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <h1 className="game-logo">Gohul's <span>Village</span></h1>
            <p className="game-subtitle">A Cozy 3D Portfolio Adventure</p>
            <button className="game-btn" onClick={handleStartGame} style={{ fontSize: '1.4rem', padding: '14px 42px', marginTop: '10px' }}>
              ▶ Start Adventure
            </button>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', marginTop: '6px' }}>
              WASD / Arrows to Move &nbsp;·&nbsp; Drag to Rotate Camera &nbsp;·&nbsp; E to Enter Buildings
            </p>
          </div>
          <div className="preloader-footer"><p>Built with React · TypeScript · Three.js · React Three Fiber · Rapier Physics</p></div>
        </div>
      )}

      {/* ── DIALOGUE SCREEN (Cinematic Intro) ── */}
      {gameState === 'dialogue' && (
        <div className="dialogue-overlay" style={{ zIndex: 80 }}>
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            className="dialogue-box"
          >
            <h3 className="dialogue-title">👋 Gohul</h3>
            <p className="dialogue-text">{dialogueLines[dialogueLine]}</p>
            <button
              className="dialogue-btn-glow"
              onClick={advanceDialogue}
              style={{ marginTop: '10px' }}
            >
              {dialogueLine === dialogueLines.length - 1 ? '✨ EXPLORE VILLAGE (PRESS ENTER)' : 'Next →'}
            </button>
          </motion.div>
        </div>
      )}

      {/* ── HUD (Exploration Overlay) ── */}
      {gameState === 'explore' && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>

          {/* Top Left: Active Quest Objective */}
          <div style={{
            position: 'absolute', top: 20, left: 20,
            background: 'rgba(255,255,255,0.95)',
            border: '3px solid #1b3a17',
            borderRadius: '16px',
            padding: '10px 16px',
            boxShadow: '4px 4px 0 #1b3a17',
            maxWidth: '320px',
            pointerEvents: 'auto'
          }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#4b6b48', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '3px' }}>
              ✨ Current Quest
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.92rem', color: '#1b3a17' }}>{activeQuest}</div>
          </div>

          {/* Top Center: Minimalist Portfolio Navigation Bar */}
          <div style={{
            position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.96)',
            border: '3px solid #1b3a17', borderRadius: '20px', padding: '6px 12px',
            boxShadow: '4px 4px 0 #1b3a17', pointerEvents: 'auto', zIndex: 30,
            overflowX: 'auto', maxWidth: 'calc(100vw - 340px)'
          }}>
            {[
              { name: 'About Me', label: '🏠 About Me', modal: 'home' as const },
              { name: 'Education', label: '🎓 Education', modal: 'school' as const },
              { name: 'Skills', label: '⚡ Skills', modal: 'tech' as const },
              { name: 'Projects', label: '🚀 Projects', modal: 'projects' as const },
              { name: 'Experience', label: '💼 Experience', modal: 'experience' as const },
              { name: 'Developer Workshop', label: '🛠️ Workshop', modal: 'workshop' as const },
              { name: 'Contact', label: '📬 Contact', modal: 'contact' as const },
            ].map((nav, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (currentModal === nav.modal) {
                    setCurrentModal(null);
                    setActiveQuest('Explore the village! Walk along the path or use the menu above.');
                  } else {
                    setCurrentModal(nav.modal);
                    setActiveQuest(`Viewing: ${nav.name}`);
                  }
                }}
                style={{
                  fontFamily: 'var(--font-title)',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  padding: '6px 14px',
                  borderRadius: '12px',
                  border: currentModal === nav.modal ? '2px solid #1b3a17' : '1px solid #cbd5e1',
                  background: currentModal === nav.modal ? '#ff7096' : '#ffffff',
                  color: currentModal === nav.modal ? '#ffffff' : '#1b3a17',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: currentModal === nav.modal ? '2px 2px 0 #1b3a17' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {nav.label}
              </button>
            ))}
          </div>

          {/* Top Right: Lighting Toggle & Controls */}
          <div style={{
            position: 'absolute', top: 20, right: 20,
            display: 'flex', gap: '10px', pointerEvents: 'auto'
          }}>
            <button
              className="hud-settings-btn"
              onClick={() => setIsNight(n => !n)}
              title={isNight ? 'Switch to Warm Sunlit Day' : 'Switch to Sunset Night'}
            >
              {isNight ? '☀️' : '🌙'}
            </button>
            <button
              className="hud-settings-btn"
              onClick={toggleFullscreen}
              title="Toggle Fullscreen"
            >
              {isFullscreen ? '⛶' : '⛶'}
            </button>
          </div>

          {/* Controls Banner Overlay (Fades out after 8 sec) */}
          <AnimatePresence>
            {showControlsHint && (
              <motion.div
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -30, opacity: 0 }}
                style={{
                  position: 'absolute', top: 80, left: '50%', transform: 'translateX(-50%)',
                  pointerEvents: 'auto', zIndex: 40
                }}
              >
                <div className="controls-banner">
                  <span>🎮 Use <b>WASD</b> or <b>Arrow Keys</b> to explore the village!</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Left: Controls Legend */}
          <div style={{
            position: 'absolute', bottom: 20, left: 20,
            background: 'rgba(255,255,255,0.95)',
            border: '3px solid #1b3a17',
            borderRadius: '16px',
            padding: '10px 14px',
            boxShadow: '4px 4px 0 #1b3a17',
            display: 'flex', flexDirection: 'column', gap: '6px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                <span className="key" style={{ padding: '2px 8px', borderRadius: '4px', border: '1px solid #1b3a17', fontWeight: 'bold', fontSize: '0.75rem', background: '#f8fafc' }}>W</span>
                <div style={{ display: 'flex', gap: '2px' }}>
                  <span className="key" style={{ padding: '2px 8px', borderRadius: '4px', border: '1px solid #1b3a17', fontWeight: 'bold', fontSize: '0.75rem', background: '#f8fafc' }}>A</span>
                  <span className="key" style={{ padding: '2px 8px', borderRadius: '4px', border: '1px solid #1b3a17', fontWeight: 'bold', fontSize: '0.75rem', background: '#f8fafc' }}>S</span>
                  <span className="key" style={{ padding: '2px 8px', borderRadius: '4px', border: '1px solid #1b3a17', fontWeight: 'bold', fontSize: '0.75rem', background: '#f8fafc' }}>D</span>
                </div>
              </div>
              <span style={{ fontFamily: 'var(--font-title)', fontSize: '0.85rem', color: '#1b3a17' }}>Move</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#4b6b48', fontWeight: 600 }}>
              <b>SHIFT</b> Run &nbsp;|&nbsp; <b>Drag Mouse</b> Rotate &nbsp;|&nbsp; <b>E</b> Enter
            </div>
          </div>

          {/* Center Bottom: Proximity Interaction Prompt */}
          <AnimatePresence>
            {proximityText && !currentModal && !isArcheryMode && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                className="interaction-prompt"
                onClick={handleEnterBuilding}
                style={{ cursor: 'pointer', pointerEvents: 'auto' }}
              >
                <div className="prompt-badge">{proximityText === 'Archery Range' ? '🎯' : '🏠'} {proximityText}</div>
                <p className="prompt-text">
                  Press <span className="key-badge">E</span> or <span className="key-badge">Enter</span> to {proximityText === 'Archery Range' ? 'play archery' : 'enter house'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 🏹 ARCHERY MINI-GAME HUD OVERLAY */}
          {isArcheryMode && (
            <>
              {/* Aiming Crosshair */}
              <div className="archery-crosshair">
                <div className="crosshair-dot" />
              </div>

              {/* Bow Power Charge Gauge Bar */}
              {archeryPower > 0.02 && (
                <div className="archery-power-bar-container">
                  <div className="archery-power-bar-fill" style={{ width: `${Math.round(archeryPower * 100)}%` }} />
                </div>
              )}

              {/* Hit Points Notification Badge */}
              <AnimatePresence>
                {archeryHitText && (
                  <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    className="archery-hit-badge"
                  >
                    {archeryHitText}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Top Left: Scorecard & Shot Counter */}
              <div style={{
                position: 'absolute', top: 80, left: 20,
                background: 'rgba(255,255,255,0.96)',
                border: '3px solid #1b3a17', borderRadius: '16px',
                padding: '12px 18px', boxShadow: '4px 4px 0 #1b3a17',
                pointerEvents: 'auto', zIndex: 60, display: 'flex', flexDirection: 'column', gap: '4px'
              }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  🎯 ARCHERY RANGE SCORE
                </div>
                <div style={{ fontFamily: 'var(--font-title)', fontSize: '1.6rem', color: '#1b3a17', fontWeight: 'bold' }}>
                  {archeryScore} <span style={{ fontSize: '0.9rem', color: '#64748b' }}>PTS</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>
                  🏆 High Score: <b>{archeryHighScore}</b> &nbsp;|&nbsp; 🏹 Shots: <b>{archeryShots}</b>
                </div>
              </div>

              {/* Top Right: Exit Archery Button */}
              <div style={{ position: 'absolute', top: 80, right: 20, pointerEvents: 'auto', zIndex: 60 }}>
                <button
                  onClick={handleExitArchery}
                  style={{
                    fontFamily: 'var(--font-title)',
                    fontSize: '1.0rem',
                    fontWeight: 'bold',
                    padding: '10px 20px',
                    borderRadius: '14px',
                    border: '3px solid #1b3a17',
                    background: '#ef4444',
                    color: 'white',
                    cursor: 'pointer',
                    boxShadow: '3px 3px 0 #1b3a17'
                  }}
                >
                  🎯 EXIT ARCHERY (ESC)
                </button>
              </div>

              {/* Bottom Center: Archery Controls Hint */}
              <div style={{
                position: 'absolute', bottom: 15, left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(15, 23, 42, 0.9)', border: '2px solid #388e3c',
                borderRadius: '14px', padding: '8px 20px', color: 'white',
                fontFamily: 'var(--font-title)', fontSize: '0.92rem', zIndex: 60,
                pointerEvents: 'none', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
              }}>
                🖱️ Move Mouse to Aim &nbsp;•&nbsp; 🖱️ <b>Hold Left Click</b> to Pull String &nbsp;•&nbsp; 🚀 <b>Release</b> to Shoot
              </div>
            </>
          )}

        </div>
      )}

      {/* ── MODALS & INTERACTION OVERLAYS ── */}
      <AnimatePresence>
        {currentModal && (
          <div className="modal-overlay" style={{ zIndex: 50 }}>
            <motion.div
              initial={{ scale: 0.88, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.88, y: 30, opacity: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 200 }}
              className="modal-card"
              style={{
                maxHeight: '88vh', width: '92%', maxWidth: '900px',
                display: 'flex', flexDirection: 'column',
                border: '4px solid #1b3a17', borderRadius: '24px',
                background: 'white', overflowY: 'auto', position: 'relative'
              }}
            >
              {/* Close Modal Button */}
              <button
                className="modal-close"
                onClick={handleCloseModal}
                style={{
                  position: 'absolute', top: 16, right: 16, zIndex: 10,
                  width: '36px', height: '36px', borderRadius: '50%',
                  border: '2px solid #1b3a17', background: '#ff7096', color: 'white',
                  fontWeight: 'bold', fontSize: '1.2rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '2px 2px 0 #1b3a17'
                }}
              >
                &times;
              </button>

              {/* 🏠 HOUSE 1: ABOUT ME */}
              {currentModal === 'home' && (
                <>
                  <div className="modal-header" style={{ padding: '24px 28px 12px', borderBottom: '2px dashed #cbd5e1' }}>
                    <div className="modal-badge" style={{ background: '#0d9488', color: 'white', padding: '4px 12px', borderRadius: '12px', display: 'inline-block', fontFamily: 'var(--font-title)', fontSize: '0.85rem', marginBottom: '8px' }}>🏠 House 1</div>
                    <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '1.8rem', color: '#1b3a17', margin: 0 }}>About Me</h2>
                    <p style={{ color: '#4b6b48', fontSize: '0.92rem', margin: '4px 0 0' }}>Personal introduction and developer background</p>
                  </div>
                  <div className="modal-body" style={{ padding: '24px 28px', display: 'flex', gap: '28px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', minWidth: '200px', flex: '0 0 auto' }}>
                      <div style={{ fontSize: '5rem', padding: '20px', background: '#fef3c7', borderRadius: '50%', border: '3px solid #1b3a17', boxShadow: '4px 4px 0 #1b3a17' }}>👨‍💻</div>
                      <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.5rem', color: '#1b3a17', margin: 0 }}>{portfolioData.profile.name}</h3>
                      <p style={{ color: '#d97706', fontWeight: 700, margin: 0, fontSize: '0.95rem' }}>{portfolioData.profile.role}</p>
                      <p style={{ color: '#4b6b48', fontSize: '0.85rem', margin: 0 }}>📍 {portfolioData.profile.location}</p>
                      <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '8px' }}>
                        <a href={portfolioData.profile.github} target="_blank" rel="noreferrer" style={{ flex: 1, textAlign: 'center', textDecoration: 'none', background: '#1b3a17', color: 'white', padding: '8px', borderRadius: '10px', fontWeight: 'bold', fontSize: '0.85rem' }}>GitHub</a>
                        <a href={portfolioData.profile.linkedin} target="_blank" rel="noreferrer" style={{ flex: 1, textAlign: 'center', textDecoration: 'none', background: '#0284c7', color: 'white', padding: '8px', borderRadius: '10px', fontWeight: 'bold', fontSize: '0.85rem' }}>LinkedIn</a>
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ background: '#f8fafc', border: '2px solid #1b3a17', borderRadius: '16px', padding: '18px', boxShadow: '3px 3px 0 #1b3a17' }}>
                        <h4 style={{ fontFamily: 'var(--font-title)', fontSize: '1.15rem', marginBottom: '8px', color: '#1b3a17' }}>Biography</h4>
                        <p style={{ color: '#334155', lineHeight: '1.6', fontSize: '0.92rem', margin: 0 }}>{portfolioData.profile.bio}</p>
                      </div>
                      <div style={{ background: '#fef3c7', border: '2px solid #1b3a17', borderRadius: '16px', padding: '18px', boxShadow: '3px 3px 0 #1b3a17' }}>
                        <h4 style={{ fontFamily: 'var(--font-title)', fontSize: '1.15rem', marginBottom: '6px', color: '#1b3a17' }}>Core Values &amp; Philosophy</h4>
                        <p style={{ color: '#475569', lineHeight: '1.6', fontSize: '0.9rem', margin: 0 }}>
                          Software development is an art of blending clean logic with intuitive visual design. Whether building full-stack Django platforms, responsive React components, or high-performance WebGL 3D worlds, I focus on delivering seamless user experiences.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* 🏠 HOUSE 2: EDUCATION */}
              {currentModal === 'school' && (
                <>
                  <div className="modal-header" style={{ padding: '24px 28px 12px', borderBottom: '2px dashed #cbd5e1' }}>
                    <div className="modal-badge" style={{ background: '#f97316', color: 'white', padding: '4px 12px', borderRadius: '12px', display: 'inline-block', fontFamily: 'var(--font-title)', fontSize: '0.85rem', marginBottom: '8px' }}>🎓 House 2</div>
                    <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '1.8rem', color: '#1b3a17', margin: 0 }}>Education &amp; Academic Journey</h2>
                    <p style={{ color: '#4b6b48', fontSize: '0.92rem', margin: '4px 0 0' }}>Degrees, institutions, and academic milestones</p>
                  </div>
                  <div className="modal-body" style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {portfolioData.education.map((item, idx) => (
                      <div key={idx} style={{ background: '#f8fafc', border: '3px solid #1b3a17', borderRadius: '18px', padding: '20px', boxShadow: '4px 4px 0 #1b3a17', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                        <div style={{ fontSize: '2.5rem', background: '#fef3c7', padding: '12px', borderRadius: '16px', border: '2px solid #1b3a17' }}>{item.icon}</div>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, background: '#f97316', color: 'white', padding: '2px 10px', borderRadius: '20px', display: 'inline-block', marginBottom: '6px' }}>{item.date}</span>
                          <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.3rem', margin: '0 0 2px', color: '#1b3a17' }}>{item.degree}</h3>
                          <h4 style={{ color: '#d97706', fontWeight: 700, fontSize: '0.95rem', margin: '0 0 8px' }}>{item.institution}</h4>
                          <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: '1.5', margin: 0 }}>{item.desc}</p>
                        </div>
                      </div>
                    ))}

                    <div style={{ background: '#eff6ff', border: '2px solid #1b3a17', borderRadius: '16px', padding: '18px', boxShadow: '3px 3px 0 #1b3a17' }}>
                      <h4 style={{ fontFamily: 'var(--font-title)', fontSize: '1.15rem', color: '#1b3a17', marginBottom: '10px' }}>📜 Academic Specializations</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', fontSize: '0.88rem', color: '#334155' }}>
                        <div style={{ background: 'white', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>• Advanced Web Architectures</div>
                        <div style={{ background: 'white', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>• Database Systems &amp; SQL</div>
                        <div style={{ background: 'white', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>• Distributed Systems</div>
                        <div style={{ background: 'white', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>• Data Structures &amp; Algorithms</div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* 🏠 HOUSE 3: SKILLS */}
              {currentModal === 'tech' && (
                <>
                  <div className="modal-header" style={{ padding: '24px 28px 12px', borderBottom: '2px dashed #cbd5e1' }}>
                    <div className="modal-badge" style={{ background: '#8b5cf6', color: 'white', padding: '4px 12px', borderRadius: '12px', display: 'inline-block', fontFamily: 'var(--font-title)', fontSize: '0.85rem', marginBottom: '8px' }}>⚡ House 3</div>
                    <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '1.8rem', color: '#1b3a17', margin: 0 }}>Technical Skills</h2>
                    <p style={{ color: '#4b6b48', fontSize: '0.92rem', margin: '4px 0 0' }}>Programming languages, frameworks, databases, and developer tools</p>
                  </div>
                  <div className="modal-body" style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
                    {Object.entries(portfolioData.skills).map(([category, items], idx) => (
                      <div key={idx} style={{ background: '#f8fafc', border: '2px solid #1b3a17', borderRadius: '18px', padding: '18px', boxShadow: '3px 3px 0 #1b3a17' }}>
                        <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.15rem', color: '#1b3a17', marginBottom: '14px', textTransform: 'capitalize' }}>
                          {category === 'languages' ? '🐍 Languages & Core' : category === 'frameworks' ? '⚡ Frameworks & Libraries' : '💾 Databases, Tools & 3D'}
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
                          {items.map((skill, sIdx) => (
                            <div key={sIdx} style={{ background: 'white', border: '2px solid #1b3a17', borderRadius: '14px', padding: '12px 14px', boxShadow: '2px 2px 0 #1b3a17' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                <span style={{ fontSize: '1.5rem' }}>{skill.icon}</span>
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1b3a17' }}>{skill.name}</div>
                                </div>
                              </div>
                              {skill.desc && <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 8px', lineHeight: '1.4' }}>{skill.desc}</p>}
                              <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: `${skill.lvl}%`, height: '100%', background: 'linear-gradient(90deg, #388e3c, #0d9488)', borderRadius: '4px' }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* 🏠 HOUSE 4: PROJECTS */}
              {currentModal === 'projects' && (
                <>
                  <div className="modal-header" style={{ padding: '24px 28px 12px', borderBottom: '2px dashed #cbd5e1' }}>
                    <div className="modal-badge" style={{ background: '#ef4444', color: 'white', padding: '4px 12px', borderRadius: '12px', display: 'inline-block', fontFamily: 'var(--font-title)', fontSize: '0.85rem', marginBottom: '8px' }}>🚀 House 4</div>
                    <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '1.8rem', color: '#1b3a17', margin: 0 }}>Projects Gallery</h2>
                    <p style={{ color: '#4b6b48', fontSize: '0.92rem', margin: '4px 0 0' }}>Inspect applications, control panels, and interactive web tools I have built</p>
                  </div>

                  {/* Filter tabs */}
                  <div style={{ padding: '0 28px', display: 'flex', gap: '8px', marginTop: '12px' }}>
                    {(['all', 'web', 'ai', 'game'] as const).map(cat => (
                      <button
                        key={cat}
                        onClick={() => setProjectFilter(cat)}
                        style={{
                          fontFamily: 'var(--font-title)',
                          fontSize: '0.85rem',
                          padding: '6px 14px',
                          borderRadius: '12px',
                          border: '2px solid #1b3a17',
                          background: projectFilter === cat ? '#1b3a17' : '#ffffff',
                          color: projectFilter === cat ? '#ffffff' : '#1b3a17',
                          cursor: 'pointer',
                          boxShadow: projectFilter === cat ? '2px 2px 0 #1b3a17' : 'none'
                        }}
                      >
                        {cat === 'all' ? 'All Projects' : cat === 'web' ? 'Web Apps' : cat === 'ai' ? 'AI Systems' : 'Games'}
                      </button>
                    ))}
                  </div>

                  <div className="modal-body" style={{ padding: '20px 28px 28px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
                    {filteredProjects.map((p, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedProject(p)}
                        style={{
                          background: '#f8fafc',
                          border: '3px solid #1b3a17',
                          borderRadius: '18px',
                          padding: '16px',
                          boxShadow: '4px 4px 0 #1b3a17',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '2.4rem', background: '#fef3c7', padding: '8px 12px', borderRadius: '14px', border: '2px solid #1b3a17' }}>{p.icon}</span>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, background: '#388e3c', color: 'white', padding: '3px 10px', borderRadius: '12px' }}>Press E to Inspect</span>
                        </div>
                        <h4 style={{ fontFamily: 'var(--font-title)', fontSize: '1.2rem', color: '#1b3a17', margin: 0 }}>{p.title}</h4>
                        <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: '1.5', margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.desc}</p>

                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: 'auto' }}>
                          {p.tags.map((t, tIdx) => (
                            <span key={tIdx} style={{ fontSize: '0.72rem', background: '#e2e8f0', color: '#1e293b', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>{t}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Detailed Inspection Modal Overlay */}
                  <AnimatePresence>
                    {selectedProject && (
                      <div style={{
                        position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 60, padding: '20px'
                      }}>
                        <motion.div
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.9, opacity: 0 }}
                          style={{
                            background: 'white', border: '4px solid #1b3a17', borderRadius: '24px',
                            padding: '28px', maxWidth: '650px', width: '100%', maxHeight: '82vh',
                            overflowY: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.4)', position: 'relative'
                          }}
                        >
                          <button
                            onClick={() => setSelectedProject(null)}
                            style={{ position: 'absolute', top: 16, right: 16, width: '32px', height: '32px', borderRadius: '50%', border: '2px solid #1b3a17', background: '#ef4444', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
                          >
                            &times;
                          </button>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                            <span style={{ fontSize: '3rem', background: '#fef3c7', padding: '10px 14px', borderRadius: '16px', border: '2px solid #1b3a17' }}>{selectedProject.icon}</span>
                            <div>
                              <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.6rem', color: '#1b3a17', margin: 0 }}>{selectedProject.title}</h3>
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                                {selectedProject.tags.map((t, idx) => (
                                  <span key={idx} style={{ fontSize: '0.75rem', background: '#0284c7', color: 'white', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>{t}</span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div style={{ background: '#f8fafc', border: '2px solid #1b3a17', borderRadius: '14px', padding: '16px', marginBottom: '16px' }}>
                            <h4 style={{ fontFamily: 'var(--font-title)', fontSize: '1.05rem', color: '#1b3a17', marginBottom: '6px' }}>Description</h4>
                            <p style={{ color: '#334155', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>{selectedProject.details || selectedProject.desc}</p>
                          </div>

                          {selectedProject.features && (
                            <div style={{ marginBottom: '16px' }}>
                              <h4 style={{ fontFamily: 'var(--font-title)', fontSize: '1.05rem', color: '#1b3a17', marginBottom: '8px' }}>✨ Key Features</h4>
                              <ul style={{ color: '#475569', fontSize: '0.88rem', lineHeight: '1.8', paddingLeft: '20px' }}>
                                {selectedProject.features.map((f, fIdx) => (
                                  <li key={fIdx}>{f}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {selectedProject.contribution && (
                            <div style={{ background: '#fef3c7', border: '2px solid #1b3a17', borderRadius: '14px', padding: '14px', marginBottom: '20px' }}>
                              <h4 style={{ fontFamily: 'var(--font-title)', fontSize: '1.05rem', color: '#1b3a17', marginBottom: '4px' }}>🛠️ My Contribution</h4>
                              <p style={{ color: '#475569', fontSize: '0.88rem', lineHeight: '1.5', margin: 0 }}>{selectedProject.contribution}</p>
                            </div>
                          )}

                          <div style={{ display: 'flex', gap: '12px' }}>
                            <a href={selectedProject.codeLink} target="_blank" rel="noreferrer" style={{ flex: 1, textAlign: 'center', textDecoration: 'none', background: '#1b3a17', color: 'white', padding: '10px', borderRadius: '12px', fontWeight: 'bold' }}>GitHub Repository</a>
                            <a href={selectedProject.liveLink} target="_blank" rel="noreferrer" style={{ flex: 1, textAlign: 'center', textDecoration: 'none', background: '#ff7096', color: 'white', padding: '10px', borderRadius: '12px', fontWeight: 'bold' }}>Live Demo</a>
                          </div>
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>
                </>
              )}

              {/* 💼 HOUSE 5: EXPERIENCE */}
              {currentModal === 'experience' && (
                <>
                  <div className="modal-header" style={{ padding: '24px 28px 12px', borderBottom: '2px dashed #cbd5e1' }}>
                    <div className="modal-badge" style={{ background: '#6366f1', color: 'white', padding: '4px 12px', borderRadius: '12px', display: 'inline-block', fontFamily: 'var(--font-title)', fontSize: '0.85rem', marginBottom: '8px' }}>💼 House 5</div>
                    <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '1.8rem', color: '#1b3a17', margin: 0 }}>Work Experience</h2>
                    <p style={{ color: '#4b6b48', fontSize: '0.92rem', margin: '4px 0 0' }}>Professional career experience and software engineering achievements</p>
                  </div>
                  <div className="modal-body" style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {portfolioData.experience.map((item, idx) => (
                      <div key={idx} style={{ background: '#f8fafc', border: '3px solid #1b3a17', borderRadius: '18px', padding: '22px', boxShadow: '4px 4px 0 #1b3a17' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                          <div>
                            <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.3rem', margin: 0, color: '#1b3a17' }}>{item.role}</h3>
                            <h4 style={{ color: '#6366f1', fontWeight: 700, fontSize: '0.95rem', margin: '2px 0 0' }}>{item.company}</h4>
                          </div>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, background: '#1b3a17', color: 'white', padding: '4px 12px', borderRadius: '20px', alignSelf: 'flex-start' }}>{item.date}</span>
                        </div>
                        <p style={{ color: '#334155', fontSize: '0.92rem', margin: '10px 0', lineHeight: '1.6' }}>{item.desc}</p>
                        {item.details && (
                          <ul style={{ color: '#475569', fontSize: '0.88rem', lineHeight: '1.8', paddingLeft: '20px', margin: 0 }}>
                            {item.details.map((d, dIdx) => <li key={dIdx}>{d}</li>)}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* 🛠️ HOUSE 6: DEVELOPER WORKSHOP */}
              {currentModal === 'workshop' && (
                <>
                  <div className="modal-header" style={{ padding: '24px 28px 12px', borderBottom: '2px dashed #cbd5e1' }}>
                    <div className="modal-badge" style={{ background: '#f59e0b', color: 'white', padding: '4px 12px', borderRadius: '12px', display: 'inline-block', fontFamily: 'var(--font-title)', fontSize: '0.85rem', marginBottom: '8px' }}>🛠️ House 6</div>
                    <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '1.8rem', color: '#1b3a17', margin: 0 }}>Developer Workshop</h2>
                    <p style={{ color: '#4b6b48', fontSize: '0.92rem', margin: '4px 0 0' }}>My development workstation setup, workflow tools, and current learning journey</p>
                  </div>
                  <div className="modal-body" style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* What I am currently learning */}
                    <div style={{ background: '#fffbeb', border: '3px solid #1b3a17', borderRadius: '18px', padding: '20px', boxShadow: '4px 4px 0 #1b3a17' }}>
                      <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.2rem', color: '#1b3a17', marginBottom: '12px' }}>🌱 What I am Currently Learning</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                        {portfolioData.workshop.currentlyLearning.map((item, idx) => (
                          <div key={idx} style={{ background: 'white', border: '2px solid #1b3a17', borderRadius: '14px', padding: '14px', boxShadow: '2px 2px 0 #1b3a17' }}>
                            <div style={{ fontSize: '1.6rem', marginBottom: '4px' }}>{item.icon}</div>
                            <h4 style={{ fontFamily: 'var(--font-title)', fontSize: '1.05rem', color: '#1b3a17', margin: '0 0 4px' }}>{item.name}</h4>
                            <p style={{ color: '#64748b', fontSize: '0.83rem', lineHeight: '1.4', margin: 0 }}>{item.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Developer Equipment & Environment */}
                    <div style={{ background: '#f8fafc', border: '3px solid #1b3a17', borderRadius: '18px', padding: '20px', boxShadow: '4px 4px 0 #1b3a17' }}>
                      <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.2rem', color: '#1b3a17', marginBottom: '12px' }}>💻 Workstation &amp; Dev Environment</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                        {portfolioData.workshop.devTools.map((item, idx) => (
                          <div key={idx} style={{ background: 'white', border: '2px solid #1b3a17', borderRadius: '14px', padding: '14px', boxShadow: '2px 2px 0 #1b3a17' }}>
                            <div style={{ fontSize: '1.6rem', marginBottom: '4px' }}>{item.icon}</div>
                            <h4 style={{ fontFamily: 'var(--font-title)', fontSize: '1.05rem', color: '#1b3a17', margin: '0 0 4px' }}>{item.name}</h4>
                            <p style={{ color: '#64748b', fontSize: '0.83rem', lineHeight: '1.4', margin: 0 }}>{item.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </>
              )}

              {/* 📬 HOUSE 7: CONTACT AREA */}
              {currentModal === 'contact' && (
                <>
                  <div className="modal-header" style={{ padding: '24px 28px 12px', borderBottom: '2px dashed #cbd5e1' }}>
                    <div className="modal-badge" style={{ background: '#eab308', color: 'white', padding: '4px 12px', borderRadius: '12px', display: 'inline-block', fontFamily: 'var(--font-title)', fontSize: '0.85rem', marginBottom: '8px' }}>📬 House 7</div>
                    <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '1.8rem', color: '#1b3a17', margin: 0 }}>Contact Area</h2>
                    <p style={{ color: '#4b6b48', fontSize: '0.92rem', margin: '4px 0 0' }}>Send Gohul a message or reach out via email/LinkedIn</p>
                  </div>
                  <div className="modal-body" style={{ padding: '24px 28px' }}>
                    {!formSubmitted ? (
                      <form onSubmit={e => { e.preventDefault(); setFormSubmitted(true); }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1b3a17' }}>Your Name</label>
                          <input type="text" placeholder="Enter your name" required value={contactName} onChange={e => setContactName(e.target.value)} style={{ padding: '12px', borderRadius: '12px', border: '2px solid #1b3a17', fontSize: '0.95rem', outline: 'none' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1b3a17' }}>Your Email</label>
                          <input type="email" placeholder="your.email@example.com" required value={contactEmail} onChange={e => setContactEmail(e.target.value)} style={{ padding: '12px', borderRadius: '12px', border: '2px solid #1b3a17', fontSize: '0.95rem', outline: 'none' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1b3a17' }}>Your Message</label>
                          <textarea rows={4} placeholder="Hi Gohul, I'd like to talk about..." required value={contactMessage} onChange={e => setContactMessage(e.target.value)} style={{ padding: '12px', borderRadius: '12px', border: '2px solid #1b3a17', fontSize: '0.95rem', outline: 'none' }} />
                        </div>
                        <button type="submit" className="game-btn" style={{ fontSize: '1.1rem', padding: '12px 24px', marginTop: '8px' }}>
                          ✉️ Send Gohul a Message
                        </button>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
                          <a href={`mailto:${portfolioData.profile.email}`} style={{ textDecoration: 'none', color: '#1b3a17', fontWeight: 'bold', fontSize: '0.9rem' }}>📧 {portfolioData.profile.email}</a>
                          <a href={portfolioData.profile.github} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: '#1b3a17', fontWeight: 'bold', fontSize: '0.9rem' }}>🐙 GitHub</a>
                          <a href={portfolioData.profile.linkedin} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: '#0284c7', fontWeight: 'bold', fontSize: '0.9rem' }}>💼 LinkedIn</a>
                        </div>
                      </form>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '30px 0', textAlign: 'center' }}>
                        <div style={{ fontSize: '4rem' }}>📬</div>
                        <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.6rem', color: '#1b3a17', margin: 0 }}>Message Received!</h3>
                        <p style={{ color: '#475569', fontSize: '1rem', maxWidth: '420px', margin: 0 }}>Thank you for reaching out! Your message has landed in Gohul's mailbox. He will reply shortly.</p>
                        <button className="game-btn" onClick={() => { setFormSubmitted(false); setContactName(''); setContactEmail(''); setContactMessage(''); }}>
                          Send Another Message
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
