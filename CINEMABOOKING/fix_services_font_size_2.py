import re
import codecs

css_path = r"d:\NĂM 2\HỌC KỲ 3\CÔNG NGHỆ PHẦN MỀM\CINEMABOOKING\CINEMABOOKING\Content\services.css"

with codecs.open(css_path, "r", encoding="utf-8") as f:
    css = f.read()

# Reduce font size by another 2px
css = re.sub(
    r'font-size:\s*clamp\(\d+px,\s*[\d\.]+vw,\s*\d+px\);',
    r'font-size: clamp(36px, 3.2vw, 62px);',
    css,
    count=1
)

with codecs.open(css_path, "w", encoding="utf-8") as f:
    f.write(css)

# Bump version in Services.cshtml
services_path = r"d:\NĂM 2\HỌC KỲ 3\CÔNG NGHỆ PHẦN MỀM\CINEMABOOKING\CINEMABOOKING\Views\Home\Services.cshtml"
with codecs.open(services_path, "r", encoding="utf-8") as f:
    content = f.read()

content = re.sub(
    r'href="([^"]*services\.css\?v=)\d+"',
    r'href="\g<1>6"',
    content
)

with codecs.open(services_path, "w", encoding="utf-8-sig") as f:
    f.write(content)

print("Reduced font size to clamp(36px, 3.2vw, 62px) and bumped version to 6")
