import asyncio
from playwright.async_api import async_playwright
SET="""(p)=>{const k='corner-office-demo-v1';const s=JSON.parse(localStorage.getItem(k));Object.assign(s,p);localStorage.setItem(k,JSON.stringify(s));}"""
O='/tmp/pk/'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']); pg=await b.new_page(viewport={'width':1280,'height':720})
        errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:4173/'); await pg.evaluate('localStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(400)
        await pg.evaluate(SET,{'phase':'free','name':'Mochi','lookDone':True,'coins':500}); await pg.goto('http://localhost:4173/#blindbox'); await pg.reload(); await pg.wait_for_timeout(900)
        for i in range(3): await pg.click('text=+1 hour of finished work')
        # 1: secret, torn by dragging
        await pg.evaluate("window._r=Math.random; Math.random=()=>0.995"); await pg.click('.bb-open'); await pg.evaluate("setTimeout(()=>Math.random=window._r,50)")
        await pg.wait_for_timeout(900); await pg.screenshot(path=O+'01_pack.png')
        bb=await (await pg.query_selector('.pk-pack')).bounding_box(); x0,y0=bb['x']+8,bb['y']+20
        await pg.mouse.move(x0,y0); await pg.mouse.down()
        for i in range(1,8): await pg.mouse.move(x0+i*12,y0); await pg.wait_for_timeout(30)
        await pg.screenshot(path=O+'02_tearing.png')
        for i in range(8,18): await pg.mouse.move(x0+i*12,y0); await pg.wait_for_timeout(30)
        await pg.mouse.up(); await pg.wait_for_timeout(250); await pg.screenshot(path=O+'03_burst.png')
        await pg.wait_for_timeout(700); await pg.screenshot(path=O+'04_rise.png')
        await pg.wait_for_timeout(1400); await pg.screenshot(path=O+'05_tease.png')
        await pg.wait_for_timeout(1700); await pg.screenshot(path=O+'06_flip.png')
        await pg.wait_for_timeout(900); await pg.mouse.move(700,200); await pg.wait_for_timeout(200); await pg.screenshot(path=O+'07_reveal.png')
        # 2: open another, normal, just click
        await pg.evaluate("Math.random=()=>0.1"); await pg.click('text=Open another'); await pg.wait_for_timeout(100); await pg.evaluate("Math.random=window._r")
        await pg.wait_for_timeout(800); await pg.click('.pk-pack',force=True); await pg.wait_for_timeout(200); await pg.screenshot(path=O+'08_click.png')
        await pg.wait_for_timeout(3600); await pg.screenshot(path=O+'09_reveal_normal.png')
        # 3: a short drag springs back
        await pg.evaluate("Math.random=()=>0.8"); await pg.click('text=Open another'); await pg.wait_for_timeout(100); await pg.evaluate("Math.random=window._r"); await pg.wait_for_timeout(800)
        bb=await (await pg.query_selector('.pk-pack')).bounding_box(); x0,y0=bb['x']+8,bb['y']+20
        await pg.mouse.move(x0,y0); await pg.mouse.down()
        for i in range(1,5): await pg.mouse.move(x0+i*10,y0); await pg.wait_for_timeout(30)
        await pg.mouse.up(); await pg.wait_for_timeout(400); await pg.screenshot(path=O+'10_springback.png')
        await pg.click('.pk-pack',force=True); await pg.wait_for_timeout(2700); await pg.screenshot(path=O+'11_tease_cute.png'); await pg.wait_for_timeout(1500); await pg.screenshot(path=O+'12_cute.png')
        print('errors',errs); await b.close()
asyncio.run(main())
