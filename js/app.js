/* Скрипты страницы. Собраны из index.html; подключаются с defer.
   После правок обнови хэш в ссылке: node scripts/update-assets.mjs */

/* ── Частицы на первом экране ─────────────────────────────── */
(function(){
  var cv=document.getElementById('pcv');
  if(!cv)return;
  var ctx=cv.getContext('2d');
  var dpr=Math.min(window.devicePixelRatio||1,2), W=0,H=0, cx0=0,cy0=0,box=0;
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var S=320, off=document.createElement('canvas'); off.width=S; off.height=S; var octx=off.getContext('2d');
  var PTS=window.__NPTS||{};
  var order=["AI Native","logo1","logo2","OpenAI","Claude","Cursor","Grok","Алиса","GigaChat"];
  var targets={};
  function drawAI(){ octx.setTransform(1,0,0,1,0,0); octx.clearRect(0,0,S,S);
    octx.fillStyle='#fff'; octx.font='700 172px system-ui,-apple-system,sans-serif';
    octx.textAlign='center'; octx.textBaseline='middle'; octx.fillText('AI',S/2,S/2+4); }
  function sampleCanvas(){ var d=octx.getImageData(0,0,S,S).data,p=[],st=3;
    for(var y=0;y<S;y+=st)for(var x=0;x<S;x+=st){var i=(y*S+x)*4;if(d[i+3]>130)p.push([x/S,y/S,255,255,255]);}return p; }
  function themed(r,g,b){ var mx=Math.max(r,g,b),mn=Math.min(r,g,b),sat=mx-mn;
    if(mx<85||sat<28) return [234,241,252];
    var f=Math.min(2.15,238/(mx||1)); return [Math.min(255,r*f)|0,Math.min(255,g*f)|0,Math.min(255,b*f)|0]; }
  function norm(pts){ if(!pts.length) return pts; var mnx=1,mxx=0,mny=1,mxy=0,i,p; for(i=0;i<pts.length;i++){p=pts[i]; if(p[0]<mnx)mnx=p[0]; if(p[0]>mxx)mxx=p[0]; if(p[1]<mny)mny=p[1]; if(p[1]>mxy)mxy=p[1];} var w=mxx-mnx,h=mxy-mny,cx=(mnx+mxx)/2,cy=(mny+mxy)/2,sc=0.9/Math.max(w,h,1e-4),o=[]; for(i=0;i<pts.length;i++){p=pts[i]; o.push([0.5+(p[0]-cx)*sc,0.5+(p[1]-cy)*sc,p[2],p[3],p[4]]);} return o; }
  function buildTargets(){ drawAI(); targets["AI Native"]=norm(sampleCanvas()); for(var n in PTS) targets[n]=norm(PTS[n]); }

  var N=(window.matchMedia&&matchMedia("(max-width:680px)").matches)?1100:2400,P=[];
  function initP(){ for(var i=0;i<N;i++)P.push({x:cx0,y:cy0,tx:cx0,ty:cy0,cr:234,cg:241,cb:252,tr:234,tg:241,tb:252,z:(Math.random()-.5)*94,seed:Math.random()}); }
  function toStage(p){ return [cx0-box/2+p[0]*box, cy0-box/2+p[1]*box]; }
  function assign(name){ var pts=targets[name]; if(!pts||!pts.length)return;
    for(var i=0;i<N;i++){ var p=pts[(i+((P[i].seed*pts.length)|0))%pts.length], t=toStage(p), c=themed(p[2],p[3],p[4]);
      P[i].tx=t[0];P[i].ty=t[1];P[i].tr=c[0];P[i].tg=c[1];P[i].tb=c[2]; } }
  function layout(){ var r=cv.getBoundingClientRect(); W=r.width;H=r.height; cv.width=W*dpr;cv.height=H*dpr; ctx.setTransform(dpr,0,0,dpr,0,0);
    var wide=W>1300; cx0=wide?W*0.745:W*0.5; cy0=H*0.5; box=Math.min(wide?W*0.54:W*0.9, H*0.88); }

  var angX=0,angY=0,tAngX=0,tAngY=0,hasP=false,idleT=999;
  function onMove(e){ var nx=(e.clientX-cx0)/(box/2), ny=(e.clientY-cy0)/(box/2);
    nx=Math.max(-1.8,Math.min(1.8,nx)); ny=Math.max(-1.8,Math.min(1.8,ny));
    tAngY=nx*0.5; tAngX=-ny*0.34; hasP=true; idleT=0; }
  if(!(window.matchMedia&&matchMedia('(max-width:680px)').matches))window.addEventListener('pointermove',onMove,{passive:true});
  cv.addEventListener('click',function(){ hold=0; idx=(idx+1)%order.length; assign(order[idx]); if(window.__onLogoChange) window.__onLogoChange(order[idx]); });
  window.addEventListener('switchLogo',function(e){ var i=order.indexOf(e.detail); if(i!==-1){ idx=i; hold=0; assign(order[idx]); if(window.__onLogoChange) window.__onLogoChange(order[idx]); } });

  var idx=0,hold=0,HOLD=215;
  function frame(){ ctx.clearRect(0,0,W,H); idleT++;
    if(!hasP||idleT>260){ tAngY=Math.sin(Date.now()*0.00035)*0.3; tAngX=Math.sin(Date.now()*0.00024)*0.1; }
    angY+=(tAngY-angY)*0.05; angX+=(tAngX-angX)*0.05;
    var cY=Math.cos(angY),sY=Math.sin(angY),cX=Math.cos(angX),sX=Math.sin(angX),foc=680;
    ctx.globalCompositeOperation='lighter';
    for(var i=0;i<N;i++){ var p=P[i];
      p.x+=(p.tx-p.x)*0.072; p.y+=(p.ty-p.y)*0.072;
      p.cr+=(p.tr-p.cr)*0.1; p.cg+=(p.tg-p.cg)*0.1; p.cb+=(p.tb-p.cb)*0.1;
      var dx=p.x-cx0,dy=p.y-cy0,dz=p.z;
      var x1=dx*cY+dz*sY, z1=-dx*sY+dz*cY, y1=dy, y2=y1*cX-z1*sX, z2=y1*sX+z1*cX, x2=x1;
      var sc=foc/(foc-z2), px=cx0+x2*sc, py=cy0+y2*sc;
      ctx.globalAlpha=Math.min(0.96,0.5*sc+0.34);
      ctx.fillStyle='rgb('+(p.cr|0)+','+(p.cg|0)+','+(p.cb|0)+')';
      ctx.beginPath(); ctx.arc(px,py,1.32*sc,0,6.283); ctx.fill(); }
    ctx.globalCompositeOperation='source-over'; ctx.globalAlpha=1;
    if(!reduce){ requestAnimationFrame(frame); } }

  layout(); initP(); buildTargets(); assign(order[idx]); frame();
  window.addEventListener('npts',function(){ PTS=window.__NPTS||{}; buildTargets(); assign(order[idx]); });
  window.addEventListener('resize',function(){ layout(); assign(order[idx]); if(reduce)frame(); });
})();

