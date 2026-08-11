# MANOPLA INTELIGENTE

A **Manopla Inteligente** é um projeto pessoal de IoT, sistemas embarcados, hardware e prototipagem inspirado em interfaces tecnológicas vestíveis. O objetivo é explorar controle por gestos, feedback tátil e visual, telemetria e integração entre firmware, estrutura física e interface web.

O projeto funciona como a frente mais próxima do hardware no portfólio: além do protótipo visual, ele inclui firmware C++, protocolos binários, conceitos de tempo real e modelagem 3D.

## Visão do projeto

A proposta é construir um protótipo apresentável e tecnicamente sólido que demonstre integração entre:

- hardware e sensores;
- firmware ESP32;
- software/interface;
- telemetria e protocolos;
- modelagem 3D;
- experiência de uso.

O desenvolvimento começa com uma base digital e embarcada que pode evoluir gradualmente até um protótipo físico completo, sem exigir todos os componentes desde a primeira versão.

## O que esse projeto representa

- IoT e sistemas embarcados;
- desenvolvimento de firmware para ESP32;
- C++ aplicado a hardware;
- reconhecimento e interpretação de gestos;
- controle de LEDs e feedback por vibração;
- modelagem 3D da estrutura da manopla;
- interface web para estado e controle;
- protocolos binários e integridade de dados;
- noções de RTOS/tempo real;
- integração entre hardware e software.

## Estrutura

```text
firmware/
  gauntlet_controller.ino        firmware inicial
  gesture_glove.ino              experimento de gestos
  core/
    ring_buffer.h                 buffer estático sem heap
    packet_protocol.h             protocolo binário + CRC16
  advanced/
    gauntlet_realtime.ino         experimento ESP32/FreeRTOS
mechanics/
  ...                             modelos OpenSCAD
web/
  ...                             interface de demonstração
docs/
  ...                             arquitetura e evolução técnica
```

## Firmware de baixo nível

A camada `firmware/core/` foi adicionada para aproximar o projeto de engenharia embarcada real, indo além de sketches Arduino simples.

`ring_buffer.h` usa armazenamento de capacidade fixa, sem alocação dinâmica, para tornar o fluxo de sensores previsível. `packet_protocol.h` define layout binário versionado, sequence number e CRC-16/CCITT para verificar integridade dos pacotes.

O experimento `firmware/advanced/gauntlet_realtime.ino` separa aquisição e transmissão em tarefas FreeRTOS:

```text
sensores (100 Hz) -> ring buffer -> telemetria (20 Hz) -> pacote binário serial
```

Isso introduz tarefas, prioridades, periodicidade determinística, critical sections e comunicação binária. Detalhes em [`docs/LOW_LEVEL_ENGINEERING.md`](docs/LOW_LEVEL_ENGINEERING.md).

## Estratégia de desenvolvimento

A evolução continua dividida em quatro frentes:

1. estrutura mecânica em modelo 3D;
2. firmware ESP32, do nível simples ao RTOS;
3. interface web funcional para simular e acompanhar a operação;
4. integração gradual com sensores e hardware físico.

Essa abordagem permite validar lógica, arquitetura e experiência antes de investir em todos os componentes do protótipo.

## Como executar a interface web

Abra o arquivo `web/index.html` em um navegador ou use um servidor simples:

```bash
cd web
python -m http.server 8000
```

Depois acesse `http://localhost:8000`.

## Tecnologias

- **Microcontrolador:** ESP32;
- **Firmware:** C++ / Arduino;
- **Tempo real:** FreeRTOS (experimento avançado);
- **Protocolos:** pacote binário próprio + CRC16;
- **Modelagem:** OpenSCAD;
- **Web:** HTML, CSS e JavaScript;
- **Hardware previsto:** sensores de movimento/toque, LEDs e motor de vibração.

## Próximos passos físicos

Quando houver hardware disponível, a base atual pode evoluir para:

- IMU via I2C/SPI;
- sensores flex/toque reais;
- feedback háptico;
- BLE/Wi-Fi;
- calibração persistente;
- controle de energia/bateria;
- estrutura impressa em 3D;
- testes hardware-in-the-loop.

## Objetivo de portfólio

A Manopla Inteligente demonstra uma frente complementar ao desenvolvimento de software tradicional: **firmware, baixo nível, RTOS, protocolos, sensores, IoT, modelagem e construção de um dispositivo físico**.

Em conjunto com os outros projetos, ela é a peça que mostra que o portfólio não termina na tela do computador.
