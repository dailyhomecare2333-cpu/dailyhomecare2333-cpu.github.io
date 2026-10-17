/* ---- 단면도 핫스팟 ---- */
(function(){
  var hots=document.querySelectorAll('.hot');
  var no=document.getElementById('cutNo'),t=document.getElementById('cutT'),d=document.getElementById('cutD');
  function pick(el){
    hots.forEach(function(h){h.setAttribute('aria-pressed','false')});
    el.setAttribute('aria-pressed','true');
    no.textContent=el.dataset.n; t.textContent=el.dataset.t; d.textContent=el.dataset.d;
  }
  hots.forEach(function(el){
    el.addEventListener('click',function(){pick(el)});
    el.addEventListener('mouseenter',function(){pick(el)});
    el.addEventListener('keydown',function(e){
      if(e.key==='Enter'||e.key===' '){e.preventDefault();pick(el);}
    });
  });
})();

/* ---- Before/After 슬라이더 ---- */
(function(){
  var ba=document.getElementById('ba');
  if(!ba) return;
  var dragging=false;
  function set(x){
    var r=ba.getBoundingClientRect();
    var p=Math.min(100,Math.max(0,((x-r.left)/r.width)*100));
    ba.style.setProperty('--pos',p+'%');
    ba.setAttribute('aria-valuenow',Math.round(p));
    ba.setAttribute('aria-valuetext',Math.round(p)+'% 지점');
  }
  function down(e){dragging=true;set((e.touches?e.touches[0]:e).clientX);}
  function move(e){if(dragging)set((e.touches?e.touches[0]:e).clientX);}
  function up(){dragging=false;}
  ba.addEventListener('mousedown',down); ba.addEventListener('touchstart',down,{passive:true});
  window.addEventListener('mousemove',move); window.addEventListener('touchmove',move,{passive:true});
  window.addEventListener('mouseup',up); window.addEventListener('touchend',up);
  ba.addEventListener('click',function(e){set(e.clientX)});
})();

/* ---- 영역별 작업 범위 탭 ---- */
(function(){
  var tabs=[].slice.call(document.querySelectorAll('.scope__tab'));
  var pans=[].slice.call(document.querySelectorAll('.scope__panel'));
  if(!tabs.length) return;
  var zones=[].slice.call(document.querySelectorAll('.fp__room,.fp__lab'));
  function show(i){
    zones.forEach(function(z){z.classList.toggle('is-on',+z.getAttribute('data-z')===i+1);});
    tabs.forEach(function(t,n){
      var on=n===i;
      t.classList.toggle('is-on',on);
      t.setAttribute('aria-selected',on?'true':'false');
      t.tabIndex=on?0:-1;
    });
    pans.forEach(function(pn,n){
      var on=n===i;
      pn.classList.toggle('is-on',on);
      if(on) pn.removeAttribute('hidden'); else pn.setAttribute('hidden','');
    });
  }
  show(0);
  [].forEach.call(document.querySelectorAll('.fp__room'),function(r){
    r.addEventListener('click',function(){show(+r.getAttribute('data-z')-1);});
  });
  tabs.forEach(function(t,i){
    t.addEventListener('click',function(){show(i)});
    t.addEventListener('keydown',function(e){
      var n=null;
      if(e.key==='ArrowRight') n=(i+1)%tabs.length;
      else if(e.key==='ArrowLeft') n=(i-1+tabs.length)%tabs.length;
      else if(e.key==='Home') n=0;
      else if(e.key==='End') n=tabs.length-1;
      if(n!==null){e.preventDefault();show(n);tabs[n].focus();}
    });
  });
})();

/* ---- 헤더 stuck + 스크롤 진행바 (rAF 스로틀) ---- */
(function(){
  var nav=document.querySelector('.nav'), bar=document.querySelector('.nav__bar');
  if(!nav) return;
  var ticking=false;
  function paint(){
    var y=window.scrollY||document.documentElement.scrollTop;
    nav.classList.toggle('stuck',y>100);
    if(bar){
      var h=document.documentElement.scrollHeight-window.innerHeight;
      bar.style.setProperty('--p', h>0 ? Math.min(1,y/h) : 0);
    }
    ticking=false;
  }
  window.addEventListener('scroll',function(){
    if(!ticking){ticking=true;requestAnimationFrame(paint);}
  },{passive:true});
  paint();
})();

