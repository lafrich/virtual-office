const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const root = path.join(__dirname, '..');
const laptop = fs.readFileSync(path.join(root, 'membangun/laptop.html'), 'utf8');
const launcher = fs.readFileSync(path.join(root, 'membangun/index.html'), 'utf8');

test('mini laptop inline JS parses', () => {
  const scripts = [...laptop.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(x => x[1]);
  assert.equal(scripts.length, 1);
  assert.doesNotThrow(() => new vm.Script(scripts[0], { filename: 'membangun/laptop.html' }));
});

test('all referenced mini laptop control IDs exist', () => {
  const ids = new Set([...laptop.matchAll(/\bid="([^"]+)"/g)].map(x => x[1]));
  const references = [...laptop.matchAll(/\$\('([^']+)'\)/g)].map(x => x[1]);
  for (const id of references) assert.ok(ids.has(id), 'Missing ID '+id);
});

test('launcher mini laptop entry and five apps are wired', () => {
  assert.match(launcher, /id="laptopMode"/);
  assert.match(launcher, /laptop\.html\?app=/);
  for (const name of ['mahluk', 'emotion', 'bangun', 'semesta', 'jiwa']) {
    assert.match(laptop, new RegExp("id:'"+name+"'"));
  }
});

test('desktop, virtual mouse and virtual keyboard are present', () => {
  for (const id of ['appFrame','touchpad','leftClick','rightClick','dragLock','scrollZone','keyboard','keyMode','padMode','zoomOut','zoomIn']) {
    assert.match(laptop, new RegExp('id="'+id+'"'));
  }
  assert.match(laptop, /touch-action:none/);
  assert.match(laptop, /dispatchEvent\(new w\.MouseEvent/);
  assert.match(laptop, /new w\.KeyboardEvent/);
});
