/* Iso foot-depth sort for billboards and the player.
 * Error: tall props/trees/furniture drew in front of a character standing
 * in front of their footprint, because WebGL depth used the mid-sprite plane.
 * Rule: sort by the foot (x,z) along the camera ground direction. The actor
 * at the same tile gets a small bias so they stay in front of the prop.
 */
export function isoFootDepth(x, z, direction){
  const dx=Number(direction?.x)||0, dz=Number(direction?.z)||0;
  const len=Math.hypot(dx, dz)||1;
  // Larger = closer to camera (in front). Camera sits along +direction from the focus.
  return ((Number(x)||0)*dx + (Number(z)||0)*dz)/len;
}

export function isoRenderOrder(x, z, direction, bias=0){
  return 20 + Math.round(isoFootDepth(x, z, direction)*200) + (Number(bias)||0);
}

export function closerThan(a, b, direction){
  return isoFootDepth(a.x, a.z, direction) > isoFootDepth(b.x, b.z, direction);
}

export function shouldDrawInFront(actor, object, direction){
  // Actor stands in front of an object when the actor is closer to the camera
  // than the object's foot. Equal tile: actor still wins (bias).
  const ad=isoFootDepth(actor.x, actor.z, direction);
  const od=isoFootDepth(object.x, object.z, direction);
  return ad + 1e-6 >= od;
}
