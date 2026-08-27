# Configurador modular

O configurador é uma maquete digital interativa da arquitetura vestível. Ele ajuda a discutir camadas, acessos e substituição de módulos antes de existir CAD confiável. A geometria atual é original e conceitual: não define medidas, tolerâncias, ergonomia ou segurança para fabricação.

## Arquitetura

- `web/modules.js` é o catálogo independente da interface;
- `web/app.js` converte cada item do catálogo em uma peça 3D e controla seleção, visibilidade e animação;
- `web/index.html` organiza montagem, visualizador e inspetor;
- `web/styles.css` concentra a linguagem visual e os estados responsivos.

Cada módulo possui um `id` estável, código de montagem, camada, função, estado de maturidade, geometria, pose montada e deslocamento do modo explodido. `motion` é opcional e representa apenas uma hipótese de abertura digital.

## Executar

```bash
npm install
npm run dev
```

O endereço local é informado pelo Vite. Para conferir o pacote de produção:

```bash
npm test
npm run build
npm run preview
```

## Adicionar uma peça

1. Inclua um item em `modules` com identificador e código inéditos.
2. Escolha uma camada existente e uma geometria suportada (`box`, `board`, `strip` ou `cylinder`).
3. Defina `size`, `position`, `rotation` e `explode` com três valores cada.
4. Descreva função e maturidade sem afirmar validação física inexistente.
5. Execute os testes e confira seleção, isolamento e camadas no navegador.

Para substituir uma peça conceitual por um modelo real, preserve o `id` do módulo. A próxima evolução prevista é aceitar uma origem glTF/GLB no catálogo e carregar o arquivo sem acoplar a geometria à interface.

## Adicionar uma animação

Acrescente `motion.position` e `motion.rotation` ao módulo. Os valores representam a pose aberta, interpolada a partir da pose montada. A animação serve para comunicar intenção de acesso; não comprova curso, dobradiça, folga ou resistência mecânica.

## Decisões físicas pendentes

- medidas reais do antebraço e dos componentes;
- placa controladora e conectores;
- bateria, proteção elétrica e dissipação;
- método de fixação, limites de abertura e acesso de manutenção;
- distribuição de massa, contato com a pele e materiais;
- tolerâncias de fabricação e protocolo de testes.

Essas decisões entram no modelo somente depois de medição e validação em bancada. Até lá, a experiência permanece uma simulação digital segura.
