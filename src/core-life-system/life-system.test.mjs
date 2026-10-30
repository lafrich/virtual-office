import test from 'node:test';
import assert from 'node:assert/strict';
import { LifeSystem } from './life-system.mjs';

const fresh = (options = {}) => {
  const events = [];
  const system = new LifeSystem({ onEvent: event => events.push(event), ...options });
  system.addPlayer('player-1');
  return { system, events };
};
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8);

test('starts with four bounded needs and isolated snapshots', () => {
  const { system } = fresh();
  assert.deepEqual(system.getState('player-1').needs, { fullness: 100, energy: 100, hygiene: 100, bladder: 0 });
  const state = system.getState('player-1');
  state.needs.energy = 0;
  assert.equal(system.getState('player-1').needs.energy, 100);
});

test('restores and sanitizes persisted needs', () => {
  const system = new LifeSystem();
  system.addPlayer('loaded', { needs: { fullness: 160, energy: -5, hygiene: 73, bladder: 40 } });
  assert.deepEqual(system.getState('loaded').needs, { fullness: 100, energy: 0, hygiene: 73, bladder: 40 });
});

test('15 minutes online consumes needs at specified initial rates', () => {
  const { system } = fresh();
  system.tick(15 * 60_000);
  const n = system.getState('player-1').needs;
  close(n.fullness, 90);
  close(n.energy, 92);
  close(n.hygiene, 95);
  close(n.bladder, 20);
});

test('frame-rate independence: one long tick equals many short ticks', () => {
  const a = fresh().system;
  const b = fresh().system;
  a.tick(15 * 60_000);
  for (let i = 0; i < 900; i++) b.tick(1000);
  for (const k of Object.keys(a.getState('player-1').needs)) {
    close(a.getState('player-1').needs[k], b.getState('player-1').needs[k]);
  }
});

test('offline players do not decay and can reconnect with their state', () => {
  const { system } = fresh();
  system.tick(60_000);
  const saved = system.disconnectPlayer('player-1');
  system.tick(300_000);
  assert.deepEqual(system.getState('player-1').needs, saved.needs);
  system.addPlayer('player-1');
  assert.equal(system.getState('player-1').online, true);
});

test('requires actual server-side item authorisation', () => {
  const { system } = fresh();
  system.tick(15 * 60_000);
  assert.throws(() => system.consume('player-1', 'meal', 'fake'), /not authorised/);
  close(system.getState('player-1').needs.fullness, 90);
});

test('authorised food and beverages update needs and clamp to 100', () => {
  const { system } = fresh({ authorizeConsume: ({ itemId }) => itemId === 'owned-item' });
  system.tick(15 * 60_000);
  system.consume('player-1', 'meal', 'owned-item');
  system.consume('player-1', 'snack', 'owned-item');
  system.consume('player-1', 'drink', 'owned-item');
  close(system.getState('player-1').needs.fullness, 100);
  close(system.getState('player-1').needs.bladder, 35);
});

test('one chair cannot be used by two players simultaneously', () => {
  const { system } = fresh();
  system.addPlayer('player-2');
  system.registerObject({ id: 'chair-1', type: 'chair', x: 1, y: 0 });
  system.startAction('player-1', 'sit', { objectId: 'chair-1' });
  assert.throws(() => system.startAction('player-2', 'sit', { objectId: 'chair-1' }), /occupied/);
  system.stopAction('player-1');
  assert.equal(system.startAction('player-2', 'sit', { objectId: 'chair-1' }).activity, 'sit');
});

test('object reach and object/action combinations are validated', () => {
  const { system } = fresh();
  system.registerObject({ id: 'toilet-1', type: 'toilet', x: 100, y: 100 });
  assert.throws(() => system.performAction('player-1', 'pee', { objectId: 'toilet-1' }), /out of reach/);
  system.setPosition('player-1', { x: 100, y: 100 });
  assert.throws(() => system.startAction('player-1', 'sleep', { objectId: 'toilet-1' }), /Invalid object/);
});

test('sleep increases energy while the shared clock keeps running', () => {
  const { system } = fresh();
  system.registerObject({ id: 'bed-1', type: 'bed', x: 0, y: 0 });
  system.tick(15 * 60_000);
  system.startAction('player-1', 'sleep', { objectId: 'bed-1' });
  system.tick(60_000);
  close(system.getState('player-1').needs.energy, 100);
  assert.equal(system.getState('player-1').activity, 'sleep');
});

test('sitting recovers 2 energy per minute', () => {
  const { system } = fresh();
  system.tick(15 * 60_000);
  system.startAction('player-1', 'sit');
  system.tick(60_000);
  close(system.getState('player-1').needs.energy, 94);
});

