import assert from 'node:assert/strict';
import test from 'node:test';

import { layers, modules, validateModules } from '../web/modules.js';

test('module registry is valid and uses unique identifiers', () => {
  assert.equal(validateModules(), true);
  assert.equal(new Set(modules.map(({ id }) => id)).size, modules.length);
});

test('every module has a positive three-dimensional volume', () => {
  for (const module of modules) {
    assert.equal(module.size.length, 3, module.id);
    assert.ok(module.size.every((dimension) => dimension > 0), module.id);
    assert.ok(layers[module.layer], module.id);
  }
});

test('animated panels define a visible change from their base pose', () => {
  const movingModules = modules.filter(({ motion }) => motion);
  assert.ok(movingModules.length > 0);

  for (const module of movingModules) {
    assert.equal(module.motion.position.length, 3, module.id);
    assert.equal(module.motion.rotation.length, 3, module.id);
    assert.notDeepEqual(module.motion.position, module.position, module.id);
  }
});

test('invalid and duplicate modules are rejected', () => {
  assert.throws(() => validateModules([{ ...modules[0], layer: 'unknown' }]), /Invalid module/);
  assert.throws(() => validateModules([modules[0], { ...modules[0] }]), /Duplicate module id/);
});
