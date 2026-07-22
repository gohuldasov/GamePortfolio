import * as THREE from 'three';
import { gsap } from 'gsap';
import { InputManager } from './input.js';
import { Character } from './character.js';
import { World } from './world.js';
import { UIManager } from './ui.js';

class GameApp {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.clock = new THREE.Clock();

    // Game States
    this.isGaming = false;
    this.isAutoWalking = false;
    this.autoWalkTargetZ = 0;
    this.autoWalkShopTrigger = null;

    // Physics properties
    this.velocityX = 0;
    this.velocityZ = 0;
    this.acceleration = 14.0;
    this.friction = 8.0;
    this.maxSpeed = 5.0;

    // Boundary coordinates (rescaled to 2.5D painting area)
    this.startBoundaryZ = 6.0;
    this.endBoundaryZ = -14.0;

    this.cameraLookTarget = new THREE.Vector3(0, 1.2, -1.0);
    this.isCameraZoomed = false;

    this.initEngine();
    this.initEntities();
    this.setupLoader();
  }

  initEngine() {
    // Scene setup
    this.scene = new THREE.Scene();

    // Camera setup — fixed perspective matching the painted background
    this.camera = new THREE.PerspectiveCamera(
      52,
      window.innerWidth / window.innerHeight,
      0.1,
      200
    );
    this.camera.position.set(0, 4.2, 9.0);
    this.cameraLookTarget.set(0, 1.0, 0);
    this.camera.lookAt(this.cameraLookTarget);

    // Renderer — alpha:true so painted CSS background shows through
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    this.renderer.setClearColor(0x000000, 0); // Fully transparent
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Handle resize
    window.addEventListener('resize', () => this.onResize());
  }

  initEntities() {
    // Inputs
    this.inputs = new InputManager();

    // World / Environment
    this.world = new World(this.scene);

    // Character Player — starts at painting foreground, facing into scene
    this.character = new Character(this.scene);
    this.character.mesh.position.set(0, 0, 4.5);
    this.character.mesh.rotation.y = Math.PI; // Face away from camera (into painting)

    // UI Overlay Controller
    this.ui = new UIManager(this.inputs);

    // Wire up events between UI and Main Loop
    this.ui.onEnterShopCallback = (shopName) => this.zoomCameraIntoShop(shopName);
    this.ui.onCloseShopCallback = (shopName) => this.resetCameraFromShop(shopName);
    this.ui.onNavbarNavigateCallback = (target) => this.navigatePlayerTo(target);

    // Wire up actions for Input Enter key trigger
    this.inputs.onEnterPress = () => {
      const activeTrigger = this.world.checkTriggers(
        this.character.mesh.position.x,
        this.character.mesh.position.z
      );
      if (activeTrigger && !this.ui.currentOpenShop) {
        this.ui.enterShop(activeTrigger.name);
      }
    };

    // Wire up actions for Input Escape key trigger
    this.inputs.onEscapePress = () => {
      if (this.ui.currentOpenShop) {
        this.ui.closeActiveShop();
      }
    };

    // Wire up floating badge clicks
    document.querySelectorAll('.floating-badge-item').forEach(badge => {
      badge.addEventListener('click', () => {
        const target = badge.dataset.target;
        if (target && !this.ui.currentOpenShop) {
          this.ui.enterShop(target);
        }
      });
    });
  }

  setupLoader() {
    // Simulate initial asset loading for preloader progress
    const loaderBar = document.getElementById('loader-bar');
    const loaderStatus = document.getElementById('loader-status');
    const startBtn = document.getElementById('start-btn');

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);

        loaderBar.style.width = '100%';
        loaderStatus.innerText = 'Assets loaded!';

        // Reveal CTA
        startBtn.classList.remove('hidden');
        startBtn.style.opacity = 0;
        gsap.to(startBtn, { opacity: 1, duration: 0.3 });
      } else {
        loaderBar.style.width = `${progress}%`;
        loaderStatus.innerText = `Loading modules: ${progress}%`;
      }
    }, 100);

    // Click CTA to start
    startBtn.addEventListener('click', () => {
      const preloader = document.getElementById('preloader');
      const hud = document.getElementById('hud');

      gsap.to(preloader, {
        opacity: 0, duration: 0.8, onComplete: () => {
          preloader.classList.add('hidden');
          hud.classList.remove('hidden');
          hud.style.opacity = 0;
          gsap.to(hud, { opacity: 1, duration: 0.5 });

          // Start game updates and enable controls
          this.isGaming = true;
          this.inputs.enable();
        }
      });
    });
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // --- ACTIONS SYSTEMS ---

  navigatePlayerTo(sectionName) {
    const sectionCoords = {
      home:       { x: 0,  z: 4.5 },
      projects:   { x: 0,  z: -7 },
      tech:       { x: 6,  z: -6 },
      experience: { x: -6, z: -6 },
      contact:    { x: 0,  z: -13 }
    };

    const coord = sectionCoords[sectionName];
    if (coord) {
      this.isAutoWalking = true;
      this.autoWalkTargetZ = coord.z;
      this.autoWalkTargetX = coord.x || 0;
      this.autoWalkShopTrigger = sectionName !== 'home' ? sectionName : null;
      this.inputs.disable();
    }
  }

  zoomCameraIntoShop(shopName) {
    this.isCameraZoomed = true;
    // In 2.5D mode: just hide character while modal is open
    if (this.character && this.character.mesh) {
      gsap.to(this.character.mesh, { opacity: 0, duration: 0.3 });
      this.character.mesh.visible = false;
    }
  }

  resetCameraFromShop(shopName) {
    this.isCameraZoomed = false;
    // Restore character visibility
    if (this.character && this.character.mesh) {
      this.character.mesh.visible = true;
    }
    gsap.to(this.character.mesh.rotation, { y: Math.PI, duration: 0.4 });
  }

  // --- GAME TICK & PHYSICS ---

  handleMovement(deltaTime) {
    if (!this.isGaming) return;

    let inputX = 0;
    let inputZ = 0;

    if (this.isAutoWalking) {
      // AUTO WALKING LOGIC (driven by Navbar tabs)
      const diffZ = this.autoWalkTargetZ - this.character.mesh.position.z;

      if (Math.abs(diffZ) < 0.25) {
        // Reached destination!
        this.isAutoWalking = false;
        this.velocityX = 0;
        this.velocityZ = 0;

        if (this.autoWalkShopTrigger) {
          this.ui.enterShop(this.autoWalkShopTrigger);
          this.autoWalkShopTrigger = null;
        } else {
          // Re-enable controls if home or path completed
          this.inputs.enable();
        }
      } else {
        // Continue walking towards target Z (moving forward is negative Z)
        inputZ = diffZ < 0 ? -1 : 1;

        // Auto-align X to the road center
        const targetX = this.world.getRoadX(this.character.mesh.position.z);
        const diffX = targetX - this.character.mesh.position.x;
        if (Math.abs(diffX) > 0.1) {
          inputX = diffX < 0 ? -0.8 : 0.8;
        }
      }
    } else {
      // KEYBOARD / MANUAL MOVEMENT
      if (this.inputs.keys.forward) inputZ = -1; // W: Walk forward (negative Z)
      if (this.inputs.keys.backward) inputZ = 1;  // S: Walk backward (positive Z)
      if (this.inputs.keys.left) inputX = -1;     // A: Walk left (negative X)
      if (this.inputs.keys.right) inputX = 1;     // D: Walk right (positive X)
    }

    // Apply movement physics
    if (inputX !== 0 || inputZ !== 0) {
      // Normalize input to prevent double diagonal speed
      const len = Math.sqrt(inputX * inputX + inputZ * inputZ);
      const dirX = inputX / len;
      const dirZ = inputZ / len;

      this.velocityX += dirX * this.acceleration * deltaTime;
      this.velocityZ += dirZ * this.acceleration * deltaTime;

      // Clamp speed
      const speed = Math.sqrt(this.velocityX * this.velocityX + this.velocityZ * this.velocityZ);
      if (speed > this.maxSpeed) {
        this.velocityX = (this.velocityX / speed) * this.maxSpeed;
        this.velocityZ = (this.velocityZ / speed) * this.maxSpeed;
      }

      // Rotate character mesh to face direction of movement
      const targetRotY = Math.atan2(this.velocityX, this.velocityZ);
      // Interpolate rotation for smooth turning
      // Normalize angular difference to avoid spinning the long way
      let diffRotY = targetRotY - this.character.mesh.rotation.y;
      while (diffRotY < -Math.PI) diffRotY += Math.PI * 2;
      while (diffRotY > Math.PI) diffRotY -= Math.PI * 2;
      this.character.mesh.rotation.y += diffRotY * 0.18;
    } else {
      // Decelerate (apply friction)
      this.velocityX = THREE.MathUtils.lerp(this.velocityX, 0, this.friction * deltaTime);
      this.velocityZ = THREE.MathUtils.lerp(this.velocityZ, 0, this.friction * deltaTime);
      if (Math.abs(this.velocityX) < 0.05) this.velocityX = 0;
      if (Math.abs(this.velocityZ) < 0.05) this.velocityZ = 0;
    }

    // Update position
    let nextX = this.character.mesh.position.x + this.velocityX * deltaTime;
    let nextZ = this.character.mesh.position.z + this.velocityZ * deltaTime;

    const playerRadius = 0.55;

    // Resolve collisions with registered obstacles (sliding collision response)
    if (this.world.obstacles) {
      for (const obs of this.world.obstacles) {
        if (obs.type === 'circle') {
          // Circular obstacle collision (trees, lampposts, rocks, barrels, crates)
          const dx = nextX - obs.x;
          const dz = nextZ - obs.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          const minDist = playerRadius + obs.radius;

          if (dist < minDist) {
            const overlap = minDist - dist;
            if (dist > 0.001) {
              nextX += (dx / dist) * overlap;
              nextZ += (dz / dist) * overlap;
            } else {
              nextZ += minDist; // direct overlap fallback
            }
          }
        } else if (obs.type === 'box') {
          // Box obstacle collision (AABB) (shops, benches)
          if (nextX + playerRadius > obs.minX &&
            nextX - playerRadius < obs.maxX &&
            nextZ + playerRadius > obs.minZ &&
            nextZ - playerRadius < obs.maxZ) {

            // Overlapping! Push along the axis of minimum penetration
            const pushLeft = obs.minX - playerRadius - nextX;
            const pushRight = obs.maxX + playerRadius - nextX;
            const pushTop = obs.minZ - playerRadius - nextZ;
            const pushBottom = obs.maxZ + playerRadius - nextZ;

            const absLeft = Math.abs(pushLeft);
            const absRight = Math.abs(pushRight);
            const absTop = Math.abs(pushTop);
            const absBottom = Math.abs(pushBottom);

            const minPush = Math.min(absLeft, absRight, absTop, absBottom);

            if (minPush === absLeft) {
              nextX += pushLeft;
            } else if (minPush === absRight) {
              nextX += pushRight;
            } else if (minPush === absTop) {
              nextZ += pushTop;
            } else {
              nextZ += pushBottom;
            }
          }
        }
      }
    }

    // Clamp boundaries
    let finalZ = THREE.MathUtils.clamp(nextZ, this.endBoundaryZ, this.startBoundaryZ);
    let finalX = THREE.MathUtils.clamp(nextX, -9, 9);

    this.character.mesh.position.x = finalX;
    this.character.mesh.position.z = finalZ;

    // Trigger HUD prompting systems when approaching shops
    const activeTrigger = this.world.checkTriggers(finalX, finalZ);
    if (activeTrigger && !this.ui.currentOpenShop) {
      this.ui.showInteractionPrompt(activeTrigger.name);
    } else {
      this.ui.hideInteractionPrompt();
    }

    // Update character joint walking oscillations
    const speedRatio = Math.sqrt(this.velocityX * this.velocityX + this.velocityZ * this.velocityZ) / this.maxSpeed;
    const isMoving = speedRatio > 0.01;
    this.character.update(deltaTime, isMoving, speedRatio);
  }

  updateCamera() {
    if (this.isCameraZoomed) return;

    // Fixed camera matching the painting perspective
    // Very subtle X parallax so scene feels alive
    const charPos = this.character.mesh.position;
    const targetCamX = charPos.x * 0.06;

    this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, targetCamX, 0.04);
    this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, 4.2, 0.04);
    this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, 9.0, 0.04);

    this.camera.lookAt(this.cameraLookTarget);
  }

  // --- CORE LOOP ---

  start() {
    this.clock.getDelta(); // reset clock
    this.renderer.setAnimationLoop(() => this.tick());
  }

  tick() {
    const deltaTime = Math.min(this.clock.getDelta(), 0.1); // cap deltaTime at 100ms to avoid physics teleports

    this.handleMovement(deltaTime);
    this.updateCamera();
    this.world.update(deltaTime);

    // Render Scene
    this.renderer.render(this.scene, this.camera);
  }
}

// Instantiate and start
const app = new GameApp();
app.start();
export default app;
