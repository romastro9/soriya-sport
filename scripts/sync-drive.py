"""Build a public Drive jersey gallery into static Pages assets. No credentials needed."""
import concurrent.futures
import html
import json
import io
from PIL import Image, ImageOps
import re
import sys
import urllib.request
from pathlib import Path

DEST = Path(sys.argv[1] if len(sys.argv) > 1 else 'site')
FOLDER = '10ozgPvN4Fm0Sj3nh9ji5-cjey1d9MgiW'

def read(url, limit):
    req = urllib.request.Request(url, headers={'User-Agent': 'SoriyaSportGallery/1.0'})
    with urllib.request.urlopen(req, timeout=30) as response:
        data = response.read(limit + 1)
        if len(data) > limit:
            raise ValueError('Response too large')
        return data, response.headers.get_content_type()

def download(item):
    identity, name = item
    data, mime = read('https://drive.google.com/uc?export=download&id=' + identity, 30_000_000)
    formats = {'image/png': ('png', b'\x89PNG\r\n\x1a\n'), 'image/jpeg': ('jpg', b'\xff\xd8'), 'image/webp': ('webp', b'RIFF')}
    if mime not in formats:
        raise ValueError('Unsupported image content type: ' + mime)
    extension, magic = formats[mime]
    if not data.startswith(magic):
        raise ValueError('Invalid image')
    relative = 'assets/drive-' + identity + '.webp'
    with Image.open(io.BytesIO(data)) as source_image:
        image = ImageOps.exif_transpose(source_image).convert('RGBA')
        image.thumbnail((1800, 1800), Image.Resampling.LANCZOS)
        image.save(DEST / relative, 'WEBP', quality=90, method=6)
    return {'id': identity, 'name': name, 'image': relative}

def main():
    body, _ = read('https://drive.google.com/embeddedfolderview?id=' + FOLDER, 2_000_000)
    source = body.decode('utf-8')
    if 'flip-entries' not in source:
        raise ValueError('Folder is not publicly readable')
    entries = []
    for entry in source.split('<div class="flip-entry"')[1:]:
        identity = re.search(r'id="entry-([a-zA-Z0-9_-]+)"', entry)
        title = re.search(r'<div class="flip-entry-title">([^<]*)</div>', entry)
        if identity and title and re.search(r'\.(png|jpe?g|webp)$', title[1], re.I):
            name = re.sub(r'\.(png|jpe?g|webp)$', '', html.unescape(title[1]), flags=re.I).replace('_', ' ').strip()
            entries.append((identity[1], name))
    if len(entries) > 100:
        raise ValueError('Gallery exceeds 100 images')
    previous = json.loads((DEST / 'jersey-manifest.json').read_text(encoding='utf-8')).get('items', [])
    fallback = {item['id']: item for item in previous}
    items = []
    successes = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        futures = [pool.submit(download, entry) for entry in entries]
        for entry, future in zip(entries, futures):
            try:
                items.append(future.result())
                successes += 1
            except Exception as error:
                print(f'Image skipped: {entry[0]} ({type(error).__name__}: {error})', file=sys.stderr)
                if entry[0] in fallback:
                    items.append(fallback[entry[0]])
    if entries and not successes:
        raise ValueError('No Drive images could be downloaded')
    # Publish the manifest only after every download passes validation.
    (DEST / 'jersey-manifest.json').write_text(json.dumps({'items': items}, ensure_ascii=False), encoding='utf-8')
    print(f'Gallery synced: {len(items)} images')

if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print(f'Drive refresh skipped: {type(error).__name__}: {error}. Retaining bundled gallery.', file=sys.stderr)
        if not (DEST / 'jersey-manifest.json').exists():
            raise
