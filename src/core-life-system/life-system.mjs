/**
 * Virtual City Indonesia — Core Life System (framework-agnostic prototype).
 * This is a deterministic server-side domain model, not a network server.
 * Hosting server must authenticate user IDs, validate movement and inventory.
 */
export const DEFAULT_NEEDS = Object.freeze({ fullness: 100, energy: 100, hygiene: 100, bladder: 0 });

export const DEFAULT_CONFIG = Object.freeze({
  fullnessPerMinute: -10 / 15,
  energyPerMinute: -8 / 15,
  hygienePerMinute: -5 / 15,
  bladderPerMinute: 20 / 15,
  sleepingEnergyPerMinute: 25,
  sittingEnergyPerMinute: 2,
  runningExtraEnergyPerMinute: -1,
  maximumInteractionDistance: 2.5,
  accidentHygienePenalty: 30,
  outsidePeeHygienePenalty: 20,
  outsidePoopHygienePenalty: 30,
  recoveryFromCollapseAtEnergy: 10,
});

const OBJECT_TYPES = Object.freeze({
  chair: new Set(['sit']),
  sofa: new Set(['sit', 'sleep']),
  bed: new Set(['sleep']),
  toilet: new Set(['pee', 'poop']),
  shower: new Set(['shower']),
  sink: new Set(['washHands']),
});
const POSTURES = new Set(['sit', 'sleep', 'crouch', 'lieDown']);
const CONSUMABLES = Object.freeze({
  meal: Object.freeze({ fullness: 40 }),
  snack: Object.freeze({ fullness: 15 }),
  drink: Object.freeze({ bladder: 15 }),
});
const clamp = n => Math.max(0, Math.min(100, n));
const finite = n => typeof n === 'number' && Number.isFinite(n);

export class LifeSystem {
  constructor({ config = {}, onEvent = () => {}, authorizeConsume = () => false } = {}) {
    if (typeof onEvent !== 'function' || typeof authorizeConsume !== 'function') {
      throw new TypeError('onEvent and authorizeConsume must be functions');
    }
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.onEvent = onEvent;
    this.authorizeConsume = authorizeConsume;
    this.players = new Map();
    this.objects = new Map();
    this.occupied = new Map();
  }

  addPlayer(userId, persisted = {}) {
    if (typeof userId !== 'string' || !userId.trim()) throw new TypeError('Authenticated userId is required');
    if (this.players.has(userId)) {
      const p = this.players.get(userId);
      p.online = true;
      return this.getState(userId);
    }
    const source = persisted?.needs ?? persisted;
    const needs = { ...DEFAULT_NEEDS };
    for (const name of Object.keys(needs)) if (finite(source?.[name])) needs[name] = clamp(source[name]);
    this.players.set(userId, {
      userId, needs, online: true, activity: 'idle', movement: 'idle',
      objectId: null, position: { x: 0, y: 0 },
    });
    return this.getState(userId);
  }

  disconnectPlayer(userId) {
    const p = this._player(userId);
    this._release(p);
    p.activity = 'idle';
    p.movement = 'idle';
    p.online = false;
    this._emit('disconnected', p);
    return this.getPersistedState(userId);
  }

  getPersistedState(userId) {
    return { needs: { ...this._player(userId).needs } };
  }

  getState(userId) {
    const p = this._player(userId);
    return {
      userId: p.userId, needs: { ...p.needs }, online: p.online,
      activity: p.activity, movement: p.movement, objectId: p.objectId,
      position: { ...p.position }, warnings: this._warnings(p),
    };
  }

  registerObject({ id, type, x, y }) {
    if (typeof id !== 'string' || !id || !OBJECT_TYPES[type] || !finite(x) || !finite(y)) {
      throw new TypeError('Invalid world object; expected id, supported type, x, y');
    }
    if (this.objects.has(id)) throw new Error('Duplicate world object: ' + id);
    this.objects.set(id, { id, type, x, y });
  }

