import re
import codecs

promo_path = r"d:\NĂM 2\HỌC KỲ 3\CÔNG NGHỆ PHẦN MỀM\CINEMABOOKING\CINEMABOOKING\Views\Home\Promotions.cshtml"

# Read as utf-8
with codecs.open(promo_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace wrong text
# It might be double-encoded or just weirdly written in the file.
# Let's replace anything inside ViewBag.Title = "..." with the correct one
content = re.sub(r'ViewBag\.Title\s*=\s*"[^"]+";', 'ViewBag.Title = "Khuyến Mãi & Ưu Đãi - AERO Cinema";', content)

# Write as utf-8-sig to ensure it's saved with UTF-8 BOM if needed, or just utf-8. Let's use utf-8
with codecs.open(promo_path, 'w', encoding='utf-8-sig') as f:
    f.write(content)

print("Fixed Promotions.cshtml")
