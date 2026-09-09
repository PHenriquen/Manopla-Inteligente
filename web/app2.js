import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.168.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.168.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.168.0/examples/jsm/loaders/GLTFLoader.js';
import { STLExporter } from 'https://cdn.jsdelivr.net/npm/three@0.168.0/examples/jsm/exporters/STLExporter.js';

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const ui = {
  canvas: $('#labCanvas'), viewport: $('#viewport'), loader: $('#modelLoader'), diagnostic: $('#diagnosticStage'),
  title: $('#moduleTitle'), eyebrow: $('#moduleEyebrow'), desc: $('#moduleDesc'), nav: $$('.nav button'),
  modes: $$('.mode'), fit: $('#fitView'), reset: $('#resetView'), hudBtn: $('#hudButton'), fullscreen: $('#fullscreenButton'), hud: $('#hud'),
  assemble: $('#assembleAll'), open: $('#openSelected'), close: $('#closeSelected'), isolate: $('#isolateSelected'), showAll: $('#showAll'), explode: $('#explodeRange'),
  name: $('#componentName'), status: $('#componentStatus'), description: $('#componentDesc'), triangles: $('#factTriangles'), bounds: $('#factBounds'), units: $('#factUnits'), print: $('#factPrint'),
  exportStl: $('#exportStl'), partCount: $('#partCount'), partSearch: $('#partSearch'), partsList: $('#partsList'), selectionLabel: $('#selectionLabel'),
  simbox: $('#simbox'), simFlex: $('#simFlex'), simPitch: $('#simPitch'), simBattery: $('#simBattery'), note: $('#noteBox')
};

const SOURCES = {
  suit: 'https://raw.githubusercontent.com/pedromst2000/ESMAD_21_22/53083c322908eb308b5ba1f83db72cc9689d84d7/ESMAD-1%C2%BAANO-21-22/Projetos/CONCE%C3%87%C3%83O%20E%20PRODU%C3%87%C3%83O%20MULTIM%C3%89DIA/WEB-VR/scene11.gltf',
  helmet: 'https://raw.githubusercontent.com/AryanShivva/AR-filter-for-MetaApps/master/objects/scene%282%29/scene.gltf',
  reactor: 'https://raw.githubusercontent.com/GuilhermeGongora/Guilherme_Portfolio/eb5d28ccfe34410604e6f6ae900e58b75c383dce/public/arc_reactor/scene.gltf'
};

const MODULES = {
  suit: { eyebrow: 'ASSEMBLY // FULL SUIT', title: 'SUIT OVERVIEW', desc: 'Montagem completa em viewer nativo: seleção de partes, materiais, explode e STL por peça.', source: 'suit' },
  gauntlet: { eyebrow: 'ASSEMBLY // ARM SECTION', title: 'GAUNTLET', desc: 'Recorte do conjunto de braço/mão para inspeção e desmontagem visual.', source: 'suit', crop: 'arm' },
  helmet: { eyebrow: 'ASSEMBLY // HELMET SHELL', title: 'HELMET', desc: 'Capacete detalhado com peças selecionáveis e prévia de abertura/desmontagem.', source: 'helmet' },
  reactor: { eyebrow: 'ASSEMBLY // REACTOR', title: 'ARC REACTOR', desc: 'Conjunto detalhado com peças individuais, wireframe, explode e inspeção de malha.', source: 'reactor' },
  diagnostics: { eyebrow: 'SIMULATION // NO HARDWARE LINK', title: 'DIAGNOSTICS', desc: 'Valores gerados localmente apenas para testar a interface. Nenhum sensor real está conectado.' }
};

