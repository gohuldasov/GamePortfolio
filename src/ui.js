import { gsap } from 'gsap';

export class UIManager {
  constructor(inputManager) {
    this.inputs = inputManager;
    this.currentOpenShop = null;
    
    // Callbacks to main game coordinator
    this.onEnterShopCallback = null;
    this.onCloseShopCallback = null;
    this.onNavbarNavigateCallback = null;

    // Synth Audio State
    this.audioCtx = null;
    this.synthInterval = null;
    this.isPlayingAudio = false;

    // Static Data
    this.projects = [
      {
        title: 'Retro Voxel Odyssey',
        category: 'game',
        desc: 'A procedural 3D voxel editor and shooter running directly in the browser with full shadow mapping and physics.',
        tags: ['Three.js', 'WebGL', 'JS', 'Cannon.js'],
        icon: '🎮',
        codeLink: '#',
        liveLink: '#'
      },
      {
        title: 'Skyline Builder AI',
        category: 'ai',
        desc: 'An AI-driven procedural city layout generator that designs urban grids, traffic flows, and exports 3D assets.',
        tags: ['Three.js', 'Gemini API', 'Node.js'],
        icon: '🏙️',
        codeLink: '#',
        liveLink: '#'
      },
      {
        title: 'Nebula Chat Engine',
        category: 'web',
        desc: 'Real-time collaborative game lobby and messenger with low latency custom WebSockets, dynamic avatars, and rooms.',
        tags: ['React', 'WebSockets', 'Tailwind', 'Redis'],
        icon: '💬',
        codeLink: '#',
        liveLink: '#'
      },
      {
        title: 'Aura Music Visualizer',
        category: 'web',
        desc: 'A gorgeous audio spectrum visualizer in 3D using HTML5 AudioContext, drawing reactive procedural meshes.',
        tags: ['Three.js', 'Web Audio API', 'Shaders'],
        icon: '🎵',
        codeLink: '#',
        liveLink: '#'
      },
      {
        title: 'Cosmic Quest RPG',
        category: 'game',
        desc: 'An isometric browser RPG game built with canvas and vanilla Javascript, featuring pathfinding, maps, and dialogues.',
        tags: ['Canvas2D', 'JavaScript', 'HTML5'],
        icon: '⚔️',
        codeLink: '#',
        liveLink: '#'
      }
    ];

    this.skills = {
      frontend: [
        { name: 'HTML5 & CSS3', lvl: 95, icon: '🌐' },
        { name: 'JavaScript (ES6+)', lvl: 90, icon: '💛' },
        { name: 'React / Next.js', lvl: 85, icon: '⚛️' },
        { name: 'Three.js / WebGL', lvl: 80, icon: '📐' }
      ],
      backend: [
        { name: 'Node.js & Express', lvl: 85, icon: '🟢' },
        { name: 'MongoDB / SQL', lvl: 75, icon: '💾' },
        { name: 'WebSockets API', lvl: 80, icon: '⚡' },
        { name: 'REST & GraphQL', lvl: 85, icon: '🔌' }
      ],
      tools: [
        { name: 'Git & GitHub', lvl: 90, icon: '🐙' },
        { name: 'Vite / Webpack', lvl: 80, icon: '📦' },
        { name: 'Blender 3D Modeling', lvl: 70, icon: '🎨' },
        { name: 'Docker', lvl: 65, icon: '🐳' }
      ]
    };

    this.experience = [
      {
        date: '2024 - PRESENT',
        role: 'Creative Developer',
        company: 'Voxel Media Lab',
        desc: 'Engineered WebGL products and customized 3D landing pages. Built responsive React components and animations.',
        icon: '💻'
      },
      {
        date: '2022 - 2024',
        role: 'Full Stack Engineer',
        company: 'TechCrafters Studios',
        desc: 'Designed APIs, databases, and managed WebSockets protocols. Scaled client notification systems by 40%.',
        icon: '🛠️'
      },
      {
        date: '2019 - 2022',
        role: 'B.S. in Computer Science',
        company: 'State Institute of Technology',
        desc: 'Specialized in computer graphics, UI/UX, and data structures. Graduated with Honors.',
        icon: '🎓'
      }
    ];

    this.initUI();
  }

