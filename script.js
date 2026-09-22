const q=s=>document.querySelector(s);
const audio=q('#audio'),play=q('#play'),seek=q('#seek'),time=q('#time'),viz=q('#viz'),ctx=viz.getContext('2d');
const fmt=s=>Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');

audio.volume=1;
audio.muted=false;
play.addEventListener('click',async()=>{
  try{
    if(audio.paused){
      audio.muted=false; audio.volume=1;
      await audio.play();
      play.textContent='Ⅱ';
    }else{
      audio.pause(); play.textContent='▶';
    }
  }catch(e){
    play.textContent='!';
    play.title='Playback was blocked. Try clicking again or use the WAV download.';
  }
});
audio.addEventListener('timeupdate',()=>{
  seek.value=audio.duration?audio.currentTime/audio.duration*1000:0;
  time.textContent=fmt(audio.currentTime)+' / '+fmt(audio.duration||281);
});
audio.addEventListener('ended',()=>play.textContent='▶');
audio.addEventListener('error',()=>{play.textContent='!';play.title='Audio could not load.'});
seek.addEventListener('input',()=>{if(audio.duration)audio.currentTime=seek.value/1000*audio.duration});

// Animated piano visualizer that does not intercept or reroute audio.
let phase=0;
function drawViz(){
  requestAnimationFrame(drawViz);
  const w=viz.width,h=viz.height;
  ctx.clearRect(0,0,w,h);
  phase += audio.paused ? .002 : .025;
  const bars=96,bw=w/bars;
  for(let i=0;i<bars;i++){
    const envelope=Math.sin(Math.PI*i/(bars-1));
    const motion=(Math.sin(i*.47+phase*2)+Math.sin(i*.13-phase)+2)/4;
    const level=audio.paused?.05:(.12+.48*motion)*envelope;
    const bh=h*level;
    ctx.fillStyle='rgba(199,168,108,'+(audio.paused?.13:.38)+')';
    ctx.fillRect(i*bw,h-bh,bw*.48,bh);
  }
}
drawViz();

const lyricBtn=q('#more');
lyricBtn.addEventListener('click',()=>{
  const b=q('#lyricbox');b.classList.toggle('open');
  lyricBtn.textContent=b.classList.contains('open')?'COLLAPSE LYRICS':'READ FULL LYRICS';
});

