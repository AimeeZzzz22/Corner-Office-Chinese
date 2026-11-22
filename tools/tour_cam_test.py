import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']); pg=await b.new_page(viewport={'width':1280,'height':720})
        errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:4173/'); await pg.evaluate('localStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(300)
        await pg.evaluate("(()=>{const s=JSON.parse(localStorage.getItem('corner-office-demo-v1'));s.company='stitchlight';s.phase='tour';s.tourStop=0;s.lookDone=true;localStorage.setItem('corner-office-demo-v1',JSON.stringify(s));})()")
        await pg.reload(); await pg.wait_for_timeout(400); print('card at start (should be no):',await pg.is_visible('.tour-card'))
        await pg.wait_for_timeout(1500); print('card after arriving:',await pg.is_visible('.tour-card'))
        await pg.wait_for_timeout(300); await pg.screenshot(path='/tmp/t4/a_typing.png')
        await pg.wait_for_timeout(4000); await pg.screenshot(path='/tmp/t4/b_typed.png')
        await pg.click('text=Next stop'); await pg.wait_for_timeout(1500)
        print('card while walking (should be no):',await pg.is_visible('.tour-card')); await pg.screenshot(path='/tmp/t4/c_walking.png')
        for i in range(40):
            await pg.wait_for_timeout(250)
            if await pg.is_visible('.tour-card'): print('card appeared after ~',1.5+i*0.25,'s'); break
        await pg.wait_for_timeout(500); await pg.screenshot(path='/tmp/t4/d_arrived.png')
        print('errors',errs); await b.close()
asyncio.run(main())
