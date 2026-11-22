import asyncio
from playwright.async_api import async_playwright
JS="() => { const o=window.office; return [o.p.cur[0],o.p.cur[1]]; }"
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']); pg=await b.new_page(viewport={'width':1280,'height':720})
        await pg.goto('http://localhost:4173/'); await pg.wait_for_timeout(500); await pg.click('text=Moonpuff Studio'); await pg.click('text=Start the first day'); await pg.wait_for_timeout(500)
        bb=await (await pg.query_selector('canvas')).bounding_box(); k=bb['width']/512; clip={'x':bb['x'],'y':0,'width':bb['width'],'height':720}
        async def go(tx,ty,w=7000): await pg.mouse.click(bb['x']+(tx*16+8)*k,bb['y']+(ty*16+8)*k); await pg.wait_for_timeout(w); return await pg.evaluate(JS)
        print('to (9,3):',await go(9,3))
        await pg.mouse.click(bb['x']+(16*16+8)*k,bb['y']+(3*16+8)*k); seen=[]
        for i in range(45):
            seen.append(tuple(await pg.evaluate(JS)))
            if i==12: await pg.screenshot(path='/tmp/shots/behind.png',clip=clip)
            await pg.wait_for_timeout(120)
        r=[]; [r.append(t) for t in seen if not r or r[-1]!=t]; print('walk behind the chairs:',r)
        for who,(x,y) in {'kofi':(296,58),'rio':(360,58)}.items():
            await pg.mouse.click(bb['x']+x*k,bb['y']+y*k); await pg.wait_for_timeout(14000)
            st=await pg.evaluate("() => window.office.list.filter(n=>n.state!=='sit').map(n=>n.id)")
            print(who,'menu',await pg.is_visible('.menu'),'player at',await pg.evaluate(JS),'| standing up:',st)
        return
        print('rug centre (15,17):',await go(15,17)); await pg.screenshot(path='/tmp/shots/rug.png',clip=clip); await b.close()
asyncio.run(main())
