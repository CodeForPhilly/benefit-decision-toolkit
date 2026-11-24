#!/usr/bin/env python3
"""Check release artifacts without Maven, services, or third-party packages."""
import argparse
import json
from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET


def check_release(root, sync=False):
    version = ET.parse(root / 'library-api/pom.xml').getroot().find('{*}version').text
    snapshot = json.loads((root / 'library-api/openapi.snapshot.json').read_text())
    errors = []
    if snapshot['info']['version'] != version:
        errors.append(f"openapi.snapshot.json: version {snapshot['info']['version']} != pom.xml {version}; regenerate the snapshot")
    resources = root / 'builder-api/src/main/resources'
    manifest = json.loads((resources / 'seed-data/example-screener/manifest.json').read_text())
    paths = sorted({path for screener in manifest['screeners'] for path in screener['benefits']})
    count = 0
    updates = {}
    for relative in paths:
        path = resources / relative
        original = path.read_text()
        # Decode each check separately to preserve the exported JSON's formatting.
        match = re.search(r'"checks"\s*:\s*\[', original)
        if not match:
            raise ValueError(f'{relative}: missing checks array')
        offset = match.end()
        replacements = []
        while True:
            offset = re.match(r'\s*', original[offset:]).end() + offset
            if original[offset] == ']':
                break
            check, length = json.JSONDecoder().raw_decode(original[offset:])
            end = offset + length
            if check.get('sourceCheckId', '').startswith('L-'):
                count += 1
                identity = f"L-{check['checkModule']}-{check['checkName']}-{version}"
                if 'post' not in snapshot['paths'].get(check['evaluationUrl'], {}):
                    errors.append(f"{relative}: missing POST endpoint {check['evaluationUrl']}")
                if sync:
                    block = original[offset:end]
                    for key, value in [('sourceCheckId', identity), ('checkVersion', version)]:
                        block, changed = re.subn(
                            rf'("{key}"\s*:\s*)"(?:[^"\\]|\\.)*"',
                            lambda m: m[1] + json.dumps(value), block, count=1)
                        if changed != 1:
                            raise ValueError(f'{relative}: missing {key}')
                    replacements.append((offset, end, block))
                else:
                    if check.get('checkVersion') != version:
                        errors.append(f"{relative}: {check['sourceCheckId']} checkVersion must be {version}")
                    if check['sourceCheckId'] != identity:
                        errors.append(f'{relative}: sourceCheckId must be {identity}')
            offset = re.match(r'\s*', original[end:]).end() + end
            if original[offset] == ',':
                offset += 1
        updated = original
        for start, end, block in reversed(replacements):
            updated = updated[:start] + block + updated[end:]
        if updated != original:
            updates[path] = updated
    if errors:
        raise ValueError('\n'.join(errors))
    # Validate every endpoint before writing any seed file.
    for path, content in updates.items():
        path.write_text(content)
    print(f'Release {version}: snapshot and {count} bundled library checks are consistent.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--sync-example', action='store_true', help='Update only bundled library check versions and IDs from pom.xml')
    args = parser.parse_args()
    try:
        check_release(Path(__file__).resolve().parents[2], args.sync_example)
    except (ValueError, KeyError, OSError, ET.ParseError) as exc:
        print(f'Release consistency failed: {exc}', file=sys.stderr)
        print('Run library-api/bin/prepare-release <version>, then review the diff.', file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
