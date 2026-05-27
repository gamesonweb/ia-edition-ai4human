import './tronScene.css';

import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { GlowLayer } from '@babylonjs/core/Layers/glowLayer';
import { DefaultRenderingPipeline } from '@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { Vector3, Quaternion } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { PointLight } from '@babylonjs/core/Lights/pointLight';
import { SpotLight } from '@babylonjs/core/Lights/spotLight';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { ParticleSystem } from '@babylonjs/core/Particles/particleSystem';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import '@babylonjs/loaders/glTF';

import { setupPauseButton } from '../../UI/pauseButton.js';
import { createAIAssistant } from '../../extraGame/aiAssistant.js';
import EMBEDDED_PATH from './idealPath.js';

import {
  TARGET_FPS, GRAVITY, MAP_BASE_PATH, MAP_PARTS,
  MOTO, CAM, RACE, AI_PROFILES, AI_ROUTE, AI_SCALE, AI_VISUAL_OFFSET,
} from './config.js';
import { GAME_CONFIG } from '../../config/gameConfig.js';
import { createCyberSky, addNeonAtmosphericLights, createWireframeMaterial } from './environment.js';
import { setupTronHUD } from './hud.js';
import { showCutscene } from './cutscene.js';
import { saveIdealPath, loadIdealPath, findNearestForward, getLookaheadPoint } from './pathUtils.js';
import { fmtMs, showRaceToast, showCoordsToast } from './utils.js';

/**
 * Démarre la scène Tron : ville cybernétique + pilotage moto.
 * @returns {Promise<function>} Callback exécuté après fermeture de l'écran de chargement
 */
