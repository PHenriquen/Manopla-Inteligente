import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const dom = {
  boot: $('#bootScreen'),
  canvas: $('#labCanvas'),
  wrap: $('#viewportWrap'),
  moduleTitle: $('#moduleTitle'),
  moduleEyebrow: $('#moduleEyebrow'),
  moduleDescription: $('#moduleDescription'),
  nav: $$('.nav-item'),
  modes: $$('.mode-btn'),
  contextAction: $('#contextAction'),
  hudButton: $('#hudButton'),
  hudOverlay: $('#hudOverlay'),
  diagnosticOverlay: $('#diagnosticOverlay'),
  resetView: $('#resetView'),
  togglePower: $('#togglePower'),
  systemStatus: $('#systemStatus'),
  linkStatus: $('#linkStatus'),
  fpsValue: $('#fpsValue'),
  clockValue: $('#clockValue'),
  componentName: $('#componentName'),
  componentStatus: $('#componentStatus'),
  componentId: $('#componentId'),
  componentDescription: $('#componentDescription'),
  specState: $('#specState'),
  specLoad: $('#specLoad'),
  specTemp: $('#specTemp'),
  specBus: $('#specBus'),
  flexValue: $('#flexValue'),
  imuValue: $('#imuValue'),
  batteryValue: $('#batteryValue'),
  telemetryHz: $('#telemetryHz'),
  chart: $('#telemetryChart'),
  log: $('#eventLog'),
  clearLog: $('#clearLog'),
  sequenceValue: $('#sequenceValue'),
  diagFlex: $('#diagFlex'),
  diagPitch: $('#diagPitch'),
  diagBattery: $('#diagBattery'),
  diagHaptic: $('#diagHaptic'),
  barFlex: $('#barFlex'),
  barPitch: $('#barPitch'),
  barBattery: $('#barBattery'),
  barHaptic: $('#barHaptic'),
  telemetryStream: $('#telemetryStream'),
  hudPower: $('#hudPower')
};

const MODULES = {
  suit: {
    eyebrow: 'MARK III // ASSEMBLY',
    title: 'SUIT OVERVIEW',
    description: 'Explore a arquitetura da armadura e selecione um subsistema.',
    action: 'EXPLODE SUIT',
    camera: [6.8, 3.4, 9.6],
    target: [0, 0.9, 0]
  },
  gauntlet: {
    eyebrow: 'MARK III // RIGHT ARM',
    title: 'GAUNTLET SYSTEM',
    description: 'Estrutura, articulações, sensores e eletrônica do protótipo vestível.',
    action: 'ACTUATE FINGERS',
    camera: [7.7, 3.8, 8.2],
    target: [-0.2, 0.2, 0]
  },
  helmet: {
    eyebrow: 'MARK III // OPTICS',
    title: 'HELMET ASSEMBLY',
    description: 'Faceplate servo-assistido, óptica, HUD e telemetria de bordo.',
    action: 'OPEN FACEPLATE',
    camera: [0.2, 1.1, 7.4],
    target: [0, 0.55, 0]
  },
  reactor: {
    eyebrow: 'MARK III // ENERGY CORE',
    title: 'ARC REACTOR',
    description: 'Núcleo, bobinas e anéis estruturais em visualização técnica interativa.',
    action: 'PULSE CORE',
    camera: [0.5, 5.8, 7.8],
    target: [0, 0, 0]
  },
  diagnostics: {
    eyebrow: 'ESP32 // REALTIME BUS',
    title: 'DIAGNOSTICS',
    description: 'Telemetria simulada seguindo a arquitetura do firmware do protótipo.',
    action: 'RUN SELF TEST',
    camera: [6.4, 3.2, 9],
    target: [0, 0.8, 0]
  }
};

const COLORS = {
  armor: 0x8e171a,
  armorDark: 0x3a080a,
  gold: 0xba8d43,
  metal: 0x7e8a90,
  dark: 0x101820,
  cyan: 0x67dcff,
  copper: 0xc47145,
  electronic: 0x143f4c
};

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x030608, 0.033);

const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
camera.position.set(...MODULES.suit.camera);

const renderer = new THREE.WebGLRenderer({
  canvas: dom.canvas,
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance'
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const controls = new OrbitControls(camera, dom.canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.065;
controls.minDistance = 3.2;
controls.maxDistance = 16;
controls.target.set(...MODULES.suit.target);

const hemi = new THREE.HemisphereLight(0xb9eaff, 0x071014, 1.2);
scene.add(hemi);

const keyLight = new THREE.DirectionalLight(0xd9f5ff, 3.1);
keyLight.position.set(4, 8, 6);
keyLight.castShadow = true;
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0x42cfff, 2.2);
rimLight.position.set(-6, 3, -7);
scene.add(rimLight);

const warmLight = new THREE.PointLight(0xff6a4a, 16, 18, 2);
warmLight.position.set(-3, 1, 4);
scene.add(warmLight);

const floor = new THREE.GridHelper(22, 30, 0x173b47, 0x0b1d24);
floor.position.y = -3.2;
floor.material.opacity = 0.23;
floor.material.transparent = true;
scene.add(floor);

const floorDisc = new THREE.Mesh(
  new THREE.CircleGeometry(5.2, 96),
  new THREE.MeshBasicMaterial({ color: 0x061118, transparent: true, opacity: 0.28, depthWrite: false })
);
floorDisc.rotation.x = -Math.PI / 2;
floorDisc.position.y = -3.18;
scene.add(floorDisc);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const clickable = [];
const animatedObjects = new Set();
let currentRoot = new THREE.Group();
let currentModule = 'suit';
let currentMode = 'assembled';
let selectedMesh = null;
let hoveredMesh = null;
let powered = true;
let hudActive = false;
let faceplateOpen = false;
let gauntletFlexed = false;
let reactorPulse = 0;
let sequence = 1;
let telemetry = { flex: 42, pitch: 3.4, battery: 87, haptic: 84 };
let chartValues = Array.from({ length: 54 }, (_, i) => 40 + Math.sin(i * 0.3) * 7);
let fpsFrames = 0;
let fpsLast = performance.now();

scene.add(currentRoot);

function standardMaterial(color, metalness = 0.72, roughness = 0.3, emissive = 0x000000) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness,
    roughness,
    emissive,
    emissiveIntensity: emissive ? 1.25 : 0,
    transparent: true
  });
}

