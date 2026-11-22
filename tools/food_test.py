import asyncio,sys
from playwright.async_api import async_playwright
SET="""(p)=>{const k='corner-office-demo-v1';const s=JSON.parse(localStorage.getItem(k));Object.assign(s,p);localStorage.setItem(k,JSON.stringify(s));}"""
O='/tmp/desk/'
SPOTS={'stitchlight':{'food':(416,238),'fridge':(136,222),'surprise':(280,254)},'moonpuff':{'food':(112,274),'fridge':(136,268),'surprise':(200,254)}}
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']); pg=await b.new_page(viewport={'width':1280,'height':720})
        errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:4173/'); await pg.evaluate('localStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(400)
        for co in ('stitchlight','moonpuff'):
            today=await pg.evaluate("new Date().toDateString()")
            await pg.evaluate(SET,{'company':co,'phase':'free','name':'Mochi','lookDone':True,'coins':300,'surprise':'waiting','fridge':{'day':today,'item':'fortune_cookie','fortune':2},'treats':{'day':'','have':[],'used':[]},'desk':['lamp','clipboard','piggy','phone'],'place':{}})
            await pg.reload(); await pg.wait_for_timeout(900)
            await pg.screenshot(path=O+f'90_{co}_office.png')
            cv=await (await pg.query_selector('.office canvas')).bounding_box(); k=cv['width']/512
            for kind,(x,y) in SPOTS[co].items():
                await pg.mouse.click(cv['x']+x*k, cv['y']+(y-13)*k)
                want={'food':'Bakery|counter','fridge':'fridge','surprise':'gift'}[kind]
                try: await pg.wait_for_function("(w)=>{const b=document.querySelector('.spot-bubble b');return b&&new RegExp(w).test(b.textContent)}", arg=want, timeout=30000)
                except Exception: print('no bubble for',co,kind)
                await pg.wait_for_timeout(300)
                await pg.screenshot(path=O+f'91_{co}_{kind}_bubble.png')
                btn=pg.locator('.spot-bubble .bubble-btn')
                if await btn.count(): await btn.click(); await pg.wait_for_timeout(600)
                await pg.screenshot(path=O+f'92_{co}_{kind}_open.png')
                if kind=='food':
                    await pg.click('.bakery-item >> nth=0 >> .shop-buy'); await pg.click('.bakery-item >> nth=2 >> .shop-buy'); await pg.wait_for_timeout(300)
                    await pg.screenshot(path=O+f'93_{co}_bought.png'); await pg.click('.bakery .bb-x')
                elif kind=='fridge':
                    await pg.click('text=Take it'); await pg.wait_for_timeout(300)
                else:
                    h=await pg.query_selector('.gift-svg circle[fill=transparent]'); bb=await h.bounding_box(); x0,y0=bb['x']+bb['width']/2,bb['y']+bb['height']/2
                    await pg.mouse.move(x0,y0); await pg.mouse.down()
                    for i in range(1,30): await pg.mouse.move(x0+i*6,y0+i*5); await pg.wait_for_timeout(20)
                    await pg.mouse.up(); await pg.wait_for_timeout(1600); await pg.screenshot(path=O+f'94_{co}_mug.png')
                    await pg.click('text=Put it on my desk'); await pg.wait_for_timeout(300)
            st=await pg.evaluate("JSON.parse(localStorage.getItem('corner-office-demo-v1'))")
            print(co,'coins',st['coins'],'treats',st['treats'],'fridge',st['fridge'],'surprise',st['surprise'],'mug',st['place'].get('smile_mug'))
            await pg.screenshot(path=O+f'95_{co}_hud.png')
            await pg.click('.shop-btn'); await pg.wait_for_timeout(700); await pg.screenshot(path=O+f'96_{co}_shop.png'); await pg.click('.bb-x')
        # desk with treats + mug
        await pg.click('text=My desk'); await pg.wait_for_selector('.pc-hot', timeout=30000); await pg.wait_for_timeout(500); await pg.screenshot(path=O+'97_desk.png')
        print('errors',errs); await b.close()
asyncio.run(main())
