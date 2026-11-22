import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']); pg=await b.new_page(viewport={'width':1280,'height':720})
        errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:4173/'); await pg.evaluate('localStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(300)
        await pg.evaluate("""()=>{const k='corner-office-demo-v1';const s=JSON.parse(localStorage.getItem(k));s.phase='booth';s.name='Mochi';localStorage.setItem(k,JSON.stringify(s));}""")
        await pg.reload(); await pg.wait_for_timeout(600); await pg.screenshot(path='/tmp/gift/b0.png')
        await pg.click('.tiles .tile >> nth=2'); await pg.wait_for_timeout(200); await pg.screenshot(path='/tmp/gift/b1.png')
        for i in range(6):
            btn=pg.locator('button:has-text("Next:")')
            if await btn.count()==0: break
            await btn.first.click(); await pg.wait_for_timeout(150)
            t=pg.locator('.tiles .tile >> nth=1')
            if await t.count(): await t.click(force=True); await pg.wait_for_timeout(150)
        await pg.screenshot(path='/tmp/gift/b2.png')
        print('errors',errs); await b.close()
asyncio.run(main())
