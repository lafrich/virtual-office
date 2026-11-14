/* semesta-room-access.js
 * Data-driven housing / relationship / room-access for NJH 4P kost.
 * Ids come from kost-building.json + map homes[]/doors[] (Ellen may change them);
 * this module only consults the alias table + those records.
 * Client-side only — no multiplayer presence.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SemestaRoomAccess = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const REASON_LOCKED = 'Terkunci';
  const REASON_PARTNER = 'Punya pacar';

  const OWNER_ONLY = ['fridge', 'kulkas', 'wardrobe', 'lemari', 'stove', 'kitchen_sink'];
  const SHARED_PARTNER = ['bed', 'bathtub', 'shower', 'water_tub', 'squat_toilet', 'sink', 'sekat_wc', 'fan', 'shoe_rack'];

  const DEFAULT_ACTION_MAP = {
    sleep: ['sleep'],
    open_fridge: ['store_fridge', 'take_fridge'],
    store_fridge: ['store_fridge'],
    take_fridge: ['take_fridge'],
    open_storage: ['store_home', 'take_home'],
    store_home: ['store_home'],
    take_home: ['take_home'],
    cook: ['cook'],
    cook_recipe: ['cook_recipe'],
    wash: ['wash'],
    bathe: ['home_shower'],
    home_shower: ['home_shower'],
    use_toilet: ['home_toilet'],
    home_toilet: ['home_toilet']
  };

  const DEFAULTS = {
    format: 'njh-kost-building-v1',
    version: 2,
    building: {
      id: 'njh-kos-noor',
      name: 'Kost Cove (Ichsan & Noor)',
      streetDoorId: 'njh_door_kos_cove_lobby',
      streetDoorUseTile: [-27, 71],
      streetDoorUsePoint: [-26.25, 71.5],
      enterRadius: 1.25,
      lobbyTemplate: 'njh_kos_cove_lobby',
      openInteriorById: 'njh_kos_cove_lobby'
    },
    lobby: {
      id: 'njh_kos_cove_lobby',
      streetDoorId: 'njh_door_kos_cove_lobby',
      exitDoorId: 'njh_door_kos_cove_lobby_exit',
      openTo: ['owner', 'partner', 'guest'],
      kind: 'lobby'
    },
    homes: [
      { ownerId: 't_ichsan', roomId: 'njh_kos_ichsan', doorId: 'njh_door_home_ichsan',
        lobbyDoorId: 'njh_door_kos_cove_lobby', lobbyTemplate: 'njh_kos_cove_lobby',
        kind: 'kost', homeSpawn: [-26.25, 71.5] },
      { ownerId: 't_noor', roomId: 'njh_kos_noor', doorId: 'njh_door_home_noor',
        lobbyDoorId: 'njh_door_kos_cove_lobby', lobbyTemplate: 'njh_kos_cove_lobby',
        kind: 'kost', homeSpawn: [-26.25, 71.5] }
    ],
    doors: [
      { id: 'njh_door_kos_cove_lobby', interior: 'njh_kos_cove_lobby', role: 'lobby' },
      { id: 'njh_door_kos_cove_lobby_exit', from: 'njh_kos_cove_lobby', to: 'street', role: 'exit' },
      { id: 'njh_door_home_ichsan', from: 'njh_kos_cove_lobby', to: 'njh_kos_ichsan', ownerId: 't_ichsan', role: 'room', state: 'owned' },
      { id: 'njh_door_home_noor', from: 'njh_kos_cove_lobby', to: 'njh_kos_noor', ownerId: 't_noor', role: 'room', state: 'owned' },
      { id: 'njh_door_cove_room_1', from: 'njh_kos_cove_lobby', role: 'room', state: 'locked' },
      { id: 'njh_door_cove_room_2', from: 'njh_kos_cove_lobby', role: 'room', state: 'locked' },
      { id: 'njh_door_cove_room_3', from: 'njh_kos_cove_lobby', role: 'room', state: 'locked' }
    ],
    access: { owner_only: OWNER_ONLY.slice(), shared_partner: SHARED_PARTNER.slice() },
    actionMap: Object.assign({}, DEFAULT_ACTION_MAP),
    aliases: {
      njh_kos: 'njh_kos_noor',
      'njh-kos-noor': 'njh_kos_cove_lobby',
      njh_kos_lobby: 'njh_kos_cove_lobby',
      njh_door_kost_lobby: 'njh_door_kos_cove_lobby',
      ichsan: 't_ichsan',
      noor: 't_noor'
    }
  };

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function normId(id) { return id == null ? '' : String(id); }
  function normKey(id) { return normId(id).trim().toLowerCase(); }

  function canonPlayer(id) {
    const k = normKey(id);
    if (k === 'ichsan' || k === 't_ichsan') return 't_ichsan';
    if (k === 'noor' || k === 't_noor') return 't_noor';
    return normId(id);
  }

  function samePlayer(a, b) { return canonPlayer(a) && canonPlayer(a) === canonPlayer(b); }

  function create(seed) {
    const state = {
      aliases: Object.assign({}, DEFAULTS.aliases),
      homes: [],
      doors: [],
      lobby: clone(DEFAULTS.lobby),
      building: clone(DEFAULTS.building),
      access: clone(DEFAULTS.access),
      actionMap: clone(DEFAULTS.actionMap),
      relationships: []
    };

    function addAlias(from, to) {
      if (!from || !to) return;
      const f = normId(from), t = normId(to);
      if (f && t && f !== t) state.aliases[f] = t;
    }

    function resolveId(id) {
      let cur = normId(id);
      const seen = new Set();
      while (cur && state.aliases[cur] && !seen.has(cur)) {
        seen.add(cur);
        cur = state.aliases[cur];
      }
      return cur;
    }

    function loadBuilding(cfg) {
      if (!cfg || typeof cfg !== 'object') return;
      if (cfg.building) Object.assign(state.building, cfg.building);
      if (cfg.lobby) Object.assign(state.lobby, cfg.lobby);
      if (cfg.access) {
        if (cfg.access.owner_only) state.access.owner_only = cfg.access.owner_only.slice();
        if (cfg.access.shared_partner) state.access.shared_partner = cfg.access.shared_partner.slice();
        if (cfg.access.public) state.access.public = cfg.access.public.slice();
      }
      if (cfg.actionMap) Object.assign(state.actionMap, cfg.actionMap);
      if (cfg.aliases && typeof cfg.aliases === 'object') {
        Object.keys(cfg.aliases).forEach((k) => addAlias(k, cfg.aliases[k]));
      }
      (cfg.homes || []).forEach((h) => upsertHome(h));
      (cfg.doors || []).forEach((d) => upsertDoor(d));
      if (state.building.id && state.lobby.id) addAlias(state.building.id, state.lobby.id);
      if (state.lobby.id) addAlias('njh_kos_lobby', state.lobby.id);
    }

    function upsertHome(h) {
      if (!h) return;
      const rec = {
        ownerId: canonPlayer(h.ownerId) || normId(h.ownerId),
        roomId: normId(h.roomId || h.interiorTemplate || h.template),
        doorId: normId(h.doorId || h.roomDoorId),
        lobbyDoorId: normId(h.lobbyDoorId || state.building.streetDoorId || state.lobby.streetDoorId),
        lobbyTemplate: normId(h.lobbyTemplate || state.lobby.id),
        kind: h.kind || 'kost',
        homeSpawn: Array.isArray(h.homeSpawn) ? h.homeSpawn.slice() : (state.building.streetDoorUsePoint || [-26.25, 71.5]).slice()
      };
      if (!rec.roomId) return;
      const i = state.homes.findIndex((x) => x.roomId === rec.roomId || samePlayer(x.ownerId, rec.ownerId));
      if (i >= 0) state.homes[i] = Object.assign({}, state.homes[i], rec);
      else state.homes.push(rec);
      if (h.aliases) (Array.isArray(h.aliases) ? h.aliases : [h.aliases]).forEach((a) => addAlias(a, rec.roomId));
    }

    function upsertDoor(d) {
      if (!d || !d.id) return;
      const rec = Object.assign({}, d, { id: normId(d.id) });
      if (rec.ownerId) rec.ownerId = canonPlayer(rec.ownerId) || rec.ownerId;
      const i = state.doors.findIndex((x) => x.id === rec.id);
      if (i >= 0) state.doors[i] = Object.assign({}, state.doors[i], rec);
      else state.doors.push(rec);
    }

    function ingestMapMeta(meta) {
      if (!meta || typeof meta !== 'object') return;
      const homes = meta.homes || (meta.map && meta.map.homes) || [];
      const doors = meta.doors || (meta.map && meta.map.doors) || [];
      homes.forEach((h) => upsertHome(h));
      doors.forEach((d) => {
        upsertDoor(d);
        if (d.interior || d.interiorTemplate) {
          const target = d.interior || d.interiorTemplate;
          if (d.role === 'lobby' || (d.buildingId && !d.ownerId)) {
            state.lobby.id = target;
            state.lobby.streetDoorId = d.id;
            state.building.streetDoorId = d.id;
            state.building.lobbyTemplate = target;
            state.building.openInteriorById = target;
            if (d.buildingId) addAlias(d.buildingId, target);
          }
        }
        if (d.useTile) state.building.streetDoorUseTile = d.useTile.slice ? d.useTile.slice() : d.useTile;
        if (d.usePoint && (d.role === 'lobby' || d.id === state.building.streetDoorId)) {
          state.building.streetDoorUsePoint = d.usePoint.slice ? d.usePoint.slice() : d.usePoint;
        }
      });
    }

    function setRelationships(list) {
      state.relationships = Array.isArray(list) ? list.map((r) => ({
        a: canonPlayer(r.a || r.from),
        b: canonPlayer(r.b || r.to),
        type: r.type || 'pacaran'
      })).filter((r) => r.a && r.b) : [];
    }

    function isPartnered(a, b) {
      const A = canonPlayer(a), B = canonPlayer(b);
      if (!A || !B || A === B) return false;
      return state.relationships.some((r) => {
        if ((r.type || 'pacaran') !== 'pacaran') return false;
        return (r.a === A && r.b === B) || (r.a === B && r.b === A);
      });
    }

    function relationshipsOf(playerId) {
      const me = canonPlayer(playerId);
      return state.relationships
        .filter((r) => r.a === me || r.b === me)
        .map((r) => ({ with: r.a === me ? r.b : r.a, type: r.type || 'pacaran' }));
    }

    function housingOf(playerId) {
      const me = canonPlayer(playerId);
      const h = state.homes.find((x) => samePlayer(x.ownerId, me));
      if (!h) return { ownerId: playerId || null, roomId: null, kind: null, lobbyTemplate: state.lobby.id || null, lobbyDoorId: state.lobby.streetDoorId || null };
      return { ownerId: h.ownerId, roomId: h.roomId, kind: h.kind || 'kost', lobbyTemplate: h.lobbyTemplate, lobbyDoorId: h.lobbyDoorId, homeSpawn: h.homeSpawn };
    }

    function homeByRoom(roomId) {
      const id = resolveId(roomId);
      return state.homes.find((h) => h.roomId === id || resolveId(h.roomId) === id) || null;
    }

    function isLobby(roomId) {
      const id = resolveId(roomId);
      if (!id) return false;
      if (id === state.lobby.id || resolveId(state.lobby.id) === id) return true;
      if (id === state.building.id || resolveId(state.building.id) === id) return true;
      return false;
    }

    function isRoom(roomId) {
      return !!homeByRoom(roomId);
    }

    function lobbyOpenTo() {
      const o = state.lobby.openTo;
      return Array.isArray(o) && o.length ? o.slice() : ['owner', 'partner', 'guest'];
    }

    function itemKind(item) {
      if (!item) return '';
      return String(item.assetId || item.asset || item.type || item.id || '').toLowerCase();
    }

    function accessOfKind(kind) {
      const k = String(kind || '').toLowerCase();
      const own = (state.access.owner_only || OWNER_ONLY).map((x) => String(x).toLowerCase());
      const share = (state.access.shared_partner || SHARED_PARTNER).map((x) => String(x).toLowerCase());
      const pub = (state.access.public || []).map((x) => String(x).toLowerCase());
      if (own.indexOf(k) >= 0) return 'owner_only';
      if (share.indexOf(k) >= 0) return 'shared_partner';
      if (pub.indexOf(k) >= 0) return 'public';
      return null;
    }

    // item used after accessOfKind — fix: accept item
    function accessOfItem(item) {
      if (!item) return null;
      if (item.access) return String(item.access);
      return accessOfKind(itemKind(item));
    }

    function mapActionIds(item) {
      const tags = [];
      const act = item && (item.actionId || item.action);
      if (act) tags.push(String(act));
      const t = (item && (item.tags || item.tag)) || '';
      String(t).split(/[\s,]+/).forEach((x) => { if (x) tags.push(x); });
      const out = [];
      const seen = new Set();
      tags.forEach((tag) => {
        const mapped = state.actionMap[tag] || DEFAULT_ACTION_MAP[tag];
        if (mapped && mapped.length) {
          mapped.forEach((id) => { if (!seen.has(id)) { seen.add(id); out.push(id); } });
        } else if (tag && DEFAULT_ACTION_MAP[tag] == null && state.actionMap[tag] == null) {
          /* unknown tag: ignore */
        }
      });
      if (!out.length && act) {
        const fallback = { open: null, cook: 'cook', wash: 'wash', bathe: 'home_shower', use_toilet: 'home_toilet', sleep: 'sleep' };
        if (fallback[act]) out.push(fallback[act]);
      }
      return out;
    }

    function allowedActsFor(role, roomId) {
      if (isLobby(roomId)) return ['enter_room', 'exit_interior', 'exit'];
      if (role === 'owner') {
        return ['sleep', 'store_fridge', 'take_fridge', 'store_home', 'take_home', 'cook', 'cook_recipe', 'wash', 'home_shower', 'home_toilet', 'buy_furniture', 'bathe', 'use_toilet', 'open'];
      }
      if (role === 'partner') {
        return ['sleep', 'home_toilet', 'use_toilet', 'home_shower', 'bathe', 'wash'];
      }
      return [];
    }

    function roomAccess(playerId, roomId) {
      const id = resolveId(roomId);
      if (isLobby(id) || isLobby(roomId)) {
        const open = lobbyOpenTo();
        const house = housingOf(playerId);
        const role = house.roomId ? 'owner' : 'guest';
        /* partner of any resident also counts as partner in the shared lobby */
        const partnerOfResident = state.homes.some((h) => isPartnered(playerId, h.ownerId));
        const effective = house.roomId ? 'owner' : (partnerOfResident ? 'partner' : 'guest');
        const canEnter = open.indexOf(effective) >= 0 || (effective === 'owner' && open.indexOf('owner') >= 0);
        return { canEnter: !!canEnter, role: effective, allowedActs: allowedActsFor(effective, id), reason: canEnter ? null : REASON_LOCKED, kind: 'lobby' };
      }
      const home = homeByRoom(id) || homeByRoom(roomId);
      if (!home) {
        /* maybe a locked lobby door with no home record */
        const door = state.doors.find((d) => resolveId(d.to || d.interiorTemplate) === id || d.id === roomId);
        if (door && (door.state === 'locked' || !door.interiorTemplate && !door.to)) {
          return { canEnter: false, role: 'none', allowedActs: [], reason: REASON_LOCKED, kind: 'room' };
        }
        return { canEnter: true, role: 'none', allowedActs: [], reason: null, kind: null };
      }
      if (samePlayer(home.ownerId, playerId)) {
        return { canEnter: true, role: 'owner', allowedActs: allowedActsFor('owner', home.roomId), reason: null, kind: 'room' };
      }
      if (isPartnered(playerId, home.ownerId)) {
        return { canEnter: true, role: 'partner', allowedActs: allowedActsFor('partner', home.roomId), reason: null, kind: 'room' };
      }
      return { canEnter: false, role: 'none', allowedActs: [], reason: REASON_LOCKED, kind: 'room' };
    }

    function doorAccess(playerId, door) {
      if (!door) return { canEnter: false, role: 'none', reason: REASON_LOCKED, label: REASON_LOCKED };
      const role = door.role || (door.to === 'street' || door.exterior ? 'exit' : 'room');
      if (role === 'exit' || role === 'lobby') {
        return { canEnter: true, role: 'exit', reason: null, label: door.label || (role === 'exit' ? 'Keluar' : door.label) };
      }
      if (door.state === 'locked' || (!door.interiorTemplate && !door.to && role === 'room')) {
        return { canEnter: false, role: 'none', reason: REASON_LOCKED, label: REASON_LOCKED, state: 'locked' };
      }
      const target = door.interiorTemplate || door.to;
      const acc = roomAccess(playerId, target);
      return {
        canEnter: acc.canEnter,
        role: acc.role,
        reason: acc.canEnter ? null : (acc.reason || REASON_LOCKED),
        label: acc.canEnter ? (door.label || null) : REASON_LOCKED,
        state: door.state || (acc.canEnter ? 'owned' : 'locked'),
        interiorTemplate: target
      };
    }

    function doorSprite(door, playerId) {
      if (!door) return null;
      const acc = doorAccess(playerId, door);
      const sprites = door.sprites || {};
      if (door.state === 'available' || acc.state === 'available') return door.sprite || sprites.available || 'lobby-doors/pintu_lobi_tersedia_sw.png';
      if (!acc.canEnter || door.state === 'locked' || acc.state === 'locked') {
        return sprites.locked || 'lobby-doors/pintu_lobi_terkunci_sw.png';
      }
      if (acc.role === 'owner') return sprites.owned_self || sprites.owned || 'lobby-doors/pintu_lobi_milik_sw.png';
      if (acc.role === 'partner') return sprites.owned_other || 'lobby-doors/pintu_lobi_milik_orang_lain_sw.png';
      return door.sprite || sprites.locked || 'lobby-doors/pintu_lobi_terkunci_sw.png';
    }

    function filterActions(playerId, roomId, actions, itemsById) {
      const acc = roomAccess(playerId, roomId);
      if (isLobby(roomId)) return Array.isArray(actions) ? actions.slice() : [];
      if (acc.role === 'owner') return Array.isArray(actions) ? actions.slice() : [];
      const allow = new Set(acc.allowedActs || []);
      return (actions || []).filter((a) => {
        const id = typeof a === 'string' ? a : (a && a.id);
        if (!id) return false;
        if (id === 'buy_furniture' || id === 'store_fridge' || id === 'take_fridge' || id === 'store_home' || id === 'take_home' || id === 'cook' || id === 'cook_recipe') {
          return acc.role === 'owner';
        }
        /* item-level access: kitchen wash is owner_only even though wash is shared */
        const item = itemsById && (a.item || a.prop || itemsById[a.itemId || a.propId]);
        if (item) {
          const kindAcc = accessOfItem(item);
          if (kindAcc === 'owner_only') return false;
          if (kindAcc === 'shared_partner' || kindAcc === 'public') return acc.role === 'partner' || acc.role === 'owner';
        }
        return allow.has(id);
      });
    }

    function rejectAction(playerId, roomId, actionId, item) {
      const acc = roomAccess(playerId, roomId);
      if (isLobby(roomId)) return null;
      if (acc.role === 'owner') return null;
      if (item && accessOfItem(item) === 'owner_only' && acc.role === 'partner') return REASON_PARTNER;
      if (acc.role === 'partner') {
        const allow = new Set(acc.allowedActs || []);
        const ownerActs = new Set(['store_fridge', 'take_fridge', 'store_home', 'take_home', 'cook', 'cook_recipe', 'buy_furniture', 'open']);
        if (ownerActs.has(actionId) || (item && accessOfItem(item) === 'owner_only')) return REASON_PARTNER;
        if (allow.has(actionId)) return null;
        return REASON_PARTNER;
      }
      if (!acc.canEnter) return REASON_LOCKED;
      return REASON_LOCKED;
    }

    function spawnTarget(playerId, site, roomId) {
      const kind = String(site || '').toLowerCase();
      if (kind === 'tent' || kind === 'hobo') return { site: 'tent', roomId: null, skipLobby: false };
      const want = roomId ? resolveId(roomId) : null;
      if (want && isRoom(want)) return { site: site || 'kost', roomId: want, skipLobby: true };
      const house = housingOf(playerId);
      if (house.roomId) return { site: site || house.kind || 'kost', roomId: house.roomId, skipLobby: true };
      return { site: site || 'kost', roomId: state.lobby.id, skipLobby: false };
    }

    function saveFields(playerId, hasCharacter) {
      const house = housingOf(playerId);
      const known = hasCharacter === true;
      return {
        hasCharacter: known,
        needsCharacter: !known,
        ownerId: house.ownerId || playerId || null,
        spawn: house.roomId ? { site: 'kost', roomId: house.roomId } : { site: 'hobo', roomId: null }
      };
    }

    function snapshot() {
      return {
        aliases: Object.assign({}, state.aliases),
        homes: state.homes.map((h) => Object.assign({}, h)),
        doors: state.doors.map((d) => Object.assign({}, d)),
        lobby: Object.assign({}, state.lobby),
        building: Object.assign({}, state.building)
      };
    }
    function lobbyOf() {
      const pt = (state.building.streetDoorUsePoint || [-26.25, 71.5]).slice();
      return {
        id: state.lobby.id,
        usePoint: pt,
        tile: (state.building.streetDoorUseTile || [-27, 71]).slice(),
        streetDoorId: state.lobby.streetDoorId,
        exitDoorId: state.lobby.exitDoorId,
        openTo: lobbyOpenTo(),
        template: state.lobby.id
      };
    }

    function filterActionsCompat(a, b, c, d) {
      /* hooks: filterActions(list, acc)  |  tests: filterActions(playerId, roomId, actions, items) */
      if (Array.isArray(a)) {
        const list = a, acc = b || {};
        if (acc.role === 'owner' || acc.kind === 'lobby') return list.slice();
        return list.filter((act) => {
          const id = typeof act === 'string' ? act : (act && act.id);
          if (!id) return false;
          if (id === 'enter_room' || id === 'exit_interior' || id === 'exit' || id === 'enter') return true;
          if (acc.role !== 'partner') return false;
          if (['store_fridge', 'take_fridge', 'store_home', 'take_home', 'cook', 'cook_recipe', 'buy_furniture', 'open'].indexOf(id) >= 0) return false;
          const item = act && (act.item || act.prop);
          if (item && accessOfItem(item) === 'owner_only') return false;
          return (acc.allowedActs || []).indexOf(id) >= 0 || ['sleep', 'home_toilet', 'use_toilet', 'home_shower', 'bathe', 'wash'].indexOf(id) >= 0;
        });
      }
      return filterActions(a, b, c, d);
    }

    const spawnTargetNew = spawnTarget;
    function spawnTargetCompat(a, b, c) {
      /* hooks: spawnTarget(roomId)  |  tests: spawnTarget(playerId, site, roomId) */
      if (arguments.length === 1 || (b == null && c == null)) {
        const sid = a;
        if (isRoom(sid) || homeByRoom(sid)) {
          const home = homeByRoom(sid);
          const pt = (home && home.homeSpawn) || state.building.streetDoorUsePoint || [-26.25, 71.5];
          return { roomId: home.roomId, doorId: home.doorId, x: pt[0], z: pt[1], skipLobby: true, site: 'kost' };
        }
        if (isLobby(sid)) {
          const pt = state.building.streetDoorUsePoint || [-26.25, 71.5];
          return { roomId: state.lobby.id, x: pt[0], z: pt[1], skipLobby: false, site: 'kost' };
        }
        return null;
      }
      return spawnTargetNew(a, b, c);
    }

    const saveFieldsNew = saveFields;
    function saveFieldsCompat(playerId, src, opts) {
      /* hooks: saveFields(pid, state, {hasCharacter})  |  tests: saveFields(pid, hasCharacter) */
      let has;
      if (typeof src === 'boolean') has = src;
      else if (opts && typeof opts.hasCharacter === 'boolean') has = opts.hasCharacter;
      else if (src && typeof src === 'object' && typeof src.hasCharacter === 'boolean') has = src.hasCharacter;
      else has = false;
      return saveFieldsNew(playerId, has);
    }

    function relationshipsOfCompat(a, b) {
      if (Array.isArray(a)) {
        setRelationships(a);
        return relationshipsOf(b == null || b === '' ? arguments[2] : b);
      }
      return relationshipsOf(a);
    }

    function roomAccessCompat(playerId, roomId, _state, rels) {
      if (Array.isArray(rels)) setRelationships(rels);
      if (Array.isArray(_state) && !rels) setRelationships(_state);
      return roomAccess(playerId, roomId);
    }


    loadBuilding(DEFAULTS);
    if (seed) {
      if (seed.building || seed.homes || seed.lobby || seed.aliases) loadBuilding(seed);
      if (seed.homes || seed.doors) ingestMapMeta(seed);
      if (seed.relationships) setRelationships(seed.relationships);
    }

    return {
      REASON_LOCKED, REASON_PARTNER,
      loadBuilding, ingestMapMeta, setRelationships, addAlias,
      resolveId, isLobby, isRoom, housingOf, relationshipsOf: relationshipsOfCompat, isPartnered,
      roomAccess: roomAccessCompat, doorAccess, doorSprite, filterActions: filterActionsCompat, rejectAction,
      spawnTarget: spawnTargetCompat, saveFields: saveFieldsCompat, snapshot, mapActionIds, accessOfItem, canonPlayer,
      allowedActsFor, lobbyOf
    };
  }

  const DEFAULT_RELATIONSHIPS = [{ a: 't_ichsan', b: 't_noor', type: 'pacaran' }];
  const defaults = create();
  return Object.assign({ create, load: create, DEFAULTS, DEFAULT_ACTION_MAP, DEFAULT_RELATIONSHIPS }, defaults);
}));