function glowMaterial(color = COLORS.cyan, intensity = 3) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: intensity,
    metalness: 0.25,
    roughness: 0.18,
    transparent: true
  });
}

function component(mesh, data, category = 'mechanical', route = null) {
  mesh.userData.component = {
    id: data.id,
    name: data.name,
    description: data.description,
    state: data.state || 'NOMINAL',
    load: data.load || '18%',
    temp: data.temp || '31°C',
    bus: data.bus || 'ACTIVE'
  };
  mesh.userData.category = category;
  mesh.userData.route = route;
  mesh.userData.baseScale = mesh.scale.clone();
  mesh.userData.basePosition = mesh.position.clone();
  mesh.userData.baseRotation = mesh.rotation.clone();
  clickable.push(mesh);
  return mesh;
}

function markExplode(object, offset) {
  object.userData.explodeOffset = offset.clone();
  object.userData.homePosition = object.position.clone();
  animatedObjects.add(object);
  return object;
}

function box(size, material, position, rotation = [0, 0, 0]) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function cylinder(radiusTop, radiusBottom, height, segments, material, position, rotation = [0, 0, 0]) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), material);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function addCable(group, points, color = COLORS.copper) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  const geometry = new THREE.TubeGeometry(curve, 40, 0.035, 8, false);
  const material = standardMaterial(color, 0.58, 0.34);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.userData.category = 'electronics';
  group.add(mesh);
  return mesh;
}

function buildSuit() {
  const root = new THREE.Group();
  root.rotation.y = -0.18;

  const armor = standardMaterial(COLORS.armor);
  const armorDark = standardMaterial(COLORS.armorDark, 0.78, 0.34);
  const gold = standardMaterial(COLORS.gold, 0.82, 0.25);
  const dark = standardMaterial(COLORS.dark, 0.5, 0.42);
  const cyan = glowMaterial();

  const torso = markExplode(
    component(
      box([2.25, 2.65, 1.02], armor, [0, 0.65, 0]),
      { id: 'MK3-ARM-110', name: 'CHEST ARMOR', description: 'Blindagem externa segmentada sobre o barramento central da armadura.', load: '34%', temp: '32°C' },
      'armor'
    ),
    new THREE.Vector3(0, 0, -0.7)
  );
  torso.scale.set(1, 1, 0.82);
  root.add(torso);

  const chestInset = component(
    box([1.35, 1.2, 0.25], gold, [0, 0.98, 0.53], [0, 0, 0]),
    { id: 'MK3-ARM-118', name: 'PECTORAL PLATE', description: 'Placa frontal de proteção e acesso ao conjunto energético.', load: '21%', temp: '34°C' },
    'armor'
  );
  root.add(chestInset);

  const reactor = component(
    cylinder(0.42, 0.42, 0.18, 48, cyan, [0, 0.55, 0.73], [Math.PI / 2, 0, 0]),
    { id: 'MK3-ARC-001', name: 'ARC REACTOR', description: 'Módulo energético demonstrativo. Clique para abrir o laboratório do reator.', state: 'STABLE', load: '72%', temp: '41°C', bus: 'CORE BUS' },
    'emitter',
    'reactor'
  );
  root.add(reactor);

  const abdomen = markExplode(
    component(
      box([1.45, 1.15, 0.74], armorDark, [0, -1.05, -0.08]),
      { id: 'MK3-FRM-210', name: 'ABDOMINAL FRAME', description: 'Segmentos articulados para mobilidade do tronco e passagem de cabeamento.', load: '24%', temp: '29°C' },
      'mechanical'
    ),
    new THREE.Vector3(0, -0.5, -0.25)
  );
  root.add(abdomen);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 2.8, 0);
  markExplode(headGroup, new THREE.Vector3(0, 1.2, 0));
  const helmetShell = component(
    new THREE.Mesh(new THREE.SphereGeometry(0.78, 48, 32), gold),
    { id: 'MK3-HLM-001', name: 'HELMET', description: 'Conjunto óptico e de interface. Clique para entrar no módulo do capacete.', load: '12%', temp: '30°C', bus: 'HUD BUS' },
    'armor',
    'helmet'
  );
  helmetShell.scale.set(0.86, 1.08, 0.92);
  helmetShell.castShadow = true;
  headGroup.add(helmetShell);
  const helmetBack = box([1.2, 0.82, 0.9], armor, [0, -0.07, -0.28]);
  helmetBack.userData.category = 'armor';
  headGroup.add(helmetBack);
  const eyeL = box([0.29, 0.08, 0.06], cyan, [-0.3, 0.06, 0.7], [0, 0.04, -0.08]);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.3;
  eyeR.rotation.z *= -1;
  headGroup.add(eyeL, eyeR);
  root.add(headGroup);

  [-1, 1].forEach((side) => {
    const shoulder = markExplode(
      component(
        new THREE.Mesh(new THREE.SphereGeometry(0.72, 32, 24), armor),
        { id: `MK3-SHD-${side < 0 ? 'L' : 'R'}`, name: side < 0 ? 'LEFT SHOULDER' : 'RIGHT SHOULDER', description: 'Carcaça esférica protegendo a junta do ombro.', load: '19%', temp: '30°C' },
        'armor'
      ),
      new THREE.Vector3(side * 1.1, 0.4, 0)
    );
    shoulder.position.set(side * 1.72, 1.15, 0);
    shoulder.scale.set(1.1, 0.82, 1.0);
    root.add(shoulder);

    const upperArm = cylinder(0.48, 0.42, 1.65, 24, armorDark, [side * 2.0, -0.05, 0], [0, 0, side * 0.12]);
    upperArm.userData.category = 'armor';
    root.add(upperArm);

    const forearm = component(
      cylinder(0.52, 0.39, 1.65, 24, armor, [side * 2.1, -1.67, 0.05], [0, 0, side * 0.05]),
      { id: `MK3-GNT-${side < 0 ? 'L' : 'R'}`, name: side < 0 ? 'LEFT GAUNTLET' : 'RIGHT GAUNTLET', description: 'Antebraço com sensores, feedback e emissor de palma.', load: '26%', temp: '33°C', bus: 'ARM BUS' },
      'armor',
      side > 0 ? 'gauntlet' : null
    );
    root.add(forearm);

    const hand = box([0.78, 0.75, 0.42], gold, [side * 2.1, -2.73, 0.08]);
    hand.userData.category = 'armor';
    root.add(hand);
  });

  const neck = cylinder(0.43, 0.5, 0.6, 24, dark, [0, 2.15, -0.02]);
  neck.userData.category = 'mechanical';
  root.add(neck);

  return root;
}