  setPosition(userId, position) {
    const p = this._onlinePlayer(userId);
    if (!finite(position?.x) || !finite(position?.y)) throw new TypeError('Invalid position');
    // TRUST BOUNDARY: use only after the game's server validates movement.
    p.position = { x: position.x, y: position.y };
    if (p.objectId) {
      const obj = this.objects.get(p.objectId);
      if (obj && this._distance(p, obj) > this.config.maximumInteractionDistance) {
        this.stopAction(userId);
      }
    }
    return this.getState(userId);
  }

  setMovement(userId, movement) {
    const p = this._onlinePlayer(userId);
    if (!['idle', 'walk', 'run'].includes(movement)) throw new Error('Unknown movement: ' + movement);
    if ((p.activity === 'collapsed' || p.needs.energy === 0) && movement !== 'idle') {
      throw new Error('Player is too exhausted to move');
    }
    if (movement === 'run' && p.needs.fullness === 0) throw new Error('Player is too hungry to sprint');
    if (movement !== 'idle' && POSTURES.has(p.activity)) this._release(p);
    if (movement !== 'idle' && POSTURES.has(p.activity)) p.activity = 'idle';
    p.movement = movement;
    this._emit('movement', p, { movement });
    return this.getState(userId);
  }

  startAction(userId, action, { objectId = null } = {}) {
    const p = this._onlinePlayer(userId);
    if (!POSTURES.has(action)) throw new Error('Unknown posture: ' + action);
    if (p.activity === 'collapsed' && action !== 'sleep') throw new Error('Player collapsed');
    if (p.needs.energy === 0 && action !== 'sleep') throw new Error('Player is too exhausted');
    const obj = objectId ? this._validateObject(p, objectId, action) : null;
    if (obj && this.occupied.has(obj.id) && this.occupied.get(obj.id) !== userId) {
      throw new Error('Object is occupied');
    }
    this._release(p);
    if (obj) {
      this.occupied.set(obj.id, userId);
      p.objectId = obj.id;
    }
    p.activity = action;
    p.movement = 'idle';
    this._emit('action', p, { action, phase: 'start', objectId: p.objectId });
    if (action === 'sleep' && !objectId) this._emit('npc-reaction-trigger', p, { reason: 'sleep-on-ground' });
    return this.getState(userId);
  }

  stopAction(userId) {
    const p = this._onlinePlayer(userId);
    const previous = p.activity;
    if (previous === 'collapsed') throw new Error('Cannot interrupt collapse');
    this._release(p);
    p.activity = 'idle';
    this._emit('action', p, { action: previous, phase: 'stop' });
    return this.getState(userId);
  }

  performAction(userId, action, { objectId = null } = {}) {
    const p = this._onlinePlayer(userId);
    if (p.activity === 'sleep' || p.activity === 'collapsed') {
      throw new Error('Cannot perform an action while sleeping or collapsed');
    }
    if (!['fart', 'pee', 'poop', 'shower', 'washHands'].includes(action)) {
      throw new Error('Unsupported instant action: ' + action);
    }
    if (action === 'shower' || action === 'washHands') {
      if (!objectId) throw new Error(action + ' requires an interactive object');
      this._validateObject(p, objectId, action);
      if (action === 'shower') p.needs.hygiene = 100;
      else p.needs.hygiene = clamp(p.needs.hygiene + 10);
    }
    if (action === 'pee' || action === 'poop') {
      if (objectId) this._validateObject(p, objectId, action);
      if (action === 'pee') p.needs.bladder = 0;
      if (!objectId) {
        p.needs.hygiene = clamp(p.needs.hygiene - (
          action === 'pee' ? this.config.outsidePeeHygienePenalty : this.config.outsidePoopHygienePenalty
        ));
        this._emit('npc-reaction-trigger', p, { reason: action === 'pee' ? 'pee-outside' : 'poop-outside' });
      }
    }
    if (action === 'fart') this._emit('npc-reaction-trigger', p, { reason: 'fart' });
    this._emit('action', p, { action, phase: 'instant', objectId });
    this._emit('needs', p);
    return this.getState(userId);
  }

