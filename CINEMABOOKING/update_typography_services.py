import re
import codecs

css_path = r"d:\NĂM 2\HỌC KỲ 3\CÔNG NGHỆ PHẦN MỀM\CINEMABOOKING\CINEMABOOKING\Content\services.css"

with codecs.open(css_path, "r", encoding="utf-8") as f:
    css = f.read()

# Replace .services-hero__title
css = re.sub(
    r'\.services-hero__title\s*\{[^}]*\}',
    '''.services-hero__title {
    margin: 0;
    max-width: 680px;
    color: #07142f;
    font-size: clamp(42px, 3.6vw, 70px);
    line-height: 1.22;
    letter-spacing: -0.8px;
    font-weight: 1000;
    text-transform: uppercase;
}''',
    css, count=1
)

# Replace .services-hero__title span
css = re.sub(
    r'\.services-hero__title span\s*\{[^}]*\}',
    '''.services-hero__title span {
    display: block;
    white-space: nowrap;
    margin-bottom: 4px;
}''',
    css, count=1
)

# Replace .services-hero__title em
css = re.sub(
    r'\.services-hero__title em\s*\{[^}]*\}',
    '''.services-hero__title em {
    font-style: normal;
    background: linear-gradient(90deg, #ff6b00 0%, #f58220 50%, #ff9d2f 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
}''',
    css, count=1
)

# Fix the mobile media query
# First, let's find the media query block
mobile_media = re.search(r'@media \(max-width: 768px\) \{([^}]+)\.services-hero__title\s*\{[^}]*\}(.*?)\}', css, re.DOTALL)
if mobile_media:
    # Instead of complex regex, let's just do a specific replacement inside the max-width: 768px block
    pass

# We will just replace the exact lines in the mobile section.
# The mobile section currently has:
#    .services-hero__title {
#        font-size: clamp(30px, 8vw, 42px);
#        line-height: 1.18;
#        letter-spacing: -0.4px;
#    }
#
#    .services-hero__title span {
#        white-space: normal;
#    }

css = re.sub(
    r'(\@media \(max-width:\s*768px\)\s*\{.*?\.services-hero__title\s*\{)[^}]*(\})',
    r'\g<1>\n        font-size: clamp(30px, 8vw, 42px);\n        line-height: 1.24;\n        letter-spacing: -0.4px;\n    \g<2>',
    css, flags=re.DOTALL
)

css = re.sub(
    r'(\@media \(max-width:\s*768px\)\s*\{.*?\.services-hero__title span\s*\{)[^}]*(\})',
    r'\g<1>\n        white-space: normal;\n        margin-bottom: 4px;\n    \g<2>',
    css, flags=re.DOTALL
)


with codecs.open(css_path, "w", encoding="utf-8") as f:
    f.write(css)

# Bump version in Services.cshtml
services_path = r"d:\NĂM 2\HỌC KỲ 3\CÔNG NGHỆ PHẦN MỀM\CINEMABOOKING\CINEMABOOKING\Views\Home\Services.cshtml"
with codecs.open(services_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace('services.css?v=13', 'services.css?v=14')

with codecs.open(services_path, "w", encoding="utf-8-sig") as f:
    f.write(content)

print("Updated typography to line-height 1.22 and bumped version to 14")
