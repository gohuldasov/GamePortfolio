import * as THREE from 'three';

export class World {
  constructor(scene) {
    this.scene = scene;

    // 2.5D MODE: Triggers rescaled to match painted background perspective
    this.HUB_CENTER = { x: 0, z: -5 };

    // Shop trigger zones — scaled to match visible area of painting
    this.shopTriggers = [
      { name: 'projects', x: 0,   z: -7,  radius: 3.5, opened: false },
      { name: 'tech',     x: 6,   z: -6,  radius: 3.5, opened: false },
      { name: 'experience', x: -6, z: -6, radius: 3.5, opened: false },
      { name: 'contact',  x: 0,   z: -13, radius: 3.5, opened: false }
    ];

    // Building anchor positions (used for badge projection)
    this.buildingPositions = {
      home:       { x: -9,  y: 3.5, z: -4 },
      education:  { x: -6,  y: 4.5, z: -8 },
      projects:   { x: 0,   y: 4.5, z: -9 },
      tech:       { x: 6,   y: 4.5, z: -8 },
      contact:    { x: 10,  y: 3.5, z: -4 },
      experience: { x: 0,   y: 7.0, z: -16 },
    };

    this.clouds = [];
    this.particles = null;
    this.particleCount = 0;
    this.doors = {};
    this.windmillBlades = null;
    this.obstacles = [];
    this.npcs = [];
    this.fountainCrystal = null;

    this.initWorldMaterials();
    this.buildEnvironment();
  }

  initWorldMaterials() {
    this.materials = {
      grass: new THREE.MeshToonMaterial({ color: 0x5cb85c }),
      stone: new THREE.MeshToonMaterial({ color: 0xa0a8b8 }),
      darkStone: new THREE.MeshToonMaterial({ color: 0x3d4a5c }),
      woodDark: new THREE.MeshToonMaterial({ color: 0x6b3f22 }),
      woodLight: new THREE.MeshToonMaterial({ color: 0xb87333 }),
      metalBlack: new THREE.MeshToonMaterial({ color: 0x2b3045 }),
      gold: new THREE.MeshToonMaterial({ color: 0xf4c430 }),
      glassGlow: new THREE.MeshBasicMaterial({ color: 0xffda77 }),
      leafGreen: new THREE.MeshToonMaterial({ color: 0x3a9e6a }),
      leafLight: new THREE.MeshToonMaterial({ color: 0x6dcf8a }),
      leafDark: new THREE.MeshToonMaterial({ color: 0x236b4a }),
      trunkBrown: new THREE.MeshToonMaterial({ color: 0x7a4f30 }),
      mountainGreen: new THREE.MeshToonMaterial({ color: 0x3d8c62 }),
      waterTeal: new THREE.MeshToonMaterial({ color: 0x2ec4b6, transparent: true, opacity: 0.88 }),
      neonTeal: new THREE.MeshBasicMaterial({ color: 0x00e5ff }),
      laces: new THREE.MeshToonMaterial({ color: 0xf5f0e8 }),
      plasterWall: new THREE.MeshToonMaterial({ color: 0xf2e4c8 }),
      roofRed: new THREE.MeshToonMaterial({ color: 0xd94f38 }),
      cobbleStone: new THREE.MeshToonMaterial({ color: 0x8b8fa8 }),
      waterBlue: new THREE.MeshBasicMaterial({ color: 0x4fc3f7, transparent: true, opacity: 0.85 }),
    };
  }

  // ─── ENVIRONMENT ─────────────────────────────────────────────────────────

  buildEnvironment() {
    // 2.5D mode: transparent WebGL canvas over CSS painted background
    this.scene.background = null;
    this.scene.fog = null;
    this.buildLighting();
    this.buildShadowGround();
  }

  buildShadowGround() {
    // Invisible plane that only receives shadows from the 3D character
    const geo = new THREE.PlaneGeometry(120, 120);
    const mat = new THREE.ShadowMaterial({ opacity: 0.28 });
    const ground = new THREE.Mesh(geo, mat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  buildSky() {
    // Bright blue daytime sky matching reference image
    const canvas = document.createElement('canvas');
    canvas.width = 4;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0.0, '#1a6bc4'); // Vibrant azure blue at top
    gradient.addColorStop(0.35, '#3a9ad9'); // Mid sky blue
    gradient.addColorStop(0.65, '#74c0e8'); // Light sky blue
    gradient.addColorStop(0.82, '#b8dff2'); // Near horizon pale blue
    gradient.addColorStop(1.0, '#dff0fa'); // Horizon pale white-blue
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 4, 512);
    const skyTexture = new THREE.CanvasTexture(canvas);
    this.scene.background = skyTexture;

    // Soft blue-white haze in the distance
    const fogColor = new THREE.Color(0xb8dff2);
    this.scene.fog = new THREE.FogExp2(fogColor, 0.008);
  }

  buildLighting() {
    // Warm daylight ambient matching the painting
    const ambient = new THREE.AmbientLight(0xffeedd, 1.1);
    this.scene.add(ambient);

    // Primary sun — angled to cast shadows matching painting light
    this.dirLight = new THREE.DirectionalLight(0xfff5e0, 2.5);
    this.dirLight.position.set(15, 30, 20);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 0.1;
    this.dirLight.shadow.camera.far = 80;
    this.dirLight.shadow.camera.left = -20;
    this.dirLight.shadow.camera.right = 20;
    this.dirLight.shadow.camera.top = 20;
    this.dirLight.shadow.camera.bottom = -20;
    this.dirLight.shadow.bias = -0.001;
    this.scene.add(this.dirLight);

    // Soft fill from the right
    const fillLight = new THREE.DirectionalLight(0xc8e6f0, 0.8);
    fillLight.position.set(-10, 15, 5);
    this.scene.add(fillLight);

    const hemi = new THREE.HemisphereLight(0xb8dff2, 0x5cb85c, 0.6);
    this.scene.add(hemi);
  }

  buildGround() {
    // Large grass field
    const grassGeo = new THREE.PlaneGeometry(400, 400);
    const grassMesh = new THREE.Mesh(grassGeo, this.materials.grass);
    grassMesh.rotation.x = -Math.PI / 2;
    grassMesh.receiveShadow = true;
    this.scene.add(grassMesh);
  }