let currentModule = 'suit';
let currentRoot = null;
let parts = [];
let selected = null;
let selectionHelper = null;
let materialMode = 'color';
let explosion = 0;
let modelRadius = 1;
let simTimer = null;
let loadToken = 0;
let hudActive = false;
let dragging = null;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x05080d, 0.018);
const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 500);
const renderer = new THREE.WebGLRenderer({ canvas: ui.canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.setClearColor(0x000000, 0);
renderer.shadowMap.enabled = false;

const controls = new OrbitControls(camera, ui.canvas);
controls.enableDamping = false;
controls.enablePan = true;
controls.screenSpacePanning = true;
controls.minDistance = 0.1;
controls.maxDistance = 100;
controls.addEventListener('change', render);

scene.add(new THREE.HemisphereLight(0xcceeff, 0x0b1018, 2.2));
const key = new THREE.DirectionalLight(0xffffff, 3.5); key.position.set(5, 8, 7); scene.add(key);
const rim = new THREE.DirectionalLight(0x6ddfff, 2.1); rim.position.set(-6, 3, -5); scene.add(rim);
const fill = new THREE.DirectionalLight(0xb9a8ff, 1.0); fill.position.set(1, -2, 5); scene.add(fill);
const grid = new THREE.GridHelper(20, 30, 0x1b4250, 0x0d2530); grid.material.transparent = true; grid.material.opacity = 0.13; scene.add(grid);

const gltfLoader = new GLTFLoader();
const stlExporter = new STLExporter();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const monoMaterial = new THREE.MeshStandardMaterial({ color: 0xbfc8cf, metalness: 0.12, roughness: 0.68 });
const printMaterial = new THREE.MeshStandardMaterial({ color: 0xe3e5e4, metalness: 0.02, roughness: 0.88 });
const wireMaterial = new THREE.MeshBasicMaterial({ color: 0x83dcf4, wireframe: true, transparent: true, opacity: 0.82 });

function render() {
  if (!renderer || !camera) return;
  if (selectionHelper) selectionHelper.update();
  renderer.render(scene, camera);
}

function resize() {
  const r = ui.viewport.getBoundingClientRect();
  if (!r.width || !r.height) return;
  renderer.setSize(r.width, r.height, false);
  camera.aspect = r.width / r.height;
  camera.updateProjectionMatrix();
  render();
}

new ResizeObserver(resize).observe(ui.viewport);
window.addEventListener('resize', resize);

function stopSimulation() {
  if (simTimer) clearInterval(simTimer);
  simTimer = null;
  ui.simbox.style.display = 'none';
}

function runSimulation() {
  if (currentModule !== 'diagnostics') return;
  ui.simbox.style.display = 'block';
  const tick = () => {
    ui.simFlex.textContent = `SIM ${Math.round(25 + Math.random() * 55)}%`;
    ui.simPitch.textContent = `SIM ${(Math.random() * 12 - 6).toFixed(1)}°`;
    ui.simBattery.textContent = `SIM ${Math.round(65 + Math.random() * 28)}%`;
  };
  tick();
  if (simTimer) clearInterval(simTimer);
  simTimer = setInterval(tick, 900);
}

function disposeRoot(root) {
  if (!root) return;
  root.traverse((o) => {
    if (o.geometry) o.geometry.dispose?.();
    const mats = Array.isArray(o.userData?.originalMaterial) ? o.userData.originalMaterial : [o.userData?.originalMaterial];
    mats.filter(Boolean).forEach((m) => m.dispose?.());
  });
  scene.remove(root);
}

function clearSelection() {
  selected = null;
  if (selectionHelper) scene.remove(selectionHelper);
  selectionHelper = null;
  ui.name.textContent = 'SELECT A PART';
  ui.status.textContent = currentModule === 'diagnostics' ? 'SIMULATION' : 'READY';
  ui.description.textContent = currentModule === 'diagnostics' ? 'Nenhuma leitura desta tela vem de hardware real.' : 'Clique no modelo ou use a lista de peças. Nenhuma dimensão em milímetros é assumida sem calibração do modelo.';
  ui.triangles.textContent = '—';
  ui.bounds.textContent = '—';
  ui.exportStl.disabled = true;
  ui.selectionLabel.textContent = 'NO PART SELECTED';
  $$('.parts-list button').forEach((b) => b.classList.remove('active'));
  setPartActions();
  render();
}

function boxFromVisible(root) {
  const box = new THREE.Box3();
  let found = false;
  root.updateMatrixWorld(true);
  root.traverse((o) => {
    if (!o.isMesh || !o.visible) return;
    const b = new THREE.Box3().setFromObject(o);
    if (!b.isEmpty()) { box.union(b); found = true; }
  });
  return found ? box : new THREE.Box3().setFromObject(root);
}

function cropArm(root) {
  root.updateMatrixWorld(true);
  const allBox = new THREE.Box3().setFromObject(root);
  const size = allBox.getSize(new THREE.Vector3());
  const center = allBox.getCenter(new THREE.Vector3());
  const yMin = allBox.min.y + size.y * 0.25;
  const yMax = allBox.min.y + size.y * 0.86;
  let count = 0;
  root.traverse((o) => {
    if (!o.isMesh) return;
    const c = new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3());
    const keep = c.x > center.x + size.x * 0.20 && c.y > yMin && c.y < yMax;
    o.visible = keep;
    if (keep) count += 1;
  });
  if (count < 3) {
    root.traverse((o) => {
      if (!o.isMesh) return;
      const c = new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3());
      o.visible = c.x < center.x - size.x * 0.20 && c.y > yMin && c.y < yMax;
    });
  }
}