function buildGauntlet() {
  const root = new THREE.Group();
  root.rotation.set(-0.1, -0.18, -0.08);

  const armor = standardMaterial(COLORS.armor);
  const armorDark = standardMaterial(COLORS.armorDark);
  const gold = standardMaterial(COLORS.gold, 0.84, 0.24);
  const metal = standardMaterial(COLORS.metal, 0.9, 0.2);
  const dark = standardMaterial(COLORS.dark, 0.62, 0.4);
  const electronic = standardMaterial(COLORS.electronic, 0.36, 0.28, 0x07242c);
  const cyan = glowMaterial();

  const cuff = markExplode(
    component(
      cylinder(0.98, 1.15, 1.9, 10, armor, [-2.7, 0, 0], [0, 0, Math.PI / 2]),
      { id: 'GNT-FRM-001', name: 'FOREARM SHELL', description: 'Carcaça principal do antebraço. Protege eletrônica, bateria e cabeamento.', load: '22%', temp: '31°C' },
      'armor'
    ),
    new THREE.Vector3(-1.1, 0, 0)
  );
  root.add(cuff);

  const innerFrame = component(
    cylinder(0.68, 0.72, 2.15, 16, metal, [-2.55, 0, 0], [0, 0, Math.PI / 2]),
    { id: 'GNT-FRM-020', name: 'INNER FRAME', description: 'Estrutura mecânica interna que mantém os módulos alinhados e transfere carga.', load: '38%', temp: '29°C' },
    'mechanical'
  );
  root.add(innerFrame);

  const controller = component(
    box([0.9, 0.28, 0.62], electronic, [-2.5, 0.72, 0]),
    { id: 'ESP32-CTRL-01', name: 'ESP32 CONTROLLER', description: 'Controlador central do protótipo: coleta sensores, agenda tarefas e envia telemetria.', state: 'RUNNING', load: '36%', temp: '37°C', bus: 'SERIAL' },
    'electronics'
  );
  root.add(controller);

  const battery = component(
    box([1.15, 0.38, 0.62], dark, [-2.7, -0.72, 0]),
    { id: 'PWR-LIPO-01', name: 'BATTERY MODULE', description: 'Volume reservado para bateria e circuito de leitura de tensão.', state: '87%', load: '4.08 V', temp: '28°C', bus: 'POWER' },
    'electronics'
  );
  root.add(battery);

  const wrist = component(
    cylinder(0.68, 0.72, 0.55, 24, metal, [-1.25, 0, 0], [0, 0, Math.PI / 2]),
    { id: 'GNT-JNT-100', name: 'WRIST JOINT', description: 'Junta de transição entre antebraço e mão, com espaço para IMU e passagem de sinais.', load: '17%', temp: '29°C' },
    'mechanical'
  );
  root.add(wrist);

  const palmFrame = component(
    box([1.5, 1.45, 0.58], dark, [-0.2, 0, 0]),
    { id: 'GNT-PALM-010', name: 'PALM FRAME', description: 'Estrutura rígida da palma, suporte para emissor e ancoragem dos dedos.', load: '29%', temp: '30°C' },
    'mechanical'
  );
  root.add(palmFrame);

  const palmArmor = markExplode(
    component(
      box([1.55, 1.48, 0.28], gold, [-0.18, 0, 0.42]),
      { id: 'GNT-ARM-012', name: 'PALM ARMOR', description: 'Placa externa removível para manutenção dos sensores e do emissor.', load: '8%', temp: '32°C' },
      'armor'
    ),
    new THREE.Vector3(0, 0, 0.85)
  );
  root.add(palmArmor);

  const repulsor = component(
    cylinder(0.36, 0.36, 0.14, 40, cyan, [-0.05, 0, 0.64], [Math.PI / 2, 0, 0]),
    { id: 'GNT-EMT-001', name: 'PALM EMITTER', description: 'Emissor visual demonstrativo usado como interface de estado e feedback do sistema.', state: 'STANDBY', load: '12%', temp: '35°C', bus: 'PWM' },
    'emitter'
  );
  root.add(repulsor);

  const imu = component(
    box([0.38, 0.16, 0.42], electronic, [-0.62, 0.44, -0.37]),
    { id: 'IMU-6DOF-01', name: 'IMU MODULE', description: 'Módulo de orientação e movimento previsto para pitch, roll e detecção de gestos.', state: 'SIMULATED', load: '6%', temp: '30°C', bus: 'I²C' },
    'electronics'
  );
  root.add(imu);

  const fingerData = [
    { name: 'INDEX', z: -0.56, len: 1.65 },
    { name: 'MIDDLE', z: -0.18, len: 1.82 },
    { name: 'RING', z: 0.2, len: 1.7 },
    { name: 'LITTLE', z: 0.56, len: 1.42 }
  ];

  root.userData.fingerGroups = [];

  fingerData.forEach((finger, index) => {
    const fingerGroup = new THREE.Group();
    fingerGroup.position.set(0.55, 0, finger.z);
    fingerGroup.userData.homeRotation = fingerGroup.rotation.clone();
    root.userData.fingerGroups.push(fingerGroup);

    const segmentLength = finger.len / 3;
    for (let s = 0; s < 3; s += 1) {
      const joint = component(
        cylinder(0.18 - s * 0.018, 0.2 - s * 0.018, segmentLength * 0.86, 14, s % 2 ? armorDark : gold, [0.42 + s * segmentLength, 0, 0], [0, 0, Math.PI / 2]),
        {
          id: `GNT-${finger.name}-${s + 1}`,
          name: `${finger.name} SEGMENT ${s + 1}`,
          description: 'Segmento articulado com espaço para leitura de dobra e transmissão mecânica.',
          load: `${15 + index * 3 + s * 2}%`,
          temp: '29°C'
        },
        s % 2 ? 'mechanical' : 'armor'
      );
      fingerGroup.add(joint);
    }
    root.add(fingerGroup);
  });

  const thumbGroup = new THREE.Group();
  thumbGroup.position.set(0.15, -0.72, -0.04);
  thumbGroup.rotation.z = -0.64;
  thumbGroup.userData.homeRotation = thumbGroup.rotation.clone();
  root.userData.fingerGroups.push(thumbGroup);
  for (let s = 0; s < 2; s += 1) {
    const thumb = component(
      cylinder(0.22 - s * 0.025, 0.24 - s * 0.025, 0.76, 14, gold, [0.42 + s * 0.66, 0, 0], [0, 0, Math.PI / 2]),
      { id: `GNT-THUMB-${s + 1}`, name: `THUMB SEGMENT ${s + 1}`, description: 'Articulação do polegar com leitura prevista de posição.', load: '18%', temp: '29°C' },
      'armor'
    );
    thumbGroup.add(thumb);
  }
  root.add(thumbGroup);

  addCable(root, [[-3.1, 0.25, 0.52], [-2.35, 0.3, 0.56], [-1.6, 0.2, 0.45], [-0.7, 0.1, 0.34], [0.1, 0.2, 0.22]]);
  addCable(root, [[-3.1, -0.28, -0.5], [-2.25, -0.4, -0.55], [-1.5, -0.25, -0.42], [-0.65, -0.18, -0.3], [0.1, -0.1, -0.22]], 0x2e84a2);

  return root;
}

