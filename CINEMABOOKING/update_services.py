import re
import codecs

services_path = r"d:\NĂM 2\HỌC KỲ 3\CÔNG NGHỆ PHẦN MỀM\CINEMABOOKING\CINEMABOOKING\Views\Home\Services.cshtml"

with codecs.open(services_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace the HTML hero block
old_html = r'''<section class="services-hero">
        <div class="services-hero-content">
            <div class="services-hero-badge">
                <i class="fas fa-concierge-bell"></i>
                AERO PREMIUM SERVICES
            </div>
            <h1 data-i18n="services_title">Dịch vụ đẳng cấp tại AERO Cinema</h1>
            <p data-i18n="services_subtitle">Trải nghiệm điện ảnh trọn vẹn hơn với đặt vé trực tuyến, ẩm thực rạp chiếu, phòng chờ cao cấp và dịch vụ tổ chức sự kiện chuyên nghiệp.</p>
        </div>
    </section>'''

new_html = r'''<section class="services-hero-full">
        <div class="services-hero">
            <div class="services-hero__content">
                <div class="services-hero__badge">
                    <span>✦</span>
                    <strong>AERO PREMIUM SERVICES</strong>
                </div>

                <h1 class="services-hero__title">
                    <span>DỊCH VỤ</span>
                    <span><em>ĐẲNG CẤP</em> TẠI</span>
                    <span>AERO CINEMA</span>
                </h1>

                <p class="services-hero__desc">
                    Trải nghiệm điện ảnh trọn vẹn hơn với đặt vé trực tuyến, ẩm thực rạp chiếu,
                    phòng chờ cao cấp và dịch vụ tổ chức sự kiện chuyên nghiệp.
                </p>
            </div>

            <div class="services-hero__visual" aria-hidden="true">
                <div class="service-chair"></div>
                <div class="service-phone">
                    <div class="phone-logo">AERO<br><small>CINEMA</small></div>
                    <div class="phone-ticket">VÉ ĐIỆN TỬ<br><span>QR</span></div>
                </div>
                <div class="service-popcorn"></div>
                <div class="service-drink"></div>
                <div class="service-event-icon"></div>
                <div class="service-light-line"></div>
            </div>
        </div>
    </section>'''

content = content.replace(old_html, new_html)

# Inject the <link> tag at the beginning, just before <style>
if '<link href="@Url.Content("~/Content/services.css")" rel="stylesheet" />' not in content:
    content = content.replace('<style>', '<link href="@Url.Content("~/Content/services.css?v=1")" rel="stylesheet" />\n<style>', 1)

# Remove the old .services-hero CSS blocks to avoid clutter
# We can use regex to remove .services-hero up to the closing brace, etc., but it's okay to just leave it if it doesn't conflict.
# The new class is .services-hero-full and .services-hero__content.
# Wait, .services-hero IS used in the new HTML! 
# The old CSS has `.services-hero` with background gradients, border-radius, max-width, etc.
# This WILL conflict with the new `.services-hero` which has its own background, max-width, padding.
# Since the new CSS is loaded before `<style>`, the internal `<style>` block will override `Content/services.css`!
# So we MUST remove `.services-hero` and its related rules from the internal `<style>`.

content = re.sub(r'\.services-hero\s*\{[^}]*\}', '', content)
content = re.sub(r'\.services-hero::after\s*\{[^}]*\}', '', content)
content = re.sub(r'\.services-hero-content\s*\{[^}]*\}', '', content)
content = re.sub(r'\.services-hero-badge\s*\{[^}]*\}', '', content)
content = re.sub(r'\.services-hero h1\s*\{[^}]*\}', '', content)
content = re.sub(r'\.services-hero h1 span\s*\{[^}]*\}', '', content)
content = re.sub(r'\.services-hero p\s*\{[^}]*\}', '', content)
# Also in media queries
content = re.sub(r'\.services-hero\s*\{[^}]*\}', '', content)
content = re.sub(r'\.services-hero h1\s*\{[^}]*\}', '', content)

with codecs.open(services_path, "w", encoding="utf-8-sig") as f:
    f.write(content)

print("Updated Services.cshtml")
