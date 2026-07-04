path = r"d:\NĂM 2\HỌC KỲ 3\CÔNG NGHỆ PHẦN MỀM\CINEMABOOKING\CINEMABOOKING\Views\Home\Services.cshtml"

with open(path, "r", encoding="utf-8-sig") as f:
    lines = f.readlines()

# Find where orphan CSS starts (after the link tag, before <div class="services-wrapper">)
start_remove = None
end_remove = None

for i, line in enumerate(lines):
    if start_remove is None and '<link href="@Url.Content' in line and 'services.css' in line:
        start_remove = i + 1  # start after the link line
    if '</style>' in line and start_remove is not None:
        end_remove = i  # inclusive
        break

if start_remove is not None and end_remove is not None:
    # Remove lines start_remove to end_remove (inclusive)
    new_lines = lines[:start_remove] + lines[end_remove+1:]
    with open(path, "w", encoding="utf-8-sig") as f:
        f.writelines(new_lines)
    print(f"Removed orphan CSS lines {start_remove+1} to {end_remove+1}")
else:
    print(f"start={start_remove}, end={end_remove} - nothing removed")
