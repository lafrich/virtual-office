'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');

const Access = require('../world-builder/semesta-room-access.js');
const BUILDING = JSON.parse(fs.readFileSync(
  path.join(__dirname, '../world-builder/njh-play-interiors/kost-building.json'), 'utf8'));

function rels() { return [{ a: 't_ichsan', b: 't_noor', type: 'pacaran' }]; }

function loaded() {
  const A = Access.create();
  A.loadBuilding(BUILDING);
  A.setRelationships(rels());
  return A;
}

test('housing() returns ownerId, roomId, kind, lobby fields for 4P ids', () => {
  const A = loaded();
  const h = A.housingOf('t_ichsan');
  assert.equal(h.ownerId, 't_ichsan');
  assert.equal(h.roomId, 'njh_kos_ichsan');
  assert.equal(h.kind, 'kost');
  assert.equal(h.lobbyTemplate, 'njh_kos_cove_lobby');
  assert.equal(h.lobbyDoorId, 'njh_door_kos_cove_lobby');
  assert.deepEqual(h.homeSpawn, [-26.25, 71.5]);
  const n = A.housingOf('noor'); // alias
  assert.equal(n.roomId, 'njh_kos_noor');
  assert.equal(n.ownerId, 't_noor');
});

test('relationship() lists pacaran partner', () => {
  const A = loaded();
  assert.deepEqual(A.relationshipsOf('t_ichsan'), [{ with: 't_noor', type: 'pacaran' }]);
  assert.deepEqual(A.relationshipsOf('t_noor'), [{ with: 't_ichsan', type: 'pacaran' }]);
  assert.equal(A.isPartnered('t_ichsan', 't_noor'), true);
  assert.equal(A.relationshipsOf('t_guest_1').length, 0);
});

test('roomAccess: owner full, partner limited, stranger locked; lobby open to guests', () => {
  const A = loaded();
  const own = A.roomAccess('t_ichsan', 'njh_kos_ichsan');
  assert.equal(own.canEnter, true);
  assert.equal(own.role, 'owner');
  assert.ok(own.allowedActs.includes('store_fridge'));
  assert.ok(own.allowedActs.includes('cook'));
  assert.ok(own.allowedActs.includes('sleep'));

  const partner = A.roomAccess('t_noor', 'njh_kos_ichsan');
  assert.equal(partner.canEnter, true);
  assert.equal(partner.role, 'partner');
  assert.ok(partner.allowedActs.includes('sleep'));
  assert.ok(partner.allowedActs.includes('home_shower'));
  assert.ok(partner.allowedActs.includes('bathe'));
  assert.ok(!partner.allowedActs.includes('store_fridge'));
  assert.ok(!partner.allowedActs.includes('cook'));
  assert.ok(!partner.allowedActs.includes('buy_furniture'));

  const stranger = A.roomAccess('t_guest_1', 'njh_kos_ichsan');
  assert.equal(stranger.canEnter, false);
  assert.equal(stranger.role, 'none');
  assert.equal(stranger.reason, 'Terkunci');

  const lobby = A.roomAccess('t_guest_1', 'njh_kos_cove_lobby');
  assert.equal(lobby.canEnter, true);
  assert.equal(A.isLobby('njh-kos-noor'), true);
  assert.equal(A.isLobby('njh_kos_cove_lobby'), true);
  assert.equal(A.resolveId('njh-kos-noor'), 'njh_kos_cove_lobby');
});

test('rejectAction: partner denied owner_only with Punya pacar, including kitchen_sink wash', () => {
  const A = loaded();
  assert.equal(A.rejectAction('t_noor', 'njh_kos_ichsan', 'store_fridge'), 'Punya pacar');
  assert.equal(A.rejectAction('t_noor', 'njh_kos_ichsan', 'cook'), 'Punya pacar');
  assert.equal(A.rejectAction('t_noor', 'njh_kos_ichsan', 'buy_furniture'), 'Punya pacar');
  assert.equal(A.rejectAction('t_noor', 'njh_kos_ichsan', 'wash', { assetId: 'kitchen_sink', access: 'owner_only' }), 'Punya pacar');
  assert.equal(A.rejectAction('t_noor', 'njh_kos_ichsan', 'sleep'), null);
  assert.equal(A.rejectAction('t_noor', 'njh_kos_ichsan', 'home_shower'), null);
  assert.equal(A.rejectAction('t_noor', 'njh_kos_ichsan', 'bathe'), null);
  assert.equal(A.rejectAction('t_noor', 'njh_kos_ichsan', 'wash', { assetId: 'sink', access: 'shared_partner' }), null);
  assert.equal(A.rejectAction('t_ichsan', 'njh_kos_ichsan', 'store_fridge'), null);
  assert.equal(A.rejectAction('t_guest_1', 'njh_kos_ichsan', 'sleep'), 'Terkunci');
});

