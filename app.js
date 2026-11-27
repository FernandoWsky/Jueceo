firebase.initializeApp(firebaseConfig);
const auth=firebase.auth(),db=firebase.firestore();
db.enablePersistence({synchronizeTabs:true}).catch(()=>{});
const $=s=>document.querySelector(s),app=$('#app');
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt=s=>{s=Math.max(0,Math.round(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
const fmtD=s=>Math.floor(s/60)+':'+(s%60).toFixed(1).padStart(4,'0');
let user=null,unsub=[];
const isAdmin=()=>user&&user.email===ADMIN_EMAIL;
const net=()=>document.body.classList.toggle('off',!navigator.onLine);
addEventListener('online',net);addEventListener('offline',net);net();

const TN={cap:'Time Cap',amrap:'AMRAP',libre:'Sin tiempo'};
const bl=p=>p.bloques||[{tipo:'cap',cap:p.cap,rutina:p.rutina}];
const TT=b=>b.rutina.reduce((s,e)=>s+(e.reps||1),0);
const ptsR=(r,p)=>r.pts??Math.round(r.reps/(r.total||TT(bl(p)[r.bloque||0]))*10000)/100;
const modo=p=>p.pun||'reps',uni=p=>modo(p)==='pct'?'pts':'reps';
const val=(r,p)=>modo(p)==='pct'?ptsR(r,p):Math.round((r.reps||0)*100)/100;
const fmtS=s=>s>=60&&s%60===0?s/60+'min':s+'s';
const fmtMs=ms=>Math.floor(ms/60000)+':'+String(Math.floor(ms%60000/1000)).padStart(2,'0')+'.'+String(Math.floor(ms%1000)).padStart(3,'0');
const fr=x=>Math.round(x*10)/10;
const U={s:1,sg:1,seg:1,segs:1,segundos:1,min:60,mins:60,minutos:60,m:60};
const pl=l=>{const m=l.trim().match(/^(.+?)\s+(\d+(?:[.,]\d+)?)\s*([a-zA-Z]+)?$/);if(!m)return null;const n=parseFloat(m[2].replace(',','.')),u=(m[3]||'').toLowerCase();if(u&&!U[u])return null;return u?{nombre:m[1].trim(),seg:n*U[u]}:{nombre:m[1].trim(),reps:n};};
const pr=l=>{const [a,b]=l.split(/[\/|]/),e=pl(a);if(!e)return null;if(b){const c=pl(b);if(!c)return null;e.castigo=c;}return e;};
const ser=e=>e.nombre+' '+(e.reps||fmtS(e.seg))+(e.castigo?' / '+e.castigo.nombre+' '+(e.castigo.reps||fmtS(e.castigo.seg)):'');
const foto=f=>new Promise((ok,no)=>{const i=new Image();i.onload=()=>{const c=document.createElement('canvas'),s=Math.min(i.width,i.height),z=200;c.width=c.height=z;c.getContext('2d').drawImage(i,(i.width-s)/2,(i.height-s)/2,s,s,0,0,z,z);URL.revokeObjectURL(i.src);ok(c.toDataURL('image/jpeg',.7));};i.onerror=()=>no(new Error('imagen'));i.src=URL.createObjectURL(f);});
const av=(x,c)=>x?`<img class="av ${c||''}" src="${x}" alt="">`:'';
let pref={v:1,s:0,c:0};try{pref={...pref,...JSON.parse(localStorage.getItem('jc')||'{}')};}catch(e){}
const aplicaPref=()=>{try{localStorage.setItem('jc',JSON.stringify(pref));}catch(e){}document.body.classList.toggle('calm',!!pref.c);};
document.body.classList.toggle('calm',!!pref.c);
let ac;const beep=(f,d)=>{if(!pref.s)return;try{const A=window.AudioContext||window.webkitAudioContext;ac=ac||new A();ac.resume&&ac.resume();const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=f;g.gain.value=.07;o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+d);}catch(e){}};
const vib=p=>{if(pref.v&&navigator.vibrate)navigator.vibrate(p);};
const fpHTML=()=>`<div class="fp"><img class="av lg" alt="" hidden><label class="file"><span>Elegir foto</span><input type="file" accept="image/*"></label><button type="button" class="sec qf" hidden>Quitar foto</button></div>`;
const fpSet=(c,v)=>{c.dataset.v=v||'';const i=c.querySelector('img'),l=c.querySelector('label'),b=c.querySelector('.qf');i.hidden=!v;if(v)i.src=v;l.classList.toggle('ok',!!v);l.querySelector('span').textContent=v?'Foto lista · tocar para cambiar':'Elegir foto';b.hidden=!v;if(!v)c.querySelector('input').value='';};
const IC={trophy:'<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
timer:'<path d="M10 2h4M12 14l3-3"/><circle cx="12" cy="14" r="8"/>',
user:'<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
sliders:'<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
out:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
in:'<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/>',
undo:'<path d="M3 7v6h6M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>',
skip:'<path d="M5 4l10 8-10 8V4zM19 5v14"/>',
stop:'<rect x="5" y="5" width="14" height="14" rx="2"/>',
ban:'<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>',
volume:'<path d="M11 5L6 9H2v6h4l5 4V5zM15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14"/>',
phone:'<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M3 8v8M21 8v8"/>',
plus:'<path d="M12 5v14M5 12h14"/>',
chev:'<path d="M9 18l6-6-6-6"/>',
alert:'<path d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>'};
const ic=(n,c)=>`<svg class="ic ${c||''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]}</svg>`;
const bloqueSum=(r,p)=>{
  const k=r.bloque||0,b=bl(p)[k];if(!b)return'';
  const T_=TT(b),w=r.reps||0,amr=b.tipo==='amrap',vc=Math.floor(w/T_+1e-9),vi=Math.round((w/T_-vc)*100);
  let acc=0,prev=0;
  const filas=amr?'':b.rutina.map((e,i)=>{const u=e.reps||1,h=Math.max(0,Math.min(u,w-acc));acc+=u;const t=(r.splits||[])[i];const dt=t!=null?fmtD(t-prev):'—';if(t!=null)prev=t;
    return `<tr><td>${esc(e.nombre)}</td><td>${e.seg?fmtD(h*e.seg)+' / '+fmtS(e.seg):fr(h)+'/'+e.reps}</td><td>${dt}</td></tr>`;}).join('');
  return `<section class="bk"><div class="bh"><span class="tag">Bloque ${k+1} · ${TN[b.tipo]}${b.cap?' · '+fmt(b.cap):''}</span><b class="sc">${val(r,p)}<small>${uni(p)}</small></b></div>
  <p class="rt">${b.rutina.map(e=>esc(ser(e))).join(' · ')}</p>
  <div class="kp"><div><b>${amr?vc+' + '+vi+'%':fr(w)+'/'+T_}</b><span>${amr?'vueltas':'repeticiones'}</span></div><div><b>${r.nulas||0}</b><span>nulas</span></div><div><b>${fmtD(r.tiempo||0)}</b><span>tiempo</span></div><div><b>${r.rompe||0}</b><span>rupturas</span></div></div>
  ${amr?'':`<div class="tw"><table><tr><th>Ejercicio</th><th>Logrado</th><th>Tiempo</th></tr>${filas}</table></div>`}
  <p class="sub">${r.completo?'Rutina completa':(r.done?'Time cap / terminada':'En curso')} · Juez: ${esc(r.juez||'—')}</p></section>`;
};
const nav=()=>{const h=location.hash||'#/',L=[['#/publico','trophy','Ranking'],['#/atletas','users','Atletas']];
  if(user){L.push(['#/juez','timer','Juzgar'],['#/perfil','user','Perfil']);if(isAdmin())L.push(['#/admin','sliders','Admin']);L.push(['#','out','Salir','out']);}else L.push(['#/login','in','Entrar']);
  return `<header><a href="#/" class="br">Jueceo</a><nav>${L.map(x=>`<a href="${x[0]}"${x[3]?' id="out"':''}${x[0]===h||(h==='#/'&&!user&&x[0]==='#/publico')?' class="on"':''}>${ic(x[1])}<span>${x[2]}</span></a>`).join('')}</nav></header>`;};
const li=(t,s,c,id,ed)=>`<li><span>${esc(t)}<small>${esc(s)}</small></span><span>${ed?`<button class="del" style="color:var(--ink)" data-ed="${id}">Editar</button>`:''}<button class="del" data-c="${c}" data-id="${id}">Borrar</button></span></li>`;
document.addEventListener('change',e=>{const t=e.target;if(t.type!=='file')return;const c=t.closest('.fp'),f=t.files[0];if(!c||!f)return;foto(f).then(v=>fpSet(c,v)).catch(()=>alert('No pude leer la foto'));});
document.addEventListener('click',e=>{
  if(e.target.closest('#out')){e.preventDefault();auth.signOut();}
  const qf=e.target.closest('.qf');if(qf){fpSet(qf.closest('.fp'),'');return;}
  const d=e.target.dataset;
  if(d&&d.c&&confirm('¿Borrar?'))db.collection(d.c).doc(d.id).delete();
});

function datos(cb){
  const D={p:[],a:[],r:[],j:[],ok:{}};
  [['pruebas','p'],['atletas','a'],['resultados','r'],['jueces','j']].forEach(([c,k])=>unsub.push(db.collection(c).onSnapshot(s=>{
    D[k]=s.docs.map(d=>({id:d.id,...d.data()}));D.ok[k]=1;
    D.p.sort((x,y)=>x.creado-y.creado);D.a.sort((x,y)=>x.nombre.localeCompare(y.nombre));cb(D);
  })));
  return D;
}
const rank=rs=>rs.slice().sort((a,b)=>b.reps-a.reps||(a.tiempo??1e9)-(b.tiempo??1e9));

auth.onAuthStateChanged(u=>{user=u;route();});
addEventListener('hashchange',route);
function route(){
  unsub.forEach(f=>f());unsub=[];
  const h=location.hash||'#/';
  if(h==='#/publico'||(!user&&h==='#/'))return publico();
  if(h==='#/atletas')return atletas();
  if(h.startsWith('#/atleta/'))return atleta(h.slice(9));
  if(!user)return login();
  if(h==='#/admin'&&isAdmin())return admin();
  if(h==='#/perfil')return perfil();
  if(h==='#/juez')return juez();
  location.hash=isAdmin()?'#/admin':'#/juez';
}

function login(){
  app.innerHTML=nav()+`<div class="wrap"><h2>Entrar como juez</h2><input id="em" type="email" placeholder="Correo" autocomplete="username"><input id="pw" type="password" placeholder="Contraseña" autocomplete="current-password"><button id="go">Entrar</button><p class="err" id="er"></p></div>`;
  $('#go').onclick=()=>auth.signInWithEmailAndPassword($('#em').value.trim(),$('#pw').value).catch(()=>$('#er').textContent='Correo o contraseña incorrectos.');
}

function admin(){
  let ed=null,eda=null,edj=null,DD=null,rc=null;
  const sec=(id,t,b)=>`<details class="ad" id="${id}"><summary><h2>${t}</h2></summary><div class="ab">${b}</div></details>`;
  app.innerHTML=nav()+`<div class="wrap">`
   +sec('sa','Atletas',`<form id="fa"><div class="row"><input name="n" placeholder="Nombre" required><select name="c" id="ac"></select></div><input name="c2" placeholder="Nombre de la nueva categoría" hidden><div class="row"><input name="l" placeholder="De dónde es"><input name="g" placeholder="Club / gym"><input name="e" type="number" min="1" placeholder="Edad"></div><textarea name="d" rows="2" placeholder="Descripción (opcional)"></textarea>${fpHTML()}<button id="gat">Guardar atleta</button></form><ul id="la"></ul>`)
   +sec('sp','Pruebas',`<form id="fp"><input name="n" placeholder="Nombre de la prueba" required><select name="pun"><option value="reps">Puntuación por repeticiones (1 punto por repetición)</option><option value="pct">Puntuación por porcentaje (100 = rutina completa)</option></select><div id="bl"></div><button type="button" id="ab" class="sec">${ic('plus')}Agregar bloque</button><button id="gpr">Guardar prueba</button></form><ul id="lp"></ul>`)
   +sec('sr','Resultados',`<div class="chips" id="rch"></div><ul id="lr"></ul>`)
   +sec('sj','Jueces',`<form id="fj" hidden><input name="n" placeholder="Nombre del juez" required>${fpHTML()}<button>Guardar juez</button></form><ul id="lj"></ul><p class="sub">Borrar quita el perfil (nombre y foto). Para quitarle el acceso, elimina su usuario en Firebase, sección Authentication.</p>`)+`</div>`;
  const addB=b=>{const d=document.createElement('div');d.className='blq';
    d.innerHTML=`<div class="row"><select class="tp"><option value="cap">Time Cap</option><option value="amrap">AMRAP</option><option value="libre">Sin tiempo</option></select><input class="cp" type="number" min="0.5" step="0.5" placeholder="Minutos"></div><input class="mv" type="number" min="1" placeholder="Opcional (AMRAP): segundos sin hacer una rep para pasar al siguiente ejercicio"><textarea rows="5" placeholder="Un ejercicio por línea:&#10;Sentadillas 20&#10;Handstand 30s / Burpees 5"></textarea><button type="button" class="del">Quitar bloque</button>`;
    const tp=d.querySelector('.tp'),cp=d.querySelector('.cp'),mv=d.querySelector('.mv'),sh=()=>{cp.hidden=tp.value==='libre';mv.hidden=tp.value!=='amrap';};
    tp.onchange=sh;d.querySelector('.del').onclick=()=>{if($('#bl').children.length>1)d.remove();};
    if(b){tp.value=b.tipo;cp.value=b.cap?b.cap/60:'';mv.value=b.mueve||'';d.querySelector('textarea').value=b.rutina.map(ser).join('\n');}
    sh();$('#bl').appendChild(d);};
  const rsA=()=>{eda=null;const f=$('#fa');f.reset();f.c2.hidden=true;fpSet($('#fa .fp'),'');$('#gat').textContent='Guardar atleta';};
  const rsP=()=>{ed=null;const f=$('#fp');f.n.value='';f.pun.value='reps';$('#bl').innerHTML='';addB();$('#gpr').textContent='Guardar prueba';};
  const rsJ=()=>{edj=null;$('#fj').hidden=true;};
  rsP();
  document.querySelectorAll('.ad').forEach(d=>d.addEventListener('toggle',()=>{if(!d.open){const f={sa:rsA,sp:rsP,sj:rsJ}[d.id];if(f)f();}}));
  const drawR=D=>{
    const rcs=[...new Set(D.a.map(a=>a.cat||'Sin categoría'))].sort();
    if(rc===null&&D.ok.a)rc=rcs[0]||'';else if(rc&&!rcs.includes(rc))rc='';
    $('#rch').innerHTML=`<button class="chip${!rc?' on':''}" data-rc="">Todas</button>`+rcs.map(c=>`<button class="chip${c===rc?' on':''}" data-rc="${esc(c)}">${esc(c)}</button>`).join('');
    const cc=r=>(D.a.find(a=>a.id===r.atletaId)||{}).cat||'Sin categoría';
    $('#lr').innerHTML=D.r.filter(r=>!rc||cc(r)===rc).map(r=>{const p=D.p.find(x=>x.id===r.pruebaId);return li(r.nombre+' · '+(p?p.nombre:'?')+' (bloque '+((r.bloque||0)+1)+')',(p?val(r,p)+' '+uni(p):'')+' · '+(r.juez||'sin juez')+(r.done?'':' · en curso'),'resultados',r.id);}).join('')||'<li>Sin resultados</li>';
  };
  DD=datos(D=>{
    const cs=[...new Set(D.a.map(a=>a.cat).filter(Boolean))].sort(),np=D.p.map(p=>p.nombre).filter(n=>!cs.includes(n)),ac=$('#ac'),cur=ac.value;
    ac.innerHTML=`<option value="">Sin categoría</option>${cs.length?`<optgroup label="Categorías existentes">${cs.map(c=>`<option>${esc(c)}</option>`).join('')}</optgroup>`:''}${np.length?`<optgroup label="Nombres de pruebas">${np.map(c=>`<option>${esc(c)}</option>`).join('')}</optgroup>`:''}<option value="__n">+ Nueva categoría…</option>`;
    if([...ac.options].some(o=>o.value===cur))ac.value=cur;
    $('#la').innerHTML=D.a.map(a=>li(a.nombre,[a.cat,a.club,a.lugar].filter(Boolean).join(' · ')||'Sin datos','atletas',a.id,1)).join('')||'<li>Aún no hay atletas</li>';
    $('#lp').innerHTML=D.p.map(p=>li(p.nombre,(p.pun==='pct'?'Porcentaje · ':'Repeticiones · ')+bl(p).map(b=>TN[b.tipo]+(b.cap?' '+fmt(b.cap):'')+': '+b.rutina.map(e=>e.nombre+' '+(e.reps||fmtS(e.seg))).join(', ')).join(' | '),'pruebas',p.id,1)).join('')||'<li>Aún no hay pruebas</li>';
    $('#lj').innerHTML=D.j.map(j=>`<li><span class="nm">${av(j.foto)}<b>${esc(j.nombre)}</b></span><span><button class="del" data-edj="${j.id}">Editar</button><button class="del" data-c="jueces" data-id="${j.id}">Borrar</button></span></li>`).join('')||'<li>Aún no hay perfiles de jueces</li>';
    drawR(D);
  });
  $('#ac').onchange=()=>{$('#fa').c2.hidden=$('#ac').value!=='__n';};
  $('#ab').onclick=()=>addB();
  $('#rch').onclick=e=>{const b=e.target.closest('.chip');if(!b)return;rc=b.dataset.rc;drawR(DD);};
  $('#la').onclick=e=>{const id=e.target.dataset.ed;if(!id)return;const a=DD.a.find(x=>x.id===id),f=$('#fa');eda=id;f.n.value=a.nombre;$('#ac').value=a.cat||'';f.c2.hidden=true;f.l.value=a.lugar||'';f.g.value=a.club||'';f.e.value=a.edad||'';f.d.value=a.desc||'';fpSet($('#fa .fp'),a.foto||'');$('#gat').textContent='Guardar cambios de '+a.nombre;scrollTo(0,$('#sa').offsetTop);};
  $('#lp').onclick=e=>{const id=e.target.dataset.ed;if(!id)return;const p=DD.p.find(x=>x.id===id),f=$('#fp');ed=id;f.n.value=p.nombre;f.pun.value=p.pun||'reps';$('#bl').innerHTML='';bl(p).forEach(addB);$('#gpr').textContent='Guardar cambios de '+p.nombre;scrollTo(0,$('#sp').offsetTop);};
  $('#lj').onclick=e=>{const id=e.target.dataset.edj;if(!id)return;const j=DD.j.find(x=>x.id===id),f=$('#fj');edj=id;f.hidden=false;f.n.value=j.nombre;fpSet($('#fj .fp'),j.foto||'');};
  $('#fa').onsubmit=e=>{e.preventDefault();const f=e.target,c=f.c.value==='__n'?f.c2.value.trim():f.c.value;
    const x={nombre:f.n.value.trim(),cat:c,lugar:f.l.value.trim(),club:f.g.value.trim(),edad:f.e.value?+f.e.value:null,desc:f.d.value.trim(),foto:$('#fa .fp').dataset.v||''};
    if(eda)db.collection('atletas').doc(eda).set(x,{merge:true});else db.collection('atletas').add(x);rsA();};
  $('#fj').onsubmit=e=>{e.preventDefault();db.collection('jueces').doc(edj).set({nombre:e.target.n.value.trim(),foto:$('#fj .fp').dataset.v||''},{merge:true});rsJ();};
  $('#fp').onsubmit=e=>{e.preventDefault();const bs=[];
    for(const d of $('#bl').children){const tipo=d.querySelector('.tp').value,cap=Math.round((+d.querySelector('.cp').value||0)*60);
      const ls=d.querySelector('textarea').value.split('\n').map(x=>x.trim()).filter(Boolean),rutina=ls.map(pr);
      if(rutina.includes(null))return alert('No entendí esta línea: '+ls[rutina.indexOf(null)]);
      if(!rutina.length||(tipo!=='libre'&&!cap))return alert('Cada bloque necesita ejercicios y, si es Time Cap o AMRAP, los minutos.');
      bs.push({tipo,cap:tipo==='libre'?0:cap,rutina,mueve:tipo==='amrap'?(+d.querySelector('.mv').value||0):0});}
    const dato={nombre:e.target.n.value.trim(),pun:e.target.pun.value,bloques:bs};
    if(ed)db.collection('pruebas').doc(ed).set(dato,{merge:true});else db.collection('pruebas').add({...dato,creado:Date.now()});
    rsP();};
}
function publico(){
  let sel='total',cat=null,sig='',DD=null,an=1;
  app.innerHTML=nav()+`<div class="wrap"><div id="f"></div><div id="t"></div></div>`;
  const cats=D=>[...new Set(D.a.map(a=>a.cat||'Sin categoría'))].sort();
  const pinta=D=>{
    const A=id=>D.a.find(a=>a.id===id)||{},cc=id=>A(id).cat||'Sin categoría';
    const ps=sel==='total'?D.p:D.p.filter(p=>p.id===sel),m={};
    ps.forEach((p,pi)=>D.r.filter(r=>r.pruebaId===p.id&&(!cat||cc(r.atletaId)===cat)).forEach(r=>{
      const o=m[r.atletaId]=m[r.atletaId]||{id:r.atletaId,n:A(r.atletaId).nombre||r.nombre,s:0,t:0,nu:0,k:0,d:[],pt:[]};
      const v=val(r,p);o.s+=v;o.t+=r.tiempo||0;o.nu+=r.nulas||0;if(r.done)o.k++;if(r.det)o.d.push(r.det);o.pt.push([pi*100+(r.bloque||0),v]);}));
    const nb=ps.reduce((s,p)=>s+bl(p).length,0),us=[...new Set(ps.map(uni))],u=us.length===1?us[0]:'pts';
    const rows=Object.values(m).map(o=>({...o,s:Math.round(o.s*100)/100,t:Math.round(o.t*10)/10})).sort((a,b)=>b.s-a.s||a.t-b.t);
    const pos=[];rows.forEach((o,i)=>pos.push(!i||o.s!==rows[i-1].s||o.t!==rows[i-1].t?i+1:pos[i-1]));
    const pod=rows.length?`<div class="pod">${[1,0,2].filter(i=>rows[i]).map(i=>{const o=rows[i];return `<a class="pd p${Math.min(pos[i],3)}" href="#/atleta/${o.id}"><span class="pos">${pos[i]}</span>${av(A(o.id).foto)}<div class="n">${esc(o.n)}</div><div class="s">${o.s}</div><div class="m">${u}</div></a>`;}).join('')}</div>`:'<p class="sub">Aún no hay resultados en esta categoría.</p>';
    const h=`<tr><th>#</th><th>Atleta</th><th>Puntaje (${u})</th><th>Bloques</th><th>Tiempo</th><th>Nulas</th></tr>`+rows.map((o,i)=>{
      const par=o.pt.sort((x,y)=>x[0]-y[0]).map(x=>Math.round(x[1]*100)/100);
      return `<tr style="animation-delay:${i*35}ms"><td><span class="rk">${pos[i]}</span></td><td>${av(A(o.id).foto)}<a href="#/atleta/${o.id}">${esc(o.n)}</a><small class="d">${esc(o.d.join(' · '))}</small></td><td><b>${o.s}</b>${par.length>1?`<small class="d">${par.join(' + ')}</small>`:''}</td><td>${o.k}/${nb}</td><td>${fmtD(o.t)}</td><td>${o.nu}</td></tr>`;}).join('');
    $('#t').innerHTML=pod+(rows.length?`<div class="tw"><table class="${an?'an':''}">${h}</table></div>`:'');an=0;
  };
  datos(D=>{DD=D;const cs=cats(D),s=JSON.stringify([D.p.map(p=>p.id+p.nombre),cs]);
    if(s!==sig){sig=s;if(cat===null||!cs.includes(cat))cat=cs[0]||'';
      $('#f').innerHTML=`<div class="chips">${cs.map(c=>`<button class="chip${c===cat?' on':''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('')}</div><select id="sp"><option value="total">Total (suma de todas las pruebas)</option>${D.p.map(p=>`<option value="${p.id}">${esc(p.nombre)}</option>`).join('')}</select>`;
      $('#sp').value=sel;$('#sp').onchange=e=>{sel=e.target.value;an=1;pinta(DD);};}
    pinta(D);});
  $('#f').onclick=e=>{const b=e.target.closest('.chip');if(!b)return;cat=b.dataset.cat;an=1;document.querySelectorAll('.chip').forEach(x=>x.classList.toggle('on',x===b));pinta(DD);};
}
function atletas(){
  app.innerHTML=nav()+`<div class="wrap"><h2>Atletas</h2><div id="la"></div><h2>Jueces</h2><ul id="lj"></ul></div>`;
  datos(D=>{
    const cs=[...new Set(D.a.map(a=>a.cat||'Sin categoría'))].sort();
    $('#la').innerHTML=cs.map(c=>`<h3 class="gt">${esc(c)}</h3><ul>${D.a.filter(a=>(a.cat||'Sin categoría')===c).map(a=>`<li class="al"><a href="#/atleta/${a.id}"><span class="nm">${av(a.foto)}<span><b>${esc(a.nombre)}</b><small>${esc([a.club,a.lugar,a.edad?a.edad+' años':''].filter(Boolean).join(' · '))}</small></span></span>${ic('chev')}</a></li>`).join('')}</ul>`).join('')||'<p class="sub">Aún no hay atletas.</p>';
    $('#lj').innerHTML=D.j.map(j=>`<li><span class="nm">${av(j.foto)}<span><b>${esc(j.nombre)}</b><small>${D.r.filter(r=>r.juezUid===j.id).length} conteos</small></span></span></li>`).join('')||'<li>Aún no hay perfiles de jueces</li>';
  });
}
function juez(){
  app.innerHTML=nav()+`<div class="wrap" id="j"></div>`;
  let S=null,iv=null,D;
  unsub.push(()=>clearInterval(iv));
  const nb=()=>bl(S.p).length,T=()=>TT(S.b),it=()=>{const e=S.b.rutina[S.ej];return S.fase?e.castigo:e;};
  const live=()=>S.t1?S.acc+Date.now()-S.t1:S.acc;
  const cur=()=>{if(S.fase)return 0;const e=S.b.rutina[S.ej];return e.seg?Math.min(1,live()/(e.seg*1000)):S.rep;};
  const W=()=>S.acum+S.base+cur(),pts=()=>Math.round(W()/T()*10000)/100;
  const el=()=>S.done?S.tiempo:(Date.now()-S.t0)/1000;
  const rid=()=>S.p.id+'_'+S.a.id+(S.k?'_'+S.k:'');
  const guarda=()=>db.collection('resultados').doc(rid()).set({pruebaId:S.p.id,atletaId:S.a.id,bloque:S.k,tipo:S.b.tipo,nombre:S.a.nombre,cat:S.a.cat||'',reps:Math.round(W()*100)/100,pts:pts(),nulas:S.nulas,vueltas:S.vueltas,acum:S.acum,det:S.b.tipo==='amrap'?Math.floor(W()/T()+1e-9)+' vueltas + '+Math.round((W()/T()-Math.floor(W()/T()+1e-9))*100)+'%':'',ej:S.ej,rep:S.rep,acc:S.acc,fase:S.fase,hold:S.hold,base:S.base,t0:S.t0,done:S.done,completo:S.completo,tiempo:S.tiempo,splits:S.splits,rompe:S.rompe,juez:S.juez||'',juezUid:user.uid,total:T(),upd:Date.now(),fin:S.fin||null}).catch(e=>alert('No se pudo guardar ('+e.code+'). Solo el juez que inició este conteo puede editarlo.'));
  const snap=()=>({ej:S.ej,rep:S.rep,acc:S.acc,fase:S.fase,hold:S.hold,base:S.base,vueltas:S.vueltas,nulas:S.nulas,rompe:S.rompe,splits:S.splits.slice()});
  const opts=()=>{
    if(S)return;const sp=$('#sp'),sa=$('#sa');if(!sp)return;const a=sp.value,b=sa.value;
    sp.innerHTML=D.p.map(p=>`<option value="${p.id}">${esc(p.nombre)}</option>`).join('');
    sa.innerHTML=D.a.map(x=>`<option value="${x.id}">${esc(x.nombre)} · ${esc(x.cat||'Sin categoría')}</option>`).join('');
    if([...sp.options].some(o=>o.value===a))sp.value=a;if([...sa.options].some(o=>o.value===b))sa.value=b;
    const pb=$('#pre');if(pb){const ok=D.ok.p&&D.ok.a&&D.ok.r;pb.disabled=!ok;pb.textContent=ok?'Preparar':'Cargando datos…';}
  };
  const tgl=()=>`<div class="tg"><button class="sec${pref.v?' on':''}" data-p="v">${ic('phone')}Vibración</button><button class="sec${pref.s?' on':''}" data-p="s">${ic('volume')}Sonido</button><button class="sec${pref.c?' on':''}" data-p="c">Menos animaciones</button></div>${navigator.vibrate?'':'<p class="sub">Este dispositivo no permite vibración.</p>'}`;
  const setup=()=>{$('#j').innerHTML=`<h2>Nuevo conteo</h2>${user.displayName?`<p class="sub">Juez: ${esc(user.displayName)}</p>`:'<input id="jn" placeholder="Tu nombre (juez)">'}<select id="sp"></select><select id="sa"></select><button id="pre">Preparar</button><h3 class="gt">Ajustes</h3>${tgl()}`;opts();$('#pre').onclick=prep;
    document.querySelectorAll('[data-p]').forEach(b=>{b.onclick=()=>{const k=b.dataset.p;pref[k]=pref[k]?0:1;aplicaPref();b.classList.toggle('on',!!pref[k]);if(k==='v'&&pref.v)vib(40);if(k==='s')beep(880,.08);};});};
  const load=(p,a,k,jn)=>{
    const r=D.r.find(x=>x.id===p.id+'_'+a.id+(k?'_'+k:''));
    S={p,a,k,b:bl(p)[k],ej:0,rep:0,acc:0,fase:0,hold:0,base:0,vueltas:0,acum:0,last:Date.now(),aviso:0,nulas:0,rompe:0,t0:null,t1:null,done:false,completo:false,tiempo:null,splits:[],hist:[],juez:jn,juezUid:user.uid,fin:null};
    if(r)Object.assign(S,{ej:r.ej,rep:r.rep,acc:r.acc||0,fase:r.fase||0,hold:r.hold||0,base:r.base||0,vueltas:r.vueltas||0,acum:r.acum??(r.vueltas||0)*TT(S.b),nulas:r.nulas||0,rompe:r.rompe||0,t0:r.t0,done:r.done,completo:r.completo,tiempo:r.tiempo,splits:r.splits||[],juez:r.juez||jn,juezUid:r.juezUid||user.uid,fin:r.fin||null});
    if(r&&!r.done&&r.t0&&Date.now()-(r.upd||0)>10000){
      if(confirm('Este bloque quedó en curso ('+fr(r.reps||0)+' reps).\nAceptar = continuar donde quedó (no cuenta el tiempo que estuvo fuera).\nCancelar = empezar este bloque de cero.'))S.t0+=Date.now()-r.upd;
      else Object.assign(S,{ej:0,rep:0,acc:0,fase:0,hold:0,base:0,vueltas:0,acum:0,nulas:0,rompe:0,t0:null,t1:null,done:false,completo:false,tiempo:null,splits:[],hist:[]});
    }
    S.last=Date.now();
    pinta();if(S.t0&&!S.done)corre();
  };
  const prep=()=>{
    const p=D.p.find(x=>x.id===$('#sp').value),a=D.a.find(x=>x.id===$('#sa').value);if(!p||!a)return;
    let jn=user.displayName;if(!jn){jn=($('#jn')?.value||'').trim();if(!jn)return alert('Escribe tu nombre de juez.');user.updateProfile({displayName:jn});db.collection('jueces').doc(user.uid).set({nombre:jn},{merge:true});}
    const n=bl(p).length;let k=0;
    while(k<n&&D.r.find(x=>x.id===p.id+'_'+a.id+(k?'_'+k:'')&&x.done))k++;
    load(p,a,Math.min(k,n-1),jn);
  };
  const corre=()=>{clearInterval(iv);iv=setInterval(tick,50);navigator.wakeLock?.request('screen')?.catch(()=>{});};
  const fin=(c,t)=>{
    if(S.t1){S.acc+=Date.now()-S.t1;S.t1=null;}
    if(S.fase){const e=S.b.rutina[S.ej];S.base+=e.seg?S.hold/(e.seg*1000):S.hold;S.fase=0;S.acc=0;S.rep=0;}
    clearInterval(iv);beep(660,.25);vib([60,40,60]);S.done=true;S.completo=c;S.tiempo=Math.round(t*10)/10;S.fin=Date.now();guarda();pinta();
  };
  const back=()=>{const m=S.b.rutina[S.ej];S.fase=0;S.rep=m.seg?0:S.hold;S.acc=m.seg?S.hold:0;};
  const adv=w=>{
    S.base+=w;if(S.b.tipo!=='amrap')S.splits.push(Math.round(el()*10)/10);
    S.rep=0;S.acc=0;S.hold=0;S.fase=0;S.last=Date.now();S.ej++;
    if(S.ej>=S.b.rutina.length){if(S.b.tipo==='amrap'){S.acum+=S.base;S.vueltas++;S.ej=0;S.base=0;}else{S.ej--;return fin(true,el());}}
    guarda();pinta();
  };
  const isoStop=auto=>{
    const e=it(),m=e.seg*1000;S.hist.push(snap());
    S.acc=auto?m:S.acc+Date.now()-S.t1;S.t1=null;
    if(S.acc>=m){if(S.fase){back();guarda();pinta();}else adv(1);return;}
    if(S.fase){S.acc=0;guarda();pinta();return;}
    S.rompe++;
    if(e.castigo){S.hold=S.acc;S.fase=1;S.rep=0;S.acc=0;guarda();pinta();}else{guarda();pinta();}
  };
  const toque=()=>{
    if(S.done)return;vib(25);beep(880,.04);S.last=Date.now();S.aviso=0;S.hist.push(snap());S.rep++;const e=it();
    if(S.rep>=e.reps){if(S.fase){back();guarda();pinta();}else adv(e.reps);}
    else{guarda();pinta();}
  };
  const tick=()=>{
    if(!S||!S.t0||S.done)return;const t=el(),b=S.b;
    if(b.tipo!=='libre'&&t>=b.cap)return fin(false,b.cap);
    if(b.tipo==='amrap'&&b.mueve&&!S.fase&&!S.t1){const e0=b.rutina[S.ej];if(e0&&e0.reps){const left=b.mueve-(Date.now()-S.last)/1000,z=$('#st');if(z)z.textContent='Sin repetir: '+Math.max(0,Math.ceil(left))+' s';if(left<=0){S.hist.push(snap());S.aviso=1;vib([80,40,80]);beep(300,.2);return adv(S.rep);}}}
    const x=$('#tm');if(x)x.textContent=b.tipo==='libre'?fmt(t):fmt(Math.ceil(b.cap-t));
    const e=it();
    if(e&&e.seg){
      if(S.t1&&live()>=e.seg*1000)return isoStop(true);
      const bi=$('#bar i');if(bi)bi.style.width=Math.min(100,live()/(e.seg*10))+'%';const o=$('#isot');if(o){o.textContent=fmtMs(S.t1||S.acc?live():e.seg*1000);$('#isol').textContent=S.t1?'Toca para cortar':S.acc?'Pausado · toca para reanudar':'Meta · toca para iniciar';$('#iso').classList.toggle('run',!!S.t1);$('#iso').classList.toggle('pau',!S.t1&&S.acc>0);}
    }
  };
  const resumen=()=>{
    const docs=bl(S.p).map((b,k)=>k===S.k?{bloque:S.k,reps:W(),nulas:S.nulas,tiempo:S.tiempo,splits:S.splits,pts:pts(),rompe:S.rompe,completo:S.completo,done:true,juez:S.juez}:D.r.find(x=>x.id===S.p.id+'_'+S.a.id+(k?'_'+k:''))).filter(x=>x&&x.done);
    const tot=Math.round(docs.reduce((s,r)=>s+val(r,S.p),0)*100)/100;
    return `<div class="hero">${av(S.a.foto,'lg')}<div><h2>${esc(S.a.nombre)}</h2><p>${esc(S.a.cat||'Sin categoría')} · ${esc(S.p.nombre)}</p><p class="sub">Juez: ${av(((D.j||[]).find(x=>x.id===S.juezUid)||{}).foto)}${esc(S.juez||'—')}${S.fin?' · '+new Date(S.fin).toLocaleString('es-MX',{dateStyle:'short',timeStyle:'short'}):''}</p></div></div>
    <div class="kp"><div class="big"><b>${tot}</b><span>${uni(S.p)} en total · ${docs.length}/${nb()} bloques</span></div></div>
    ${docs.map(r=>bloqueSum(r,S.p)).join('')}
    <div class="row"><button id="imp" class="sec">Imprimir / PDF</button>${S.k+1<nb()?'<button id="sig">Siguiente bloque</button>':''}<button id="otro">Otro atleta</button></div>`;
  };
  const pinta=()=>{
    let h=`<div class="jh">${av(S.a.foto)}<div><b>${esc(S.a.nombre)}</b><div class="sub">${esc(S.a.cat||'Sin categoría')} · ${esc(S.p.nombre)}</div></div><span class="tag">B${S.k+1}/${nb()} · ${TN[S.b.tipo]}</span></div>`;
    if(S.done)h=resumen();
    else if(!S.t0)h+=`<ul class="rl">${S.b.rutina.map(e=>`<li><span>${esc(e.nombre)}${e.castigo?`<small>Castigo: ${esc(e.castigo.nombre)} ${e.castigo.reps||fmtS(e.castigo.seg)}</small>`:''}</span><b>${e.reps||fmtS(e.seg)}</b></li>`).join('')}</ul><p class="sub">${TN[S.b.tipo]}${S.b.cap?' · '+fmt(S.b.cap):''}${S.b.mueve?' · pasa de ejercicio si no repite en '+S.b.mueve+' s':''}</p><button id="ini" class="tap go">Iniciar</button>`;
    else{
      const e=it(),prog=e.seg?Math.min(100,live()/(e.seg*10)):Math.min(100,S.rep/e.reps*100);
      h+=`<div class="tags">${S.b.tipo==='amrap'?`<span class="tag">Vuelta ${S.vueltas+1}</span>`:''}${S.fase?'<span class="tag cap">Castigo</span>':''}${S.aviso?'<span class="tag cap">Pasó por tiempo sin repetir</span>':''}</div>
      <div class="top"><div class="ex">${esc(e.nombre)} ${e.reps?'':fmtS(e.seg)}</div><div class="tm" id="tm"></div></div>
      ${S.b.mueve&&!S.fase?'<div id="st" class="sub"></div>':''}
      <div class="bar" id="bar"><i style="width:${prog}%"></i></div><div class="sub r">${fr(W())}/${T()} en total</div>`;
      h+=e.seg?`<button id="iso" class="tap iso"><span id="isot"></span><small id="isol"></small></button>`:`<button id="tap" class="tap">${S.rep}<small>de ${e.reps}</small></button><button id="nu" class="nula">${ic('ban')}Nula<em>${S.nulas}</em></button>`;
      h+=`<div class="row ctl"><button id="un" class="sec">${ic('undo')}Deshacer</button>${!S.fase&&e.reps&&e.castigo?`<button id="ro" class="sec wine">${ic('alert')}Rompió</button>`:''}${S.fase?'':`<button id="sk" class="sec">${ic('skip')}Saltar</button>`}<button id="te" class="sec">${ic('stop')}Terminar</button></div>`;
    }
    $('#j').innerHTML=h;
    const q=(s,f)=>{const x=$(s);if(x)x.onclick=f;};
    const pd=(s,f)=>{const x=$(s);if(x)x.onpointerdown=e=>{e.preventDefault();f();};};
    q('#otro',()=>{S=null;setup();});
    q('#sig',()=>load(S.p,S.a,S.k+1,S.juez));
    q('#imp',()=>print());
    q('#ini',()=>{S.t0=S.last=Date.now();guarda();corre();pinta();});
    pd('#tap',toque);
    pd('#iso',()=>{if(S.t1)isoStop(false);else{S.t1=Date.now();vib(20);pinta();}});
    pd('#nu',()=>{vib(60);beep(200,.12);S.hist.push(snap());S.nulas++;guarda();pinta();});
    q('#ro',()=>{S.hist.push(snap());S.rompe++;S.hold=S.rep;S.fase=1;S.rep=0;S.acc=0;guarda();pinta();});
    q('#sk',()=>{if(!confirm('¿Saltar este ejercicio con lo logrado?'))return;S.hist.push(snap());if(S.t1){S.acc+=Date.now()-S.t1;S.t1=null;}adv(cur());});
    q('#un',()=>{if(S.t1)return;const x=S.hist.pop();if(x){Object.assign(S,x);guarda();pinta();}});
    q('#te',()=>{if(confirm('¿Terminar ahora?'))fin(false,el());});
    tick();
  };
  D=datos(opts);
  setup();
}
function atleta(id){
  app.innerHTML=nav()+`<div class="wrap" id="pf"></div>`;
  datos(D=>{const a=D.a.find(x=>x.id===id);if(!a){$('#pf').innerHTML='<p class="sub">Cargando atleta…</p>';return;}
    const gs=D.p.map(p=>({p,rs:D.r.filter(r=>r.atletaId===id&&r.pruebaId===p.id).sort((x,y)=>(x.bloque||0)-(y.bloque||0))})).filter(g=>g.rs.length);
    $('#pf').innerHTML=`<div class="hero">${av(a.foto,'lg')}<div><h2>${esc(a.nombre)}</h2><div class="tags">${[a.cat,a.club,a.lugar,a.edad?a.edad+' años':''].filter(Boolean).map(x=>`<span class="tag lt">${esc(x)}</span>`).join('')}</div></div></div>${a.desc?`<p class="desc">${esc(a.desc)}</p>`:''}
    <h2>Desempeño</h2>${gs.map(g=>`<h3 class="gt">${esc(g.p.nombre)} · ${Math.round(g.rs.reduce((s,r)=>s+val(r,g.p),0)*100)/100} ${uni(g.p)}</h3>${g.rs.map(r=>bloqueSum(r,g.p)).join('')}`).join('')||'<p class="sub">Aún no tiene resultados.</p>'}`;});
}
function perfil(){
  app.innerHTML=nav()+`<div class="wrap"><h2>Mi perfil de juez</h2><input id="pn" placeholder="Tu nombre" value="${esc(user.displayName||'')}">${fpHTML()}<button id="gp">Guardar</button></div>`;
  let ini=0;
  datos(D=>{if(!ini&&D.ok.j){ini=1;fpSet($('.fp'),(D.j.find(x=>x.id===user.uid)||{}).foto||'');}});
  $('#gp').onclick=()=>{const n=$('#pn').value.trim();if(!n)return alert('Escribe tu nombre.');
    user.updateProfile({displayName:n});db.collection('jueces').doc(user.uid).set({nombre:n,foto:$('.fp').dataset.v||''});alert('Guardado');};
}
