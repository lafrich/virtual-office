# JIWA.EXE — Mechanics Studio

JIWA is the fourth Membangun program. It reads **saved Semesta City Drafts** from the existing same-origin `VLCityDrafts` API (IndexedDB database `virtual-life-city-drafts`) without rewriting city geometry.

- Open `https://lafrich.github.io/virtual-office/jiwa/` or select JIWA.EXE in Membangun.
- In Semesta, choose **Save City** (unsaved working-copy edits are not automatically included). The **JIWA / MECHANICS** control near Active Asset opens JIWA with that city and selected object.
- Choose a saved city and click a placed object or an interior item. JIWA reads nested `interior.floors[].items[]` as virtual selection entries under a stable composite ID; it does not mutate their physical placement.
- Configure reusable built-in and user-saved templates, a set of action rules, triggers, conditions, animation IDs and effects. Object-specific overrides use the Semesta object ID, not their asset file name.
- `SAVE RULES` persists a separate `jiwa-mechanics-v1` IndexedDB project per city. Data stays local to the current browser/profile/origin, with a localStorage fallback.
- `EXPORT` saves a standalone mechanics JSON; `IMPORT` requires the same city ID and validates supported rule fields.
- **Play Test** locally simulates wallets, needs, inventory, and quest flags with an event log. Effects and animation names in this mode are simulation data only.

**Not yet a production gameplay runtime:** JIWA does not change live Virtual Life accounts, online NPC behaviors, multiplayer inventory/economy, or the encrypted production game. The isometric world view is a schematic generated from the real saved object positions (not a duplicate of Semesta's 3D renderer). True runtime dispatch, verified rig playback, permission-controlled publishing and server-authoritative multiplayer state are separate integration milestones. Unrecognized gameplay code is never evaluated.

Integration files: `jiwa/index.html`, `jiwa/jiwa.js`, `world-builder/jiwa-link.js`, `membangun/index.html`.