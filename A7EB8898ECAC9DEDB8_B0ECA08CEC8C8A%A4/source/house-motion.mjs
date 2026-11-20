// Local decorative motion; visibility uses a fixed two-hour window after room entry.
export const CROWD_GAP={x:38,y:38};
export function getCrowdAppearance(count){
 if(count<=12)return {scale:2.15,gap:{x:60,y:60}};
 if(count<=30)return {scale:1.8,gap:{x:50,y:50}};
 if(count<=40)return {scale:1.55,gap:{x:44,y:44}};
 return {scale:1.4,gap:{...CROWD_GAP}};
}
export const ACTION_LABELS={walk:'걷는 중',sit:'앉아서 인사 중'};
export const WALK_CYCLE_SECONDS=.78;
export function poseFrame(action,elapsed,tempo=1){
 const time=Math.max(0,elapsed)/tempo;
 if(action==='sit'){
  if(time<1.25)return 0;
  if(time<1.95)return 1;
  if(time<2.40)return 0;
  if(time<3.45)return 2;
  if(time<4.35)return 3;
  return 0;
 }
 const phase=(time%WALK_CYCLE_SECONDS)/WALK_CYCLE_SECONDS;
 if(phase<.32)return 0;
 if(phase<.5)return 1;
 if(phase<.82)return 2;
 return 3;
}
export function roomSeed(id){return [...id].reduce((v,c)=>(v*31+c.charCodeAt(0))>>>0,7);}
export function makeHouseRoute(id,index,count){
 const value=roomSeed(id),lane=index%3-1;
 const upperY=180+lane*7,lowerY=526+lane*23;
 const stairs=[[258,185],[242,217],[218,258],[183,308],[148,358],[111,417],[91,480]];
 const stairLane=offset=>stairs.map(([x,y])=>[x+offset,y]);
 const descent=stairLane(-7+lane*3),ascent=stairLane(11+lane*3).reverse();
 const upper=[390+value%230,upperY];
 const points=[upper,[745-value%90,upperY],[350,upperY],...descent,
  [118,lowerY],[367,lowerY],[744+value%70,lowerY],[750,417+lane*6],
  [380,410+lane*6],[255,448+lane*8],[185,lowerY],[110,502],...ascent,[330,upperY],upper];
 const stairStart=3,stairEnd=stairStart+descent.length-1;
 const ascentStart=points.length-ascent.length-2,ascentEnd=ascentStart+ascent.length-1;
 const distances=[0];
 for(let i=1;i<points.length;i++){
  const [x,y]=points[i],[px,py]=points[i-1];
  distances.push(distances[i-1]+Math.hypot(x-px,y-py));
 }
 const length=distances.at(-1),times=distances.map(distance=>distance/length);
 return {points,times,stairs:[[times[stairStart-1],times[stairEnd+1]],[times[ascentStart-1],times[ascentEnd+1]]],
  duration:length/(17+value%9),phase:(index/Math.max(1,count)+.015*(value%5))%1};
}
export function sampleHouseRoute(route,phase){
 phase=((phase%1)+1)%1;let segment=1;while(segment<route.times.length-1&&phase>route.times[segment])segment++;
 const t=(phase-route.times[segment-1])/(route.times[segment]-route.times[segment-1]),a=route.points[segment-1],b=route.points[segment];
 return {x:a[0]+(b[0]-a[0])*t,y:a[1]+(b[1]-a[1])*t};
}
export const overlaps=(a,b,gap=CROWD_GAP)=>Math.abs(a.x-b.x)<gap.x&&Math.abs(a.y-b.y)<gap.y;
const onStairs=a=>a.route.stairs.some(([start,end])=>a.phase>=start&&a.phase<=end);
const random=a=>{a.seed=(Math.imul(a.seed,1664525)+1013904223)>>>0;return a.seed/4294967296;};
export function createCrowd(ids){
 const agents=[],appearance=getCrowdAppearance(ids.length),gap=appearance.gap;
 ids.forEach((id,index)=>{
  const route=makeHouseRoute(id,index,ids.length);
  const a={id,route,phase:route.phase,seed:roomSeed(id),action:'walk',actionStarted:0};
  a.tempo=.88+random(a)*.30;
  a.actionStarted=-random(a)*WALK_CYCLE_SECONDS;
  a.nextAction=5+random(a)*24;
  let bestGap=-Infinity;
  for(let attempt=0;attempt<240;attempt++){
   const phase=(route.phase+attempt*.61803398875)%1,p=sampleHouseRoute(route,phase);
   const spacing=agents.reduce((closest,other)=>Math.min(closest,Math.max(Math.abs(p.x-other.x)/gap.x,Math.abs(p.y-other.y)/gap.y)),Infinity);
   if(spacing>bestGap){Object.assign(a,p,{phase});bestGap=spacing;}
   if(spacing>=1)break;
  }
  if(!onStairs(a)&&random(a)<.18){
   a.action='sit';
   a.actionStarted=-random(a)*1.2;
   a.nextAction=5+random(a)*5;
  }
  agents.push(a);
 });
 return {agents,appearance,time:0,tick:0};
}
export function stepCrowd(world,dt){
 dt=Math.min(.1,Math.max(0,dt));world.time+=dt;world.tick++;
 const {agents,time}=world;
 for(const a of agents){
  if(time<a.nextAction)continue;
  if(a.action==='walk'&&onStairs(a))continue;
  a.action=a.action==='walk'?'sit':'walk';
  a.actionStarted=time;
  a.nextAction=time+(a.action==='sit'?8+random(a)*9:15+random(a)*23);
 }
 // These are decorative avatars, not physical players: intentional pass-through
 // avoids deadlocks when many guests meet on stairs or in narrow corridors.
 for(const a of agents){
  if(a.action!=='walk')continue;
  const phase=(a.phase+dt/a.route.duration)%1;
  const target=sampleHouseRoute(a.route,phase);
  const dx=target.x-a.x;
  if(Math.abs(dx)>.08)a.facing=dx>=0?1:-1;
  a.x=target.x;
  a.y=target.y;
  a.phase=phase;
 }

 return world;
}

export const ROOM_VISIBILITY_MS=2*60*60*1000;
export function roomEntryMillis(profile){const value=profile?.roomEnteredAt;return typeof value?.toMillis==='function'?value.toMillis():typeof value==='number'?value:0;}
export function isRoomVisible(profile,now=Date.now()){const entered=roomEntryMillis(profile);return entered>0&&now<entered+ROOM_VISIBILITY_MS;}
