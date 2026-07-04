import re
import codecs

services_path = r"d:\NĂM 2\HỌC KỲ 3\CÔNG NGHỆ PHẦN MỀM\CINEMABOOKING\CINEMABOOKING\Views\Home\Services.cshtml"

with codecs.open(services_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace <section class="services-grid"...> with <section class="services-list-section"><div class="services-grid"...>
# Find the opening tag
content = re.sub(
    r'<section class="services-grid"([^>]*)>',
    r'<section class="services-list-section">\n    <div class="services-grid"\1>',
    content,
    count=1
)

# Find the closing </section> right before <section class="services-why"
content = re.sub(
    r'(\s*)</section>(\s*<section class="services-why")',
    r'\1</div>\n    </section>\2',
    content,
    count=1
)

# We also need to update the version parameter for the CSS link to bust cache
content = re.sub(
    r'href="([^"]*services\.css\?v=)\d+"',
    r'href="\g<1>2"',
    content
)

with codecs.open(services_path, "w", encoding="utf-8-sig") as f:
    f.write(content)

print("Updated Services.cshtml grid wrapper")
