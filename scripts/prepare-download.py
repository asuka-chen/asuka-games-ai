"""Package the tested Windows build and prepare versioned, verified downloads."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parent.parent
VERSION = json.loads((ROOT / 'package.json').read_text())['version']
assert re.fullmatch(r'\d+\.\d+\.\d+', VERSION)
FOLDER = ROOT / 'releases/Star-Abyss-win32-x64'
ARCHIVE = ROOT / 'releases/Star-Abyss-Windows-x64.zip'
DIRECTORY = ROOT / ('releases/distribution-v' + VERSION)
DIRECTORY.mkdir(exist_ok=True)

with ZipFile(ARCHIVE, 'w', ZIP_DEFLATED, compresslevel=6) as archive:
    for file in sorted(FOLDER.rglob('*')):
        if file.is_file():
            archive.write(file, file.relative_to(FOLDER.parent))
with ZipFile(ARCHIVE) as archive:
    assert archive.testzip() is None
    assert 'Star-Abyss-win32-x64/Star-Abyss.exe' in archive.namelist()
checksum = hashlib.sha256(ARCHIVE.read_bytes()).hexdigest()
ARCHIVE.with_suffix('.zip.sha256').write_text(checksum + '  ' + ARCHIVE.name + '\n')
print('Windows archive integrity verified:', VERSION, flush=True)

parts = []
with ARCHIVE.open('rb') as source:
    number = 1
    while data := source.read(20 * 1024 * 1024):
        name = f'{ARCHIVE.name}.part{number:02}'
        (DIRECTORY / name).write_bytes(data)
        parts.append({'name': name, 'sha256': hashlib.sha256(data).hexdigest(), 'bytes': len(data)})
        number += 1
manifest = {'version': VERSION, 'archive': ARCHIVE.name, 'sha256': checksum,
            'bytes': ARCHIVE.stat().st_size, 'parts': parts}
(DIRECTORY / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
base = f'https://raw.githubusercontent.com/asuka-chen/asuka-games-ai/star-abyss-download-v{VERSION}/'
template = (ROOT / 'scripts/download-template.ps1').read_text()
script = template.replace('__BASE_URL__', base).replace('__ARCHIVE_SHA256__', checksum)
flat = ' '.join(line.strip() for line in script.splitlines())
assert '"' not in flat and '%' not in flat
launcher = '@echo off\r\npowershell.exe -NoProfile -Command "' + flat + '"\r\nif errorlevel 1 echo Download failed. Check the message above.\r\npause\r\n'
instructions = f'星渊：无限火力 {VERSION}\n解压后双击 Download-Star-Abyss.cmd。\n工具会下载游戏、验证 SHA-256 并解压到桌面。需要联网，不需要令牌、Node.js 或 Python。\n在机库右上角确认版本号。请从本次解压的新文件夹启动游戏。\n'
with ZipFile(DIRECTORY / 'Star-Abyss-Downloader.zip', 'w', ZIP_DEFLATED) as archive:
    archive.writestr('Download-Star-Abyss.cmd', launcher)
    archive.writestr('Download-Star-Abyss.ps1', script)
    archive.writestr('READ_ME.zh-CN.txt', instructions)
with ZipFile(DIRECTORY / 'Star-Abyss-Downloader.zip') as archive:
    assert archive.testzip() is None

source_archive = ROOT / f'releases/Star-Abyss-Source-v{VERSION}.zip'
source_files = [ROOT / name for name in ['package.json', 'package-lock.json', 'README.md', '.gitignore']]
for name in ['star-abyss', 'desktop', 'scripts', 'tests']:
    source_files.extend(p for p in (ROOT / name).rglob('*') if p.is_file())
with ZipFile(source_archive, 'w', ZIP_DEFLATED) as archive:
    for file in sorted(source_files):
        archive.write(file, Path('Star-Abyss-Source-v' + VERSION) / file.relative_to(ROOT))
with ZipFile(source_archive) as archive:
    assert archive.testzip() is None
(DIRECTORY / 'CHANGELOG.md').write_text((ROOT / 'star-abyss/CHANGELOG.md').read_text())
(DIRECTORY / 'README.md').write_text(f'# 星渊：无限火力 {VERSION} — Windows 下载\n\n下载 Star-Abyss-Downloader.zip，解压后运行 Download-Star-Abyss.cmd。工具会下载分块、校验完整游戏包，并保存和解压到桌面。\n\n0.12.0 将未知事件改为随机滚动揭晓实验室、挑战或金币屋；实验三张遗物各有独立随机代价，移除单独金币房，并在本局构筑中显示元素组合效果。在机库右上角确认 V{VERSION}。\n\n免费 CC0 素材许可、开发范围和更新记录均附在游戏包中。\n\n完整 ZIP SHA-256：`{checksum}`\n')
print('Prepared versioned distribution:', DIRECTORY.name, len(parts), 'parts', flush=True)

