import re
import codecs

css_path = r"d:\NĂM 2\HỌC KỲ 3\CÔNG NGHỆ PHẦN MỀM\CINEMABOOKING\CINEMABOOKING\Content\services.css"

with codecs.open(css_path, "r", encoding="utf-8") as f:
    css = f.read()

# Replace .services-hero__title definition
css = re.sub(
    r'\.services-hero__title\s*\{[^}]*\}',
    '''.services-hero__title {
    margin: 0;
    max-width: 660px;
    color: #07142f;
    font-size: clamp(30px, 3vw, 52px);
    line-height: 1.12;
    letter-spacing: 0.5px;
    font-weight: 1000;
    text-transform: uppercase;
}''',
    css
)

# Replace .services-hero__title span definition to restore standard margin
css = re.sub(
    r'\.services-hero__title span\s*\{[^}]*\}',
    '''.services-hero__title span {
    display: block;
    white-space: nowrap;
    padding-top: 0.25em;
    padding-bottom: 0.25em;
    margin-bottom: calc(-0.5em + 2px);
}''',
    css
)

# Replace .services-hero__title em to remove calc(100% - 1px) and match promotions
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
    css
)

with codecs.open(css_path, "w", encoding="utf-8") as f:
    f.write(css)

# Bump version in Services.cshtml
services_path = r"d:\NĂM 2\HỌC KỲ 3\CÔNG NGHỆ PHẦN MỀM\CINEMABOOKING\CINEMABOOKING\Views\Home\Services.cshtml"
with codecs.open(services_path, "r", encoding="utf-8") as f:
    content = f.read()

content = re.sub(
    r'href="([^"]*services\.css\?v=)\d+"',
    r'href="\g<1>10"',
    content
)

with codecs.open(services_path, "w", encoding="utf-8-sig") as f:
    f.write(content)

print("Synchronized title styling with promotions and bumped version")
