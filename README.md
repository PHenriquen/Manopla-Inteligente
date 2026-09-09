# Manopla Inteligente

A **Manopla Inteligente** é um projeto pessoal de mecatrônica e sistemas embarcados para estudar a ligação entre **ESP32, sensores, firmware, telemetria, mecânica digital e uma peça vestível**.

A proposta é construir o projeto em duas camadas que conversam entre si:

1. **protótipo físico**, responsável por sensores, feedback tátil/visual e aquisição de dados;
2. **STARK LAB**, uma interface 3D interativa usada para visualizar a arquitetura mecânica, eletrônica e a telemetria do sistema.

O repositório ainda está antes da montagem física completa. Hoje ele concentra o firmware base, o protocolo de comunicação, um modelo mecânico inicial e uma interface 3D funcional para exploração técnica.

> Estado atual: firmware + protocolo + mecânica digital + laboratório 3D interativo. A integração com sensores reais continua sendo a próxima etapa física.

## O que existe hoje

- firmware para ESP32 com aquisição periódica de entradas analógicas;
- tarefas FreeRTOS separando leitura dos sensores e envio de telemetria;
- ring buffer de tamanho fixo para não depender de alocação dinâmica durante a coleta;
- pacote binário versionado com sequence number e CRC16;
- modelo inicial da estrutura em OpenSCAD;
- interface web 3D sem build, usando Three.js;
- modelos procedurais interativos de armadura, manopla, capacete e reator;
- seleção de peças por raycasting;
- modos **Assembled, Structure, Electronics, Exploded e X-Ray**;
- animação do faceplate do capacete;
- articulação demonstrativa dos dedos da manopla;
- modo HUD;
- painel de diagnósticos e telemetria simulada em tempo real.

## Fluxo do firmware

```text
entrada dos sensores
       ↓
leitura a 100 Hz
       ↓
ring buffer
       ↓
tarefa de telemetria a 20 Hz
       ↓
pacote binário + CRC16
       ↓
Serial
```

O código principal está em [`firmware/advanced/gauntlet_realtime.ino`](firmware/advanced/gauntlet_realtime.ino).

A separação entre aquisição e telemetria permite que a frequência de leitura dos sensores não dependa da velocidade de envio dos dados para outro programa.

## Estrutura

```text
firmware/
├── advanced/
│   └── gauntlet_realtime.ino   # firmware atual do protótipo
└── core/
    ├── packet_protocol.h       # formato dos pacotes + CRC16
    └── ring_buffer.h           # buffer estático

mechanics/
└── gauntlet.scad               # primeira estrutura em OpenSCAD

web/
├── index.html                  # interface STARK LAB
├── styles.css                  # HUD / laboratório técnico
└── app.js                      # Three.js, interação e telemetria

docs/                           # documentação técnica
```

## Hardware planejado

A primeira montagem física deve continuar pequena. O objetivo não é adicionar sensores só para aumentar a lista de componentes, e sim validar cada subsistema.

A base prevista é:

- ESP32;
- sensor flex ou outro sensor de dobra;
- IMU para orientação/movimento;
- motor de vibração;
- LED(s) de estado;
- bateria e leitura de tensão.

Depois dessa etapa, reconhecimento de gestos mais elaborado, BLE/Wi-Fi e atuadores adicionais podem ser avaliados com base nos testes reais.

## Protocolo

A comunicação serial do firmware mais recente não usa texto. [`firmware/core/packet_protocol.h`](firmware/core/packet_protocol.h) define um pacote binário com cabeçalho, versão, tipo, sequência, payload e CRC.

Isso ajuda a detectar pacotes corrompidos e permite evoluir o protocolo sem quebrar compatibilidade imediatamente.

## Mecânica

[`mechanics/gauntlet.scad`](mechanics/gauntlet.scad) é o começo da parte física. O modelo ainda não deve ser tratado como peça final para impressão: medidas, encaixes, acesso à eletrônica e conforto precisam ser fechados depois de testar os componentes reais.

## STARK LAB — interface 3D

A interface deixou de ser apenas um dashboard visual e passou a funcionar como um **laboratório virtual de engenharia**.

Ela pode ser aberta sem processo de build:

```bash
cd web
python -m http.server 8000
```

Depois, abra `http://localhost:8000`.

A interface carrega Three.js por CDN e gera os modelos atuais proceduralmente no navegador, então não depende de arquivos `.glb` para funcionar nesta versão.

### Módulos atuais

#### Suit Overview

Visão geral da arquitetura da armadura. Algumas peças funcionam como atalhos para os módulos internos.

#### Gauntlet System

- estrutura externa;
- estrutura interna;
- ESP32 conceitual;
- bateria;
- IMU;
- emissor de palma;
- cabeamento;
- segmentos dos dedos;
- animação de fechamento/abertura da mão.

#### Helmet Assembly

- shell;
- faceplate;
- servos laterais;
- optical arrays;
- módulo de HUD;
- abertura/fechamento do faceplate;
- modo HUD imersivo.

#### Arc Reactor

- núcleo emissivo;
- anéis;
- backplane;
- dez bobinas selecionáveis;
- pulso visual;
- exploded view.

#### Diagnostics

Simula leituras de flexão, pitch, bateria e haptic, além de sequência de pacotes e CRC para representar visualmente a arquitetura de telemetria do firmware.

### Modos de visualização

- **ASSEMBLED** — modelo normal;
- **STRUCTURE** — blindagem externa fica translúcida;
- **ELECTRONICS** — destaca módulos eletrônicos e emissores;
- **EXPLODED** — separa componentes principais;
- **X-RAY** — blindagem em wireframe/transparência.

### Atalhos

| Tecla | Ação |
|---|---|
| `1` | Suit Overview |
| `2` | Gauntlet |
| `3` | Helmet |
| `4` | Arc Reactor |
| `5` | Diagnostics |
| `X` | X-Ray |
| `E` | Exploded View |
| `H` | HUD, quando estiver no capacete |
| `R` | Reset da câmera |

## Próxima evolução do 3D

Os modelos atuais são **procedurais e funcionais**. Isso deixa a aplicação leve e permite validar a interação antes de depender de assets externos.

A próxima evolução natural é substituir gradualmente os modelos procedurais por modelos `.glb/.gltf` próprios ou com licença compatível, mantendo a mesma camada de interação:

```text
modelo GLB
   ↓
Three.js
   ↓
raycasting / hotspots
   ↓
component metadata
   ↓
inspector + camera transitions
   ↓
telemetry / ESP32
```

Assim, o projeto pode ganhar geometria mais realista sem precisar reescrever a interface inteira.

## Tecnologias

| Parte | Tecnologia |
|---|---|
| Microcontrolador | ESP32 |
| Firmware | C++ / Arduino |
| Agendamento | FreeRTOS |
| Comunicação | Serial + protocolo binário |
| Mecânica | OpenSCAD |
| 3D Web | Three.js / WebGL |
| Interface | HTML, CSS e JavaScript |

## Próximos testes físicos

1. montar ESP32 + primeiro sensor flex;
2. confirmar frequência e ruído das leituras;
3. calibrar valores mínimos/máximos;
4. adicionar IMU;
5. validar o pacote serial com um receptor real;
6. testar feedback por vibração;
7. ajustar o modelo da manopla às dimensões dos componentes;
8. conectar telemetria real ao STARK LAB.

A prioridade continua sendo manter cada etapa pequena o suficiente para saber o que realmente funcionou em hardware, em vez de construir toda a arquitetura física antes da primeira validação.
