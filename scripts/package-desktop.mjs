import { packager } from '@electron/packager';
import path from 'node:path';
import { initializeProxy } from '@electron/get';
import { copyFile } from 'node:fs/promises';
if (process.env.HTTPS_PROXY || process.env.HTTP_PROXY) initializeProxy();
const platform = process.argv[2] || 'win32';
if (!['win32', 'linux', 'darwin'].includes(platform)) throw new Error('Unsupported platform');
const paths = await packager({
  dir: '.', out: 'releases', name: 'Star-Abyss', platform, arch: 'x64',
  electronVersion: '44.7.0', asar: true, overwrite: true, prune: true,
  appCopyright: 'Star Abyss contributors; Kenney assets CC0',
  ignore: [/^\/native($|\/)/, /^\/\.github($|\/)/, /^\/releases($|\/)/, /^\/tests($|\/)/, /^\/test-results($|\/)/, /^\/scripts($|\/)/, /^\/\.git($|\/)/, /^\/\.cache($|\/)/, /^\/node_modules($|\/)/],
  download: { cacheRoot: process.env.ELECTRON_CACHE || path.resolve('.cache/electron') }
});
for (const output of paths) {
  await copyFile('star-abyss/PLAY.md', path.join(output, 'READ_ME.zh-CN.txt'));
  await copyFile('star-abyss/CREDITS.md', path.join(output, 'CREDITS.md'));
  await copyFile('star-abyss/DEVELOPMENT.md', path.join(output, 'DEVELOPMENT.md'));
  await copyFile('star-abyss/CHANGELOG.md', path.join(output, 'CHANGELOG.md'));
  await copyFile('star-abyss/assets/ships/LICENSE.txt', path.join(output, 'LICENSE-Kenney-CC0.txt'));
}
console.log('Packaged:', paths.join('\n'));