/* ── Свечение под курсором и переключатель акцента ─────────────────────────────── */
(function(){
  var g=document.getElementById('cglow');
  var tx=window.innerWidth*0.7, ty=window.innerHeight*0.42, x=tx, y=ty, shown=false;
  window.addEventListener('pointermove',function(e){ tx=e.clientX; ty=e.clientY; if(!shown&&g){shown=true;g.style.opacity='1';} },{passive:true});
  (function loop(){ x+=(tx-x)*0.11; y+=(ty-y)*0.11; if(g) g.style.transform='translate('+x+'px,'+y+'px)'; requestAnimationFrame(loop); })();
  var sw=document.getElementById('sw');
  if(sw){ Array.prototype.forEach.call(sw.querySelectorAll('.sw'),function(b){ b.addEventListener('click',function(){
    var r=document.documentElement.style; r.setProperty('--accent-rgb', b.getAttribute('data-a')); r.setProperty('--accent', b.getAttribute('data-hex'));
    Array.prototype.forEach.call(sw.querySelectorAll('.sw'),function(x){ x.setAttribute('aria-pressed', x===b?'true':'false'); });
  }); }); }
})();

/* ── Эффект частиц на кнопках ─────────────────────────────── */
(function(){
  var accent=(getComputedStyle(document.documentElement).getPropertyValue('--accent-rgb').trim())||'255,107,69';
  function build(el){
    var cv=el.querySelector('.pcv'); if(!cv) return; var ctx=cv.getContext('2d');
    var dpr=Math.min(window.devicePixelRatio||1,2), PAD=22, W=0,H=0, pts=[], hv=0, tv=0;
    function layout(){ var r=el.getBoundingClientRect(); var bw=r.width,bh=r.height; if(!bw) return;
      W=bw+PAD*2; H=bh+PAD*2; cv.style.width=W+'px'; cv.style.height=H+'px'; cv.width=W*dpr; cv.height=H*dpr; ctx.setTransform(dpr,0,0,dpr,0,0);
      pts=[]; var gx=4, cols=Math.max(12,Math.round(bw/gx)), rows=Math.max(5,Math.round(bh/gx));
      for(var j=0;j<rows;j++)for(var i=0;i<cols;i++){ var hx=PAD+(i+0.5)/cols*bw, hy=PAD+(j+0.5)/rows*bh;
        var ang=Math.random()*6.283, dist=0.5+Math.random()*5;
        pts.push({hx:hx,hy:hy,dx:Math.cos(ang)*dist,dy:Math.sin(ang)*dist-2,x:hx,y:hy}); } }
    var bg=el.querySelector('.pbg');
    el.addEventListener('pointerenter',function(){tv=1;if(bg)bg.style.opacity='0.12';});
    el.addEventListener('pointerleave',function(){tv=0;if(bg)bg.style.opacity='1';});
    function frame(){ hv+=(tv-hv)*0.10; ctx.clearRect(0,0,W,H);
      if(hv>0.008){ var i,j;
        for(i=0;i<pts.length;i++){ var p=pts[i]; p.x=p.hx+p.dx*hv; p.y=p.hy+p.dy*hv; }
        ctx.lineWidth=1;
        for(i=0;i<pts.length;i++)for(j=i+1;j<pts.length;j++){ var a=pts[i],b=pts[j],ddx=a.x-b.x,ddy=a.y-b.y,dd=ddx*ddx+ddy*ddy;
          if(dd<225){ ctx.strokeStyle='rgba('+accent+','+(hv*0.4*(1-Math.sqrt(dd)/15)).toFixed(3)+')';
            ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke(); } }
        ctx.fillStyle='rgba('+accent+','+Math.min(1,hv*1.25).toFixed(3)+')';
        for(i=0;i<pts.length;i++){ ctx.beginPath(); ctx.arc(pts[i].x,pts[i].y,1.5,0,6.283); ctx.fill(); } }
      requestAnimationFrame(frame); }
    layout(); frame(); window.addEventListener('resize',layout);
  }
  Array.prototype.forEach.call(document.querySelectorAll('.pbtn'), build);
})();

