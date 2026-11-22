import asyncio,random
from playwright.async_api import async_playwright
JS="() => { const o=window.office; return [o.p.cur[0],o.p.cur[1]]; }"
JS2="""() => { const o=window.office; return {p:[o.p.x,o.p.y], n:o.list.filter(n=>n.state!=='sit').map(n=>[n.id,n.x,n.y])}; }"""
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']); pg=await b.new_page(viewport={'width':1280,'height':720})
        errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:4173/#npc-test'); await pg.wait_for_timeout(500); await pg.click('text=Moonpuff Studio'); await pg.click('text=Start the first day'); await pg.wait_for_timeout(500)
        bb=await (await pg.query_selector('canvas')).bounding_box(); k=bb['width']/512
        async def go(tx,ty,w=9000): await pg.mouse.click(bb['x']+(tx*16+8)*k,bb['y']+(ty*16+8)*k); await pg.wait_for_timeout(w); return await pg.evaluate(JS)
        await pg.mouse.click(bb['x']+168*k,bb['y']+67*k); await pg.wait_for_timeout(6000); print('marker -> player at',await pg.evaluate(JS),'bubble',await pg.is_visible('.spot-bubble'))
        await pg.screenshot(path='/tmp/shots/m_spot.png')
        # tour every room several times while coworkers wander; count arrivals
        rooms=[(10,16),(4,19),(26,4),(29,19),(19,16),(6,12),(15,8),(2,7),(23,3),(12,11)]
        miss=0; closest=999
        for rnd in range(2):
            for t in rooms:
                await pg.mouse.click(bb['x']+(t[0]*16+8)*k,bb['y']+(t[1]*16+8)*k)
                for i in range(70):
                    st=await pg.evaluate(JS2); pts=[('me',*st['p'])]+st['n']
                    for a in range(len(pts)):
                        for c in range(a+1,len(pts)): closest=min(closest,((pts[a][1]-pts[c][1])**2+(pts[a][2]-pts[c][2])**2)**0.5)
                    if [int(st['p'][0]//16),int(st['p'][1]//16)]==list(t): break
                    await pg.wait_for_timeout(150)
                at=await pg.evaluate(JS)
                if at!=list(t): miss+=1; print('did not reach',t,'stopped at',at)
        print('rooms missed',miss,'of',2*len(rooms),'| closest two people got (px):',round(closest,1),'| errors',errs); await b.close()
asyncio.run(main())
