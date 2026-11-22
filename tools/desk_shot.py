import asyncio,sys
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']); pg=await b.new_page(viewport={'width':1280,'height':720})
        errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:4173/'); await pg.evaluate('localStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(300)
        await pg.evaluate("""()=>{const k='corner-office-demo-v1';const s=JSON.parse(localStorage.getItem(k));s.phase='desk';s.lookDone=true;s.name='Mochi';s.look={body:1,eyes:2,top:3,bottom:2,hair:5,hairColour:'Brown',acc:null};s.desk=['lamp','clipboard','piggy'];s.place={};localStorage.setItem(k,JSON.stringify(s));}""")
        await pg.reload(); await pg.wait_for_timeout(900); await pg.screenshot(path='/tmp/desk/30_desk.png')
        print(errs); await b.close()
asyncio.run(main())