/* ── Секция «Программа»: треки, скролл-навигация, фоновые фигуры ─────────────────────────────── */
(function(){

var T=[["Агентный инжиниринг", "Инжиниринг", "#ff6b45", "Внедрение агентной разработки приводит к напряжению всех узлов производственной цепочки. Как расшивать узкие места на пути фичи — от постановки задачи до выкатки в продакшен и анализа работы системы.", [["Обвязка и практики", "Тулы, инструкции и практики. Harness, SDD и повышение автономности агента."], ["Контекст-инжиниринг", "Качественный поиск и быстрая, компактная поставка контекста в модель."], ["Контроль качества", "Уверенность в качестве продукта, кода и архитектурных решений."], ["CI/CD для автономной разработки", "Как меняется выкатка релизов, когда фичи катятся десятками в день."], ["Разбор логов и авторекавери", "Анализ проблем в коде, продукте и инфраструктуре на потоке."], ["Платформы и инфраструктура", "Среда работы агентов в инфраструктуре: что разработать, чтобы усилить агентов."]], "net"], ["Агенты в продуктовой работе", "Продукт", "#4bd6c2", "После ускорения деливери узким местом становится продуктовая работа. Возможны агентизированные исследования, проработка идей, требований и гипотез, ускорение анализа обратной связи.", [["Практики продуктового ресёрча", "Ресёрч агентами: анализ рынка, обратной связи и клиентских воронок."], ["Проверка гипотез", "Как продакту вайбкодингом ускорить проверку гипотез, ничего не сломав."], ["Продуктовые требования", "PRD, читаемые и исполняемые агентами; больше объём, меньше время."], ["Управление ожиданиями", "Как говорить о стратегии, когда роадмап меняется каждую неделю."]], "target"], ["Бизнес и управление", "Бизнес", "#f2b23c", "Если весь цикл ускоряется, узким местом становится бизнес. Управленческой команде нужно быстро принимать решения — перестроить процессы, управление, стратегирование и целеполагание.", [["Стратегия и целеполагание", "Стратегия в мире, где стоимость софта не защищает инвестиции. Service as a Software."], ["Организационные модели", "Tiny teams и изменение существующих структур: управление, найм, ответственность."], ["Культурные изменения", "Новые качества в людях и процессах. Кто эти «новые люди»."], ["Бизнес — это деньги", "Бюджетирование, метрики и умная стратегия инвестирования в неопределённости."], ["Безопасность и комплаенс", "Как обеспечивать безопасность и юридически обвязать агентские системы."]], "bars"], ["Воркшопы и C-level Клуб", "Воркшопы и C-level Клуб", "#a98cff", "Практическая работа на воркшопах и обсуждение внедрения AI в C-level Клубе.", [], "spark"]];
function pad(i){return (i+1)<10?'0'+(i+1):''+(i+1);}
var colr=document.getElementById('colr'), rail=document.getElementById('rail');
if(!colr || !rail)return;
T.forEach(function(t,i){
  var sec=document.createElement('section'); sec.className='trk'; sec.style.setProperty('--tc',t[2]); sec.dataset.i=i;
  var cards;
  if(t[4].length){
    cards=t[4].map(function(x){return '<div class="c"><div class="t">'+x[0]+'</div><div class="x">'+x[1]+'</div></div>';}).join('');
  } else {
    cards='<div class="cta"><div class="t">Приём докладов закрыт 31 августа 2026 года. Программа формируется из принятых докладов.</div><a class="b" href="/talks/">Смотреть доклады</a></div>';
  }
  sec.innerHTML='<div class="tk mono">Трек '+pad(i)+' · '+t[1]+'</div>'
    +'<div class="trk-h"><div class="trk-n">'+pad(i)+'</div><h3 class="trk-t">'+t[0]+'</h3><p class="trk-d">'+t[3]+'</p></div>'
    +'<div class="rcards">'+cards+'</div>';
  colr.appendChild(sec);
  var d=document.createElement('div'); d.className='dot'; rail.appendChild(d);
});
var dots=rail.querySelectorAll('.dot');
var idx=document.getElementById('idx'), nn=document.getElementById('nn'), cn=document.getElementById('cn'), hh=document.getElementById('hh'), dd=document.getElementById('dd'), bgtint=document.getElementById('bgtint');
var cur=-1;
function setActive(i){ if(i===cur)return; cur=i; var t=T[i];
  idx.classList.add('fade');
  bgtint.style.setProperty('--bgc',t[2]);document.documentElement.style.setProperty('--glow',t[2]);
  if(window.__pf)window.__pf(i);
  setTimeout(function(){
    idx.style.setProperty('--tc',t[2]); nn.textContent=pad(i); cn.textContent=pad(i);
    hh.textContent=t[0]; dd.textContent=t[3];
    dots.forEach(function(d,k){d.classList.toggle('act',k===i);});
    idx.classList.remove('fade');
  },160);
}
setActive(0); dots[0].classList.add('act');
var secs=colr.querySelectorAll('.trk');
var io=new IntersectionObserver(function(es){
  es.forEach(function(e){ if(e.isIntersecting){ setActive(+e.target.dataset.i); } });
},{rootMargin:'-48% 0px -48% 0px',threshold:0});
secs.forEach(function(s){io.observe(s);});

/* ---- background particle figures, morph on track change, fixed ---- */
(function(){
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function hex(h){h=h.replace('#','');return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];}
  var S=300, off=document.createElement('canvas'); off.width=S; off.height=S; var o=off.getContext('2d');
  function samp(){var d=o.getImageData(0,0,S,S).data,p=[];for(var y=0;y<S;y+=4)for(var x=0;x<S;x+=4){if(d[(y*S+x)*4+3]>128)p.push([x/S,y/S]);}return p;}
  function draw(key){o.setTransform(1,0,0,1,0,0);o.clearRect(0,0,S,S);o.fillStyle='#000';o.strokeStyle='#000';o.translate(S/2,S/2);
    if(key==='net'){o.lineWidth=7;var N=7,R=95,pts=[];for(var i=0;i<N;i++){var a=i*6.283/N-1.57;pts.push([Math.cos(a)*R,Math.sin(a)*R]);}
      for(var i=0;i<N;i++){o.beginPath();o.moveTo(0,0);o.lineTo(pts[i][0],pts[i][1]);o.stroke();var j=(i+1)%N;o.beginPath();o.moveTo(pts[i][0],pts[i][1]);o.lineTo(pts[j][0],pts[j][1]);o.stroke();}
      for(var i=0;i<N;i++){o.beginPath();o.arc(pts[i][0],pts[i][1],13,0,7);o.fill();}o.beginPath();o.arc(0,0,20,0,7);o.fill();}
    else if(key==='target'){o.lineWidth=13;[110,72,34].forEach(function(r){o.beginPath();o.arc(0,0,r,0,7);o.stroke();});o.beginPath();o.arc(0,0,12,0,7);o.fill();}
    else if(key==='bars'){o.lineWidth=9;var h=[70,120,170,220],w=48,g=26,tot=h.length*w+(h.length-1)*g,x=-tot/2;for(var i=0;i<h.length;i++){o.strokeRect(x,120-h[i],w,h[i]);x+=w+g;}}
    else{o.lineWidth=16;o.lineCap='round';for(var i=0;i<4;i++){var a=i*Math.PI/2;o.beginPath();o.moveTo(0,0);o.lineTo(Math.cos(a)*118,Math.sin(a)*118);o.stroke();}for(var i=0;i<4;i++){var a=i*Math.PI/2+Math.PI/4;o.beginPath();o.moveTo(0,0);o.lineTo(Math.cos(a)*66,Math.sin(a)*66);o.stroke();}}
  }
  var KEYS=['net','target','bars','spark'], FIG={};
  KEYS.forEach(function(k){draw(k);FIG[k]=samp();});
  var POOL=560;
  var cv=document.getElementById('pf'), ctx=cv.getContext('2d');
  var dpr=Math.min(window.devicePixelRatio||1,2), W=0,H=0, cx=0,cy=0,box=0, started=false;
  var P=[]; for(var i=0;i<POOL;i++){P.push({cx:0,cy:0,tx:0,ty:0,ph:Math.random()*6.28,sp:0.4+Math.random()*0.6,z:(Math.random()-0.5)});}
  var rgb=[255,107,69], trgb=[255,107,69], curKey='net';
  function norm(key,k){var f=FIG[key];return f[Math.floor(k*f.length/POOL)%f.length];}
  function retarget(){ for(var i=0;i<POOL;i++){var q=norm(curKey,i); P[i].tx=cx+(q[0]-0.5)*box; P[i].ty=cy+(q[1]-0.5)*box;} }
  function resize(){ W=window.innerWidth; H=window.innerHeight; cv.width=W*dpr; cv.height=H*dpr; ctx.setTransform(dpr,0,0,dpr,0,0);
    box=Math.min(W*0.30,H*0.56); var half=box*0.5+30;
    cx=Math.min(W*0.72, W-half); cx=Math.max(cx, W*0.5);
    cy=Math.min(Math.max(H*0.5, half), H-half); retarget();
    if(!started){ for(var i=0;i<POOL;i++){P[i].cx=P[i].tx;P[i].cy=P[i].ty;} started=true; } }
  window.__pf=function(i){ var t=T[i]; curKey=t[5]; trgb=hex(t[2]); retarget(); };
  var mx=0,my=0,tmx=0,tmy=0;
  if(!(window.matchMedia&&matchMedia('(max-width:680px)').matches))window.addEventListener('pointermove',function(e){tmx=e.clientX/window.innerWidth-0.5;tmy=e.clientY/window.innerHeight-0.5;});
  var t0=Date.now();
  function frame(){ var tt=(Date.now()-t0)/1000;
    mx+=(tmx-mx)*0.05; my+=(tmy-my)*0.05;
    for(var c=0;c<3;c++){rgb[c]+=(trgb[c]-rgb[c])*0.06;}
    ctx.clearRect(0,0,W,H); ctx.globalCompositeOperation='lighter';
    var R=Math.round(rgb[0]),G=Math.round(rgb[1]),B=Math.round(rgb[2]);
    ctx.fillStyle='rgb('+R+','+G+','+B+')';
    for(var i=0;i<POOL;i++){var p=P[i];
      p.cx+=(p.tx-p.cx)*0.08; p.cy+=(p.ty-p.cy)*0.08;
      var x=p.cx+Math.sin(tt*p.sp+p.ph)*2 + mx*20*p.z*2;
      var y=p.cy+Math.cos(tt*p.sp*0.9+p.ph)*2 + my*16*p.z*2;
      ctx.globalAlpha=0.7;
      ctx.beginPath();ctx.arc(x,y,1.7,0,6.283);ctx.fill();}
    ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
    if(!reduce)requestAnimationFrame(frame);
  }
  resize(); window.addEventListener('resize',resize);
  window.__pf(cur<0?0:cur);
  frame();
})();

})();