/* ---- 견적 카드 카운트업 (0원의 의미를 시각적 사건으로) ---- */
(function(){
  var reduce=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  var els=document.querySelectorAll('.cost__n[data-count]');
  if(!els.length) return;
  if(reduce||!('IntersectionObserver' in window)){
    els.forEach(function(e){e.textContent='0원'}); return;
  }
  var fmt=function(n){return n.toLocaleString('ko-KR')+'원'};
  var io=new IntersectionObserver(function(ent){
    ent.forEach(function(x){
      if(!x.isIntersecting) return;
      io.unobserve(x.target);
      var el=x.target, from=+el.dataset.from||0, to=+el.dataset.count||0, t0=null, dur=1100;
      function tick(ts){
        if(!t0) t0=ts;
        var k=Math.min(1,(ts-t0)/dur);
        var e=1-Math.pow(1-k,4);                 /* expo-out : 감속 착지 */
        el.textContent=fmt(Math.round(from+(to-from)*e));
        if(k<1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  },{threshold:.5});
  els.forEach(function(e){io.observe(e)});
})();

/* ---- Before/After : 힌트 nudge + 키보드 조작 ---- */
(function(){
  var ba=document.getElementById('ba');
  if(!ba) return;
  var reduce=window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  function setPos(p){
    p=Math.min(100,Math.max(0,p));
    ba.style.setProperty('--pos',p+'%');
    ba.setAttribute('aria-valuenow',Math.round(p));
    ba.setAttribute('aria-valuetext',Math.round(p)+'% 지점');
  }
  ba.addEventListener('keydown',function(e){
    var cur=parseFloat(ba.getAttribute('aria-valuenow'))||50, step=e.shiftKey?10:2;
    if(e.key==='ArrowLeft'){setPos(cur-step);e.preventDefault();}
    else if(e.key==='ArrowRight'){setPos(cur+step);e.preventDefault();}
    else if(e.key==='Home'){setPos(0);e.preventDefault();}
    else if(e.key==='End'){setPos(100);e.preventDefault();}
  });

  if(!reduce && 'IntersectionObserver' in window){
    var io=new IntersectionObserver(function(ent){
      ent.forEach(function(x){
        if(!x.isIntersecting) return;
        io.unobserve(x.target);
        ba.classList.add('hint');
        ba.addEventListener('animationend',function(){ba.classList.remove('hint')},{once:true});
      });
    },{threshold:.4});
    io.observe(ba);
  }
})();

/* ---- 스크롤 리빌 ---- */
(function(){
  var els=document.querySelectorAll('.rv');
  if(!('IntersectionObserver' in window)){els.forEach(function(e){e.classList.add('in')});return;}
  var io=new IntersectionObserver(function(ent){
    ent.forEach(function(x){ if(x.isIntersecting){x.target.classList.add('in'); io.unobserve(x.target);} });
  },{threshold:.12});
  els.forEach(function(e){io.observe(e)});
})();
/* ---- 히어로 릴스 마키 ---- */
(function(){
  var box=document.getElementById('reels'); if(!box) return;
  var track=box.querySelector('.reels__track');
  var base=[].slice.call(track.children), n=base.length; if(!n) return;
  var reduce=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  var btn=document.getElementById('reelsToggle');

  /* 화면보다 충분히 길어지도록 세트를 복제하고, 정확히 1세트 폭만큼만 이동 → 이음매 없이 반복 */
  function layout(){
    var gap=parseFloat(getComputedStyle(track).columnGap)||0;
    var setW=n*(base[0].offsetWidth+gap);
    var need=reduce?1:Math.ceil(window.innerWidth/setW)+1;
    var have=track.children.length/n;
    for(;have<need;have++){
      base.forEach(function(el){
        var c=el.cloneNode(true); c.setAttribute('aria-hidden','true');
        c.classList.remove('is-ready'); track.appendChild(c); watch(c);
      });
    }
    var speed=parseFloat(getComputedStyle(box).getPropertyValue('--reel-speed'))||38;
    track.style.setProperty('--set-w',setW+'px');
    track.style.setProperty('--reel-dur',(setW/speed).toFixed(1)+'s');
  }

  /* 화면에 들어온 카드만 로드·재생, 벗어나면 정지 (데이터·배터리 절약) */
  var io=('IntersectionObserver' in window)?new IntersectionObserver(function(ents){
    ents.forEach(function(e){
      var v=e.target.querySelector('video'); if(!v) return;
      if(e.isIntersecting){
        if(!v.getAttribute('src')&&v.dataset.src){v.src=v.dataset.src;}
        var p=v.play(); if(p&&p.catch){p.catch(function(){});}
      }else{ v.pause(); }
    });
  },{rootMargin:window.innerWidth<900?'0px 24px':'0px 160px'}):null;
  function watch(el){
    var v=el.querySelector('video'); if(!v) return;
    v.addEventListener('loadeddata',function(){el.classList.add('is-ready');});
    if(io){io.observe(el);} else if(v.dataset.src){v.src=v.dataset.src;v.play();}
  }

  base.forEach(watch);
  box.classList.add('is-live');
  layout();
  var t; window.addEventListener('resize',function(){clearTimeout(t);t=setTimeout(layout,150);});

  var bg=document.getElementById('heroBg');
  /* 배경 영상 : PC는 가로 영상, 모바일은 세로로 잘라 가볍게 만든 영상 */
  if(bg&&!reduce){ bg.src=window.matchMedia('(min-width:900px)').matches?bg.dataset.src:bg.dataset.srcM; }
  function bgPlay(on){ if(!bg) return; if(on&&!reduce&&!box.classList.contains('is-paused')){var q=bg.play(); if(q&&q.catch){q.catch(function(){});}} else {bg.pause();} }
  if(bg){
    if(reduce){bg.removeAttribute('autoplay');bg.pause();}
    if('IntersectionObserver' in window){
      new IntersectionObserver(function(e){bgPlay(e[0].isIntersecting);}).observe(bg);
    }
  }
  if(btn){btn.addEventListener('click',function(){
    var on=box.classList.toggle('is-paused'); bgPlay(!on);
    btn.setAttribute('aria-pressed',on?'true':'false');
    btn.textContent=on?'자동 재생 시작':'자동 재생 멈춤';
  });}
})();
/* ---- 전후 사진 슬라이드 : 자동 흐름 + 드래그/스와이프 + 좌우 버튼 ---- */
[].forEach.call(document.querySelectorAll('.baflow'),function(box){
  var track=box.querySelector('.baflow__track');
  var base=[].slice.call(track.children), n=base.length; if(!n) return;
  var reduce=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  var speed=parseFloat(box.getAttribute('data-speed'))||40;
  var setW=0, step=0, pos=0, last=0, inView=false, hold=0, stopped=false, drag=null, timer;

  function measure(){
    var gap=parseFloat(getComputedStyle(track).columnGap)||0;
    step=base[0].offsetWidth+gap; setW=n*step;
    var need=reduce?1:Math.ceil(box.clientWidth/setW)+1;
    for(var have=track.children.length/n;have<need;have++){
      base.forEach(function(el){var c=el.cloneNode(true);c.setAttribute('aria-hidden','true');track.appendChild(c);});
    }
  }
  function wrap(){ if(reduce||!setW) return; if(box.scrollLeft>=setW) box.scrollLeft-=setW; else if(box.scrollLeft<=0&&drag) box.scrollLeft+=setW; }
  function pause(ms){ hold=Date.now()+(ms||2500); }
  function tick(t){
    var dt=Math.min(64,t-(last||t)); last=t;
    if(inView&&!stopped&&!drag&&Date.now()>hold&&!document.hidden){
      if(Math.abs(pos-box.scrollLeft)>2) pos=box.scrollLeft;
      pos+=speed*dt/1000; if(pos>=setW) pos-=setW;
      box.scrollLeft=pos;
    }
    requestAnimationFrame(tick);
  }
  measure();
  window.addEventListener('resize',function(){clearTimeout(timer);timer=setTimeout(measure,150);});
  box.addEventListener('scroll',wrap,{passive:true});

  /* 사용자가 만지는 동안은 멈춤 */
  ['mouseenter','touchstart','focusin','wheel'].forEach(function(ev){box.addEventListener(ev,function(){pause(ev==='mouseenter'?600000:3000);},{passive:true});});
  box.addEventListener('mouseleave',function(){ if(!drag) pause(400); });
  box.addEventListener('touchend',function(){pause(3000);},{passive:true});

  /* 마우스 드래그 */
  box.addEventListener('mousedown',function(e){drag={x:e.clientX,s:box.scrollLeft};box.classList.add('is-drag');e.preventDefault();});
  window.addEventListener('mousemove',function(e){
    if(!drag) return;
    var v=drag.s-(e.clientX-drag.x);
    if(!reduce&&setW){ if(v<0){v+=setW;drag.s+=setW;} else if(v>=setW){v-=setW;drag.s-=setW;} }
    box.scrollLeft=v;
  });
  window.addEventListener('mouseup',function(){ if(!drag) return; drag=null; box.classList.remove('is-drag'); pause(box.matches(':hover')?600000:2500); });

  /* 좌우 버튼 · 키보드 */
  function go(dir){
    pause(4000);
    if(!reduce&&dir<0&&box.scrollLeft<step) box.scrollLeft+=setW;
    box.scrollBy({left:dir*step,behavior:reduce?'auto':'smooth'});
  }
  var ctl=box.nextElementSibling&&box.nextElementSibling.querySelector('.baflow__ctl');
  var bt=ctl?ctl.querySelectorAll('.baflow__btn'):[], prev=bt[0], next=bt[1], tg=ctl&&ctl.querySelector('.baflow__toggle');
  if(prev) prev.addEventListener('click',function(){go(-1)});
  if(next) next.addEventListener('click',function(){go(1)});
  box.addEventListener('keydown',function(e){ if(e.key==='ArrowRight'){e.preventDefault();go(1);} else if(e.key==='ArrowLeft'){e.preventDefault();go(-1);} });
  if(tg) tg.addEventListener('click',function(){
    stopped=!stopped; tg.setAttribute('aria-pressed',stopped?'true':'false');
    tg.textContent=stopped?'자동 재생 시작':'자동 재생 멈춤';
  });

  if(reduce) return;
  if('IntersectionObserver' in window){ new IntersectionObserver(function(e){inView=e[0].isIntersecting;}).observe(box); } else { inView=true; }
  requestAnimationFrame(tick);
});
/* ---- 실제 고객 후기 롤링 : 순서를 섞고 4초에 한 줄씩 위로 ---- */
(function(){
  var l=document.querySelector('.live__list'); if(!l) return;
  var items=[].slice.call(l.children), n=items.length; if(n<2) return;
  for(var k=n-1;k>0;k--){var r=Math.floor(Math.random()*(k+1)); l.appendChild(items.splice(r,1)[0]);}   /* 방문할 때마다 다른 순서 */
  if(items[0]) l.appendChild(items[0]);
  if(window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  [].slice.call(l.children,0,5).forEach(function(li){var c=li.cloneNode(true);c.setAttribute('aria-hidden','true');l.appendChild(c);});
  var i=0, hover=false;
  l.addEventListener('mouseenter',function(){hover=true;}); l.addEventListener('mouseleave',function(){hover=false;});
  setInterval(function(){
    if(hover||document.hidden) return;
    i++; l.style.setProperty('--i',i);
    if(i>=n){ setTimeout(function(){ l.classList.add('is-jump'); i=0; l.style.setProperty('--i',0); l.offsetHeight; l.classList.remove('is-jump'); },700); }
  },4000);
})();

/* ---- 자주 묻는 질문 : 분류 필터 ---- */
(function(){
  var tabs=[].slice.call(document.querySelectorAll('.faq__tab')); if(!tabs.length) return;
  var items=[].slice.call(document.querySelectorAll('.faq'));
  function pick(cat){
    tabs.forEach(function(t){t.setAttribute('aria-pressed',t.getAttribute('data-cat')===cat?'true':'false');});
    items.forEach(function(d){
      var on=cat==='all'||(' '+d.getAttribute('data-cat')+' ').indexOf(' '+cat+' ')>-1;
      d.hidden=!on; if(!on) d.open=false;
    });
  }
  tabs.forEach(function(t){t.addEventListener('click',function(){pick(t.getAttribute('data-cat'));});});
  var h=(location.hash||'').slice(1);
  pick(['clean','grout','coat'].indexOf(h)>-1?h:'all');
})();

/* ---- 모바일 : 히어로(또는 페이지 머리)를 지나면 SNS 버튼 표시 ---- */
(function(){
  var fab=document.querySelector('.fab'); if(!fab) return;
  var mq=window.matchMedia('(max-width:899px)'), lim=0;
  function calc(){ var h=document.querySelector('.hero')||document.querySelector('.pagehead');
    lim=h?h.getBoundingClientRect().bottom+window.scrollY-120:240; }
  function upd(){ fab.classList.toggle('is-on',!mq.matches||window.scrollY>lim); }
  calc(); upd();
  window.addEventListener('scroll',upd,{passive:true});
  window.addEventListener('resize',function(){calc();upd();});
})();

/* ---- 예전 탭 주소(clean.html#office / #build)로 들어오면 새 페이지로 ---- */
(function(){
  if(!/clean\.html$/.test(location.pathname)) return;
  var m={office:'clean-office.html',build:'clean-build.html'}[(location.hash||'').slice(1)];
  if(m) location.replace(m);
})();

/* ---- 견적 문의 폼 ---- */
(function(){
  var form=document.getElementById('inqForm'); if(!form) return;
  var REQ=['service','region','building','size','name','phone','agree'];
  var LABEL={service:'서비스',region:'방문 지역',area:'시·구·동',building:'건물 형태',size:'크기',addon:'함께 진행',date:'희망 작업일',name:'이름',phone:'연락처',memo:'전달 내용'};
  var msg=document.getElementById('inqMsg'), done=document.getElementById('inqDone');
  var phone=form.elements.phone, touched={};

  function val(k){
    var el=form.elements[k]; if(!el) return '';
    if(el.length&&!el.tagName){
      return [].filter.call(el,function(i){return i.checked}).map(function(i){return i.value}).join(', ');
    }
    if(el.type==='checkbox') return el.checked?el.value:'';
    return (el.value||'').trim();
  }
  function ok(k){
    var v=val(k);
    if(k==='phone') return /^01[016789]-\d{3,4}-\d{4}$/.test(v);
    return v!=='';
  }
  function box(k){return form.querySelector('[data-key="'+k+'"]');}
  function mark(k,show){
    var b=box(k); if(!b) return;
    var bad=show&&!ok(k), e=b.querySelector('.inq__err');
    b.classList.toggle('is-bad',bad); if(e) e.hidden=!bad;
    var inp=b.querySelector('.inq__input'); if(inp) inp.setAttribute('aria-invalid',bad?'true':'false');
  }
  function progress(){
    var n=0;
    REQ.forEach(function(k){
      var good=ok(k); if(good) n++;
      var li=form.querySelector('.inq__steps [data-for="'+k+'"]'); if(li) li.classList.toggle('is-ok',good);
    });
    var pct=Math.round(n/REQ.length*100);
    form.querySelector('.inq__bar i').style.width=pct+'%';
    form.querySelector('.inq__bar').setAttribute('aria-valuenow',pct);
    document.getElementById('inqPct').textContent=pct;
    var mb=form.querySelector('.inq__mbar');
    if(mb){ document.getElementById('inqMN').textContent=n; mb.querySelector('i b').style.width=pct+'%'; mb.classList.toggle('is-done',n===REQ.length); }
    if(n===REQ.length&&msg&&/is-err/.test(msg.className)) msg.hidden=true;
  }
  /* 선택한 서비스와 같은 항목은 '함께 진행' 목록에서 숨김 */
  function syncAddon(){
    var s=val('service');
    [].forEach.call(form.querySelectorAll('[data-key="addon"] .opt'),function(l){
      var inp=l.querySelector('input');
      var hide=(l.getAttribute('data-same')===s)||(inp.hasAttribute('data-clean')&&/청소/.test(s));
      l.hidden=hide; if(hide) inp.checked=false;
    });
    if((s==='사무실 입주청소'||s==='상가·매장 청소')&&!val('building')){
      var b=form.querySelector('input[name="building"][value="상가·사무실"]'); if(b) b.checked=true;
    }
  }
  phone.addEventListener('input',function(){
    var d=phone.value.replace(/\D/g,'').slice(0,11), o=d;
    if(d.length>7) o=d.slice(0,3)+'-'+d.slice(3,d.length-4)+'-'+d.slice(-4);
    else if(d.length>3) o=d.slice(0,3)+'-'+d.slice(3);
    phone.value=o;
  });
  form.addEventListener('change',function(e){
    var t=e.target;
    if(t.name==='addon'){
      var none=form.querySelector('input[data-none]');
      if(t===none&&t.checked){[].forEach.call(form.elements.addon,function(i){if(i!==none)i.checked=false;});}
      else if(t.checked){none.checked=false;}
    }
    if(t.name==='service') syncAddon();
    if(t.name){touched[t.name]=1; mark(t.name,true);}
    progress();
  });
  form.addEventListener('input',function(e){ if(touched[e.target.name]) mark(e.target.name,true); progress(); });
  form.addEventListener('focusout',function(e){ var k=e.target.name; if(k==='name'||k==='phone'){touched[k]=1;mark(k,true);} });

  function say(text,err){ msg.hidden=false; msg.className='inq__msg'+(err?' is-err':''); msg.textContent=text; }
  function summary(){
    var dl=document.getElementById('inqSum'); dl.textContent='';
    ['service','addon','region','area','building','size','date','name','phone'].forEach(function(k){
      var v=val(k); if(!v) return;
      var dt=document.createElement('dt'), dd=document.createElement('dd');
      dt.textContent=LABEL[k]; dd.textContent=v; dl.appendChild(dt); dl.appendChild(dd);
    });
  }
  form.addEventListener('submit',function(e){
    e.preventDefault();
    var first=null;
    REQ.forEach(function(k){touched[k]=1; mark(k,true); if(!ok(k)&&!first) first=k;});
    if(first){
      say('아직 입력하지 않은 필수 항목이 있습니다.',true);
      var b=box(first); b.scrollIntoView({block:'center'});
      var f=b.querySelector('input,textarea'); if(f) f.focus({preventScroll:true});
      return;
    }
    if(form.elements.company_site.value) return;            /* 자동 입력 봇 차단 */
    var url=form.getAttribute('action');
    if(!url||url==='FORM_ENDPOINT_HERE'){
      say('입력은 모두 확인됐지만, 아직 접수 연결 전이라 전송되지 않았습니다. 지금은 카카오톡이나 전화로 문의해 주세요.',false);
      return;
    }
    var btn=form.querySelector('.inq__submit'); btn.disabled=true; btn.textContent='보내는 중…';
    fetch(url,{method:'POST',headers:{'Accept':'application/json'},body:new FormData(form)})
      .then(function(r){ if(!r.ok) throw new Error(r.status); return r.json().catch(function(){return {};}); })
      .then(function(d){ if(d&&d.ok===false) throw new Error(d.error||'rejected'); summary(); form.hidden=true; done.hidden=false; done.focus(); done.scrollIntoView({block:'start'}); })
      .catch(function(){ say('전송에 실패했습니다. 잠시 뒤 다시 시도하시거나 카카오톡·전화로 문의해 주세요.',true); btn.disabled=false; btn.textContent='견적 요청하기'; });
  });
  /* 청소 페이지에서 넘어온 경우 서비스 미리 선택 : inquiry.html?svc=apt|office|build */
  var pre={apt:'입주청소',office:'사무실 입주청소',build:'준공청소'}[(location.search.match(/[?&]svc=([a-z]+)/)||[])[1]];
  if(pre){ var r=form.querySelector('input[name="service"][value="'+pre+'"]'); if(r){ r.checked=true; touched.service=1; } }
  syncAddon(); progress();
})();

/* ---- 모션 (보통 단계) : 순차 등장 · 숫자 · 막대 · 구조도 — 스타일은 motion.css ---- */
(function(){
  var root=document.documentElement;
  if(!root.classList.contains('mo')||!('IntersectionObserver' in window)) return;

  /* 이미 지나간(화면 위쪽) 요소는 움직임 없이 바로 보이게 */
  function watch(els,fn,opt){
    if(!els.length) return;
    var io=new IntersectionObserver(function(ent){
      ent.forEach(function(x){
        if(x.isIntersecting){ io.unobserve(x.target); fn(x.target,true); }
        else if(x.boundingClientRect.bottom<0){ io.unobserve(x.target); fn(x.target,false); }
      });
    },opt||{threshold:.15,rootMargin:'0px 0px -8% 0px'});
    els.forEach(function(e){io.observe(e)});
  }
  var $$=function(q){return [].slice.call(document.querySelectorAll(q))};

  /* 1. 카드 · 목록 순차 등장 : 묶음 안의 자식에게 순번(--i)을 줌 */
  var GROUPS='.trio,.strip__in,.fit,.why,.cost,.gsteps,.care,.cpts,.cgal,.ctype__fit,.b3,.trust,.tl,.story__steps,.mspec,.pkg,.qa,.rstat,.promise,.steps';
  var groups=$$(GROUPS);
  groups.forEach(function(g){
    var long=g.classList.contains('steps')||g.classList.contains('story__steps')||g.classList.contains('tl');
    [].forEach.call(g.children,function(c,i){ c.style.setProperty('--i',long?i:Math.min(i,6)); });
    g.classList.add('mo-stg');
  });
  watch(groups,function(g){ g.classList.add('in'); });

  /* 2. 숫자 카운트업 : 화면에 들어올 때 0부터 실제 값까지. 끝 값은 원래 글자 그대로 */
  var NUMS='.rstat__total b,.rstat__n b,.rstat__tags em,.rstat__tags p span';
  var nums=[];
  $$(NUMS).forEach(function(el){
    var walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT,null), t;
    while((t=walker.nextNode())){
      var m=/\d{1,3}(?:,\d{3})+|\d{2,}/.exec(t.nodeValue);
      if(!m) continue;
      var after=t.splitText(m.index); after.splitText(m[0].length);
      /* data 태그 : 기존 span 스타일(.rstat__total span 등)이 숫자에 붙지 않게 */
      var sp=document.createElement('data'); sp.className='mo-num'; sp.textContent=m[0];
      sp.value=m[0].replace(/,/g,'');
      after.parentNode.replaceChild(sp,after); nums.push(sp); break;
    }
  });
  var fmt=function(n){return n.toLocaleString('ko-KR')};
  function count(sp,go){
    var to=+sp.value;
    if(!go){ sp.textContent=fmt(to); return; }
    var t0=performance.now(), dur=1300;
    (function tick(){
      var k=Math.min(1,(performance.now()-t0)/dur), e=1-Math.pow(1-k,4);   /* 빠르게 오르다 천천히 멈춤 */
      sp.textContent=fmt(Math.round(to*e));
      if(k<1) requestAnimationFrame(tick);
    })();
  }
  /* 화면 아래에 있는 숫자만 0으로 바꿔 두고 셈 (첫 화면에 보이는 숫자는 건드리지 않음) */
  nums=nums.filter(function(sp){ if(sp.getBoundingClientRect().top>innerHeight){ sp.textContent='0'; return true; } });
  watch(nums,count,{threshold:.6});

  /* 3. 후기 특징 막대 : 0에서 실제 비율까지 */
  var bars=$$('.rstat__tags');
  bars.forEach(function(b){b.classList.add('mo-bars')});
  watch(bars,function(b){ b.classList.add('in'); },{threshold:.3});

  /* 4. 구조도 : 바깥 벽 → 구역(번호 순) → 번호 */
  var fps=$$('.fp');
  fps.forEach(function(fp){
    [].forEach.call(fp.querySelectorAll('.fp__room,.fp__lab'),function(z){ z.style.setProperty('--z',+z.getAttribute('data-z')||1); });
    var o=fp.querySelector('.fp__outer');
    if(o&&o.getTotalLength){ try{ var L=o.getTotalLength(); o.style.strokeDasharray=L; o.style.strokeDashoffset=L; }catch(e){} }
    fp.classList.add('mo-pre');
  });
  watch(fps,function(fp,go){
    var o=fp.querySelector('.fp__outer');
    if(!go){ fp.classList.remove('mo-pre'); if(o){o.style.strokeDasharray='';o.style.strokeDashoffset='';} return; }
    fp.classList.add('mo-in');
    fp.getBoundingClientRect();                       /* 시작 상태를 확정한 뒤 */
    requestAnimationFrame(function(){
      fp.classList.remove('mo-pre');
      if(o) o.style.strokeDashoffset='0';
    });
    setTimeout(function(){
      if(o){o.style.strokeDasharray='';o.style.strokeDashoffset='';}
      fp.classList.add('mo-ping');                     /* 선택된 구역 번호를 두 번 톡톡 — 눌러 볼 수 있다는 신호 */
      setTimeout(function(){fp.classList.remove('mo-ping')},1500);
    },1800);
  },{threshold:.3});
})();
