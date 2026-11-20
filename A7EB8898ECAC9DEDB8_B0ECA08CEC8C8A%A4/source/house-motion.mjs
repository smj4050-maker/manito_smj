// Local decorative motion; visibility uses a fixed two-hour window after room entry.
export const CROWD_GAP={x:38,y:38};
export function getCrowdAppearance(count){
 if(count<=12)return {scale:2.15,gap:{x:60,y:60}};
 if(count<=30)return {scale:1.8,gap:{x:50,y:50}};
 if(count<=40)return {scale:1.55,gap:{x:44,y:44}};
 return {scale:1.4,gap:{...CROWD_GAP}};
}
export const ACTION_LABELS={walk:'산책 중',rest:'잠깐 쉬기',sit:'앉아서 쉬기',wave:'손 흔들기',heart:'하트 보내기',surprise:'깜짝!',greet:'서로 인사하기',prank:'친구에게 장난치기',photo:'사진 찍기',warm:'불 쬐기',read:'책 읽기',admire:'트리 구경하기'};
export function roomSeed(id){return [...id].reduce((v,c)=>(v*31+c.charCodeAt(0))>>>0,7);}
export function makeHouseRoute(id,index,count){
 const value=roomSeed(id),lane=index%2,upper=[335+value%460,161+lane*40];
 const points=[upper,[790-value%170,161+lane*40],[335+value%190,161+lane*40],
 [255,205],[215,275],[160,360],[75,480],
 [240,515+index%3*40],[450+value%200,515+index%3*40],[785,515+index%3*40],
 [785,433+lane*40],[325,433+lane*40],[235,555+index%2*40],
 [132,480],[215,360],[270,275],[305,205],upper];
 return {points,times:[0,.12,.22,.28,.315,.35,.40,.46,.55,.61,.65,.74,.80,.84,.875,.91,.945,1],duration:115+value%65,phase:(index/Math.max(1,count)+.015*(value%5))%1};
}
export function sampleHouseRoute(route,phase){
 phase=((phase%1)+1)%1;let segment=1;while(segment<route.times.length-1&&phase>route.times[segment])segment++;
 const t=(phase-route.times[segment-1])/(route.times[segment]-route.times[segment-1]),a=route.points[segment-1],b=route.points[segment];
 return {x:a[0]+(b[0]-a[0])*t,y:a[1]+(b[1]-a[1])*t};
}
export const overlaps=(a,b,gap=CROWD_GAP)=>Math.abs(a.x-b.x)<gap.x&&Math.abs(a.y-b.y)<gap.y;
const stairs=a=>a.x<318&&a.y>214&&a.y<510;
const random=a=>{a.seed=(Math.imul(a.seed,1664525)+1013904223)>>>0;return a.seed/4294967296;};
function setAction(a,kind,time,duration,partner=null){a.action=kind;a.until=time+duration;a.partner=partner;a.nextAction=a.until+2+random(a)*5;}
export function createCrowd(ids){
 const agents=[],appearance=getCrowdAppearance(ids.length),gap=appearance.gap;
 ids.forEach((id,index)=>{
  const route=makeHouseRoute(id,index,ids.length),a={id,route,phase:route.phase,seed:roomSeed(id),action:'walk',until:0,partner:null,nextAction:1+(index%7)*.75,blocked:0};
  let found=false;
  for(let attempt=0;attempt<2200;attempt++){
   const phase=(route.phase+attempt*.61803398875)%1,p=sampleHouseRoute(route,phase);
   if(!agents.some(other=>overlaps(p,other,gap))){Object.assign(a,p,{phase});found=true;break;}
  }
  if(!found){
   outer:for(const y of [...Array.from({length:Math.floor(180/gap.y)+1},(_,row)=>610-row*gap.y),201,161])for(let x=y<220?335:240;x<840;x+=gap.x+1){if(!agents.some(other=>overlaps({x,y},other,gap))){Object.assign(a,{x,y});let nearest=Infinity;for(let sample=0;sample<1000;sample++){const phase=sample/1000,p=sampleHouseRoute(route,phase),distance=Math.hypot(p.x-x,p.y-y);if(distance<nearest){nearest=distance;a.phase=phase;}}found=true;break outer;}}
  }
  if(!found)throw new Error('미니룸에 빈 자리가 부족합니다.');
  agents.push(a);
 });
 return {agents,appearance,time:0,tick:0};
}
export function stepCrowd(world,dt){
 dt=Math.min(.1,Math.max(0,dt));world.time+=dt;world.tick++;
 const {agents,time,appearance}=world;
 for(const a of agents){
  if(a.action!=='walk'&&time>=a.until){a.action='walk';a.partner=null;}
  if(a.action!=='walk'||time<a.nextAction||stairs(a))continue;
  const chance=random(a);
  if(a.y>420&&Math.hypot(a.x-792,a.y-465)<66&&chance<.65){setAction(a,'warm',time,3+random(a)*3);continue;}
  if(((a.y<220&&a.x>650&&a.x<770)||(a.y>420&&a.y<485&&a.x>665&&a.x<745))&&chance<.65){setAction(a,'read',time,3+random(a)*4);continue;}
  if(a.y>495&&a.y<555&&a.x>365&&a.x<635&&chance<.6){setAction(a,'admire',time,3+random(a)*3);continue;}
  const friend=agents.find(b=>b!==a&&b.action==='walk'&&!stairs(b)&&Math.abs(a.y-b.y)<18&&Math.abs(a.x-b.x)>33&&Math.abs(a.x-b.x)<88);
  if(friend&&chance<.4){
   const prank=random(a)<.35,duration=3+random(a)*2;
   setAction(a,prank?'prank':'greet',time,duration,friend.id);setAction(friend,prank?'surprise':'greet',time,duration,a.id);a.facing=friend.x>a.x?1:-1;friend.facing=-a.facing;
  }else{
   const kind=['rest','sit','wave','heart','surprise','photo','greet','admire'][Math.floor(random(a)*8)];setAction(a,kind,time,kind==='sit'?3.5+random(a)*2.5:2.1+random(a)*1.8);
  }
 }
 // These are decorative avatars, not physical players: intentional pass-through
 // avoids deadlocks when many guests meet on stairs or in narrow corridors.
 for(const a of agents){
  a.moving=false;
  if(a.action!=='walk')continue;
  const phase=(a.phase+dt/a.route.duration)%1;
  const target=sampleHouseRoute(a.route,phase);
  const dx=target.x-a.x,dy=target.y-a.y;
  // Smoothly catch up to the route without teleporting after a long idle pose.
  const distance=Math.hypot(dx,dy),step=Math.min(distance,(48+(a.seed%22))*dt);
  if(distance>.001){
   a.x+=dx/distance*step;a.y+=dy/distance*step;
   a.facing=dx>=0?1:-1;a.moving=true;
  }
  a.phase=phase;
  a.blocked=0;
 }

 return world;
}

export const ROOM_VISIBILITY_MS=2*60*60*1000;
export function roomEntryMillis(profile){const value=profile?.roomEnteredAt;return typeof value?.toMillis==='function'?value.toMillis():typeof value==='number'?value:0;}
export function isRoomVisible(profile,now=Date.now()){const entered=roomEntryMillis(profile);return entered>0&&now<entered+ROOM_VISIBILITY_MS;}