/* Карточки участников: при каждой загрузке главной перемешиваем весь список.
   Переставляем сами элементы, чтобы визуальный порядок совпадал с порядком
   чтения и обхода ссылок клавиатурой. Без JS сохраняется полный список. */
(function(){
  var grid=document.querySelector('.people-grid');
  if(!grid)return;
  var cards=[].slice.call(grid.querySelectorAll('.person'));
  for(var i=cards.length-1;i>0;i--){
    var j=Math.floor(Math.random()*(i+1));
    var card=cards[i];cards[i]=cards[j];cards[j]=card;
  }
  var fragment=document.createDocumentFragment();
  cards.forEach(function(card){fragment.appendChild(card);});
  grid.appendChild(fragment);
})();

/* ── Счётчики в блоке «Онтико» ─────────────────────────────── */
(function(){var band=document.querySelector('#ontico .statband');if(!band)return;var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;function fmt(n){return String(n).replace(/\B(?=(\d{3})+(?!\d))/g,'\u00A0');}var sts=[].slice.call(band.querySelectorAll('.st'));var items=sts.map(function(st,i){st.style.setProperty('--d',(i*0.09)+'s');var el=st.querySelector('.stn');var raw=el.textContent;var num=parseInt(raw.replace(/\D/g,''),10)||0;var suf=raw.replace(/[\d\s\u00A0]/g,'');el.textContent='0'+suf;return{el:el,num:num,suf:suf};});var done=false;function run(){if(done)return;done=true;band.classList.add('in');if(reduce){items.forEach(function(s){s.el.textContent=fmt(s.num)+s.suf;});return;}items.forEach(function(s,i){var t0=null,dur=1300,delay=i*140;function step(ts){if(t0===null)t0=ts;var e=ts-t0-delay;if(e<0){requestAnimationFrame(step);return;}var p=Math.min(1,e/dur),ea=1-Math.pow(1-p,3);s.el.textContent=fmt(Math.round(s.num*ea))+s.suf;if(p<1)requestAnimationFrame(step);}requestAnimationFrame(step);});}var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){run();io.disconnect();}});},{rootMargin:'-12% 0px -12% 0px',threshold:0});io.observe(band);setTimeout(run,2600);})();

