import * as THREE from 'three';

export class Character {
  constructor(scene) {
    this.scene = scene;

    // Core group that contains all body parts
    this.mesh = new THREE.Group();
    this.mesh.position.set(0, 0, 0);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    // Animation properties
    this.walkCycle = 0;
    this.idleCycle = 0;
    this.bobOffset = 0;

    // Materials
    this.initMaterials();
    // Build Model Hierarchy
    this.buildModel();

    this.scene.add(this.mesh);
  }

  initMaterials() {
    this.materials = {
      skin:         new THREE.MeshToonMaterial({ color: 0xfcc4b6 }),
      hair:         new THREE.MeshToonMaterial({ color: 0x3a1f0a }),  // Dark brown messy hair
      shirt:        new THREE.MeshToonMaterial({ color: 0x1a4a8a }),  // Deep ocean blue hoodie
      shirtInner:   new THREE.MeshToonMaterial({ color: 0xdde8f8 }),  // Light blue inner collar
      pants:        new THREE.MeshToonMaterial({ color: 0x2c3a50 }),  // Dark navy jeans
      shoes:        new THREE.MeshToonMaterial({ color: 0x6b3d1e }),  // Warm brown leather boots
      sole:         new THREE.MeshToonMaterial({ color: 0x3d2010 }),  // Dark brown sole
      laces:        new THREE.MeshToonMaterial({ color: 0xc49a6c }),  // Tan laces
      belt:         new THREE.MeshToonMaterial({ color: 0x3a2010 }),  // Dark leather belt
      buckle:       new THREE.MeshToonMaterial({ color: 0xc8a84b }),  // Aged gold buckle
      eyes:         new THREE.MeshToonMaterial({ color: 0xffffff }),
      iris:         new THREE.MeshToonMaterial({ color: 0x5a3010 }),
      pupil:        new THREE.MeshBasicMaterial({ color: 0x0a0a0a }),
      backpack:     new THREE.MeshToonMaterial({ color: 0x7a5230 }),  // Mid-brown leather pack
      backpackDark: new THREE.MeshToonMaterial({ color: 0x4a3020 }),  // Dark brown straps/accents
      backpackGold: new THREE.MeshToonMaterial({ color: 0xc8a84b }),  // Gold clasps
    };
  }

  buildModel() {
    // 1. Root group (allows pivoting and scaling of entire model)
    this.characterGroup = new THREE.Group();
    this.mesh.add(this.characterGroup);

    // 2. Torso (Pivot at center-bottom of chest)
    this.torsoGroup = new THREE.Group();
    this.torsoGroup.position.set(0, 1.25, 0);
    this.characterGroup.add(this.torsoGroup);

    // Shirt (Main body)
    const shirtGeom = new THREE.CylinderGeometry(0.35, 0.32, 0.75, 16);
    const shirt = new THREE.Mesh(shirtGeom, this.materials.shirt);
    shirt.position.set(0, 0, 0);
    shirt.castShadow = true;
    shirt.receiveShadow = true;
    this.torsoGroup.add(shirt);

    // White T-shirt collar showing at top
    const collarGeom = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16);
    const collar = new THREE.Mesh(collarGeom, this.materials.shirtInner);
    collar.position.set(0, 0.38, 0);
    this.torsoGroup.add(collar);

    // Open collar flaps (Realistic blue lapels)
    const lapelGeom = new THREE.BoxGeometry(0.12, 0.18, 0.05);

    const lapelL = new THREE.Mesh(lapelGeom, this.materials.shirt);
    lapelL.position.set(-0.16, 0.3, 0.28);
    lapelL.rotation.set(0.3, 0.45, -0.4);

    const lapelR = new THREE.Mesh(lapelGeom, this.materials.shirt);
    lapelR.position.set(0.16, 0.3, 0.28);
    lapelR.rotation.set(0.3, -0.45, 0.4);

    this.torsoGroup.add(lapelL, lapelR);

    // Shirt Buttons (three small white spheres down the center shirt line)
    const btnGeom = new THREE.SphereGeometry(0.02, 8, 8);
    for (let i = 0; i < 3; i++) {
      const button = new THREE.Mesh(btnGeom, this.materials.shirtInner);
      button.position.set(0, 0.15 - i * 0.18, 0.35);
      button.scale.set(1, 1, 0.5);
      this.torsoGroup.add(button);
    }

