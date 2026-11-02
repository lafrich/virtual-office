# World Map Builder — AI/Mechanics Handoff Contract

The editor exports a **data-only** document. The online game does not consume this document yet. An AI or developer may use it as a design specification, but must not treat *proposed* hooks as executable or confirmed gameplay.

## Coordinate system and appearance

- `format = "virtual-life-world-builder-v1"` (for backward-compatible import)
- `schema = "virtual-life-ai-map-v2"`; `version = 5`
- `map.projection.type = "iso-2:1"`, `tilePixels=[64,32]`
- `map.projection.groundCoordinates = "c/r"`: `objects[].x` = c, `objects[].z` = r. `objects[].y` is vertical world height.
- Sprite frame reference is **64×112** with **pivot (32,100)**. Orthographic camera at 30° elevation, no perspective zoom distortion.
- Prefab sizes and rotations come from manifest metadata; scale is uniform only.
- Some original GPT assets require an authenticated session and some Pipeline image outputs are missing. `assetSource` and `assetPublished` report provenance; code must **not** silently interpret provisional art as final.

## Object types and AI fields

| Field | Meaning |
|---|---|
| `id` | Stable unique map-scoped identifier |
| `type` | `sprite`, `avatar`, `npc`, `marker` or legacy study shape |
| `asset` | Asset reference; `pipeline:...`, `vegetation:...`, or original GPT relative path |
| `assetSource` | Provenance: `pipeline-street`, `pipeline-vegetation`, `gpt-original`, `editor-marker`, etc. |
| `layer` | `structure`, `prop`, `vegetation`, `interior`, `character`, `marker` |
| `subtype` | Building, furniture, vegetation species, or marker subtype |
| `x,z,y` | Ground plane c/r coordinates plus height |
| `footprint` | Authored occupancy footprint `{w,d}` in map cells |
| `collision` and `blocking` | Suggested nav obstacle flag, not runtime physics |
| `tags` | Searchable human-friendly semantic tags |
| `interactions` | Suggested verbs, e.g. `enter`, `sit`, `buy`, `dispose` |
| `capacity` | Suggested occupancy count |
| `entranceFacing` | Optional `sw/se/ne/nw`; blank means **unverified** |
| `entrance` | Exported only when entrance facing is explicitly set; offset is a candidate, not a real door collider |
| `markerKind` | `spawn`, `entrance`, `interaction`, `patrol`, `trigger` |
| `notes` | Plain human-readable development notes |
| `interactionHooks` | Explicitly `{kind:"proposed",enabled:false}`; downstream integration must decide how to implement |

## Example

```json
{
  "format": "virtual-life-world-builder-v1",
  "schema": "virtual-life-ai-map-v2",
  "version": 5,
  "map": { "name": "My Map", "projection": { "type": "iso-2:1", "tilePixels": [64,32] } },
  "objects": [
    {
      "id":"park-bench-01",
      "type":"sprite",
      "asset":"pipeline:bangku_taman",
      "assetSource":"pipeline-street",
      "assetPublished":false,
      "name":"Bangku Taman",
      "x":12,"z":31,"y":0,"rotation":0,"scale":1,
      "footprint":{"w":2,"d":1},
      "collision":true,"blocking":"auto",
      "layer":"prop","subtype":"bangku_taman",
      "tags":["park","outdoor"],"interactions":["sit"],
      "capacity":2,"markerKind":"","entranceFacing":"","notes":"",
      "interactionHooks":[{"id":"sit","kind":"proposed","enabled":false}]
    }
  ]
}
```

`assetPublished:false` indicates the **independent sprite image is not yet available** from the pipeline source. The object's layout metadata is still useful for AI logic authoring; do not render an invented image as a final asset.

## Downstream AI integration tasks

1. Read the exported JSON and validate identifiers, source assets, footprint, collision and world bounds.
2. Resolve `asset` through an **approved native asset registry**, not a guessed URL. Encrypted GPT assets stay under the original game's existing security and login system.
3. Project footprint and entrance coordinates onto the original game's c/r grid. Verify any candidate entrance or trigger using production art before activation.
4. Build separate navigation grids, physics callbacks and NPC behaviors only after approval. A `markerKind:"trigger"` is a point annotation, **not** an executable zone.
5. Bind interactions to gameplay services (job, wallet, inventory, multiplayer) separately. Do not modify production save state from the builder.
6. Roundtrip export/import tests and compare visually with the authenticated game's canonical map before promoting to multiplayer.

The new 32-object default map is deliberately a mapping study, **not** a production-faithful copy of all Street2 buildings.