// Falling stars intensify during descent. They only impact once the visitor reaches the true page bottom.
const c=q('#stars'),x=c.getContext('2d');let pts=[],bursts=[],scrollRatio=0,atAbyss=false;
function makeStar(){return{x:Math.random()*c.width,y:Math.random()*c.height,r:Math.random()*1.45+.22,base:Math.random()*.55+.10,trail:Math.random()*44+10}}
function size(){c.width=innerWidth;c.height=innerHeight;pts=Array.from({length:760},makeStar)}
function updateScroll(){
 const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
 scrollRatio=Math.min(1,Math.max(0,scrollY/max));
 atAbyss=(max-scrollY)<18;
}
function explode(px,py,power){
 if(!atAbyss)return;
 bursts.push({x:px,y:py,life:1,power,parts:Array.from({length:Math.floor(9+power*14)},()=>({a:Math.random()*Math.PI*2,s:Math.random()*3.5+1}))});
 if(bursts.length>75)bursts.shift();
}
function stars(){
 x.clearRect(0,0,c.width,c.height);
 const visible=Math.floor(34+scrollRatio*690),speed=.18+scrollRatio*7.2;
 for(let i=0;i<visible;i++){
  const p=pts[i];p.y+=p.base+speed;
  if(p.y>=c.height-2){
    if(atAbyss)explode(p.x,c.height-3,.45+scrollRatio*.9);
    p.y=-Math.random()*220-8;p.x=Math.random()*c.width;p.r=Math.random()*1.45+.22;
  }
  const a=.13+scrollRatio*.58+p.r*.07,rr=Math.floor(220-scrollRatio*45),gg=Math.floor(155+scrollRatio*65),bb=Math.floor(105+scrollRatio*145);
  x.strokeStyle=`rgba(${rr},${gg},${bb},${a})`;x.fillStyle=x.strokeStyle;
  if(scrollRatio>.14){x.lineWidth=Math.max(.55,p.r*.5);x.beginPath();x.moveTo(p.x,p.y);x.lineTo(p.x,p.y-p.trail*(.3+scrollRatio*1.7));x.stroke()}
  x.beginPath();x.arc(p.x,p.y,p.r,0,7);x.fill();
 }
 if(atAbyss){
  for(let b=bursts.length-1;b>=0;b--){
   const e=bursts[b];e.life-=.034;if(e.life<=0){bursts.splice(b,1);continue}
   const radius=(1-e.life)*46*e.power;
   const glow=x.createRadialGradient(e.x,e.y,0,e.x,e.y,22*e.power);
   glow.addColorStop(0,`rgba(240,252,255,${e.life})`);glow.addColorStop(.28,`rgba(135,215,255,${e.life*.7})`);glow.addColorStop(1,'rgba(55,155,230,0)');
   x.fillStyle=glow;x.beginPath();x.arc(e.x,e.y,27*e.power,0,7);x.fill();
   x.strokeStyle=`rgba(205,238,255,${e.life*.85})`;x.lineWidth=1;
   for(const p of e.parts){x.beginPath();x.moveTo(e.x,e.y);x.lineTo(e.x+Math.cos(p.a)*radius*p.s,e.y-Math.abs(Math.sin(p.a))*radius*p.s*.62);x.stroke()}
  }
 }
 requestAnimationFrame(stars)
}
addEventListener('resize',size);addEventListener('scroll',updateScroll,{passive:true});size();updateScroll();stars();

// Cosmology interaction
const meanings={
HEAVEN:'The ordered realm above — protection, beauty, law, and the beginning of Michael’s question.',
MICHAEL:'The protector moves clockwise toward what he believes he must confront.',
HELL:'The descent below — suffering, isolation, and the mirror in which Michael becomes Lucifer.',
LUCIFER:'The fallen self rises again toward Heaven, carrying the memory Michael has not yet lived.'
};
document.querySelectorAll('.realm').forEach(btn=>{
  const show=()=>{document.querySelectorAll('.realm').forEach(b=>b.classList.remove('active'));btn.classList.add('active');q('#soultext').textContent=meanings[btn.dataset.soul]};
  btn.addEventListener('mouseenter',show);btn.addEventListener('focus',show);btn.addEventListener('click',show);
});
q('#one').addEventListener('click',()=>{
  q('#orb').classList.toggle('collapsed');
  q('#soultext').textContent=q('#orb').classList.contains('collapsed')?'No Heaven. No Hell. No Michael. No Lucifer. Only ONE.':'The cycle turns: Heaven → Michael → Hell → Lucifer → Heaven.';
});

// HELL -> EL: fire sound and visual burn end together.
const hellWord=q('#hellTransform'),fire=q('#fireSound');
let burnTimer=null,fadeTimer=null;
function stopFire(){
 if(fadeTimer)clearInterval(fadeTimer);
 fadeTimer=setInterval(()=>{
   fire.volume=Math.max(0,fire.volume-.08);
   if(fire.volume<=.01){clearInterval(fadeTimer);fadeTimer=null;fire.pause();fire.currentTime=0;fire.volume=.58}
 },60);
}
hellWord.addEventListener('click',async()=>{
 if(hellWord.classList.contains('burned')){
   if(burnTimer)clearTimeout(burnTimer);stopFire();
   hellWord.classList.remove('burned','burning');return;
 }
 hellWord.classList.add('burning','burned');
 try{fire.currentTime=0;fire.volume=.58;await fire.play()}catch(e){}
 burnTimer=setTimeout(()=>{hellWord.classList.remove('burning');stopFire()},5250);
});