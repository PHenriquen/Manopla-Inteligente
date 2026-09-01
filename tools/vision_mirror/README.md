# Vision Mirror

Primeira entrada alternativa da Manopla Inteligente. A webcam detecta uma mão,
classifica os cinco dedos, estabiliza mudanças rápidas e publica quadros JSON no
formato `gauntlet.control.v1`.

O objetivo não é substituir os sensores da manopla. A câmera permite desenvolver
e demonstrar a camada de controle antes de toda a eletrônica física estar pronta.

## Executar

```bash
python -m venv .venv
# Windows: .venv\Scripts\activate
# Linux/macOS: source .venv/bin/activate
pip install -r tools/vision_mirror/requirements.txt
python tools/vision_mirror/vision_mirror.py
```

Pressione `Q` ou `Esc` para encerrar. Cada quadro estável também aparece como uma
linha JSON no terminal.

Para encaminhar os mesmos eventos por UDP:

```bash
python tools/vision_mirror/vision_mirror.py --udp-host 127.0.0.1 --udp-port 8765
```

## Contrato inicial

```json
{
  "schema": "gauntlet.control.v1",
  "source": "vision",
  "sequence": 42,
  "timestamp_ms": 1788210000000,
  "handedness": "Right",
  "fingers": {
    "thumb": true,
    "index": true,
    "middle": false,
    "ring": false,
    "pinky": false
  },
  "finger_mask": 3,
  "roll_deg": 8.4,
  "gesture": "custom",
  "confidence": 0.97
}
```

`finger_mask` usa os bits 0–4 para polegar, indicador, médio, anelar e mínimo.
Essa representação simples pode ser produzida pela câmera agora e pelos sensores
flex/IMU depois.

## Testes sem câmera

```bash
python -m unittest discover -s tools/vision_mirror/tests -v
```

Os testes cobrem a geometria, o contrato JSON e a estabilização temporal sem
instalar OpenCV ou MediaPipe.