function centerRoot(root) {
  const box = boxFromVisible(root);
  const center = box.getCenter(new THREE.Vector3());
  root.position.sub(center);
  root.updateMatrixWorld(true);
}

function friendlyName(mesh, index) {
  let raw = (mesh.name || mesh.parent?.name || '').trim();
  if (!raw || /^(defaultmaterial|object|mesh|node)[_. -]*\d*$/i.test(raw)) raw = `PART ${String(index + 1).padStart(3, '0')}`;
  return raw.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase();
}

function geometryTriangles(mesh) {
  const g = mesh.geometry;
  if (!g) return 0;
  if (g.index) return Math.floor(g.index.count / 3);
  const p = g.getAttribute('position');
  return p ? Math.floor(p.count / 3) : 0;
}

function registerParts(root) {
  parts = [];
  const centerWorld = boxFromVisible(root).getCenter(new THREE.Vector3());
  const overall = boxFromVisible(root).getSize(new THREE.Vector3());
  modelRadius = Math.max(overall.x, overall.y, overall.z) * 0.5 || 1;
  let index = 0;

  root.updateMatrixWorld(true);
  root.traverse((o) => {
    if (!o.isMesh || !o.visible) return;
    o.userData.originalMaterial = o.material;
    o.userData.homePosition = o.position.clone();
    o.userData.homeQuaternion = o.quaternion.clone();
    o.userData.openAmount = 0;
    const worldCenter = new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3());
    const parentCenter = o.parent.worldToLocal(centerWorld.clone());
    const partCenter = o.parent.worldToLocal(worldCenter.clone());
    const dir = partCenter.sub(parentCenter);
    if (dir.lengthSq() < 1e-8) dir.set(((index % 3) - 1) * 0.5, ((index % 5) - 2) * 0.22, 1);
    dir.normalize();
    o.userData.explodeDir = dir;
    o.userData.label = friendlyName(o, index);
    o.userData.partIndex = index;
    parts.push(o);
    index += 1;
  });

  ui.partCount.textContent = String(parts.length);
  buildPartsList();
  applyMaterialMode(materialMode);
  applyAssemblyTransforms();
}

function buildPartsList(filter = '') {
  ui.partsList.innerHTML = '';
  const q = filter.trim().toLowerCase();
  const shown = parts.filter((p) => !q || p.userData.label.toLowerCase().includes(q)).slice(0, 120);
  shown.forEach((part) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = part.userData.label;
    b.dataset.index = String(part.userData.partIndex);
    b.addEventListener('click', () => selectPart(part));
    ui.partsList.appendChild(b);
  });
}

function selectPart(part) {
  if (!part || !part.visible) return;
  selected = part;
  if (selectionHelper) scene.remove(selectionHelper);
  selectionHelper = new THREE.BoxHelper(part, 0x8ee8ff);
  selectionHelper.material.transparent = true;
  selectionHelper.material.opacity = 0.72;
  scene.add(selectionHelper);

  const b = new THREE.Box3().setFromObject(part);
  const s = b.getSize(new THREE.Vector3());
  ui.name.textContent = part.userData.label;
  ui.status.textContent = 'SELECTED';
  ui.description.textContent = 'Peça visual selecionada. OPEN/CLOSE é apenas uma prévia de desmontagem; não representa uma dobradiça validada.';
  ui.triangles.textContent = geometryTriangles(part).toLocaleString('pt-BR');
  ui.bounds.textContent = `${s.x.toFixed(3)} × ${s.y.toFixed(3)} × ${s.z.toFixed(3)} u`;
  ui.units.textContent = 'SOURCE / UNCALIBRATED';
  ui.print.textContent = 'VISUAL MESH • NOT VALIDATED';
  ui.exportStl.disabled = false;
  ui.selectionLabel.textContent = part.userData.label;
  $$('.parts-list button').forEach((b) => b.classList.toggle('active', Number(b.dataset.index) === part.userData.partIndex));
  setPartActions();
  render();
}

