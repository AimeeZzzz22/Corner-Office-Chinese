# Chases walking coworkers for a minute and checks nobody ever shares a spot
import asyncio,random
from playwright.async_api import async_playwright
JS="""() => { const o=window.office; return {p:[o.p.x,o.p.y], n:o.list.filter(n=>n.state!=='sit').map(n=>[n.id,n.x,n.y,n.state])}; }"""
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']); pg=await b.new_page(viewport={'width':1280,'height':720})
        errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:4173/#npc-test'); await pg.wait_for_timeout(600); await pg.click('text=Start the first day')
        bb=await (await pg.query_selector('canvas')).bounding_box(); k=bb['width']/512
        closest=999; samples=0; menus=0; walkers_seen=set()
        for step in range(600):
            st=await pg.evaluate(JS); samples+=1
            pts=[('me',*st['p'])]+[(n[0],n[1],n[2]) for n in st['n']]
            for n in st['n']: walkers_seen.add(n[0])
            for i in range(len(pts)):
                for j in range(i+1,len(pts)):
                    d=((pts[i][1]-pts[j][1])**2+(pts[i][2]-pts[j][2])**2)**0.5; closest=min(closest,d)
                    if d<10: print('OVERLAP',pts[i],pts[j])
            if step%12==0:
                if st['n'] and random.random()<0.7:
                    n=random.choice(st['n'])
                    # click right on a walking coworker (to talk) or on the tile just ahead of them (to get in the way)
                    dx,dy=(0,-8) if random.random()<0.5 else (random.choice((-16,16,0)),random.choice((-16,16,0)))
                    await pg.mouse.click(bb['x']+(n[1]+dx)*k,bb['y']+(n[2]+dy)*k)
                else: await pg.mouse.click(bb['x']+random.randint(180,340)*k,bb['y']+random.randint(110,330)*k)
                if await pg.is_visible('.menu'): menus+=1
            await pg.wait_for_timeout(100)
        print('samples',samples,'closest distance between any two (px, a tile is 16):',round(closest,1),'menus opened',menus,'walkers seen',sorted(walkers_seen),'errors',errs)
        await b.close()
asyncio.run(main())
