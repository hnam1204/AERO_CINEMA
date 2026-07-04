import re

css_path = r"d:\NĂM 2\HỌC KỲ 3\CÔNG NGHỆ PHẦN MỀM\CINEMABOOKING\CINEMABOOKING\Content\services.css"

with open(css_path, "r", encoding="utf-8") as f:
    css = f.read()

# Fix span clipping by adding padding and offsetting margin
css = re.sub(
    r'\.services-hero__title span\s*\{[^}]*\}',
    '''.services-hero__title span {
    display: block;
    white-space: nowrap;
    padding-top: 0.25em;
    padding-bottom: 0.25em;
    margin-bottom: -0.45em;
}

.services-hero__title span:last-child {
    margin-bottom: 0;
}''',
    css, count=1
)

# Fix em clipping for the gradient
css = re.sub(
    r'\.services-hero__title em\s*\{[^}]*\}',
    '''.services-hero__title em {
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

with open(css_path, "w", encoding="utf-8") as f:
    f.write(css)

print("Fixed text clipping in services.css")
