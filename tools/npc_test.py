import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']); pg=await b.new_page(viewport={'width':1280,'height':720})
        errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:4173/#npc-test'); await pg.wait_for_timeout(600); await pg.click('text=Start the first day')
        bb=await (await pg.query_selector('canvas')).bounding_box(); k=bb['width']/512
        clip={'x':bb['x'],'y':0,'width':bb['width'],'height':720}
        await pg.mouse.click(bb['x']+200*k,bb['y']+120*k)
        for i,w in enumerate((3000,4000,5000,6000,8000,10000)):
            await pg.wait_for_timeout(w); await pg.screenshot(path=f'/tmp/shots/n{i}.png',clip=clip)
        print('errors',errs); await b.close()
asyncio.run(main())
