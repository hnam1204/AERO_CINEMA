import codecs

services_path = r"d:\NĂM 2\HỌC KỲ 3\CÔNG NGHỆ PHẦN MỀM\CINEMABOOKING\CINEMABOOKING\Views\Home\Services.cshtml"
with codecs.open(services_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace version directly
content = content.replace('services.css?v=1', 'services.css?v=13')
content = content.replace('services.css?v=2', 'services.css?v=13')
content = content.replace('services.css?v=3', 'services.css?v=13')
content = content.replace('services.css?v=4', 'services.css?v=13')

with codecs.open(services_path, "w", encoding="utf-8-sig") as f:
    f.write(content)

print("Bumped version to 13 correctly")
