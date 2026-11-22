import asyncio
from playwright.async_api import async_playwright
JS="""() => { const o=window.office; return {c:[o.p.cur[0],o.p.cur[1]], p:[o.p.x,o.p.y], n:o.list.filter(n=>n.state!=='sit').map(n=>[n.id,n.x,n.y])}; }"""
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']); pg=await b.new_page(viewport={'width':1280,'height':720})
        errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:4173/#npc-test'); await pg.wait_for_timeout(500); await pg.click('text=Moonpuff Studio'); await pg.click('text=Start the first day'); await pg.wait_for_timeout(500)
        bb=await (await pg.query_selector('canvas')).bounding_box(); k=bb['width']/512
        rooms=[(10,16),(4,19),(26,4),(29,19),(19,16),(6,12),(15,8),(2,7),(23,3),(12,11)]
        miss=0; closest=999; times=[]
        for t in rooms:
            await pg.mouse.click(bb['x']+(t[0]*16+8)*k,bb['y']+(t[1]*16+8)*k); n=0
            while n<60:
                st=await pg.evaluate(JS); pts=[('me',*st['p'])]+st['n']
                for a in range(len(pts)):
                    for c in range(a+1,len(pts)): closest=min(closest,((pts[a][1]-pts[c][1])**2+(pts[a][2]-pts[c][2])**2)**0.5)
                if st['c']==list(t): break
                await pg.wait_for_timeout(200); n+=1
            times.append(n)
            if st['c']!=list(t): miss+=1; print('did not reach',t,'stopped at',st['c'])
        print('rooms reached',len(rooms)-miss,'of',len(rooms),'| checks per trip',times,'| closest two people (px):',round(closest,1),'| errors',errs); await b.close()
asyncio.run(main())
