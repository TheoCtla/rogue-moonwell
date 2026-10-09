// Run with Playwright available via NODE_PATH; all Supabase traffic is mocked.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const config=file=>JSON.parse(vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8')+';JSON.stringify(trackerConfig)'));
const hunter=config('hunter.js'),rogue=config('rogue.js');
const base=process.env.TRACKER_TEST_URL||'http://127.0.0.1:8765';
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
(async()=>{
 const browser=await chromium.launch({channel:process.env.CHROME_CHANNEL||'chrome',headless:true});
 const context=await browser.newContext();
 const rows={fandebr:{slug:'fandebr',level:26,checked:rogue.steps.map((_,i)=>i===0?3:0)}};
 const posts=[],errors=[];
 let getDelay=0,postDelay=0,failWrites=false,failReads=false;
 await context.route('https://*.supabase.co/**',async route=>{
   const req=route.request(),url=new URL(req.url());
   assert.equal(url.pathname,'/rest/v1/rogue_progress','No Auth or other requests');
   assert.ok(req.headers().apikey);assert.equal(req.headers().authorization,undefined);
   if(req.method()==='GET'){
     const slug=url.searchParams.get('slug').slice(3);
     const snapshot=rows[slug]?structuredClone(rows[slug]):null;
     await sleep(getDelay);
     return route.fulfill({status:failReads?401:200,contentType:'application/json',body:JSON.stringify(failReads?{message:'permission denied'}:snapshot?[snapshot]:[])});
   }
   assert.equal(req.method(),'POST');assert.equal(url.searchParams.get('on_conflict'),'slug');
   const body=req.postDataJSON();assert.ok(['fandebr','fandenibard'].includes(body.slug));assert.equal(body.owner_id,undefined);
   posts.push(structuredClone(body));
   await sleep(postDelay);
   if(failWrites)return route.fulfill({status:503,body:'unavailable'});
   rows[body.slug]=body;
   return route.fulfill({status:201,body:''});
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 const expectText=async(id,value)=>{await page.waitForFunction(([id,value])=>document.getElementById(id)?.textContent===value,[id,value]);};
 const synced=async()=>page.waitForFunction(()=>document.getElementById('cloudStatus').textContent.includes('synchronisée automatiquement'));
 const box=(name,p,count)=>page.getByRole('checkbox',{name:`${name} point ${p} sur ${count}`,exact:true});
 try{
   await page.goto(base+'/hunter.html');await synced();
   await expectText('statLevel','25');await expectText('statPoints','0/16');
   assert.equal(await page.getByRole('checkbox').count(),61);
   assert.equal(await page.locator('#timeline tr').count(),61);
   assert.equal(await page.locator('input[type=password]').count(),0);
   assert.equal(rows.fandenibard.level,25);
   assert.equal(rows.fandebr.level,26);
   await box('Improved Aspect of the Hawk',4,5).check();await synced();
   assert.equal(await page.locator('.step').first().locator('input:checked').count(),4);
   assert.equal(await page.locator('.rank-counter').first().textContent(),'4/5');
   await box('Improved Aspect of the Hawk',3,5).uncheck();await synced();
   assert.equal(await page.locator('.step').first().locator('input:checked').count(),2);
   assert.equal(rows.fandenibard.checked[0],2);
   assert.equal((await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),hunter.key)).points[0],2);
   assert.equal(await page.locator('.step').filter({has:page.getByText('Frenzy',{exact:true})}).getByRole('checkbox').count(),4);
   assert.equal(await page.locator('.step').filter({has:page.getByText('Endurance Training',{exact:true})}).getByRole('checkbox').count(),1);
   await page.locator('#level').fill('70');await page.locator('#level').press('Tab');await synced();await expectText('statPoints','2/61');
   await page.reload();await expectText('statPoints','2/61');
   // Clear only the test browser's Hunter cache: restoration must come from cloud.
   await page.evaluate(k=>{localStorage.removeItem(k);localStorage.removeItem(k+'-pending');},hunter.key);
   await page.reload();await expectText('statPoints','2/61');
   console.log('PASS Hunter defaults, 61 boxes, sequential ranks, level autosave, local + cloud reload');

   await page.getByRole('link',{name:'🗡️ Fandebr — Rogue'}).click();await expectText('statPoints','3/17');
   assert.equal(await page.getByRole('checkbox').count(),61);
   await box('Camouflage',4,4).check();await synced();
   assert.equal(rows.fandebr.checked[2],4);assert.equal(rows.fandenibard.checked[0],2);
   await page.getByRole('link',{name:'🏹 Fandenibard — Hunter'}).click();await expectText('statPoints','2/61');
   assert.equal((await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),rogue.key)).points[2],4);
   console.log('PASS Rogue regression, navigation, independent cloud rows and local keys');

   // A delayed initial response must not erase a click made while it loads.
   getDelay=600;
   await page.reload({waitUntil:'domcontentloaded'});
   await box('Improved Aspect of the Hawk',5,5).check();await synced();
   assert.equal(rows.fandenibard.checked[0],5);getDelay=0;
   // An older slow write must finish before the newer write.
   postDelay=600;
   await box('Improved Aspect of the Hawk',4,5).uncheck();
   await page.waitForFunction(()=>document.getElementById('cloudStatus').textContent.includes('Sauvegarde de'));
   await box('Improved Aspect of the Hawk',5,5).check();await synced();
   assert.equal(rows.fandenibard.checked[0],5);postDelay=0;
   console.log('PASS delayed startup read and sequential cloud writes');

   failWrites=true;
   await box('Improved Aspect of the Hawk',4,5).uncheck();
   await page.waitForFunction(()=>document.getElementById('cloudStatus').textContent.includes('Synchronisation impossible'));
   assert.equal((await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),hunter.key)).points[0],3);
   await page.reload();await expectText('statPoints','3/61');
   failWrites=false;await page.evaluate(()=>window.dispatchEvent(new Event('online')));await synced();
   assert.equal(rows.fandenibard.checked[0],3);
   failReads=true;await page.reload();await page.waitForFunction(()=>document.getElementById('cloudStatus').textContent.includes('Lecture Supabase refusée'));
   await expectText('statPoints','3/61');
   await box('Improved Aspect of the Hawk',4,5).check();
   failReads=false;await page.evaluate(()=>window.dispatchEvent(new Event('online')));await synced();
   assert.equal(rows.fandenibard.checked[0],4);
   console.log('PASS network failure, pending edits survive reload, reconnect retries, denied reads');

   // Test actual recommended progression through every level and verify no warning.
   rows.fandenibard={slug:'fandenibard',level:70,checked:hunter.steps.map(s=>Number(s[4].split('/')[0]))};
   await page.reload();await expectText('statTotal','61/61');
   assert.ok(!(await page.locator('#validation').textContent()).includes('⚠️'));
   await expectText('treeProgress','Maîtrise des bêtes 41/41 · Précision 20/20 · Survie 0/0');
   assert.equal(await page.locator('#barFill').evaluate(el=>el.style.width),'100%');
   await box('Aimed Shot',1,1).uncheck();assert.match(await page.locator('#validation').textContent(),/Mortal Shots nécessite Aimed Shot/);await synced();
   page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Tout décocher'}).click();await synced();await expectText('statTotal','0/61');
   console.log('PASS completed 41/20/0 UI, prerequisite warning, reset autosave');

   // Legacy arrays of checked step indexes, including every step checked.
   rows.fandebr={slug:'fandebr',level:70,checked:rogue.steps.map((_,i)=>i)};
   await page.goto(base+'/index.html');await expectText('statTotal','61/61');
   rows.fandebr={slug:'fandebr',level:14,checked:[0,1]};
   await page.reload();await expectText('statTotal','7/61');
   console.log('PASS legacy Rogue cloud format migration (partial and full)');

   await page.goto(base+'/hunter.html');await expectText('statTotal','0/61');
   await page.locator('#level').fill('25');await page.locator('#level').press('Tab');await synced();
   for(const s of hunter.steps){
     const levels=s[6]?.levels||Array.from({length:Number(s[4].split('/')[0])},(_,i)=>s[0]+i);
     const count=levels.filter(level=>level<=25).length;
     if(count) await box(s[3],count,Number(s[4].split('/')[0])).check();
   }
   await synced();await expectText('statPoints','16/16');
   assert.ok(!(await page.locator('#validation').textContent()).includes('⚠️'));
   await page.setViewportSize({width:1280,height:900});await page.screenshot({path:'/tmp/moonwell-qa/hunter-desktop.png'});
   await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/tmp/moonwell-qa/hunter-mobile.png'});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.getByRole('link',{name:'🗡️ Fandebr — Rogue'}).click();await page.screenshot({path:'/tmp/moonwell-qa/rogue-mobile.png'});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   assert.deepEqual(errors,[]);
   console.log('PASS level 25 recommended allocation, desktop/mobile layout, no JS errors');
   console.log(`All browser scenarios passed (${posts.length} isolated mock writes, no production writes).`);
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
