import asyncio
from playwright.async_api import async_playwright
O='/tmp/desk/'
SET="""(p)=>{const k='corner-office-demo-v1';const s=JSON.parse(localStorage.getItem(k));Object.assign(s,p);localStorage.setItem(k,JSON.stringify(s));}"""
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']); pg=await b.new_page(viewport={'width':1280,'height':720})
        errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:4173/'); await pg.evaluate('localStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(400)
        await pg.evaluate(SET,{'phase':'booth','name':'Mochi'}); await pg.reload(); await pg.wait_for_timeout(700)
        print('next on skin:', await pg.locator('button:has-text("Next: Eyes")').count())
        await pg.click('button:has-text("Next: Eyes")', force=True); print('next on eyes:', await pg.locator('button:has-text("Next: Hair")').count())
        await pg.click('button:has-text("Next: Hair")', force=True); print('next on hair before pick:', await pg.locator('button:has-text("Next: Top")').count())
        # hats on big hair
        await pg.evaluate(SET,{'phase':'booth','lookDone':True,'look':{'body':1,'eyes':2,'top':3,'bottom':2,'hair':28,'hairColour':'Brown','acc':1}}); await pg.reload(); await pg.wait_for_timeout(700)
        await pg.screenshot(path=O+'50_hat.png')
        for v in ['spinner','napper','snacker','scroller','stretcher','plant']:
            await pg.evaluate(SET,{'phase':'vibe','vibe':v,'vibeDraws':0,'look':{'body':1,'eyes':2,'top':3,'bottom':2,'hair':5,'hairColour':'Brown','acc':None}}); await pg.reload(); await pg.wait_for_timeout(900)
            el=await pg.query_selector('.vcard .art'); await el.screenshot(path=O+f'51_{v}.png')
        # gifts
        await pg.evaluate(SET,{'phase':'gifts','desk':[],'place':{}}); await pg.reload(); await pg.wait_for_timeout(600)
        for n in range(4):
            await pg.click('.gift-mini >> nth=0', force=True); await pg.wait_for_timeout(600)
            h=await pg.query_selector('.gift-svg circle[fill=transparent]'); bb=await h.bounding_box(); x0,y0=bb['x']+bb['width']/2,bb['y']+bb['height']/2
            await pg.mouse.move(x0,y0); await pg.mouse.down()
            for i in range(1,30): await pg.mouse.move(x0+i*6,y0+i*5); await pg.wait_for_timeout(20)
            await pg.mouse.up(); await pg.wait_for_timeout(500)
            if n==0: await pg.screenshot(path=O+'52_unfold.png')
            await pg.wait_for_timeout(1300)
            if n==0: await pg.screenshot(path=O+'53_reveal.png')
            await pg.click('text=Put it on my desk' if n!=2 else 'text=Put it in my backpack'); await pg.wait_for_timeout(400)
        await pg.screenshot(path=O+'54_tut0.png')
        st=await (await pg.query_selector('.gift-stage')).bounding_box(); k=st['width']/1280
        await pg.mouse.click(st['x']+412*k, st['y']+500*k); await pg.wait_for_timeout(300); await pg.screenshot(path=O+'55_tut1.png')
        await pg.click('text=Put in backpack'); await pg.wait_for_timeout(300); await pg.screenshot(path=O+'56_tut2.png')
        print('place',await pg.evaluate("JSON.parse(localStorage.getItem('corner-office-demo-v1')).place"))
        print('errors',errs); await b.close()
asyncio.run(main())
