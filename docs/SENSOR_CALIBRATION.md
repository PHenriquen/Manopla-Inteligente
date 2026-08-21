# Sensor calibration foundation

Esta etapa existe para responder uma pergunta antes de tentar reconhecer gestos: **o primeiro sensor produz um sinal repetível e separado o suficiente entre duas posturas?**

A arquitetura evita colocar classificação/ML cedo demais. O firmware principal continua transmitindo `flex_raw`; a calibração nova vive em primitives reutilizáveis e em um sketch de diagnóstico separado.

## Princípios adotados

### 1. Encaixe e posição importam

Wearables de pulso comerciais tratam ajuste físico como parte da qualidade do sinal. O TapXR, por exemplo, recomenda que a pulseira fique justa, sem deslocamento lateral e próxima à articulação da palma. Para a Manopla, isso vira uma regra de teste: qualquer comparação entre sessões só vale se o sensor estiver preso na mesma posição e tensão mecânica.

Referência: TapXR — How To Wear / Put On Your TapXR
https://support.tapwithus.com/hc/en-us/articles/17257867512091-How-To-Wear-Put-On-Your-TapXR

### 2. Movimento e gesto são problemas de sinal, não só de threshold

Produtos como TapXR continuam publicando melhorias específicas de estabilidade, precisão e detecção em movimento. Isso é um lembrete útil: um gesto que funciona parado pode falhar com o braço se movendo. Por isso o primeiro gate mede ruído e separação antes de criar thresholds de gesto.

Referência: TapXR firmware changelog
https://www.tapwithus.com/changelog/

### 3. IMU é complementar, não desculpa para pular a calibração

A documentação atual da Espressif mantém uma camada dedicada de IMU/sensor hub e suporta sensores inerciais comuns. A direção futura da Manopla continua sendo flex + IMU, mas cada modalidade deve ter sua própria aquisição e validação antes da fusão.

Referência: ESP-IoT-Solution sensor/IMU documentation
https://docs.espressif.com/projects/esp-iot-solution/en/latest/

### 4. Não partir direto para sEMG/ML

Pesquisa recente de interfaces neuromotoras mostra o potencial enorme de sEMG no pulso, inclusive para pose e typing. Ao mesmo tempo, os resultados dependem de muito dado, posicionamento e generalização entre usuários. Isso faz sEMG ser uma possibilidade futura, não requisito do MVP.

Referência: Meta — open sEMG datasets for pose estimation and surface typing
https://ai.meta.com/blog/open-sourcing-surface-electromyography-datasets-neurips-2024/

## O que foi adicionado

`firmware/core/sensor_calibration.h` contém:

- `RunningStats`: média, desvio-padrão, min/max e peak-to-peak sem alocação dinâmica;
- `FlexCalibrationProfile`: centro de repouso, centro de flexão, ruído, span e normalização 0..1;
- `build_flex_profile`: gate simples por número de amostras, amplitude mínima e relação sinal/ruído;
- `LowPassFilter`: filtro IIR de primeira ordem para experimentos posteriores.

Nada disso altera o pacote binário existente.

## Primeiro teste físico

Abra `firmware/diagnostics/flex_calibration_probe.ino` no ambiente Arduino/ESP32 e grave no dispositivo.

O sketch coleta:

1. 3 segundos em repouso a 100 Hz;
2. 3 segundos na postura dobrada a 100 Hz;
3. média, desvio-padrão, min/max e peak-to-peak de cada janela;
4. span entre posturas e uma razão simples sinal/ruído;
5. um `valid=yes/no` conservador para orientar a próxima iteração.

Os thresholds atuais são apenas gates de engenharia para o primeiro protótipo:

- pelo menos 50 amostras por postura;
- span de pelo menos 180 counts no ADC de 12 bits;
- signal-to-noise de pelo menos 6x.

Eles **não são especificação final**. Devem ser ajustados com dados reais de várias sessões.

## O que registrar em cada sessão

- sensor e resistor usados;
- alimentação;
- pin do ADC;
- posição física do sensor;
- forma de fixação;
- `REST mean/stddev/p2p`;
- `BENT mean/stddev/p2p`;
- `span`;
- `snr`;
- se o resultado se repete depois de retirar e recolocar a Manopla.

## Gate antes de reconhecer gestos

Não criar uma lista grande de gestos ainda. Primeiro confirmar:

- duas posturas separáveis em pelo menos 5 sessões;
- comportamento semelhante após recolocar o wearable;
- ausência de saturação perto de 0 ou 4095;
- ruído aceitável com o braço parado;
- medir de novo com o braço em movimento.

Depois disso, o próximo incremento deve ser IMU + timestamp sincronizado. Só então vale testar features/heurísticas para gestos dinâmicos.
