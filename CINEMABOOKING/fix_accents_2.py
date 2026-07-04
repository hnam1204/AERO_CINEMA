import re

css_path = r"d:\NĂM 2\HỌC KỲ 3\CÔNG NGHỆ PHẦN MỀM\CINEMABOOKING\CINEMABOOKING\Content\promotions.css"

with open(css_path, "r", encoding="utf-8") as f:
    css = f.read()

# Replace desktop line-height and span padding
css = re.sub(
    r'\.promotions-hero__title\s*\{[^}]*\}',
    '''.promotions-hero__title {
    margin: 0;
    max-width: 660px;
    color: #07142f;
    font-size: clamp(30px, 3vw, 52px);
    line-height: 1.5;
    letter-spacing: 0.5px;
    font-weight: 1000;
    text-transform: uppercase;
}''',
    css, count=1
)

css = re.sub(
    r'\.promotions-hero__title span\s*\{[^}]*\}',
    '''.promotions-hero__title span {
    display: block;
    white-space: nowrap;
    padding-top: 0.25em;
    padding-bottom: 0.25em;
    margin-top: -0.1em;
    margin-bottom: -0.1em;
}''',
    css, count=1
)

css = re.sub(
    r'\.promotions-hero__title em\s*\{[^}]*\}',
    '''.promotions-hero__title em {
    font-style: normal;
    background: linear-gradient(90deg, #ff6b00 0%, #f58220 50%, #ff9d2f 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    padding-top: 0.25em;
    padding-bottom: 0.25em;
}''',
    css, count=1
)

# Replace mobile line-height
css = re.sub(
    r'(\.promotions-hero__title\s*\{[^}]*font-size:\s*clamp\(22px[^}]*)line-height:\s*1\.35;',
    r'\1line-height: 1.5;',
    css
)

css = re.sub(
    r'(\.promotions-hero__title span\s*\{[^}]*white-space:\s*normal;)[^}]*\}',
    r'\1\n        padding-top: 0.25em;\n        padding-bottom: 0.25em;\n        margin-top: -0.1em;\n        margin-bottom: -0.1em;\n    }',
    css
)


with open(css_path, "w", encoding="utf-8") as f:
    f.write(css)

print("Fixed padding and line-height for accents again")
