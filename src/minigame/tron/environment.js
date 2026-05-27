import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { PointLight } from '@babylonjs/core/Lights/pointLight';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';

export function createCyberSky(scene) {
  const dome = MeshBuilder.CreateSphere('cyberSky', { diameter: 1000, segments: 24 }, scene);
  dome.infiniteDistance = true;
  dome.isPickable = false;

  const mat = new StandardMaterial('cyberSkyMat', scene);
  mat.backFaceCulling = false;
  mat.disableLighting = true;

  const tex = new DynamicTexture('cyberSkyTex', { width: 4, height: 256 }, scene, false);
  const ctx = tex.getContext();

  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#000002');
  grad.addColorStop(0.6, '#02030a');
  grad.addColorStop(0.85, '#0a0520');
  grad.addColorStop(1.0, '#10052a');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 4, 256);
  tex.update();

  mat.emissiveTexture = tex;
  dome.material = mat;
}

export function addNeonAtmosphericLights(scene) {
  const lights = [
    { pos: new Vector3(0,    20, 150), color: new Color3(0.0, 0.8, 1.0),  range: 120, intensity: 0.6 },
    { pos: new Vector3(120,  20, 220), color: new Color3(1.0, 0.0, 0.6),  range: 140, intensity: 0.7 },
    { pos: new Vector3(-120, 25, -20), color: new Color3(0.65, 0.1, 1.0), range: 130, intensity: 0.55 },
    { pos: new Vector3(30,   10, 310), color: new Color3(1.0, 0.3, 0.0),  range: 100, intensity: 0.5 },
    { pos: new Vector3(-80,  15, 250), color: new Color3(0.0, 1.0, 0.5),  range: 110, intensity: 0.45 },
    { pos: new Vector3(80,   25, 50),  color: new Color3(1.0, 0.0, 0.3),  range: 120, intensity: 0.6 },
  ];

  lights.forEach((l, idx) => {
    const light = new PointLight(`neonAtmLight_${idx}`, l.pos, scene);
    light.diffuse    = l.color;
    light.specular   = l.color;
    light.intensity  = l.intensity;
    light.range      = l.range;
  });
}

export function createWireframeMaterial(scene, name, magenta = false) {
  const mat = new StandardMaterial(`cyberWire_${name}`, scene);
  mat.wireframe       = true;
  mat.disableLighting = true;
  mat.zOffset         = -2.0;
  mat.alpha           = 0.35;
  mat.emissiveColor   = magenta
    ? new Color3(0.18, 0.01, 0.12)
    : new Color3(0.0, 0.18, 0.25);
  mat.freeze();
  return mat;
}
