import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        pg=await b.new_page(viewport={'width':1280,'height':720}); errs=[]
        pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None); pg.on('pageerror',lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:4173/'); await pg.wait_for_timeout(800); await pg.screenshot(path='/tmp/shots/1_intro.png')
        await pg.fill('.intro .field','Mochi'); await pg.click('text=Start the first day'); await pg.wait_for_timeout(500)
        cv=await pg.query_selector('canvas'); bb=await cv.bounding_box(); k=bb['width']/512
        async def clickmap(x,y): await pg.mouse.click(bb['x']+x*k,bb['y']+y*k)
        await clickmap(96,70); await pg.wait_for_timeout(2500); await pg.screenshot(path='/tmp/shots/2_spot.png')
        await clickmap(200,50); await pg.wait_for_timeout(1500); await pg.screenshot(path='/tmp/shots/3_walking.png')
        await pg.wait_for_timeout(3500); await pg.screenshot(path='/tmp/shots/4_menu.png')
        await pg.click('text=Take an order'); await pg.wait_for_timeout(300); await pg.screenshot(path='/tmp/shots/5_tray.png')
        await pg.click('text=Take this order'); await pg.wait_for_timeout(300)
        await pg.fill('.form .field','Read chapter 3'); await pg.fill('.form .field.small >> nth=0','Read pages 40 to 52'); await pg.screenshot(path='/tmp/shots/6_focus.png')
        await pg.click('text=Back to orders'); await pg.click('text=Back to the office'); await pg.click('.icon'); await pg.check('text=Fast demo time'); await pg.click('.icon')
        await pg.click('text=+ New work order'); await pg.click('.slip >> nth=0'); await pg.click('text=Take this order'); await pg.fill('.form .field','Read chapter 3'); await pg.fill('.form .field.small >> nth=0','Read pages 40 to 52')
        await pg.click('text=Start focusing'); await pg.wait_for_timeout(4000); await pg.screenshot(path='/tmp/shots/7_work.png'); print(await pg.title())
        await pg.wait_for_timeout(12500); await pg.screenshot(path='/tmp/shots/8_timesup.png')
        await pg.click('text=Finished!'); await pg.wait_for_timeout(500); await pg.screenshot(path='/tmp/shots/9_result.png')
        await pg.click('text=Back to the office'); await pg.reload(); await pg.wait_for_timeout(800); await pg.screenshot(path='/tmp/shots/10_reload.png')
        print('errors',errs); await b.close()
asyncio.run(main())
