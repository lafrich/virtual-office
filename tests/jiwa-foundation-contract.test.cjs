/* Foundation contract test: proposal-only config, not production gameplay validation. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const config=JSON.parse(fs.readFileSync(path.join(__dirname,'../jiwa/foundation-config.v1.json'),'utf8'));
test('foundation preserves existing UI rather than adding new HUD',()=>{
  assert.equal(config.existingUI.bag.separateFromPhone,true);
  assert.equal(config.existingUI.bag.slots,8);
  assert(config.existingUI.phone.includes('minimap'));
  assert.equal(config.existingUI.action.singleContextButton,true);
  assert.equal(config.existingUI.noExtraTopHUD,true);
});
test('crossing uses one completion event with one energy charge',()=>{
  assert.equal(config.world.renderer,'semesta_3d_isometric');
  assert.equal(config.world.crossing.event,'CROSSING_COMPLETED');
  assert.equal(config.world.crossing.oncePerCrossingId,true);
  assert.equal(config.world.crossing.collisionResetCharge,0);
});
test('core survival is feasible and cannot be hard locked by social',()=>{
  assert(config.economy.exampleBudget.stapleMealRp+config.economy.exampleBudget.snackRp<=config.economy.dailyWorkQuotaRp);
  assert.equal(config.survival.energyZeroCanMove,true);
  assert.equal(config.survival.publicRestAvailable,true);
  assert.equal(config.survival.publicIncomeRouteAvailable,true);
  assert.equal(config.progression.socialOptionalForCoreIncome,true);
});
test('money, items, and housing require authoritative validation',()=>{
  assert.equal(config.authority.state,'server');
  assert.equal(config.authority.deduplicateEvents,true);
  assert.equal(config.authority.atomicPayments,true);
  assert.equal(config.economy.scavenge.uniqueSpawnClaim,true);
  assert.equal(config.housing.authorizedRoomEntry,true);
  assert.equal(config.housing.homelessPublicFallback,true);
});
test('AI social systems remain future flags, not fake live features',()=>{
  assert.equal(config.status,'proposal_only_not_live');
  assert.equal(config.futureSocial.enabled,false);
  assert.equal(config.futureSocial.aiCannotMutateWallet,true);
  assert.equal(config.futureSocial.prayerNotMoralShortcut,true);
});
