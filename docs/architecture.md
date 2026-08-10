# Arquitetura da Manopla Inteligente

## Visão geral

A **Manopla Inteligente** é um sistema composto por três camadas principais:

1. Camada física: manopla com sensores, LEDs, vibração e processamento embarcado
2. Camada de controle: firmware rodando em ESP32
3. Camada de interface: painel web para visualização de status e controle

## Arquitetura proposta

### 1. Sensores e atuação

- Sensor de movimento / gestos
- Sensor de pressão ou toque
- LEDs RGB para feedback visual
- Motor de vibração para feedback tátil
- Botão de potência e modos

### 2. Controle embarcado

O ESP32 será responsável por:

- ler sensores
- interpretar gestos básicos
- controlar LEDs
- acionar vibração
- enviar dados para a interface web

### 3. Interface web

A interface web pode exibir:

- estado da manopla
- gesto detectado
- potência e bateria simulada
- logs de eventos
- modo de operação

## Fluxo de operação

1. O usuário realiza um gesto
2. O firmware identifica o gesto
3. O sistema ativa LEDs e vibração
4. O estado é enviado para a interface web
5. A interface atualiza o painel em tempo real

## Estratégia de prototipagem

A implementação pode começar com:

- simulação de sensores em interface web
- firmware com lógica de estados bem definida
- documentação de integração futura com hardware real

Isso permite evoluir o projeto de forma incremental sem depender da compra imediata de todos os componentes físicos.
