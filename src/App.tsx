import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameCanvas from './components/GameCanvas';
import { portfolioData } from './data/portfolioData';

type GameState = 'loading' | 'title' | 'dialogue' | 'explore';
type ModalType = 'home' | 'school' | 'experience' | 'tech' | 'ai-lab' | 'workshop' | 'library' | 'contact' | null;

const BUILDING_TO_MODAL: Record<string, ModalType> = {
  'Home': 'home',
  'School': 'school',
  'Company Headquarters': 'experience',
  'Computer Center': 'tech',
  'AI Laboratory': 'ai-lab',
  'Workshop': 'workshop',
  'Projects Timeline': 'workshop',
  'Library': 'library',
  'Contact Center': 'contact',
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>('explore');
  const [currentModal, setCurrentModal] = useState<ModalType>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isNight, setIsNight] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeQuest, setActiveQuest] = useState('Explore the village! Walk to a building or click the menu above.');
  const [selectedBook, setSelectedBook] = useState<number | null>(null);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [projectFilter, setProjectFilter] = useState<'all' | 'web' | 'game' | 'ai'>('all');
  const [dialogueLine, setDialogueLine] = useState(0);
  const [proximityText, setProximityText] = useState<string | null>(null);
  const [progress, setProgress] = useState(100);

  const dialogueLines = [
    "Hi! I'm Gohul.",
    "I'm a Full Stack Developer.",
    "Welcome to my interactive portfolio.",
    "Press ENTER to explore my world."
  ];

  const bgMusicRef = useRef<HTMLAudioElement | null>(null);

  // Preloader
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setGameState('title'), 500);
          return 100;
        }
        return Math.min(100, prev + Math.floor(Math.random() * 12) + 4);
      });
    }, 120);
    return () => clearInterval(interval);
  }, []);

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (currentModal) handleCloseModal();
        return;
      }
      if (gameState === 'dialogue' && (e.key === 'Enter' || e.key === ' ')) {
        advanceDialogue();
      } else if (gameState === 'explore' && (e.key === 'Enter' || e.key === 'e' || e.key === 'E')) {
        if (proximityText && !currentModal) handleEnterBuilding();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, dialogueLine, proximityText, currentModal]);

  const advanceDialogue = () => {
    if (dialogueLine < dialogueLines.length - 1) {
      setDialogueLine(d => d + 1);
    } else {
      setGameState('explore');
      setActiveQuest('Explore the village! Approach a building to enter.');
      if (bgMusicRef.current) bgMusicRef.current.play().catch(() => {});
    }
  };

  const handleStartGame = () => {
    setGameState('dialogue');
    setActiveQuest('Listen to Gohul speak...');
  };

  const handleEnterBuilding = () => {
    if (!proximityText) return;
    const modalType = BUILDING_TO_MODAL[proximityText] ?? null;
    if (modalType) {
      setCurrentModal(modalType);
      setActiveQuest(`Viewing: ${proximityText}`);
    }
  };

  const handleCloseModal = () => {
    setCurrentModal(null);
    setSelectedBook(null);
    setActiveQuest('Explore the village! Approach a building to enter.');
  };

  const toggleMute = () => {
    setIsMuted(m => {
      if (bgMusicRef.current) bgMusicRef.current.muted = !m;
      return !m;
    });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const filteredProjects = portfolioData.projects.filter(
    p => projectFilter === 'all' || p.category === projectFilter
  );

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>

      {/* ── 3D Canvas ── */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <GameCanvas
          gameState={gameState}
          isNight={isNight}
          currentModal={currentModal}
          setProximityText={setProximityText}
        />
      </div>

      {/* ── PRELOADER ── */}
      {(gameState === 'loading') && (
        <div id="preloader" style={{ zIndex: 100 }}>
          <div className="preloader-content">
            <h1 className="game-logo">Gohul's <span>World</span></h1>
            <p className="game-subtitle">3D Full Stack Developer Portfolio</p>
            <div className="loader-box">
              <div className="loader-bar" style={{ width: `${progress}%` }} />
            </div>
            <p className="loader-status">Assembling village: {progress}%</p>
          </div>
          <div className="preloader-footer"><p>Use WASD to walk · Drag mouse to look · Press E to enter buildings</p></div>
        </div>
      )}

      {/* ── TITLE SCREEN ── */}
      {gameState === 'title' && (
        <div id="preloader" style={{ zIndex: 90 }}>
          <div className="preloader-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <h1 className="game-logo">Gohul's <span>World</span></h1>
            <p className="game-subtitle">A 3D RPG Portfolio Adventure</p>
            <button className="game-btn" onClick={handleStartGame} style={{ fontSize: '1.4rem', padding: '14px 40px', marginTop: '10px' }}>
              ▶ Start Adventure
            </button>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.9rem', marginTop: '8px' }}>
              WASD / Arrow Keys to walk &nbsp;·&nbsp; Drag to look &nbsp;·&nbsp; E to enter buildings
            </p>
          </div>
          <div className="preloader-footer"><p>Built with React · TypeScript · React Three Fiber · Rapier Physics</p></div>
        </div>
      )}

      {/* ── DIALOGUE BOX ── */}
      {gameState === 'dialogue' && (
        <div className="dialogue-overlay" style={{ zIndex: 80 }}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            className="dialogue-box"
          >
            <h3 className="dialogue-title">👋 Gohul</h3>
            <p className="dialogue-text">{dialogueLines[dialogueLine]}</p>
            <button
              className="dialogue-btn-glow"
              onClick={advanceDialogue}
              style={{ marginTop: '12px' }}
            >
              {dialogueLine === dialogueLines.length - 1 ? '✨ PRESS ENTER / CLICK HERE' : 'Next →'}
            </button>
          </motion.div>
        </div>
      )}

      {/* ── HUD (Exploration Mode) ── */}
      {gameState === 'explore' && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>

          {/* Top Left: Active Quest */}
          <div style={{
            position: 'absolute', top: 24, left: 24,
            background: 'rgba(255,255,255,0.95)',
            border: '3px solid #1e293b',
            borderRadius: '16px',
            padding: '12px 18px',
            boxShadow: '4px 4px 0 #1e293b',
            maxWidth: '300px',
            pointerEvents: 'auto'
          }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
              ✨ Active Objective
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#1e293b' }}>{activeQuest}</div>
          </div>

          {/* Bottom Left: Controls */}
          <div style={{
            position: 'absolute', bottom: 24, left: 24,
            background: 'rgba(255,255,255,0.95)',
            border: '3px solid #1e293b',
            borderRadius: '16px',
            padding: '12px 16px',
            boxShadow: '4px 4px 0 #1e293b',
            display: 'flex', flexDirection: 'column', gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                <span className="key">W</span>
                <div style={{ display: 'flex', gap: '3px' }}>
                  <span className="key">A</span>
                  <span className="key">S</span>
                  <span className="key">D</span>
                </div>
              </div>
              <span className="helper-text">Move</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '0.75rem', color: '#64748b' }}>
              <span><b>SHIFT</b> Run &nbsp;|&nbsp; <b>Drag</b> Look &nbsp;|&nbsp; <b>E</b> Enter</span>
            </div>
          </div>

          {/* Top Center: Quick Navigation Menu Bar */}
          <div style={{
            position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.95)',
            border: '3px solid #1e293b', borderRadius: '20px', padding: '6px 12px',
            boxShadow: '4px 4px 0 #1e293b', pointerEvents: 'auto', zIndex: 30,
            overflowX: 'auto', maxWidth: 'calc(100vw - 360px)'
          }}>
            {[
              { name: 'Home', label: '🏡 Home', modal: 'home' as const },
              { name: 'School', label: '🏫 Education', modal: 'school' as const },
              { name: 'Computer Center', label: '🖥️ Skills', modal: 'tech' as const },
              { name: 'AI Laboratory', label: '🔭 AI Lab', modal: 'ai-lab' as const },
              { name: 'Workshop', label: '⚙️ Projects', modal: 'workshop' as const },
              { name: 'Library', label: '📚 Books', modal: 'library' as const },
              { name: 'Company Headquarters', label: '🏰 Experience', modal: 'experience' as const },
              { name: 'Contact Center', label: '📬 Contact', modal: 'contact' as const },
            ].map((nav, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (currentModal === nav.modal) {
                    setCurrentModal(null);
                    setActiveQuest('Explore the village! Walk to a building or click the menu above.');
                  } else {
                    setCurrentModal(nav.modal);
                    setActiveQuest(`Viewing: ${nav.name}`);
                  }
                }}
                style={{
                  fontFamily: 'var(--font-title)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  padding: '6px 12px',
                  borderRadius: '12px',
                  border: currentModal === nav.modal ? '2px solid #1e293b' : '1px solid #cbd5e1',
                  background: currentModal === nav.modal ? '#ff7096' : '#ffffff',
                  color: currentModal === nav.modal ? '#ffffff' : '#1e293b',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: currentModal === nav.modal ? '2px 2px 0 #1e293b' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {nav.label}
              </button>
            ))}
          </div>

          {/* Top Right: Settings */}
          <div style={{
            position: 'absolute', top: 24, right: 24,
            display: 'flex', gap: '10px', pointerEvents: 'auto'
          }}>
            <button
              className="hud-settings-btn"
              onClick={toggleMute}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? '🔇' : '🔊'}
            </button>
            <button
              className="hud-settings-btn"
              onClick={() => setIsNight(n => !n)}
              title={isNight ? 'Switch to Day' : 'Switch to Night'}
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

          {/* Center Bottom: Proximity Prompt */}
          <AnimatePresence>
            {proximityText && !currentModal && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                className="interaction-prompt"
                onClick={handleEnterBuilding}
                style={{ cursor: 'pointer', pointerEvents: 'auto' }}
              >
                <div className="prompt-badge">{proximityText}</div>
                <p className="prompt-text">
                  Press <span className="key-badge">E</span> or <span className="key-badge">Enter</span> to enter
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── MODALS ── */}
      <AnimatePresence>
        {currentModal && (
          <div className="modal-overlay" style={{ zIndex: 50 }}>
            <motion.div
              initial={{ scale: 0.85, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.85, y: 40, opacity: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 200 }}
              className="modal-card"
              style={{ maxHeight: '88vh', width: '92%', maxWidth: '900px', display: 'flex', flexDirection: 'column', border: '4px solid #1e293b', borderRadius: '24px', background: 'white', overflowY: 'auto', position: 'relative' }}
            >
              {/* Close button */}
              <button
                className="modal-close"
                onClick={handleCloseModal}
                style={{ position: 'absolute', top: 16, right: 16, zIndex: 5 }}
              >
                &times;
              </button>

              {/* HOME */}
              {currentModal === 'home' && (
                <>
                  <div className="modal-header">
                    <div className="modal-badge" style={{ background: '#0d9488', color: 'white' }}>🏡 Cottage</div>
                    <h2>About Me</h2>
                    <p>Personal biography &amp; introduction</p>
                  </div>
                  <div className="modal-body" style={{ display: 'flex', gap: '28px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', minWidth: '180px', flex: '0 0 auto' }}>
                      <div style={{ fontSize: '5rem', padding: '20px', background: '#fef3c7', borderRadius: '50%', border: '3px solid #1e293b', boxShadow: '3px 3px 0 #1e293b' }}>👨‍💻</div>
                      <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.4rem', color: '#1e293b', margin: 0 }}>{portfolioData.profile.name}</h3>
                      <p style={{ color: '#d97706', fontWeight: 600, margin: 0, fontSize: '0.9rem' }}>{portfolioData.profile.role}</p>
                      <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>📍 {portfolioData.profile.location}</p>
                      <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                        <a href={portfolioData.profile.github} target="_blank" rel="noreferrer" className="project-link-btn" style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}>GitHub</a>
                        <a href={portfolioData.profile.linkedin} target="_blank" rel="noreferrer" className="project-link-btn primary-link" style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}>LinkedIn</a>
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ background: '#f8fafc', border: '2px solid #1e293b', borderRadius: '14px', padding: '16px', boxShadow: '2px 2px 0 #1e293b' }}>
                        <h4 style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem', marginBottom: '8px', color: '#1e293b' }}>Biography</h4>
                        <p style={{ color: '#475569', lineHeight: '1.6', fontSize: '0.9rem', margin: 0 }}>{portfolioData.profile.bio}</p>
                      </div>
                      <div>
                        <h4 style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem', marginBottom: '6px', color: '#1e293b' }}>Philosophy</h4>
                        <p style={{ color: '#64748b', lineHeight: '1.5', fontSize: '0.88rem', margin: 0 }}>
                          Whether coding complex algorithms, optimizing 3D engine transformations, or polishing animations to pixel perfection — I design software with users in mind. Every project should tell a story and feel like a cozy adventure.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* SCHOOL */}
              {currentModal === 'school' && (
                <>
                  <div className="modal-header">
                    <div className="modal-badge" style={{ background: '#f97316', color: 'white' }}>🏫 Academy</div>
                    <h2>Education &amp; Certificates</h2>
                    <p>Academic journey and achievements</p>
                  </div>
                  <div className="modal-body">
                    <div className="timeline">
                      {portfolioData.education.map((item, idx) => (
                        <div key={idx} className="timeline-item">
                          <div className="timeline-icon">{item.icon}</div>
                          <div className="timeline-content">
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, background: '#f97316', color: 'white', padding: '2px 10px', borderRadius: '20px', display: 'inline-block', marginBottom: '6px' }}>{item.date}</span>
                            <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.2rem', margin: '0 0 2px', color: '#1e293b' }}>{item.degree}</h3>
                            <h4 style={{ color: '#f97316', fontWeight: 600, fontSize: '0.88rem', margin: '0 0 8px' }}>{item.institution}</h4>
                            <p style={{ color: '#64748b', fontSize: '0.88rem', lineHeight: '1.5', margin: 0 }}>{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: '24px', background: '#fef3c7', border: '2px solid #1e293b', borderRadius: '14px', padding: '16px', boxShadow: '2px 2px 0 #1e293b' }}>
                      <h4 style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem', color: '#1e293b', marginBottom: '10px' }}>🏆 Certificates &amp; Achievements</h4>
                      <ul style={{ color: '#475569', fontSize: '0.88rem', lineHeight: '2', paddingLeft: '18px' }}>
                        <li>Honors Graduate in Computer Science</li>
                        <li>AWS Certified Cloud Practitioner</li>
                        <li>Introduction to Computer Graphics — Grade A</li>
                        <li>Advanced React Design Patterns Certification</li>
                      </ul>
                    </div>
                  </div>
                </>
              )}

              {/* EXPERIENCE */}
              {currentModal === 'experience' && (
                <>
                  <div className="modal-header">
                    <div className="modal-badge" style={{ background: '#6366f1', color: 'white' }}>🏰 Guild Hall</div>
                    <h2>Experience Timeline</h2>
                    <p>Career adventure log</p>
                  </div>
                  <div className="modal-body">
                    <div className="timeline">
                      {portfolioData.experience.map((item, idx) => (
                        <div key={idx} className="timeline-item">
                          <div className="timeline-icon">{item.icon}</div>
                          <div className="timeline-content">
                            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
                              <div>
                                <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.15rem', margin: 0, color: '#1e293b' }}>{item.role}</h3>
                                <h4 style={{ color: '#6366f1', fontWeight: 600, fontSize: '0.88rem', margin: '2px 0 0' }}>{item.company}</h4>
                              </div>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, background: '#1e293b', color: 'white', padding: '2px 12px', borderRadius: '20px', alignSelf: 'flex-start' }}>{item.date}</span>
                            </div>
                            <p style={{ color: '#475569', fontSize: '0.88rem', margin: '8px 0 6px', lineHeight: '1.5' }}>{item.desc}</p>
                            {item.details && (
                              <ul style={{ color: '#64748b', fontSize: '0.84rem', lineHeight: '1.8', paddingLeft: '16px', margin: 0 }}>
                                {item.details.map((d, dIdx) => <li key={dIdx}>{d}</li>)}
                              </ul>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* WORKSHOP */}
              {currentModal === 'workshop' && (
                <>
                  <div className="modal-header">
                    <div className="modal-badge" style={{ background: '#ef4444', color: 'white' }}>⚙️ Workshop</div>
                    <h2>Projects Gallery</h2>
                    <p>Applications I built and shipped</p>
                  </div>
                  <div className="project-filters">
                    {(['all', 'web', 'game', 'ai'] as const).map(cat => (
                      <button
                        key={cat}
                        className={`filter-tab ${projectFilter === cat ? 'active' : ''}`}
                        onClick={() => setProjectFilter(cat)}
                      >
                        {cat === 'all' ? 'All' : cat === 'web' ? 'Web Apps' : cat === 'game' ? 'Games' : 'AI / Data'}
                      </button>
                    ))}
                  </div>
                  <div className="modal-body projects-grid">
                    {filteredProjects.map((p, idx) => (
                      <div key={idx} className="project-card">
                        <div className="project-img-container">
                          <span className="project-img-placeholder">{p.icon}</span>
                        </div>
                        <div className="project-content">
                          <h4 className="project-title">{p.title}</h4>
                          <p className="project-desc">{p.desc}</p>
                          <div className="project-tags">
                            {p.tags.map((t, tIdx) => <span key={tIdx} className="project-tag">{t}</span>)}
                          </div>
                          <div className="project-links" style={{ marginTop: 'auto' }}>
                            <a href={p.codeLink} target="_blank" rel="noreferrer" className="project-link-btn">Code</a>
                            <a href={p.liveLink} target="_blank" rel="noreferrer" className="project-link-btn primary-link">Demo</a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* TECH / COMPUTER CENTER */}
              {currentModal === 'tech' && (
                <>
                  <div className="modal-header">
                    <div className="modal-badge" style={{ background: '#8b5cf6', color: 'white' }}>🖥️ Computer Center</div>
                    <h2>Skills &amp; Technology Stack</h2>
                    <p>The tools I use to build things</p>
                  </div>
                  <div className="modal-body tech-container">
                    {Object.entries(portfolioData.skills).map(([category, items], idx) => (
                      <div key={idx} className="tech-category-section">
                        <h3>{category === 'frontend' ? '🌐 Frontend Sorcery' : category === 'backend' ? '⚡ Backend &amp; Cloud' : category === 'databases' ? '💾 Data Alchemy' : '🔧 Tools &amp; Weapons'}</h3>
                        <div className="tech-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                          {items.map((skill, sIdx) => (
                            <div key={sIdx} className="tech-card">
                              <div className="tech-icon">{skill.icon}</div>
                              <div className="tech-name">{skill.name}</div>
                              <div className="tech-lvl-bar">
                                <div className="tech-lvl-fill" style={{ width: `${skill.lvl}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* AI LAB */}
              {currentModal === 'ai-lab' && (
                <>
                  <div className="modal-header">
                    <div className="modal-badge" style={{ background: '#f59e0b', color: 'white' }}>🔭 AI Laboratory</div>
                    <h2>AI Research &amp; Experiments</h2>
                    <p>Intelligent systems and machine learning projects</p>
                  </div>
                  <div className="modal-body">
                    <div style={{ background: '#fffbeb', border: '3px solid #1e293b', borderRadius: '16px', padding: '20px', boxShadow: '4px 4px 0 #1e293b', marginBottom: '20px' }}>
                      <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.25rem', color: '#1e293b', marginBottom: '8px' }}>✨ Neural Classifier &amp; Procedural Grids</h3>
                      <p style={{ color: '#475569', lineHeight: '1.6', fontSize: '0.9rem', margin: 0 }}>
                        In the AI Laboratory, I conduct research in deep learning, image classification networks running directly in-browser using TensorFlow.js, and integrating Generative AI APIs into 3D environments for automated layouts.
                      </p>
                    </div>
                    <h4 style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem', color: '#1e293b', marginBottom: '12px' }}>Research Areas</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
                      {[
                        { title: 'In-Browser Training', desc: 'Mobile convnets and WebGL backends for serverless model deployments in web clients.' },
                        { title: 'Procedural Generation', desc: 'State-of-the-art LLM prompts to dynamically model structures and paths in 3D canvas settings.' },
                        { title: 'Computer Vision', desc: 'Custom gesture detection models trained on user webcam data with real-time classification.' },
                        { title: 'Future Work', desc: 'Exploring diffusion-model integration and interactive AI agents for web experiences.' },
                      ].map((area, idx) => (
                        <div key={idx} style={{ background: '#f8fafc', border: '2px solid #1e293b', borderRadius: '12px', padding: '14px', boxShadow: '2px 2px 0 #1e293b' }}>
                          <h5 style={{ fontFamily: 'var(--font-title)', color: '#1e293b', marginBottom: '6px' }}>{area.title}</h5>
                          <p style={{ color: '#64748b', fontSize: '0.83rem', lineHeight: '1.5', margin: 0 }}>{area.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* LIBRARY */}
              {currentModal === 'library' && (
                <>
                  <div className="modal-header">
                    <div className="modal-badge" style={{ background: '#ec4899', color: 'white' }}>📚 Library</div>
                    <h2>Skill Bookshelf</h2>
                    <p>Click a glowing book to read its description</p>
                  </div>
                  <div className="modal-body">
                    <div className="library-bookshelf">
                      {portfolioData.libraryBooks.map((book, idx) => (
                        <div
                          key={idx}
                          className={`glowing-book ${selectedBook === idx ? 'active' : ''}`}
                          onClick={() => setSelectedBook(idx === selectedBook ? null : idx)}
                        >
                          <span className="glowing-book-icon">📖</span>
                          <span className="glowing-book-title">{book.name}</span>
                        </div>
                      ))}
                    </div>
                    <AnimatePresence mode="wait">
                      {selectedBook !== null && (
                        <motion.div
                          key={selectedBook}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="book-detail-card"
                          style={{ marginTop: '20px' }}
                        >
                          <h4 style={{ fontFamily: 'var(--font-title)', fontSize: '1.15rem', color: '#1e293b', marginBottom: '8px' }}>
                            📖 {portfolioData.libraryBooks[selectedBook].name}
                          </h4>
                          <p style={{ color: '#475569', lineHeight: '1.6', margin: 0 }}>
                            {portfolioData.libraryBooks[selectedBook].desc}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              )}

              {/* CONTACT */}
              {currentModal === 'contact' && (
                <>
                  <div className="modal-header">
                    <div className="modal-badge" style={{ background: '#eab308', color: 'white' }}>📬 Post Office</div>
                    <h2>Send a Message Scroll</h2>
                    <p>Got a job offer or want to say hi? Write it below!</p>
                  </div>
                  <div className="modal-body">
                    {!formSubmitted ? (
                      <form className="contact-form" onSubmit={e => { e.preventDefault(); setFormSubmitted(true); }}>
                        <div className="form-group">
                          <label htmlFor="form-name">Adventurer Name</label>
                          <input id="form-name" type="text" placeholder="Your name" required value={contactName} onChange={e => setContactName(e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label htmlFor="form-email">Return Address (Email)</label>
                          <input id="form-email" type="email" placeholder="your@email.com" required value={contactEmail} onChange={e => setContactEmail(e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label htmlFor="form-message">Your Scroll (Message)</label>
                          <textarea id="form-message" rows={4} placeholder="Write your message here..." required value={contactMessage} onChange={e => setContactMessage(e.target.value)} />
                        </div>
                        <button type="submit" className="game-btn submit-btn">✉️ Cast Message</button>
                        <div style={{ marginTop: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                          <a href={portfolioData.profile.github} target="_blank" rel="noreferrer" className="project-link-btn" style={{ textDecoration: 'none' }}>GitHub</a>
                          <a href={portfolioData.profile.linkedin} target="_blank" rel="noreferrer" className="project-link-btn primary-link" style={{ textDecoration: 'none' }}>LinkedIn</a>
                          <a href={`mailto:${portfolioData.profile.email}`} className="project-link-btn" style={{ textDecoration: 'none' }}>Email Me</a>
                        </div>
                      </form>
                    ) : (
                      <div className="contact-success-msg" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '24px 0' }}>
                        <div className="success-icon">✉️</div>
                        <h3>Message Sent!</h3>
                        <p>Your scroll has taken flight to my mailbox. I'll reply soon. Safe travels! 🗺️</p>
                        <button className="game-btn" onClick={() => { setFormSubmitted(false); setContactName(''); setContactEmail(''); setContactMessage(''); }}>
                          Cast Another Scroll
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
