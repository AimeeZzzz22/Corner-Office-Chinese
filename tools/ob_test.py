import asyncio,sys
from playwright.async_api import async_playwright
WANT=sys.argv[1]
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']); pg=await b.new_page(viewport={'width':1280,'height':720})
        errs=[]; pg.on('pageerror',lambda e: errs.append(str(e))); pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None)
        for i in range(12):
            await pg.goto('http://localhost:4173/'); await pg.evaluate('localStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(500)
            co=await pg.evaluate("JSON.parse(localStorage.getItem('corner-office-demo-v1')||'{}').company")
            if co==WANT: break
        n=[0]
        async def shot(tag,w=400): await pg.wait_for_timeout(w); n[0]+=1; await pg.screenshot(path=f'/tmp/ob/{WANT[:4]}_{n[0]:02d}_{tag}.png')
        await shot('envelope'); await pg.click('.envelope'); await shot('letter')
        await pg.fill('.dear input','Mochi'); await pg.click('.sign'); await shot('signed'); await pg.click('.accept'); await shot('hired',600)
        await pg.click('.next-pill'); await shot('tour1',1500)
        stops=await pg.locator('.dots i').count()
        for i in range(1,stops):
            await pg.click('text=Next stop'); await shot(f'tour{i+1}',6000 if i<3 else 4500)
        await pg.click('text=Take my badge photo'); await shot('booth_hair',1200)
        await pg.click('.tiles .tile >> nth=5'); await pg.click('.swatches .sw >> nth=9'); await shot('booth_hair2')
        await pg.click('.tabs >> text=Outfit'); await pg.click('.tiles .tile >> nth=3'); await shot('booth_outfit')
        await pg.click('.tabs >> text=Extras'); await shot('booth_extras')
        await pg.click('text=Next: pet & birthday'); await pg.click('.pets .tile >> nth=3')
        await pg.select_option('.bday select >> nth=0','2'); await pg.select_option('.bday select >> nth=1','14'); await shot('booth_pet')
        await pg.click('.booth-panel >> text=Take my badge photo'); await shot('badge',900)
        await pg.click('.badge-btns >> text=Continue'); await shot('vibe_cards')
        await pg.click('.fd >> nth=1'); await shot('vibe_reveal',700)
        await pg.click('text=Draw again'); await pg.click('.fd >> nth=0'); await pg.click('text=Draw again'); await pg.click('.fd >> nth=2'); await shot('vibe_final',700)
        await pg.click('.vibe-card >> text=Continue'); await shot('quiz1')
        await pg.click('.opt2 >> nth=1'); await pg.click('text=Next'); await pg.click('.opt2 >> nth=1'); await pg.click('text=Next'); await shot('quiz3')
        await pg.click('.opt2 >> nth=0'); await pg.click('text=See my work style'); await shot('quiz_sum')
        await pg.click('text=Start my first work order'); await shot('tray',1200)
        await pg.click('text=Take this order'); await pg.fill('.form .field','Read chapter 3'); await pg.click('text=Start focusing'); await shot('work',1500)
        print('errors',errs); await b.close()
asyncio.run(main())
