import asyncio
from playwright.async_api import async_playwright
JS="""() => window.office.list.map(n=>[n.id,n.state,n.cur[0],n.cur[1],n.dir,n.moving,!!n.glide,n.path.length, n.path[0]? (n.path[0][0]-n.cur[0])+','+(n.path[0][1]-n.cur[1]) : ''])"""
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']); pg=await b.new_page(viewport={'width':1280,'height':720})
        errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:4173/#npc-test'); await pg.evaluate('localStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(300)
        await pg.evaluate("(()=>{const s=JSON.parse(localStorage.getItem('corner-office-demo-v1'));s.company='moonpuff';s.phase='free';s.lookDone=true;localStorage.setItem('corner-office-demo-v1',JSON.stringify(s));})()")
        await pg.reload(); await pg.wait_for_timeout(500)
        trips={}; flips=0; steps=0; last={}; prev={}; appear=0
        for i in range(400):
            st=await pg.evaluate(JS)
            for n in st:
                idd,state,x,y,d,mv,gl,pl,dl=n
                if state!='sit' and prev.get(idd)=='sit' and not gl: appear+=1          # left the chair without the stand-up slide
                if state=='out' and prev.get(idd)=='sit': trips[idd]=trips.get(idd,0)+1
                if mv and not gl and idd in last and last[idd][0]==(x,y):
                    if last[idd][1]!=d: flips+=1; print('turn',idd,last[idd],'->',d,'step',dl,'pathlen',pl,'state',state)
                if mv and not gl: steps+=1
                last[idd]=((x,y),d); prev[idd]=state
            await pg.wait_for_timeout(100)
        print('trips taken in ~40s at 60x (about 40 office-minutes):',trips)
        print('turns while walking within a single tile:',flips,'of',steps,'walking samples; left the chair without standing up:',appear,'errors',errs)
        await b.close()
asyncio.run(main())
