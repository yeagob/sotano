# Tests of gemini.py that never call the API. Run from the repository root:
#   python -m unittest discover -s scripts/meditation-voice -p "test_*.py"

import base64
import contextlib
import io
import os
import sys
import unittest
import urllib.request
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent))
import gemini  # noqa: E402
import generate  # noqa: E402


class LineReader(unittest.TestCase):
    def test_same_keys_as_the_chatterbox_generator(self):
        for lang in generate.LOCALES:
            self.assertEqual(list(gemini.read_lines(lang)), list(generate.read_lines(lang)))

    def test_seventy_eight_lines_per_language(self):
        for lang in generate.LOCALES:
            self.assertEqual(len(gemini.read_lines(lang)), 78, lang)


class Check(unittest.TestCase):
    def run_check(self, argv):
        out = io.StringIO()
        # no network: any call to the API fails the test
        with mock.patch.object(urllib.request, 'urlopen', side_effect=AssertionError('the API was called')), \
                mock.patch.dict(os.environ, {}, clear=False), contextlib.redirect_stdout(out):
            os.environ.pop('GEMINI_KEY', None)
            code = gemini.main(argv)
        return code, out.getvalue()

    def test_check_prints_every_line_without_the_key_or_the_api(self):
        code, text = self.run_check(['--check'])
        self.assertEqual(code, 0)
        self.assertEqual(text.count('  to write') + text.count('  kept (exists)'), 156)
        self.assertIn('med.ground.arrive.1', text)

    def test_check_one_language(self):
        code, text = self.run_check(['--check', '--lang', 'es'])
        self.assertEqual(code, 0)
        self.assertEqual(text.count('  to write') + text.count('  kept (exists)'), 78)

    def test_generation_without_the_key_stops_and_names_the_variable(self):
        out, err = io.StringIO(), io.StringIO()
        env = {k: v for k, v in os.environ.items() if k != 'GEMINI_KEY'}
        with mock.patch.dict(os.environ, env, clear=True), \
                mock.patch.object(urllib.request, 'urlopen', side_effect=AssertionError('the API was called')), \
                contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = gemini.main(['--lang', 'en'])
        self.assertEqual(code, 2)
        self.assertIn('GEMINI_KEY', err.getvalue())


class Reply(unittest.TestCase):
    def test_audio_is_read_from_the_model_output_step(self):
        reply = {'steps': [
            {'type': 'user_input', 'content': []},
            {'type': 'model_output', 'content': [{'type': 'audio', 'data': base64.b64encode(b'RIFFxxxx').decode()}]},
        ]}
        self.assertEqual(gemini.audio_from(reply), b'RIFFxxxx')

    def test_a_reply_without_audio_is_an_error(self):
        with self.assertRaises(RuntimeError):
            gemini.audio_from({'steps': []})

if __name__ == '__main__':
    unittest.main()
