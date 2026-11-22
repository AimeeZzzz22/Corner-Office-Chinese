import asyncio,sys
from playwright.async_api import async_playwright
WANT=sys.argv[1]
JS="""() => { const o=window.office; const h=o.list.find(n=>n.state!=='sit' && (n.id==='mei'||n.id==='odette')); return {p:[o.p.cur[0],o.p.cur[1]], h:h?[h.cur[0],h.cur[1],h.path.length]:null, follow:o.p.follow}; }"""
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']); pg=await b.new_page(viewport={'width':1280,'height':720})
        errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
        for i in range(12):
            await pg.goto('http://localhost:4173/'); await pg.evaluate('localStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(400)
            if await pg.evaluate("JSON.parse(localStorage.getItem('corner-office-demo-v1')||'{}').company")==WANT: break
        await pg.evaluate("(()=>{const s=JSON.parse(localStorage.getItem('corner-office-demo-v1'));s.phase='tour';s.tourStop=0;s.lookDone=true;localStorage.setItem('corner-office-demo-v1',JSON.stringify(s));})()")
        await pg.reload(); await pg.wait_for_timeout(1500)
        stops=await pg.locator('.dots i').count(); bad=0; far=0; total=0
        for i in range(1,stops):
            await pg.click('text=Next stop'); hseen=[]; pseen=[]
            for k in range(110):
                st=await pg.evaluate(JS)
                if st['h']: hseen.append(tuple(st['h'][:2]))
                pseen.append(tuple(st['p']))
                if st['h'] and st['h'][2]==0 and not st['follow'] and k>4: break
                await pg.wait_for_timeout(120)
            # every tile the player stepped on during the walk should be one the guide stepped on first (except the final spot)
            hs=set(hseen); ps=[t for j,t in enumerate(pseen) if j==0 or t!=pseen[j-1]]
            off=[t for t in ps[1:-1] if t not in hs]; total+=len(ps); bad+=len(off)
            print('stop',i+1,'player steps',len(ps),'guide steps',len(set(hseen)),'end player',ps[-1],'guide',hseen[-1] if hseen else None,'follow',st['follow'],'off',off[:3])
        print('steps off the guide trail:',bad,'of',total,'errors',errs); await b.close()
asyncio.run(main())
