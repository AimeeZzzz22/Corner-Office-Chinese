import asyncio,sys
from playwright.async_api import async_playwright
WANT=sys.argv[1]
JS="""() => { const o=window.office; if(!o) return null; return {p:[o.p.cur[0],o.p.cur[1],o.p.path.length], n:o.list.map(n=>[n.id,n.cur[0],n.cur[1],n.path.length,n.state,n.path[0]||null,n.hold,n.moving,n.wait.toFixed(1)])}; }"""
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']); pg=await b.new_page(viewport={'width':1280,'height':720})
        errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
        for i in range(12):
            await pg.goto('http://localhost:4173/#npc-test'); await pg.evaluate('localStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(400)
            if await pg.evaluate("JSON.parse(localStorage.getItem('corner-office-demo-v1')||'{}').company")==WANT: break
        await pg.screenshot(path=f'/tmp/ob2/{WANT[:4]}_01_env.png')
        tab=await pg.query_selector('.tab'); bb=await tab.bounding_box(); x0,y0=bb['x']+bb['width']/2,bb['y']+bb['height']/2
        await pg.mouse.move(x0,y0); await pg.mouse.down()
        for i in range(1,9): await pg.mouse.move(x0+i*25,y0+i*-1.3)
        await pg.screenshot(path=f'/tmp/ob2/{WANT[:4]}_02_pulling.png')
        for i in range(9,24): await pg.mouse.move(x0+i*25,y0+i*-1.3)
        await pg.mouse.up(); await pg.wait_for_timeout(700); await pg.screenshot(path=f'/tmp/ob2/{WANT[:4]}_03_opening.png')
        await pg.wait_for_timeout(1400); await pg.screenshot(path=f'/tmp/ob2/{WANT[:4]}_04_letter.png')
        await pg.fill('.dear input','Mochi'); await pg.click('.sign'); await pg.click('.accept'); await pg.wait_for_timeout(500); await pg.click('.next-pill'); await pg.wait_for_timeout(800)
        await pg.screenshot(path=f'/tmp/ob2/{WANT[:4]}_05_look.png')
        await pg.click('.tabs >> text=Eyes'); await pg.screenshot(path=f'/tmp/ob2/{WANT[:4]}_06_eyes.png')
        await pg.click('.tabs >> text=Hair'); await pg.click('.tiles .tile >> nth=27'); await pg.click('.swatches .sw >> nth=9'); await pg.screenshot(path=f'/tmp/ob2/{WANT[:4]}_07_hair.png')
        await pg.click("text=Next: pet & birthday"); await pg.click("text=I'm ready for day one"); await pg.wait_for_timeout(1500)
        stops=await pg.locator('.dots i').count(); stuck={}; worst=0
        for i in range(1,stops):
            await pg.click('text=Next stop')
            trail=[]
            for k in range(40):
                st=await pg.evaluate(JS); trail.append(tuple(st['p'][:2]))
                for n in st['n']:
                    if n[3]>0:
                        key=(n[0],n[1],n[2]); prev=stuck.get(n[0]); stuck[n[0]]=(key,prev[1]+1) if prev and prev[0]==key else (key,1); worst=max(worst,stuck[n[0]][1])
                        if stuck[n[0]][1] in (12,25): print('stuck',n,'player',st['p'],'others',[(m[0],m[1],m[2],m[4]) for m in st['n'] if m[4]!='sit'])
                    else: stuck.pop(n[0],None)
                if st['p'][2]==0 and k>5: break
                await pg.wait_for_timeout(150)
            if i in (4,5): await pg.screenshot(path=f'/tmp/ob2/{WANT[:4]}_tour{i+1}.png')
        print('longest any walking coworker stayed stuck (checks of 0.15s+):',worst)
        print('errors',errs); await b.close()
asyncio.run(main())
