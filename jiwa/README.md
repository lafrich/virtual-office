# JIWA.EXE — Context-driven Mechanics Studio (Foundation v2)

JIWA is the fourth Membangun program. It reads **saved Semesta City Drafts** from the existing same-origin `VLCityDrafts` API (IndexedDB database `virtual-life-city-drafts`) without rewriting city geometry.

- Open `https://lafrich.github.io/virtual-office/jiwa/` or select JIWA.EXE in Membangun.
- The **GLOBAL FOUNDATION** option works even before saving a Semesta city. Global context defaults are copied into a newly edited city (each city can then have independent overrides). Existing saved city projects are never silently rewritten.
- The **CONTEXT** tab contains survival, economy, progression, housing, morality and social presets with editable **WHEN (event), WHERE (object tag/ID), IF (conditions), THEN (effects)** rules. New custom contexts can also be created. Bind a context to the currently selected Semesta object using **USE SELECTED OBJECT**.
- **TRY THIS CONTEXT** runs isolated, atomic sandbox scenarios; results appear in the existing TEST tab. Scenarios cover zero-wallet/energy, bag full, owner-only Cove access, unverified events and relationship prerequisites.
- Current foundation default balancing in sandbox: bag **8** slots, wage cap **Rp6.000 per game-day**, online course cap **150 XP per game-day**, crossing **−2 energy once per completion ID**, basic job **Rp3.000** and warteg meal **Rp2.500**. All values are stylized balancing proposals and are editable where appropriate, not a claim about real-life prices.
- Social/referral opportunities remain **disabled by default**; the phone/status/bag/Action HUD of Virtual Life is preserved, not redesigned.

- In Semesta, choose **Save City** (unsaved working-copy edits are not automatically included). The **JIWA / MECHANICS** control near Active Asset opens JIWA with that city and selected object.
- Choose a saved city and click a placed object or an interior item. JIWA reads nested `interior.floors[].items[]` as virtual selection entries under a stable composite ID; it does not mutate their physical placement.
- Configure reusable built-in and user-saved templates, a set of action rules, triggers, conditions, animation IDs and effects. Object-specific overrides use the Semesta object ID, not their asset file name.
- `SAVE RULES` persists a separate `jiwa-mechanics-v1` IndexedDB project per city. Data stays local to the current browser/profile/origin, with a localStorage fallback.
- `EXPORT` saves a standalone mechanics JSON; `IMPORT` requires the same city ID and validates supported rule fields.
- **Play Test** locally simulates wallets, needs, inventory, and quest flags with an event log. Effects and animation names in this mode are simulation data only.

**Not yet a production gameplay runtime:** JIWA does not change live Virtual Life accounts, online NPC behaviors, multiplayer inventory/economy, or the encrypted production game. The isometric world view is a schematic generated from the real saved object positions (not a duplicate of Semesta's 3D renderer). The new foundation context editor, including donations, worship, housing rights, moral and referrals, is **editor/sandbox only** until the runtime server consumes validated events. True runtime dispatch, verified rig playback, permission-controlled publishing and server-authoritative multiplayer state are separate integration milestones. Unrecognized gameplay code is never evaluated.

Integration files: `jiwa/index.html`, `jiwa/jiwa.js`, `world-builder/jiwa-link.js`, `membangun/index.html`.
Context files: `jiwa/foundation-engine.js` (pure rule logic), `jiwa/context-editor.js` (Windows XP style editor), `tests/jiwa-foundation-runtime.test.cjs` (state invariants), `jiwa/FUNDAMENTAL_FLOW_V2.md` (design contract). To run local tests: `node --test tests/jiwa-foundation-runtime.test.cjs`.
