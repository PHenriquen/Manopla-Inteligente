# Manopla Inteligente

A Manopla Inteligente é um projeto pessoal para estudar a ligação entre **ESP32, sensores, firmware e uma peça vestível**.

A ideia é chegar a um protótipo físico que consiga ler movimentos/contato, enviar telemetria e devolver feedback por luz ou vibração. O repositório ainda está antes dessa etapa física completa: hoje ele concentra o firmware base, o protocolo de comunicação, um modelo mecânico inicial e uma interface de apoio.

> Estado atual: protótipo de firmware + mecânica digital. A integração com os sensores reais ainda é o próximo passo.

## O que existe hoje

- firmware para ESP32 com aquisição periódica de entradas analógicas;
- tarefas FreeRTOS separando leitura dos sensores e envio de telemetria;
- ring buffer de tamanho fixo para não depender de alocação dinâmica durante a coleta;
- pacote binário versionado com sequence number e CRC16;
- primitives de calibração de sensor testáveis fora do ESP32;
- sketch separado para medir ruído, span e repetibilidade do primeiro sensor flex;
- modelo inicial da estrutura em OpenSCAD;
- interface web simples para acompanhar a ideia do dispositivo.

O firmware atual usa duas entradas analógicas como base para **flexão** e **leitura de bateria**. Esse mapeamento é provisório até eu montar a primeira versão física e calibrar os sensores de verdade.

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

A ideia de separar as duas tarefas é simples: a frequência de leitura dos sensores não precisa depender da velocidade com que os dados são enviados para outro programa.

## Primeiro gate de calibração

Antes de inventar vários gestos, o projeto agora trata a qualidade do sinal como um gate explícito.

[`firmware/diagnostics/flex_calibration_probe.ino`](firmware/diagnostics/flex_calibration_probe.ino) mede duas posturas do sensor a 100 Hz e reporta média, desvio-padrão, min/max, amplitude, span e uma relação simples sinal/ruído. As primitives usadas pelo diagnóstico ficam em [`firmware/core/sensor_calibration.h`](firmware/core/sensor_calibration.h) e têm testes host-side em `tests/`.

A intenção é confirmar primeiro que o sensor é **repetível depois de tirar e recolocar a Manopla**. Só depois entram thresholds de gesto, IMU e fusão de sensores.

O procedimento e as referências estão em [`docs/SENSOR_CALIBRATION.md`](docs/SENSOR_CALIBRATION.md).

## Estrutura

```text
firmware/
├── advanced/
│   └── gauntlet_realtime.ino   # firmware atual do protótipo
├── core/
│   ├── packet_protocol.h       # formato dos pacotes + CRC16
│   ├── ring_buffer.h           # buffer estático
│   └── sensor_calibration.h    # estatística, normalização e filtro
└── diagnostics/
    └── flex_calibration_probe.ino

tests/                           # testes host-side do core
mechanics/
└── gauntlet.scad                # primeira estrutura em OpenSCAD

web/                             # interface de apoio
docs/                            # anotações técnicas
```

## Hardware planejado

A primeira montagem física deve ser pequena. Não quero colocar sensores só para aumentar a lista de componentes.

A base que faz sentido testar primeiro é:

- ESP32;
- um sensor flex ou outro sensor de dobra;
- IMU para orientação/movimento;
- motor de vibração;
- LED(s) de estado;
- bateria e leitura de tensão.

Depois dessa etapa, dá para decidir se reconhecimento de gestos mais elaborado, BLE/Wi-Fi, sEMG ou atuadores adicionais realmente melhoram o projeto.

## Protocolo

A comunicação serial não usa texto no firmware mais recente. `firmware/core/packet_protocol.h` define um pacote binário com cabeçalho, versão, tipo, sequência, payload e CRC.

Isso deixa mais fácil detectar pacote corrompido e manter compatibilidade quando novos campos forem adicionados.

O sketch de calibração usa texto serial de propósito porque é uma ferramenta de bancada separada; ele não altera o protocolo de runtime.

## Mecânica

`mechanics/gauntlet.scad` é o começo da parte física. O modelo ainda não deve ser tratado como peça pronta para impressão: medidas, encaixes, acesso à eletrônica e conforto só podem ser fechados depois de testar componentes reais.

## Interface web

A interface pode ser aberta sem build:

```bash
cd web
python -m http.server 8000
```

Depois, abra `http://localhost:8000`.

Ela serve como apoio para visualizar o estado do protótipo. Não é a parte principal do projeto.

## Tecnologias

| Parte | Tecnologia |
|---|---|
| Microcontrolador | ESP32 |
| Firmware | C++ / Arduino |
| Agendamento | FreeRTOS |
| Comunicação | Serial + protocolo binário |
| Mecânica | OpenSCAD |
| Interface | HTML, CSS e JavaScript |

## Próximos testes

1. montar ESP32 + primeiro sensor flex;
2. rodar o calibration probe em pelo menos 5 sessões;
3. confirmar frequência, ruído, span e repetibilidade após recolocar o wearable;
4. calibrar valores mínimos/máximos só depois desses dados;
5. adicionar IMU mantendo timestamp sincronizado com o flex;
6. validar o pacote serial com um receptor real;
7. testar feedback por vibração;
8. ajustar o modelo da manopla às dimensões dos componentes.

Quero manter cada etapa pequena o suficiente para saber o que realmente funcionou em hardware, em vez de construir toda a arquitetura antes da primeira montagem física.
