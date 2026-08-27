export const layers = {
  finish: { label: 'Acabamento', color: '#dfe5e8' },
  structure: { label: 'Estrutura', color: '#56616a' },
  electronics: { label: 'Eletrônica', color: '#53e6cf' },
};

export const modules = [
  { id: 'upper-shell', name: 'Carcaça dorsal', code: 'FIN-01', layer: 'finish', purpose: 'Proteção externa removível e primeira superfície de acesso.', readiness: 'Geometria conceitual', shape: 'box', size: [2.65, .34, 4.5], position: [0, .92, 0], rotation: [0, 0, 0], explode: [0, 2.2, 0], motion: { position: [0, 1.72, -.52], rotation: [-.42, 0, 0] } },
  { id: 'service-panel', name: 'Painel de serviço', code: 'FIN-02', layer: 'finish', purpose: 'Acesso digital ao núcleo eletrônico e aos pontos de conexão.', readiness: 'Mecanismo não validado', shape: 'box', size: [1.45, .16, 1.5], position: [0, 1.14, -.25], rotation: [0, 0, 0], explode: [0, 3.4, -.35], motion: { position: [0, 1.74, .38], rotation: [-1.05, 0, 0] } },
  { id: 'lower-cradle', name: 'Berço inferior', code: 'STR-01', layer: 'structure', purpose: 'Base interna para organizar módulos sem definir contato final com o corpo.', readiness: 'Geometria conceitual', shape: 'box', size: [2.42, .34, 4.2], position: [0, -.78, 0], rotation: [0, 0, 0], explode: [0, -2.1, 0] },
  { id: 'left-rail', name: 'Trilho estrutural esquerdo', code: 'STR-02', layer: 'structure', purpose: 'Referência modular para fixação e substituição dos blocos internos.', readiness: 'Conceito de montagem', shape: 'box', size: [.24, .26, 3.72], position: [-1.05, .18, 0], rotation: [0, 0, 0], explode: [-1.6, 0, 0] },
  { id: 'right-rail', name: 'Trilho estrutural direito', code: 'STR-03', layer: 'structure', purpose: 'Par estrutural do trilho esquerdo para uma montagem simétrica.', readiness: 'Conceito de montagem', shape: 'box', size: [.24, .26, 3.72], position: [1.05, .18, 0], rotation: [0, 0, 0], explode: [1.6, 0, 0] },
  { id: 'controller', name: 'Núcleo de controle', code: 'ELC-01', layer: 'electronics', purpose: 'Representa ESP32, condicionamento de sinais e interface de telemetria.', readiness: 'Volume reservado; placa não escolhida', shape: 'board', size: [1.45, .12, 1.72], position: [0, .48, .18], rotation: [0, 0, 0], explode: [0, 1.25, .8] },
  { id: 'sensor-bus', name: 'Barramento de sensores', code: 'ELC-02', layer: 'electronics', purpose: 'Caminho conceitual entre sensores de flexão, futura IMU e controlador.', readiness: 'Topologia provisória', shape: 'strip', size: [.34, .08, 3.2], position: [-.66, .48, .05], rotation: [0, 0, 0], explode: [-.72, 1.15, 0] },
  { id: 'haptic-module', name: 'Módulo tátil', code: 'ELC-03', layer: 'electronics', purpose: 'Reserva para feedback vibratório de baixa potência controlado pelo firmware.', readiness: 'Componente ainda não selecionado', shape: 'cylinder', size: [.42, .18, .42], position: [.7, .5, 1.15], rotation: [Math.PI / 2, 0, 0], explode: [1.05, 1.2, 1.4] },
  { id: 'power-volume', name: 'Volume de energia', code: 'ELC-04', layer: 'electronics', purpose: 'Reserva espacial; capacidade, proteção e posição dependem de requisitos físicos.', readiness: 'Sem especificação elétrica', shape: 'box', size: [1.35, .26, .82], position: [0, .42, -1.35], rotation: [0, 0, 0], explode: [0, 1.2, -1.55] },
];

export function validateModules(items = modules) {
  const ids = new Set();
  for (const item of items) {
    if (!item.id || !item.name || !layers[item.layer]) throw new Error(`Invalid module: ${item.id || 'unknown'}`);
    if (ids.has(item.id)) throw new Error(`Duplicate module id: ${item.id}`);
    if (!Array.isArray(item.size) || item.size.length !== 3 || item.size.some((value) => !Number.isFinite(value) || value <= 0)) {
      throw new Error(`Invalid size: ${item.id}`);
    }
    for (const field of ['position', 'rotation', 'explode']) {
      if (!Array.isArray(item[field]) || item[field].length !== 3 || item[field].some((value) => !Number.isFinite(value))) {
        throw new Error(`Invalid ${field}: ${item.id}`);
      }
    }
    ids.add(item.id);
  }
  return true;
}
