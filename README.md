# MANOPLA INTELIGENTE

A **Manopla Inteligente** é um projeto pessoal de IoT, sistemas embarcados, hardware e prototipagem inspirado nas interfaces tecnológicas do Homem de Ferro. O objetivo é explorar controle por gestos, feedback tátil e visual, telemetria e integração entre firmware, estrutura física e interface web.

## Visão do projeto

A proposta é construir um protótipo apresentável e tecnicamente sólido que demonstre integração entre hardware, firmware, software, modelagem 3D e experiência de uso.

O projeto começa com uma base digital e embarcada que pode evoluir gradualmente até um protótipo físico completo, sem depender de todos os componentes desde a primeira versão.

## O que esse projeto representa

- IoT e sistemas embarcados
- Desenvolvimento de firmware para ESP32
- Reconhecimento e interpretação de gestos
- Controle de LEDs e feedback por vibração
- Modelagem 3D da estrutura da manopla
- Interface web para visualização de estado e controle
- Integração entre hardware e software

## Estratégia de desenvolvimento

A primeira versão é estruturada em quatro frentes:

1. Estrutura mecânica em modelo 3D
2. Firmware inicial para ESP32
3. Interface web funcional para simular e acompanhar a operação
4. Documentação de evolução para sensores e hardware físico

Essa abordagem permite validar lógica, arquitetura e experiência antes de investir em todos os componentes do protótipo.

## Estrutura do repositório

- `firmware/`: firmware inicial para ESP32
- `mechanics/`: modelo 3D em OpenSCAD
- `web/`: interface web interativa para demonstração e controle
- `docs/`: arquitetura e roadmap de hardware

## Como executar a interface web

Abra o arquivo `web/index.html` em um navegador ou use um servidor simples:

```bash
cd web
python -m http.server 8000
```

Depois acesse:

```text
http://localhost:8000
```

## Tecnologias previstas

- ESP32
- C++ / Arduino
- OpenSCAD
- HTML, CSS e JavaScript
- sensores de movimento e toque
- LEDs e motor de vibração

## Objetivo de portfólio

A Manopla Inteligente foi pensada para demonstrar uma frente complementar ao desenvolvimento de software tradicional: sistemas embarcados, prototipagem, integração com sensores e construção de uma interface digital ligada a um dispositivo físico.
