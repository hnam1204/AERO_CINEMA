import re
import codecs

css_path = r"d:\NĂM 2\HỌC KỲ 3\CÔNG NGHỆ PHẦN MỀM\CINEMABOOKING\CINEMABOOKING\Content\services.css"

with codecs.open(css_path, "r", encoding="utf-8") as f:
    css = f.read()

# Lock the width of the visual container on desktop to prevent drift of absolute positioned elements
css = re.sub(
    r'\.services-hero__visual\s*\{([^}]*)\}',
    r'''.services-hero__visual {
    position: relative;
    z-index: 3;
    width: 720px;
    min-height: 430px;
    overflow: visible;
    justify-self: center;
    transform: translate(-20px, 10px);
}''',
    css, count=1
)

# In max-width: 768px media query, make sure visual scales nicely and doesn't overflow
css = re.sub(
    r'(\@media \(max-width:\s*768px\)\s*\{.*?\.services-hero__visual\s*\{)[^}]*(\})',
    r'\g<1>\n        transform: scale(.68);\n        transform-origin: center top;\n        min-height: 290px;\n        margin-bottom: -70px;\n        width: 100%;\n        max-width: 720px;\n    \g<2>',
    css, flags=re.DOTALL
)

with codecs.open(css_path, "w", encoding="utf-8") as f:
    f.write(css)

# Bump version in Services.cshtml
services_path = r"d:\NĂM 2\HỌC KỲ 3\CÔNG NGHỆ PHẦN MỀM\CINEMABOOKING\CINEMABOOKING\Views\Home\Services.cshtml"
with codecs.open(services_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace('services.css?v=15', 'services.css?v=16')

with codecs.open(services_path, "w", encoding="utf-8-sig") as f:
    f.write(content)

print("Locked visual width to 720px to prevent layout drift and bumped version to 16")
