import re

css_path = r"d:\NĂM 2\HỌC KỲ 3\CÔNG NGHỆ PHẦN MỀM\CINEMABOOKING\CINEMABOOKING\Content\promotions.css"

with open(css_path, "r", encoding="utf-8") as f:
    css = f.read()

# Replace desktop title
css = re.sub(
    r'\.promotions-hero__title\s*\{[^}]*line-height:\s*1\.15;[^}]*\}',
    '''.promotions-hero__title {
    margin: 0;
    max-width: 660px;
    color: #07142f;
    font-size: clamp(30px, 3vw, 52px);
    line-height: 1.35;
    letter-spacing: 0.5px;
    font-weight: 1000;
    text-transform: uppercase;
}''',
    css
)

# Replace mobile title
css = re.sub(
    r'(\.promotions-hero__title\s*\{[^}]*font-size:\s*clamp\(22px[^}]*)line-height:\s*1\.18;',
    r'\1line-height: 1.35;',
    css
)

# Add padding to span to give breathing room for accents
css = re.sub(
    r'(\.promotions-hero__title span\s*\{[^\}]*)(\})',
    r'\1    padding: 4px 0;\n\2',
    css
)

# Add padding to em to prevent background-clip from cutting off accents
css = re.sub(
    r'(\.promotions-hero__title em\s*\{[^\}]*)(\})',
    r'\1    padding: 0.1em 0;\n\2',
    css
)

with open(css_path, "w", encoding="utf-8") as f:
    f.write(css)

print("Fixed line-height and padding for accents")
