import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']); pg=await b.new_page(viewport={'width':1280,'height':720})
        errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:4173/'); await pg.evaluate('localStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(400)
        await pg.evaluate("""()=>{const k='corner-office-demo-v1';const s=JSON.parse(localStorage.getItem(k));s.phase='quiz';s.lookDone=true;s.name='Mochi';s.look={body:1,eyes:2,top:3,bottom:2,hair:5,hairColour:'Brown',acc:null};localStorage.setItem(k,JSON.stringify(s));}""")
        await pg.reload(); await pg.wait_for_timeout(500)
        await pg.click('text=Skip quiz'); await pg.wait_for_timeout(200); await pg.screenshot(path='/tmp/gift/00_quiz.png')
        await pg.click('text=Go to my desk'); await pg.wait_for_timeout(800); await pg.screenshot(path='/tmp/gift/01_desk.png')
        for n in range(3):
            await pg.click('.gift-mini >> nth=0', force=True); await pg.wait_for_timeout(600)
            if n==0: await pg.screenshot(path='/tmp/gift/02_box.png')
            h=await pg.query_selector('.gift-svg circle[fill=transparent]'); bb=await h.bounding_box(); x0,y0=bb['x']+bb['width']/2,bb['y']+bb['height']/2
            await pg.mouse.move(x0,y0); await pg.mouse.down()
            for i in range(1,6): await pg.mouse.move(x0+i*12,y0+i*8); await pg.wait_for_timeout(30)
            if n==0: await pg.screenshot(path='/tmp/gift/03_pulling.png')
            for i in range(6,16): await pg.mouse.move(x0+i*12,y0+i*8); await pg.wait_for_timeout(30)
            await pg.mouse.up(); await pg.wait_for_timeout(250)
            if n==0: await pg.screenshot(path='/tmp/gift/04_untie.png')
            await pg.wait_for_timeout(450)
            if n==0: await pg.screenshot(path='/tmp/gift/05_open.png')
            await pg.wait_for_timeout(900)
            if n==0: await pg.screenshot(path='/tmp/gift/06_reveal.png')
            await pg.click('text=Put it on my desk'); await pg.wait_for_timeout(400)
        await pg.screenshot(path='/tmp/gift/07_done.png')
        await pg.click('text=Wrap up orientation'); await pg.wait_for_timeout(300)
        for _ in range(8): await pg.click('.gh'); await pg.wait_for_timeout(150)
        await pg.click('.gh-clock'); await pg.wait_for_timeout(300); await pg.click('.gh-btns .btn.primary'); await pg.wait_for_timeout(800); await pg.screenshot(path='/tmp/gift/08_office.png')
        print('desk',await pg.evaluate("JSON.parse(localStorage.getItem('corner-office-demo-v1')).desk"),'errors',errs); await b.close()
asyncio.run(main())
