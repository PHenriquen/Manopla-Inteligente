# Roadmap de hardware e evolução

O projeto evolui por módulos verificáveis. Cada fase precisa demonstrar uma função
real antes de acrescentar complexidade mecânica ou novos componentes.

## Fase 1 — Controle digital e arquitetura

**Estado:** em andamento.

- firmware base e protocolo versionado;
- configurador 3D conceitual;
- modo espelho por webcam;
- contrato comum `gauntlet.control.v1`;
- testes da geometria e dos pacotes sem hardware.

## Fase 2 — Núcleo vestível mínimo

- ESP32 como unidade central;
- primeiro sensor flex calibrado em bancada;
- IMU para orientação e movimento;
- feedback por LED e vibração;
- medição de bateria;
- teste repetido de conforto, ruído e estabilidade.

**Critério para avançar:** reconhecer estados simples de forma repetível em
diferentes sessões, sem depender de valores inventados.

## Fase 3 — Manopla funcional

- combinar sensor flex e IMU no mesmo quadro de controle;
- transmitir o mesmo significado usado pelo modo de visão;
- ligar a manopla ao configurador 3D;
- medir latência, perda de pacotes e autonomia;
- definir estado neutro quando a comunicação for interrompida.

## Fase 4 — Primeiro módulo articulado

Inspirado na construção modular do projeto
[insider.projects / Nevio Matern](https://makerworld.com/en/@neviosspaten).

- prototipar apenas um painel externo no antebraço;
- validar dobradiça, acesso à eletrônica e passagem de fios;
- testar abertura manual antes de adicionar motor;
- usar atuador leve somente em peça que não encoste nem prenda a mão;
- reproduzir a sequência primeiro no configurador 3D.

**Critério para avançar:** o painel precisa abrir, fechar e liberar manualmente sem
transferir força para os dedos ou para o pulso.

## Fase 5 — Vision Node e HUD opcional

Inspirado no padrão técnico do projeto
[F.L.I.R.T. de Tigris](https://www.instagram.com/reel/DadZGIAspmi/), que combina
Arduino Nicla Vision e display transparente.

- avaliar visão embarcada depois de validar o modo webcam;
- processar gestos localmente e emitir `gauntlet.control.v1`;
- experimentar um HUD como consumidor, não como requisito da manopla;
- manter câmera, display e controle desacoplados;
- não armazenar rostos nem tentar inferir identidade, atração ou emoção.

A [Nicla Vision](https://docs.arduino.cc/hardware/nicla-vision) é uma referência
possível, não uma compra definida. Custo, disponibilidade e desempenho precisam
ser comparados antes de escolher a placa.

## Fase 6 — Plataforma de teleoperação

- escolher um receptor externo: mão robótica, painel ou outro dispositivo;
- adicionar watchdog, limites físicos e parada neutra;
- comparar controle por sensores e por visão;
- documentar latência e falhas reais;
- somente então expandir para outros módulos de armadura.

## Princípio de escopo

A meta próxima continua sendo uma manopla funcional. A armadura articulada e o HUD
formam uma direção de longo prazo; não justificam pular a calibração dos sensores
nem tratar CAD conceitual como peça pronta para fabricação.
