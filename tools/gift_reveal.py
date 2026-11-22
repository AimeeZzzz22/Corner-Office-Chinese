import asyncio
from playwright.async_api import async_playwright
SET="""(p)=>{const k='corner-office-demo-v1';const s=JSON.parse(localStorage.getItem(k));Object.assign(s,p);localStorage.setItem(k,JSON.stringify(s));}"""
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']); pg=await b.new_page(viewport={'width':1280,'height':720})
        errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:4173/'); await pg.evaluate('localStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(400)
        await pg.evaluate(SET,{'phase':'gifts','name':'Mochi','lookDone':True,'desk':[],'place':{}}); await pg.reload(); await pg.wait_for_timeout(600)
        await pg.click('.gift-mini >> nth=3', force=True); await pg.wait_for_timeout(600)
        h=await pg.query_selector('.gift-svg circle[fill=transparent]'); bb=await h.bounding_box(); x0,y0=bb['x']+bb['width']/2,bb['y']+bb['height']/2
        await pg.mouse.move(x0,y0); await pg.mouse.down()
        for i in range(1,30): await pg.mouse.move(x0+i*6,y0+i*5); await pg.wait_for_timeout(20)
        await pg.mouse.up(); await pg.wait_for_timeout(250); await pg.screenshot(path='/tmp/desk/60_poof.png')
        await pg.wait_for_timeout(1400); await pg.screenshot(path='/tmp/desk/61_reveal.png')
        print(errs); await b.close()
asyncio.run(main())
