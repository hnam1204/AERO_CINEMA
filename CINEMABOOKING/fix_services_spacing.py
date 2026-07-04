import re
import codecs

css_path = r"d:\NĂM 2\HỌC KỲ 3\CÔNG NGHỆ PHẦN MỀM\CINEMABOOKING\CINEMABOOKING\Content\services.css"

with codecs.open(css_path, "r", encoding="utf-8") as f:
    css = f.read()

# Replace margin-bottom: -0.45em with calc(-0.5em + 2px) to match promotions
css = re.sub(
    r'margin-bottom:\s*-0\.45em;',
    r'margin-bottom: calc(-0.5em + 2px);',
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
    r'href="\g<1>4"',
    content
)

with codecs.open(services_path, "w", encoding="utf-8-sig") as f:
    f.write(content)

print("Fixed spacing to exact calc(-0.5em + 2px) and bumped version")