/* ── Телефон в контактах — кликабельная ссылка ─────────────────────────────── */
(function(){document.querySelectorAll('#contacts .cp').forEach(function(el){if(el.tagName==='A')return;var tel=el.textContent.replace(/[^\d+]/g,'');if(!tel)return;var a=document.createElement('a');a.className='cp';a.href='tel:'+tel;a.textContent=el.textContent;el.replaceWith(a);});})();

/* ── Частицы в подвале ─────────────────────────────── */
(function(){
  var cv=document.getElementById('footpcv');
  if(!cv)return;
  var ctx=cv.getContext('2d');
  var dpr=Math.min(window.devicePixelRatio||1,2), W=0,H=0, cx0=0,cy0=0,box=0;
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var S=320, off=document.createElement('canvas'); off.width=S; off.height=S; var octx=off.getContext('2d');
  var PTS=window.__NPTS||{};
  var order=["AI Native","logo1","logo2","OpenAI","Claude","Cursor","Grok","Алиса","GigaChat"];
  var targets={};
  function drawAI(){ octx.setTransform(1,0,0,1,0,0); octx.clearRect(0,0,S,S);
    octx.fillStyle='#fff'; octx.font='700 172px system-ui,-apple-system,sans-serif';
    octx.textAlign='center'; octx.textBaseline='middle'; octx.fillText('AI',S/2,S/2+4); }
  function sampleCanvas(){ var d=octx.getImageData(0,0,S,S).data,p=[],st=3;
    for(var y=0;y<S;y+=st)for(var x=0;x<S;x+=st){var i=(y*S+x)*4;if(d[i+3]>130)p.push([x/S,y/S,255,255,255]);}return p; }
  function themed(r,g,b){ var mx=Math.max(r,g,b),mn=Math.min(r,g,b),sat=mx-mn;
    if(mx<85||sat<28) return [234,241,252];
    var f=Math.min(2.15,238/(mx||1)); return [Math.min(255,r*f)|0,Math.min(255,g*f)|0,Math.min(255,b*f)|0]; }
  function norm(pts){ if(!pts.length) return pts; var mnx=1,mxx=0,mny=1,mxy=0,i,p; for(i=0;i<pts.length;i++){p=pts[i]; if(p[0]<mnx)mnx=p[0]; if(p[0]>mxx)mxx=p[0]; if(p[1]<mny)mny=p[1]; if(p[1]>mxy)mxy=p[1];} var w=mxx-mnx,h=mxy-mny,cx=(mnx+mxx)/2,cy=(mny+mxy)/2,sc=0.9/Math.max(w,h,1e-4),o=[]; for(i=0;i<pts.length;i++){p=pts[i]; o.push([0.5+(p[0]-cx)*sc,0.5+(p[1]-cy)*sc,p[2],p[3],p[4]]);} return o; }
  function buildTargets(){ drawAI(); targets["AI Native"]=norm(sampleCanvas()); for(var n in PTS) targets[n]=norm(PTS[n]); }

  var N=2400,P=[];
  function initP(){ for(var i=0;i<N;i++)P.push({x:cx0,y:cy0,tx:cx0,ty:cy0,cr:234,cg:241,cb:252,tr:234,tg:241,tb:252,z:(Math.random()-.5)*94,seed:Math.random()}); }
  function toStage(p){ return [cx0-box/2+p[0]*box, cy0-box/2+p[1]*box]; }
  function assign(name){ var pts=targets[name]; if(!pts||!pts.length)return;
    for(var i=0;i<N;i++){ var p=pts[(i+((P[i].seed*pts.length)|0))%pts.length], t=toStage(p), c=themed(p[2],p[3],p[4]);
      P[i].tx=t[0];P[i].ty=t[1];P[i].tr=c[0];P[i].tg=c[1];P[i].tb=c[2]; } }
  function layout(){ var r=cv.getBoundingClientRect(); W=r.width;H=r.height; cv.width=W*dpr;cv.height=H*dpr; ctx.setTransform(dpr,0,0,dpr,0,0);
    var _mob=window.matchMedia&&matchMedia('(max-width:680px)').matches; cx0=W*0.5; cy0=H*0.42; box=Math.min(_mob?W*0.82:W*0.46,H*0.72); }

  var angX=0,angY=0,tAngX=0,tAngY=0,hasP=false,idleT=999;
  function onMove(e){ var nx=(e.clientX-cx0)/(box/2), ny=(e.clientY-cy0)/(box/2);
    nx=Math.max(-1.8,Math.min(1.8,nx)); ny=Math.max(-1.8,Math.min(1.8,ny));
    tAngY=nx*0.5; tAngX=-ny*0.34; hasP=true; idleT=0; }
  if(!(window.matchMedia&&matchMedia('(max-width:680px)').matches))window.addEventListener('pointermove',onMove,{passive:true});

  var idx=0,hold=0,HOLD=215,running=false;
  function frame(){ ctx.clearRect(0,0,W,H); idleT++;
    if(!hasP||idleT>260){ tAngY=Math.sin(Date.now()*0.00035)*0.3; tAngX=Math.sin(Date.now()*0.00024)*0.1; }
    angY+=(tAngY-angY)*0.05; angX+=(tAngX-angX)*0.05;
    var cY=Math.cos(angY),sY=Math.sin(angY),cX=Math.cos(angX),sX=Math.sin(angX),foc=680;
    ctx.globalCompositeOperation='lighter';
    for(var i=0;i<N;i++){ var p=P[i];
      p.x+=(p.tx-p.x)*0.072; p.y+=(p.ty-p.y)*0.072;
      p.cr+=(p.tr-p.cr)*0.1; p.cg+=(p.tg-p.cg)*0.1; p.cb+=(p.tb-p.cb)*0.1;
      var dx=p.x-cx0,dy=p.y-cy0,dz=p.z;
      var x1=dx*cY+dz*sY, z1=-dx*sY+dz*cY, y1=dy, y2=y1*cX-z1*sX, z2=y1*sX+z1*cX, x2=x1;
      var sc=foc/(foc-z2), px=cx0+x2*sc, py=cy0+y2*sc;
      ctx.globalAlpha=Math.min(0.30,(0.5*sc+0.34)*0.32);
      ctx.fillStyle='rgb('+(p.cr|0)+','+(p.cg|0)+','+(p.cb|0)+')';
      ctx.beginPath(); ctx.arc(px,py,1.32*sc,0,6.283); ctx.fill(); }
    ctx.globalCompositeOperation='source-over'; ctx.globalAlpha=1;
    if(!reduce&&running){ hold++; if(hold>HOLD){hold=0;idx=(idx+1)%order.length;assign(order[idx]);} requestAnimationFrame(frame); } }

  window.addEventListener('npts',function(){ PTS=window.__NPTS||{}; buildTargets(); assign(order[idx]); if(reduce)frame(); });
  layout(); initP(); buildTargets(); assign(order[idx]); if(reduce)frame(); var _io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){cv.classList.add('on');if(!running){running=true;requestAnimationFrame(frame);}}else{running=false;}});},{threshold:0}); _io.observe(cv); window.addEventListener('resize',function(){ layout(); assign(order[idx]); if(reduce)frame(); });
})();

