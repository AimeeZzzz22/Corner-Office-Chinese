import asyncio
from playwright.async_api import async_playwright
STOPS=[('sofa',296,216,2500),('bakery',420,300,2500),('bakery2',420,300,6000),('tree',340,160,7000),('kitchen',84,292,8000),('priya',440,170,9000)]
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']); pg=await b.new_page(viewport={'width':1280,'height':720})
        errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:4173/'); await pg.wait_for_timeout(600); await pg.click('text=Start the first day'); await pg.wait_for_timeout(400)
        bb=await (await pg.query_selector('canvas')).bounding_box(); k=bb['width']/512
        for n,x,y,w in STOPS:
            await pg.mouse.click(bb['x']+x*k,bb['y']+y*k); await pg.wait_for_timeout(w); await pg.screenshot(path=f'/tmp/shots/w_{n}.png',clip={'x':bb['x'],'y':0,'width':bb['width'],'height':720})
        print('errors',errs); await b.close()
asyncio.run(main())
