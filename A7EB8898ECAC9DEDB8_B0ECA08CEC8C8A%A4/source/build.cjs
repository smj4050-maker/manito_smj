const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const esbuild = require('esbuild');
const base = __dirname;
cp.execFileSync(process.execPath, [require.resolve('tailwindcss/lib/cli.js'), '-i', 'styles.css', '-o', '.compiled.css', '--minify'], { cwd: base, stdio: 'inherit' });
const result = esbuild.buildSync({ entryPoints: [path.join(base, 'main.jsx')], bundle: true, minify: true, format: 'iife', target: 'es2022', write: false, legalComments: 'inline' });
const code = result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const css = fs.readFileSync(path.join(base, '.compiled.css'), 'utf8');
fs.writeFileSync(path.join(base, '..', 'index.html'), `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="referrer" content="no-referrer"><title>울장복의 미니홈피</title><style>html{font-size:16px!important;-webkit-text-size-adjust:100%;text-size-adjust:100%}body{margin:0}${css}</style></head><body><div id="root"></div><script>${code}</script></body></html>`);
fs.unlinkSync(path.join(base, '.compiled.css'));
console.log('Built ../index.html');
