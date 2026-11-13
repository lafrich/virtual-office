# L3D.EXE — 3D Model + JSON Studio for Semesta

L3D is an additional native mesh authoring route. Existing Semesta pixel planes,
published v6b sprites and LGR Genesis are **not migrated or overwritten**.

## Links

- L3D.EXE: https://lafrich.github.io/virtual-office/l3d/
- Membangun: https://lafrich.github.io/virtual-office/membangun/
- Semesta: https://lafrich.github.io/virtual-office/world-builder/

## Author workflow

1. Open L3D.EXE from Membangun or from Semesta's Asset Panel.
2. Import a .glb, .gltf, .obj (+ .mtl/texture files), or .fbx model.
   You can select all companion files together; local-only preview.
3. Or click **NEW LFC BOX** and assign six textures: right, left, top,
   bottom, front, back. A single texture image cannot supply hidden faces.
4. Set ID, name, category, footprint width/depth and total model height,
   measured in Semesta world **tile units**. Use **FIT MODEL TO FOOTPRINT**.
   L3D auto-centers the mesh to the ground footprint, with ground at Y = 0.
5. **SAVE TO SEMESTA** saves into local browser storage under
   `virtual-life-l3d-library-v1` and publishes an `objects` hub event.
   Reload Semesta (same browser and origin) and choose
   **FILES → L3D / 3D MESH** to place the object.
6. For backup, cross-device transfer or large models, use
   **EXPORT ASSET JSON**. Import the JSON back into L3D with **OPEN JSON**,
   then SAVE TO SEMESTA in the target browser.

## Format

```json
{
  "format": "semesta-l3d-asset-v1",
  "version": 1,
  "id": "bus_tj_3d",
  "name": "TransJakarta 3D",
  "kind": "vehicle",
  "footprint": [7.5, 2.3],
  "height": 3.1,
  "collision": true,
  "coordinateSystem": "semesta-xz-yup",
  "pivot": "ground-center",
  "model": {"metadata": {"type": "Object"}, "object": {}}
}
```

`model` is serialized Three.js Object3D JSON (`Object3D.toJSON()`),
including supported geometry/material/texture references; illustrative
example above is **not** a valid renderable model.

Semesta catalogs these assets as `source: "l3d-3d"`, file key
`l3d:<id>`, and scene object `type: "sprite"` for map schema backward
compatibility. It uses `ObjectLoader` for **real mesh depth**; 90° yaw
rotation and existing world coordinates still apply. The original 2D
sprite rendering remains its own separate path.

## Limits / non-goals (v1)

- Static mesh placement only. Vehicle category is metadata and does not
  automatically attach the road-traffic AI/controller to the model.
- Cross-browser/cloud sync is **not automatic** yet; the library uses
  same-origin `localStorage`, not Google Drive. Export/import JSON is
  the portable transfer path. Browser storage can be small (~5MB).
- Large model/texture files can exceed the storage quota: export JSON
  and optimize or simplify before saving locally.
- Mesh editor is for import, pivot/scale alignment, material faces and
  inspection. Full vertex editing, skinning, FBX animations and level
  system are not part of v1.
- Imported models and raw JSON are treated as local authored content;
  the model is not deployed as a repository-wide public asset by saving
  in browser. A later published catalog would be a separate opt-in step.

## Smoke tests

```bash
node --test tests/l3d-integration.test.cjs tests/membangun-launcher.test.cjs
```
