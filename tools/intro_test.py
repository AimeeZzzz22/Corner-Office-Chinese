import asyncio
from playwright.async_api import async_playwright
O='/tmp/desk/'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']); pg=await b.new_page(viewport={'width':1280,'height':720})
        errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:4173/'); await pg.evaluate('localStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(2600)
        await pg.screenshot(path=O+'i0.png')
        await pg.mouse.click(640,500)
        for i,ms in enumerate([350,700,350,500,600,1000,800,700,600]):
            await pg.wait_for_timeout(ms); await pg.screenshot(path=O+f'i{i+1}.png')
        r1=await pg.evaluate("(()=>{const e=document.querySelector('.zip');return e?JSON.stringify(e.getBoundingClientRect()):null})()")
        print('zip rect',r1,'errors',errs); await b.close()
asyncio.run(main())