function buildHelmet() {
  const root = new THREE.Group();
  root.rotation.y = 0.08;

  const armor = standardMaterial(COLORS.armor);
  const armorDark = standardMaterial(COLORS.armorDark);
  const gold = standardMaterial(COLORS.gold, 0.85, 0.24);
  const metal = standardMaterial(COLORS.metal, 0.9, 0.2);
  const electronic = standardMaterial(COLORS.electronic, 0.4, 0.3, 0x041a21);
  const cyan = glowMaterial();

  const backShell = component(
    new THREE.Mesh(new THREE.SphereGeometry(1.62, 64, 48), armor),
    { id: 'HLM-SHL-001', name: 'REAR SHELL', description: 'Carcaça estrutural traseira do capacete e suporte dos módulos laterais.', load: '14%', temp: '30°C' },
    'armor'
  );
  backShell.scale.set(0.9, 1.05, 0.86);
  backShell.position.y = 0.34;
  backShell.castShadow = true;
  root.add(backShell);

  const neckCut = box([2.3, 0.7, 2.3], standardMaterial(0x05090b, 0, 1), [0, -1.2, 0]);
  neckCut.userData.category = 'mechanical';
  root.add(neckCut);

  const faceplate = new THREE.Group();
  faceplate.position.set(0, 0.3, 1.16);
  faceplate.userData.homePosition = faceplate.position.clone();
  faceplate.userData.homeRotation = faceplate.rotation.clone();
  root.userData.faceplate = faceplate;
  animatedObjects.add(faceplate);

  const face = component(
    box([1.84, 1.82, 0.22], gold, [0, 0.05, 0]),
    { id: 'HLM-FPL-010', name: 'FACEPLATE', description: 'Placa facial servo-assistida. Pode ser aberta para demonstrar a cinemática do conjunto.', state: 'LOCKED', load: '4%', temp: '29°C', bus: 'SERVO' },
    'armor'
  );
  face.scale.set(0.86, 1, 1);
  faceplate.add(face);

  const forehead = box([1.25, 0.38, 0.28], armor, [0, 0.86, -0.02]);
  forehead.userData.category = 'armor';
  faceplate.add(forehead);

  const jaw = box([1.25, 0.42, 0.34], gold, [0, -0.92, 0.02]);
  jaw.userData.category = 'armor';
  faceplate.add(jaw);

  const eyeLeft = component(
    box([0.48, 0.11, 0.07], cyan, [-0.47, 0.2, 0.16], [0, 0, -0.07]),
    { id: 'HLM-OPT-L', name: 'LEFT OPTICAL ARRAY', description: 'Canal óptico/HUD esquerdo com iluminação e telemetria visual.', state: 'ACTIVE', load: '9%', temp: '33°C', bus: 'HUD' },
    'emitter'
  );
  const eyeRight = eyeLeft.clone();
  eyeRight.position.x = 0.47;
  eyeRight.rotation.z = 0.07;
  eyeRight.userData = structuredClone(eyeLeft.userData);
  eyeRight.userData.component.id = 'HLM-OPT-R';
  eyeRight.userData.component.name = 'RIGHT OPTICAL ARRAY';
  clickable.push(eyeRight);
  faceplate.add(eyeLeft, eyeRight);
  root.add(faceplate);

  [-1, 1].forEach((side) => {
    const servo = component(
      cylinder(0.3, 0.3, 0.18, 28, metal, [side * 1.45, 0.24, 0], [0, 0, Math.PI / 2]),
      { id: `HLM-SRV-${side < 0 ? 'L' : 'R'}`, name: `${side < 0 ? 'LEFT' : 'RIGHT'} FACEPLATE SERVO`, description: 'Pivô lateral responsável pelo movimento demonstrativo do faceplate.', state: 'READY', load: '11%', temp: '31°C', bus: 'SERVO' },
      'mechanical'
    );
    root.add(servo);

    const ear = cylinder(0.42, 0.42, 0.16, 32, armorDark, [side * 1.38, 0.24, 0], [0, 0, Math.PI / 2]);
    ear.userData.category = 'armor';
    root.add(ear);
  });

  const hudController = component(
    box([0.92, 0.22, 0.48], electronic, [0, 1.18, -0.3]),
    { id: 'HLM-HUD-CPU', name: 'HUD CONTROLLER', description: 'Módulo lógico de interface, fusão de sensores e apresentação do HUD.', state: 'SIMULATED', load: '31%', temp: '36°C', bus: 'I²C/SPI' },
    'electronics'
  );
  root.add(hudController);

  addCable(root, [[-1.15, 0.45, -0.5], [-0.75, 0.95, -0.64], [0, 1.2, -0.54], [0.75, 0.95, -0.64], [1.15, 0.45, -0.5]], 0x2e84a2);

  return root;
}

