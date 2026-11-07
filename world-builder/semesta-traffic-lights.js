/* Semesta traffic-light controller.
   Shared deterministic cycle: NS green → NS yellow → PED → EW green → EW yellow → PED.
   Placeable poles are sidewalk-corner sprites (collision:false). Stop lines are virtual.
   Vehicles use stopAhead() as a pace cap so red waits never recycle (following=true when cap=0). */
(function(g){
'use strict';

const SOURCE = 'traffic-light';
const DEFAULT_CYCLE = 32;
const MIN_CYCLE = 12;
const MAX_CYCLE = 120;
const PHASES = ['NS_GREEN','NS_YELLOW','PED','EW_GREEN','EW_YELLOW','PED'];
const FACINGS = ['sw','se'];
const LAMPS = ['red','yellow','green','ped'];

function clampCycle(sec){
  const n = Number(sec);
  if(!Number.isFinite(n)) return DEFAULT_CYCLE;
  return Math.max(MIN_CYCLE, Math.min(MAX_CYCLE, n));
}

function splitCycle(cycleSeconds){
  const cycle = clampCycle(cycleSeconds);
  // Two vehicle greens + two yellows + two pedestrian all-reds = cycle.
  const yellow = cycle >= 24 ? 3 : 2;
  const ped = cycle >= 24 ? 3 : 2;
  const green = Math.max(3, (cycle - 2 * (yellow + ped)) / 2);
  return {cycle, yellow, ped, green, phases:[
    {name:'NS_GREEN', seconds:green},
    {name:'NS_YELLOW', seconds:yellow},
    {name:'PED', seconds:ped},
    {name:'EW_GREEN', seconds:green},
    {name:'EW_YELLOW', seconds:yellow},
    {name:'PED', seconds:ped}
  ]};
}

function phaseAt(t, cycleSeconds){
  const {cycle, phases} = splitCycle(cycleSeconds);
  const u = ((Number(t) || 0) % cycle + cycle) % cycle;
  let acc = 0;
  for(const p of phases){
    acc += p.seconds;
    if(u < acc) return p.name;
  }
  return phases[phases.length - 1].name;
}

function vehicleSignal(phase, approach){
  const ns = approach === 'ns';
  if(phase === 'NS_GREEN') return ns ? 'green' : 'red';
  if(phase === 'NS_YELLOW') return ns ? 'yellow' : 'red';
  if(phase === 'EW_GREEN') return ns ? 'red' : 'green';
  if(phase === 'EW_YELLOW') return ns ? 'red' : 'yellow';
  return 'red';
}

function pedSignal(phase){
  return phase === 'PED' ? 'walk' : 'wait';
}

function poleLamp(phase, approach){
  const sig = vehicleSignal(phase, approach || 'ns');
  if(phase === 'PED') return 'ped';
  return sig;
}

function spriteUrl(facing, lamp){
  const f = FACINGS.includes(facing) ? facing : 'sw';
  const l = LAMPS.includes(lamp) ? lamp : 'red';
  return './legacy-assets/traffic-light/traffic_light_' + f + '_' + l + '.png';
}

function catalogEntries(){
  return FACINGS.map(facing => ({
    file: 'traffic_light_' + facing,
    name: 'traffic_light_' + facing,
    label: facing === 'sw' ? 'Lampu lalu lintas (SW)' : 'Lampu lalu lintas (SE)',
    category: 'street',
    group: 'Street',
    source: SOURCE,
    facing,
    url: spriteUrl(facing, 'red'),
    relativeFile: 'traffic_light_' + facing + '_red.png',
    collision: false,
    blocking: 'no',
    footprint: {w: 1, d: 1},
    width: 1.15,
    height: 2.4,
    pivotY: 0.94,
    size: [48, 96],
    pivot: [24, 90],
    trafficRole: 'signal',
    trafficLight: {facing, approach: facing === 'sw' ? 'ns' : 'ew'}
  }));
}

function registerCatalog(){
  const prev = Array.isArray(g.VLAssetCatalog) ? Array.from(g.VLAssetCatalog) : [];
  const names = new Set(prev.map(e => e && (e.file || e.name)));
  let changed = false;
  catalogEntries().forEach(e => {
    if(!names.has(e.file) && !names.has(e.name)){
      prev.push(e);
      names.add(e.file);
      changed = true;
    }
  });
  if(changed || !g.VLAssetCatalog){
    g.VLAssetCatalog = Object.freeze(prev);
  }
  return catalogEntries();
}

function isRoadCell(kind){
  return kind === 'road' || kind === 'road_mark';
}

function cellKind(c){
  return c && (c.type || c.kind) || '';
}
function cellsOf(cells, pred){
  return (cells || []).filter(c => pred(cellKind(c)));
}

function uniqueBands(values){
  const sorted = Array.from(new Set(values)).sort((a, b) => a - b);
  const bands = [];
  for(const v of sorted){
    const last = bands[bands.length - 1];
    if(last && v === last.max + 1) last.max = v;
    else bands.push({min: v, max: v});
  }
  return bands;
}

function findIntersectionBoxes(cells){
  const roads = cellsOf(cells, isRoadCell);
  if(!roads.length) return [];
  const byR = new Map();
  const byC = new Map();
  roads.forEach(cell => {
    if(!byR.has(cell.r)) byR.set(cell.r, new Set());
    byR.get(cell.r).add(cell.c);
    if(!byC.has(cell.c)) byC.set(cell.c, new Set());
    byC.get(cell.c).add(cell.r);
  });
  // A row is "horizontal road" if it has a long contiguous run (>= 8 cells).
  const hRows = [];
  byR.forEach((cols, r) => {
    const bands = uniqueBands(Array.from(cols));
    if(bands.some(b => b.max - b.min + 1 >= 8)) hRows.push(r);
  });
  const vCols = [];
  byC.forEach((rows, c) => {
    const bands = uniqueBands(Array.from(rows));
    if(bands.some(b => b.max - b.min + 1 >= 8)) vCols.push(c);
  });
  const hBands = uniqueBands(hRows);
  const vBands = uniqueBands(vCols);
  const boxes = [];
  hBands.forEach(hb => {
    vBands.forEach(vb => {
      const id = 'x' + vb.min + 'z' + hb.min;
      boxes.push({
        id,
        minC: vb.min,
        maxC: vb.max,
        minR: hb.min,
        maxR: hb.max,
        minX: vb.min,
        maxX: vb.max + 1,
        minZ: hb.min,
        maxZ: hb.max + 1
      });
    });
  });
  return boxes;
}

const JAKARTA_TARGETS = [
  [19, 43],   // Kebon Sirih × Jl. MH Thamrin
  [19, 73],   // Bundaran HI / Thamrin
  [47, 44],   // Menteng crossing
  [-8, 44],   // west main × Kebon Sirih
  [19, 17],   // north Thamrin
  [47, 73]    // SE crossing
];

function boxCenter(box){
  return {
    x: (box.minC + box.maxC + 1) / 2,
    z: (box.minR + box.maxR + 1) / 2
  };
}

function pickIntersectionBoxes(boxes, maxCount){
  const limit = maxCount == null ? 6 : maxCount;
  if(!boxes.length) return [];
  const used = new Set();
  const chosen = [];
  JAKARTA_TARGETS.forEach(([tc, tr]) => {
    if(chosen.length >= limit) return;
    let best = null, bestD = Infinity;
    boxes.forEach(box => {
      if(used.has(box.id)) return;
      const c = boxCenter(box);
      const d = (c.x - tc) * (c.x - tc) + (c.z - tr) * (c.z - tr);
      if(d < bestD){ bestD = d; best = box; }
    });
    if(best && bestD < 18 * 18){
      used.add(best.id);
      chosen.push(best);
    }
  });
  if(!chosen.length){
    return boxes.slice(0, limit);
  }
  return chosen;
}

function roadSet(cells){
  const set = new Set();
  cellsOf(cells, isRoadCell).forEach(c => set.add(c.c + ',' + c.r));
  return set;
}

function isRoadAt(roads, c, r){
  return roads.has(c + ',' + r);
}

function sidewalkCorner(box, dx, dz, roads){
  const c = dx < 0 ? box.minC - 1 : box.maxC + 1;
  const r = dz < 0 ? box.minR - 1 : box.maxR + 1;
  if(isRoadAt(roads, c, r)){
    // Nudge one more cell diagonally off the road if the first ring is paved.
    const c2 = c + (dx < 0 ? -1 : 1);
    const r2 = r + (dz < 0 ? -1 : 1);
    if(!isRoadAt(roads, c2, r2)) return {x: c2 + 0.5, z: r2 + 0.5, c: c2, r: r2};
    return null;
  }
  return {x: c + 0.5, z: r + 0.5, c, r};
}

function stopLinesFor(box){
  return [
    {axis: 'z', value: box.minR - 0.08, heading: +1, minOther: box.minC, maxOther: box.maxC + 1, approach: 'ns'},
    {axis: 'z', value: box.maxR + 1.08, heading: -1, minOther: box.minC, maxOther: box.maxC + 1, approach: 'ns'},
    {axis: 'x', value: box.minC - 0.08, heading: +1, minOther: box.minR, maxOther: box.maxR + 1, approach: 'ew'},
    {axis: 'x', value: box.maxC + 1.08, heading: -1, minOther: box.minR, maxOther: box.maxR + 1, approach: 'ew'}
  ];
}

function makePole(box, pos, facing, approach, index){
  return {
    id: 'tl-' + box.id + '-' + index,
    type: 'sprite',
    asset: 'traffic_light_' + facing,
    name: 'traffic_light_' + facing,
    label: 'Lampu lalu lintas',
    category: 'street',
    source: SOURCE,
    x: pos.x,
    z: pos.z,
    y: 0,
    rotation: 0,
    scale: 1,
    width: 1.15,
    height: 2.4,
    collision: false,
    blocking: 'no',
    replaceable: true,
    trafficRole: 'signal',
    trafficLight: {
      facing,
      approach,
      intersectionId: box.id,
      lamp: 'red'
    }
  };
}

function seedObjects(map, opts){
  const cells = map && map.terrain && map.terrain.cells || [];
  const boxes = pickIntersectionBoxes(findIntersectionBoxes(cells), opts && opts.max);
  const roads = roadSet(cells);
  const objects = [];
  boxes.forEach(box => {
    const corners = [
      {dx: -1, dz: -1, facing: 'se', approach: 'ns'},
      {dx: +1, dz: -1, facing: 'sw', approach: 'ew'},
      {dx: -1, dz: +1, facing: 'se', approach: 'ew'},
      {dx: +1, dz: +1, facing: 'sw', approach: 'ns'}
    ];
    corners.forEach((corner, i) => {
      const pos = sidewalkCorner(box, corner.dx, corner.dz, roads);
      if(!pos) return;
      objects.push(makePole(box, pos, corner.facing, corner.approach, i));
    });
  });
  return {objects, boxes};
}

function polesOf(objects){
  return (objects || []).filter(o => o && (o.trafficRole === 'signal' || o.trafficLight || (o.source === SOURCE)));
}

function boxesForPoles(map, objects){
  const cells = map && map.terrain && map.terrain.cells || [];
  const all = findIntersectionBoxes(cells);
  const poles = polesOf(objects);
  if(!poles.length) return [];
  const byId = new Map(all.map(b => [b.id, b]));
  const out = [];
  const seen = new Set();
  poles.forEach(p => {
    const tid = p.trafficLight && p.trafficLight.intersectionId;
    if(tid && byId.has(tid) && !seen.has(tid)){
      seen.add(tid);
      out.push(byId.get(tid));
    }
  });
  all.forEach(box => {
    if(seen.has(box.id)) return;
    const near = poles.some(p => p.x >= box.minC - 3 && p.x <= box.maxC + 4 && p.z >= box.minR - 3 && p.z <= box.maxR + 4);
    if(near){
      seen.add(box.id);
      out.push(box);
    }
  });
  return out;
}

function pointInBox(x, z, box, pad){
  const p = pad || 0;
  return x >= box.minX - p && x <= box.maxX + p && z >= box.minZ - p && z <= box.maxZ + p;
}

function sampleRoute(route, dist){
  if(g.VLSemestaTraffic && typeof g.VLSemestaTraffic.sample === 'function' && route && Array.isArray(route.edges) && route.edges.length){
    return g.VLSemestaTraffic.sample(route, dist);
  }
  const pts = route && route.points || [];
  if(pts.length < 2) return pts[0] || {x: 0, z: 0};
  let remain = Math.max(0, dist);
  for(let i = 0; i < pts.length - 1; i++){
    const a = pts[i], b = pts[i + 1];
    const dx = b.x - a.x, dz = b.z - a.z;
    const len = Math.hypot(dx, dz) || 1e-6;
    if(remain <= len){
      const t = remain / len;
      return {x: a.x + dx * t, z: a.z + dz * t};
    }
    remain -= len;
  }
  return pts[pts.length - 1];
}

function headingOf(from, to){
  return {hx: to.x - from.x, hz: to.z - from.z};
}

function lineMatches(line, pos, next){
  const {hx, hz} = headingOf(pos, next);
  if(line.axis === 'z'){
    if(Math.sign(hz) !== Math.sign(line.heading) && Math.abs(hz) > 1e-4) return false;
    if(pos.x < line.minOther - 0.35 || pos.x > line.maxOther + 0.35) return false;
    return true;
  }
  if(Math.sign(hx) !== Math.sign(line.heading) && Math.max(Math.abs(hx), Math.abs(hz)) > 1e-4) return false;
  if(pos.z < line.minOther - 0.35 || pos.z > line.maxOther + 0.35) return false;
  return true;
}

function distanceAlongToLine(route, startD, line, look){
  const step = 0.25;
  const horizon = look == null ? 14 : look;
  let prev = sampleRoute(route, startD);
  for(let d = step; d <= horizon; d += step){
    const cur = sampleRoute(route, startD + d);
    if(!lineMatches(line, prev, cur)){ prev = cur; continue; }
    if(line.axis === 'z'){
      const crossed = (prev.z - line.value) * (cur.z - line.value) <= 0 ||
        (line.heading > 0 && prev.z < line.value && cur.z >= line.value) ||
        (line.heading < 0 && prev.z > line.value && cur.z <= line.value);
      if(crossed){
        const span = cur.z - prev.z;
        const t = Math.abs(span) < 1e-6 ? 0 : (line.value - prev.z) / span;
        return Math.max(0, d - step + step * t);
      }
    } else {
      const crossed = (prev.x - line.value) * (cur.x - line.value) <= 0 ||
        (line.heading > 0 && prev.x < line.value && cur.x >= line.value) ||
        (line.heading < 0 && prev.x > line.value && cur.x <= line.value);
      if(crossed){
        const span = cur.x - prev.x;
        const t = Math.abs(span) < 1e-6 ? 0 : (line.value - prev.x) / span;
        return Math.max(0, d - step + step * t);
      }
    }
    prev = cur;
  }
  return Infinity;
}

function alreadyPastLine(pos, line){
  if(line.axis === 'z'){
    if(line.heading > 0) return pos.z >= line.value + 0.12;
    return pos.z <= line.value - 0.12;
  }
  if(line.heading > 0) return pos.x >= line.value + 0.12;
  return pos.x <= line.value - 0.12;
}

function alreadyInIntersection(pos, box){
  return pointInBox(pos.x, pos.z, box, -0.05);
}

function carDistance(car){
  if(!car) return 0;
  const d = car.distance != null ? car.distance : car.dist;
  return Number.isFinite(Number(d)) ? Number(d) : 0;
}

function stopAhead(car, map, objects, phase, look){
  if(!car || !car.route) return Infinity;
  const boxes = boxesForPoles(map, objects);
  if(!boxes.length) return Infinity;
  const startD = carDistance(car);
  const pos = sampleRoute(car.route, startD);
  const peek = sampleRoute(car.route, startD + 0.4);
  let best = Infinity;
  boxes.forEach(box => {
    if(alreadyInIntersection(pos, box)) return;
    stopLinesFor(box).forEach(line => {
      const sig = vehicleSignal(phase, line.approach);
      if(sig === 'green') return;
      if(alreadyPastLine(pos, line) && alreadyInIntersection(peek, box)) return;
      if(alreadyPastLine(pos, line) && !lineMatches(line, pos, peek)) return;
      const d = distanceAlongToLine(car.route, startD, line, look);
      // Hold slightly before the line so the front of the car does not enter.
      const hold = Math.max(0, d - 0.55);
      if(hold < best) best = hold;
    });
  });
  return best;
}

function moduleSettings(gameplay){
  const tl = gameplay && gameplay.modules && gameplay.modules.trafficLights || {};
  return {
    enabled: tl.enabled !== false,
    cycleSeconds: clampCycle(tl.cycleSeconds == null ? DEFAULT_CYCLE : tl.cycleSeconds)
  };
}

function constrainPlayer(from, to, map, objects, phase){
  if(!from || !to) return to;
  if(pedSignal(phase) === 'walk') return to;
  const boxes = boxesForPoles(map, objects);
  for(let i = 0; i < boxes.length; i++){
    const box = boxes[i];
    const wasIn = pointInBox(from.x, from.z, box, 0.05);
    const willIn = pointInBox(to.x, to.z, box, 0.05);
    if(!wasIn && willIn) return from;
  }
  return to;
}

function constrainPedestrian(from, to, map, objects, phase){
  return constrainPlayer(from, to, map, objects, phase);
}

function poleStates(objects, phase){
  return polesOf(objects).map(o => {
    const facing = (o.trafficLight && o.trafficLight.facing) || (String(o.name || '').endsWith('_se') ? 'se' : 'sw');
    const approach = (o.trafficLight && o.trafficLight.approach) || (facing === 'sw' ? 'ns' : 'ew');
    const lamp = poleLamp(phase, approach);
    return {
      id: o.id,
      facing,
      approach,
      lamp,
      url: spriteUrl(facing, lamp)
    };
  });
}

function paintObjectRecords(objects, phase){
  const byId = new Map(poleStates(objects, phase).map(s => [s.id, s]));
  (objects || []).forEach(o => {
    const s = byId.get(o.id);
    if(!s) return;
    if(!o.trafficLight) o.trafficLight = {};
    o.trafficLight.lamp = s.lamp;
    o.trafficLight.facing = s.facing;
    o.trafficLight.approach = s.approach;
    o._lightUrl = s.url;
  });
  return objects;
}

g.VLSemestaTrafficLights = {
  SOURCE,
  DEFAULT_CYCLE,
  MIN_CYCLE,
  MAX_CYCLE,
  PHASES,
  clampCycle,
  splitCycle,
  phaseAt,
  vehicleSignal,
  pedSignal,
  poleLamp,
  spriteUrl,
  catalogEntries,
  registerCatalog,
  findIntersectionBoxes,
  pickIntersectionBoxes,
  stopLinesFor,
  seedObjects,
  polesOf,
  boxesForPoles,
  sampleRoute,
  stopAhead,
  moduleSettings,
  constrainPlayer,
  constrainPedestrian,
  poleStates,
  paintObjectRecords,
  carDistance,
  JAKARTA_TARGETS
};

if(typeof g.VLAssetCatalog !== 'undefined' || g.window){
  try{ registerCatalog(); }catch(_e){}
}
})(typeof window !== 'undefined' ? window : global);
