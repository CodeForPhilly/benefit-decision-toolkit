import contextlib
import importlib.util
import io
import json
import os
import shutil
from pathlib import Path
import subprocess
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / 'check-release-consistency.py'
spec = importlib.util.spec_from_file_location('release_consistency', SCRIPT)
release = importlib.util.module_from_spec(spec)
spec.loader.exec_module(release)


class ReleaseFixture:
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.library = self.root / 'library-api'
        self.library.mkdir()
        (self.library / 'pom.xml').write_text('<project xmlns="http://maven.apache.org/POM/4.0.0"><version>0.11.0</version></project>')
        self.snapshot = self.library / 'openapi.snapshot.json'
        self.write_snapshot()
        resources = self.root / 'builder-api/src/main/resources'
        seed = resources / 'seed-data/example-screener'
        seed.mkdir(parents=True)
        (seed / 'manifest.json').write_text(json.dumps({'screeners': [{'benefits': ['seed-data/example-screener/benefit.json']}]}))
        self.benefit = seed / 'benefit.json'
        self.checks = [
            {'sourceCheckId': 'L-internal-age-0.11.0', 'checkVersion': '0.11.0',
             'checkModule': 'internal', 'checkName': 'age', 'evaluationUrl': '/api/v1/checks/internal/age',
             'parameters': {'description': 'Keep 0.10.0 as literal text'}},
            {'sourceCheckId': 'P-custom-0.10.0', 'checkVersion': '0.10.0'},
        ]
        self.write_checks()

    def write_snapshot(self, version='0.11.0', paths=None):
        self.snapshot.write_text(json.dumps({'info': {'version': version}, 'paths':
            {'/api/v1/checks/internal/age': {'post': {}}} if paths is None else paths}))

    def write_checks(self):
        self.benefit.write_text(json.dumps({'checks': self.checks}, indent=2) + '\n')

    def check(self, sync=False):
        with contextlib.redirect_stdout(io.StringIO()):
            release.check_release(self.root, sync)


class ReleaseConsistencyTest(ReleaseFixture, unittest.TestCase):
    def test_current_release_passes(self):
        self.check()

    def test_stale_snapshot_fails(self):
        self.write_snapshot('0.10.0')
        with self.assertRaisesRegex(ValueError, 'regenerate the snapshot'):
            self.check()

    def test_stale_seed_version_and_identity_fail_independently(self):
        for field, value in [('checkVersion', '0.10.0'), ('sourceCheckId', 'L-internal-age-0.10.0')]:
            with self.subTest(field=field):
                original = self.checks[0][field]
                self.checks[0][field] = value
                self.write_checks()
                with self.assertRaisesRegex(ValueError, field):
                    self.check()
                self.checks[0][field] = original

    def test_sync_preserves_custom_checks_parameters_and_formatting(self):
        self.checks[0]['checkVersion'] = '0.10.0'
        self.checks[0]['sourceCheckId'] = 'L-internal-age-0.10.0'
        self.write_checks()
        before = self.benefit.read_text()
        self.check(sync=True)
        self.check()
        expected = before.replace('L-internal-age-0.10.0', 'L-internal-age-0.11.0').replace(
            '"checkVersion": "0.10.0"', '"checkVersion": "0.11.0"', 1)
        self.assertEqual(expected, self.benefit.read_text())
        self.check(sync=True)
        self.assertEqual(expected, self.benefit.read_text())

    def test_missing_post_endpoint_fails_without_writing(self):
        for paths in [{}, {'/api/v1/checks/internal/age': {'get': {}}}]:
            with self.subTest(paths=paths):
                self.write_snapshot(paths=paths)
                before = self.benefit.read_bytes()
                with self.assertRaisesRegex(ValueError, 'missing POST endpoint'):
                    self.check(sync=True)
                self.assertEqual(before, self.benefit.read_bytes())

    def test_cli_fails_with_actionable_message(self):
        script = self.library / 'bin/check-release-consistency.py'
        script.parent.mkdir()
        script.write_bytes(SCRIPT.read_bytes())
        self.write_snapshot('0.10.0')
        result = subprocess.run(['python3', str(script)], capture_output=True, text=True)
        self.assertEqual(1, result.returncode)
        self.assertIn('prepare-release <version>', result.stderr)


