import asyncio, time
from playwright.async_api import async_playwright
SET="""(p)=>{const k='corner-office-demo-v1';const s=JSON.parse(localStorage.getItem(k));Object.assign(s,p);localStorage.setItem(k,JSON.stringify(s));}"""
O='/tmp/ui/'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']); pg=await b.new_page(viewport={'width':1280,'height':720})
        errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
        n=[0]
        async def shot(nm): n[0]+=1; await pg.screenshot(path=O+f'{n[0]:02d}_{nm}.png')
        now=int(time.time()*1000)
        hist=[{'at':now-i*3600*1000*7,'mins':25,'worked':25,'who':['margaux','priya','theo','camille'][i%4],'job':'Edit a page','focus':'Read','type':'Reading','finished':True,'coins':30,'xp':30,'steps':0,'stepsDone':0} for i in range(9)]
        await pg.goto('http://localhost:4173/'); await pg.evaluate('localStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(400)
        await pg.evaluate(SET,{'phase':'free','company':'stitchlight','name':'Mochi','lookDone':True,'coins':300,'history':hist,'hearts':{'margaux':9,'priya':4,'theo':0,'camille':12,'jonah':0,'odette':0,'rio':0,'sam':0,'ada':0,'kofi':0,'mei':0,'bean':0},'desk':['lamp','clipboard','piggy','phone'],'surprise':'opened','blind':{'mins':35,'ready':1,'day':time.strftime('%a %b %d %Y'),'earned':2}})
        await pg.reload(); await pg.wait_for_timeout(1500); await shot('hud')
        await pg.click('.avatar-stack',force=True); await pg.wait_for_timeout(700); await shot('stack_open'); await pg.click('.avatar-stack',force=True); await pg.wait_for_timeout(500)
        cap=await (await pg.query_selector('.pull-cap')).bounding_box(); x,y=cap['x']+cap['width']/2,cap['y']+20
        await pg.mouse.move(x,y); await pg.mouse.down()
        for i in range(1,10): await pg.mouse.move(x,y+i*13); await pg.wait_for_timeout(25)
        await shot('pull_mid'); await pg.mouse.up(); await pg.wait_for_timeout(600); await shot('pull_open')
        await pg.click('text=See my week'); await pg.wait_for_timeout(800); await shot('week0')
        for k in range(1,4):
            await pg.evaluate(f"document.querySelector('.wr').scrollTop={k*520}"); await pg.wait_for_timeout(500); await shot(f'week{k}')
        await pg.click('.wr-head .bb-x'); await pg.wait_for_timeout(300)
        # mail
        await pg.click('.settings-btn'); await pg.click('text=Thank-you note (test)'); await pg.wait_for_timeout(300)
        await pg.click('.settings-btn'); await pg.click('text=Payday envelope (test)'); await pg.wait_for_timeout(300); await shot('mail_chip')
        await pg.click('.hud-mail',force=True); await pg.wait_for_timeout(700); await shot('mail_env')
        env=await (await pg.query_selector('.mail-env')).bounding_box(); x0,y0=env['x']+6,env['y']+15
        await pg.mouse.move(x0,y0); await pg.mouse.down()
        for i in range(1,8): await pg.mouse.move(x0+i*18,y0); await pg.wait_for_timeout(30)
        await shot('mail_tearing')
        for i in range(8,22): await pg.mouse.move(x0+i*18,y0); await pg.wait_for_timeout(30)
        await pg.mouse.up(); await pg.wait_for_timeout(700); await shot('mail_out'); await pg.wait_for_timeout(1300); await shot('mail_read')
        await pg.click('.mail-btns .btn.primary'); await pg.wait_for_timeout(900); await pg.click('.mail-env',force=True); await pg.wait_for_timeout(2300); await shot('payday_read')
        for k in range(4):
            if not await pg.locator('.mail-dim').count(): break
            if await pg.locator('.mail-btns').count()==0: await pg.click('.mail-env',force=True); await pg.wait_for_timeout(2300)
            await pg.click('.mail-btns .btn.primary'); await pg.wait_for_timeout(600)
        # shop liquid tabs + pack panel
        await pg.click('.shop-btn'); await pg.wait_for_timeout(400); await pg.click('.liquid button[data-k=blind]'); await pg.wait_for_timeout(120); await shot('liquid_mid'); await pg.wait_for_timeout(600); await shot('shop_packs')
        await pg.click('.bb-x'); await pg.wait_for_timeout(300)
        # computer: dock, liquid side, accordion
        await pg.evaluate(SET,{'phase':'desk'}); await pg.evaluate("1"); await pg.reload(); await pg.wait_for_timeout(1200)
        await pg.evaluate(SET,{}); 
        await pg.click('.pc-hot'); await pg.wait_for_timeout(500)
        dock=await (await pg.query_selector('.dock')).bounding_box()
        await pg.mouse.move(dock['x']+dock['width']*0.42,dock['y']+30); await pg.wait_for_timeout(200); await shot('dock_hover')
        await pg.click('.dock-app >> nth=1'); await pg.wait_for_timeout(700); await shot('team_acc')
        await pg.click('.acc-strip >> nth=3'); await pg.wait_for_timeout(150); await shot('acc_mid'); await pg.wait_for_timeout(700); await shot('acc_open')
        await pg.click('.pc-side button[data-t=new]'); await pg.wait_for_timeout(90); await shot('side_mid'); await pg.wait_for_timeout(600); await shot('side_new')
        # take an order with steps -> work -> result tray
        await pg.click('.pc-take >> nth=0'); await pg.wait_for_timeout(500)
        await pg.fill('.form input.field >> nth=0','Read chapter 3'); await pg.fill('.form input.field.small >> nth=0','Skim'); await pg.fill('.form input.field.small >> nth=1','Notes')
        await pg.evaluate(SET,{'fast':True}); 
        await pg.click('text=Start focusing'); await pg.wait_for_timeout(1500); await shot('work')
        await pg.click('.fill-steps .step >> nth=0'); await pg.wait_for_timeout(400); await shot('step1')
        await pg.click('.fill-steps .step >> nth=1'); await pg.wait_for_timeout(250); await shot('steps_all')
        await pg.click('text=Stop early'); await pg.wait_for_timeout(300); await pg.click('text=Stopping here'); await pg.wait_for_timeout(800); await shot('result')
        await pg.click('.peek-line'); await pg.wait_for_timeout(600); await shot('result_tray')
        print('errors',errs); await b.close()
asyncio.run(main())