function buildReactor() {
  const root = new THREE.Group();
  root.rotation.x = -0.35;

  const dark = standardMaterial(COLORS.dark, 0.78, 0.28);
  const metal = standardMaterial(COLORS.metal, 0.92, 0.18);
  const copper = standardMaterial(COLORS.copper, 0.86, 0.24);
  const cyan = glowMaterial(COLORS.cyan, 4.2);
  const electronic = standardMaterial(COLORS.electronic, 0.4, 0.26, 0x062831);

  const outerRing = markExplode(
    component(
      new THREE.Mesh(new THREE.TorusGeometry(2.25, 0.18, 20, 96), metal),
      { id: 'ARC-RNG-001', name: 'OUTER RETAINING RING', description: 'Anel estrutural externo que organiza bobinas e pontos de fixação.', load: '17%', temp: '39°C' },
      'mechanical'
    ),
    new THREE.Vector3(0, 0, -1.35)
  );
  root.add(outerRing);

  const midRing = markExplode(
    component(
      new THREE.Mesh(new THREE.TorusGeometry(1.58, 0.12, 18, 96), dark),
      { id: 'ARC-RNG-020', name: 'MAGNETIC RING', description: 'Anel interno demonstrativo para visualização do caminho energético.', state: 'STABLE', load: '61%', temp: '42°C', bus: 'CORE' },
      'mechanical'
    ),
    new THREE.Vector3(0, 0, -0.65)
  );
  root.add(midRing);

  const glowRing = new THREE.Mesh(new THREE.TorusGeometry(1.18, 0.09, 18, 96), cyan);
  glowRing.userData.category = 'emitter';
  root.add(glowRing);

  const core = markExplode(
    component(
      cylinder(0.78, 0.78, 0.26, 64, cyan, [0, 0, 0], [Math.PI / 2, 0, 0]),
      { id: 'ARC-CORE-001', name: 'ENERGY CORE', description: 'Núcleo emissivo do demonstrador 3D. O pulso visual representa carga do sistema.', state: 'STABLE', load: '72%', temp: '44°C', bus: 'CORE BUS' },
      'emitter'
    ),
    new THREE.Vector3(0, 0, 1.2)
  );
  root.add(core);

  const pcb = markExplode(
    component(
      cylinder(1.95, 1.95, 0.12, 64, electronic, [0, 0, -0.36], [Math.PI / 2, 0, 0]),
      { id: 'ARC-PCB-010', name: 'CONTROL BACKPLANE', description: 'Placa traseira conceitual para alimentação, leitura e diagnóstico do conjunto.', load: '28%', temp: '36°C', bus: 'DATA' },
      'electronics'
    ),
    new THREE.Vector3(0, 0, -1.8)
  );
  root.add(pcb);

  root.userData.coils = [];
  for (let i = 0; i < 10; i += 1) {
    const angle = (i / 10) * Math.PI * 2;
    const radius = 1.93;
    const coilGroup = new THREE.Group();
    coilGroup.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0.08);
    coilGroup.rotation.z = angle;
    coilGroup.userData.homePosition = coilGroup.position.clone();
    coilGroup.userData.explodeOffset = new THREE.Vector3(Math.cos(angle) * 1.1, Math.sin(angle) * 1.1, 0.6);
    animatedObjects.add(coilGroup);

    const coil = component(
      box([0.5, 0.72, 0.4], copper, [0, 0, 0]),
      { id: `ARC-COIL-${String(i + 1).padStart(2, '0')}`, name: `COIL ${String(i + 1).padStart(2, '0')}`, description: 'Bobina visual individual do conjunto. Selecionável para inspeção e modo explodido.', state: 'ACTIVE', load: `${58 + (i % 4) * 4}%`, temp: `${39 + (i % 3)}°C`, bus: 'CORE' },
      'electronics'
    );
    coilGroup.add(coil);
    root.add(coilGroup);
    root.userData.coils.push(coilGroup);
  }

  const spokes = 8;
  for (let i = 0; i < spokes; i += 1) {
    const angle = (i / spokes) * Math.PI * 2;
    const spoke = box([1.28, 0.09, 0.1], metal, [Math.cos(angle) * 0.72, Math.sin(angle) * 0.72, -0.02], [0, 0, angle]);
    spoke.userData.category = 'mechanical';
    root.add(spoke);
  }

  const coreLight = new THREE.PointLight(COLORS.cyan, 42, 9, 2);
  coreLight.position.set(0, 0, 1.7);
  root.add(coreLight);
  root.userData.coreLight = coreLight;
  root.userData.core = core;

  return root;
}

function buildDiagnostics() {
  const root = buildSuit();
  root.scale.setScalar(0.92);
  return root;
}

const BUILDERS = {
  suit: buildSuit,
  gauntlet: buildGauntlet,
  helmet: buildHelmet,
  reactor: buildReactor,
  diagnostics: buildDiagnostics
};

function disposeObject(object) {
  object.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => material.dispose?.());
    }
  });
}

function setObjectTarget(object, targetPosition, targetRotation = null) {
  object.userData.targetPosition = targetPosition.clone();
  if (targetRotation) object.userData.targetRotation = targetRotation.clone();
  animatedObjects.add(object);
}

function rebuildModule(moduleName) {
  selectedMesh = null;
  hoveredMesh = null;
  clickable.length = 0;
  animatedObjects.clear();
  disposeObject(currentRoot);
  scene.remove(currentRoot);
  currentRoot = BUILDERS[moduleName]();
  scene.add(currentRoot);
  currentMode = 'assembled';
  dom.modes.forEach((button) => button.classList.toggle('active', button.dataset.mode === 'assembled'));
  applyViewMode('assembled', false);
}

function resetCamera(instant = false) {
  const cfg = MODULES[currentModule];
  const destination = new THREE.Vector3(...cfg.camera);
  const target = new THREE.Vector3(...cfg.target);
  if (instant) {
    camera.position.copy(destination);
    controls.target.copy(target);
  } else {
    camera.userData.targetPosition = destination;
    controls.userData.target = target;
  }
}

