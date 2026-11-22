import asyncio
from playwright.async_api import async_playwright
JS="() => { const o=window.office; return [o.p.cur[0],o.p.cur[1]]; }"
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']); pg=await b.new_page(viewport={'width':1280,'height':720})
        await pg.goto('http://localhost:4173/'); await pg.wait_for_timeout(500); await pg.click('text=Start the first day')
        bb=await (await pg.query_selector('canvas')).bounding_box(); k=bb['width']/512
        async def go(tx,ty,w=7000): await pg.mouse.click(bb['x']+(tx*16+8)*k,bb['y']+(ty*16+8)*k); await pg.wait_for_timeout(w); return await pg.evaluate(JS)
        print('to (15,4) beside Theo wall:',await go(15,4)); await pg.screenshot(path='/tmp/shots/t1.png',clip={'x':bb['x'],'y':0,'width':bb['width'],'height':720})
        # from (15,4), going to (16,4) must walk round the wall, not through it: sample the route
        await pg.mouse.click(bb['x']+(16*16+8)*k,bb['y']+(4*16+8)*k); seen=[]
        for i in range(40): seen.append(tuple(await pg.evaluate(JS))); await pg.wait_for_timeout(120)
        r=[]; [r.append(t) for t in seen if not r or r[-1]!=t]; print('route (15,4)->(16,4):',r)
        print('to printer nook (21,5):',await go(21,5)); print('to (22,4):',await go(22,4,3000)); await pg.screenshot(path='/tmp/shots/t2.png',clip={'x':bb['x'],'y':0,'width':bb['width'],'height':720})
        await pg.mouse.click(bb['x']+(23*16+8)*k,bb['y']+(4*16+8)*k); seen=[]
        for i in range(50): seen.append(tuple(await pg.evaluate(JS))); await pg.wait_for_timeout(120)
        r=[]; [r.append(t) for t in seen if not r or r[-1]!=t]; print('route (22,4)->(23,4):',r)
        await b.close()
asyncio.run(main())
