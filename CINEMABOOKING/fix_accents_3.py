import re

css_path = r"d:\NĂM 2\HỌC KỲ 3\CÔNG NGHỆ PHẦN MỀM\CINEMABOOKING\CINEMABOOKING\Content\promotions.css"

with open(css_path, "r", encoding="utf-8") as f:
    css = f.read()

# Restore desktop line-height to 1.12 (tighter)
css = re.sub(
    r'\.promotions-hero__title\s*\{[^}]*\}',
    '''.promotions-hero__title {
    margin: 0;
    max-width: 660px;
    color: #07142f;
    font-size: clamp(30px, 3vw, 52px);
    line-height: 1.12;
    letter-spacing: 0.5px;
    font-weight: 1000;
    text-transform: uppercase;
}''',
    css, count=1
)

# Update span to have negative margin equal to its total vertical padding
css = re.sub(
    r'\.promotions-hero__title span\s*\{[^}]*\}',
    '''.promotions-hero__title span {
    display: block;
    white-space: nowrap;
    padding-top: 0.25em;
    padding-bottom: 0.25em;
    margin-bottom: -0.5em;
}
.promotions-hero__title span:last-child {
    margin-bottom: 0;
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

# Restore mobile line-height
css = re.sub(
    r'(\.promotions-hero__title\s*\{[^}]*font-size:\s*clamp\(22px[^}]*)line-height:\s*1\.5;',
    r'\1line-height: 1.15;',
    css
)

css = re.sub(
    r'(\.promotions-hero__title span\s*\{[^}]*white-space:\s*normal;)[^}]*\}',
    r'\1\n        padding-top: 0.25em;\n        padding-bottom: 0.25em;\n        margin-bottom: -0.5em;\n    }\n    .promotions-hero__title span:last-child {\n        margin-bottom: 0;\n    }',
    css
)

with open(css_path, "w", encoding="utf-8") as f:
    f.write(css)

print("Fixed spacing")