  initUI() {
    // Populate dynamic data
    this.renderProjects('all');
    this.renderSkills();
    this.renderExperience();

    // Bind Close buttons
    document.querySelectorAll('.modal-close, .success-btn-close').forEach(btn => {
      btn.addEventListener('click', () => this.closeActiveShop());
    });

    // Bind filters for Projects
    document.querySelectorAll('.filter-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        const filter = e.target.getAttribute('data-filter');
        this.renderProjects(filter);
      });
    });

    // Bind Navbar Tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const target = e.target.getAttribute('data-target');
        
        // Remove active class from all tabs, add to clicked
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');

        // Close any currently open shop first
        if (this.currentOpenShop) {
          this.closeActiveShop(() => {
            if (this.onNavbarNavigateCallback) this.onNavbarNavigateCallback(target);
          });
        } else {
          if (this.onNavbarNavigateCallback) this.onNavbarNavigateCallback(target);
        }
      });
    });

    // Logo Click drives to Home (position 0)
    const logo = document.getElementById('nav-home');
    if (logo) {
      logo.addEventListener('click', () => {
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        const homeTab = document.querySelector('[data-target="home"]');
        if (homeTab) homeTab.classList.add('active');
        
        if (this.currentOpenShop) {
          this.closeActiveShop(() => {
            if (this.onNavbarNavigateCallback) this.onNavbarNavigateCallback('home');
          });
        } else {
          if (this.onNavbarNavigateCallback) this.onNavbarNavigateCallback('home');
        }
      });
    }

    // Bind Form Submission
    const contactForm = document.getElementById('contact-form');
    const successMsg = document.getElementById('contact-success');
    if (contactForm) {
      contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Hide form fields, show dynamic loading/success card
        gsap.to(contactForm, { opacity: 0, duration: 0.3, onComplete: () => {
          contactForm.classList.add('hidden');
          successMsg.classList.remove('hidden');
          successMsg.style.opacity = 0;
          gsap.to(successMsg, { opacity: 1, duration: 0.3 });
          contactForm.reset();
        }});
      });
    }

    // Audio Control Binding
    const audioBtn = document.getElementById('audio-toggle');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => this.toggleAudio());
    }
  }

  // --- DATA RENDERING METHODS ---

  renderProjects(filter) {
    const container = document.getElementById('projects-container');
    if (!container) return;

    container.innerHTML = '';
    const filtered = this.projects.filter(p => filter === 'all' || p.category === filter);

    filtered.forEach(p => {
      const card = document.createElement('div');
      card.className = 'project-card';
      
      card.innerHTML = `
        <div class="project-img-container">
          <span class="project-img-placeholder">${p.icon}</span>
        </div>
        <div class="project-content">
          <h4 class="project-title">${p.title}</h4>
          <p class="project-desc">${p.desc}</p>
          <div class="project-tags">
            ${p.tags.map(t => `<span class="project-tag">${t}</span>`).join('')}
          </div>
          <div class="project-links">
            <a href="${p.codeLink}" class="project-link-btn" target="_blank">Code</a>
            <a href="${p.liveLink}" class="project-link-btn primary-link" target="_blank">Demo</a>
          </div>
        </div>
      `;
      container.appendChild(card);
    });
  }

  renderSkills() {
    const renderCategory = (elementId, list) => {
      const grid = document.getElementById(elementId);
      if (!grid) return;
      grid.innerHTML = '';

      list.forEach(s => {
        const card = document.createElement('div');
        card.className = 'tech-card';
        card.innerHTML = `
          <div class="tech-icon">${s.icon}</div>
          <div class="tech-name">${s.name}</div>
          <div class="tech-lvl-bar">
            <div class="tech-lvl-fill" data-lvl="${s.lvl}"></div>
          </div>
        `;
        grid.appendChild(card);
      });
    };

    renderCategory('tech-frontend', this.skills.frontend);
    renderCategory('tech-backend', this.skills.backend);
    renderCategory('tech-tools', this.skills.tools);
  }

  renderExperience() {
    const timeline = document.getElementById('experience-timeline');
    if (!timeline) return;
    timeline.innerHTML = '';

    this.experience.forEach(e => {
      const item = document.createElement('div');
      item.className = 'timeline-item';
      
      item.innerHTML = `
        <div class="timeline-dot">${e.icon}</div>
        <div class="timeline-content">
          <span class="timeline-date">${e.date}</span>
          <h4 class="timeline-role">${e.role}</h4>
          <p class="timeline-company">${e.company}</p>
          <p class="timeline-desc">${e.desc}</p>
        </div>
      `;
      timeline.appendChild(item);
    });
  }

  // --- ACTIONS ---

  showInteractionPrompt(shopName) {
    const prompt = document.getElementById('interaction-prompt');
    const mobileActionBtn = document.getElementById('btn-action');
    if (!prompt) return;

    const shopNames = {
      projects: 'Projects Shop',
      tech: 'Tech Laboratory',
      experience: 'Experience Log',
      contact: 'Contact Gate'
    };

    const text = prompt.querySelector('.prompt-badge');
    if (text) text.innerText = shopNames[shopName] || 'Explore';

    prompt.classList.remove('hidden');
    if (mobileActionBtn) mobileActionBtn.classList.remove('hidden');
  }

  hideInteractionPrompt() {
    const prompt = document.getElementById('interaction-prompt');
    const mobileActionBtn = document.getElementById('btn-action');
    if (prompt) prompt.classList.add('hidden');
    if (mobileActionBtn) mobileActionBtn.classList.add('hidden');
  }

  enterShop(shopName) {
    if (this.currentOpenShop) return;
    this.currentOpenShop = shopName;
    this.inputs.disable(); // Block user controls during overlay
    this.hideInteractionPrompt();

    // Trigger double door animation
    const doorTransition = document.getElementById('door-transition');
    doorTransition.classList.remove('hidden');
    doorTransition.offsetHeight; // trigger reflow
    doorTransition.classList.add('closed');

    // Notify main game manager to zoom camera towards shop
    if (this.onEnterShopCallback) this.onEnterShopCallback(shopName);

    // After door shuts, swap screens
    setTimeout(() => {
      // Open modal
      const modal = document.getElementById(`${shopName}-modal`);
      if (modal) {
        modal.classList.add('active');
        
        // Trigger skill progress bars expanding animation
        if (shopName === 'tech') {
          setTimeout(() => {
            modal.querySelectorAll('.tech-lvl-fill').forEach(fill => {
              const lvl = fill.getAttribute('data-lvl');
              fill.style.width = `${lvl}%`;
            });
          }, 300);
        }
      }
      
      // Open doors again to show the inside (or just clear transition)
      doorTransition.classList.remove('closed');
      setTimeout(() => {
        doorTransition.classList.add('hidden');
      }, 600);
    }, 600);
  }

  closeActiveShop(callback) {
    if (!this.currentOpenShop) {
      if (callback) callback();
      return;
    }

    const shopName = this.currentOpenShop;
    const modal = document.getElementById(`${shopName}-modal`);

    // Shut door transition
    const doorTransition = document.getElementById('door-transition');
    doorTransition.classList.remove('hidden');
    doorTransition.offsetHeight;
    doorTransition.classList.add('closed');

    setTimeout(() => {
      // Hide modal UI
      if (modal) {
        modal.classList.remove('active');
        
        // Reset skills bar widths
        if (shopName === 'tech') {
          modal.querySelectorAll('.tech-lvl-fill').forEach(fill => {
            fill.style.width = '0%';
          });
        }
        
        // Reset contact form success panel if closed
        if (shopName === 'contact') {
          const contactForm = document.getElementById('contact-form');
          const successMsg = document.getElementById('contact-success');
          if (contactForm && successMsg) {
            contactForm.classList.remove('hidden');
            contactForm.style.opacity = 1;
            successMsg.classList.add('hidden');
          }
        }
      }

      // Notify main engine to restore camera and close 3D shop doors
      if (this.onCloseShopCallback) this.onCloseShopCallback(shopName);

      // Open transition doors
      doorTransition.classList.remove('closed');
      this.currentOpenShop = null;
      this.inputs.enable(); // Re-enable user movement
      
      setTimeout(() => {
        doorTransition.classList.add('hidden');
        if (callback) callback();
      }, 600);
    }, 600);
  }

  // --- PROCEDURAL AUDIO (WEB AUDIO API SYNTH) ---

  toggleAudio() {
    const iconOn = document.querySelector('.audio-icon.on');
    const iconOff = document.querySelector('.audio-icon.off');

    if (!this.isPlayingAudio) {
      // Start/Resume audio context
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.startProceduralMelody();
      } else if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      
      this.isPlayingAudio = true;
      iconOn.classList.remove('hidden');
      iconOff.classList.add('hidden');
    } else {
      // Mute audio
      if (this.audioCtx && this.audioCtx.state === 'running') {
        this.audioCtx.suspend();
      }
      
      this.isPlayingAudio = false;
      iconOn.classList.add('hidden');
      iconOff.classList.remove('hidden');
    }
  }

  startProceduralMelody() {
    const playNote = (freq, duration, startTime, type = 'triangle', vol = 0.08) => {
      if (!this.audioCtx || this.audioCtx.state === 'suspended') return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      const filter = this.audioCtx.createBiquadFilter();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);
      
      // High-frequency roll-off for warmer tone
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, startTime);

      // Envelope: volume fade out
      gain.gain.setValueAtTime(vol, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration - 0.02);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    // Synthesize a calming cartoon/adventure chord arpeggio loop (C Major / A Minor Pentatonic scale)
    // Frequencies: C4=261.63, E4=329.63, G4=392.00, A4=440.00, C5=523.25, D5=587.33, E5=659.25, G5=783.99
    const chords = [
      [261.63, 329.63, 392.00, 523.25], // C Major: C4, E4, G4, C5
      [220.00, 329.63, 440.00, 523.25], // A Minor: A3, E4, A4, C5
      [349.23, 440.00, 523.25, 659.25], // F Major: F4, A4, C5, E5
      [293.66, 392.00, 587.33, 783.99]  // G Major: D4, G4, D5, G5
    ];

    let chordIdx = 0;
    let step = 0;

    const playLoop = () => {
      const now = this.audioCtx.currentTime;
      const currentChord = chords[chordIdx];
      
      // Play 4 notes of the arpeggio in sequence
      const noteFreq = currentChord[step % 4];
      
      // Play root note, and occasionally a higher harmony
      playNote(noteFreq, 0.45, now, 'triangle', 0.08);
      
      // Gentle bass beat under the melody
      if (step % 4 === 0) {
        playNote(currentChord[0] / 2, 0.9, now, 'sine', 0.12);
      }

      step++;
      if (step % 8 === 0) {
        chordIdx = (chordIdx + 1) % chords.length;
      }
    };

    // Run arpeggiator every 250ms
    this.synthInterval = setInterval(playLoop, 250);
  }
}
