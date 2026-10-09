const $=id=>document.getElementById(id);
const key=trackerConfig.key;
const SUPABASE_URL='https://rcefxsqrstamkfbzelyx.supabase.co';
const SUPABASE_KEY='sb_publishable_J1t5Mv-ouW4wHDD4Q9v2lw_scSVv8Sr';
const SLUG=trackerConfig.slug;

// points[i] = number of points currently invested in talent i.
let state={level:trackerConfig.defaultLevel,points:Array(steps.length).fill(0)};

function maxPoints(i){
  const rank=steps[i][4]; // points prévus / rangs possibles, ex. 4/5
  const n=Number(String(rank).split('/')[0]);
  return Number.isFinite(n) && n>0 ? n : 1;
}

function normalizeState(raw){
  const level=Math.max(10,Math.min(70,Math.trunc(Number(raw?.level))||trackerConfig.defaultLevel));
  let points=Array(steps.length).fill(0);

  if(Array.isArray(raw?.points)){
    points=points.map((_,i)=>Math.max(0,Math.min(maxPoints(i),Math.trunc(Number(raw.points[i]))||0)));
  }else if(Array.isArray(raw?.checked)){
    // Migration from old tracker: a checked talent becomes fully invested.
    raw.checked.forEach(i=>{
      if(Number.isInteger(i) && i>=0 && i<steps.length) points[i]=maxPoints(i);
    });
  }
  return {level,points};
}

try{
  const local=JSON.parse(localStorage.getItem(key)||'null');
  if(local) state=normalizeState(local);
}catch{}

// Keep this flag separate so the Rogue's existing local data remains compatible.
let dirty=false;
try{dirty=localStorage.getItem(key+'-pending')==='true';}catch{}
let revision=0, cloudLoaded=false, reading=false, saving=false, saveTimer=null;

function cloudHeaders(){
  // The existing public publishable key belongs in apikey, not in a JWT header.
  return {'apikey':SUPABASE_KEY,'Content-Type':'application/json'};
}

function persistLocal(){
  try{
    localStorage.setItem(key,JSON.stringify(state));
    localStorage.setItem(key+'-pending',String(dirty));
    $('localStatus').textContent='✓ Progression sauvegardée localement.';
  }catch{
    $('localStatus').textContent='⚠️ Stockage local indisponible dans ce navigateur.';
  }
}

function save(){
  revision++;
  dirty=true;
  persistLocal();
  renderStats();
  $('cloudStatus').textContent='☁️ Synchronisation en attente…';
  clearTimeout(saveTimer);
  saveTimer=setTimeout(()=>cloudLoaded?saveCloud():readCloud(),250);
}

async function saveCloud(){
  if(!cloudLoaded || saving || !dirty) return;
  saving=true;
  try{
    // Serialize writes: a slow older request must never overtake a newer edit.
    while(dirty){
      const sentRevision=revision;
      const body={slug:SLUG,level:state.level,
        checked:[...state.points],updated_at:new Date().toISOString()};
      $('cloudStatus').textContent='☁️ Sauvegarde de '+trackerConfig.name+'…';
      const r=await fetch(SUPABASE_URL+'/rest/v1/rogue_progress?on_conflict=slug',{
        method:'POST',headers:{...cloudHeaders(),'Prefer':'resolution=merge-duplicates,return=minimal'},
        body:JSON.stringify(body),keepalive:true,signal:AbortSignal.timeout(15000)
      });
      if(!r.ok) throw Error(String(r.status));
      if(revision===sentRevision){dirty=false;persistLocal();}
    }
    $('cloudStatus').textContent='✓ Progression synchronisée automatiquement.';
  }catch(e){
    $('cloudStatus').textContent=(e.message==='401'||e.message==='403')
      ?'⚠️ Accès Supabase refusé : exécute la migration supabase.sql pour autoriser les sauvegardes. Copie locale conservée.'
      :'⚠️ Synchronisation impossible. Copie locale conservée ; nouvel essai au retour en ligne ou à la prochaine modification.';
  }finally{saving=false;}
}

