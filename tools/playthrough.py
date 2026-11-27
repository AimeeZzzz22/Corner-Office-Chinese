import asyncio, json
from playwright.async_api import async_playwright
O='/tmp/play/'
CHECK=open('tools/card_audit.py').read().split('CHECK="""')[1].split('"""')[0]
log=[]
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']); pg=await b.new_page(viewport={'width':1280,'height':720})
        errs=[]; pg.on('pageerror',lambda e: errs.append(str(e))); pg.on('console',lambda m: errs.append('console '+m.type+': '+m.text) if m.type in ('error','warning') else None)
        n=[0]
        async def shot(name):
            n[0]+=1; await pg.screenshot(path=O+f'{n[0]:02d}_{name}.png')
            r=await pg.evaluate(CHECK)
            if r: log.append((name,r))
        async def fc(sel): await pg.click(sel, force=True)
        await pg.goto('http://localhost:4173/'); await pg.evaluate('localStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(2700)
        co=await pg.evaluate("JSON.parse(localStorage.getItem('corner-office-demo-v1')).company"); print('company',co)
        await shot('title'); await pg.mouse.click(640,600); await pg.wait_for_timeout(6200); await shot('envelope')
        tab=await pg.query_selector('.tab'); bb=await tab.bounding_box(); x0,y0=bb['x']+bb['width']/2,bb['y']+bb['height']/2
        await pg.mouse.move(x0,y0); await pg.mouse.down()
        for i in range(1,40): await pg.mouse.move(x0+i*14,y0-i*0.7); await pg.wait_for_timeout(25)
        await pg.mouse.up(); await pg.wait_for_timeout(2500); await shot('letter')
        await pg.fill('.dear input','Mochi'); await fc('.sign'); await shot('signed'); await fc('.accept'); await pg.wait_for_timeout(1900); await shot('ask')
        await pg.click('text=Choose my first-day look'); await pg.wait_for_timeout(1300); await shot('booth_skin')
        await fc('button:has-text("Next: Eyes")'); await shot('booth_eyes'); await fc('button:has-text("Next: Hair")'); await shot('booth_hair_empty')
        await fc('.tiles .tile >> nth=6'); await shot('booth_hair'); await fc('button:has-text("Next: Top")')
        await fc('.tiles .tile >> nth=4'); await fc('button:has-text("Next: Bottom")'); await fc('.tiles .tile >> nth=3'); await shot('booth_bottom')
        await fc('button:has-text("Next: Extras")'); await fc('.tiles .tile >> nth=1'); await shot('booth_extras'); await fc('button:has-text("Next: Pet")'); await shot('booth_pet')
        sels=pg.locator('.tab-body select'); await sels.nth(0).select_option('3'); await sels.nth(1).select_option('12'); await shot('booth_bday')
        await fc("text=I'm ready for day one"); await pg.wait_for_timeout(1500)
        for i in range(12):
            try: await pg.wait_for_selector('.tour-card .btn.primary', timeout=25000)
            except Exception: print('tour stuck at',i); break
            await pg.wait_for_timeout(1500); await shot(f'tour{i}')
            btn=pg.locator('.tour-card .btn.primary'); txt=await btn.inner_text()
            await btn.click(force=True); await pg.wait_for_timeout(200)
            if await pg.locator('.tour-card .btn.primary').count() and (await pg.locator('.tour-card .btn.primary').inner_text())==txt and 'badge' not in txt: await pg.locator('.tour-card .btn.primary').click(force=True)
            if 'badge' in txt:
                await pg.wait_for_timeout(300)
                if await pg.locator('.tour-card .btn.primary').count(): await pg.locator('.tour-card .btn.primary').click(force=True)
                break
            await pg.wait_for_timeout(400)
        await pg.wait_for_timeout(1500); await shot('badge'); await pg.click('.badge-btns >> text=Continue'); await pg.wait_for_timeout(600); await shot('vibe_cards')
        await fc('.fd >> nth=0'); await pg.wait_for_timeout(1200); await shot('vibe_shake'); await pg.wait_for_timeout(1900); await shot('vibe_reveal')
        await pg.click('text=Keep this one'); await pg.click('.vinfo >> text=Continue'); await pg.wait_for_timeout(500); await shot('quiz')
        for i in range(3):
            await fc('.opt2 >> nth=1'); await pg.locator('.quiz-card .btn.primary').click()
        await pg.wait_for_timeout(300); await shot('quiz_summary'); await pg.click('text=Go to my desk'); await pg.wait_for_timeout(900); await shot('gifts')
        for k in range(4):
            await fc('.gift-mini >> nth=0'); await pg.wait_for_timeout(700)
            if k==0: await shot('gift_box')
            h=await pg.query_selector('.gift-svg circle[fill=transparent]'); bb=await h.bounding_box(); x0,y0=bb['x']+bb['width']/2,bb['y']+bb['height']/2
            await pg.mouse.move(x0,y0); await pg.mouse.down()
            for i in range(1,30): await pg.mouse.move(x0+i*6,y0+i*5); await pg.wait_for_timeout(20)
            await pg.mouse.up(); await pg.wait_for_timeout(1700)
            if k==0: await shot('gift_reveal')
            await pg.click('text=Put it on my desk'); await pg.wait_for_timeout(400)
        for i in range(4): await shot(f'tut{i}'); await pg.locator('.gift-card .btn.ghost').click(); await pg.wait_for_timeout(300)
        await shot('tut_done'); await pg.click('text=Wrap up orientation'); await pg.wait_for_timeout(300)
        for _ in range(8): await pg.click('.gh'); await pg.wait_for_timeout(150)
        await pg.click('.gh-clock'); await pg.wait_for_timeout(300); await pg.click('.gh-btns .btn.primary'); await pg.wait_for_timeout(1500); await shot('office')
        # the welcome gift
        spots=json.loads(await pg.evaluate("JSON.stringify(null)"))
        cv=await (await pg.query_selector('.office canvas')).bounding_box(); k=cv['width']/512
        SP={'stitchlight':{'surprise':(263,176),'food':(416,238),'fridge':(136,222)},'moonpuff':{'surprise':(200,254),'food':(112,274),'fridge':(136,268)}}[co]
        for kind,(x,y) in SP.items():
            await pg.mouse.click(cv['x']+x*k, cv['y']+(y-10)*k)
            want={'food':'Bakery|counter','fridge':'fridge','surprise':'gift'}[kind]
            try: await pg.wait_for_function("(w)=>{const b=document.querySelector('.spot-bubble b');return b&&new RegExp(w).test(b.textContent)}", arg=want, timeout=35000)
            except Exception: print('no bubble',kind)
            await pg.wait_for_timeout(300); await shot(f'spot_{kind}')
            if kind=='surprise':
                await pg.click('.spot-bubble .bubble-btn'); await pg.wait_for_timeout(700)
                h=await pg.query_selector('.gift-svg circle[fill=transparent]'); bb=await h.bounding_box(); x0,y0=bb['x']+bb['width']/2,bb['y']+bb['height']/2
                await pg.mouse.move(x0,y0); await pg.mouse.down()
                for i in range(1,30): await pg.mouse.move(x0+i*6,y0+i*5); await pg.wait_for_timeout(20)
                await pg.mouse.up(); await pg.wait_for_timeout(1700); await shot('mug_reveal'); await pg.click('text=Put it on my desk'); await pg.wait_for_timeout(400)
            if kind=='food':
                await pg.click('.spot-bubble .bubble-btn'); await pg.wait_for_timeout(500); await shot('bakery')
                print('coins at bakery', await pg.evaluate("JSON.parse(localStorage.getItem('corner-office-demo-v1')).coins")); await pg.click('.bakery .bb-x')
        await pg.click('.shop-btn'); await pg.wait_for_timeout(800); await shot('shop'); await pg.click('text=Blind boxes'); await pg.wait_for_timeout(500); await shot('shop_blind'); await pg.click('.bb-x')
        await pg.click('text=My desk'); await pg.wait_for_selector('.pc-hot', timeout=40000); await pg.wait_for_timeout(600); await shot('desk')
        await pg.click('.settings-btn'); await pg.check('text=Fast demo time'); await shot('settings'); await pg.click('.settings-btn')
        await pg.click('.pc-hot'); await pg.wait_for_timeout(400); await shot('computer'); await pg.click('.pc-icon'); await pg.wait_for_timeout(400); await shot('tasklet')
        await pg.click('text=Coworkers'); await shot('tasklet_team'); await pg.click('text=Past orders'); await shot('tasklet_past'); await pg.click('text=New orders')
        await pg.locator('.pc-take >> nth=0').click(); await pg.wait_for_timeout(600); await shot('focus')
        ins=pg.locator('.panel input, .card input'); 
        if await ins.count(): await ins.first.fill('Write my essay intro')
        await pg.click('text=Start focusing'); await pg.wait_for_timeout(1500); await shot('work')
        try: await pg.wait_for_selector('text=Finished!', timeout=100000)
        except Exception: print('no times up')
        await shot('timesup'); await pg.click('text=Finished!'); await pg.wait_for_timeout(1300); await shot('result')
        await pg.click('text=Back to my desk'); await pg.wait_for_timeout(700); await shot('desk_after')
        await pg.click('text=Back to the office'); await pg.wait_for_timeout(1500); await shot('office_after')
        st=await pg.evaluate("JSON.parse(localStorage.getItem('corner-office-demo-v1'))")
        print('coins',st['coins'],'xp',st['xp'],'blind',st['blind'],'treats',st['treats'],'history',len(st['history']))
        print('ERRORS',errs); print('LAYOUT',log); await b.close()
asyncio.run(main())
