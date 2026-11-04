# JIWA.EXE — Fundamental Gameplay Flow v2 (design contract)

Status: **proposed foundation / NOT deployed to production**, 2026-11-05. This document defines the contract between the existing Virtual Life game, Semesta, Bangun Ruang, Mahluk Hidup, and Jiwa. Do not replace existing phone, needs drawer, bag, or contextual Action UI.

## 1. Preserve existing interface and mechanics
- **World/HUD**: single contextual Action button at bottom-right; no added top bar, duplicate minimap, floating Life HUD, or tap-to-walk. Isometric 3D movement and crossing are already solved in Semesta.
- **Phone**: only digital functions: minimap, online courses, messages/referrals, notifications for offers; no bag inside phone and jobs are initiated at NPC/landmark.
- **Bag**: physical 8-slot inventory; upgrades to 12/16 deferred. Wallet separate from bag; furniture is delivered/placed in housing, not carried as ordinary scavenged inventory.
- **Status**: reuse existing needs display (fullness, energy, hygiene, bladder) and notifications drawer. Moral/reputation/social capital in expanded profile only, not four more always-visible HUD bars.
- **Actions**: preserve sit, stand, lie/sleep, toilet/shower, context-sensitive talk/work, and harmless fart idle action. Public urination only when actually facing a nearby wall. Risky/illegal actions require a deliberate option/hold, never the default short tap.

## 2. Ownership of systems
- **Semesta**: geometry, movement, road crossing detection, visible world events, collision, proximity, world object IDs, spawn location, 3D animation placement.
- **Bangun Ruang**: object capabilities, furniture interaction anchors, room templates.
- **Mahluk Hidup**: rig/animations/emotions and a universal animation ID registry.
- **Jiwa editor**: templates, rules, parameter balancing, eligibility, event→effects contract, simulation and validation.
- **Runtime server** (not implemented by the existing Jiwa authoring sandbox): authoritative wallet, bags, needs, daily limits, housing entitlements, relationships, job completions, and NPC memories. Jiwa JSON is configuration, not player save state.
- **AI NPC service (later)**: dialogue, memory retrieval, mood and proposed actions only; cannot mint money, approve housing, complete quests, set luck rolls or write unverified facts directly.

## 3. Canonical event lifecycle
`Intent -> contextual candidate resolution -> server validation -> atomic state transition -> persisted event -> visible effects -> NPC witness/memory -> HUD sync`.
Every state-changing request has `event_id`, `actor_id`, `world_id`, `game_day`, `occurred_at`, `object_id`, `event_type` and structured payload. Server rejects duplicate `event_id` and checks proximity, ownership, balances, cooldown, remaining quotas and capacity. Client animations run after success acknowledgement; optimistic visuals may rollback.

## 4. Fundamental player state
`PlayerState`: player_id, world_id, status(fullness,energy,hygiene,bladder), wallet, inventory(slots 8, stacks by item rules), skills and course XP/day, jobs and wage/day, moral dimensions, private relationships, reputation by locality/group, luck seed/roll context, housing entitlement, last_server_day, last_tick, quest flags, event cursor.
No duplicate wallet/need sources. Offline status decay remains frozen for the initial release as in existing staging, but a server-defined game day controls quota resets. Logging out cannot reset jobs, course XP, loot, or cooldowns.

## 5. A playable full-day loop
1. Spawn at an owned/active rented Cove room if permission exists; otherwise valid public homeless spawn. Never assume ownership because a city has a Cove.
2. Check needs and wallet in existing status/HUD. Phone minimap/course remain available, bag remains separate.
3. Walk to an NPC and hold-to-progress job, or scavenge a legal spawn and sell at Toko Loak. Only verified completion pays, once per job instance.
4. Spend on food/toilet/hygiene/rest with accessible low-cost/free routes. Skills grow from work and course separately; course cap stays 150 XP per server game day.
5. Explore; meeting people may create trust and later hidden referral offers, but AI NPC/social simulation may be locked while main survival path remains available.
6. Sleep or rest, next game-day server tick resets DAILY quotas but not money, owned items, personality, relationships, remembered history or housing entitlement.