async function readCloud(){
  if(reading || saving) return;
  reading=true;
  const startRevision=revision;
  try{
    $('cloudStatus').textContent='☁️ Chargement de '+trackerConfig.name+'…';
    const r=await fetch(SUPABASE_URL+'/rest/v1/rogue_progress?slug=eq.'+encodeURIComponent(SLUG)+'&select=slug,level,checked,updated_at',
      {headers:cloudHeaders(),signal:AbortSignal.timeout(15000)});
    if(!r.ok) throw Error(String(r.status));
    const rows=await r.json();
    if(!Array.isArray(rows)) throw Error('Réponse invalide');
    cloudLoaded=true;
    // Never replace local edits with an older response arriving after a click.
    if(!dirty && revision===startRevision && rows.length){
      const row=rows.find(row=>row.slug===SLUG);
      if(!row) throw Error('Personnage inattendu');
      const checked=Array.isArray(row.checked)?row.checked:[];
      const pointCounts=checked.length===steps.length && checked.every((n,i)=>Number.isInteger(n) && n>=0 && n<=maxPoints(i));
      state=normalizeState(pointCounts
        ?{level:row.level,points:checked}:{level:row.level,checked});
      persistLocal();
      $('level').value=state.level;
      renderSteps();
    }else if(!rows.length){
      dirty=true;
      persistLocal();
    }
    $('cloudStatus').textContent='✓ Progression en ligne chargée.';
    if(dirty) await saveCloud();
  }catch(e){
    $('cloudStatus').textContent=(e.message==='401'||e.message==='403')
      ?'⚠️ Lecture Supabase refusée : les droits de la table doivent être configurés. Copie locale conservée.'
      :'⚠️ Cloud indisponible. Utilisation de la sauvegarde locale.';
  }finally{reading=false;}
}

window.addEventListener('online',()=>cloudLoaded?saveCloud():readCloud());
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='hidden'){clearTimeout(saveTimer);saveCloud();}
});
window.addEventListener('pagehide',()=>{clearTimeout(saveTimer);saveCloud();});

function totalPoints(){
  return state.points.reduce((a,b)=>a+b,0);
}

function renderStats(){
  const total=totalPoints();
  const available=Math.max(0,state.level-9);

  $('statLevel').textContent=state.level;
  $('statPoints').textContent=`${total}/${available}`;
  $('statTotal').textContent=total+'/61';
  $('barFill').style.width=(Math.min(61,total)/61*100)+'%';

  const next=Object.keys(trackerConfig.milestones).map(Number).find(n=>n>state.level);
  $('nextGoal').textContent=next
    ?('Prochain grand palier : niveau '+next+' · '+trackerConfig.milestones[next])
    :'Objectif final : niveau 70 et '+trackerConfig.build;
  if($('treeProgress')){
    const bm=steps.reduce((n,s,i)=>n+(s[2]==='Beast Mastery'?state.points[i]:0),0);
    const mm=total-bm;
    $('treeProgress').textContent=`Maîtrise des bêtes ${bm}/41 · Précision ${mm}/20 · Survie 0/0`;
  }

  $('validation').textContent=total>available
    ?'⚠️ Plus de points cochés que de points disponibles à ton niveau. Vérifie tes talents.'
    :total<available
      ?`Il te reste ${available-total} point(s) à attribuer/confirmer.`
      :'✓ Tous tes points disponibles sont attribués.';

  // A tracker records actual investments, so keep boxes editable and explain
  // invalid Hunter allocations rather than silently adding/removing other talents.
  const issues=[];
  steps.forEach((s,i)=>{
    if(!state.points[i] || !s[6]) return;
    const rule=s[6];
    const lower=steps.reduce((n,t,j)=>n+(t[2]===s[2] && t[6].tier<rule.tier?state.points[j]:0),0);
    if(lower<(rule.tier-1)*5) issues.push(s[3]+' : '+((rule.tier-1)*5)+' points requis dans les paliers précédents');
    if(rule.requires){
      const index=steps.findIndex(t=>t[3]===rule.requires[0]);
      if(state.points[index]<rule.requires[1]) issues.push(s[3]+' nécessite '+rule.requires[0]+' '+rule.requires[1]+'/'+rule.requires[1]);
    }
  });
  if(issues.length) $('validation').textContent+=' ⚠️ '+issues.join(' ; ')+'.';

  document.querySelectorAll('.step').forEach((el,i)=>{
    const invested=state.points[i]||0;
    el.classList.toggle('done',invested===maxPoints(i));
    el.classList.toggle('locked',steps[i][0]>state.level);
    const counter=el.querySelector('.rank-counter');
    if(counter) counter.textContent=`${invested}/${maxPoints(i)}`;
  });
}