function loadModule(moduleName, logIt = true) {
  if (!MODULES[moduleName]) return;
  currentModule = moduleName;
  hudActive = false;
  dom.hudOverlay.classList.remove('active');
  dom.hudOverlay.setAttribute('aria-hidden', 'true');

  const cfg = MODULES[moduleName];
  dom.moduleEyebrow.textContent = cfg.eyebrow;
  dom.moduleTitle.textContent = cfg.title;
  dom.moduleDescription.textContent = cfg.description;
  dom.contextAction.textContent = cfg.action;
  dom.nav.forEach((button) => button.classList.toggle('active', button.dataset.module === moduleName));

  dom.hudButton.disabled = moduleName !== 'helmet';
  dom.hudButton.textContent = moduleName === 'helmet' ? 'ENTER HUD' : 'HUD LOCKED';
  dom.hudButton.style.opacity = moduleName === 'helmet' ? '1' : '0.45';

  dom.diagnosticOverlay.classList.toggle('active', moduleName === 'diagnostics');
  dom.diagnosticOverlay.setAttribute('aria-hidden', moduleName === 'diagnostics' ? 'false' : 'true');

  rebuildModule(moduleName);
  resetCamera();
  resetInspector();
  if (logIt) addLog(`MODULE LOAD // ${cfg.title}`);
}

function resetInspector() {
  dom.componentName.textContent = 'SYSTEM READY';
  dom.componentStatus.textContent = 'ONLINE';
  dom.componentId.textContent = 'MK3-SYS-000';
  dom.componentDescription.textContent = 'Clique em uma peça do modelo para inspecionar função, estado e parâmetros técnicos.';
  dom.specState.textContent = 'NOMINAL';
  dom.specLoad.textContent = '18%';
  dom.specTemp.textContent = '31°C';
  dom.specBus.textContent = 'ACTIVE';
}

function inspect(mesh) {
  const data = mesh?.userData?.component;
  if (!data) return;
  selectedMesh = mesh;
  dom.componentName.textContent = data.name;
  dom.componentStatus.textContent = data.state === 'STABLE' || data.state === 'ACTIVE' || data.state === 'RUNNING' ? data.state : 'ONLINE';
  dom.componentId.textContent = data.id;
  dom.componentDescription.textContent = data.description;
  dom.specState.textContent = data.state;
  dom.specLoad.textContent = data.load;
  dom.specTemp.textContent = data.temp;
  dom.specBus.textContent = data.bus;
  addLog(`INSPECT // ${data.id}`);
}

function materialMode(mesh, mode) {
  if (!mesh.material || !mesh.isMesh) return;
  if (!mesh.userData.materialSnapshot) {
    mesh.userData.materialSnapshot = {
      opacity: mesh.material.opacity ?? 1,
      transparent: mesh.material.transparent,
      wireframe: mesh.material.wireframe || false,
      emissiveIntensity: mesh.material.emissiveIntensity ?? 0,
      depthWrite: mesh.material.depthWrite
    };
  }

  const original = mesh.userData.materialSnapshot;
  const category = mesh.userData.category || 'mechanical';
  mesh.visible = true;
  mesh.material.transparent = true;
  mesh.material.wireframe = false;
  mesh.material.depthWrite = true;
  mesh.material.opacity = original.opacity;
  if ('emissiveIntensity' in mesh.material) mesh.material.emissiveIntensity = original.emissiveIntensity;

  if (mode === 'structure') {
    if (category === 'armor') {
      mesh.material.opacity = 0.12;
      mesh.material.depthWrite = false;
    }
  } else if (mode === 'electronics') {
    if (category === 'armor') {
      mesh.material.opacity = 0.055;
      mesh.material.depthWrite = false;
    } else if (category === 'mechanical') {
      mesh.material.opacity = 0.24;
      mesh.material.depthWrite = false;
    } else if (category === 'electronics' || category === 'emitter') {
      mesh.material.opacity = 1;
      if ('emissiveIntensity' in mesh.material && mesh.material.emissive) {
        mesh.material.emissiveIntensity = Math.max(0.8, original.emissiveIntensity);
      }
    }
  } else if (mode === 'xray') {
    if (category === 'armor') {
      mesh.material.opacity = 0.075;
      mesh.material.wireframe = true;
      mesh.material.depthWrite = false;
    } else {
      mesh.material.opacity = 0.82;
    }
  }
}

function applyViewMode(mode, logIt = true) {
  currentMode = mode;
  dom.modes.forEach((button) => button.classList.toggle('active', button.dataset.mode === mode));

  currentRoot.traverse((child) => materialMode(child, mode));

  currentRoot.traverse((child) => {
    if (!child.userData.homePosition || !child.userData.explodeOffset) return;
    const target = child.userData.homePosition.clone();
    if (mode === 'exploded') target.add(child.userData.explodeOffset);
    setObjectTarget(child, target);
  });

  if (mode === 'exploded') {
    currentRoot.traverse((child) => {
      if (child.isMesh && child.userData.category === 'armor') child.material.opacity = 0.88;
    });
  }

  if (logIt) addLog(`VIEW MODE // ${mode.toUpperCase()}`);
}

function toggleFaceplate() {
  if (currentModule !== 'helmet') return;
  const plate = currentRoot.userData.faceplate;
  if (!plate) return;
  faceplateOpen = !faceplateOpen;
  const targetPos = plate.userData.homePosition.clone();
  const targetRot = plate.userData.homeRotation.clone();
  if (faceplateOpen) {
    targetPos.set(0, 2.18, 0.4);
    targetRot.set(-1.0, 0, 0);
  }
  setObjectTarget(plate, targetPos, targetRot);
  dom.contextAction.textContent = faceplateOpen ? 'CLOSE FACEPLATE' : 'OPEN FACEPLATE';
  addLog(`FACEPLATE // ${faceplateOpen ? 'OPEN' : 'CLOSED'}`);
}

function actuateFingers() {
  if (currentModule !== 'gauntlet') return;
  gauntletFlexed = !gauntletFlexed;
  (currentRoot.userData.fingerGroups || []).forEach((finger, index) => {
    const home = finger.userData.homeRotation.clone();
    const target = home.clone();
    if (gauntletFlexed) target.z += index === 4 ? -0.48 : -0.72 - index * 0.035;
    finger.userData.targetRotation = target;
    animatedObjects.add(finger);
  });
  dom.contextAction.textContent = gauntletFlexed ? 'OPEN HAND' : 'ACTUATE FINGERS';
  addLog(`GAUNTLET // ${gauntletFlexed ? 'FIST' : 'OPEN HAND'}`);
}