export async function startTronScene() {
  const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('renderCanvas'));
  if (!canvas) throw new Error('Élément renderCanvas introuvable');

  // 1. Moteur & Scène isolés
  const engine = new Engine(canvas, true, {
    preserveDrawingBuffer: false,
    stencil: true,
    powerPreference: 'high-performance',
    adaptToDeviceRatio: true,
  });
  engine.setHardwareScalingLevel(1.5);

  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.01, 0.01, 0.03, 1);
  scene.collisionsEnabled = true;

  // 2. Brouillard cybernétique
  scene.fogMode = Scene.FOGMODE_EXP2;
  scene.fogColor = new Color3(0.01, 0.02, 0.08);
  scene.fogDensity = 0.015;

  // 3. Post-processing colorimétrique
  scene.imageProcessingConfiguration.exposure = 1.25;
  scene.imageProcessingConfiguration.contrast = 1.05;
  scene.imageProcessingConfiguration.vignetteEnabled = true;
  scene.imageProcessingConfiguration.vignetteWeight = 1.2;

  // 4. Caméra third-person — pilotée manuellement chaque frame
  const camera = new FreeCamera(
    'tronCam',
    new Vector3(MOTO.SPAWN.x, MOTO.SPAWN.y + CAM.HEIGHT, MOTO.SPAWN.z - CAM.DIST),
    scene,
  );
  camera.minZ = 0.1;
  camera.maxZ = 1500;

  // 5. Lumière d'ambiance — ville sombre (le phare illumine la route)
  const hemi = new HemisphericLight('tronHemi', new Vector3(0, 1, 0), scene);
  hemi.intensity = 0.35;
  hemi.diffuse = new Color3(0.25, 0.3, 0.45);
  hemi.groundColor = new Color3(0.05, 0.05, 0.1);
  hemi.specular = new Color3(0, 0, 0);

  // 6. Glow Layer (wireframes néon + halo phare) — kernel réduit pour la perf
  const glow = new GlowLayer('tronGlow', scene, {
    mainTextureRatio: 0.5,
    blurKernelSize: 4,
  });
  glow.intensity = 1.0;

  // 7. Ciel cybernétique
  createCyberSky(scene);

  // 8. Chargement parallèle de la ville
  const results = await Promise.all(
    MAP_PARTS.map(file => SceneLoader.ImportMeshAsync(null, MAP_BASE_PATH, file, scene))
  );

  /** @type {{ mesh: import('@babylonjs/core').Mesh, center: import('@babylonjs/core').Vector3 }[]} */
  const wireframeMeshes = [];
  /** @type {import('@babylonjs/core').AbstractMesh[]} */
  const collisionMeshes = [];

  const wireMatCyan    = createWireframeMaterial(scene, 'cyan', false);
  const wireMatMagenta = createWireframeMaterial(scene, 'magenta', true);

  const WIRE_MIN_EXTENT      = 4.0;
  const COLLISION_MIN_EXTENT = 2.0;

  for (const { meshes } of results) {
    const root = meshes.find(m => m.name === '__root__') ?? meshes[0];
    if (root) {
      root.rotation.y = Math.PI;
      root.computeWorldMatrix(true);
    }
    for (const mesh of meshes) {
      if (!mesh.subMeshes?.length) continue;
      mesh.isPickable = false;
      mesh.computeWorldMatrix(true);

      const bbox   = mesh.getBoundingInfo().boundingBox;
      const ext    = bbox.extendSizeWorld;
      const maxExt = Math.max(ext.x, ext.y, ext.z) * 2;
      const isGround = bbox.maximumWorld.y < 2.5;

      if (maxExt >= COLLISION_MIN_EXTENT || isGround) {
        mesh.checkCollisions = true;
        collisionMeshes.push(mesh);
      } else {
        mesh.checkCollisions = false;
      }

      if (mesh.material) {
        mesh.material.maxSimultaneousLights = 8;
        if (mesh.material.getClassName() === 'PBRMaterial') {
          const ec = mesh.material.emissiveColor;
          if (ec && (ec.r > 0 || ec.g > 0 || ec.b > 0)) {
            mesh.material.emissiveIntensity = 2.0;
          }
        }
      }

      if (!isGround && maxExt >= WIRE_MIN_EXTENT) {
        const wf = mesh.clone(`${mesh.name}_wf`);
        wf.checkCollisions = false;
        wf.isPickable      = false;
        wf.receiveShadows  = false;
        wf.material        = (Math.random() > 0.85) ? wireMatMagenta : wireMatCyan;
        wf.setEnabled(false);
        wireframeMeshes.push({ mesh: wf, center: bbox.centerWorld.clone() });
      }

      mesh.freezeWorldMatrix();
      if (mesh.material) mesh.material.freeze();
    }
  }

  // 9. Octree de collision
  scene.createOrUpdateSelectionOctree(32);

  addNeonAtmosphericLights(scene);

  // 10. Chargement de la moto
  const motoResult = await SceneLoader.ImportMeshAsync(null, '/extragame/', 'motorbike.glb', scene);
  const moto = motoResult.meshes[0];
  moto.name = 'moto';
  moto.rotationQuaternion = null;
  moto.position = MOTO.SPAWN.clone();
  moto.scaling.setAll(MOTO.SCALE);
  moto.isPickable = false;
  moto.checkCollisions = true;
  moto.ellipsoid = MOTO.ELLIPSOID.clone();
  moto.ellipsoidOffset = MOTO.ELLIPSOID_OFF.clone();
  motoResult.animationGroups.forEach(ag => ag.stop());
  const actionAnim = motoResult.animationGroups.find(ag => ag.name === 'Action');
  actionAnim?.start(true, 1.0);

  const BRAKE_OFF     = new Color3(0, 0, 0);
  const BRAKE_ON      = new Color3(2.5, 0, 0);
  const REVERSE_ON    = new Color3(2.0, 2.0, 2.0);
  const brakeLightMat = new StandardMaterial('tron-brake-mat', scene);
  brakeLightMat.diffuseColor    = new Color3(0.05, 0, 0);
  brakeLightMat.specularColor   = new Color3(0, 0, 0);
  brakeLightMat.emissiveColor   = BRAKE_OFF.clone();
  brakeLightMat.disableLighting = true;

  console.log('[tronScene] ALL moto mesh names:', motoResult.meshes.map(m => m.name));
  console.log('[tronScene] ALL moto node names:', motoResult.transformNodes?.map(n => n.name));

  const EXPLICIT_BRAKE_NAMES = new Set([
    'Bike_Seat_Section.002_Lights_0',
    'Cube',
  ]);
  const matchesBrakeNode = (name) => {
    const n = (name || '').toLowerCase();
    return (n.includes('rearlight') || n.includes('backlight')) && !n.includes('front');
  };

  /** @type {import('@babylonjs/core').AbstractMesh[]} */
  const brakeLightMeshes = [];
  for (const mesh of motoResult.meshes) {
    let hit = EXPLICIT_BRAKE_NAMES.has(mesh.name);
    if (!hit) {
      let node = mesh.parent;
      while (node) {
        if (matchesBrakeNode(node.name)) { hit = true; break; }
        node = node.parent;
      }
    }
    if (hit) {
      mesh.material = brakeLightMat;
      brakeLightMeshes.push(mesh);
    }
  }
  console.log('[tronScene] brake light meshes:', brakeLightMeshes.map(m => m.name));

  // 11. Meshes de direction (roue avant) + tête
  const frontWheelMeshes = [
    'Tyre Front_Rubber_0',
    'Tyre Front_Rubber_0.001',
    'Tyre Rim Front_Metal 2_0',
  ].map(name => motoResult.meshes.find(m => m.name === name)).filter(Boolean);

  const frontWheelData = frontWheelMeshes.map(mesh => {
    if (!mesh.rotationQuaternion) mesh.rotationQuaternion = Quaternion.Identity();
    return { mesh, initQuat: mesh.rotationQuaternion.clone() };
  });

  const frontCoverMeshes = [
    'Front Wheel Cover_Metal 2_0',
  ].map(name => motoResult.meshes.find(m => m.name === name)).filter(Boolean);

  const frontCoverData = frontCoverMeshes.map(mesh => {
    if (!mesh.rotationQuaternion) mesh.rotationQuaternion = Quaternion.Identity();
    return { mesh, initQuat: mesh.rotationQuaternion.clone() };
  });

  const rearWheelData = [
    'Tyre Back_Rubber_0',
    'Tyre Rim Back_Metal 2_0',
  ].map(name => motoResult.meshes.find(m => m.name === name)).filter(Boolean)
   .map(mesh => {
     if (!mesh.rotationQuaternion) mesh.rotationQuaternion = Quaternion.Identity();
     return { mesh, initQuat: mesh.rotationQuaternion.clone() };
   });

  const headNode = motoResult.transformNodes?.find(t =>
    t.name === 'mixamorig:Head_1' || t.name === 'mixamorig:Head'
  );
  const headUsesQuat  = headNode != null && headNode.rotationQuaternion != null;
  const headInitQuat  = headUsesQuat ? headNode.rotationQuaternion.clone() : null;
  const headInitRot   = (!headUsesQuat && headNode) ? headNode.rotation.clone() : null;

  // 12. Feu de croisement
  const frontLightMesh  = motoResult.meshes.find(m => m.name === 'Frontlight_001_lights_0') ?? moto;
  const HEADLIGHT_Y_OFFSET = 1.6;

  const frontLightMat = new StandardMaterial('tron-front-light-mat', scene);
  frontLightMat.emissiveColor = new Color3(1, 0.95, 0.75);
  frontLightMesh.material = frontLightMat;

  moto.computeWorldMatrix(true);
  frontLightMesh.computeWorldMatrix(true);
  const initLightPos = frontLightMesh.getAbsolutePosition().clone();
  initLightPos.y += HEADLIGHT_Y_OFFSET;
  const headlight = new SpotLight(
    'tron-headlight',
    initLightPos,
    new Vector3(0, -0.22, 1).normalize(),
    0.95,
    6,
    scene,
  );
  headlight.diffuse   = new Color3(1, 0.95, 0.78);
  headlight.specular  = new Color3(1, 0.95, 0.78);
  headlight.intensity = 4500;
  headlight.range     = 140;

  // 13. Plaque arrière
  const plateMeshes  = motoResult.meshes.filter(m => m.name.startsWith('Cube.001'));
  const plateTexture = new Texture('/extragame/number-plate.jpg', scene);
  const plateMat     = new StandardMaterial('tron-plate-mat', scene);
  plateMat.diffuseTexture = plateTexture;
  plateMat.emissiveColor  = new Color3(0, 0, 0);
  plateMat.specularColor  = new Color3(0, 0, 0);
  plateMat.maxSimultaneousLights = 8;
  plateMeshes.forEach(m => { m.material = plateMat; });

  const plateLight = new PointLight('tron-plate-light', new Vector3(0, 0, 0), scene);
  plateLight.diffuse   = new Color3(1.0, 0.95, 0.85);
  plateLight.specular  = new Color3(0, 0, 0);
  plateLight.intensity = 6;
  plateLight.range     = 2.5;
  if (plateMeshes.length > 0) plateLight.includedOnlyMeshes = plateMeshes;

  // 14. Bloom
  const pipeline = new DefaultRenderingPipeline('tron-pipe', true, scene, [camera]);
  pipeline.bloomEnabled   = true;
  pipeline.bloomThreshold = 0.2;
  pipeline.bloomWeight    = 0.8;
  pipeline.bloomKernel    = 16;
  pipeline.bloomScale     = 0.35;

  // 14b. Traînée cyan
  const TRAIL_SPEED_MIN = 1.2;
  const TRAIL_SPEED_MAX = MOTO.SPEED_MAX;
  const TRAIL_MAX_RATE  = 600;

  const trailTex  = new DynamicTexture('tron-trail-tex', { width: 64, height: 64 }, scene, false);
  const trailCtx  = trailTex.getContext();
  const trailGrad = trailCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
  trailGrad.addColorStop(0,   'rgba(255, 255, 255, 1)');
  trailGrad.addColorStop(0.3, 'rgba(0, 240, 255, 0.8)');
  trailGrad.addColorStop(1,   'rgba(0, 200, 255, 0)');
  trailCtx.fillStyle = trailGrad;
  trailCtx.fillRect(0, 0, 64, 64);
  trailTex.update();
  trailTex.hasAlpha = true;

  const trailEmitter = new TransformNode('tron-trail-emitter', scene);
  const trail = new ParticleSystem('tron-trail', 1500, scene);
  trail.particleTexture = trailTex;
  trail.emitter         = trailEmitter;
  trail.minEmitBox      = new Vector3(-0.5, 0, 0);
  trail.maxEmitBox      = new Vector3( 0.5, 0, 0);
  trail.color1          = new Color4(0.0, 1.0, 1.0, 0.9);
  trail.color2          = new Color4(0.3, 0.6, 1.0, 0.6);
  trail.colorDead       = new Color4(0.0, 0.1, 0.3, 0);
  trail.minSize         = 0.8;
  trail.maxSize         = 1.8;
  trail.minLifeTime     = 0.35;
  trail.maxLifeTime     = 0.75;
  trail.blendMode       = ParticleSystem.BLENDMODE_ADD;
  trail.gravity         = new Vector3(0, 0, 0);
  trail.direction1      = new Vector3(0, 0.1, 0);
  trail.direction2      = new Vector3(0, 0.3, 0);
  trail.minEmitPower    = 0.1;
  trail.maxEmitPower    = 0.4;
  trail.updateSpeed     = 0.012;
  trail.emitRate        = 0;
  trail.start();

  // 14d. Chargement des scooters IA
  const aiMeshResults = await Promise.all(
    AI_PROFILES.map(() => SceneLoader.ImportMeshAsync(null, '/extragame/', 'pnjscooter_1.glb', scene))
  );

  // 14c. Circuit : portiques + état course
  const checkpointMatActive = new StandardMaterial('cp-active', scene);
  checkpointMatActive.disableLighting = true;
  checkpointMatActive.emissiveColor   = new Color3(1.4, 0.0, 1.4);
  const checkpointMatIdle   = new StandardMaterial('cp-idle', scene);
  checkpointMatIdle.disableLighting   = true;
  checkpointMatIdle.emissiveColor     = new Color3(0.0, 0.55, 0.7);
  const checkpointMatPassed = new StandardMaterial('cp-passed', scene);
  checkpointMatPassed.disableLighting = true;
  checkpointMatPassed.emissiveColor   = new Color3(0.02, 0.1, 0.15);

  const checkpointMeshes = RACE.CHECKPOINTS.map((pos, i) => {
    const ring = MeshBuilder.CreateTorus(`tron-cp-${i}`, {
      diameter:     16,
      thickness:    0.6,
      tessellation: 36,
    }, scene);
    ring.position        = new Vector3(pos.x, pos.y + 5, pos.z);
    ring.isPickable      = false;
    ring.checkCollisions = false;
    ring.material        = checkpointMatIdle;
    return ring;
  });

  let raceStarted  = false;
  let raceFinished = false;
  let currentLap   = 1;
  const visitedCps = new Set();
  const TOTAL_INTER = RACE.CHECKPOINTS.length - 1;
  let raceStartTime = 0;
  let lapStartTime  = 0;
  let bestLapMs     = null;

  const refreshCheckpointVisuals = () => {
    const allDone = visitedCps.size === TOTAL_INTER;
    for (let i = 0; i < checkpointMeshes.length; i++) {
      if (raceFinished) {
        checkpointMeshes[i].material = checkpointMatPassed;
      } else if (i === 0) {
        checkpointMeshes[i].material = allDone ? checkpointMatActive : checkpointMatIdle;
      } else if (visitedCps.has(i)) {
        checkpointMeshes[i].material = checkpointMatPassed;
      } else {
        checkpointMeshes[i].material = checkpointMatIdle;
      }
    }
  };
  refreshCheckpointVisuals();

  // ─── Tracé idéal enregistré ────────────────────────────────────────────────
  const _lsPath   = loadIdealPath();
  let savedPath   = _lsPath ?? EMBEDDED_PATH;
  let isRecording = false;
  let recordedPath = [];
  let recordTick   = 0;
  const RECORD_EVERY = 8;

  if (_lsPath) showRaceToast(`TRACÉ CUSTOM CHARGÉ — ${_lsPath.length} pts`, 2500);

  // ─── Pilotes IA ────────────────────────────────────────────────────────────
  const aiRacers = AI_PROFILES.map((profile, idx) => {
    const res   = aiMeshResults[idx];
    const root  = res.meshes[0];
    const spawn = new Vector3(
      MOTO.SPAWN.x + profile.spawnOffset.x,
      MOTO.SPAWN.y,
      MOTO.SPAWN.z + profile.spawnOffset.z,
    );

    const firstTarget = RACE.CHECKPOINTS[AI_ROUTE[0]];
    const initYaw     = Math.atan2(firstTarget.x - spawn.x, firstTarget.z - spawn.z);

    root.rotationQuaternion = null;
    root.position           = spawn.clone();
    root.rotation.y         = initYaw + AI_VISUAL_OFFSET;
    root.scaling.setAll(AI_SCALE);
    root.isPickable         = false;
    root.checkCollisions    = true;
    root.ellipsoid          = MOTO.ELLIPSOID.clone();
    root.ellipsoidOffset    = MOTO.ELLIPSOID_OFF.clone();

    res.animationGroups.forEach(ag => ag.stop());
    res.animationGroups[0]?.start(true, 1.0);

    return {
      profile, root, res,
      yaw: initYaw, speed: 0,
      pathIndex: 0, nearLapEnd: false,
      waypointIdx: 0,
      lap: 1, finished: false,
    };
  });

  // 15. État moto
  let motoYaw      = 0;
  let slowMoFactor  = 1.0;
  let aiFreezedUntil = 0;
  let turboUntil    = 0;
  let motoSpeed  = 0;
  let steerAngle = 0;
  let rollAngle  = 0;
  const _steerQuat = new Quaternion();
  const _rollQuat  = new Quaternion();
  const _tempQuat  = new Quaternion();
  const _upVec   = new Vector3(0, 1, 0);
  const _fwdVec  = new Vector3(0, 0, 1);
  const _rollAxis = new Vector3(1, 0, 0);

  // 16. Inputs
  const inputMap = {};
  let aiOpen          = false;
  let aiHandle        = null;
  let aiCooldownUntil = 0;

  function applyCheat(code) {
    const t = performance.now();
    switch (code) {
      case '1':
        aiFreezedUntil = t + 5000;
        break;
      case '2':
        MOTO.SPEED_MAX = 2.0;
        turboUntil = t + 10000;
        motoSpeed = Math.min(motoSpeed, MOTO.SPEED_MAX);
        break;
      case '3':
        motoSpeed = MOTO.SPEED_MAX;
        break;
      case '4':
        slowMoFactor = 0.4;
        setTimeout(() => { slowMoFactor = 1.0; }, 6000);
        break;
      case '5':
        if (raceStarted && !raceFinished) raceStartTime = performance.now();
        break;
      case '6':
        if (raceStarted && !raceFinished && currentLap < RACE.LAPS) {
          currentLap++;
          visitedCps.clear();
          lapStartTime = performance.now();
          refreshCheckpointVisuals();
        }
        break;
    }
  }

  function openAI() {
    if (aiOpen) return;
    if (performance.now() < aiCooldownUntil) return;
    aiOpen = true;
    try {
      aiHandle = createAIAssistant({
        onClose: () => {
          aiOpen          = false;
          aiHandle        = null;
          aiCooldownUntil = performance.now() + 20000;
          updateAIBadge();
        },
        onCheat: applyCheat,
      });
    } catch (err) {
      console.error('[MOTO-AI]', err);
      aiOpen = false;
    }
  }
  function closeAI() {
    if (!aiOpen || !aiHandle) return;
    aiHandle.close();
    aiOpen          = false;
    aiHandle        = null;
    aiCooldownUntil = performance.now() + 20000;
    updateAIBadge();
  }

  const onKeyDown = e => {
    if (e.code === 'KeyK') { e.preventDefault(); aiOpen ? closeAI() : openAI(); return; }
    if (e.key === 'Escape' && aiOpen) { closeAI(); return; }
    inputMap[e.key.toLowerCase()] = true;
    if (e.key.toLowerCase() === 'r') {
      if (!isRecording) {
        isRecording  = true;
        recordedPath = [];
        recordTick   = 0;
        hud.setRecording(true);
        showRaceToast('⏺ ENREGISTREMENT DU TRACÉ...', 999999);
      } else {
        isRecording = false;
        hud.setRecording(false);
        if (recordedPath.length > 20) {
          savedPath = recordedPath.slice();
          saveIdealPath(savedPath);
          for (const ai of aiRacers) { ai.pathIndex = 0; ai.nearLapEnd = false; ai.lap = 1; ai.speed = 0; }

          const blob = new Blob([JSON.stringify(savedPath)], { type: 'text/plain' });
          const url  = URL.createObjectURL(blob);
          const a    = document.createElement('a');
          a.href     = url;
          a.download = 'tron_idealpath.txt';
          a.click();
          URL.revokeObjectURL(url);

          showRaceToast(`✓ TRACÉ SAUVEGARDÉ — ${savedPath.length} pts`, 3500);
        } else {
          showRaceToast('TRACÉ TROP COURT — annulé', 2500);
        }
      }
    }
    if (e.key.toLowerCase() === 't') {
      moto.position.copyFrom(MOTO.SPAWN);
      motoSpeed = 0;
      showRaceToast('TÉLÉPORTATION — SPAWN', 1500);
    }
    if (e.key.toLowerCase() === 'p') {
      const p   = moto.position;
      const msg = `X: ${p.x.toFixed(2)}  Y: ${p.y.toFixed(2)}  Z: ${p.z.toFixed(2)}`;
      console.log('[tronScene] position moto —', msg);
      showCoordsToast(msg);
    }
  };
  const onKeyUp = e => { inputMap[e.key.toLowerCase()] = false; };
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  // 17. HUD
  const hud = setupTronHUD();
  hud.setLayout(GAME_CONFIG.KEYBOARD.LAYOUT);

  // Mise à jour live quand l'utilisateur change le layout dans les réglages
  document.addEventListener('click', function onLayoutClick(e) {
    const btn = e.target.closest('#s-keyboard .toggle-btn');
    if (btn) hud.setLayout(btn.dataset.value);
  });

  // ── Badge IA-CHEAT ────────────────────────────────────────────────────────
  const aiBadge = document.createElement('div');
  aiBadge.id = 'tron-ai-badge';
  document.body.appendChild(aiBadge);

  let aiBadgeInterval = null;

  function updateAIBadge() {
    const remaining = aiCooldownUntil - performance.now();
    if (remaining > 0) {
      const secs = Math.ceil(remaining / 1000);
      aiBadge.className = 'tron-ai-badge-cooldown';
      aiBadge.innerHTML = `<span class="tab-badge-icon">⌛</span> IA-CHEAT — ${secs}s`;
      if (!aiBadgeInterval) {
        aiBadgeInterval = setInterval(() => {
          if (performance.now() >= aiCooldownUntil) {
            clearInterval(aiBadgeInterval);
            aiBadgeInterval = null;
            updateAIBadge();
          } else {
            const s = Math.ceil((aiCooldownUntil - performance.now()) / 1000);
            aiBadge.innerHTML = `<span class="tab-badge-icon">⌛</span> IA-CHEAT — ${s}s`;
          }
        }, 250);
      }
    } else {
      aiBadge.className = 'tron-ai-badge-ready';
      aiBadge.innerHTML = `<span class="tab-badge-icon">⚡</span> <kbd>K</kbd> IA-CHEAT`;
    }
  }
  updateAIBadge();

  // 18. Cible caméra (lerp séparé)
  const camTargetPos = new Vector3(
    MOTO.SPAWN.x,
    MOTO.SPAWN.y + CAM.LOOK_HEIGHT,
    MOTO.SPAWN.z + CAM.LOOK_AHEAD,
  );

  // 19. Boucle de pilotage
  let hudTick  = 0;
  let cullTick = 0;
  scene.onBeforeRenderObservable.add(() => {
    if (scene.metadata?.paused || aiOpen) return;
    const dt       = scene.getEngine().getDeltaTime() / 1000;
    const fpsRatio = TARGET_FPS * dt * slowMoFactor;

    const now = performance.now();
    if (turboUntil && now > turboUntil) {
      MOTO.SPEED_MAX = 1.6;
      turboUntil = 0;
    }

    const kb  = GAME_CONFIG.KEYBOARD.CONTROLS[GAME_CONFIG.KEYBOARD.LAYOUT] ?? GAME_CONFIG.KEYBOARD.CONTROLS.AZERTY;
    const fwd = inputMap[kb.FORWARD]  || inputMap['arrowup'];
    const bwd = inputMap[kb.BACKWARD] || inputMap['arrowdown'];
    const lft = inputMap[kb.LEFT]     || inputMap['arrowleft'];
    const rgt = inputMap[kb.RIGHT]    || inputMap['arrowright'];

    const inputsLocked = !raceStarted || raceFinished;

    if (fwd && !inputsLocked) {
      motoSpeed = Math.min(motoSpeed + MOTO.ACCEL * fpsRatio, MOTO.SPEED_MAX);
    } else if (bwd && !inputsLocked) {
      motoSpeed = Math.max(motoSpeed - MOTO.ACCEL * 1.5 * fpsRatio, -MOTO.SPEED_MAX_BWD);
    } else {
      motoSpeed *= Math.pow(MOTO.FRICTION, fpsRatio);
      if (Math.abs(motoSpeed) < 0.001) motoSpeed = 0;
    }

    if (motoSpeed !== 0) {
      const turnDir = motoSpeed > 0 ? 1 : -1;
      if (lft) motoYaw -= MOTO.TURN_SPEED * fpsRatio * turnDir;
      if (rgt) motoYaw += MOTO.TURN_SPEED * fpsRatio * turnDir;
    }

    if (bwd && motoSpeed > 0.05) {
      brakeLightMat.emissiveColor.copyFrom(BRAKE_ON);
    } else if (motoSpeed < -0.01) {
      brakeLightMat.emissiveColor.copyFrom(REVERSE_ON);
    } else {
      brakeLightMat.emissiveColor.copyFrom(BRAKE_OFF);
    }

    moto.rotation.y = motoYaw + MOTO.VISUAL_OFFSET;

    const fwdX = Math.sin(motoYaw);
    const fwdZ = Math.cos(motoYaw);
    moto.moveWithCollisions(new Vector3(-fwdX * motoSpeed * fpsRatio, 0, -fwdZ * motoSpeed * fpsRatio));
    moto.moveWithCollisions(new Vector3(0, -GRAVITY * fpsRatio, 0));
    if (moto.position.y < MOTO.MIN_HEIGHT) moto.position.y = MOTO.MIN_HEIGHT;

    // ── Enregistrement du tracé ──
    if (isRecording) {
      recordTick++;
      if (recordTick % RECORD_EVERY === 0) {
        recordedPath.push({
          x: moto.position.x, y: moto.position.y, z: moto.position.z,
          yaw: motoYaw, speed: Math.abs(motoSpeed),
        });
      }
    }

    moto.computeWorldMatrix(true);
    frontLightMesh.computeWorldMatrix(true);
    const lpos = frontLightMesh.getAbsolutePosition();
    headlight.position.set(lpos.x, lpos.y + HEADLIGHT_Y_OFFSET, lpos.z);
    headlight.direction.set(-Math.sin(motoYaw), -0.22, -Math.cos(motoYaw)).normalize();

    trailEmitter.position.x = moto.position.x + Math.sin(motoYaw) * 2.2;
    trailEmitter.position.y = moto.position.y - 0.7;
    trailEmitter.position.z = moto.position.z + Math.cos(motoYaw) * 2.2;
    trailEmitter.rotation.y = motoYaw;

    plateLight.position.x = moto.position.x + Math.sin(motoYaw) * 1.5;
    plateLight.position.y = moto.position.y + 0.6;
    plateLight.position.z = moto.position.z + Math.cos(motoYaw) * 1.5;

    const speedAbs = Math.abs(motoSpeed);
    const t = Math.max(0, Math.min(1, (speedAbs - TRAIL_SPEED_MIN) / (TRAIL_SPEED_MAX - TRAIL_SPEED_MIN)));
    trail.emitRate = t * TRAIL_MAX_RATE;

    const desiredCamX = moto.position.x + fwdX * CAM.DIST;
    const desiredCamY = moto.position.y + CAM.HEIGHT;
    const desiredCamZ = moto.position.z + fwdZ * CAM.DIST;

    camera.position.x += (desiredCamX - camera.position.x) * CAM.LERP_POS * fpsRatio;
    camera.position.y += (desiredCamY - camera.position.y) * CAM.LERP_POS * fpsRatio;
    camera.position.z += (desiredCamZ - camera.position.z) * CAM.LERP_POS * fpsRatio;

    const desiredTargetX = moto.position.x - fwdX * CAM.LOOK_AHEAD;
    const desiredTargetY = moto.position.y + CAM.LOOK_HEIGHT;
    const desiredTargetZ = moto.position.z - fwdZ * CAM.LOOK_AHEAD;

    camTargetPos.x += (desiredTargetX - camTargetPos.x) * CAM.LERP_TARGET * fpsRatio;
    camTargetPos.y += (desiredTargetY - camTargetPos.y) * CAM.LERP_TARGET * fpsRatio;
    camTargetPos.z += (desiredTargetZ - camTargetPos.z) * CAM.LERP_TARGET * fpsRatio;

    camera.setTarget(camTargetPos);

    if (headNode) {
      if (headUsesQuat && headInitQuat) {
        Quaternion.RotationAxisToRef(_fwdVec, -steerAngle * 1.55, _steerQuat);
        headNode.rotationQuaternion = headInitQuat.multiply(_steerQuat);
      } else if (headInitRot) {
        headNode.rotation = new Vector3(headInitRot.x, headInitRot.y, headInitRot.z - steerAngle * 1.55);
      }
    }

    // Détection de checkpoint
    if (raceStarted && !raceFinished) {
      const r2 = RACE.CHECKPOINT_RADIUS * RACE.CHECKPOINT_RADIUS;
      const mx = moto.position.x;
      const mz = moto.position.z;

      for (let i = 1; i < RACE.CHECKPOINTS.length; i++) {
        if (visitedCps.has(i)) continue;
        const cp = RACE.CHECKPOINTS[i];
        const dx = mx - cp.x, dz = mz - cp.z;
        if (dx * dx + dz * dz < r2) {
          visitedCps.add(i);
          showRaceToast(`CHECKPOINT  ${visitedCps.size} / ${TOTAL_INTER}`, 1800);
          refreshCheckpointVisuals();
        }
      }

      if (visitedCps.size === TOTAL_INTER) {
        const sf = RACE.CHECKPOINTS[0];
        const dx = mx - sf.x, dz = mz - sf.z;
        if (dx * dx + dz * dz < r2) {
          const tNow  = performance.now();
          const lapMs = tNow - lapStartTime;
          const isNewBest = bestLapMs === null || lapMs < bestLapMs;
          if (isNewBest) bestLapMs = lapMs;
          visitedCps.clear();
          refreshCheckpointVisuals();
          if (currentLap >= RACE.LAPS) {
            raceFinished = true;
            const isVictory = !aiRacers.some(ai => ai.finished);
            hud.showFinish(tNow - raceStartTime, bestLapMs, isVictory, quitSimulation);
            const resultMsg = isVictory
              ? `VICTOIRE ! MEILLEUR TOUR : ${fmtMs(bestLapMs)}`
              : `DÉFAITE — Une IA vous a devancé`;
            showRaceToast(resultMsg, 7000);
          } else {
            currentLap++;
            lapStartTime = tNow;
            hud.setLap(currentLap, RACE.LAPS);
            hud.setBestLap(bestLapMs);
            showRaceToast(
              `TOUR ${currentLap - 1} — ${fmtMs(lapMs)}${isNewBest ? ' ★ MEILLEUR TOUR' : ''}`,
              3500,
            );
          }
        }
      }
    }

    // ── Pilotes IA ──
    if (raceStarted) {
      const r2        = RACE.CHECKPOINT_RADIUS * RACE.CHECKPOINT_RADIUS;
      const aisFrozen = performance.now() < aiFreezedUntil;
      for (const ai of aiRacers) {
        if (ai.finished || aisFrozen) continue;

        let targetX, targetZ, targetSpeed;

        if (savedPath && savedPath.length > 0) {
          ai.pathIndex = findNearestForward(savedPath, ai.pathIndex, ai.root.position);

          const frac = ai.pathIndex / savedPath.length;
          if (frac > 0.85 && !ai.nearLapEnd) ai.nearLapEnd = true;
          if (frac < 0.15 &&  ai.nearLapEnd) {
            ai.nearLapEnd = false;
            ai.pathIndex  = 0;
            if (ai.lap >= RACE.LAPS) { ai.finished = true; continue; }
            ai.lap++;
          }

          const look = getLookaheadPoint(savedPath, ai.pathIndex, 22);
          targetX     = look.x;
          targetZ     = look.z;
          targetSpeed = look.speed * ai.profile.speedMult;
        } else {
          const cpIdx = AI_ROUTE[ai.waypointIdx];
          const cp    = RACE.CHECKPOINTS[cpIdx];
          targetX     = cp.x;
          targetZ     = cp.z;
          targetSpeed = ai.profile.speedMax;
          const dx2 = cp.x - ai.root.position.x, dz2 = cp.z - ai.root.position.z;
          if (dx2 * dx2 + dz2 * dz2 < r2) {
            const atFinish = cpIdx === 0;
            ai.waypointIdx = (ai.waypointIdx + 1) % AI_ROUTE.length;
            if (atFinish) {
              if (ai.lap >= RACE.LAPS) { ai.finished = true; continue; }
              ai.lap++;
            }
          }
        }

        const dx = targetX - ai.root.position.x;
        const dz = targetZ - ai.root.position.z;
        const desiredYaw = Math.atan2(dx, dz);
        let   yawDiff    = desiredYaw - ai.yaw;
        while (yawDiff >  Math.PI) yawDiff -= Math.PI * 2;
        while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
        ai.yaw += yawDiff * Math.min(1, ai.profile.turnSpeed * fpsRatio);

        const accel = ai.speed < targetSpeed ? 0.006 : 0.014;
        ai.speed += (targetSpeed - ai.speed) * Math.min(1, accel * fpsRatio);

        ai.root.moveWithCollisions(new Vector3(
          Math.sin(ai.yaw) * ai.speed * fpsRatio,
          0,
          Math.cos(ai.yaw) * ai.speed * fpsRatio,
        ));
        ai.root.moveWithCollisions(new Vector3(0, -GRAVITY * fpsRatio, 0));
        if (ai.root.position.y < MOTO.MIN_HEIGHT) ai.root.position.y = MOTO.MIN_HEIGHT;

        ai.root.rotation.y = ai.yaw + AI_VISUAL_OFFSET;
      }
    }

    hudTick++;
    if (hudTick % 6 === 0) {
      hud.setSpeed(Math.round(Math.abs(motoSpeed) * 100));
      if (raceStarted && !raceFinished) hud.setTimer(performance.now() - raceStartTime);

      const playerProg = raceFinished
        ? Infinity
        : (currentLap - 1 + visitedCps.size / Math.max(1, TOTAL_INTER)) / RACE.LAPS;
      const standings = [
        { label: 'VOUS', score: playerProg, finished: raceFinished },
        ...aiRacers.map(ai => {
          const lapProg = savedPath
            ? ai.pathIndex / Math.max(1, savedPath.length)
            : ai.waypointIdx / AI_ROUTE.length;
          return {
            label: ai.profile.label,
            score: ai.finished ? Infinity : (ai.lap - 1 + lapProg) / RACE.LAPS,
            finished: ai.finished,
          };
        }),
      ].sort((a, b) => b.score - a.score);
      hud.setStandings(standings);

      if (!raceFinished) {
        let target;
        if (visitedCps.size === TOTAL_INTER) {
          target = RACE.CHECKPOINTS[0];
        } else {
          let minD2 = Infinity;
          for (let i = 1; i < RACE.CHECKPOINTS.length; i++) {
            if (visitedCps.has(i)) continue;
            const cp = RACE.CHECKPOINTS[i];
            const dx = moto.position.x - cp.x, dz = moto.position.z - cp.z;
            const d2 = dx * dx + dz * dz;
            if (d2 < minD2) { minD2 = d2; target = cp; }
          }
        }
        if (target) {
          const bearing = Math.atan2(target.x - moto.position.x, target.z - moto.position.z);
          const relDeg  = (bearing - motoYaw) * (180 / Math.PI) - 180;
          const dist    = Math.sqrt(
            (target.x - moto.position.x) ** 2 + (target.z - moto.position.z) ** 2,
          );
          hud.setArrow(relDeg, dist);
        }
      }
    }

    cullTick++;
    if (cullTick % 12 === 0) {
      const mx = moto.position.x;
      const mz = moto.position.z;
      const R2 = 90 * 90;
      for (const wf of wireframeMeshes) {
        const dx = wf.center.x - mx;
        const dz = wf.center.z - mz;
        wf.mesh.setEnabled(dx * dx + dz * dz < R2);
      }
    }
  });

  // 20. Direction roue avant + roll roues
  scene.onAfterAnimationsObservable.add(() => {
    if (scene.metadata?.paused) return;
    const kb  = GAME_CONFIG.KEYBOARD.CONTROLS[GAME_CONFIG.KEYBOARD.LAYOUT] ?? GAME_CONFIG.KEYBOARD.CONTROLS.AZERTY;
    const lft = inputMap[kb.LEFT]  || inputMap['arrowleft'];
    const rgt = inputMap[kb.RIGHT] || inputMap['arrowright'];
    const dt  = scene.getEngine().getDeltaTime() / 1000;

    const targetSteer = lft ? -0.35 : rgt ? 0.35 : 0;
    steerAngle += (targetSteer - steerAngle) * Math.min(1, 0.12 * TARGET_FPS * dt);

    rollAngle += motoSpeed * TARGET_FPS * dt * 2.0;
    Quaternion.RotationAxisToRef(_rollAxis, rollAngle, _rollQuat);
    Quaternion.RotationAxisToRef(_upVec,   steerAngle, _steerQuat);

    for (const { mesh, initQuat } of frontWheelData) {
      initQuat.multiplyToRef(_rollQuat, _tempQuat);
      _steerQuat.multiplyToRef(_tempQuat, mesh.rotationQuaternion);
    }
    for (const { mesh, initQuat } of frontCoverData) {
      _steerQuat.multiplyToRef(initQuat, mesh.rotationQuaternion);
    }
    for (const { mesh, initQuat } of rearWheelData) {
      initQuat.multiplyToRef(_rollQuat, mesh.rotationQuaternion);
    }
  });

  // 20b. Initialisation du HUD course
  hud.setLap(currentLap, RACE.LAPS);
  hud.setTimer(0);
  hud.setBestLap(null);

  // 21. Démarrage rendu
  engine.runRenderLoop(() => scene.render());

  const resizeHandler = () => engine.resize();
  window.addEventListener('resize', resizeHandler);

  // 22. Menu pause
  const pause = setupPauseButton(scene, {
    engine,
    camera,
    onQuit: () => quitSimulation(),
  });

  // Musique de fond — volume piloté par le slider des réglages
  const bgMusic = new Audio('/extragame/music.mp3');
  bgMusic.loop = true;
  bgMusic.play().catch(() => {});
  pause.setAudio(bgMusic);

  function quitSimulation() {
    bgMusic.pause();
    bgMusic.src = '';
    if (aiOpen) closeAI();
    if (aiBadgeInterval) clearInterval(aiBadgeInterval);
    aiBadge.remove();
    window.removeEventListener('resize', resizeHandler);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    engine.stopRenderLoop();
    hud.remove();
    pause.dispose();
    trail.dispose();
    aiMeshResults.forEach(res => res.meshes.forEach(m => m.dispose()));
    checkpointMeshes.forEach(m => m.dispose());
    pipeline.dispose();
    glow.dispose();
    scene.dispose();
    engine.dispose();
    location.reload();
  }

  console.log('[tronScene] Cyber city + moto chargées', {
    parts: MAP_PARTS.length,
    motoMeshes: motoResult.meshes.length,
  });

  return () => {
    showCutscene(RACE.LAPS, RACE.COUNTDOWN_MS, () => {
      raceStarted   = true;
      raceStartTime = performance.now();
      lapStartTime  = raceStartTime;
    });
  };
}