  buildPlaza() {
    const cx = this.HUB_CENTER.x;
    const cz = this.HUB_CENTER.z;
    const stoneMat = this.materials.stone;
    const cobbleMat = this.materials.cobbleStone;

    // Central circular cobblestone plaza (radius 12)
    const plazaGeo = new THREE.CylinderGeometry(12, 12, 0.08, 32);
    const plaza = new THREE.Mesh(plazaGeo, cobbleMat);
    plaza.position.set(cx, 0.04, cz);
    plaza.receiveShadow = true;
    this.scene.add(plaza);

    // Decorative outer ring border
    const ringGeo = new THREE.CylinderGeometry(12.4, 12.4, 0.1, 32, 1, true);
    const ring = new THREE.Mesh(ringGeo, stoneMat);
    ring.position.set(cx, 0.05, cz);
    this.scene.add(ring);

    // Radiating stone paths to each building
    const paths = [
      { angle: 0, length: 22, label: 'projects' }, // Forward center
      { angle: Math.PI / 4, length: 18, label: 'tech' }, // Front-right
      { angle: -Math.PI / 4, length: 18, label: 'education' }, // Front-left
      { angle: Math.PI * 0.65, length: 20, label: 'contact' }, // Back center
      { angle: Math.PI / 6, length: 16, label: 'home' }, // Right corner
      { angle: -Math.PI / 6, length: 16, label: 'home2' }, // Left corner
    ];

    const pathTex = this.createBrickTexture();
    pathTex.repeat.set(1, 4);
    const pathMat = new THREE.MeshToonMaterial({ map: pathTex });

    paths.forEach(p => {
      const pathGeo = new THREE.PlaneGeometry(3.5, p.length);
      const path = new THREE.Mesh(pathGeo, pathMat);
      path.rotation.x = -Math.PI / 2;
      path.rotation.z = p.angle;
      path.position.set(
        cx + Math.sin(p.angle) * (12 + p.length / 2),
        0.05,
        cz - Math.cos(p.angle) * (12 + p.length / 2)
      );
      path.receiveShadow = true;
      this.scene.add(path);
    });

    // Player entry path from south (start position)
    const entryGeo = new THREE.PlaneGeometry(4, 20);
    const entryPath = new THREE.Mesh(entryGeo, pathMat);
    entryPath.rotation.x = -Math.PI / 2;
    entryPath.position.set(cx, 0.05, cz + 22);
    entryPath.receiveShadow = true;
    this.scene.add(entryPath);

    // Stone border curbs along entry path
    const curbMat = stoneMat;
    const curbGeo = new THREE.BoxGeometry(0.25, 0.14, 1.0);
    for (let i = 0; i < 20; i++) {
      const pz = cz + 32 - i * 1.0;
      const leftCurb = new THREE.Mesh(curbGeo, curbMat);
      leftCurb.position.set(cx - 2.2, 0.07, pz);
      const rightCurb = new THREE.Mesh(curbGeo, curbMat);
      rightCurb.position.set(cx + 2.2, 0.07, pz);
      this.scene.add(leftCurb, rightCurb);
    }

    // Small stone curb around plaza perimeter
    for (let i = 0; i < 32; i++) {
      const a = (Math.PI * 2 / 32) * i;
      const curbPiece = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.15, 1.25), stoneMat);
      curbPiece.position.set(cx + Math.cos(a) * 12.15, 0.07, cz + Math.sin(a) * 12.15);
      curbPiece.rotation.y = a;
      curbPiece.receiveShadow = true;
      this.scene.add(curbPiece);
    }
  }

  buildMountains() {
    const mConfigs = [
      { x: -80, z: -80, s: 1.4 },
      { x: -100, z: -55, s: 1.0 },
      { x: -65, z: -110, s: 1.6 },
      { x: 80, z: -80, s: 1.3 },
      { x: 95, z: -55, s: 0.9 },
      { x: 70, z: -110, s: 1.5 },
      { x: -5, z: -120, s: 1.2 },
    ];
    const mGeo = new THREE.ConeGeometry(22, 40, 5);
    mConfigs.forEach(cfg => {
      const mount = new THREE.Mesh(mGeo, this.materials.mountainGreen);
      mount.position.set(cfg.x, 18, cfg.z);
      mount.scale.set(cfg.s, cfg.s, cfg.s);
      mount.receiveShadow = true;
      this.scene.add(mount);

      // Snow cap
      const snow = new THREE.Mesh(new THREE.ConeGeometry(7 * cfg.s, 10 * cfg.s, 5), new THREE.MeshToonMaterial({ color: 0xf0f4f8 }));
      snow.position.set(cfg.x, 18 + 20 * cfg.s * 0.9, cfg.z);
      this.scene.add(snow);
    });
  }

  // ─── SHOPS / BUILDINGS ───────────────────────────────────────────────────

  buildShops() {
    // PROJECTS SHOP — center of hub
    const projX = 0, projZ = -28;
    this.buildProjectsShop(projX, projZ, 0);
    this.obstacles.push({ type: 'box', minX: projX - 3.5, maxX: projX + 3.5, minZ: projZ - 4, maxZ: projZ + 3 });

    // TECH SHOP — right side
    const techX = 14, techZ = -24;
    this.buildTechShop(techX, techZ, -Math.PI / 6);
    this.obstacles.push({ type: 'circle', x: techX, z: techZ, radius: 3.2 });

    // EXPERIENCE SHOP — left side
    const expX = -14, expZ = -24;
    this.buildExperienceShop(expX, expZ, Math.PI / 6);
    this.obstacles.push({ type: 'box', minX: expX - 3.5, maxX: expX + 3.5, minZ: expZ - 4, maxZ: expZ + 3 });

    // CONTACT BUILDING — back center
    const contactX = 0, contactZ = -42;
    this.buildContactBuilding(contactX, contactZ);
    this.obstacles.push({ type: 'box', minX: contactX - 4, maxX: contactX + 4, minZ: contactZ - 4, maxZ: contactZ + 3 });

    // Street lanterns at path junctions
    this.placePathLanterns();
  }

  placePathLanterns() {
    const cx = this.HUB_CENTER.x;
    const cz = this.HUB_CENTER.z;
    const positions = [
      { x: cx - 2.5, z: cz + 14 },
      { x: cx + 2.5, z: cz + 14 },
      { x: cx - 6, z: cz + 4 },
      { x: cx + 6, z: cz + 4 },
      { x: cx - 10, z: cz - 6 },
      { x: cx + 10, z: cz - 6 },
      { x: cx - 8, z: cz - 16 },
      { x: cx + 8, z: cz - 16 },
    ];
    positions.forEach(p => {
      this.placeLamppost(p.x, p.z);
    });
  }

  placeLamppost(x, z) {
    const post = new THREE.Group();
    post.position.set(x, 0, z);

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 4.2, 8), this.materials.metalBlack);
    pole.position.y = 2.1;
    pole.castShadow = true;
    post.add(pole);

    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.07, 0.07), this.materials.metalBlack);
    arm.position.set(0.4, 4.1, 0);
    post.add(arm);

    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.05, 8), this.materials.metalBlack);
    cap.position.set(0.85, 4.08, 0);
    post.add(cap);

    const bulb = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.13, 0.32, 8), this.materials.glassGlow);
    bulb.position.set(0.85, 3.92, 0);
    post.add(bulb);

    const pLight = new THREE.PointLight(0xffda77, 1.8, 14, 1.0);
    pLight.position.set(0.85, 3.8, 0);
    post.add(pLight);

    this.scene.add(post);
    this.obstacles.push({ type: 'circle', x, z, radius: 0.45 });
  }

  // ─── BUILDING: Projects Workshop ─────────────────────────────────────────
  buildProjectsShop(x, z, rotY = 0) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rotY;

    const wallMat = new THREE.MeshToonMaterial({ color: 0xf0e8d8 });
    const roofMat = new THREE.MeshToonMaterial({ color: 0xd94f38 });
    const frameMat = new THREE.MeshToonMaterial({ color: 0x2b2d42 });
    const doorMat = new THREE.MeshToonMaterial({ color: 0x8bc4d4 });
    const gearMat = new THREE.MeshToonMaterial({ color: 0xc8ad7f });

    // Base/floor
    const floor = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.1, 4.5), this.materials.stone);
    floor.position.set(0, 0.05, 0);
    floor.receiveShadow = true;
    g.add(floor);

    // Walls
    const wallBack = new THREE.Mesh(new THREE.BoxGeometry(7.2, 5.0, 0.2), wallMat); wallBack.position.set(0, 2.5, -2.1);
    const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.2, 5.0, 4.5), wallMat); wallLeft.position.set(-3.5, 2.5, 0);
    const wallRight = new THREE.Mesh(new THREE.BoxGeometry(0.2, 5.0, 4.5), wallMat); wallRight.position.set(3.5, 2.5, 0);
    const wallFrL = new THREE.Mesh(new THREE.BoxGeometry(2.5, 5.0, 0.2), wallMat); wallFrL.position.set(-2.35, 2.5, 2.1);
    const wallFrR = new THREE.Mesh(new THREE.BoxGeometry(2.5, 5.0, 0.2), wallMat); wallFrR.position.set(2.35, 2.5, 2.1);
    const wallFrTop = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.8, 0.2), wallMat); wallFrTop.position.set(0, 3.6, 2.1);
    [wallBack, wallLeft, wallRight, wallFrL, wallFrR, wallFrTop].forEach(m => { m.castShadow = true; m.receiveShadow = true; g.add(m); });

    // Timber X-braces on facade
    for (const sx of [-1, 1]) {
      const brace = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.5, 0.08), this.materials.woodDark);
      brace.position.set(sx * 2.35, 2.5, 2.2);
      brace.rotation.z = sx * Math.PI / 5;
      g.add(brace);
    }

    // Roof
    const roof = new THREE.Mesh(new THREE.ConeGeometry(4.5, 2.5, 4), roofMat);
    roof.position.set(0, 6.2, 0);
    roof.rotation.y = Math.PI / 4;
    roof.scale.set(1.4, 1.0, 0.85);
    roof.castShadow = true;
    g.add(roof);

    // Roof eave
    const eave = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.18, 5.0), roofMat);
    eave.position.set(0, 5.0, 0);
    eave.castShadow = true;
    g.add(eave);

    // Chimney
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.55, 2.0, 0.55), this.materials.stone);
    chimney.position.set(2.5, 6.0, -1.0);
    chimney.castShadow = true;
    g.add(chimney);

    // Striped awning
    const awning = this.createStripedAwning(3.0, 1.2, 0xd62828, 0xffffff);
    awning.position.set(0, 2.8, 2.4);
    awning.rotation.x = 0.22;
    g.add(awning);

    // Sign board
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.7, 0.15), frameMat);
    signBoard.position.set(0, 3.6, 2.25);
    const signBar = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.18, 0.05), new THREE.MeshBasicMaterial({ color: 0xffe3a8 }));
    signBar.position.set(0, 0, 0.1);
    signBoard.add(signBar);
    g.add(signBoard);

    // Gear decoration (workshop)
    const toothGeo = new THREE.BoxGeometry(0.18, 0.35, 0.1);
    for (let t = 0; t < 8; t++) {
      const tooth = new THREE.Mesh(toothGeo, gearMat);
      const a = (Math.PI / 4) * t;
      tooth.position.set(Math.cos(a) * 0.72, Math.sin(a) * 0.72, 2.3);
      tooth.position.y += 5.0;
      tooth.rotation.z = a;
      g.add(tooth);
    }
    const gearCenter = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.1, 12), gearMat);
    gearCenter.position.set(0, 5.0, 2.3);
    gearCenter.rotation.x = Math.PI / 2;
    g.add(gearCenter);

    // Windows
    const winMat = new THREE.MeshBasicMaterial({ color: 0xffda77 });
    const winGeo = new THREE.BoxGeometry(1.4, 1.5, 0.1);
    const framGeo = new THREE.BoxGeometry(1.55, 1.65, 0.15);
    for (const wx of [-2.0, 2.0]) {
      const win = new THREE.Mesh(winGeo, winMat); win.position.set(wx, 2.0, 2.14); g.add(win);
      const fr = new THREE.Mesh(framGeo, frameMat); fr.position.set(wx, 2.0, 2.12); g.add(fr);
      this.addWindowFlowerBox(g, wx, 1.1, 2.28);
    }

    // Double Doors
    const doorLPivot = new THREE.Group(); doorLPivot.position.set(-0.75, 0, 2.1);
    const doorLMesh = new THREE.Mesh(new THREE.BoxGeometry(0.75, 2.2, 0.12), doorMat);
    doorLMesh.position.set(0.375, 1.1, 0); doorLMesh.castShadow = true; doorLPivot.add(doorLMesh);
    const knobL = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), this.materials.gold); knobL.position.set(0.65, 1.1, 0.08); doorLPivot.add(knobL);

    const doorRPivot = new THREE.Group(); doorRPivot.position.set(0.75, 0, 2.1);
    const doorRMesh = new THREE.Mesh(new THREE.BoxGeometry(0.75, 2.2, 0.12), doorMat);
    doorRMesh.position.set(-0.375, 1.1, 0); doorRMesh.castShadow = true; doorRPivot.add(doorRMesh);
    const knobR = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), this.materials.gold); knobR.position.set(-0.65, 1.1, 0.08); doorRPivot.add(knobR);
    g.add(doorLPivot, doorRPivot);

    // Interior (cozy)
    const carpet = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.02, 2.8), new THREE.MeshToonMaterial({ color: 0xb7094c }));
    carpet.position.set(0, 0.11, 0); g.add(carpet);

    // Fireplace
    const fp = new THREE.Group(); fp.position.set(0, 0.6, -1.85);
    fp.add(new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.2, 0.4), new THREE.MeshToonMaterial({ color: 0x8f2d56 })));
    const fire = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, 0.35), new THREE.MeshBasicMaterial({ color: 0x111111 }));
    fire.position.set(0, -0.2, 0.05); fp.add(fire);
    for (let i = 0; i < 3; i++) {
      const fl = new THREE.Mesh(new THREE.SphereGeometry(0.1 + Math.random() * 0.06, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff5500 }));
      fl.position.set(-0.15 + i * 0.15, -0.38, 0.18); fp.add(fl);
    }
    const fireLight = new THREE.PointLight(0xff5500, 2.0, 5, 1.5);
    fireLight.position.set(0, -0.2, 0.3); fp.add(fireLight);
    g.add(fp);

    // Interior ceiling light
    const iLight = new THREE.PointLight(0xffdd88, 1.5, 7, 1.5);
    iLight.position.set(0, 4.0, 0); g.add(iLight);

    // Stairs
    this.addShopStairs(g, 2.3);

    this.scene.add(g);
    this.doors['projects'] = { left: doorLPivot, right: doorRPivot };
  }

  // ─── BUILDING: Tech Lab ───────────────────────────────────────────────────
  buildTechShop(x, z, rotY = 0) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rotY;

    const wallMat = new THREE.MeshToonMaterial({ color: 0xe0e8f0 });
    const domeMat = new THREE.MeshToonMaterial({ color: 0xd81159 });
    const neonTealMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
    const neonGreen = new THREE.MeshBasicMaterial({ color: 0x00f5d4 });
    const metalMat = new THREE.MeshToonMaterial({ color: 0x2b2d42 });
    const doorMat = new THREE.MeshToonMaterial({ color: 0x14213d });

    // Cylindrical shell
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 3.0, 4.6, 8, 1, true), wallMat);
    wall.position.y = 2.3; wall.rotation.y = Math.PI / 8; wall.castShadow = true; wall.receiveShadow = true;
    g.add(wall);

    // Vertical timber bands
    for (let i = 0; i < 8; i++) {
      const band = new THREE.Mesh(new THREE.BoxGeometry(0.15, 4.6, 0.15), this.materials.woodDark);
      const a = (Math.PI / 4) * i + Math.PI / 8;
      band.position.set(Math.cos(a) * 2.9, 2.3, Math.sin(a) * 2.9);
      band.rotation.y = -a;
      band.castShadow = true;
      g.add(band);
    }

    // Dome roof
    const dome = new THREE.Mesh(new THREE.SphereGeometry(2.9, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2), domeMat);
    dome.position.set(0, 4.4, 0); dome.castShadow = true;
    g.add(dome);

    // Dome top finial
    const finial = new THREE.Mesh(new THREE.ConeGeometry(0.25, 1.0, 6), this.materials.gold);
    finial.position.set(0, 7.35, 0);
    g.add(finial);

    // Neon teal windows (teal glow matching reference)
    for (let i = 0; i < 4; i++) {
      const a = (Math.PI / 2) * i + Math.PI / 8;
      const winGlow = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.2, 0.1), neonTealMat);
      winGlow.position.set(Math.cos(a) * 2.85, 2.2, Math.sin(a) * 2.85);
      winGlow.rotation.y = -a;
      g.add(winGlow);
    }

    // Sign
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.65, 0.15), metalMat);
    signBoard.position.set(0, 3.2, 2.85);
    const neonBar = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.12, 0.05), neonTealMat);
    neonBar.position.set(0, 0, 0.1); signBoard.add(neonBar);
    g.add(signBoard);

    // Awning (blue & white)
    const awning = this.createStripedAwning(3.4, 1.3, 0x0077b6, 0xffffff);
    awning.position.set(0, 2.6, 2.8); awning.rotation.x = 0.22;
    g.add(awning);

    // Stairs
    this.addShopStairs(g, 2.7);

    // Doors
    const doorLPivot = new THREE.Group(); doorLPivot.position.set(-0.65, 0, 2.65);
    const doorLMesh = new THREE.Mesh(new THREE.BoxGeometry(0.65, 2.0, 0.15), doorMat);
    doorLMesh.position.set(0.325, 1.0, 0); doorLMesh.castShadow = true; doorLPivot.add(doorLMesh);
    const doorRPivot = new THREE.Group(); doorRPivot.position.set(0.65, 0, 2.65);
    const doorRMesh = new THREE.Mesh(new THREE.BoxGeometry(0.65, 2.0, 0.15), doorMat);
    doorRMesh.position.set(-0.325, 1.0, 0); doorRMesh.castShadow = true; doorRPivot.add(doorRMesh);
    g.add(doorLPivot, doorRPivot);

    // Interior lab
    const labFloor = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.1, 3.8), this.materials.darkStone);
    labFloor.position.set(0, 0.05, 0.2); labFloor.receiveShadow = true; g.add(labFloor);
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 0.6, 8), metalMat);
    pedestal.position.set(0, 0.4, 0.2); g.add(pedestal);
    const hologram = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 10), new THREE.MeshBasicMaterial({ color: 0x4cc9f0, wireframe: true }));
    hologram.position.set(0, 1.1, 0.2); g.add(hologram);
    this.windmillBlades = hologram; // reuse for spinning
    const ceilingLight = new THREE.PointLight(0x00f5d4, 2.0, 7, 1.2);
    ceilingLight.position.set(0, 3.8, 0.2); g.add(ceilingLight);

    this.scene.add(g);
    this.doors['tech'] = { left: doorLPivot, right: doorRPivot };
  }

  // ─── BUILDING: Experience / Education ─────────────────────────────────────
  buildExperienceShop(x, z, rotY = 0) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rotY;

    const wallMat = new THREE.MeshToonMaterial({ color: 0xf5f0ea });
    const tRoofMat = new THREE.MeshToonMaterial({ color: 0x3d8c62 });
    const doorMat = new THREE.MeshToonMaterial({ color: 0x1d3557 });
    const frameMat = new THREE.MeshToonMaterial({ color: 0x2b2d42 });

    // Floor
    const floor = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.1, 4.5), this.materials.stone);
    floor.position.set(0, 0.05, 0); floor.receiveShadow = true; g.add(floor);

    // Walls
    const wallBack = new THREE.Mesh(new THREE.BoxGeometry(6.5, 5.2, 0.2), wallMat); wallBack.position.set(0, 2.6, -2.1);
    const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.2, 5.2, 4.5), wallMat); wallLeft.position.set(-3.15, 2.6, 0);
    const wallRight = new THREE.Mesh(new THREE.BoxGeometry(0.2, 5.2, 4.5), wallMat); wallRight.position.set(3.15, 2.6, 0);
    const wallFrL = new THREE.Mesh(new THREE.BoxGeometry(2.2, 5.2, 0.2), wallMat); wallFrL.position.set(-2.15, 2.6, 2.1);
    const wallFrR = new THREE.Mesh(new THREE.BoxGeometry(2.2, 5.2, 0.2), wallMat); wallFrR.position.set(2.15, 2.6, 2.1);
    const wallFrTop = new THREE.Mesh(new THREE.BoxGeometry(1.6, 3.0, 0.2), wallMat); wallFrTop.position.set(0, 3.7, 2.1);
    [wallBack, wallLeft, wallRight, wallFrL, wallFrR, wallFrTop].forEach(m => { m.castShadow = true; m.receiveShadow = true; g.add(m); });

    // Main roof (flat hip)
    const mainRoof = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.4, 5.2), tRoofMat);
    mainRoof.position.set(0, 5.3, 0); mainRoof.castShadow = true; g.add(mainRoof);

    // Clock tower
    const tower = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.5, 2.2), wallMat);
    tower.position.set(0, 6.75, 0); tower.castShadow = true; g.add(tower);

    const tRoof = new THREE.Mesh(new THREE.ConeGeometry(1.8, 2.2, 4), tRoofMat);
    tRoof.position.set(0, 9.7, 0); tRoof.rotation.y = Math.PI / 4; tRoof.castShadow = true;
    g.add(tRoof);

    // Clock face
    const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.1, 16), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    dial.position.set(0, 6.9, 1.12); dial.rotation.x = Math.PI / 2;
    const hands = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.05), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    hands.position.set(0, 0, 0.07); hands.rotation.z = 0.8; dial.add(hands);
    g.add(dial);

    // Windows
    const winMat = new THREE.MeshBasicMaterial({ color: 0xffd77a });
    for (const wx of [-1.8, 1.8]) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.5, 0.1), winMat);
      win.position.set(wx, 2.0, 2.14); g.add(win);
      const fr = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.65, 0.15), frameMat);
      fr.position.set(wx, 2.0, 2.12); g.add(fr);
    }

    // Awning
    const awning = this.createStripedAwning(3.5, 1.3, 0x2d6a4f, 0xf0ead6);
    awning.position.set(0, 2.75, 2.2); awning.rotation.x = 0.22; g.add(awning);

    // Sign
    const sign = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.65, 0.15), frameMat);
    sign.position.set(0, 3.5, 2.25);
    const sBar = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.18, 0.05), new THREE.MeshBasicMaterial({ color: 0xa8dadc }));
    sBar.position.set(0, 0, 0.1); sign.add(sBar);
    g.add(sign);

    // Stairs & doors
    this.addShopStairs(g, 2.3);

    const doorLPivot = new THREE.Group(); doorLPivot.position.set(-0.7, 0, 2.1);
    const doorLMesh = new THREE.Mesh(new THREE.BoxGeometry(0.7, 2.2, 0.1), doorMat);
    doorLMesh.position.set(0.35, 1.1, 0); doorLMesh.castShadow = true; doorLPivot.add(doorLMesh);
    const doorRPivot = new THREE.Group(); doorRPivot.position.set(0.7, 0, 2.1);
    const doorRMesh = new THREE.Mesh(new THREE.BoxGeometry(0.7, 2.2, 0.1), doorMat);
    doorRMesh.position.set(-0.35, 1.1, 0); doorRMesh.castShadow = true; doorRPivot.add(doorRMesh);
    g.add(doorLPivot, doorRPivot);

    // Interior
    const carpet = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.02, 2.6), new THREE.MeshToonMaterial({ color: 0x1d3557 }));
    carpet.position.set(0, 0.11, 0); g.add(carpet);
    const iLight = new THREE.PointLight(0xffeed1, 1.8, 7, 1.5);
    iLight.position.set(0, 4.0, 0); g.add(iLight);

    this.scene.add(g);
    this.doors['experience'] = { left: doorLPivot, right: doorRPivot };
  }

  // ─── BUILDING: Contact Building ───────────────────────────────────────────
  buildContactBuilding(x, z) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);

    const stoneMat = this.materials.stone;
    const wallMat = new THREE.MeshToonMaterial({ color: 0xd4c8b8 });
    const roofMat = new THREE.MeshToonMaterial({ color: 0x4a5568 });
    const doorMat = new THREE.MeshToonMaterial({ color: 0x4a3224 });

    // Base
    const base = new THREE.Mesh(new THREE.BoxGeometry(8, 0.1, 5), stoneMat);
    base.position.set(0, 0.05, 0); base.receiveShadow = true; g.add(base);

    // Main building body
    const body = new THREE.Mesh(new THREE.BoxGeometry(8, 5.5, 5), wallMat);
    body.position.set(0, 2.75, 0); body.castShadow = true; body.receiveShadow = true; g.add(body);

    // Arched top section
    const arch = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 1.2, 16, 1, false, 0, Math.PI), wallMat);
    arch.rotation.z = Math.PI / 2; arch.position.set(0, 5.7, 0); arch.scale.set(1, 1, 0.78);
    arch.castShadow = true; g.add(arch);

    // Roof
    const roof = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.35, 5.8), roofMat);
    roof.position.set(0, 5.6, 0); roof.castShadow = true; g.add(roof);

    // Side towers
    for (const sx of [-1, 1]) {
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 6.0, 8), stoneMat);
      tower.position.set(sx * 4.5, 3.0, 0); tower.castShadow = true; g.add(tower);
      const tCap = new THREE.Mesh(new THREE.ConeGeometry(1.1, 1.5, 8), roofMat);
      tCap.position.set(sx * 4.5, 6.75, 0); tCap.castShadow = true; g.add(tCap);
    }

    // Glowing mailbox sign
    const signMat = new THREE.MeshToonMaterial({ color: 0x2b2d42 });
    const sign = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.8, 0.18), signMat);
    sign.position.set(0, 4.2, 2.58);
    const glowBar = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.2, 0.06), new THREE.MeshBasicMaterial({ color: 0x00e5ff }));
    glowBar.position.set(0, 0, 0.12); sign.add(glowBar);
    g.add(sign);

    // Pillars flanking entrance
    for (const px of [-2.2, 2.2]) {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 5.5, 8), stoneMat);
      pillar.position.set(px, 2.75, 2.1); pillar.castShadow = true; g.add(pillar);
    }

    // Arch frame over door
    const archFrame = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 0.4, 16, 1, false, 0, Math.PI), signMat);
    archFrame.rotation.z = Math.PI / 2; archFrame.position.set(0, 3.9, 2.4);
    archFrame.scale.set(1, 1, 1.3); g.add(archFrame);

    // Stairs
    this.addShopStairs(g, 2.55);

    // Doors
    const doorLPivot = new THREE.Group(); doorLPivot.position.set(-1.8, 0, 2.5);
    const doorLMesh = new THREE.Mesh(new THREE.BoxGeometry(1.8, 3.8, 0.15), doorMat);
    doorLMesh.position.set(0.9, 1.9, 0); doorLMesh.castShadow = true; doorLPivot.add(doorLMesh);
    const doorRPivot = new THREE.Group(); doorRPivot.position.set(1.8, 0, 2.5);
    const doorRMesh = new THREE.Mesh(new THREE.BoxGeometry(1.8, 3.8, 0.15), doorMat);
    doorRMesh.position.set(-0.9, 1.9, 0); doorRMesh.castShadow = true; doorRPivot.add(doorRMesh);
    g.add(doorLPivot, doorRPivot);

    // Ivy decoration
    const ivyMat = new THREE.MeshToonMaterial({ color: 0x31572c });
    [[-5.5, 3.0, 2.6], [-4.8, 5.0, 2.5], [5.5, 2.5, 2.6], [4.8, 4.5, 2.5]].forEach(p => {
      const ivy = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 8), ivyMat);
      ivy.position.set(p[0], p[1], p[2]); ivy.scale.set(1.0, 1.4, 0.7); g.add(ivy);
    });

    // Hanging lanterns
    const ironMat = new THREE.MeshToonMaterial({ color: 0x1d1e2c });
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xffea00 });
    for (const lx of [-3.2, 3.2]) {
      const lantern = new THREE.Group();
      lantern.position.set(lx, 4.2, 2.7);
      lantern.add(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.4, 6), glowMat));
      const pL = new THREE.PointLight(0xffea00, 1.4, 8, 1.5);
      pL.position.y = -0.2; lantern.add(pL);
      g.add(lantern);
    }

    // Interior light
    const iLight = new THREE.PointLight(0xffcc44, 1.5, 8, 1.5);
    iLight.position.set(0, 3.5, 0); g.add(iLight);

    this.scene.add(g);
    this.doors['contact'] = { left: doorLPivot, right: doorRPivot };
  }

  // ─── BUILDING: Home Cottage ───────────────────────────────────────────────
  buildHomeCottage() {
    const g = new THREE.Group();
    g.position.set(-20, 0, -8);
    g.rotation.y = Math.PI / 8; // Angled toward plaza

    const wallMat = new THREE.MeshToonMaterial({ color: 0xf4e8d4 });
    const roofMat = new THREE.MeshToonMaterial({ color: 0xc44536 }); // Red terracotta
    const frameMat = new THREE.MeshToonMaterial({ color: 0x2b2d42 });
    const doorMat = new THREE.MeshToonMaterial({ color: 0x5c3d2e });

    // Floor
    const floor = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.1, 4.0), this.materials.stone);
    floor.position.set(0, 0.05, 0); floor.receiveShadow = true; g.add(floor);

    // Walls
    const wallBack = new THREE.Mesh(new THREE.BoxGeometry(5.5, 4.0, 0.2), wallMat); wallBack.position.set(0, 2.0, -1.9);
    const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4.0, 4.0), wallMat); wallLeft.position.set(-2.65, 2.0, 0);
    const wallRight = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4.0, 4.0), wallMat); wallRight.position.set(2.65, 2.0, 0);
    const wallFrL = new THREE.Mesh(new THREE.BoxGeometry(1.8, 4.0, 0.2), wallMat); wallFrL.position.set(-1.85, 2.0, 1.9);
    const wallFrR = new THREE.Mesh(new THREE.BoxGeometry(1.8, 4.0, 0.2), wallMat); wallFrR.position.set(1.85, 2.0, 1.9);
    const wallFrTop = new THREE.Mesh(new THREE.BoxGeometry(1.9, 2.0, 0.2), wallMat); wallFrTop.position.set(0, 3.0, 1.9);
    [wallBack, wallLeft, wallRight, wallFrL, wallFrR, wallFrTop].forEach(m => { m.castShadow = true; m.receiveShadow = true; g.add(m); });

    // Timber framing
    for (const sx of [-1, 1]) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(0.12, 4.0, 0.08), this.materials.woodDark);
      beam.position.set(sx * 2.65, 2.0, 1.95); g.add(beam);
    }
    const topBeam = new THREE.Mesh(new THREE.BoxGeometry(5.9, 0.14, 0.1), this.materials.woodDark);
    topBeam.position.set(0, 4.0, 1.95); g.add(topBeam);

    // Roof (gabled)
    const roof = new THREE.Mesh(new THREE.ConeGeometry(3.8, 2.5, 4), roofMat);
    roof.position.set(0, 5.2, 0); roof.rotation.y = Math.PI / 4;
    roof.scale.set(1.3, 1.0, 0.88); roof.castShadow = true;
    g.add(roof);

    // Eave
    const eave = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.18, 4.6), roofMat);
    eave.position.set(0, 4.05, 0); eave.castShadow = true; g.add(eave);

    // Chimney
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.0, 0.5), this.materials.stone);
    chimney.position.set(1.8, 5.4, -0.8); chimney.castShadow = true; g.add(chimney);

    // Windows
    const winMat = new THREE.MeshBasicMaterial({ color: 0xffcc44 });
    for (const wx of [-1.6, 1.6]) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.2, 0.1), winMat);
      win.position.set(wx, 1.9, 1.94); g.add(win);
      const fr = new THREE.Mesh(new THREE.BoxGeometry(1.25, 1.35, 0.15), frameMat);
      fr.position.set(wx, 1.9, 1.92); g.add(fr);
      this.addWindowFlowerBox(g, wx, 1.2, 2.06);
    }

    // Door
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.1, 0.12), doorMat);
    door.position.set(0, 1.05, 1.94); door.castShadow = true; g.add(door);
    const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.05, 2.25, 0.16), frameMat);
    doorFrame.position.set(0, 1.05, 1.92); g.add(doorFrame);

    // Mailbox
    const mailPost = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.7, 6), this.materials.woodDark);
    mailPost.position.set(1.8, 0.35, 2.2); g.add(mailPost);
    const mailBox = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.32), new THREE.MeshToonMaterial({ color: 0xe63946 }));
    mailBox.position.set(1.8, 0.8, 2.2); g.add(mailBox);

    // Interior light
    this.addHangingLantern(g, 0, 4.05, 1.96, 1);
    const iLight = new THREE.PointLight(0xffcc44, 1.4, 6, 1.5);
    iLight.position.set(0, 2.0, 0); g.add(iLight);

    this.scene.add(g);

    // Home-side small fence
    this.buildSmallFence(-22, -10, -16, -4);
    this.obstacles.push({ type: 'box', minX: -23, maxX: -17, minZ: -12, maxZ: -4 });
  }

  buildSmallFence(x1, z1, x2, z2) {
    const postMat = this.materials.woodDark;
    const railMat = this.materials.woodLight;
    const dx = x2 - x1, dz = z2 - z1;
    const len = Math.sqrt(dx * dx + dz * dz);
    const steps = Math.floor(len / 1.5);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.0, 0.12), postMat);
      post.position.set(x1 + dx * t, 0.5, z1 + dz * t);
      post.castShadow = true;
      this.scene.add(post);
    }
    const rail = new THREE.Mesh(new THREE.BoxGeometry(len, 0.08, 0.08), railMat);
    rail.position.set((x1 + x2) / 2, 0.85, (z1 + z2) / 2);
    rail.rotation.y = Math.atan2(dz, dx);
    this.scene.add(rail);
    const rail2 = rail.clone(); rail2.position.y = 0.55; this.scene.add(rail2);
  }

  // ─── BUILDING: Castle (landmark) ─────────────────────────────────────────
  buildCastle() {
    const g = new THREE.Group();
    g.position.set(0, 0, -65);

    const stoneMat = new THREE.MeshToonMaterial({ color: 0x8d96a8 });
    const darkStone = new THREE.MeshToonMaterial({ color: 0x4a5568 });
    const roofMat = new THREE.MeshToonMaterial({ color: 0x1e40af }); // Blue spire like reference

    // Hill base
    const hill = new THREE.Mesh(new THREE.CylinderGeometry(18, 22, 5, 16), new THREE.MeshToonMaterial({ color: 0x4a7c59 }));
    hill.position.set(0, 2.5, 0); hill.receiveShadow = true; this.scene.add(hill);

    // Main keep
    const keep = new THREE.Mesh(new THREE.BoxGeometry(12, 12, 10), stoneMat);
    keep.position.set(0, 11, 0); keep.castShadow = true; keep.receiveShadow = true; g.add(keep);

    // Battlements on top of keep
    for (let bx = -5; bx <= 5; bx += 2) {
      const merlon = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.8), darkStone);
      merlon.position.set(bx, 17.6, 5.4); merlon.castShadow = true; g.add(merlon);
      const merlon2 = merlon.clone(); merlon2.position.z = -5.4; g.add(merlon2);
    }

    // Corner towers
    const towerPositions = [[-7, -6], [7, -6], [-7, 6], [7, 6]];
    towerPositions.forEach(([tx, tz]) => {
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.8, 14, 8), stoneMat);
      tower.position.set(tx, 7, tz); tower.castShadow = true; g.add(tower);
      const tRoof = new THREE.Mesh(new THREE.ConeGeometry(2.6, 4.5, 8), roofMat);
      tRoof.position.set(tx, 16.5, tz); tRoof.castShadow = true; g.add(tRoof);
      // Battlements on towers
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i;
        const mb = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.9, 0.5), darkStone);
        mb.position.set(tx + Math.cos(a) * 2.2, 14.45, tz + Math.sin(a) * 2.2);
        g.add(mb);
      }
    });

    // Central tall spire
    const spireBase = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 2.0, 8, 8), stoneMat);
    spireBase.position.set(0, 21, 0); spireBase.castShadow = true; g.add(spireBase);
    const spire = new THREE.Mesh(new THREE.ConeGeometry(1.8, 6, 8), roofMat);
    spire.position.set(0, 27.5, 0); spire.castShadow = true; g.add(spire);

    // Gate archway
    const gateMat = new THREE.MeshToonMaterial({ color: 0x2b2d42 });
    const gateArch = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.0, 0.5, 16, 1, false, 0, Math.PI), gateMat);
    gateArch.rotation.z = Math.PI / 2; gateArch.position.set(0, 5.2, 5.1); gateArch.scale.set(1, 1, 1.4);
    g.add(gateArch);
    const gate = new THREE.Mesh(new THREE.BoxGeometry(3.2, 4.8, 0.5), gateMat);
    gate.position.set(0, 12, 5.1); gate.castShadow = true; g.add(gate);

    // Castle light (blue-tinged torches)
    const castleLight = new THREE.PointLight(0x8888ff, 1.5, 30, 1.0);
    castleLight.position.set(0, 15, 0); g.add(castleLight);

    g.position.set(0, 5, -65);
    this.scene.add(g);

    // Stairway to castle gate
    const stairMat = this.materials.stone;
    for (let s = 0; s < 8; s++) {
      const stair = new THREE.Mesh(new THREE.BoxGeometry(5, 0.4, 0.9), stairMat);
      stair.position.set(0, s * 0.4, -55 + s * 0.9);
      stair.receiveShadow = true;
      this.scene.add(stair);
    }
  }

  // ─── SIGNS ───────────────────────────────────────────────────────────────

  buildWelcomeSign() {
    // Large wooden welcome sign board — left side of entry path
    const g = new THREE.Group();
    g.position.set(-5.5, 0, 6);
    g.rotation.y = Math.PI / 12; // Angled toward player

    const postMat = this.materials.woodDark;
    const boardMat = new THREE.MeshToonMaterial({ color: 0x8b5e3c });
    const textMat = new THREE.MeshBasicMaterial({ color: 0xfde68a });

    // Posts
    for (const px of [-0.55, 0.55]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.6, 0.15), postMat);
      post.position.set(px, 1.3, 0); post.castShadow = true; g.add(post);
      // Pointy top
      const top = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 4), postMat);
      top.position.set(px, 2.75, 0); top.rotation.y = Math.PI / 4; g.add(top);
    }

    // Sign board
    const board = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.0, 0.1), boardMat);
    board.position.set(0, 1.8, 0); board.castShadow = true; g.add(board);

    // Decorative border on board
    const border = new THREE.Mesh(new THREE.BoxGeometry(1.38, 1.08, 0.05), postMat);
    border.position.set(0, 1.8, 0.03); g.add(border);
    const inner = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.92, 0.05), boardMat);
    inner.position.set(0, 1.8, 0.05); g.add(inner);

    // Text lines (colored bars representing text)
    const line1 = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.08, 0.02), textMat);
    line1.position.set(0, 2.0, 0.09); g.add(line1);
    const line2 = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.14, 0.02), new THREE.MeshBasicMaterial({ color: 0xf4a261 }));
    line2.position.set(0, 1.82, 0.09); g.add(line2);
    const line3 = new THREE.Mesh(new THREE.BoxGeometry(0.80, 0.07, 0.02), textMat);
    line3.position.set(0, 1.66, 0.09); g.add(line3);
    const line4 = new THREE.Mesh(new THREE.BoxGeometry(0.70, 0.07, 0.02), textMat);
    line4.position.set(0, 1.57, 0.09); g.add(line4);

    this.scene.add(g);
  }

  buildDirectionalSign() {
    // Wooden directional signpost — right side, pointing to links
    const g = new THREE.Group();
    g.position.set(5.5, 0, 6);
    g.rotation.y = -Math.PI / 10;

    const postMat = this.materials.woodDark;
    const boardMat = new THREE.MeshToonMaterial({ color: 0x9c6644 });
    const colors = [0x333333, 0x0a66c2, 0x374151, 0xe63946]; // GitHub, LinkedIn, Resume, Email

    // Main post
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.15, 3.0, 0.15), postMat);
    post.position.set(0, 1.5, 0); post.castShadow = true; g.add(post);
    const postTop = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 4), postMat);
    postTop.position.set(0, 3.15, 0); postTop.rotation.y = Math.PI / 4; g.add(postTop);

    // Directional arrow boards
    const labels = ['GitHub', 'LinkedIn', 'Resume', 'Email'];
    labels.forEach((label, i) => {
      const board = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.26, 0.08), boardMat);
      board.position.set(0.55 + (i % 2 === 0 ? 0.05 : -0.05), 2.6 - i * 0.32, 0);
      board.rotation.z = -0.06 + i * 0.02;
      board.castShadow = true;
      g.add(board);
      // Colored dot icon
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), new THREE.MeshBasicMaterial({ color: colors[i] }));
      dot.position.set(-0.38, 2.6 - i * 0.32, 0.06); g.add(dot);
      // Text bar
      const text = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.08, 0.02), new THREE.MeshBasicMaterial({ color: 0xfff8e7 }));
      text.position.set(0.62, 2.6 - i * 0.32, 0.08); g.add(text);
    });

    this.scene.add(g);
  }

  // ─── FOUNTAIN ────────────────────────────────────────────────────────────

  buildFountain() {
    const cx = this.HUB_CENTER.x;
    const cz = this.HUB_CENTER.z;
    const g = new THREE.Group();
    g.position.set(cx, 0, cz);

    const stoneMat = this.materials.stone;
    const darkStone = this.materials.darkStone;

    // Outer basin
    const outerBasin = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.2, 0.3, 24), stoneMat);
    outerBasin.position.y = 0.15; outerBasin.castShadow = true; outerBasin.receiveShadow = true; g.add(outerBasin);

    // Water surface
    const water = new THREE.Mesh(new THREE.CylinderGeometry(1.88, 1.88, 0.08, 24), this.materials.waterBlue);
    water.position.y = 0.27; g.add(water);

    // Column
    const col1 = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.30, 0.75, 12), stoneMat);
    col1.position.y = 0.37; col1.castShadow = true; g.add(col1);
    const midBase = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.62, 0.15, 16), stoneMat);
    midBase.position.y = 0.75; g.add(midBase);
    const col2 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.20, 0.6, 12), darkStone);
    col2.position.y = 1.1; g.add(col2);

    // Glowing crystal top (blue crystal matching reference)
    const crystalMat = new THREE.MeshBasicMaterial({ color: 0x00ccff, transparent: true, opacity: 0.85 });
    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.38), crystalMat);
    crystal.position.y = 1.62; crystal.castShadow = true; g.add(crystal);
    this.fountainCrystal = crystal;

    // Decorative spout rings
    const spoutMat = new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.6 });
    for (let i = 0; i < 5; i++) {
      const a = (Math.PI * 2 / 5) * i;
      const spout = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), spoutMat);
      spout.position.set(Math.cos(a) * 0.46, 0.84, Math.sin(a) * 0.46);
      g.add(spout);
    }

    // Bright blue point light
    const fLight = new THREE.PointLight(0x00aaff, 2.5, 12, 1.2);
    fLight.position.set(0, 0.8, 0); g.add(fLight);

    this.scene.add(g);
    this.obstacles.push({ type: 'circle', x: cx, z: cz, radius: 2.4 });
  }

  // ─── VEGETATION ──────────────────────────────────────────────────────────

  buildTownTrees() {
    const positions = [
      // Around plaza perimeter
      { x: -14, z: -4 }, { x: 14, z: -4 },
      { x: -12, z: -32 }, { x: 12, z: -32 },
      { x: -8, z: -38 }, { x: 8, z: -38 },
      { x: -24, z: -18 }, { x: 24, z: -18 },
      { x: -20, z: -28 }, { x: 20, z: -28 },
      // Behind buildings
      { x: -5, z: -34 }, { x: 5, z: -34 },
      { x: -22, z: -14 }, { x: 22, z: -14 },
      { x: -4, z: -50 }, { x: 4, z: -50 },
      { x: -12, z: -52 }, { x: 12, z: -52 },
      // Entry path sides
      { x: -5, z: 2 }, { x: 5, z: 2 },
      { x: -6, z: 8 }, { x: 6, z: 8 },
      // Background
      { x: -30, z: -40 }, { x: 30, z: -40 },
      { x: -26, z: -55 }, { x: 26, z: -55 },
    ];

    positions.forEach(p => {
      this.createTree(p.x, p.z, 0.8 + Math.random() * 0.5);
    });
  }

  createTree(x, z, scale = 1.0) {
    const tree = new THREE.Group();
    tree.position.set(x, 0, z);
    const effectiveScale = scale * 1.3;
    tree.scale.set(effectiveScale, effectiveScale, effectiveScale);

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.40, 5.5, 8), this.materials.trunkBrown);
    trunk.position.y = 2.75; trunk.castShadow = true; tree.add(trunk);

    const leafMats = [this.materials.leafGreen, this.materials.leafLight, this.materials.leafDark];
    const leafMat = leafMats[Math.floor(Math.random() * leafMats.length)];

    [[0, 2.8, 0, 1.4], [-0.7, 2.1, -0.5, 1.1], [0.7, 2.2, 0.5, 1.15], [0, 2.4, 0.7, 1.0]]
      .forEach(([lx, ly, lz, ls]) => {
        const blob = new THREE.Mesh(new THREE.SphereGeometry(1.4, 12, 12), leafMat);
        blob.position.set(lx, ly + 2.8, lz); blob.scale.setScalar(ls);
        blob.castShadow = true; tree.add(blob);
      });

    this.scene.add(tree);
    this.obstacles.push({ type: 'circle', x, z, radius: 0.6 * effectiveScale });
  }

  buildFoliageScatter() {
    // Scattered flowers across the grass
    const flowerColors = [0xffadad, 0xffd6a5, 0xfdffb6, 0xcaffbf, 0xff7096, 0xf4a261];
    for (let i = 0; i < 200; i++) {
      const side = Math.random() > 0.5 ? 1 : -1;
      const dist = 15 + Math.random() * 40;
      const angle = Math.random() * Math.PI * 2;
      const fx = Math.cos(angle) * dist;
      const fz = this.HUB_CENTER.z + Math.sin(angle) * dist;

      const stemGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.4, 6);
      const flowerGeo = new THREE.CylinderGeometry(0, 0.15, 0.3, 5);
      const stem = new THREE.Mesh(stemGeo, this.materials.leafGreen);
      const petal = new THREE.Mesh(flowerGeo, new THREE.MeshToonMaterial({ color: flowerColors[Math.floor(Math.random() * flowerColors.length)] }));
      const group = new THREE.Group();
      stem.position.y = 0.2; petal.position.y = 0.45;
      group.add(stem, petal);
      const s = 0.6 + Math.random() * 0.6;
      group.scale.setScalar(s);
      group.position.set(fx, 0, fz);
      this.scene.add(group);
    }

    // Grass clumps near entry
    for (let i = 0; i < 80; i++) {
      const gz = -5 + Math.random() * 20;
      const gx = (5 + Math.random() * 12) * (Math.random() > 0.5 ? 1 : -1);
      this.buildGrassClump(gx, 0, gz, 0.9 + Math.random() * 0.4);
    }
  }

  buildClouds() {
    const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.95 });
    const sphereGeo = new THREE.SphereGeometry(1.8, 12, 12);
    for (let i = 0; i < 18; i++) {
      const cloud = new THREE.Group();
      cloud.position.set((Math.random() - 0.5) * 130, 24 + Math.random() * 10, -Math.random() * 100);

      [
        [0, 0, 0, 1.0], [1.8, -0.3, 0.3, 0.8], [-1.7, -0.1, -0.3, 0.8],
        [0.6, 0.7, -0.4, 0.9], [-0.5, 0.6, 0.5, 0.85]
      ].forEach(([cx, cy, cz, cs]) => {
        const s = new THREE.Mesh(sphereGeo, cloudMat);
        s.position.set(cx, cy, cz); s.scale.setScalar(cs); cloud.add(s);
      });

      const sc = 1.0 + Math.random() * 1.8;
      cloud.scale.set(sc, sc * 0.65, sc);
      this.scene.add(cloud);
      this.clouds.push({ mesh: cloud, speed: 0.4 + Math.random() * 0.7, resetX: 80, startX: -80 });
    }
  }

  buildParticles() {
    const geom = new THREE.BufferGeometry();
    const positions = [], speeds = [], sines = [];
    for (let i = 0; i < this.particleCount; i++) {
      positions.push((Math.random() - 0.5) * 80, 2 + Math.random() * 14, -Math.random() * 80 + 10);
      speeds.push(0.8 + Math.random() * 1.8);
      sines.push(Math.random() * Math.PI * 2);
    }
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 16; pCanvas.height = 16;
    const pCtx = pCanvas.getContext('2d');
    pCtx.fillStyle = '#ffc300';
    pCtx.beginPath(); pCtx.arc(8, 8, 5, 0, Math.PI * 2); pCtx.fill();
    const mat = new THREE.PointsMaterial({
      size: 0.18, map: new THREE.CanvasTexture(pCanvas),
      transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending
    });
    this.particles = new THREE.Points(geom, mat);
    this.particlesData = { speeds, sines };
    this.scene.add(this.particles);
  }

  buildNPCs() {
    this.createNPC(-3, 0, 8, Math.PI * 0.8, 'wave', 0xff7096);
    this.createNPC(4, 0, 6, Math.PI * 0.6, 'idle', 0x4cc9f0);
    this.createNPC(8, 0, -8, Math.PI * 1.2, 'idle', 0xf4a261);
    this.createNPC(-8, 0, -14, Math.PI * 0.3, 'wave', 0x40916c);
  }

  // ─── TRIGGERS ────────────────────────────────────────────────────────────

  checkTriggers(charX, charZ) {
    let active = null;
    for (const trigger of this.shopTriggers) {
      const dx = charX - trigger.x;
      const dz = charZ - trigger.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < trigger.radius) { active = trigger; break; }
    }
    return active;
  }

  openShopDoor(shopName, callback) {
    const door = this.doors[shopName];
    if (!door) { if (callback) callback(); return; }
    const angle = Math.PI * 0.6;
    let t = 0;
    const animate = () => {
      t += 0.06;
      if (t >= 1) {
        door.left.rotation.y = angle;
        door.right.rotation.y = -angle;
        if (callback) callback();
      } else {
        const p = t * t * (3 - 2 * t);
        door.left.rotation.y = p * angle;
        door.right.rotation.y = -p * angle;
        requestAnimationFrame(animate);
      }
    };
    animate();
  }

  closeShopDoor(shopName, callback) {
    const door = this.doors[shopName];
    if (!door) { if (callback) callback(); return; }
    const angle = door.left.rotation.y;
    let t = 0;
    const animate = () => {
      t += 0.07;
      if (t >= 1) {
        door.left.rotation.y = 0;
        door.right.rotation.y = 0;
        if (callback) callback();
      } else {
        const p = t * t * (3 - 2 * t);
        door.left.rotation.y = angle * (1 - p);
        door.right.rotation.y = -angle * (1 - p);
        requestAnimationFrame(animate);
      }
    };
    animate();
  }

  // ─── UPDATE LOOP ─────────────────────────────────────────────────────────

  update(deltaTime) {
    // 2.5D mode — no world objects to animate
  }

  // ─── HELPERS ─────────────────────────────────────────────────────────────

  getRoadX(z) { return 0; } // Hub layout: road center is always X=0 (for backwards compat)

  addShopStairs(g, frontZ) {
    const stairMat = this.materials.stone;
    const l1 = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.1, 0.85), stairMat);
    l1.position.set(0, 0.05, frontZ + 0.45); l1.castShadow = true; l1.receiveShadow = true;
    const l2 = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.1, 0.5), stairMat);
    l2.position.set(0, 0.15, frontZ + 0.28); l2.castShadow = true; l2.receiveShadow = true;
    g.add(l1, l2);
  }

  addWindowFlowerBox(g, x, y, z) {
    const fb = new THREE.Group(); fb.position.set(x, y, z);
    const boxMesh = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.2, 0.35), this.materials.woodDark);
    boxMesh.castShadow = true;
    fb.add(boxMesh);
    const leafMesh = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.15, 0.3), this.materials.leafLight);
    leafMesh.position.set(0, 0.15, 0);
    fb.add(leafMesh);
    const colors = [0xff7096, 0xffd166, 0xf72585];
    for (let i = 0; i < 6; i++) {
      const fl = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), new THREE.MeshToonMaterial({ color: colors[i % 3] }));
      fl.position.set(-0.6 + i * 0.24, 0.2, (Math.random() - 0.5) * 0.1);
      fb.add(fl);
    }
    g.add(fb);
  }

  buildGrassClump(x, y, z, scale = 1.0) {
    const clump = new THREE.Group(); clump.position.set(x, y, z);
    const bladeGeo = new THREE.ConeGeometry(0.12, 0.6, 4);
    const bladeMat = Math.random() > 0.5 ? this.materials.leafLight : this.materials.leafGreen;
    for (let i = 0; i < 3; i++) {
      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      blade.position.set((Math.random() - 0.5) * 0.18, 0.2, (Math.random() - 0.5) * 0.18);
      blade.rotation.set(0.1 + Math.random() * 0.25, Math.random() * Math.PI, (Math.random() - 0.5) * 0.25);
      blade.castShadow = true; clump.add(blade);
    }
    clump.scale.setScalar(scale); this.scene.add(clump);
  }

  createBrickTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#5a5e6a';
    ctx.fillRect(0, 0, 512, 512);
    const rows = 12, rowH = 512 / rows;
    for (let r = 0; r < rows; r++) {
      const offset = (r % 2) * 28;
      let curX = -40 + offset;
      while (curX < 552) {
        const w = 55 + Math.floor(Math.random() * 38);
        const h = rowH - 5;
        const stones = ['#8d99ae', '#707a8a', '#7b889b', '#9ea9bb'];
        ctx.fillStyle = stones[Math.floor(Math.random() * stones.length)];
        ctx.beginPath(); ctx.roundRect(curX, r * rowH + 3, w, h, 6); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(curX + 3, r * rowH + 4); ctx.lineTo(curX + w - 3, r * rowH + 4); ctx.stroke();
        curX += w + 5;
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  createStripedAwning(width, depth, colorA, colorB) {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const stripes = 8, sw = canvas.width / stripes;
    for (let i = 0; i < stripes; i++) {
      ctx.fillStyle = i % 2 === 0
        ? '#' + colorA.toString(16).padStart(6, '0')
        : '#' + colorB.toString(16).padStart(6, '0');
      ctx.fillRect(i * sw, 0, sw, canvas.height);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    const mat = new THREE.MeshToonMaterial({ map: tex, side: THREE.DoubleSide });
    const ag = new THREE.Group();
    ag.add(new THREE.Mesh(new THREE.BoxGeometry(width, 0.06, depth), mat));
    const valance = new THREE.Mesh(new THREE.BoxGeometry(width, 0.28, 0.05), new THREE.MeshToonMaterial({ map: tex.clone(), side: THREE.DoubleSide }));
    valance.position.set(0, -0.18, depth * 0.5); ag.add(valance);
    for (let i = -1; i <= 1; i++) {
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, depth + 0.1, 6), this.materials.woodDark);
      rod.rotation.x = Math.PI / 2; rod.position.set((width / 3) * i, 0, 0); ag.add(rod);
    }
    return ag;
  }

  addHangingLantern(parent, localX, localY, localZ, armDir = 1) {
    const ironMat = this.materials.metalBlack;
    const glowMat = this.materials.glassGlow;
    const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.7), ironMat);
    bracket.position.set(localX + armDir * 0.35, localY, localZ);
    bracket.rotation.z = -armDir * 0.35; parent.add(bracket);
    const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.32, 8), glowMat);
    lantern.position.set(localX + armDir * 0.62, localY - 0.18, localZ); parent.add(lantern);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.05, 8), ironMat);
    cap.position.set(localX + armDir * 0.62, localY - 0.02, localZ); parent.add(cap);
    const pLight = new THREE.PointLight(0xffda77, 1.4, 7, 1.8);
    pLight.position.set(localX + armDir * 0.62, localY - 0.3, localZ); parent.add(pLight);
  }

  createNPC(x, y, z, rotY, type = 'idle', clothesColor = 0xff7096) {
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = rotY;
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.22, 0.65, 12), new THREE.MeshToonMaterial({ color: clothesColor }));
    torso.position.y = 0.8; torso.castShadow = true; g.add(torso);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), new THREE.MeshToonMaterial({ color: 0xfcc4b6 }));
    head.position.y = 1.25; head.castShadow = true; g.add(head);
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 12), new THREE.MeshToonMaterial({ color: 0x1c1c1e }));
    hair.position.set(0, 1.3, -0.05); hair.scale.set(1.05, 1.0, 1.05); g.add(hair);
    const armMat = new THREE.MeshToonMaterial({ color: 0xfcc4b6 });
    const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.45, 8), armMat);
    armL.position.set(-0.35, 0.75, 0); armL.rotation.z = 0.1; g.add(armL);
    const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.45, 8), armMat);
    armR.position.set(0.35, 0.75, 0); armR.rotation.z = -0.1; g.add(armR);
    const legMat = new THREE.MeshToonMaterial({ color: 0xd4a373 });
    const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.5, 12), legMat); legL.position.set(-0.11, 0.25, 0); g.add(legL);
    const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.5, 12), legMat); legR.position.set(0.11, 0.25, 0); g.add(legR);
    this.scene.add(g);
    this.npcs.push({ group: g, armL, armR, head, type, phase: Math.random() * Math.PI * 2, startZ: z, direction: 1 });
  }
}