test('ingestMapMeta remaps when Ellen changes ids; keeps lobbyDoorId/lobbyTemplate', () => {
  const A = Access.create();
  A.ingestMapMeta({
    homes: [
      { ownerId: 't_ichsan', roomId: 'ellen_room_i', doorId: 'ellen_door_i',
        lobbyDoorId: 'ellen_street', lobbyTemplate: 'ellen_lobby', homeSpawn: [1, 2], kind: 'kost' }
    ],
    doors: [
      { id: 'ellen_street', buildingId: 'ellen-bldg', interior: 'ellen_lobby', role: 'lobby', usePoint: [1, 2], useTile: [0, 2] }
    ]
  });
  A.setRelationships(rels());
  assert.equal(A.housingOf('t_ichsan').roomId, 'ellen_room_i');
  assert.equal(A.housingOf('t_ichsan').lobbyTemplate, 'ellen_lobby');
  assert.equal(A.housingOf('t_ichsan').lobbyDoorId, 'ellen_street');
  assert.equal(A.isLobby('ellen-bldg'), true);
  assert.equal(A.isLobby('ellen_lobby'), true);
  assert.equal(A.roomAccess('t_ichsan', 'ellen_lobby').canEnter, true);
  assert.equal(A.roomAccess('t_noor', 'ellen_room_i').role, 'partner');
});

test('spawnTarget skips lobby and lands in the owned room; openInteriorById alias is lobby', () => {
  const A = loaded();
  const s = A.spawnTarget('t_ichsan', 'kost', 'njh_kos_ichsan');
  assert.deepEqual(s, { site: 'kost', roomId: 'njh_kos_ichsan', skipLobby: true });
  const implicit = A.spawnTarget('t_noor', 'kost');
  assert.equal(implicit.roomId, 'njh_kos_noor');
  assert.equal(implicit.skipLobby, true);
  assert.equal(A.resolveId('njh-kos-noor'), 'njh_kos_cove_lobby');
  assert.equal(A.snapshot().building.openInteriorById, 'njh_kos_cove_lobby');
});

test('saveFields: needsCharacter until hasCharacter; spawn is kost/roomId', () => {
  const A = loaded();
  const before = A.saveFields('t_ichsan', false);
  assert.equal(before.hasCharacter, false);
  assert.equal(before.needsCharacter, true);
  assert.equal(before.ownerId, 't_ichsan');
  assert.deepEqual(before.spawn, { site: 'kost', roomId: 'njh_kos_ichsan' });
  const after = A.saveFields('t_ichsan', true);
  assert.equal(after.hasCharacter, true);
  assert.equal(after.needsCharacter, false);
  const guest = A.saveFields('t_guest_1', false);
  assert.deepEqual(guest.spawn, { site: 'hobo', roomId: null });
});

test('locked cove rooms 1-3 and doorAccess/doorSprite; action map', () => {
  const A = loaded();
  for (const id of ['njh_door_cove_room_1', 'njh_door_cove_room_2', 'njh_door_cove_room_3']) {
    const d = A.snapshot().doors.find((x) => x.id === id);
    assert.ok(d, id);
    const acc = A.doorAccess('t_ichsan', d);
    assert.equal(acc.canEnter, false);
    assert.equal(acc.reason, 'Terkunci');
    assert.equal(acc.label, 'Terkunci');
    const spr = A.doorSprite(d, 't_ichsan');
    assert.match(spr, /terkunci/);
  }
  const mine = { id: 'njh_door_home_ichsan', role: 'room', state: 'owned', ownerId: 't_ichsan',
    interiorTemplate: 'njh_kos_ichsan',
    sprites: { owned_self: 'lobby-doors/pintu_lobi_milik_sw.png', owned_other: 'lobby-doors/pintu_lobi_milik_orang_lain_sw.png', locked: 'lobby-doors/pintu_lobi_terkunci_sw.png' } };
  assert.equal(A.doorAccess('t_ichsan', mine).canEnter, true);
  assert.equal(A.doorAccess('t_noor', mine).canEnter, true);
  assert.equal(A.doorAccess('t_guest_1', mine).canEnter, false);
  assert.match(A.doorSprite(mine, 't_ichsan'), /milik_sw/);
  assert.match(A.doorSprite(mine, 't_noor'), /orang_lain/);
  assert.match(A.doorSprite(mine, 't_guest_1'), /terkunci/);

  const exit = { id: 'njh_door_kos_cove_lobby_exit', role: 'exit', to: 'street' };
  assert.equal(A.doorAccess('t_guest_1', exit).canEnter, true);

  assert.deepEqual(A.mapActionIds({ actionId: 'open', tags: 'open_fridge store_fridge take_fridge' }), ['store_fridge', 'take_fridge']);
  assert.deepEqual(A.mapActionIds({ actionId: 'open', tags: 'open_storage store_home take_home' }), ['store_home', 'take_home']);
  assert.deepEqual(A.mapActionIds({ actionId: 'cook', tags: 'cook cook_recipe' }), ['cook', 'cook_recipe']);
  assert.deepEqual(A.mapActionIds({ actionId: 'bathe', tags: 'home_shower' }), ['home_shower']);
  assert.deepEqual(A.mapActionIds({ actionId: 'use_toilet', tags: 'home_toilet' }), ['home_toilet']);
  assert.deepEqual(A.mapActionIds({ actionId: 'wash', tags: 'wash' }), ['wash']);
});
