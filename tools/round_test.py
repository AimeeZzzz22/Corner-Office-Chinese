import asyncio
from playwright.async_api import async_playwright
O='/tmp/desk/'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']); pg=await b.new_page(viewport={'width':1280,'height':720})
        errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:4173/'); await pg.evaluate('localStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(500)
        # zip: the tab should stay under the pointer
        tab=await pg.query_selector('.tab'); bb=await tab.bounding_box(); x0,y0=bb['x']+bb['width']/2,bb['y']+bb['height']/2
        await pg.mouse.move(x0,y0); await pg.mouse.down(); offs=[]
        for i in range(1,30):
            await pg.mouse.move(x0+i*9,y0-i*0.45); await pg.wait_for_timeout(20)
            bb=await tab.bounding_box(); offs.append(round(bb['x']+bb['width']/2-(x0+i*9),1))
            if i==15: await pg.screenshot(path=O+'40_zip.png')
        print('tab centre minus pointer (px) while pulling:',offs[:6],'...',offs[-6:])
        await pg.mouse.up(); await pg.wait_for_timeout(400)
        # vibe
        await pg.evaluate("""()=>{const k='corner-office-demo-v1';const s=JSON.parse(localStorage.getItem(k));s.phase='vibe';s.lookDone=true;s.name='Mochi';localStorage.setItem(k,JSON.stringify(s));}""")
        await pg.reload(); await pg.wait_for_timeout(500)
        await pg.click('.fd >> nth=1'); await pg.wait_for_timeout(1200); await pg.screenshot(path=O+'41_shake.png')
        await pg.wait_for_timeout(800); await pg.screenshot(path=O+'42_burst.png')
        await pg.wait_for_timeout(900); await pg.screenshot(path=O+'43_reveal.png')
        # desk: gifts are 4, then the team tab
        await pg.evaluate("""()=>{const k='corner-office-demo-v1';const s=JSON.parse(localStorage.getItem(k));s.phase='gifts';s.desk=[];s.place={};localStorage.setItem(k,JSON.stringify(s));}""")
        await pg.reload(); await pg.wait_for_timeout(600); await pg.screenshot(path=O+'44_gifts.png')
        print('gifts', await pg.locator('.gift-mini').count())
        await pg.evaluate("""()=>{const k='corner-office-demo-v1';const s=JSON.parse(localStorage.getItem(k));s.phase='desk';s.desk=['lamp','clipboard','piggy','phone'];s.place={};localStorage.setItem(k,JSON.stringify(s));}""")
        await pg.reload(); await pg.wait_for_timeout(600); await pg.screenshot(path=O+'45_desk.png')
        await pg.click('.pc-hot'); await pg.click('.pc-icon'); await pg.click('text=Coworkers'); await pg.wait_for_timeout(400); await pg.screenshot(path=O+'46_team.png')
        # replay resets the look
        print('errors',errs); await b.close()
asyncio.run(main())
