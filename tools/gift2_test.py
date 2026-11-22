import asyncio
from playwright.async_api import async_playwright
SET="""(p)=>{const k='corner-office-demo-v1';const s=JSON.parse(localStorage.getItem(k));Object.assign(s,p);localStorage.setItem(k,JSON.stringify(s));}"""
O='/tmp/desk/'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']); pg=await b.new_page(viewport={'width':1280,'height':720})
        errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:4173/'); await pg.evaluate('localStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(400)
        for co,(x,y) in (('stitchlight',(263,176)),('moonpuff',(200,254))):
            await pg.evaluate(SET,{'company':co,'phase':'free','name':'Mochi','lookDone':True,'surprise':'waiting','desk':['lamp','clipboard','piggy','phone'],'place':{}})
            await pg.reload(); await pg.wait_for_timeout(900)
            cv=await (await pg.query_selector('.office canvas')).bounding_box(); k=cv['width']/512
            await pg.screenshot(path=O+f'a0_{co}.png', clip={'x':cv['x']+(x-60)*k,'y':cv['y']+(y-60)*k,'width':120*k,'height':90*k})
            await pg.mouse.click(cv['x']+x*k, cv['y']+(y-8)*k)
            await pg.wait_for_function("()=>{const b=document.querySelector('.spot-bubble b');return b&&/gift/.test(b.textContent)}", timeout=30000)
            await pg.wait_for_timeout(300); await pg.screenshot(path=O+f'a1_{co}.png', clip={'x':cv['x']+(x-80)*k,'y':cv['y']+(y-90)*k,'width':160*k,'height':120*k})
            await pg.click('.spot-bubble .bubble-btn'); await pg.wait_for_timeout(600)
            h=await pg.query_selector('.gift-svg circle[fill=transparent]'); bb=await h.bounding_box(); x0,y0=bb['x']+bb['width']/2,bb['y']+bb['height']/2
            await pg.mouse.move(x0,y0); await pg.mouse.down()
            for i in range(1,30): await pg.mouse.move(x0+i*6,y0+i*5); await pg.wait_for_timeout(20)
            await pg.mouse.up(); await pg.wait_for_timeout(1600); await pg.click('text=Put it on my desk'); await pg.wait_for_timeout(600)
            await pg.screenshot(path=O+f'a2_{co}.png', clip={'x':cv['x']+(x-60)*k,'y':cv['y']+(y-60)*k,'width':120*k,'height':90*k})
        print('errors',errs); await b.close()
asyncio.run(main())