function setPartActions() {
  const disabled = !selected || currentModule === 'diagnostics';
  ui.open.disabled = disabled;
  ui.close.disabled = disabled;
  ui.isolate.disabled = disabled;
}

function applyMaterialMode(mode) {
  materialMode = mode;
  ui.modes.forEach((b) => b.classList.toggle('active', b.dataset.mode === mode));
  parts.forEach((p) => {
    if (mode === 'color') p.material = p.userData.originalMaterial;
    else if (mode === 'mono') p.material = monoMaterial;
    else if (mode === 'print') p.material = printMaterial;
    else if (mode === 'wire') p.material = wireMaterial;
  });
  render();
}

function applyAssemblyTransforms() {
  const explodeDistance = modelRadius * 0.78 * (explosion / 100);
  parts.forEach((p) => {
    const open = p.userData.openAmount || 0;
    const pos = p.userData.homePosition.clone();
    pos.addScaledVector(p.userData.explodeDir, explodeDistance);
    pos.addScaledVector(p.userData.explodeDir, open * modelRadius * 0.15);
    pos.y += open * modelRadius * 0.05;
    p.position.copy(pos);
    p.quaternion.copy(p.userData.homeQuaternion);
    if (open) {
      const axis = new THREE.Vector3(1, 0, p.userData.explodeDir.x >= 0 ? -0.25 : 0.25).normalize();
      const q = new THREE.Quaternion().setFromAxisAngle(axis, 0.48 * open);
      p.quaternion.multiply(q);
    }
  });
  render();
}

function assembleAll() {
  explosion = 0;
  ui.explode.value = '0';
  parts.forEach((p) => { p.userData.openAmount = 0; p.visible = true; });
  applyAssemblyTransforms();
  clearSelection();
}

function isolateSelected() {
  if (!selected) return;
  parts.forEach((p) => { p.visible = p === selected; });
  render();
}

function showAll() {
  parts.forEach((p) => { p.visible = true; });
  render();
}

