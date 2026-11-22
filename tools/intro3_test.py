import asyncio
from playwright.async_api import async_playwright
O='/tmp/desk/'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']); pg=await b.new_page(viewport={'width':1280,'height':720})
        errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:4173/'); await pg.evaluate('localStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(1500)
        await pg.mouse.click(640,400); t=0
        for i,at in enumerate([3500,5500,7000,8500,10500,14500,15500,17000,19500]):
            await pg.wait_for_timeout(at-t); t=at; await pg.screenshot(path=O+f'k{i}.png')
        await pg.mouse.click(640,400)
        for i,ms in enumerate([700,800,1100,2500]):
            await pg.wait_for_timeout(ms); await pg.screenshot(path=O+f'k{i+9}.png')
        print('errors',errs); await b.close()
asyncio.run(main())
