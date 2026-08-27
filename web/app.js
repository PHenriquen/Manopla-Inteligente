import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { layers, modules, validateModules } from './modules.js';

validateModules();

const canvas = document.querySelector('#modelCanvas');
const moduleList = document.querySelector('#moduleList');
const moduleName = document.querySelector('#moduleName');
const moduleDetails = document.querySelector('#moduleDetails');
const hideSelected = document.querySelector('#hideSelected');
const isolateSelected = document.querySelector('#isolateSelected');
const showAll = document.querySelector('#showAll');
const viewState = document.querySelector('#viewState');
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

const camera = new THREE.PerspectiveCamera(36, 1, .1, 100);
camera.position.set(6.4, 5.2, 7.6);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = .07;
controls.minDistance = 5;
controls.maxDistance = 16;
controls.target.set(0, 0, 0);

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

scene.add(new THREE.HemisphereLight(0xe8f7ff, 0x101215, 2.2));
const keyLight = new THREE.DirectionalLight(0xffffff, 4.4);
keyLight.position.set(4, 7, 5);
scene.add(keyLight);
const rimLight = new THREE.PointLight(0x4debd2, 18, 18);
rimLight.position.set(-4, 2, -3);
scene.add(rimLight);

const platform = new THREE.Group();
platform.rotation.set(-.14, 0, -.12);
scene.add(platform);

const themes = {
  graphite: { finish: 0x30363b, roughness: .3, metalness: .7 },
  ceramic: { finish: 0xd8ddde, roughness: .22, metalness: .35 },
  signal: { finish: 0xb62530, roughness: .3, metalness: .55 },
};

const layerMaterials = {
  finish: new THREE.MeshStandardMaterial({ color: themes.graphite.finish, roughness: .3, metalness: .7 }),
  structure: new THREE.MeshStandardMaterial({ color: 0x4e5961, roughness: .55, metalness: .72 }),
  electronics: new THREE.MeshStandardMaterial({ color: 0x173e3b, emissive: 0x0b8e7e, emissiveIntensity: .5, roughness: .48, metalness: .3 }),
};

const meshById = new Map();
const hiddenIds = new Set();
const visibleLayers = new Set(Object.keys(layers));
let selectedId = null;
let isolatedId = null;
let exploded = false;
let panelsOpen = false;

function geometryFor(item) {
  if (item.shape === 'cylinder') return new THREE.CylinderGeometry(item.size[0], item.size[2], item.size[1], 32);
  const radius = item.shape === 'strip' ? .06 : .12;
  return new RoundedBoxGeometry(...item.size, 4, radius);
}

function createPart(item) {
  const material = layerMaterials[item.layer].clone();
  const mesh = new THREE.Mesh(geometryFor(item), material);
  mesh.name = item.name;
  mesh.userData = { moduleId: item.id, baseColor: material.color.getHex() };
  mesh.position.fromArray(item.position);
  mesh.rotation.fromArray(item.rotation);
  mesh.castShadow = false;

  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(mesh.geometry, 28),
    new THREE.LineBasicMaterial({ color: item.layer === 'electronics' ? 0x5ff7df : 0x7d878e, transparent: true, opacity: .28 }),
  );
  edges.userData.moduleId = item.id;
  mesh.add(edges);
  platform.add(mesh);
  meshById.set(item.id, mesh);
}

modules.forEach(createPart);

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(4.7, 64),
  new THREE.MeshBasicMaterial({ color: 0x0c0f11, transparent: true, opacity: .62 }),
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -1.8;
scene.add(ground);

function setSelected(id) {
  selectedId = id;
  const item = modules.find((module) => module.id === id);
  for (const module of modules) {
    const mesh = meshById.get(module.id);
    const selected = module.id === id;
    mesh.material.emissive = new THREE.Color(selected ? 0x3ef0d4 : module.layer === 'electronics' ? 0x0b8e7e : 0x000000);
    mesh.material.emissiveIntensity = selected ? .55 : module.layer === 'electronics' ? .5 : 0;
    mesh.children[0].material.opacity = selected ? .9 : .28;
  }
  document.querySelectorAll('.module-button').forEach((button) => button.classList.toggle('selected', button.dataset.id === id));
  hideSelected.disabled = !item;
  isolateSelected.disabled = !item;
  if (!item) {
    moduleName.textContent = 'Selecione um módulo';
    moduleDetails.className = 'module-details empty';
    moduleDetails.textContent = 'Clique numa peça do modelo ou use a lista de montagem.';
    return;
  }
  moduleName.textContent = item.name;
  moduleDetails.className = 'module-details';
  moduleDetails.replaceChildren(
    detailRow('ID', item.code),
    detailRow('Camada', layers[item.layer].label),
    detailRow('Função', item.purpose),
    detailRow('Estado', item.readiness),
  );
}

function detailRow(label, value) {
  const row = document.createElement('div');
  const key = document.createElement('small');
  const text = document.createElement('span');
  key.textContent = label;
  text.textContent = value;
  row.append(key, text);
  return row;
}