  consume(userId, kind, itemId) {
    const p = this._onlinePlayer(userId);
    if (!CONSUMABLES[kind]) throw new Error('Unknown consumable: ' + kind);
    if (p.activity === 'sleep' || p.activity === 'collapsed') throw new Error('Cannot eat or drink right now');
    if (this.authorizeConsume({ userId, kind, itemId }) !== true) throw new Error('Consumable not authorised');
    for (const [need, amount] of Object.entries(CONSUMABLES[kind])) {
      p.needs[need] = clamp(p.needs[need] + amount);
    }
    this._emit('action', p, { action: kind, phase: 'instant' });
    this._emit('needs', p);
    return this.getState(userId);
  }

  tick(deltaMs) {
    if (!finite(deltaMs) || deltaMs < 0) throw new TypeError('deltaMs must be finite and non-negative');
    if (deltaMs === 0) return;
    const minutes = deltaMs / 60000;
    for (const p of this.players.values()) {
      if (!p.online) continue;
      const n = p.needs;
      n.fullness = clamp(n.fullness + this.config.fullnessPerMinute * minutes);
      n.hygiene = clamp(n.hygiene + this.config.hygienePerMinute * minutes);
      n.bladder = n.bladder + this.config.bladderPerMinute * minutes;

      const rate = p.activity === 'sleep' || p.activity === 'collapsed'
        ? this.config.sleepingEnergyPerMinute
        : p.activity === 'sit' ? this.config.sittingEnergyPerMinute
        : this.config.energyPerMinute + (p.movement === 'run' ? this.config.runningExtraEnergyPerMinute : 0);
      n.energy = clamp(n.energy + rate * minutes);

      if (n.bladder >= 100) {
        n.bladder = 0;
        n.hygiene = clamp(n.hygiene - this.config.accidentHygienePenalty);
        this._emit('accident', p, { action: 'wet-self' });
        this._emit('npc-reaction-trigger', p, { reason: 'wet-self' });
      }
      n.bladder = clamp(n.bladder);
      if (n.fullness === 0 && p.movement === 'run') {
        p.movement = 'walk';
        this._emit('movement', p, { movement: 'walk', reason: 'too-hungry' });
      }

      if (p.activity === 'collapsed' && n.energy >= this.config.recoveryFromCollapseAtEnergy) {
        p.activity = 'idle';
        this._emit('action', p, { action: 'collapsed', phase: 'recover' });
      } else if (p.activity !== 'collapsed' && p.activity !== 'sleep' && n.energy === 0) {
        this._release(p);
        p.activity = 'collapsed';
        p.movement = 'idle';
        this._emit('action', p, { action: 'collapsed', phase: 'start' });
      }
      this._emit('needs', p);
    }
  }

  _player(userId) {
    const p = this.players.get(userId);
    if (!p) throw new Error('Unknown player: ' + userId);
    return p;
  }
  _onlinePlayer(userId) {
    const p = this._player(userId);
    if (!p.online) throw new Error('Player is offline');
    return p;
  }
  _distance(p, obj) {
    return Math.hypot(p.position.x - obj.x, p.position.y - obj.y);
  }
  _validateObject(p, objectId, action) {
    const obj = this.objects.get(objectId);
    if (!obj || !OBJECT_TYPES[obj.type].has(action)) throw new Error('Invalid object/action combination');
    if (this._distance(p, obj) > this.config.maximumInteractionDistance) throw new Error('Object out of reach');
    if (this.occupied.has(obj.id) && this.occupied.get(obj.id) !== p.userId) throw new Error('Object is occupied');
    return obj;
  }
  _release(p) {
    if (p.objectId && this.occupied.get(p.objectId) === p.userId) this.occupied.delete(p.objectId);
    p.objectId = null;
  }
  _warnings(p) {
    const n = p.needs;
    return {
      hungry: n.fullness <= 30,
      starving: n.fullness <= 10,
      tired: n.energy <= 30,
      exhausted: n.energy <= 10,
      smelly: n.hygiene <= 10,
      bladderUrgent: n.bladder >= 70,
      bladderCritical: n.bladder >= 90,
      canSprint: n.fullness > 0 && n.energy > 0 && p.activity !== 'collapsed',
    };
  }
  _emit(type, p, payload = {}) {
    this.onEvent({ type, userId: p.userId, ...payload, state: this.getState(p.userId) });
  }
}
