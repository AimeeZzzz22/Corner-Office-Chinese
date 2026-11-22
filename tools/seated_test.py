import asyncio
from playwright.async_api import async_playwright
SEATS={'theo':(200,58),'camille':(280,58),'margaux':(424,58),'jonah':(248,140),'priya':(440,170),'odette':(248,284)}
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        for k,(x,y) in SEATS.items():
            pg=await b.new_page(viewport={'width':1280,'height':720})
            await pg.goto('http://localhost:4173/'); await pg.wait_for_timeout(500); await pg.click('text=Start the first day')
            bb=await (await pg.query_selector('canvas')).bounding_box(); s=bb['width']/512
            await pg.mouse.click(bb['x']+x*s,bb['y']+y*s); await pg.wait_for_timeout(11000)
            vis=await pg.is_visible('.menu'); print(k,'menu:',vis,(await pg.inner_text('.menu b >> nth=0')) if vis else '')
            await pg.screenshot(path=f'/tmp/shots/seat_{k}.png',clip={'x':bb['x'],'y':0,'width':bb['width'],'height':720}); await pg.close()
        await b.close()
asyncio.run(main())
