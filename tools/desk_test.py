import asyncio
from playwright.async_api import async_playwright
O='/tmp/desk/'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']); pg=await b.new_page(viewport={'width':1280,'height':720})
        errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:4173/'); await pg.evaluate('localStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(400)
        await pg.evaluate("""()=>{const k='corner-office-demo-v1';const s=JSON.parse(localStorage.getItem(k));s.phase='quiz';s.lookDone=true;s.name='Mochi';s.look={body:1,eyes:2,top:3,bottom:2,hair:5,hairColour:'Brown',acc:null};localStorage.setItem(k,JSON.stringify(s));}""")
        await pg.reload(); await pg.wait_for_timeout(500)
        await pg.click('text=Skip quiz'); await pg.click('text=Go to my desk'); await pg.wait_for_timeout(800)
        for n in range(3):
            await pg.click('.gift-mini >> nth=0', force=True); await pg.wait_for_timeout(600)
            if n==0: await pg.screenshot(path=O+'02_box.png')
            h=await pg.query_selector('.gift-svg circle[fill=transparent]'); bb=await h.bounding_box(); x0,y0=bb['x']+bb['width']/2,bb['y']+bb['height']/2
            await pg.mouse.move(x0,y0); await pg.mouse.down()
            for i in range(1,8): await pg.mouse.move(x0+i*6,y0+i*5); await pg.wait_for_timeout(30)
            if n==0: await pg.wait_for_timeout(200); await pg.screenshot(path=O+'03_pulling.png')
            for i in range(8,30): await pg.mouse.move(x0+i*6,y0+i*5); await pg.wait_for_timeout(25)
            await pg.mouse.up(); await pg.wait_for_timeout(150)
            if n==0: await pg.screenshot(path=O+'04_untie.png')
            await pg.wait_for_timeout(600)
            if n==0: await pg.screenshot(path=O+'05_open.png')
            await pg.wait_for_timeout(900)
            if n==0: await pg.screenshot(path=O+'06_reveal.png')
            await pg.click('text=Put it on my desk'); await pg.wait_for_timeout(400)
        await pg.click('text=Head into the office'); await pg.wait_for_timeout(1200)
        await pg.click('text=My desk'); await pg.wait_for_timeout(6000); await pg.screenshot(path=O+'07_desk.png')
        print('phase',await pg.evaluate("JSON.parse(localStorage.getItem('corner-office-demo-v1')).phase"))
        # drag the piggy to a right shelf
        st=await (await pg.query_selector('.gift-stage')).bounding_box(); k=st['width']/1280
        P=lambda x,y:(st['x']+x*k, st['y']+y*k)
        x,y=P(772,430); await pg.mouse.move(x,y); await pg.mouse.down()
        for i in range(1,12): tx,ty=P(772+(990-772)*i/11, 430+(330-430)*i/11); await pg.mouse.move(tx,ty); await pg.wait_for_timeout(30)
        await pg.screenshot(path=O+'08_dragging.png')
        await pg.mouse.up(); await pg.wait_for_timeout(300)
        # click the clipboard -> menu
        x,y=P(524,450); await pg.mouse.click(x,y); await pg.wait_for_timeout(300); await pg.screenshot(path=O+'09_menu.png')
        await pg.click('text=Put away'); await pg.wait_for_timeout(300)
        await pg.click('.desk-storage .linkish'); await pg.wait_for_timeout(300); await pg.screenshot(path=O+'10_storage.png')
        print('place',await pg.evaluate("JSON.parse(localStorage.getItem('corner-office-demo-v1')).place"))
        await pg.click('.pc-hot'); await pg.wait_for_timeout(500); await pg.screenshot(path=O+'11_desktop.png')
        await pg.click('.pc-icon'); await pg.wait_for_timeout(500); await pg.screenshot(path=O+'12_tasklet.png')
        await pg.click('.pc-win .wd-close'); await pg.click('text=Leave the computer'); await pg.click('text=Back to the office'); await pg.wait_for_timeout(800); await pg.screenshot(path=O+'13_office.png')
        print('errors',errs); await b.close()
asyncio.run(main())
