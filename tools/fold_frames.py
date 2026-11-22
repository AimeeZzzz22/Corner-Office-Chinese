import asyncio, sys
from playwright.async_api import async_playwright
O='/tmp/op/'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']); pg=await b.new_page(viewport={'width':1280,'height':720})
        await pg.goto('http://localhost:4173/'); await pg.evaluate('localStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(800)
        await pg.click('.intro-skip'); await pg.wait_for_selector('.envelope-screen .pill'); await pg.wait_for_timeout(600)
        await pg.click('.envelope-screen .pill'); await pg.wait_for_selector('.lfold',timeout=8000)
        await pg.evaluate("document.getAnimations().forEach(a=>a.pause())"); await pg.evaluate("document.querySelector('.lfold').style.cssText+=';--zt:1px;--zb:3px'"); await pg.evaluate("document.querySelector('.lfold').style.cssText+=';--zt:3px;--zb:1px'"); await pg.evaluate("document.querySelector('.lfold').style.cssText+=';--zt:-3px;--zb:-1px'")
        for t in [650]:
            await pg.evaluate(f"document.querySelectorAll('.lfold, .lfold *').forEach(el=>el.getAnimations().forEach(a=>a.currentTime={t}))")
            await pg.wait_for_timeout(60); await pg.screenshot(path=O+f'ff{t:04d}.png',clip={'x':290,'y':0,'width':700,'height':720})
        await b.close()
asyncio.run(main())
