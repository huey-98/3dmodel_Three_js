import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createWhaleMaid } from '@shared/whaleMaid.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf4f7fb);

const camera = new THREE.PerspectiveCamera(32, innerWidth / innerHeight, 0.1, 50);
camera.position.set(0, 1.15, 3.35);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
document.body.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xfff6ee, 0xc5d0dc, 0.85));

const key = new THREE.DirectionalLight(0xfff4e8, 1.55);
key.position.set(2.4, 4.2, 3.2);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
key.shadow.camera.left = -2.5;
key.shadow.camera.right = 2.5;
key.shadow.camera.top = 3;
key.shadow.camera.bottom = -1;
key.shadow.bias = -0.0004;
scene.add(key);

const fill = new THREE.DirectionalLight(0xd8e8ff, 0.55);
fill.position.set(-3.2, 1.8, 1.4);
scene.add(fill);

const rim = new THREE.DirectionalLight(0xffffff, 0.45);
rim.position.set(-0.4, 2.2, -3);
scene.add(rim);

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(2.4, 48),
  new THREE.ShadowMaterial({ opacity: 0.16 }),
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const maid = createWhaleMaid();
scene.add(maid.group);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.95, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 1.4;
controls.maxDistance = 6;
controls.maxPolarAngle = Math.PI * 0.72;
controls.autoRotate = false;
controls.update();

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  maid.update(dt);
  controls.update();
  renderer.render(scene, camera);
}
animate();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
