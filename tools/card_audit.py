import asyncio
from playwright.async_api import async_playwright
SET="""(p)=>{const k='corner-office-demo-v1';const s=JSON.parse(localStorage.getItem(k));Object.assign(s,p);localStorage.setItem(k,JSON.stringify(s));}"""
CHECK="""()=>{const out=[];for(const c of document.querySelectorAll('.card,.spot-bubble,.opt,.pc-row,.chip,.btn')){const r=c.getBoundingClientRect();if(!r.width)continue;const cs=getComputedStyle(c);
 const pl=parseFloat(cs.paddingLeft),pr=parseFloat(cs.paddingRight),pt=parseFloat(cs.paddingTop),pb=parseFloat(cs.paddingBottom);
 if(c.scrollWidth>c.clientWidth+2&&cs.overflowX!=='auto'&&cs.overflowX!=='scroll')out.push(['overflowX',c.className.slice(0,40),c.scrollWidth,c.clientWidth]);
 for(const k of c.querySelectorAll('*')){if(k.closest('.pc-main')&&!c.matches('.pc-row'))continue;const q=k.getBoundingClientRect();if(!q.width||!k.childNodes.length)continue;
  if(q.right>r.right-2||q.left<r.left+2||q.bottom>r.bottom-1){if(getComputedStyle(k).position==='absolute')continue;out.push(['outside',c.className.slice(0,30),k.tagName+'.'+String(k.className).slice(0,20),Math.round(q.right-r.right),Math.round(q.bottom-r.bottom)]);break;}}
 if((c.matches('.card'))&&(pl<8||pt<6))out.push(['tight padding',c.className.slice(0,40),pl,pt]);}
 return out;}"""
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']); pg=await b.new_page(viewport={'width':1280,'height':720})
        await pg.goto('http://localhost:4173/'); await pg.evaluate('localStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(400)
        base={'name':'Mochi','lookDone':True,'look':{'body':1,'eyes':2,'top':3,'bottom':2,'hair':5,'hairColour':'Brown','acc':None},'birthday':{'m':3,'d':4}}
        screens=[('booth',{**base,'phase':'booth','lookDone':False}),('tour',{**base,'phase':'tour','tourStop':2}),('badge',{**base,'phase':'badge'}),('vibe',{**base,'phase':'vibe','vibe':'spinner','vibeDraws':0}),
          ('quiz',{**base,'phase':'quiz'}),('gifts1',{**base,'phase':'gifts','desk':['lamp'],'place':{'lamp':'desk-l1'}}),('gifts-all',{**base,'phase':'gifts','desk':['lamp','clipboard','piggy','phone'],'place':{}}),
          ('desk',{**base,'phase':'desk','desk':['lamp','clipboard','piggy','phone'],'place':{}}),('free',{**base,'phase':'free'}),('tray',{**base,'phase':'tray','picked':None})]
        for name,st in screens:
            await pg.evaluate(SET,st); await pg.reload(); await pg.wait_for_timeout(2500 if name=='tour' else 900)
            if name=='tray':
                await pg.evaluate(SET,{'phase':'free'}); await pg.reload(); await pg.wait_for_timeout(700)
            r=await pg.evaluate(CHECK); print(name, r if r else 'ok'); await pg.screenshot(path=f'/tmp/desk/audit_{name}.png')
        await pg.evaluate(SET,{**base,'phase':'desk'}); await pg.reload(); await pg.wait_for_timeout(600)
        await pg.click('.pc-hot'); await pg.click('.pc-icon'); await pg.wait_for_timeout(300); print('tasklet',await pg.evaluate(CHECK))
        for t in ['Past orders','Coworkers']:
            await pg.click(f'text={t}'); await pg.wait_for_timeout(300); print(t,await pg.evaluate(CHECK))
        await b.close()
asyncio.run(main())
