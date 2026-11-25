# Walks the whole first-day guide in a browser (serve dist/ or dist-zh/ on :4173 first): python3 tools/guide_test.py <company> [en|zh] [start step]
import asyncio, sys, json
from playwright.async_api import async_playwright
co=sys.argv[1]; lang=sys.argv[2] if len(sys.argv)>2 else 'en'
KEY='corner-office-demo-v1'+('-zh' if lang=='zh' else '')
SET="""(p)=>{const k='%s';const s=JSON.parse(localStorage.getItem(k));Object.assign(s,p);localStorage.setItem(k,JSON.stringify(s));}"""%KEY
STEPS=None
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']); pg=await b.new_page(viewport={'width':1280,'height':720})
        errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:4173/'); await pg.evaluate('localStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(400)
        base={'name':'Aimee','company':co,'lookDone':True,'look':{'body':1,'eyes':2,'top':3,'bottom':2,'hair':5,'hairColour':'Brown','acc':None},'birthday':{'m':3,'d':4},'phase':'free','guide':int(sys.argv[3]) if len(sys.argv)>3 else 0,'surprise':'waiting','fast':True,
              'desk':['lamp','clipboard','piggy','phone'],'place':{'lamp':'desk-l1'},'vibe':'spinner'}
        await pg.evaluate(SET,base); await pg.reload(); await pg.wait_for_timeout(1500)
        async def hole():
            r=await pg.evaluate("(()=>{const e=document.querySelector('.coach-hole');if(!e)return null;const r=e.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]})()"); return r
        last=None; same=0; seen=[]
        for it in range(200):
            g=await pg.evaluate("JSON.parse(localStorage.getItem('%s')).guide"%KEY)
            if g<0: print('guide finished'); break
            sid=await pg.evaluate("document.querySelector('.coach-say b')?.textContent||''")
            if g!=last:
                seen.append(g); await pg.screenshot(path=f'/tmp/gd/{co}_{lang}_{g:02d}.png'); last=g; same=0
            else: same+=1
            if same>25: print('stuck at',g,sid); await pg.screenshot(path=f'/tmp/gd/stuck_{g}.png'); break
            okb=await pg.query_selector('.coach-say .btn')
            if okb: await okb.click(); await pg.wait_for_timeout(400); continue
            # special cases
            if await pg.query_selector('.gift-svg'):
                h=await pg.query_selector('.gift-svg circle[fill=transparent]'); bb=await h.bounding_box(); x0,y0=bb['x']+bb['width']/2,bb['y']+bb['height']/2
                await pg.mouse.move(x0,y0); await pg.mouse.down()
                for i in range(1,30): await pg.mouse.move(x0+i*6,y0+i*5); await pg.wait_for_timeout(20)
                await pg.mouse.up(); await pg.wait_for_timeout(1800)
                await pg.click('.gift-modal .btn.primary', timeout=5000)
                await pg.wait_for_timeout(500); continue
            if await pg.query_selector('.mail-dim'):
                for sel in ['text=/^(Keep the note|收好这封信)$/','.mail-scene .btn.primary','.mail-env','.mail-zip','.mail-scene']:
                    e=await pg.query_selector(sel)
                    if e and await e.is_visible():
                        try: await e.click(timeout=1500)
                        except Exception: pass
                        await pg.wait_for_timeout(900); break
                continue
            hidden=not await pg.query_selector('.coach-say')
            tk=await pg.query_selector('text=/^(Take it|拿走)$/')
            if hidden and tk and await tk.is_visible(): await tk.click(); await pg.wait_for_timeout(500); continue
            if hidden:
                # a window of its own is open: close it
                for sel in ['.bakery .bb-x','.fridge .bb-x','.bb-x','.wr-x','[aria-label="Close"]','[aria-label="关闭"]']:
                    e=await pg.query_selector(sel)
                    if e and await e.is_visible():
                        await e.click(); await pg.wait_for_timeout(500); break
                else:
                    await pg.wait_for_timeout(500)
                continue
            if await pg.query_selector('.panel .form .field'):
                await pg.fill('.panel .form .field','Read chapter 3')
            c=await hole()
            if c: await pg.mouse.click(c[0],c[1])
            await pg.wait_for_timeout(1200 if g<20 else 700)
        print('steps seen',seen); print('errors',errs)
        await b.close()
asyncio.run(main())
