# Core Life System — Phase 01 (prototype)

This is an additive, standalone JavaScript ES module. The Virtual Office main branch currently stores an **encrypted GitHub Pages deployment**. This module is **not connected to the live game** until the owner/developer integrates it into the original (unencrypted) game sources and existing backend.

## Included

- Four needs, each 0–100: fullness, energy, hygiene, bladder.
- Online-only time-based decay, with configurable rates.
- Actions: sit, sleep, crouch, lie down, run, walk, fart, pee, poop, shower, wash hands.
- Meal, snack and drink integration with required server-side authorisation.
- Object interaction with chairs, sofas, beds, toilets, showers, sinks; range validation and one-player occupancy.
- Consequences: hunger stops sprinting, collapse and recovery, wet-self accident and hygiene penalty.
- Event hooks for UI, multiplayer action replication and NPC reaction triggers.
- Tests for 22 use cases, including offline handling, two players occupying the same chair, and player disconnects.

## Testing

Node 18+:

    node --test src/core-life-system/life-system.test.mjs

The implementation passed 22/22 tests locally before publication.

## Backend integration example

    import { LifeSystem } from './src/core-life-system/life-system.mjs';

    const life = new LifeSystem({
      onEvent: event => broadcastToNearbyPlayers(event),
      authorizeConsume: ({ userId, kind, itemId }) =>
        inventory.consumeOwnedItemAtomically(userId, kind, itemId) === true,
    });

    // Authenticate user ID on the server; NEVER trust client-supplied user ID.
    life.addPlayer(authenticatedUserId, await database.loadNeeds(authenticatedUserId));
    life.registerObject({ id: 'chair-1', type: 'chair', x: 12, y: 8 });
    life.setPosition(authenticatedUserId, serverValidatedPosition);
    life.startAction(authenticatedUserId, 'sit', { objectId: 'chair-1' });
    life.tick(1000);

    const saved = life.disconnectPlayer(authenticatedUserId);
    await database.saveNeeds(authenticatedUserId, saved);

## Required before deployment

1. Obtain the unencrypted original game source; the existing live game cannot import the unencrypted module through its current encrypted service worker.
2. Integrate with the existing login, game loop, multiplayer networking and persistence.
3. Authenticate identity server-side, validate movement, interactions and consumable ownership.
4. Add HUD, character animations and NPC behaviors to the game UI.
5. Test with at least two clients and actual deployment build workflow.

The module assumes one authoritative server process. Shared multiplayer across multiple server instances will require distributed state management and object locks.

**Do not merge and expect it to appear in the live Virtual Office automatically.** The feature branch is for integration review.
