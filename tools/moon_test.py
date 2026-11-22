import asyncio
from playwright.async_api import async_playwright
JS="() => { const o=window.office; return [o.p.cur[0],o.p.cur[1]]; }"
SEATS={'sam':(168,58),'ada':(232,58),'kofi':(296,58),'rio':(360,58),'mei':(328,268),'bean':(392,328)}
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        pg=await b.new_page(viewport={'width':1280,'height':720}); errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:4173/'); await pg.wait_for_timeout(500)
        await pg.click('text=Moonpuff Studio'); await pg.wait_for_timeout(200); await pg.screenshot(path='/tmp/shots/m_intro.png')
        await pg.click('text=Start the first day'); await pg.wait_for_timeout(600)
        bb=await (await pg.query_selector('canvas')).bounding_box(); k=bb['width']/512; clip={'x':bb['x'],'y':0,'width':bb['width'],'height':720}
        await pg.screenshot(path='/tmp/shots/m_free.png')
        for who,(x,y) in SEATS.items():
            await pg.mouse.click(bb['x']+x*k,bb['y']+y*k); await pg.wait_for_timeout(9000)
            vis=await pg.is_visible('.menu'); print(who,'menu',vis,(await pg.inner_text('.menu b >> nth=0')) if vis else '','player at',await pg.evaluate(JS))
            await pg.screenshot(path=f'/tmp/shots/m_{who}.png',clip=clip)
        # mini-game spot
        await pg.mouse.click(bb['x']+168*k,bb['y']+67*k); await pg.wait_for_timeout(9000); print('marker -> player at',await pg.evaluate(JS),'bubble',await pg.is_visible('.spot-bubble'))
        await pg.screenshot(path='/tmp/shots/m_spot.png',clip=clip)
        # thin walls: from (8,4) to (6,4) must go round the glass
        async def go(tx,ty,w=8000): await pg.mouse.click(bb['x']+(tx*16+8)*k,bb['y']+(ty*16+8)*k); await pg.wait_for_timeout(w); return await pg.evaluate(JS)
        print('to (8,4):',await go(8,4)); await pg.mouse.click(bb['x']+(6*16+8)*k,bb['y']+(4*16+8)*k); seen=[]
        for i in range(40): seen.append(tuple(await pg.evaluate(JS))); await pg.wait_for_timeout(120)
        r=[]; [r.append(t) for t in seen if not r or r[-1]!=t]; print('route (8,4)->(6,4):',r)
        print('kitchen (10,16):',await go(10,16)); print('reception inside (19,16):',await go(19,16)); print('arcade (29,19):',await go(29,19)); print('game room (26,4):',await go(26,4))
        await pg.click('text=Settings'); await pg.click('text=Edit walk labels'); await pg.wait_for_timeout(300); await pg.screenshot(path='/tmp/shots/m_labels.png')
        await pg.click('text=Done, try walking'); await pg.click('text=Settings'); await pg.click('text=Switch to Stitchlight'); await pg.wait_for_timeout(800); await pg.screenshot(path='/tmp/shots/m_switch.png')
        print('errors',errs); await b.close()
asyncio.run(main())