function pulseCore() {
  reactorPulse = 1;
  addLog('ARC CORE // PULSE TEST');
}

function runSelfTest() {
  addLog('SELF TEST // SENSOR FLEX OK');
  setTimeout(() => addLog('SELF TEST // IMU BUS OK'), 180);
  setTimeout(() => addLog('SELF TEST // CRC16 OK'), 360);
  setTimeout(() => addLog('SELF TEST // HAPTIC READY'), 540);
}

function handleContextAction() {
  if (currentModule === 'helmet') toggleFaceplate();
  if (currentModule === 'gauntlet') actuateFingers();
  if (currentModule === 'reactor') pulseCore();
  if (currentModule === 'suit') applyViewMode(currentMode === 'exploded' ? 'assembled' : 'exploded');
  if (currentModule === 'diagnostics') runSelfTest();
}

function toggleHud() {
  if (currentModule !== 'helmet') return;
  hudActive = !hudActive;
  dom.hudOverlay.classList.toggle('active', hudActive);
  dom.hudOverlay.setAttribute('aria-hidden', hudActive ? 'false' : 'true');
  dom.hudButton.textContent = hudActive ? 'EXIT HUD' : 'ENTER HUD';
  if (hudActive) {
    camera.userData.targetPosition = new THREE.Vector3(0, 0.6, 2.15);
    controls.userData.target = new THREE.Vector3(0, 0.45, -1.2);
    addLog('HUD // IMMERSIVE MODE');
  } else {
    resetCamera();
    addLog('HUD // EXTERNAL VIEW');
  }
}

function togglePower() {
  powered = !powered;
  document.body.classList.toggle('power-off', !powered);
  dom.systemStatus.textContent = powered ? 'ONLINE' : 'OFFLINE';
  dom.togglePower.textContent = powered ? 'POWER' : 'RESTORE';
  keyLight.intensity = powered ? 3.1 : 0.45;
  rimLight.intensity = powered ? 2.2 : 0.25;
  warmLight.intensity = powered ? 16 : 0;
  addLog(`SYSTEM // ${powered ? 'ONLINE' : 'OFFLINE'}`);
}

