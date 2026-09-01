# Modo espelho e teleoperação

O modo espelho acrescenta uma segunda entrada ao projeto: além dos sensores da
manopla, uma webcam pode produzir estados de mão compatíveis com a futura camada
de controle.

## Por que existe

O firmware atual já coleta telemetria, mas o hardware físico ainda está em
validação. A visão permite desenvolver gestos, interface e consumidores sem
inventar medições de sensores que ainda não foram realizadas.

A inspiração funcional veio do projeto
[pathofseb/RoboticArm](https://github.com/pathofseb/RoboticArm). A implementação
deste repositório é independente: nenhum código foi copiado e o projeto de
referência não declara licença no GitHub.

## Arquitetura proposta

```text
sensores flex + IMU ─┐
                    ├─> gauntlet.control.v1 ─> interface / simulador / dispositivo
câmera + MediaPipe ──┘
```

As duas entradas não precisam compartilhar a aquisição. Elas compartilham o
significado do resultado:

- estado dos cinco dedos;
- máscara binária compacta;
- rotação estimada da mão;
- gesto reconhecido;
- confiança e origem do dado.

## Entrega atual

`tools/vision_mirror` contém:

- rastreamento de uma mão por MediaPipe;
- classificação independente dos cinco dedos;
- gestos iniciais: mão aberta, punho, apontar e pinça;
- histerese de três quadros contra oscilações rápidas;
- suavização da rotação;
- saída JSON Lines no terminal;
- envio UDP opcional;
- testes da geometria e do contrato sem câmera.

Essa fase ainda não movimenta atuadores. O destino UDP é uma fronteira simples
para conectar depois o configurador 3D ou um protótipo externo.

## Evolução: Vision Node

A referência de óculos experimentais
[F.L.I.R.T.](https://www.instagram.com/reel/DadZGIAspmi/) mostra um caminho para
tirar a visão do computador: uma placa compacta como a
[Arduino Nicla Vision](https://docs.arduino.cc/hardware/nicla-vision) pode
processar câmera, IMU e distância localmente e transmitir apenas o resultado.

No projeto, isso seria um módulo opcional e separado:

```text
câmera embarcada -> gesto local -> gauntlet.control.v1 -> manopla / HUD / simulador
```

O primeiro passo continua sendo a webcam porque é mais barata e fácil de depurar.
Uma placa embarcada só será escolhida depois de medir o modelo e a latência. Um
display transparente seria apenas uma saída para estado, gesto e telemetria.

A aplicação não precisa identificar pessoas nem inferir atração ou emoção. O
padrão aproveitado da referência é processamento local + HUD, com privacidade por
padrão e sem armazenar imagens.

## Próximas integrações

1. fazer o configurador 3D consumir `gauntlet.control.v1`;
2. criar no ESP32 o mesmo quadro a partir do sensor flex e da IMU;
3. medir latência e estabilidade das duas fontes;
4. definir um receptor com watchdog e estado neutro ao perder comunicação;
5. somente depois testar uma mão robótica externa ou painéis articulados.

## Limite mecânico

Atuadores de alto torque não devem fechar peças diretamente contra os dedos de
quem veste a manopla. A teleoperação prevista usa um dispositivo externo; partes
móveis vestíveis devem ser leves, limitadas e incapazes de prender a mão.
