import re
import codecs

services_path = r"d:\NĂM 2\HỌC KỲ 3\CÔNG NGHỆ PHẦN MỀM\CINEMABOOKING\CINEMABOOKING\Views\Home\Services.cshtml"

with codecs.open(services_path, "r", encoding="utf-8") as f:
    content = f.read()

content = re.sub(
    r'href="([^"]*services\.css\?v=)\d+"',
    r'href="\g<1>3"',
    content
)

with codecs.open(services_path, "w", encoding="utf-8-sig") as f:
    f.write(content)

print("Updated CSS version to 3")
