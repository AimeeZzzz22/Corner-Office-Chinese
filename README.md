# 角落办公室 · Corner Office（中文版）

**在线试玩：** https://aimeezzzz22.github.io/Corner-Office-Chinese/

English version: https://aimeezzzz22.github.io/Corner-Office/

一个温馨的像素风专注小游戏：你被一家小公司录用，挑好第一天的造型，领到工牌，然后在办公室里帮同事接工作单。你专注做自己现实中的事，你的角色就在工位上替你完成工作单，赚金币、攒友情、开盲包、装扮自己的工位。

## 本地运行

需要 Node.js 18 或更新版本。

```
npm install
npm run dev:zh     # 本地开发服务器（中文）
npm run build:zh   # 把中文网站构建到 dist-zh/
npm run build      # 英文网站，构建到 dist/
```

中英文用的是同一套代码：所有文字都写成 `t('English', '中文')`（见 `src/lang.ts`），构建时由 `VITE_LANG=zh` 决定用哪种语言。

## 更新网页

GitHub Pages 发布的是 `docs/` 文件夹。改完代码后运行 `npm run build:zh`，再把 `dist-zh/` 里的内容复制到 `docs/`。

## 字体

中文像素字体是 [Fusion Pixel 12px](https://github.com/TakWolf/fusion-pixel-font)（SIL Open Font License，见 `public/assets/fonts/OFL_FusionPixel.txt`）。为了让网页小一些，只保留了游戏里用到的字：改了中文文字以后，运行 `python3 tools/zh_font.py` 重新生成 `public/assets/fonts/fusion-pixel-sc.woff2`。
