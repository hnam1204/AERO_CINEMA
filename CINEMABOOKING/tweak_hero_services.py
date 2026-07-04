import re
import codecs

css_path = r"d:\NĂM 2\HỌC KỲ 3\CÔNG NGHỆ PHẦN MỀM\CINEMABOOKING\CINEMABOOKING\Content\services.css"

with codecs.open(css_path, "r", encoding="utf-8") as f:
    css = f.read()

# 1. Update font-size in .services-hero__title
css = re.sub(
    r'(\.services-hero__title\s*\{[^}]*font-size:\s*)clamp\([^)]+\)',
    r'\1clamp(40px, 3.35vw, 66px)',
    css
)

# 2. Update margin in .services-hero__underline
css = re.sub(
    r'(\.services-hero__underline\s*\{[^}]*margin:\s*)[^;]+;',
    r'\1 18px 0 22px;',
    css
)

# 3. Add transform to .services-hero__visual
# It might already have transform or not
if '.services-hero__visual {\n    position: relative;\n    z-index: 3;\n    min-height: 430px;\n    overflow: visible;\n}' in css:
    css = css.replace(
        '.services-hero__visual {\n    position: relative;\n    z-index: 3;\n    min-height: 430px;\n    overflow: visible;\n}',
        '.services-hero__visual {\n    position: relative;\n    z-index: 3;\n    min-height: 430px;\n    overflow: visible;\n    transform: translate(-20px, 10px);\n}'
    )
elif 'transform' in re.search(r'\.services-hero__visual\s*\{[^}]*\}', css).group(0):
    css = re.sub(
        r'(\.services-hero__visual\s*\{[^}]*transform:\s*)[^;]+;',
        r'\1translate(-20px, 10px);',
        css
    )
else:
    css = re.sub(
        r'(\.services-hero__visual\s*\{[^}]*)(\})',
        r'\1    transform: translate(-20px, 10px);\n\2',
        css
    )

with codecs.open(css_path, "w", encoding="utf-8") as f:
    f.write(css)

# Bump version in Services.cshtml
services_path = r"d:\NĂM 2\HỌC KỲ 3\CÔNG NGHỆ PHẦN MỀM\CINEMABOOKING\CINEMABOOKING\Views\Home\Services.cshtml"
with codecs.open(services_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace('services.css?v=14', 'services.css?v=15')

with codecs.open(services_path, "w", encoding="utf-8-sig") as f:
    f.write(content)

print("Updated CSS tweaks and bumped version to 15")