/* ── Показ фоновых фигур только на секции программы ─────────────────────────────── */
(function(){
var pf=document.getElementById('pf'),bg=document.getElementById('bgtint'),sec=document.querySelector('#program .pgm')||document.getElementById('program');
if(pf&&sec){function upd(){var r=sec.getBoundingClientRect(),vh=window.innerHeight||1;var on=(r.top<vh*0.35)&&(r.bottom>vh*0.55);var v=on?'1':'0';pf.style.opacity=v;if(bg)bg.style.opacity=v;if(!on)document.documentElement.style.removeProperty('--glow');}window.addEventListener('scroll',upd,{passive:true});window.addEventListener('resize',upd);upd();}

})();

/* ── Мобильное меню ─────────────────────────────── */
(function(){
var b=document.querySelector('.nav-burger'),m=document.getElementById('mobmenu');
if(!b||!m)return;
function isOpen(){return b.getAttribute('aria-expanded')==='true';}
function onKey(e){if(e.key==='Escape'||e.key==='Esc'){closeM();}}
function onOutside(e){if(!isOpen())return;if(m.contains(e.target)||b.contains(e.target))return;closeM();}
function openM(){
  b.setAttribute('aria-expanded','true');
  m.setAttribute('aria-hidden','false');
  m.classList.add('open');
  document.body.classList.add('menu-open');
  var f=m.querySelector('a');if(f)f.focus();
  document.addEventListener('keydown',onKey);
  document.addEventListener('click',onOutside,true);
}
function closeM(){
  b.setAttribute('aria-expanded','false');
  m.setAttribute('aria-hidden','true');
  m.classList.remove('open');
  document.body.classList.remove('menu-open');
  document.removeEventListener('keydown',onKey);
  document.removeEventListener('click',onOutside,true);
  b.focus();
}
b.addEventListener('click',function(e){e.stopPropagation();isOpen()?closeM():openM();});
[].forEach.call(m.querySelectorAll('a'),function(a){a.addEventListener('click',function(){closeM();});});
})();

