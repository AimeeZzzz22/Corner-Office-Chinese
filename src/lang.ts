// The game is built in one language at a time: `npm run build` makes the English site, `npm run build:zh` the Chinese one.
// t(english, chinese) picks the text for the language this build is for.
export const ZH = import.meta.env.VITE_LANG === 'zh';
export const t = (en: string, zh: string) => (ZH ? zh : en);
// Chinese has no spaces between words, and its own punctuation
export const sp = ZH ? '' : ' ';