function resizeRenderer() {
  const { width, height } = dom.wrap.getBoundingClientRect();
  if (!width || !height) return;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function pointerFromEvent(event) {
  const rect = dom.canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function findIntersection(event) {
  pointerFromEvent(event);
  raycaster.setFromCamera(pointer, camera);
  return raycaster.intersectObjects(clickable, true).find((hit) => hit.object.userData.component);
}

function restoreHover(mesh) {
  if (!mesh?.material || mesh === selectedMesh) return;
  if (mesh.userData.hoverEmissive !== undefined && mesh.material.emissive) {
    mesh.material.emissive.setHex(mesh.userData.hoverEmissive);
    mesh.material.emissiveIntensity = mesh.userData.hoverIntensity;
  }
  if (mesh.userData.hoverScale) mesh.scale.copy(mesh.userData.hoverScale);
  delete mesh.userData.hoverEmissive;
  delete mesh.userData.hoverIntensity;
  delete mesh.userData.hoverScale;
}

function applyHover(mesh) {
  if (!mesh?.material || mesh === selectedMesh) return;
  mesh.userData.hoverScale = mesh.scale.clone();
  mesh.scale.multiplyScalar(1.025);
  if (mesh.material.emissive) {
    mesh.userData.hoverEmissive = mesh.material.emissive.getHex();
    mesh.userData.hoverIntensity = mesh.material.emissiveIntensity;
    mesh.material.emissive.setHex(COLORS.cyan);
    mesh.material.emissiveIntensity = Math.max(0.45, mesh.material.emissiveIntensity || 0);
  }
}

function addLog(message) {
  const li = document.createElement('li');
  const now = new Date();
  li.innerHTML = `<time>${now.toLocaleTimeString('pt-BR', { hour12: false })}</time>${message}`;
  dom.log.prepend(li);
  while (dom.log.children.length > 8) dom.log.removeChild(dom.log.lastChild);
}

function updateTelemetry() {
  if (!powered) return;
  telemetry.flex = Math.max(4, Math.min(96, telemetry.flex + (Math.random() - 0.47) * 7));
  telemetry.pitch = Math.max(-18, Math.min(18, telemetry.pitch + (Math.random() - 0.5) * 2.4));
  telemetry.battery = Math.max(8, telemetry.battery - 0.003);
  telemetry.haptic = 72 + Math.sin(performance.now() * 0.002) * 17;
  sequence += 1;

  const flexText = `${Math.round(telemetry.flex)}%`;
  const pitchText = `${telemetry.pitch >= 0 ? '+' : ''}${telemetry.pitch.toFixed(1)}°`;
  const batteryText = `${Math.round(telemetry.battery)}%`;

  dom.flexValue.textContent = flexText;
  dom.imuValue.textContent = pitchText;
  dom.batteryValue.textContent = batteryText;
  dom.hudPower.textContent = batteryText;
  dom.sequenceValue.textContent = String(sequence).padStart(4, '0').slice(-4);

  dom.diagFlex.textContent = flexText;
  dom.diagPitch.textContent = pitchText;
  dom.diagBattery.textContent = batteryText;
  dom.diagHaptic.textContent = telemetry.haptic > 76 ? 'READY' : 'IDLE';
  dom.barFlex.style.width = `${telemetry.flex}%`;
  dom.barPitch.style.width = `${50 + telemetry.pitch * 2.2}%`;
  dom.barBattery.style.width = `${telemetry.battery}%`;
  dom.barHaptic.style.width = `${telemetry.haptic}%`;

  chartValues.push(telemetry.flex);
  chartValues.shift();
  drawTelemetryChart();

  const packet = `SEQ:${String(sequence).padStart(4, '0')}  FLEX:${Math.round(telemetry.flex).toString().padStart(2, '0')}  PITCH:${telemetry.pitch.toFixed(1).padStart(5, ' ')}  BAT:${telemetry.battery.toFixed(1)}  CRC:${Math.floor(Math.random() * 65535).toString(16).toUpperCase().padStart(4, '0')}`;
  const line = document.createElement('div');
  line.textContent = packet;
  dom.telemetryStream.prepend(line);
  while (dom.telemetryStream.children.length > 8) dom.telemetryStream.removeChild(dom.telemetryStream.lastChild);
}

function drawTelemetryChart() {
  const canvas = dom.chart;
  const dpr = Math.min(window.devicePixelRatio, 2);
  const width = Math.max(260, canvas.clientWidth || 320);
  const height = 98;
  if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
    canvas.width = width * dpr;
    canvas.height = height * dpr;
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(127, 231, 255, 0.08)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i += 1) {
    const y = (height / 4) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(127, 231, 255, 0.85)';
  ctx.lineWidth = 1.35;
  ctx.beginPath();
  chartValues.forEach((value, index) => {
    const x = (index / (chartValues.length - 1)) * width;
    const y = height - (value / 100) * (height - 8) - 4;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, 'rgba(127, 231, 255, 0.18)');
  gradient.addColorStop(1, 'rgba(127, 231, 255, 0)');
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();
}

function animateTargets() {
  if (camera.userData.targetPosition) {
    camera.position.lerp(camera.userData.targetPosition, 0.075);
    if (camera.position.distanceTo(camera.userData.targetPosition) < 0.02) delete camera.userData.targetPosition;
  }
  if (controls.userData.target) {
    controls.target.lerp(controls.userData.target, 0.075);
    if (controls.target.distanceTo(controls.userData.target) < 0.02) delete controls.userData.target;
  }

  animatedObjects.forEach((object) => {
    if (object.userData.targetPosition) object.position.lerp(object.userData.targetPosition, 0.095);
    if (object.userData.targetRotation) {
      object.rotation.x += (object.userData.targetRotation.x - object.rotation.x) * 0.095;
      object.rotation.y += (object.userData.targetRotation.y - object.rotation.y) * 0.095;
      object.rotation.z += (object.userData.targetRotation.z - object.rotation.z) * 0.095;
    }
  });
}

function animateReactor() {
  if (currentModule !== 'reactor') return;
  const t = performance.now() * 0.001;
  currentRoot.rotation.z = Math.sin(t * 0.35) * 0.035;
  const core = currentRoot.userData.core;
  const light = currentRoot.userData.coreLight;
  if (core && light) {
    const idlePulse = 1 + Math.sin(t * 3.2) * 0.035;
    const pulseBoost = reactorPulse * 0.42;
    core.scale.setScalar(idlePulse + pulseBoost);
    light.intensity = 40 + Math.sin(t * 3.2) * 7 + reactorPulse * 65;
    reactorPulse *= 0.93;
    if (reactorPulse < 0.001) reactorPulse = 0;
  }
}

function updateClockAndFps(now) {
  fpsFrames += 1;
  if (now - fpsLast >= 800) {
    const fps = Math.round((fpsFrames * 1000) / (now - fpsLast));
    dom.fpsValue.textContent = Math.min(fps, 999);
    fpsFrames = 0;
    fpsLast = now;
  }
  dom.clockValue.textContent = new Date().toLocaleTimeString('pt-BR', { hour12: false });
}

function animate(now) {
  requestAnimationFrame(animate);
  resizeRenderer();
  animateTargets();
  animateReactor();
  controls.update();
  renderer.render(scene, camera);
  updateClockAndFps(now);
}

dom.nav.forEach((button) => button.addEventListener('click', () => loadModule(button.dataset.module)));
dom.modes.forEach((button) => button.addEventListener('click', () => applyViewMode(button.dataset.mode)));
dom.contextAction.addEventListener('click', handleContextAction);
dom.hudButton.addEventListener('click', toggleHud);
dom.resetView.addEventListener('click', () => resetCamera());
dom.togglePower.addEventListener('click', togglePower);
dom.clearLog.addEventListener('click', () => { dom.log.innerHTML = ''; addLog('LOG CLEARED'); });

let downPoint = null;
dom.canvas.addEventListener('pointerdown', (event) => {
  downPoint = { x: event.clientX, y: event.clientY };
});

dom.canvas.addEventListener('pointermove', (event) => {
  const hit = findIntersection(event);
  const mesh = hit?.object || null;
  if (mesh !== hoveredMesh) {
    restoreHover(hoveredMesh);
    hoveredMesh = mesh;
    applyHover(hoveredMesh);
    dom.canvas.style.cursor = mesh ? 'pointer' : 'grab';
  }
});

dom.canvas.addEventListener('pointerleave', () => {
  restoreHover(hoveredMesh);
  hoveredMesh = null;
  dom.canvas.style.cursor = 'grab';
});

dom.canvas.addEventListener('pointerup', (event) => {
  if (!downPoint) return;
  const distance = Math.hypot(event.clientX - downPoint.x, event.clientY - downPoint.y);
  downPoint = null;
  if (distance > 7) return;
  const hit = findIntersection(event);
  if (!hit) return;
  const mesh = hit.object;
  if (mesh.userData.route) {
    loadModule(mesh.userData.route);
    return;
  }
  inspect(mesh);
});

window.addEventListener('keydown', (event) => {
  if (event.key >= '1' && event.key <= '5') {
    const modules = ['suit', 'gauntlet', 'helmet', 'reactor', 'diagnostics'];
    loadModule(modules[Number(event.key) - 1]);
  }
  if (event.key.toLowerCase() === 'x') applyViewMode('xray');
  if (event.key.toLowerCase() === 'e') applyViewMode('exploded');
  if (event.key.toLowerCase() === 'h' && currentModule === 'helmet') toggleHud();
  if (event.key.toLowerCase() === 'r') resetCamera();
});

const observer = new ResizeObserver(resizeRenderer);
observer.observe(dom.wrap);

setInterval(updateTelemetry, 250);
setInterval(() => {
  if (powered && Math.random() > 0.58) addLog(`TELEMETRY // SEQ ${String(sequence).padStart(4, '0')}`);
}, 4200);

rebuildModule('suit');
resetCamera(true);
resetInspector();
drawTelemetryChart();
addLog('STARK LAB // INITIALIZED');
addLog('ESP32 LINK // SIMULATION MODE');
setTimeout(() => dom.boot.classList.add('hidden'), 900);
requestAnimationFrame(animate);
