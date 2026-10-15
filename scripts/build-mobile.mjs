// Native WebViews load one classic script, so local modules do not need a web server.
import {build} from '../native/node_modules/esbuild/lib/main.js';
import {cp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),output=path.join(root,'releases/mobile-www');
await rm(output,{recursive:true,force:true});await mkdir(output,{recursive:true});
await cp(path.join(root,'star-abyss/assets'),path.join(output,'assets'),{recursive:true});
for(const name of ['style.css','mobile.css','CREDITS.md','PLAY.md'])await cp(path.join(root,'star-abyss',name),path.join(output,name));
const html=(await readFile(path.join(root,'star-abyss/index.html'),'utf8')).replace('<script type="module" src="game.js"></script>','<script defer src="game.bundle.js"></script>');await writeFile(path.join(output,'index.html'),html);
await build({entryPoints:[path.join(root,'star-abyss/game.js')],outfile:path.join(output,'game.bundle.js'),bundle:true,format:'iife',platform:'browser',target:['ios16','chrome100'],define:{'import.meta.url':'document.baseURI'},minify:true,legalComments:'none'});
const ios=path.join(root,'native/ios/www');await rm(ios,{recursive:true,force:true});await cp(output,ios,{recursive:true});
console.log('Built offline native game assets:',output);
