# Referências de design e engenharia

Este documento registra referências que mudam decisões do projeto. Imagens,
código e modelos externos não são incorporados automaticamente: cada licença
precisa ser verificada antes de reutilizar arquivos.

## 1. RoboticArm — gesto para movimento físico

- Fonte: [pathofseb/RoboticArm](https://github.com/pathofseb/RoboticArm)
- Padrão aproveitado: visão computacional convertida em estados simples dos dedos.
- Aplicação: origem do modo espelho, do filtro temporal e da futura teleoperação.
- Decisão: implementação própria porque o repositório de referência não declara
  licença.

## 2. Armadura articulada — módulos e sequência mecânica

- Fonte visual: [insider.projects](https://www.instagram.com/insider.projects/)
- Modelos públicos: [Nevio Matern no MakerWorld](https://makerworld.com/en/@neviosspaten)
- Exemplo: [braço articulado Mark 42](https://makerworld.com/en/models/2455552-articulated-iron-man-arm)

### O que aproveitar

- armadura dividida em módulos pequenos e substituíveis;
- dobradiças e atuadores escondidos sob a superfície;
- canais internos para fios;
- abertura como sequência coordenada, não várias peças soltas;
- prototipagem por seção antes do traje inteiro.

### Aplicação na manopla

O primeiro experimento mecânico será um único painel dorsal no antebraço. O
configurador 3D deve simular a abertura antes da fabricação. A versão física
começa manual e só depois recebe um atuador leve.

Não serão colocados servos de alto torque fechando peças contra dedos ou pulso.
Arquivos CAD externos só poderão ser adaptados após conferir a licença específica
de cada modelo.

## 3. F.L.I.R.T. — visão embarcada e HUD

- Fonte: [projeto de Tigris](https://www.instagram.com/reel/DadZGIAspmi/)
- Hardware citado: [Arduino Nicla Vision](https://docs.arduino.cc/hardware/nicla-vision)
  e um display OLED transparente.

### O que aproveitar

- câmera e inferência em um módulo pequeno;
- processamento local, sem depender sempre de um computador;
- display transparente como consumidor de eventos;
- união de visão, IMU e comunicação sem fio.

### Aplicação no projeto

Depois de validar a webcam, um `Vision Node` poderá emitir o mesmo
`gauntlet.control.v1` usado pelos sensores. O HUD exibiria apenas telemetria,
gesto e estado do sistema.

A função social da referência não faz parte da manopla: não será criado
reconhecimento de identidade, atração ou emoção. O valor técnico está na
arquitetura compacta de visão + display.

## Direção consolidada

```text
sensores da manopla ─┐
                     ├─> gauntlet.control.v1 ─> simulador / módulo externo / HUD
Vision Node ──────────┘
```

Assim, a manopla deixa de ser uma peça isolada e vira o primeiro nó de uma
plataforma vestível modular. O escopo imediato, porém, permanece: sensor real,
gestos estáveis e um único módulo mecânico seguro.
