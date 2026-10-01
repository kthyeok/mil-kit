"""Mil-Kit 빌드: src/ 조각을 합쳐 index.html 한 파일로 만든다.  사용: python build.py"""
import os
ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, 'src')
CSS = ['base.css', 'c5.css', 'c7.css']
JS = ['a0_helpers.js', 'legacy/p2_data_v3.js', 'legacy/p4_etl_v3.js', 'd1_api.js', 'd2_game.js', 'd3_art.js',
      'legacy/p5a_char_v3.js', 'a3_fx.js', 'a2_card.js', 'a1_app.js']
rd = lambda f: open(os.path.join(SRC, f), encoding='utf-8').read()
css = '\n'.join(rd(f) for f in CSS)
js = '\n'.join(rd(f) for f in JS)
html = rd('shell.html').replace('/*CSS*/', css).replace('/*JS*/', js)
open(os.path.join(ROOT, 'index.html'), 'w', encoding='utf-8').write(html)
print(f'index.html {len(html.encode())//1024} KB')
