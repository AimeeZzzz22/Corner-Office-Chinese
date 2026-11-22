import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']); pg=await b.new_page(viewport={'width':1280,'height':720})
        errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:4173/'); await pg.evaluate('localStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(300)
        await pg.evaluate("""()=>{const k='corner-office-demo-v1';const s=JSON.parse(localStorage.getItem(k));s.phase='desk';s.fast=true;s.lookDone=true;s.name='Mochi';s.desk=['lamp','clipboard','piggy'];s.place={};localStorage.setItem(k,JSON.stringify(s));}""")
        await pg.reload(); await pg.wait_for_timeout(500)
        await pg.click('.pc-hot'); await pg.wait_for_timeout(300); await pg.screenshot(path='/tmp/desk/20_desktop.png')
        await pg.click('.pc-icon'); await pg.click('.pc-take >> nth=0'); await pg.wait_for_timeout(400); await pg.screenshot(path='/tmp/desk/21_focus.png')
        await pg.click('text=Start focusing'); await pg.wait_for_timeout(1500); await pg.screenshot(path='/tmp/desk/22_work.png')
        await pg.wait_for_timeout(15000); await pg.click('text=Finished!'); await pg.wait_for_timeout(500)
        await pg.click('text=Back to my desk'); await pg.wait_for_timeout(400)
        print('phase',await pg.evaluate("JSON.parse(localStorage.getItem('corner-office-demo-v1')).phase"),'errors',errs); await b.close()
asyncio.run(main())
