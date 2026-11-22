import asyncio
from playwright.async_api import async_playwright
SET="""(p)=>{const k='corner-office-demo-v1';const s=JSON.parse(localStorage.getItem(k));Object.assign(s,p);localStorage.setItem(k,JSON.stringify(s));}"""
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']); pg=await b.new_page(viewport={'width':1280,'height':720})
        await pg.goto('http://localhost:4173/'); await pg.evaluate('localStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(400)
        await pg.evaluate(SET,{'phase':'desk','name':'Mochi','lookDone':True,'desk':['lamp'],'place':{}}); await pg.reload(); await pg.wait_for_timeout(600)
        await pg.click('.pc-hot'); await pg.click('.pc-icon'); await pg.wait_for_timeout(600)
        el=await pg.query_selector('.pc-main'); await el.screenshot(path='/tmp/desk/70_digits.png')
        await pg.evaluate(SET,{'phase':'tray','picked':None}); await pg.reload(); await pg.wait_for_timeout(800)
        await pg.evaluate(SET,{'phase':'free'}); await pg.reload(); await pg.wait_for_timeout(500)
        await pg.click('text=My desk'); await pg.wait_for_timeout(100)
        await b.close()
asyncio.run(main())
