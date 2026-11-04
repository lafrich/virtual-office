/* Semesta · structural wireframe view for editable buildings.
 * Presentation-only: does not mutate map objects, collision or AI routes.
 * Combines edges into one GPU line object per building and adds a transparent
 * selection proxy so users can still tap / move the building on mobile.
 */
(function(g){
'use strict';
function build(THREE,root,item,catalog){
 const vertices=[],colors=[];
 const edgeBlue=new THREE.Color('#386bb0');
 const fineBlue=new THREE.Color('#8cb8cb');
 const footprintColor=new THREE.Color('#dfb85b');
 function segment(a,b,color){
  vertices.push(a.x,a.y,a.z,b.x,b.y,b.z);
  for(let j=0;j<2;j++)colors.push(color.r,color.g,color.b);
 }
 const sourceMeshes=[];
 root.traverse(mesh=>{
  if(mesh.isMesh&&mesh.geometry&&!mesh.userData.buildingOutlinePick)sourceMeshes.push(mesh);
 });
 // Native mesh edges include real window, entrance, roof and landmark details,
 // instead of only outlining a featureless bounding rectangle.
 root.updateWorldMatrix(true,true);
 const inverse=new THREE.Matrix4().copy(root.matrixWorld).invert();
 const transform=new THREE.Matrix4(),ptA=new THREE.Vector3(),ptB=new THREE.Vector3();
 let segmentCount=0;
 for(const mesh of sourceMeshes){
  if(segmentCount>22000)break;
  const edgeGeo=new THREE.EdgesGeometry(mesh.geometry,28);
  const positions=edgeGeo.getAttribute('position');
  if(positions){
   transform.multiplyMatrices(inverse,mesh.matrixWorld);
   const count=Math.min(positions.count,Math.max(0,44000-segmentCount*2));
   for(let i=0;i<count-1;i+=2){
    ptA.fromBufferAttribute(positions,i).applyMatrix4(transform);
    ptB.fromBufferAttribute(positions,i+1).applyMatrix4(transform);
    segment(ptA,ptB,mesh.userData.billboardPart?fineBlue:edgeBlue);
    segmentCount++;
   }
  }
  edgeGeo.dispose();
 }
 const meta=item.type==='sprite'?catalog?.get(item.asset):null;
 const w=Math.max(.65,Number(meta?.footprint?.[0]||item.w||4));
 const d=Math.max(.65,Number(meta?.footprint?.[1]||item.d||4));
 const h=Math.max(1.3,Number(meta?.source==='custom-building'?(meta.height||item.height||5):(item.h||item.height||meta?.height||5)));
 const hw=w/2,hd=d/2;
 function rect(y,x0=-hw,x1=hw,z0=-hd,z1=hd,color=footprintColor){
  segment({x:x0,y,z:z0},{x:x1,y,z:z0},color);
  segment({x:x1,y,z:z0},{x:x1,y,z:z1},color);
  segment({x:x1,y,z:z1},{x:x0,y,z:z1},color);
  segment({x:x0,y,z:z1},{x:x0,y,z:z0},color);
 }
 // Gold footprint and white/cyan height markers remain recognizable even if
 // the original game building is a single billboard rather than a 3D mesh.
 rect(.08);
 rect(h, -hw,hw,-hd,hd,fineBlue);
 for(const x of [-hw,hw])for(const z of [-hd,hd])
  segment({x,y:.08,z},{x,y:h,z},fineBlue);
 // Floor-level guides, only on facade surfaces (not intrusive full boxes).
 const floors=Math.max(1,Math.min(8,Math.round(h/3)));
 if(floors>1)for(let floor=1;floor<floors;floor++){
  const y=h*floor/floors;
  segment({x:-hw,y,z:hd+.015},{x:hw,y,z:hd+.015},fineBlue);
  segment({x:hw+.015,y,z:-hd},{x:hw+.015,y,z:hd},fineBlue);
 }
 // Entrance marker on the frontage, useful when interior placement is planned.
 const dw=Math.min(2,w*.28),doorY=Math.min(2.7,h*.45),z=hd+.022;
 segment({x:-dw/2,y:.08,z},{x:-dw/2,y:doorY,z},footprintColor);
 segment({x:-dw/2,y:doorY,z},{x:dw/2,y:doorY,z},footprintColor);
 segment({x:dw/2,y:doorY,z},{x:dw/2,y:.08,z},footprintColor);
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
 geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 const mat=new THREE.LineBasicMaterial({
  vertexColors:true,transparent:true,opacity:.95,depthTest:true,depthWrite:false
 });
 const lines=new THREE.LineSegments(geometry,mat);
 lines.userData.buildingOutlineLine=true;
 lines.raycast=()=>{};lines.renderOrder=6;
 // Mesh remains raycastable but renders no color or depth pixels.
 const pickMaterial=new THREE.MeshBasicMaterial({
  color:0xffffff,transparent:true,opacity:0,
  depthTest:false,depthWrite:false,colorWrite:false,side:THREE.DoubleSide
 });
 const pick=new THREE.Mesh(new THREE.BoxGeometry(w,Math.max(h,1),d),pickMaterial);
 pick.position.y=h/2;pick.userData.buildingOutlinePick=true;
 const group=new THREE.Group();
 group.name='Semesta Building Outline';
 group.userData.buildingOutlineHelper=true;
 group.add(lines,pick);
 return {group,segmentCount:vertices.length/6,
  dispose(){
   geometry.dispose();mat.dispose();pick.geometry.dispose();pickMaterial.dispose();
  }};
}
g.VLSemestaBuildingOutline=Object.freeze({build});
})(window);
