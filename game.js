const canvas=document.getElementById('c'),ctx=canvas.getContext('2d');
const hpbar=document.getElementById('hpbar'),shbar=document.getElementById('shbar'),hptext=document.getElementById('hptext'),shtext=document.getElementById('shtext'),ammotext=document.getElementById('ammotext'),elimstext=document.getElementById('elimstext'),zonetext=document.getElementById('zonetext'),msg=document.getElementById('msg');
let W=0,H=0;function resize(){W=canvas.width=innerWidth*devicePixelRatio;H=canvas.height=innerHeight*devicePixelRatio}addEventListener('resize',resize);resize();
const keys={},mouse={down:false};let locked=false;
addEventListener('keydown',e=>keys[e.key.toLowerCase()]=true);addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
canvas.addEventListener('click',()=>{if(!locked)canvas.requestPointerLock();else shoot();});
document.addEventListener('pointerlockchange',()=>locked=document.pointerLockElement===canvas);
document.addEventListener('mousemove',e=>{if(locked){player.yaw-=e.movementX*0.0025;player.pitch=Math.max(-1.1,Math.min(0.9,player.pitch-e.movementY*0.0025));}});
document.addEventListener('mousedown',()=>mouse.down=true);document.addEventListener('mouseup',()=>mouse.down=false);
const rand=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const player={x:0,y:0,z:-6,vx:0,vz:0,yaw:0,pitch:0,hp:100,sh:0,ammo:30,elims:0,build:0,reload:0,invul:0};
const bots=[],bullets=[],drops=[];for(let i=0;i<12;i++)bots.push(spawnBot());for(let i=0;i<16;i++)drops.push(spawnDrop());
let zone={x:0,z:0,r:120,t:0,shrinking:true};
function spawnBot(){return {x:rand(-70,70),z:rand(-70,70),hp:100,cd:rand(0,1),dir:rand(0,Math.PI*2)}}
function spawnDrop(){return {x:rand(-90,90),z:rand(-90,90),type:['ammo','sh','wall'][Math.floor(Math.random()*3)],up:true}}
function shoot(){if(player.reload>0||player.ammo<=0)return;player.ammo--;player.reload=.13;const sp=camPos();bullets.push({x:sp.x,y:sp.y,z:sp.z,vx:Math.sin(player.yaw)*1.5,vy:Math.sin(player.pitch)*1.5,vz:Math.cos(player.yaw)*1.5,life:1.5,src:'p'});msg.textContent='Bang';}
function camPos(){return {x:player.x-Math.sin(player.yaw)*10,y:10+player.y,z:player.z-Math.cos(player.yaw)*10}}
function worldToCam(p){const dx=p.x-player.x,dy=p.y-(player.y+5),dz=p.z-player.z;const sy=Math.sin(-player.yaw),cy=Math.cos(-player.yaw),sp=Math.sin(-player.pitch),cp=Math.cos(-player.pitch);let x=dx*cy-dz*sy,z=dx*sy+dz*cy,y=dy;let y2=y*cp-z*sp,z2=y*sp+z*cp;return {x,y:y2,z:z2}}
function project(p){if(p.z<=0.2)return null;const f=620*devicePixelRatio/p.z;return {x:W/2+p.x*f,y:H/2-p.y*f,s:f}}
let last=performance.now();requestAnimationFrame(loop);
function loop(now){const dt=Math.min(.033,(now-last)/1000);last=now;update(dt);render();requestAnimationFrame(loop)}
function update(dt){
const sp=keys['shift']?18:10,fw=(keys['w']?1:0)-(keys['s']?1:0),rt=(keys['d']?1:0)-(keys['a']?1:0),sy=Math.sin(player.yaw),cy=Math.cos(player.yaw);
player.vx+=(rt*cy+fw*sy)*sp*dt*12;player.vz+=(fw*cy-rt*sy)*sp*dt*12;player.vx*=Math.pow(.001,dt);player.vz*=Math.pow(.001,dt);player.x+=player.vx*dt;player.z+=player.vz*dt;
if(keys[' '])player.y=Math.min(.35,(player.y||0)+dt*7);else player.y*=Math.pow(.001,dt);
if(player.reload>0)player.reload-=dt;if(player.invul>0)player.invul-=dt;
if(keys['e']){keys['e']=false;if(player.build>0){player.build--;drops.push({x:player.x+Math.sin(player.yaw)*8,z:player.z+Math.cos(player.yaw)*8,type:'wall',up:true})}else player.build=3;}
if(mouse.down)shoot();
if(zone.r>18){zone.r-=dt*2.1;zone.t+=dt}else zone.shrinking=false;
const dz=Math.hypot(player.x-zone.x,player.z-zone.z);if(dz>zone.r){hurt((dz-zone.r)*dt*3.2);zonetext.textContent='Storm'}else zonetext.textContent='Safe';
for(const b of bots){const toP=Math.hypot(player.x-b.x,player.z-b.z);b.cd-=dt;if(b.cd<=0){b.cd=rand(.4,1.1);b.dir=rand(0,Math.PI*2)}if(toP<60)b.dir=Math.atan2(player.x-b.x,player.z-b.z);b.x+=Math.sin(b.dir)*dt*4.4;b.z+=Math.cos(b.dir)*dt*4.4;b.x=clamp(b.x,-120,120);b.z=clamp(b.z,-120,120);if(toP<26&&b.cd<.1){b.cd=.8;bullets.push({x:b.x,y:2.2,z:b.z,vx:(player.x-b.x)*.08,vy:.04,vz:(player.z-b.z)*.08,life:1.6,src:'b'})}}
for(const bull of bullets){bull.x+=bull.vx*dt*40;bull.y=(bull.y||2)+bull.vy*dt*40;bull.z+=bull.vz*dt*40;bull.life-=dt}
for(const d of drops){if(!d.up)continue; if(Math.hypot(player.x-d.x,player.z-d.z)<4){if(d.type==='ammo')player.ammo=Math.min(99,player.ammo+18);else if(d.type==='sh')player.sh=Math.min(100,player.sh+25);else if(d.type==='wall')player.build+=1;d.up=false;msg.textContent='Loot';}}
for(let i=bullets.length-1;i>=0;i--){const b=bullets[i];if(b.life<=0){bullets.splice(i,1);continue}if(b.src==='p'){for(const bot of bots){if(Math.hypot(bot.x-b.x,bot.z-b.z)<3){bot.hp-=34;b.life=0;if(bot.hp<=0){player.elims++;bot.x=rand(-90,90);bot.z=rand(-90,90);bot.hp=100;}}}}else if(Math.hypot(player.x-b.x,player.z-b.z)<3.3)hurt(12)}
for(let i=0;i<drops.length;i++)if(!drops[i].up&&Math.random()<.004)drops[i]=spawnDrop();
hpbar.style.width=player.hp+'%';shbar.style.width=player.sh+'%';hptext.textContent=player.hp|0;shtext.textContent=player.sh|0;ammotext.textContent=player.ammo;elimstext.textContent=player.elims;if(player.reload>0)msg.textContent='Reloading';if(player.hp<=0){player.hp=100;player.sh=0;player.ammo=30;player.elims=0;player.x=0;player.z=-6;msg.textContent='Respawned';}}
function hurt(v){if(player.invul>0)return;player.invul=.12;if(player.sh>0){const s=Math.min(player.sh,v*1.2);player.sh-=s;v-=s*.8}player.hp=Math.max(0,player.hp-v)}
function render(){
ctx.clearRect(0,0,W,H);const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#08111f');sky.addColorStop(1,'#1d3557');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
drawGround();drawZone();
const ents=[];for(const d of drops)if(d.up)ents.push({p:worldToCam(d),t:d.type,o:d});for(const b of bots)ents.push({p:worldToCam(b),t:'bot',o:b});for(const bull of bullets)ents.push({p:worldToCam(bull),t:'bullet',o:bull});ents.sort((a,b)=>(b.p?.z||-1e9)-(a.p?.z||-1e9));
for(const e of ents){if(!e.p||e.p.z<=0.2)continue;const q=project(e.p);if(!q)continue;if(e.t==='bot')drawBot(q);else if(e.t==='bullet')ctx.fillRect(q.x-2,q.y-2,4,4);else drawDrop(q,e.o)}
drawReticle();
}
function drawGround(){ctx.save();ctx.translate(W/2,H/2+120*devicePixelRatio);ctx.rotate(-player.yaw);for(let i=-18;i<18;i++)for(let j=-18;j<18;j++){const x=i*70,z=j*70,dx=x-player.x,dz=z-player.z,r=Math.hypot(dx,dz);if(r>1200)continue;const a=(1-r/1200)*.8;ctx.fillStyle=`rgba(${40+((i+j)&1)*16},${80+((i*j)&1)*8},${48+((i-j)&1)*10},${a})`;ctx.fillRect(x*2,z*2,140,140)}ctx.restore()}
function drawZone(){const q=worldToCam({x:zone.x,y:0,z:zone.z});const p=project(q);if(!p)return;ctx.strokeStyle='rgba(120,200,255,.4)';ctx.lineWidth=4*devicePixelRatio;ctx.beginPath();ctx.arc(p.x,p.y,zone.r*6,0,Math.PI*2);ctx.stroke()}
function drawBot(p){const s=p.s/60;ctx.fillStyle='#4de';ctx.fillRect(p.x-18*s,p.y-36*s,36*s,36*s);ctx.fillStyle='#222';ctx.fillRect(p.x-8*s,p.y-18*s,16*s,10*s)}
function drawDrop(p,d){ctx.fillStyle=d.type==='ammo'?'#f93':d.type==='sh'?'#6cf':'#aaa';ctx.beginPath();ctx.arc(p.x,p.y,8*p.s/80,0,Math.PI*2);ctx.fill()}
function drawReticle(){ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(W/2-16,H/2);ctx.lineTo(W/2-4,H/2);ctx.moveTo(W/2+4,H/2);ctx.lineTo(W/2+16,H/2);ctx.moveTo(W/2,H/2-16);ctx.lineTo(W/2,H/2-4);ctx.moveTo(W/2,H/2+4);ctx.lineTo(W/2,H/2+16);ctx.stroke()}
