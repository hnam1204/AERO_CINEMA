import re
import codecs

css_path = r"d:\NĂM 2\HỌC KỲ 3\CÔNG NGHỆ PHẦN MỀM\CINEMABOOKING\CINEMABOOKING\Content\services.css"

with codecs.open(css_path, "r", encoding="utf-8") as f:
    css = f.read()

# Add font-size: calc(100% - 1px) to .services-hero__title em
css = re.sub(
    r'(\.services-hero__title em\s*\{[^}]*background-clip:\s*text;)',
    r'\1\n    font-size: calc(100% - 1px);',
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
    r'href="\g<1>9"',
    content
)

with codecs.open(services_path, "w", encoding="utf-8-sig") as f:
    f.write(content)

print("Reduced em font size by 1px and bumped version")
