const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const load=file=>vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8')+';JSON.stringify(trackerConfig)');
const hunter=JSON.parse(load('hunter.js'));
const rogue=JSON.parse(load('rogue.js'));
const reference=require('./fixtures/hunter-tbc.json').talents;
function validate(config){
  const plan=config.steps.flatMap(s=>Array.from({length:Number(s[4].split('/')[0])},(_,p)=>({
    level:s[6]?.levels?.[p]??s[0]+p,name:s[3],tree:s[2],rank:p+1
  }))).sort((a,b)=>a.level-b.level);
  assert.deepEqual(plan.map(p=>p.level),Array.from({length:61},(_,i)=>i+10));
  const ranks={},trees={};
  for(const p of plan){
    const r=reference[p.name];assert.ok(r,'Unknown talent: '+p.name);
    assert.equal(p.tree,r.tree);
    assert.equal(p.rank,(ranks[p.name]||0)+1);
    assert.ok(p.rank<=r.max);
    const lower=Object.entries(ranks).reduce((sum,[name,rank])=>sum+(reference[name].tree===p.tree&&reference[name].tier<r.tier?rank:0),0);
    assert.ok(lower>=(r.tier-1)*5,`Tier locked at ${p.level}: ${p.name}`);
    if(r.requires) assert.ok((ranks[r.requires[0]]||0)>=r.requires[1],`Missing prerequisite for ${p.name}`);
    ranks[p.name]=p.rank;trees[p.tree]=(trees[p.tree]||0)+1;
    assert.equal(Object.values(trees).reduce((a,b)=>a+b,0),p.level-9);
  }
  return {plan,trees};
}
test('Hunter: original TBC ranks, tiers and dependencies match independent reference',()=>{
  for(const s of hunter.steps){const r=reference[s[3]];assert.ok(r);assert.equal(Number(s[4].split('/')[1]),r.max);assert.equal(s[6].tier,r.tier);assert.deepEqual(s[6].requires,r.requires);}
});
test('Hunter: every level 10–70 legal; exactly 41/20/0; 16 points at level 25',()=>{
  const {plan,trees}=validate(hunter);
  assert.deepEqual(trees,{'Beast Mastery':41,Marksmanship:20});
  assert.equal(plan.filter(p=>p.level<=25).length,16);
  assert.equal(plan.find(p=>p.level===50).name,'The Beast Within');
  assert.ok(plan.filter(p=>p.level<=50).every(p=>p.tree==='Beast Mastery'));
});
test('Validator rejects an early tier and missing Mortal Shots prerequisite',()=>{
  const early=structuredClone(hunter);early.steps[0][3]='Frenzy';assert.throws(()=>validate(early));
  const missing=structuredClone(hunter);missing.steps.find(s=>s[3]==='Aimed Shot')[3]='Improved Arcane Shot';assert.throws(()=>validate(missing),/prerequisite/);
});
test('Rogue: unchanged legacy allocation and local key',()=>{
  assert.deepEqual(rogue.steps,require('./fixtures/rogue-steps.json'));
  assert.equal(rogue.key,'moonwell-rogue-tracker-v3');
  const total=rogue.steps.reduce((a,s)=>a+Number(s[4].split('/')[0]),0);assert.equal(total,61);
});
test('Characters use distinct slugs and storage, static relative links, no auth',()=>{
  assert.equal(rogue.slug,'fandebr');assert.equal(hunter.slug,'fandenibard');assert.notEqual(rogue.key,hunter.key);
  for(const file of ['index.html','hunter.html']){
    const html=fs.readFileSync(path.join(root,file),'utf8');
    assert.match(html,/href="index.html"/);assert.match(html,/href="hunter.html"/);assert.doesNotMatch(html,/authForm|auth.js|Synchroniser<\/button>/);
    for(const [,asset] of html.matchAll(/(?:src|href)="([^"#:]+\.(?:html|js|css))"/g)) assert.ok(fs.existsSync(path.join(root,asset)),asset);
  }
});