## 6. Rules to eliminate known contradictions
**E1 Economy mismatch**: current Jiwa sandbox default wallet Rp80,000, job-template completion +Rp25,000 and food-template Rp15,000 are authoring demos, NOT live economy prices. Existing v15a daily work quota is around Rp6,000. Before publishing, use a SINGLE economy scale and automated daily-budget tests. For a stylized Rp6,000/day prototype, suggested test-only costs: staple meal Rp2,500, snack Rp1,000, free water and free public rest; sample minimum spending Rp3,500/day leaves Rp2,500 before housing. Do not call stylized prices real Indonesian market prices. Scavenging earnings separate and finite; Toko Loak stock demand, item condition and respawn cooldown prevent infinite money.
**E2 Survival softlock**: no money + energy zero is NOT game over and never makes the player unable to move. Keep crawl speed and a reachable public rest/water/low-tier income option; basic jobs cannot all be gated by skills, housing, or cleanliness. All needs at zero produce progressive debuffs, not permanent lock; bladder 100 retains the existing accident consequence.
**E3 Crossing**: Semesta emits `CROSSING_COMPLETED` once per crossing ID; Jiwa charges an example -2 energy only upon completion. No every-frame road cost; no charge again on collision reset, overlapping triggers or reconnect.
**E4 Time**: use server game_day for daily work quota/courses/loot/cooldowns. Use one configurable needs tick; do not let raw real time and accelerated game time independently decrement the same stat. For early release, status does not decay while offline.
**E5 Housing**: room spawn ONLY with active lease/ownership; room entry ONLY authorized players. If not housed, public homeless spawn; renting can bridge until full purchase feature ships. Never spawn in another player's room or a non-existent room. Furniture placement tied to room ID and owner/tenant permissions.
**E6 Inventory/payment**: validate money and free slot BEFORE purchase; atomic debit + grant. Scavenge item must exist and be unclaimed; sale consumes actual owned item and pays once. Stackability and reservation of quest items are explicit. A failed action changes nothing.
**E7 Action collision**: proximity and eligible contexts are resolved in a stable order: critical exit / accessible object -> NPC talk/job -> chair/bed/toilet/shower -> legal pickup -> optional wall pee -> default fart. If multiple valid actions overlap, tapping uses primary and long-press shows alternatives. Validate again on press; cancel if player walks away.
**E8 Moral vs observed reputation**: morality responds to verified actions irrespective of witnesses; reputation and NPC memories update only after witnessed events, a credible report, or other justified knowledge. Hearsay is stored as uncertain belief, not fact; no global telepathy.
**E9 Moral vs luck**: no direct guaranteed rewards for high morality. A modest, capped moral influence may change socially mediated positive-encounter rolls; finding random loot uses location, skill and independent RNG. Prayer does not equal morality; charity costs real resources, anonymous giving does not grant public reputation, per-target and per-day anti-farming checks apply.
**E10 Careers**: each job lists public/basic or hidden/referral, hard qualifications, optional gates, reward and cooldown. Skill thresholds for legally credentialed roles cannot be bypassed by a friend; rare referrals reveal offers only, not automatic salaries. Core survival always has at least one public earning path.
**E11 NPC behavior**: shared NPC identity/personality per world, relationship & memory scoped per actor and individual player; reflection changes traits slowly from diverse evidence. NPC cannot know hidden transactions or private conversations unless witnessed/told.
**E12 Multiplayer authority**: no IndexedDB/localStorage or decrypted client bundle may serve as authority for money, skills, moral, housing access, item uniqueness, job completion, or AI memory. Existing Jiwa `SAVE RULES` is editor draft, not production publish.
**E13 Job naming**: NPC named "Pak Ogah" and job type "Pak Ogah/parking attendant" must have independent IDs to avoid mixing employer, role and task.
**E14 Map revisions**: stable object ID + city revision + action binding migration; removed or replaced objects create orphan-binding warnings, not silent mechanics loss.
**E15 Death/reset**: the early game has no death/permadeath loop; accident/vehicle collision relocates to a safe position without duplicating loot, paying wages twice, or resetting daily quota.