    // Leather Belt around waist
    const beltGeom = new THREE.CylinderGeometry(0.33, 0.33, 0.08, 16);
    const belt = new THREE.Mesh(beltGeom, this.materials.belt);
    belt.position.set(0, -0.36, 0);
    this.torsoGroup.add(belt);

    // Gold buckle in front
    const buckleGeom = new THREE.BoxGeometry(0.12, 0.1, 0.06);
    const buckle = new THREE.Mesh(buckleGeom, this.materials.buckle);
    buckle.position.set(0, -0.36, 0.34);
    this.torsoGroup.add(buckle);

    // Hood hanging behind neck
    const hoodGeom = new THREE.SphereGeometry(0.28, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.6);
    const hood = new THREE.Mesh(hoodGeom, this.materials.shirt);
    hood.position.set(0, 0.42, -0.22);
    hood.rotation.x = 0.5;
    hood.castShadow = true;
    this.torsoGroup.add(hood);

    // --- Leather Backpack ---
    const bpGroup = new THREE.Group();
    bpGroup.position.set(0, 0.08, -0.32);
    this.torsoGroup.add(bpGroup);

    // Main body
    const bpBody = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.56, 0.20), this.materials.backpack);
    bpBody.castShadow = true;
    bpGroup.add(bpBody);

    // Front pocket
    const bpPocket = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.22, 0.06), this.materials.backpack);
    bpPocket.position.set(0, -0.12, -0.13);
    bpPocket.castShadow = true;
    bpGroup.add(bpPocket);

    // Pocket zipper seam
    const bpZipper = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.025, 0.04), this.materials.backpackGold);
    bpZipper.position.set(0, 0.0, -0.16);
    bpGroup.add(bpZipper);

    // Top handle
    const bpHandle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.06), this.materials.backpackDark);
    bpHandle.position.set(0, 0.31, -0.04);
    bpGroup.add(bpHandle);

    // Side straps (vertical strips on the body)
    for (const sx of [-0.18, 0.18]) {
      const sideStrap = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.52, 0.04), this.materials.backpackDark);
      sideStrap.position.set(sx, 0, -0.12);
      bpGroup.add(sideStrap);
    }

    // Shoulder straps (wrap to front of torso)
    const strapGeo = new THREE.BoxGeometry(0.055, 0.68, 0.055);
    for (const sx of [-0.20, 0.20]) {
      const strap = new THREE.Mesh(strapGeo, this.materials.backpackDark);
      strap.position.set(sx, 0.04, 0.14);
      strap.rotation.x = 0.08;
      this.torsoGroup.add(strap);
    }

    // Buckle clips on straps
    const clipGeo = new THREE.BoxGeometry(0.08, 0.06, 0.06);
    for (const sx of [-0.20, 0.20]) {
      const clip = new THREE.Mesh(clipGeo, this.materials.backpackGold);
      clip.position.set(sx, -0.12, 0.17);
      this.torsoGroup.add(clip);
    }

    // 3. Head (Pivot at neck joint)
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.48, 0); // Offset relative to torso
    this.torsoGroup.add(this.headGroup);

    // Neck
    const neckGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.15, 12);
    const neck = new THREE.Mesh(neckGeom, this.materials.skin);
    neck.position.set(0, -0.075, 0);
    this.headGroup.add(neck);

    // Face sphere
    const headGeom = new THREE.SphereGeometry(0.32, 32, 32);
    const head = new THREE.Mesh(headGeom, this.materials.skin);
    head.position.set(0, 0.15, 0);
    head.castShadow = true;
    this.headGroup.add(head);

    // Big Cartoon Eyes
    const eyeGeom = new THREE.SphereGeometry(0.09, 16, 16);
    const pupilGeom = new THREE.SphereGeometry(0.045, 16, 16);

    // Left Eye
    this.leftEye = new THREE.Group();
    this.leftEye.position.set(-0.13, 0.2, 0.22);
    const leftSclera = new THREE.Mesh(eyeGeom, this.materials.eyes);
    leftSclera.scale.set(1, 1.25, 0.5);
    const leftIris = new THREE.Mesh(pupilGeom, this.materials.iris);
    leftIris.position.set(0, 0, 0.05);
    leftIris.scale.set(1.15, 1.15, 0.3);
    const leftPupil = new THREE.Mesh(pupilGeom, this.materials.pupil);
    leftPupil.position.set(0, 0, 0.07);
    leftPupil.scale.set(0.6, 0.6, 0.3);
    this.leftEye.add(leftSclera, leftIris, leftPupil);
    this.headGroup.add(this.leftEye);

    // Right Eye
    this.rightEye = new THREE.Group();
    this.rightEye.position.set(0.13, 0.2, 0.22);
    const rightSclera = new THREE.Mesh(eyeGeom, this.materials.eyes);
    rightSclera.scale.set(1, 1.25, 0.5);
    const rightIris = new THREE.Mesh(pupilGeom, this.materials.iris);
    rightIris.position.set(0, 0, 0.05);
    rightIris.scale.set(1.15, 1.15, 0.3);
    const rightPupil = new THREE.Mesh(pupilGeom, this.materials.pupil);
    rightPupil.position.set(0, 0, 0.07);
    rightPupil.scale.set(0.6, 0.6, 0.3);
    this.rightEye.add(rightSclera, rightIris, rightPupil);
    this.headGroup.add(this.rightEye);

    // Eyebrows (Realistic curved boxes matching hair color)
    const browGeom = new THREE.BoxGeometry(0.1, 0.03, 0.03);

    const eyebrowL = new THREE.Mesh(browGeom, this.materials.hair);
    eyebrowL.position.set(-0.13, 0.31, 0.28);
    eyebrowL.rotation.z = 0.08;

    const eyebrowR = new THREE.Mesh(browGeom, this.materials.hair);
    eyebrowR.position.set(0.13, 0.31, 0.28);
    eyebrowR.rotation.z = -0.08;

    this.headGroup.add(eyebrowL, eyebrowR);

    // Smile Line (a 3D thin ring)
    const mouthGeom = new THREE.TorusGeometry(0.07, 0.015, 8, 16, Math.PI);
    const mouth = new THREE.Mesh(mouthGeom, this.materials.pupil);
    mouth.position.set(0, 0.04, 0.28);
    mouth.rotation.x = Math.PI; // Flip downwards to create smile curve
    this.headGroup.add(mouth);

    // Nose
    const noseGeom = new THREE.SphereGeometry(0.04, 12, 12);
    const nose = new THREE.Mesh(noseGeom, this.materials.skin);
    nose.position.set(0, 0.12, 0.3);
    this.headGroup.add(nose);

    // Ears
    const earGeom = new THREE.SphereGeometry(0.065, 12, 12);
    const leftEar = new THREE.Mesh(earGeom, this.materials.skin);
    leftEar.position.set(-0.32, 0.15, 0);
    leftEar.scale.set(0.5, 1, 1);
    const rightEar = new THREE.Mesh(earGeom, this.materials.skin);
    rightEar.position.set(0.32, 0.15, 0);
    rightEar.scale.set(0.5, 1, 1);
    this.headGroup.add(leftEar, rightEar);

    // Curly Hair Group
    this.hairGroup = new THREE.Group();
    this.headGroup.add(this.hairGroup);

    const curlGeom = new THREE.SphereGeometry(0.12, 16, 16);
    const hairConfigs = [
      { pos: [0, 0.38, 0], scale: [3.2, 2.0, 3.0] },
      { pos: [0, 0.42, 0.05], scale: [2.5, 1.8, 2.5] },
      { pos: [-0.2, 0.32, -0.15], scale: [1.3, 1.3, 1.3] },
      { pos: [0.2, 0.32, -0.15], scale: [1.3, 1.3, 1.3] },
      { pos: [0, 0.3, -0.25], scale: [2.0, 1.8, 1.5] },
      { pos: [-0.18, 0.38, 0.15], scale: [1.1, 1.1, 1.2] },
      { pos: [0.18, 0.38, 0.15], scale: [1.1, 1.1, 1.2] },
      { pos: [-0.05, 0.41, 0.18], scale: [1.2, 1.2, 1.3] },
      { pos: [0.1, 0.43, 0.14], scale: [1.1, 1.2, 1.1] },
      { pos: [-0.25, 0.22, 0.08], scale: [1.0, 1.2, 1.0] },
      { pos: [0.25, 0.22, 0.08], scale: [1.0, 1.2, 1.0] }
    ];

    hairConfigs.forEach(cfg => {
      const curl = new THREE.Mesh(curlGeom, this.materials.hair);
      curl.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
      curl.scale.set(cfg.scale[0], cfg.scale[1], cfg.scale[2]);
      curl.castShadow = true;
      this.hairGroup.add(curl);
    });

    // 4. Arms (Pivoted at shoulders)
    // Left Arm Pivot Group
    this.leftArmPivot = new THREE.Group();
    this.leftArmPivot.position.set(-0.48, 0.22, 0);
    this.torsoGroup.add(this.leftArmPivot);

    const sleeveGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.22, 12);
    const leftSleeve = new THREE.Mesh(sleeveGeom, this.materials.shirt);
    leftSleeve.position.set(0, -0.06, 0);
    this.leftArmPivot.add(leftSleeve);

    const armGeom = new THREE.CylinderGeometry(0.08, 0.07, 0.45, 12);
    const leftArm = new THREE.Mesh(armGeom, this.materials.skin);
    leftArm.position.set(0, -0.28, 0);
    leftArm.castShadow = true;
    this.leftArmPivot.add(leftArm);

    const handGeom = new THREE.SphereGeometry(0.08, 12, 12);
    const leftHand = new THREE.Mesh(handGeom, this.materials.skin);
    leftHand.position.set(0, -0.52, 0);
    leftHand.scale.set(1, 1, 0.7);
    this.leftArmPivot.add(leftHand);

    // Right Arm Pivot Group
    this.rightArmPivot = new THREE.Group();
    this.rightArmPivot.position.set(0.48, 0.22, 0);
    this.torsoGroup.add(this.rightArmPivot);

    const rightSleeve = new THREE.Mesh(sleeveGeom, this.materials.shirt);
    rightSleeve.position.set(0, -0.06, 0);
    this.rightArmPivot.add(rightSleeve);

    const rightArm = new THREE.Mesh(armGeom, this.materials.skin);
    rightArm.position.set(0, -0.28, 0);
    rightArm.castShadow = true;
    this.rightArmPivot.add(rightArm);

    const rightHand = new THREE.Mesh(handGeom, this.materials.skin);
    rightHand.position.set(0, -0.52, 0);
    rightHand.scale.set(1, 1, 0.7);
    this.rightArmPivot.add(rightHand);

    // 5. Legs (Pivoted at hips)
    // Left Leg Pivot Group
    this.leftLegPivot = new THREE.Group();
    this.leftLegPivot.position.set(-0.18, -0.3, 0);
    this.torsoGroup.add(this.leftLegPivot);

    const legGeom = new THREE.CylinderGeometry(0.12, 0.1, 0.65, 16);
    const leftLeg = new THREE.Mesh(legGeom, this.materials.pants);
    leftLeg.position.set(0, -0.325, 0);
    leftLeg.castShadow = true;
    leftLeg.receiveShadow = true;
    this.leftLegPivot.add(leftLeg);

    // Upgraded detailed shoe (sneakers + sole + laces)
    const leftShoe = this.createDetailedShoe(true);
    leftShoe.position.set(0, -0.68, 0.04);
    this.leftLegPivot.add(leftShoe);

    // Right Leg Pivot Group
    this.rightLegPivot = new THREE.Group();
    this.rightLegPivot.position.set(0.18, -0.3, 0);
    this.torsoGroup.add(this.rightLegPivot);

    const rightLeg = new THREE.Mesh(legGeom, this.materials.pants);
    rightLeg.position.set(0, -0.325, 0);
    rightLeg.castShadow = true;
    rightLeg.receiveShadow = true;
    this.rightLegPivot.add(rightLeg);

    // Shoe Right
    const rightShoe = this.createDetailedShoe(false);
    rightShoe.position.set(0, -0.68, 0.04);
    this.rightLegPivot.add(rightShoe);

    this.characterGroup.scale.set(0.9, 0.9, 0.9);
  }

  createDetailedShoe(isLeft) {
    const shoeGroup = new THREE.Group();

    // 1. Shoe Main Body
    const mainGeo = new THREE.BoxGeometry(0.16, 0.12, 0.28);
    const shoeBody = new THREE.Mesh(mainGeo, this.materials.shoes);
    shoeBody.position.y = 0.02;
    shoeBody.castShadow = true;
    shoeGroup.add(shoeBody);

    // 2. Thick Rubber Sole
    const soleGeo = new THREE.BoxGeometry(0.18, 0.04, 0.3);
    const sole = new THREE.Mesh(soleGeo, this.materials.sole);
    sole.position.y = -0.05;
    sole.castShadow = true;
    shoeGroup.add(sole);

    // 3. Front Toe Cap
    const toeGeo = new THREE.SphereGeometry(0.08, 12, 12);
    const toeCap = new THREE.Mesh(toeGeo, this.materials.sole);
    toeCap.scale.set(1.0, 0.7, 0.9);
    toeCap.position.set(0, -0.02, 0.12);
    shoeGroup.add(toeCap);

    // 4. Laces (Two intersecting thin bars)
    const laceGeo = new THREE.BoxGeometry(0.09, 0.015, 0.025);
    const lace1 = new THREE.Mesh(laceGeo, this.materials.laces);
    lace1.position.set(0, 0.07, 0.02);
    lace1.rotation.y = 0.25;

    const lace2 = new THREE.Mesh(laceGeo, this.materials.laces);
    lace2.position.set(0, 0.07, -0.02);
    lace2.rotation.y = -0.25;

    shoeGroup.add(lace1, lace2);

    return shoeGroup;
  }

  update(deltaTime, isWalking, speed) {
    if (isWalking) {
      const speedFactor = Math.abs(speed);
      this.walkCycle += deltaTime * 12 * (speedFactor > 0 ? speedFactor : 1.0);

      const wave = Math.sin(this.walkCycle);
      const waveDouble = Math.sin(this.walkCycle * 2);

      // Legs swing in opposition
      this.leftLegPivot.rotation.x = wave * 0.45;
      this.rightLegPivot.rotation.x = -wave * 0.45;

      // Arms swing in opposition to legs
      this.leftArmPivot.rotation.x = -wave * 0.4;
      this.rightArmPivot.rotation.x = wave * 0.4;
      this.leftArmPivot.rotation.z = -Math.abs(wave) * 0.1;
      this.rightArmPivot.rotation.z = Math.abs(wave) * 0.1;

      // Body bobs up and down on each step
      this.bobOffset = Math.abs(waveDouble) * 0.08;
      this.torsoGroup.position.y = 1.25 - this.bobOffset;

      // Head bounces and sways
      this.headGroup.rotation.z = wave * 0.05;
      this.headGroup.rotation.x = Math.abs(waveDouble) * 0.03;

      // Secondary hair motion
      this.hairGroup.rotation.z = wave * 0.02;
    } else {
      this.idleCycle += deltaTime * 1.5;
      const breathe = Math.sin(this.idleCycle);

      // Return limbs to neutral smoothly
      this.leftLegPivot.rotation.x = THREE.MathUtils.lerp(this.leftLegPivot.rotation.x, 0, 0.15);
      this.rightLegPivot.rotation.x = THREE.MathUtils.lerp(this.rightLegPivot.rotation.x, 0, 0.15);

      // Arms breathing
      this.leftArmPivot.rotation.x = THREE.MathUtils.lerp(this.leftArmPivot.rotation.x, 0, 0.15);
      this.rightArmPivot.rotation.x = THREE.MathUtils.lerp(this.rightArmPivot.rotation.x, 0, 0.15);
      this.leftArmPivot.rotation.z = THREE.MathUtils.lerp(this.leftArmPivot.rotation.z, -0.08 - breathe * 0.02, 0.1);
      this.rightArmPivot.rotation.z = THREE.MathUtils.lerp(this.rightArmPivot.rotation.z, 0.08 + breathe * 0.02, 0.1);

      // Breathing bobbing
      this.torsoGroup.position.y = THREE.MathUtils.lerp(this.torsoGroup.position.y, 1.25 + breathe * 0.02, 0.15);
      this.headGroup.rotation.x = THREE.MathUtils.lerp(this.headGroup.rotation.x, breathe * 0.02, 0.1);
      this.headGroup.rotation.z = THREE.MathUtils.lerp(this.headGroup.rotation.z, Math.sin(this.idleCycle * 0.5) * 0.03, 0.05);
      this.hairGroup.rotation.z = THREE.MathUtils.lerp(this.hairGroup.rotation.z, 0, 0.1);
    }
  }
}