function exportSelectedStl() {
  if (!selected) return;
  const oldPos = selected.position.clone();
  const oldQuat = selected.quaternion.clone();
  selected.position.copy(selected.userData.homePosition);
  selected.quaternion.copy(selected.userData.homeQuaternion);
  selected.updateMatrixWorld(true);

  const stl = stlExporter.parse(selected, { binary: false });
  const blob = new Blob([stl], { type: 'model/stl' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safe = selected.userData.label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'part';
  a.href = url;
  a.download = `${currentModule}-${safe}.stl`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  selected.position.copy(oldPos);
  selected.quaternion.copy(oldQuat);
  selected.updateMatrixWorld(true);
  render();
}

function fitModel() {
  if (!currentRoot) return;
  const box = boxFromVisible(currentRoot);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const fov = THREE.MathUtils.degToRad(camera.fov);
  const distance = (maxDim / (2 * Math.tan(fov / 2))) * 1.35;
  camera.position.set(center.x + distance * 0.58, center.y + distance * 0.28, center.z + distance);
  camera.near = Math.max(distance / 1000, 0.001);
  camera.far = distance * 20;
  camera.updateProjectionMatrix();
  controls.target.copy(center);
  controls.minDistance = maxDim * 0.20;
  controls.maxDistance = maxDim * 6;
  const floorY = box.min.y - maxDim * 0.045;
  grid.position.y = floorY;
  grid.scale.setScalar(Math.max(maxDim / 7, 0.2));
  controls.update();
  render();
}

function buildFallback(type) {
  const g = new THREE.Group();
  const red = new THREE.MeshStandardMaterial({ color: 0x8c1822, metalness: .72, roughness: .3 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xb89655, metalness: .78, roughness: .26 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x18212a, metalness: .45, roughness: .5 });
  const cyan = new THREE.MeshStandardMaterial({ color: 0x9beeff, emissive: 0x52cfff, emissiveIntensity: 2.2, metalness: .2, roughness: .24 });
  const add = (geo, mat, pos = [0,0,0], rot = [0,0,0], name = '') => { const m = new THREE.Mesh(geo, mat); m.position.set(...pos); m.rotation.set(...rot); m.name = name; g.add(m); return m; };
  if (type === 'reactor') {
    for (let i = 0; i < 4; i++) add(new THREE.TorusGeometry(1.8 - i * .33, .11, 14, 72), i % 2 ? dark : gold, [0,0,-i*.05], [0,0,0], `Ring ${i+1}`);
    for (let i=0;i<10;i++){const a=i/10*Math.PI*2;add(new THREE.BoxGeometry(.34,.62,.28),red,[Math.cos(a)*1.45,Math.sin(a)*1.45,.08],[0,0,a],`Coil ${i+1}`);}
    add(new THREE.CylinderGeometry(.62,.62,.18,48),cyan,[0,0,.1],[Math.PI/2,0,0],'Core');
  } else if (type === 'helmet') {
    const shell = add(new THREE.SphereGeometry(1.45,48,36),red,[0,.1,0],[0,0,0],'Rear Shell'); shell.scale.set(.9,1.05,.86);
    add(new THREE.BoxGeometry(1.55,1.55,.18),gold,[0,.05,1.08],[0,0,0],'Faceplate');
    add(new THREE.BoxGeometry(.42,.08,.08),cyan,[-.42,.24,1.2],[0,0,-.06],'Left Optic');
    add(new THREE.BoxGeometry(.42,.08,.08),cyan,[.42,.24,1.2],[0,0,.06],'Right Optic');
    add(new THREE.BoxGeometry(1.08,.36,.28),gold,[0,-.82,1.05],[0,0,0],'Jaw');
  } else {
    add(new THREE.BoxGeometry(2.2,2.6,.9),red,[0,.4,0],[0,0,0],'Chest Shell');
    add(new THREE.BoxGeometry(1.25,1.0,.26),gold,[0,.8,.52],[0,0,0],'Pectoral Plate');
    add(new THREE.CylinderGeometry(.38,.38,.16,40),cyan,[0,.38,.66],[Math.PI/2,0,0],'Core Light');
    [-1,1].forEach((s)=>{add(new THREE.CapsuleGeometry(.46,1.35,8,18),red,[s*1.75,.1,0],[0,0,s*.08],s>0?'Right Arm':'Left Arm');add(new THREE.CapsuleGeometry(.42,1.15,8,18),gold,[s*1.95,-1.65,.04],[0,0,s*.05],s>0?'Right Gauntlet':'Left Gauntlet');});
    add(new THREE.SphereGeometry(.7,36,24),gold,[0,2.6,0],[0,0,0],'Helmet');
  }
  return g;
}

function prepareRoot(root, moduleConfig) {
  if (moduleConfig.crop === 'arm') cropArm(root);
  centerRoot(root);
  scene.add(root);
  currentRoot = root;
  registerParts(root);
  fitModel();
  ui.loader.classList.add('hidden');
  ui.status.textContent = 'READY';
  ui.partSearch.value = '';
  clearSelection();
}

function loadGltf(url, token, config) {
  gltfLoader.load(url, (gltf) => {
    if (token !== loadToken) return;
    prepareRoot(gltf.scene, config);
  }, undefined, () => {
    if (token !== loadToken) return;
    ui.status.textContent = 'FALLBACK';
    prepareRoot(buildFallback(currentModule === 'gauntlet' ? 'suit' : currentModule), config);
  });
}

function setFabricationEnabled(enabled) {
  [...ui.modes, ui.assemble, ui.open, ui.close, ui.isolate, ui.showAll, ui.exportStl, ui.explode].forEach((el) => { el.disabled = !enabled; });
  if (enabled) setPartActions();
}

function loadModule(id) {
  const cfg = MODULES[id];
  if (!cfg) return;
  currentModule = id;
  loadToken += 1;
  stopSimulation();
  hudActive = false;
  ui.hud.classList.remove('active');
  ui.hudBtn.textContent = id === 'helmet' ? 'ENTER HUD' : 'HUD LOCKED';
  ui.hudBtn.disabled = id !== 'helmet';
  ui.nav.forEach((b) => b.classList.toggle('active', b.dataset.module === id));
  ui.eyebrow.textContent = cfg.eyebrow;
  ui.title.textContent = cfg.title;
  ui.desc.textContent = cfg.desc;
  ui.diagnostic.hidden = id !== 'diagnostics';
  ui.canvas.style.visibility = id === 'diagnostics' ? 'hidden' : 'visible';
  ui.loader.classList.toggle('hidden', id === 'diagnostics');
  ui.partSearch.value = '';

  if (selectionHelper) scene.remove(selectionHelper);
  selectionHelper = null;
  clearSelection();
  if (currentRoot) disposeRoot(currentRoot);
  currentRoot = null;
  parts = [];
  ui.partsList.innerHTML = '';
  ui.partCount.textContent = '0';
  explosion = 0;
  ui.explode.value = '0';

  if (id === 'diagnostics') {
    setFabricationEnabled(false);
    ui.status.textContent = 'SIMULATION';
    ui.description.textContent = 'Nenhuma leitura desta tela vem de hardware real.';
    ui.note.innerHTML = '<b>Diagnostics:</b> valores variáveis são gerados localmente e aparecem sempre marcados como SIM.';
    render();
    return;
  }

  setFabricationEnabled(true);
  ui.note.innerHTML = '<b>Fabrication preview:</b> STL exporta a geometria selecionada como ela existe no asset. Isso não confirma escala, espessura, encaixe ou segurança para uso físico. O projeto não inclui mecanismos funcionais de arma.';
  ui.loader.classList.remove('hidden');
  ui.status.textContent = 'LOADING';
  const token = loadToken;
  loadGltf(SOURCES[cfg.source], token, cfg);
}

function raycastAt(event) {
  if (!currentRoot || currentModule === 'diagnostics') return null;
  const r = ui.canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - r.left) / r.width) * 2 - 1;
  pointer.y = -((event.clientY - r.top) / r.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  return raycaster.intersectObjects(parts.filter((p) => p.visible), false)[0]?.object || null;
}

ui.canvas.addEventListener('pointerdown', (e) => { dragging = { x: e.clientX, y: e.clientY }; });
ui.canvas.addEventListener('pointerup', (e) => {
  if (!dragging) return;
  const d = Math.hypot(e.clientX - dragging.x, e.clientY - dragging.y);
  dragging = null;
  if (d < 6) { const hit = raycastAt(e); if (hit) selectPart(hit); }
});

ui.nav.forEach((b) => b.addEventListener('click', () => loadModule(b.dataset.module)));
ui.modes.forEach((b) => b.addEventListener('click', () => { if (!b.disabled) applyMaterialMode(b.dataset.mode); }));
ui.partSearch.addEventListener('input', () => buildPartsList(ui.partSearch.value));
ui.explode.addEventListener('input', () => { explosion = Number(ui.explode.value); applyAssemblyTransforms(); });
ui.assemble.addEventListener('click', assembleAll);
ui.open.addEventListener('click', () => { if (selected) { selected.userData.openAmount = 1; applyAssemblyTransforms(); } });
ui.close.addEventListener('click', () => { if (selected) { selected.userData.openAmount = 0; applyAssemblyTransforms(); } });
ui.isolate.addEventListener('click', isolateSelected);
ui.showAll.addEventListener('click', showAll);
ui.exportStl.addEventListener('click', exportSelectedStl);
ui.fit.addEventListener('click', fitModel);
ui.reset.addEventListener('click', () => { assembleAll(); fitModel(); });
ui.fullscreen.addEventListener('click', () => ui.viewport.requestFullscreen?.());
ui.hudBtn.addEventListener('click', () => {
  if (currentModule !== 'helmet') return;
  hudActive = !hudActive;
  ui.hud.classList.toggle('active', hudActive);
  ui.hudBtn.textContent = hudActive ? 'EXIT HUD' : 'ENTER HUD';
});
ui.diagnostic.addEventListener('click', runSimulation);

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && selected) clearSelection();
  if (e.key.toLowerCase() === 'f') fitModel();
  if (e.key.toLowerCase() === 'w' && currentModule !== 'diagnostics') applyMaterialMode('wire');
  if (e.key.toLowerCase() === 'c' && currentModule !== 'diagnostics') applyMaterialMode('color');
});

resize();
loadModule('suit');