/* Подписка на анонсы — Mindbox.
   Два правила, без которых подписка молча не создаётся:
   1) Content-Type form-urlencoded и тело data=<JSON>. На сырой JSON путь
      /v3/js/operations/… отвечает 200, но тела не видит и ничего не пишет.
   2) sync, а не async: async отвечает 200 всегда, даже на несуществующую
      тематику. Проверяем именно status === 'Success', а не только res.ok. */
(function(){
var MB_ENDPOINT = 'ontico.ainativeconf';   /* системное имя интеграции в ЛК Mindbox */
var MB_TOPIC = 'Ai_Native';     /* внешний id тематики */
var MB_DEVICE_KEY = 'mindboxDeviceUUID';

/* deviceUUID свой на посетителя: один на всех склеил бы подписчиков в одно устройство. */
function mbDeviceUUID(){
  var gen = function(){
    if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c){
      var r = Math.random()*16|0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };
  try {
    var m = document.cookie.match(new RegExp('(?:^|; )' + MB_DEVICE_KEY + '=([^;]+)'));
    if (m) return decodeURIComponent(m[1]);
    var stored = window.localStorage.getItem(MB_DEVICE_KEY);
    if (stored) return stored;
    var uuid = gen();
    window.localStorage.setItem(MB_DEVICE_KEY, uuid);
    return uuid;
  } catch(e){
    return gen(); /* приватный режим: cookie и localStorage недоступны */
  }
}

var subForm = document.getElementById('subscribe-form');
if (subForm){
  var subInput = document.getElementById('subscribe-email');
  var subBtn = document.getElementById('subscribe-submit');
  var subMsg = document.getElementById('subscribe-msg');
  var subSending = false;

  var subSay = function(text, kind){
    subMsg.textContent = text;
    subMsg.className = 'subscribe__msg subscribe__msg--' + kind;
    subMsg.hidden = false;
  };
  var subReset = function(){
    subMsg.hidden = true; subMsg.textContent = '';
    subInput.classList.remove('is-invalid');
  };
  var subFail = function(text){ subInput.classList.add('is-invalid'); subSay(text, 'err'); };

  subInput.addEventListener('input', function(){ if (!subMsg.hidden) subReset(); });

  subForm.addEventListener('submit', function(e){
    e.preventDefault();
    if (subSending) return;
    var email = subInput.value.trim();
    subReset();
    if (!email){ subFail('Введите e-mail, на который присылать анонсы.'); return; }
    if (subInput.checkValidity && !subInput.checkValidity()){
      subFail('Проверьте e-mail: похоже, в адресе опечатка.'); return;
    }

    subSending = true;
    subBtn.disabled = true;
    subBtn.textContent = 'Отправляем…';
    var done = function(ok){
      subSending = false;
      subBtn.disabled = false;
      subBtn.textContent = 'Подписаться';
      if (ok){
        subInput.value = '';
        subSay('Готово. Вы подписались на анонсы.', 'ok');
      } else {
        subFail('Не удалось оформить подписку. Проверьте e-mail и попробуйте ещё раз.');
      }
    };

    var url = 'https://api.s.mindbox.ru/v3/js/operations/sync'
      + '?endpointId=' + encodeURIComponent(MB_ENDPOINT)
      + '&operation=FormRegistration'
      + '&deviceUUID=' + encodeURIComponent(mbDeviceUUID());
    var payload = JSON.stringify({
      customer: { email: email, subscriptions: [{ pointOfContact: 'Email', topic: MB_TOPIC }] }
    });
    try {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
        body: 'data=' + encodeURIComponent(payload)
      }).then(function(res){
        if (!res.ok){ done(false); return; }   /* 400 — тематика, адрес или точка интеграции */
        return res.json().then(function(body){
          done(!!body && body.status === 'Success');
        }, function(){ done(false); });        /* ответ не разобрался — успех не выдаём */
      }, function(){ done(false); });
    } catch(err){
      done(false); /* fetch недоступен или заблокирован расширением */
    }
  });
}
})();

/* ── Выбор формата участия: офлайн или онлайн ─────────────────────────────── */
/* Выбор живёт в разметке: у каждого тарифа две кнопки покупки — офлайн и онлайн.
   Ссылки различаются страницей (online_ain2026) и тарифом (payment_type=1 —
   оплата по счёту от компании). Поп-ап с развилкой убран: он прятал онлайн-формат
   за лишним кликом, а JS для двух обычных ссылок не нужен. */
