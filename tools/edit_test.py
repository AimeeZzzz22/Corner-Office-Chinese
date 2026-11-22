import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']); pg=await b.new_page(viewport={'width':1280,'height':720})
        errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:4173/'); await pg.wait_for_timeout(600); await pg.click('text=Start the first day'); await pg.wait_for_timeout(400)
        bb=await (await pg.query_selector('canvas')).bounding_box(); k=bb['width']/512
        async def cm(x,y): await pg.mouse.click(bb['x']+x*k,bb['y']+y*k)
        await pg.click('.icon'); await pg.click('text=Edit walk labels'); await pg.wait_for_timeout(300); await pg.screenshot(path='/tmp/shots/e1.png')
        # make the right sofa's top tile free, and a floor tile solid
        await cm(296,216); await cm(296,216); await cm(120,120)
        await pg.click('text=Move panel'); await pg.wait_for_timeout(200); await pg.screenshot(path='/tmp/shots/e2.png')
        print('status:',await pg.inner_text('.editor .sub >> nth=1'))
        await pg.click('text=Done, try walking'); await cm(120,120); await pg.wait_for_timeout(4000); await pg.screenshot(path='/tmp/shots/e3.png')
        await pg.reload(); await pg.wait_for_timeout(600); await pg.click('.icon'); await pg.click('text=Edit walk labels'); await pg.wait_for_timeout(300)
        print('after reload:',await pg.inner_text('.editor .sub >> nth=1')); await pg.click("text=Reset to the map's labels"); print('after reset:',await pg.inner_text('.editor .sub >> nth=1'))
        print('errors',errs); await b.close()
asyncio.run(main())