function renderModuleList() {
  moduleList.replaceChildren(...modules.map((item) => {
    const button = document.createElement('button');
    const marker = document.createElement('i');
    const copy = document.createElement('span');
    const name = document.createElement('strong');
    const metadata = document.createElement('small');
    const arrow = document.createElement('b');
    button.className = 'module-button';
    button.dataset.id = item.id;
    marker.style.setProperty('--module-color', layers[item.layer].color);
    name.textContent = item.name;
    metadata.textContent = `${item.code} · ${layers[item.layer].label}`;
    arrow.textContent = '↗';
    copy.append(name, metadata);
    button.append(marker, copy, arrow);
    button.addEventListener('click', () => setSelected(item.id));
    return button;
  }));
}

function updateVisibility() {
  for (const item of modules) {
    meshById.get(item.id).visible = visibleLayers.has(item.layer) && !hiddenIds.has(item.id) && (!isolatedId || isolatedId === item.id);
  }
}

function setToggle(button, active, activeText, idleText) {
  button.classList.toggle('active', active);
  button.setAttribute('aria-pressed', String(active));
  button.textContent = active ? activeText : idleText;
}

document.querySelectorAll('.layer-toggle').forEach((button) => {
  button.addEventListener('click', () => {
    const layer = button.dataset.layer;
    visibleLayers.has(layer) ? visibleLayers.delete(layer) : visibleLayers.add(layer);
    button.classList.toggle('active', visibleLayers.has(layer));
    button.setAttribute('aria-pressed', String(visibleLayers.has(layer)));
    updateVisibility();
  });
});

const panelsButton = document.querySelector('#togglePanels');
panelsButton.addEventListener('click', () => {
  panelsOpen = !panelsOpen;
  setToggle(panelsButton, panelsOpen, 'Fechar painéis', 'Abrir painéis');
  viewState.textContent = panelsOpen ? 'SERVICE OPEN' : exploded ? 'EXPLODED' : 'ASSEMBLED';
});

const explodedButton = document.querySelector('#toggleExploded');
explodedButton.addEventListener('click', () => {
  exploded = !exploded;
  setToggle(explodedButton, exploded, 'Montar modelo', 'Modo explodido');
  viewState.textContent = exploded ? 'EXPLODED' : panelsOpen ? 'SERVICE OPEN' : 'ASSEMBLED';
});

hideSelected.addEventListener('click', () => {
  if (!selectedId) return;
  hiddenIds.add(selectedId);
  updateVisibility();
});

isolateSelected.addEventListener('click', () => {
  if (!selectedId) return;
  isolatedId = isolatedId === selectedId ? null : selectedId;
  isolateSelected.textContent = isolatedId ? 'Sair do isolamento' : 'Isolar selecionado';
  updateVisibility();
});

showAll.addEventListener('click', () => {
  hiddenIds.clear();
  isolatedId = null;
  visibleLayers.clear();
  Object.keys(layers).forEach((layer) => visibleLayers.add(layer));
  document.querySelectorAll('.layer-toggle').forEach((button) => {
    button.classList.add('active');
    button.setAttribute('aria-pressed', 'true');
  });
  isolateSelected.textContent = 'Isolar selecionado';
  updateVisibility();
});

document.querySelectorAll('.swatch').forEach((button) => {
  button.addEventListener('click', () => {
    const theme = themes[button.dataset.theme];
    document.querySelectorAll('.swatch').forEach((item) => {
      const selected = item === button;
      item.classList.toggle('selected', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    modules.filter((item) => item.layer === 'finish').forEach((item) => {
      const material = meshById.get(item.id).material;
      material.color.setHex(theme.finish);
      material.roughness = theme.roughness;
      material.metalness = theme.metalness;
    });
  });
});

document.querySelector('#resetView').addEventListener('click', () => {
  camera.position.set(6.4, 5.2, 7.6);
  controls.target.set(0, 0, 0);
  controls.update();
});

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
canvas.addEventListener('pointerdown', (event) => {
  const bounds = canvas.getBoundingClientRect();
  pointer.set(((event.clientX - bounds.left) / bounds.width) * 2 - 1, -((event.clientY - bounds.top) / bounds.height) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects([...meshById.values()], true).find((item) => item.object.visible);
  if (hit) setSelected(hit.object.userData.moduleId || hit.object.parent?.userData.moduleId);
});

function resize() {
  const bounds = canvas.parentElement.getBoundingClientRect();
  renderer.setSize(bounds.width, bounds.height, false);
  camera.aspect = bounds.width / bounds.height;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(canvas.parentElement);

function animate() {
  for (const item of modules) {
    const mesh = meshById.get(item.id);
    const basePosition = panelsOpen && item.motion ? item.motion.position : item.position;
    const baseRotation = panelsOpen && item.motion ? item.motion.rotation : item.rotation;
    const explode = exploded ? item.explode : [0, 0, 0];
    const targetPosition = new THREE.Vector3(basePosition[0] + explode[0], basePosition[1] + explode[1], basePosition[2] + explode[2]);
    const factor = reducedMotion ? 1 : .09;
    mesh.position.lerp(targetPosition, factor);
    mesh.rotation.x += (baseRotation[0] - mesh.rotation.x) * factor;
    mesh.rotation.y += (baseRotation[1] - mesh.rotation.y) * factor;
    mesh.rotation.z += (baseRotation[2] - mesh.rotation.z) * factor;
  }
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

renderModuleList();
resize();
animate();