test('movement stops sitting and frees its occupied chair', () => {
  const { system } = fresh();
  system.registerObject({ id: 'chair-1', type: 'chair', x: 0, y: 0 });
  system.startAction('player-1', 'sit', { objectId: 'chair-1' });
  system.setMovement('player-1', 'walk');
  assert.equal(system.getState('player-1').activity, 'idle');
  assert.equal(system.occupied.has('chair-1'), false);
});

test('showering and handwashing require a reachable appropriate object', () => {
  const { system } = fresh();
  system.tick(60 * 60_000);
  system.registerObject({ id: 'shower-1', type: 'shower', x: 1, y: 0 });
  system.registerObject({ id: 'sink-1', type: 'sink', x: 2, y: 0 });
  assert.throws(() => system.performAction('player-1', 'shower'), /requires/);
  system.performAction('player-1', 'shower', { objectId: 'shower-1' });
  close(system.getState('player-1').needs.hygiene, 100);
  system.performAction('player-1', 'washHands', { objectId: 'sink-1' });
  close(system.getState('player-1').needs.hygiene, 100);
});

test('outside peeing has hygiene penalty and emits NPC reaction hook', () => {
  const { system, events } = fresh();
  system.tick(15 * 60_000);
  const s = system.performAction('player-1', 'pee');
  close(s.needs.bladder, 0);
  close(s.needs.hygiene, 75);
  assert.ok(events.some(e => e.type === 'npc-reaction-trigger' && e.reason === 'pee-outside'));
});

test('peeing at a toilet does not lower hygiene', () => {
  const { system } = fresh();
  system.registerObject({ id: 'toilet-1', type: 'toilet', x: 1, y: 0 });
  system.tick(15 * 60_000);
  system.performAction('player-1', 'pee', { objectId: 'toilet-1' });
  close(system.getState('player-1').needs.hygiene, 95);
  close(system.getState('player-1').needs.bladder, 0);
});

test('bladder overflow triggers a single accident and resets bladder', () => {
  const { system, events } = fresh();
  system.tick(74.25 * 60_000);
  assert.equal(events.filter(e => e.type === 'accident').length, 0);
  system.tick(60_000);
  assert.equal(events.filter(e => e.type === 'accident').length, 1);
  close(system.getState('player-1').needs.bladder, 0);
});

test('exhaustion collapses temporarily and recovers without death', () => {
  const { system, events } = fresh();
  system.tick(188 * 60_000);
  assert.equal(system.getState('player-1').activity, 'collapsed');
  assert.throws(() => system.setMovement('player-1', 'run'), /too exhausted/);
  system.tick(60_000);
  assert.equal(system.getState('player-1').activity, 'idle');
  assert.ok(events.some(e => e.type === 'action' && e.phase === 'recover'));
});

test('zero fullness blocks sprint', () => {
  const { system } = fresh();
  system.tick(150 * 60_000);
  assert.equal(system.getState('player-1').needs.fullness, 0);
  assert.throws(() => system.setMovement('player-1', 'run'), /too exhausted|too hungry/);
  assert.equal(system.getState('player-1').warnings.canSprint, false);
});

test('disconnection releases occupancy and prevents offline actions', () => {
  const { system } = fresh();
  system.registerObject({ id: 'bed-1', type: 'bed', x: 0, y: 0 });
  system.startAction('player-1', 'sleep', { objectId: 'bed-1' });
  system.disconnectPlayer('player-1');
  assert.equal(system.occupied.has('bed-1'), false);
  assert.throws(() => system.performAction('player-1', 'fart'), /offline/);
});

test('invalid actions cannot mutate game state', () => {
  const { system } = fresh();
  const before = system.getState('player-1');
  assert.throws(() => system.performAction('player-1', 'teleport'), /Unsupported/);
  assert.throws(() => system.tick(-5), /non-negative/);
  assert.deepEqual(system.getState('player-1'), before);
});

test('sleep on ground is possible and emits a reaction hook', () => {
  const { system, events } = fresh();
  system.startAction('player-1', 'sleep');
  assert.equal(system.getState('player-1').activity, 'sleep');
  assert.ok(events.some(e => e.type === 'npc-reaction-trigger' && e.reason === 'sleep-on-ground'));
});

test('running automatically stops when fullness becomes zero', () => {
  const { system } = fresh();
  system.config.fullnessPerMinute = -100;
  system.setMovement('player-1', 'run');
  system.tick(60_000);
  assert.equal(system.getState('player-1').movement, 'walk');
});