class ReleaseTaggingTest(ReleaseFixture, unittest.TestCase):
    """Exercise the actual shell workflow in a disposable Git repo with Maven stubbed."""

    def setUp(self):
        super().setUp()
        scripts = self.library / 'bin'
        scripts.mkdir()
        for name in ['tag-release', 'prepare-release', 'check-release-consistency.py']:
            shutil.copy2(SCRIPT.parent / name, scripts / name)
        tools = self.root / 'tools'
        tools.mkdir()
        mvn = tools / 'mvn'
        mvn.write_text('''#!/usr/bin/env python3
import json, os, pathlib, sys, xml.etree.ElementTree as ET
args = sys.argv[1:]
root = pathlib.Path(os.environ['FIXTURE_ROOT'])
pom = root / 'library-api/pom.xml'
if 'versions:set' in args:
    v = next(a.split('=', 1)[1] for a in args if a.startswith('-DnewVersion='))
    pom.write_text('<project><version>' + v + '</version></project>')
v = ET.parse(pom).getroot().find('{*}version').text
if 'help:evaluate' in args:
    print(v)
if '-Dopenapi.snapshot.update=true' in args:
    p = root / 'library-api/openapi.snapshot.json'
    data = json.loads(p.read_text())
    data['info']['version'] = v
    p.write_text(json.dumps(data))
if args == ['test'] and os.environ.get('FAIL_LIBRARY_TESTS'):
    sys.exit(1)
''')
        mvn.chmod(0o755)
        self.env = dict(os.environ, PATH=str(tools) + os.pathsep + os.environ['PATH'],
                        FIXTURE_ROOT=str(self.root))
        self.git('init', '-q')
        self.git('config', 'commit.gpgsign', 'false')
        self.git('config', 'tag.gpgsign', 'false')
        self.git('config', 'core.hooksPath', str(self.root / 'empty-hooks'))
        self.git('config', 'user.email', 'release-test@example.com')
        self.git('config', 'user.name', 'Release Test')
        self.git('add', '.')
        self.git('commit', '-qm', 'fixture')

    def git(self, *args):
        return subprocess.run(['git', '-C', str(self.root), *args], check=True,
                              text=True, capture_output=True).stdout.strip()

    def tag(self):
        return subprocess.run([str(self.library / 'bin/tag-release'), '0.12.0'],
                              cwd=self.root, env=self.env, capture_output=True,
                              text=True, timeout=10)

    def test_release_commit_includes_synchronized_artifacts(self):
        result = self.tag()
        self.assertEqual(0, result.returncode, result.stderr + result.stdout)
        self.assertEqual('library-api-v0.12.0', self.git('tag', '--list'))
        changed = self.git('diff-tree', '--no-commit-id', '--name-only', '-r', 'HEAD')
        for name in ['library-api/pom.xml', 'library-api/openapi.snapshot.json',
                     'builder-api/src/main/resources/seed-data/example-screener/benefit.json']:
            self.assertIn(name, changed)
        self.assertEqual('', self.git('status', '--porcelain'))
        self.check()
        checks = json.loads(self.benefit.read_text())['checks']
        self.assertEqual('0.12.0', checks[0]['checkVersion'])
        self.assertEqual('0.10.0', checks[1]['checkVersion'])

    def test_failed_validation_does_not_commit_or_tag(self):
        self.env['FAIL_LIBRARY_TESTS'] = '1'
        result = self.tag()
        self.assertNotEqual(0, result.returncode)
        self.assertEqual('1', self.git('rev-list', '--count', 'HEAD'))
        self.assertEqual('', self.git('tag', '--list'))
        self.assertEqual('', self.git('diff', '--cached', '--name-only'))

    def test_unrelated_staged_changes_are_rejected(self):
        (self.root / 'unrelated.txt').write_text('unrelated')
        self.git('add', 'unrelated.txt')
        result = self.tag()
        self.assertNotEqual(0, result.returncode)
        self.assertIn('clean working tree', result.stderr)
        self.assertEqual('1', self.git('rev-list', '--count', 'HEAD'))
        self.assertEqual('', self.git('tag', '--list'))
