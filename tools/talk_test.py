import asyncio
from playwright.async_api import async_playwright
JS="""() => { const o=window.office; return {p:[o.p.x,o.p.y], n:o.list.filter(n=>n.state!=='sit').map(n=>[n.id,n.x,n.y,n.state,n.moving])}; }"""
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']); pg=await b.new_page(viewport={'width':1280,'height':720})
        await pg.goto('http://localhost:4173/#npc-test'); await pg.wait_for_timeout(600); await pg.click('text=Start the first day')
        bb=await (await pg.query_selector('canvas')).bounding_box(); k=bb['width']/512
        await pg.mouse.click(bb['x']+250*k,bb['y']+120*k); await pg.wait_for_timeout(5000)
        ok=0
        for t in range(4):
            st=await pg.evaluate(JS)
            if not st['n']: await pg.wait_for_timeout(2000); continue
            n=st['n'][0]; await pg.mouse.click(bb['x']+n[1]*k,bb['y']+(n[2]-8)*k); await pg.wait_for_timeout(6000)
            vis=await pg.is_visible('.menu'); st2=await pg.evaluate(JS); who=[m for m in st2['n'] if m[0]==n[0]]
            d=((st2['p'][0]-who[0][1])**2+(st2['p'][1]-who[0][2])**2)**0.5 if who else None
            print(n[0],'menu',vis,'name', (await pg.inner_text('.menu b >> nth=0')) if vis else '-', 'still moving',who[0][4] if who else None,'distance',d); ok+=vis
            if t==0: await pg.screenshot(path='/tmp/shots/talk.png')
            await pg.mouse.click(bb['x']+250*k,bb['y']+125*k); await pg.wait_for_timeout(2500)
        await b.close()
asyncio.run(main())
