import asyncio
from playwright.async_api import async_playwright
O='/tmp/desk/'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--autoplay-policy=no-user-gesture-required']); pg=await b.new_page(viewport={'width':1280,'height':720})
        errs=[]; pg.on('pageerror',lambda e: errs.append(str(e))); pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None)
        await pg.goto('http://localhost:4173/'); await pg.evaluate('localStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(1500)
        await pg.screenshot(path=O+'j0.png'); await pg.mouse.click(640,400)
        for i,ms in enumerate([1500,1700,900,800,900,1400,1300,1000,2200]):
            await pg.wait_for_timeout(ms); await pg.screenshot(path=O+f'j{i+1}.png')
        await pg.mouse.click(640,400)
        for i,ms in enumerate([500,700,600,1600]):
            await pg.wait_for_timeout(ms); await pg.screenshot(path=O+f'j{i+10}.png')
        print('errors',errs); await b.close()
asyncio.run(main())
