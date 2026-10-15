"""Publish only the versioned download branch; verify all Git blob contents."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import base64
import hashlib
import json
import os
import subprocess
import tempfile
import threading

ROOT = Path(__file__).resolve().parent.parent
VERSION = json.loads((ROOT / 'package.json').read_text())['version']
DIRECTORY = ROOT / ('releases/distribution-v' + VERSION)
MANIFEST = json.loads((DIRECTORY / 'manifest.json').read_text())
assert MANIFEST['version'] == VERSION
REPOSITORY = 'asuka-chen/asuka-games-ai'
BRANCH = 'star-abyss-download-v' + VERSION
STATE_FILE = ROOT / 'releases' / ('distribution-v' + VERSION + '-state.json')
state = json.loads(STATE_FILE.read_text()) if STATE_FILE.exists() else {'repository': REPOSITORY, 'branch': BRANCH, 'blobs': {}}
assert state['repository'] == REPOSITORY and state['branch'] == BRANCH
lock = threading.Lock()

def api(method, endpoint, payload=None, missing_ok=False):
    environment = os.environ.copy()
    environment.pop('GH_DEBUG', None)
    if environment.get('GITHUB_RELEASE_TOKEN'):
        environment['GH_TOKEN'] = environment['GITHUB_RELEASE_TOKEN']
    arguments = ['gh', 'api', '--method', method, endpoint]
    temporary = None
    if payload is not None:
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as file:
            json.dump(payload, file)
            temporary = Path(file.name)
        arguments += ['--input', str(temporary)]
    try:
        result = subprocess.run(arguments, env=environment, capture_output=True, text=True, timeout=300)
        if result.returncode:
            if missing_ok and 'HTTP 404' in result.stderr:
                return None
            raise RuntimeError(result.stderr.strip() or 'GitHub API operation failed')
        return json.loads(result.stdout)
    finally:
        if temporary:
            temporary.unlink(missing_ok=True)

existing = api('GET', f'repos/{REPOSITORY}/git/ref/heads/{BRANCH}', missing_ok=True)
if existing and existing['object']['sha'] != state.get('commit'):
    raise RuntimeError('An unknown download branch already exists; refusing to overwrite it')

def upload(file):
    data = file.read_bytes()
    checksum = hashlib.sha256(data).hexdigest()
    with lock:
        old = state['blobs'].get(file.name)
        if old and old['sha256'] == checksum:
            print('Reusing verified blob:', file.name, flush=True)
            return
    result = api('POST', f'repos/{REPOSITORY}/git/blobs', {'content': base64.b64encode(data).decode('ascii'), 'encoding': 'base64'})
    expected = hashlib.sha1(f'blob {len(data)}\0'.encode() + data).hexdigest()
    assert result['sha'] == expected, 'Remote blob does not match the prepared file'
    with lock:
        state['blobs'][file.name] = {'git_sha': result['sha'], 'sha256': checksum, 'size': len(data)}
        STATE_FILE.write_text(json.dumps(state, indent=2) + '\n')
    print('Uploaded and verified:', file.name, flush=True)

files = sorted(p for p in DIRECTORY.iterdir() if p.is_file())
with ThreadPoolExecutor(max_workers=2) as pool:
    for result in pool.map(upload, files):
        pass
tree = api('POST', f'repos/{REPOSITORY}/git/trees', {'tree': [
    {'path': file.name, 'mode': '100644', 'type': 'blob', 'sha': state['blobs'][file.name]['git_sha']} for file in files]})
commit = api('POST', f'repos/{REPOSITORY}/git/commits', {
    'message': f'Deliver Star Abyss {VERSION} Windows update', 'tree': tree['sha'],
    'parents': [existing['object']['sha']] if existing else []})
state['commit'] = commit['sha']
STATE_FILE.write_text(json.dumps(state, indent=2) + '\n')
if existing:
    ref = api('PATCH', f'repos/{REPOSITORY}/git/refs/heads/{BRANCH}', {'sha': commit['sha'], 'force': False})
else:
    ref = api('POST', f'repos/{REPOSITORY}/git/refs', {'ref': 'refs/heads/' + BRANCH, 'sha': commit['sha']})
assert ref['object']['sha'] == commit['sha']
print(f'https://raw.githubusercontent.com/{REPOSITORY}/{BRANCH}/Star-Abyss-Downloader.zip', flush=True)

