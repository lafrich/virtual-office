# Virtual Life — Asset Pipeline notes

The original [Virtual Life Asset Pipeline](https://lafrich.github.io/virtual-life-asset-pipeline/#rigs) remains an **independent asset authoring and preview service**. Semesta, Bangun Ruang, Membangun, jiwa.exe, and Emotion Studio load pipeline assets from that origin directly.

The unused encrypted Virtual Life playback (`arsip.html` / decrypted `office.html`) was removed from this repository. The opt-in in-game inspector that used to be injected into `office.html?assetbridge=1` (`game-assets/asset-bridge.js` and `game-assets/rig-runtime.js`) went with it. Package A / v16a in-SW patches were cancelled and are not deployed.

The experimental Cove Room addon remains deleted (`cove-reskin.js` is gone; `?cove=1` does nothing). The unrelated `/rebuild/` test game stays retired.

Encrypted original **images** used by Semesta’s Virtual Life Assets vault (`manifest.enc` and `b/*.enc`) are unchanged. The Cloudflare Worker is unchanged.

## Tests

```bash
node --check sw.js
node tests/asset-bridge.test.cjs
node --test tests/root-launcher.test.cjs
```

## L3D native-mesh sidecar pipeline (November 2026)

L3D.EXE (`/l3d/`) provides a standalone Three.js 3D and JSON viewer alongside
the original 2D/pixel pipeline. It supports GLB, glTF, OBJ/MTL, FBX imports and
an LFC six-textured-face box. It exports versioned
`semesta-l3d-asset-v1` JSON (embedded `Object3D.toJSON()` scene).

The local user library is shared between L3D and Semesta on the same origin
via `shared/l3d-library.js` and `world-builder/l3d-intake.js`.
Semesta lists these under **L3D / 3D MESH** and instantiates Three.js
`ObjectLoader` meshes in the ordinary scene with native depth testing,
ground pivot at Y=0 and canonical isometric coordinates.

2D sprites, native depth PNGs, LGR Genesis and protected game assets are
unmodified. Native 3D vehicles placed through this v1 path are static props;
dynamic driving/AI integration is future work. Saved browser library is
**local only**; portable transfer uses Export/Import JSON. No automatic
Google Drive write/publish or replacement of pipeline sprites is implied.

See `l3d/README.md` and `tests/l3d-integration.test.cjs`.