function renderSteps(){
  const root=$('steps');
  root.innerHTML='';

  steps.forEach((s,i)=>{
    if(i===0||s[2]!==steps[i-1][2]){
      const h=document.createElement('h3');
      h.className='category';
      h.textContent=trackerConfig.categories[s[2]];
      root.append(h);
    }

    const el=document.createElement('div');
    el.className='step';

    const top=document.createElement('div');
    top.className='step-top';

    const main=document.createElement('div');
    main.className='step-main';

    const title=document.createElement('div');
    title.className='step-title';
    title.textContent=s[3];

    const meta=document.createElement('div');
    meta.className='step-meta';
    meta.textContent=s[6]?.levels ? 'Niveaux '+s[6].levels.join(' et ') : 'Niveau '+(s[0]===s[1]?s[0]:s[0]+'–'+s[1]);

    main.append(title,meta);

    const rank=document.createElement('strong');
    rank.className='rank-counter';
    rank.style.color='var(--gold)';
    rank.style.minWidth='42px';
    rank.style.textAlign='right';
    rank.textContent=`${state.points[i]||0}/${maxPoints(i)}`;

    top.append(main,rank);

    const boxes=document.createElement('div');
    boxes.className='rank-boxes';
    boxes.style.display='flex';
    boxes.style.gap='9px';
    boxes.style.flexWrap='wrap';
    boxes.style.margin='12px 0 2px 32px';

    for(let p=1;p<=maxPoints(i);p++){
      const wrap=document.createElement('label');
      wrap.style.margin='0';
      wrap.style.display='inline-flex';
      wrap.style.alignItems='center';
      wrap.style.justifyContent='center';
      wrap.style.cursor='pointer';
      wrap.title=`${s[3]} : point ${p}/${maxPoints(i)} · niveau ${s[6]?.levels?.[p-1] ?? (s[0]+p-1)}`;

      const check=document.createElement('input');
      check.type='checkbox';
      check.style.width='21px';
      check.style.height='21px';
      check.style.accentColor='#bd9457';
      check.checked=(state.points[i]||0)>=p;
      check.setAttribute('aria-label',`${s[3]} point ${p} sur ${maxPoints(i)}`);

      check.addEventListener('change',()=>{
        // Keep ranks sequential. Checking point 4 means 1-4 are invested.
        // Unchecking point 3 removes points 3+.
        state.points[i]=check.checked ? p : p-1;
        renderSteps();
        $('steps').querySelectorAll('.step')[i].querySelectorAll('input')[p-1].focus({preventScroll:true});
        save();
      });

      wrap.append(check);
      boxes.append(wrap);
    }

    const desc=document.createElement('p');
    desc.className='step-desc';
    desc.textContent=s[5];

    el.append(top,boxes,desc);
    root.append(el);
  });

  renderStats();
}

$('level').value=state.level;
$('level').onchange=()=>{
  state.level=Math.max(10,Math.min(70,Math.trunc(Number($('level').value))||trackerConfig.defaultLevel));
  $('level').value=state.level;
  save();
};

$('saveLocal').onclick=save;
$('reset').onclick=()=>{
  if(confirm('Retirer tous les points de talents ?')){
    state.points=Array(steps.length).fill(0);
    renderSteps();
    save();
  }
};

if($('timeline')){
  const plan=steps.flatMap((s,i)=>Array.from({length:maxPoints(i)},(_,rank)=>({
    level:s[6]?.levels?.[rank] ?? s[0]+rank,name:s[3],rank:rank+1,max:s[4].split('/')[1]
  }))).sort((a,b)=>a.level-b.level);
  plan.forEach(point=>{
    const row=document.createElement('tr');
    [point.level,point.name,point.rank+'/'+point.max].forEach(value=>{
      const cell=document.createElement('td');cell.textContent=value;row.append(cell);
    });
    $('timeline').append(row);
  });
}
renderSteps();
window.addEventListener('DOMContentLoaded',readCloud);
