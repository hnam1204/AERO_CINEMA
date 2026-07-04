import re

css_path = r"d:\NĂM 2\HỌC KỲ 3\CÔNG NGHỆ PHẦN MỀM\CINEMABOOKING\CINEMABOOKING\Content\promotions.css"

with open(css_path, "r", encoding="utf-8") as f:
    css = f.read()

# Replace -0.5em with calc(-0.5em + 2px) to add exactly 2px spacing between lines
css = css.replace("margin-bottom: -0.5em;", "margin-bottom: calc(-0.5em + 2px);")

with open(css_path, "w", encoding="utf-8") as f:
    f.write(css)

print("Added exactly 2px line spacing")
