import asyncio
from playwright.async_api import async_playwright
SET="""(p)=>{const k='corner-office-demo-v1';const s=JSON.parse(localStorage.getItem(k));Object.assign(s,p);localStorage.setItem(k,JSON.stringify(s));}"""
O='/tmp/desk/'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']); pg=await b.new_page(viewport={'width':1280,'height':720})
        errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:4173/'); await pg.evaluate('localStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(400)
        await pg.evaluate(SET,{'phase':'free','name':'Mochi','lookDone':True,'coins':120}); await pg.goto('http://localhost:4173/#blindbox'); await pg.reload(); await pg.wait_for_timeout(900)
        await pg.screenshot(path=O+'80_empty.png')
        await pg.click('text=+1 hour of finished work'); await pg.click('text=+15 min of finished work'); await pg.click('text=+1 hour of finished work'); await pg.wait_for_timeout(600)
        await pg.screenshot(path=O+'81_ready.png')
        await pg.click('.bb-open'); await pg.wait_for_timeout(1200); await pg.screenshot(path=O+'82_shake.png')
        await pg.wait_for_timeout(1500); await pg.screenshot(path=O+'83_reveal.png')
        await pg.click('text=Open another'); await pg.wait_for_timeout(2900); await pg.screenshot(path=O+'84_reveal2.png')
        await pg.click('.bb-btns >> text=Done'); await pg.click('text=Check the odds'); await pg.wait_for_timeout(300); await pg.screenshot(path=O+'85_after.png')
        st=await pg.evaluate("JSON.parse(localStorage.getItem('corner-office-demo-v1'))"); print('coins',st['coins'],'blind',st['blind'],'pack',st['pack'])
        print(await pg.inner_text('.bb-sim'))
        # tasklet tweaks
        await pg.goto('http://localhost:4173/'); await pg.evaluate(SET,{'phase':'desk','desk':['lamp'],'place':{}}); await pg.reload(); await pg.wait_for_timeout(600)
        await pg.click('.pc-hot'); await pg.wait_for_timeout(300); await pg.screenshot(path=O+'86_icon.png')
        await pg.click('.pc-icon'); await pg.wait_for_timeout(300); print('focused:', await pg.inner_text('.pc-stats div:nth-child(2)'))
        print('errors',errs); await b.close()
asyncio.run(main())
