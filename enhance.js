/* ===== extra magic: sound effects + living scenes ===== */
(function(){
"use strict";
const LITE=document.documentElement.classList.contains("lite");
const R=(a,b)=>a+Math.random()*(b-a),TAU=Math.PI*2,rp=a=>a[Math.random()*a.length|0];
const AC=()=>{try{return ensureAudio()}catch(e){return null}};

/* ---------- tiny synth ---------- */
function tone(f,d,o={}){const c=AC();if(!c)return;const t=c.currentTime+(o.at||0),os=c.createOscillator(),g=c.createGain();
 os.type=o.type||"sine";os.frequency.setValueAtTime(f,t);if(o.to)os.frequency.exponentialRampToValueAtTime(o.to,t+d);
 g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(o.v||.12,t+(o.a||.01));g.gain.exponentialRampToValueAtTime(.0001,t+d);
 os.connect(g);g.connect(c.destination);os.start(t);os.stop(t+d+.05)}
function noise(d,f0,f1,o={}){const c=AC();if(!c)return;const t=c.currentTime+(o.at||0),n=c.sampleRate*d|0,b=c.createBuffer(1,n,c.sampleRate),a=b.getChannelData(0);
 for(let i=0;i<n;i++)a[i]=Math.random()*2-1;const s=c.createBufferSource();s.buffer=b;
 const f=c.createBiquadFilter();f.type=o.type||"bandpass";f.Q.value=o.q||1;f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(f1,t+d);
 const g=c.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(o.v||.15,t+d*(o.a||.3));g.gain.exponentialRampToValueAtTime(.0001,t+d);
 s.connect(f);f.connect(g);g.connect(c.destination);s.start(t)}
const N=[523.25,659.25,783.99,1046.5,1318.5,1568];
const arp=(n,at=0,v=.07,st=.09)=>{for(let i=0;i<n;i++)tone(N[i%6]*(i>5?2:1),.9,{at:at+i*st,v})};
const pop=(at=0)=>{tone(220,.18,{to:50,v:.25,at});noise(.2,3000,500,{at,v:.2,a:.05})};
const boom=(at=0)=>{tone(110,.5,{to:35,v:.12,at});noise(.5,1200,120,{at,v:.1,type:"lowpass",a:.05})};
const crackle=(n,at=0)=>{for(let i=0;i<n;i++)noise(.04,4000+R(0,3000),2000,{at:at+R(0,.6),v:.05,type:"highpass",a:.2})};

/* ---------- sound effects on existing actions ---------- */
const wrap=(name,fn)=>{const o=window[name];if(typeof o!=="function")return;window[name]=function(){try{fn.apply(this,arguments)}catch(e){}return o.apply(this,arguments)}};

/* envelope: rustle, seal crack, flap swish, letter slide, sparkle, warm chord */
wrap("openEnvelope",()=>{
 noise(.35,1500,4000,{v:.1,type:"highpass"});tone(1400,.05,{type:"square",v:.05,at:.1});tone(700,.12,{to:300,v:.08,at:.12});
 noise(.5,800,3500,{at:.6,v:.1});noise(.7,1200,3000,{at:.95,v:.09,type:"highpass"});
 crackle(8,1.3);arp(6,1.25,.06,.1);[523.25,659.25,783.99].forEach(f=>tone(f,2.4,{at:1.9,v:.05}));
});
/* cake: match strike + flame whoosh, breath, snuff puffs, party pop */
wrap("ignite",i=>{noise(.14,2500,6000,{type:"highpass",v:.14,a:.2});noise(.5,300,120,{type:"lowpass",v:.12,at:.08});crackle(4,.1);tone(880+i*220,.5,{v:.04,at:.12})});
wrap("lightCandles",()=>noise(1.2,300,1800,{v:.06,a:.5}));
wrap("blowCandles",()=>{noise(.9,500,1400,{v:.22,q:.7,a:.45});[0,1,2].forEach(i=>noise(.35,2000,500,{at:.48+i*.1,v:.08,type:"highpass",a:.1}))});
wrap("celebrate",()=>{pop();pop(.15);pop(.3);arp(9,.1,.09,.07);crackle(14,.2)});

/* ---------- fireworks ---------- */
const PAL=["#ff5d91","#ffc044","#fff1e7","#b79cff","#7fd6ff","#ff9abb","#8be9a8"];
const FW={
 launch(st,W,H){st.r.push({x:R(W*.15,W*.85),y:H,vy:-R(9,12),ty:R(H*.12,H*.42),c:rp(st.pal)});noise(.5,400,1800,{v:.04})},
 step(x,st,W,H,dt){
  st.r=st.r.filter(k=>{k.y+=k.vy*dt;k.vy+=.1*dt;x.globalAlpha=.8;x.fillStyle=k.c;x.beginPath();x.arc(k.x,k.y,2,0,TAU);x.fill();
   if(k.y<=k.ty||k.vy>-1){const ring=Math.random()<.5,n=LITE?30:56;for(let i=0;i<n;i++){const a=i/n*TAU,s=ring?4:R(1,4.6);
    st.s.push({x:k.x,y:k.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,l:1,c:Math.random()<.25?st.pal[2]:k.c,z:R(1.6,3)})}
    if(st.snd-- >0){boom();crackle(5,.12)}return false}return true});
  st.s=st.s.filter(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=.06*dt;p.vx*=.985;p.l-=.014*dt;if(p.l<=0)return false;
   x.globalAlpha=p.l;x.strokeStyle=p.c;x.lineWidth=p.z;x.lineCap="round";x.beginPath();x.moveTo(p.x-p.vx*2,p.y-p.vy*2);x.lineTo(p.x,p.y);x.stroke();return true});
  x.globalAlpha=1}
};

/* ---------- scene engine ---------- */
const sc=[];
function fit(o){const d=Math.min(LITE?1.5:2,devicePixelRatio||1),w=o.s.clientWidth,h=o.s.clientHeight;o.c.width=w*d;o.c.height=h*d;o.x.setTransform(d,0,0,d,0,0);o.W=w;o.H=h}
function mk(sel,init,draw,enter){
 const s=document.querySelector(sel);if(!s)return;const c=document.createElement("canvas");c.className="fx-canvas";s.insertBefore(c,s.firstChild);
 const o={s,c,x:c.getContext("2d"),W:0,H:0,t:0,on:false,st:{},init,draw,at:(ms,fn)=>setTimeout(()=>o.on&&fn(),ms)};sc.push(o);
 new MutationObserver(()=>{const on=s.classList.contains("go");
  if(on&&!o.on){o.on=true;o.live=false;fit(o);o.t=0;o.st=init(o);enter&&enter(o)}
  if(!on){o.on=false;o.live=false;o.c.classList.remove("live");o.x.clearRect(0,0,o.W,o.H)}}).observe(s,{attributes:true,attributeFilter:["class"]});
 return o}
/* phones: canvases draw at ~30fps and wait until the page transition has finished,
   so the transition itself gets the whole GPU and stays smooth */
let last=performance.now(),acc=0;
(function loop(n){acc+=Math.min(3,(n-last)/16.7);last=n;
 if(LITE&&acc<1.6){requestAnimationFrame(loop);return}
 const dt=acc;acc=0;
 const busy=LITE&&typeof transitioning!=="undefined"&&transitioning;
 sc.forEach(o=>{if(!o.on||busy)return;
  if(!o.live){o.live=true;o.c.classList.add("live")}
  o.t+=dt/60;o.x.clearRect(0,0,o.W,o.H);o.draw(o,o.x,dt)});requestAnimationFrame(loop)})(last);
addEventListener("resize",()=>sc.forEach(fit));

/* ---------- pre-rendered sprites (drawn once, stamped every frame) ---------- */
const spr=(w,h,fn)=>{const c=document.createElement("canvas");c.width=w*2;c.height=h*2;c._w=w;c._h=h;const g=c.getContext("2d");g.scale(2,2);fn(g);return c};
let SP=null;
const sprites=()=>SP||(SP={
 ff:spr(28,28,g=>{g.globalAlpha=.16;g.fillStyle="#ffd98a";g.beginPath();g.arc(14,14,10,0,TAU);g.fill();g.globalAlpha=.95;g.fillStyle="#fff6cf";g.beginPath();g.arc(14,14,2.2,0,TAU);g.fill()}),
 heart:Object.fromEntries(["#ff9abb","#ffb4ca","#ff5d91","#ffc044"].map(c=>[c,spr(40,40,g=>{g.fillStyle=c;g.font="34px serif";g.fillText("\u2665",3,32)})])),
 moon:spr(140,140,g=>{const m=g.createRadialGradient(70,70,0,70,70,70);m.addColorStop(0,"rgba(255,235,200,.9)");m.addColorStop(.25,"rgba(255,220,170,.4)");m.addColorStop(1,"rgba(255,200,150,0)");g.fillStyle=m;g.fillRect(0,0,140,140)})
});

/* ===== 2nd page: birthday party sky ===== */
const mkB=(W,H,first)=>({x:R(.05,.95)*W,y:first?R(H*.3,H*1.1):H+90,r:R(16,30),v:R(.5,1.1),ph:R(0,6),c:rp(PAL.filter(c=>c!=="#fff1e7"))});
mk(".birthday",o=>{
  if(!o.s.querySelector(".bd-rays")){const r=document.createElement("div");r.className="bd-rays";o.s.insertBefore(r,o.c)}
  return{r:[],s:[],pal:PAL,snd:6,nx:.4,b:Array.from({length:LITE?6:11},()=>mkB(o.W,o.H,1))}},
 (o,x,dt)=>{const st=o.st,W=o.W,H=o.H;
  st.b.forEach((b,i)=>{b.y-=b.v*dt;if(b.y<-b.r*5)st.b[i]=mkB(W,H);
   x.save();x.translate(b.x+Math.sin(o.t*1.2+b.ph)*14,b.y);x.globalAlpha=.85;
   x.strokeStyle="rgba(255,255,255,.35)";x.beginPath();x.moveTo(0,b.r*1.25);x.bezierCurveTo(-8,b.r*2.2,8,b.r*3,0,b.r*3.8);x.stroke();
   if(!b.g){const g=x.createRadialGradient(-b.r*.3,-b.r*.35,2,0,0,b.r*1.2);g.addColorStop(0,"#fff");g.addColorStop(.25,b.c);g.addColorStop(1,b.c+"aa");b.g=g}
   x.fillStyle=b.g;x.beginPath();x.ellipse(0,0,b.r,b.r*1.2,0,0,TAU);x.fill();
   x.beginPath();x.moveTo(0,b.r*1.2);x.lineTo(-4,b.r*1.45);x.lineTo(4,b.r*1.45);x.fill();x.restore()});
  st.nx-=dt/60;if(st.nx<=0){FW.launch(st,W,H);st.nx=R(1,2)}
  FW.step(x,st,W,H,dt)},
 o=>{o.at(1750,()=>{pop();arp(8,0,.08,.07)});o.at(2250,()=>pop());o.at(300,()=>tone(392,1.2,{v:.04}))});

/* ===== tree page: fireflies, falling petals, stars, moon, shooting stars ===== */
const ptr={x:-9,y:-9,t:-9};
(()=>{const s=document.querySelector(".tree-screen");if(!s)return;
 s.addEventListener("pointermove",e=>{const r=s.getBoundingClientRect();ptr.x=e.clientX-r.left;ptr.y=e.clientY-r.top;ptr.t=performance.now()})})();
mk(".tree-screen",o=>{
  const t=o.s.querySelector(".tree");
  if(t&&!t.querySelector(".tree-aura")){const a=document.createElement("div");a.className="tree-aura";t.insertBefore(a,t.firstChild);const g=document.createElement("div");g.className="tree-ground";t.appendChild(g)}
  return{gc:0,stars:Array.from({length:LITE?40:90},()=>({x:R(0,1),y:R(0,.8),r:R(.4,1.5),ph:R(0,6)})),
   ff:Array.from({length:LITE?16:38},()=>({x:o.W/2,y:o.H/2,a:R(0,TAU),sp:R(.2,.7),rx:R(.2,1.1),ry:R(.2,1.1),ph:R(0,6)})),
   pt:Array.from({length:LITE?10:26},()=>({k:R(0,1),x:R(0,1),vy:R(.5,1.2),ph:R(0,6),s:R(9,17),c:rp(["#ff9abb","#ffb4ca","#ff5d91","#ffc044"])})),ss:null,nx:3}},
 (o,x,dt)=>{const st=o.st,W=o.W,H=o.H,SPR=sprites();
  /* measure the tree only now and then (reading layout every frame is costly) */
  if(!st.geo||(st.gc-=dt)<=0){st.gc=24;const sr=o.s.getBoundingClientRect(),tr=o.s.querySelector(".tree").getBoundingClientRect();
   st.geo={cx:tr.left-sr.left+tr.width/2,cy:tr.top-sr.top+tr.height*.38,cw:tr.width*.4,ch:tr.height*.34,by:tr.bottom-sr.top}}
  const {cx,cy,cw,ch,by}=st.geo;
  st.stars.forEach(s=>{x.globalAlpha=.25+.6*Math.abs(Math.sin(o.t*1.3+s.ph));x.fillStyle="#fff";x.beginPath();x.arc(s.x*W,s.y*H,s.r,0,TAU);x.fill()});
  x.globalAlpha=1;x.drawImage(SPR.moon,W*.85-70,H*.15-70,140,140);
  /* petals */
  st.pt.forEach(p=>{p.k+=p.vy*dt/400;if(p.k>1){p.k=0;p.x=R(0,1)}
   const px=cx+(p.x-.5)*cw*2+Math.sin(o.t*1.5+p.ph)*26,py=cy-ch*.4+p.k*(by-cy+ch*.4);
   const k=p.s/34;x.globalAlpha=Math.sin(p.k*Math.PI)*.85;x.drawImage(SPR.heart[p.c],px-3*k,py-32*k,40*k,40*k)});
  /* fireflies */
  x.globalCompositeOperation="lighter";const near=performance.now()-ptr.t<2500;
  st.ff.forEach((f,i)=>{const tx=near&&i%3==0?ptr.x+Math.cos(f.a+o.t)*40:cx+Math.cos(f.a+o.t*f.sp)*cw*f.rx*1.1;
   const ty=near&&i%3==0?ptr.y+Math.sin(f.a+o.t)*40:cy+Math.sin(f.a*1.7+o.t*f.sp)*ch*f.ry*1.1;
   f.x+=(tx-f.x)*.03*dt;f.y+=(ty-f.y)*.03*dt;const p=.4+.6*Math.abs(Math.sin(o.t*2+f.ph));
   x.globalAlpha=p;x.drawImage(SPR.ff,f.x-14,f.y-14,28,28)});
  x.globalCompositeOperation="source-over";
  /* shooting star */
  st.nx-=dt/60;if(st.nx<=0&&!st.ss){st.ss={x:W*R(.5,.95),y:H*R(0,.2),l:1};st.nx=R(4,7);tone(2400,.6,{to:900,v:.03});tone(3200,.3,{v:.02,at:.1})}
  if(st.ss){const s=st.ss;s.x-=9*dt;s.y+=4*dt;s.l-=.016*dt;if(s.l<=0)st.ss=null;else{const g=x.createLinearGradient(s.x,s.y,s.x+90,s.y-40);
   g.addColorStop(0,"rgba(255,255,255,"+s.l+")");g.addColorStop(1,"rgba(255,255,255,0)");x.globalAlpha=1;x.strokeStyle=g;x.lineWidth=2;x.beginPath();x.moveTo(s.x,s.y);x.lineTo(s.x+90,s.y-40);x.stroke()}}
  x.globalAlpha=1},
 o=>{arp(6,.7,.06,.2);for(let i=0;i<10;i++)o.at(1000+i*250,()=>tone(rp(N)*2,.6,{v:.03}))});

/* ===== last page: heart of stars + grand finale ===== */
const HP=["#ff5d91","#ec3270","#ff9abb","#f0a72c","#ffb4ca","#d4226a"];
mk(".final-screen",o=>({r:[],s:[],pal:["#ec3270","#f0a72c","#d4226a","#ff5d91","#b45cff","#2fb8d6"],snd:5,nx:2,
  hp:Array.from({length:LITE?150:300},()=>{const t=R(0,TAU),k=Math.sqrt(Math.random()),sc=Math.random()<.45?1:k;
   return{tx:16*Math.pow(Math.sin(t),3)*sc,ty:-(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))*sc,sx:R(0,o.W),sy:R(0,o.H),d:R(0,1.2),z:R(1.5,3.4),c:rp(HP),ph:R(0,6)}})}),
 (o,x,dt)=>{const st=o.st,W=o.W,H=o.H,u=Math.min(W,H)/36,pulse=1+.045*Math.sin(o.t*3.2);
  st.hp.forEach(p=>{const k=Math.min(1,Math.max(0,(o.t-.3-p.d)/2)),e=1-Math.pow(1-k,3);if(k<=0)return;
   const tx=W/2+p.tx*u*pulse+Math.sin(o.t*2+p.ph)*(k>=1?2:0),ty=H*.42+p.ty*u*pulse+Math.cos(o.t*2+p.ph)*(k>=1?2:0);
   x.globalAlpha=(.25+.45*Math.abs(Math.sin(o.t*1.5+p.ph)))*Math.min(1,k*2);x.fillStyle=p.c;x.beginPath();x.arc(p.sx+(tx-p.sx)*e,p.sy+(ty-p.sy)*e,p.z,0,TAU);x.fill()});
  x.globalAlpha=1;st.nx-=dt/60;if(st.nx<=0){FW.launch(st,W,H);st.nx=R(1.2,2.2)}
  FW.step(x,st,W,H,dt)},
 o=>{[.4,1.1,1.8].forEach(s=>o.at(s*1000,()=>{FW.launch(o.st,o.W,o.H)}));arp(9,.3,.08,.08);
  o.at(700,()=>[523.25,659.25,783.99,1046.5].forEach(f=>tone(f,2.6,{v:.05})));o.at(2200,()=>pop())});
})();
