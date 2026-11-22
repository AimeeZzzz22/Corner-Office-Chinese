import asyncio
from playwright.async_api import async_playwright
JS="() => { const o=window.office; return [o.p.cur[0],o.p.cur[1], o.list.find(n=>n.id==='theo').state]; }"
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']); pg=await b.new_page(viewport={'width':1280,'height':720})
        await pg.goto('http://localhost:4173/'); await pg.wait_for_timeout(500); await pg.click('text=Start the first day')
        bb=await (await pg.query_selector('canvas')).bounding_box(); k=bb['width']/512
        async def go(tx,ty,w=6000): await pg.mouse.click(bb['x']+(tx*16+8)*k,bb['y']+(ty*16+8)*k); await pg.wait_for_timeout(w); return await pg.evaluate(JS)
        await pg.mouse.click(bb['x']+200*k,bb['y']+58*k); await pg.wait_for_timeout(9000)
        print('click Theo ->',await pg.evaluate(JS),'menu',await pg.is_visible('.menu'))
        for t in ((13,3),(13,4),(11,3),(14,3)): print('to',t,'->',await go(*t))
        await pg.screenshot(path='/tmp/shots/theo_back.png',clip={'x':bb['x'],'y':0,'width':bb['width'],'height':720})
        await b.close()
asyncio.run(main())
