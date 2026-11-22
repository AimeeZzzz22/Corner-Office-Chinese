import asyncio
from playwright.async_api import async_playwright
O='/tmp/op/'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']); pg=await b.new_page(viewport={'width':1280,'height':720})
        errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:4173/'); await pg.evaluate('localStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(1500)
        await pg.mouse.click(640,400)
        # watch the top strip of the screen until the beam: it must stay black
        worst=0; seen=set()
        for i in range(90):
            st=await pg.evaluate("document.querySelector('.opening')?.className||''"); seen.add(st)
            if 'st-beam' in st: break
            buf=await pg.screenshot(clip={'x':0,'y':0,'width':1280,'height':12})
            from PIL import Image; import io
            im=Image.open(io.BytesIO(buf)).convert('L'); m=max(im.getdata()); worst=max(worst,m)
            if m>40: im.save(O+f'flash{i}.png')
            await pg.wait_for_timeout(60)
        print('stages',sorted(seen),'brightest top pixel before beam',worst)
        await pg.wait_for_function("document.querySelector('.opening.st-title')",timeout=30000); await pg.wait_for_timeout(3000)
        await pg.mouse.click(640,400); await pg.wait_for_timeout(2300)
        for i in range(4): await pg.screenshot(path=O+f'glint{i}.png'); await pg.wait_for_timeout(350)
        await pg.wait_for_selector('.envelope-screen.arrive',timeout=8000); await pg.wait_for_timeout(800)
        await pg.click('.envelope-screen .pill'); await pg.wait_for_selector('.lfold',timeout=8000)
        for i in range(12): await pg.screenshot(path=O+f'fold{i:02d}.png'); await pg.wait_for_timeout(200)
        await pg.wait_for_timeout(400); await pg.screenshot(path=O+'letter.png')
        print('focused', await pg.evaluate("document.activeElement?.className"), 'errors',errs); await b.close()
asyncio.run(main())
