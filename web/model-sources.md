# 3D asset provenance

This file keeps license and attribution information out of the main fabrication interface while still preserving the provenance required by the source assets.

The web UI intentionally does **not** display creator cards, asset credits, marketplace links, triangle marketing data, or platform branding. It focuses only on the project and fabrication controls.

## Full suit / gauntlet section

- Model: IronMan
- Creator: sanfree
- Original source: Sketchfab model `226773abb03243a9b64f548332aa4f3a`
- License embedded in the glTF: CC-BY-4.0
- Runtime copy currently loaded from a public GitHub mirror of the exported glTF.
- The Gauntlet module uses an isolated arm/hand region of this same visual model rather than a separate unverified hand asset.

## Helmet

- Model: Ironman Mark III Helmet *free*
- Creator: Demonic Arts / Jesterz86
- Original source: Sketchfab model `71a03274781145699ac9f88d03609c43`
- License embedded in the glTF: CC-BY-4.0
- Runtime copy currently loaded from a public GitHub mirror of the exported glTF.

## Arc Reactor

- Model: Arc Reactor
- Creator: Ludus101
- Original source: Sketchfab model `7daf892988e54cdcb8bfd7dff3ed5d23`
- License embedded in the glTF: CC-BY-4.0
- Runtime copy currently loaded from a public GitHub mirror of the exported glTF.

## Fabrication-view policy

The native viewer may:

- select individual mesh parts;
- switch between original color, monochrome, print-preview and wireframe materials;
- isolate parts;
- visually separate an assembly with an exploded-view slider;
- move a selected part outward as an assembly preview;
- export the selected visual mesh as STL.

These controls do **not** claim that a source mesh is watertight, dimensionally calibrated, structurally safe, correctly toleranced, or suitable for a specific printer. Source dimensions are shown only in uncalibrated model units.

The project treats the Iron Man geometry as a display/cosplay-style visual assembly. It does not implement functional weapon mechanisms.

## Data policy

The interface must not present invented temperature, power, load, battery, telemetry or hardware state as real measurements. Random values are allowed only inside the explicitly labeled Diagnostics simulation.