## 7. Evolving social and career layer, without gating the current release
- Phase A: deterministic moral events, trust, witnessed reputation and hidden offers (no LLM required).
- Phase B: AI dialogue/memory attached to verified events; NPC personality grows with delayed reflection, not every text message.
- Phase C: NPC-to-NPC social propagation, rumors, institution/religious context, advanced jobs and underworld routes.
- If social remains locked, all core jobs, scavenging, public needs recovery and basic housing still work.

### Opportunity eligibility
`eligible = prerequisite_skills && (public_access || valid_referral) && availability && not_expired && no_active_duplicate`.
If eligible, server performs a bounded, auditable RNG selection with optional relevant relationship/reputation influences. Luck affects chance of **hearing about** a rare offer, not fake qualifications or guaranteed job outcomes. Offers appear as messages on phone but are accepted/started at an NPC/location.

## 8. Jiwa UX editor modules
1. **Core / Needs**: decay, activity recovery, emergency floor, crossing cost; status bar binding.
2. **Economy / Inventory**: price scale, earnings cap, cooldowns, 8-slot rules, item stacks, Toko Loak demand.
3. **Jobs / Skills**: job start/finish progress, XP/day, entry criteria, public/referral offers.
4. **Housing**: lease/owner ACL, public homeless spawn, furnishings.
5. **Morality / Spirituality**: action consequences, belief not treated as objective morality, worship as optional spiritual/mood activity, charity as actual debit.
6. **Social / Luck**: reputation by audience, trust thresholds, hidden opportunity weighting; disabled until planned unlock.
7. **NPC Intelligence**: personality, memory, behavior, witness rules; disabled until runtime ready.
8. **Test / Debug**: simulate an isolated day, export event log, state diff, why blocked, undo sandbox; NEVER publish test state as live account data.

## 9. Acceptance tests before enabling in production
- Salary cap applies once across NPCs; repeated work request with same completion ID pays once.
- Meal is unaffordable => no wallet/needs change; full inventory => pickup/buy changes nothing.
- Selling once removes item once and deposits funds once; overlapping clicks cannot dupe.
- Crossing completed repeated 30 frames => -2 energy total; collision reset => zero crossing charge.
- Energy=0, wallet=0, no home => still able to slowly reach free recovery and basic income.
- Changing player, device or browser does not reset server wallet, quest, course XP or housing entitlement.
- Day tick resets daily wage/course cap exactly once; reconnect does not reset.
- Entering Cove room without entitlement is blocked; owner respawn valid after reconnect; homeless spawn otherwise.
- Anonymous donation changes balance and moral state but not public reputation; repeated spam cannot farm luck.
- NPC does not remember an unwitnessed crime; rumors carry confidence/source rather than global fact.
- Referral can reveal a rare job without bypassing hard skill qualifications; normal public work remains available when social feature is locked.
- Jiwa publishing validates city revision and reports stale/orphaned object bindings.
- Existing phone minimap, separate bag, status panel, and single Action button still work without new always-on HUD.

## 10. Implementation order
0. Freeze existing live HUD contract and snapshot current v15a game economy/status behavior.
1. Implement server-authoritative event ledger, clock, idempotency, player-state adapter; keep gameplay visuals unchanged.
2. Link existing contextual action, status drawer, wallet and bag to server-validated events. Add crossing energy and anti-softlock.
3. Balance job/needs/scavenging/loak and add Cove authorization + homeless spawn.
4. Add morality/reputation/spiritual/charity event rules (without AI).
5. Add hidden referral job gate (deterministic). Then ship AI memory and evolving personality behind flags.

This is an architectural and balancing proposal. Existing encrypted production Virtual Life and online worker were not modified.
