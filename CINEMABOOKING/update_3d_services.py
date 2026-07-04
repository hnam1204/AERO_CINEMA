import re
import codecs

# 1. Update Services.cshtml HTML
services_path = r"d:\NĂM 2\HỌC KỲ 3\CÔNG NGHỆ PHẦN MỀM\CINEMABOOKING\CINEMABOOKING\Views\Home\Services.cshtml"

with codecs.open(services_path, "r", encoding="utf-8") as f:
    content = f.read()

new_html = r'''<section class="services-hero-full">
    <div class="services-hero">
        <div class="services-hero__content">
            <div class="services-hero__badge">
                <span>✦</span>
                <strong>AERO PREMIUM SERVICES</strong>
            </div>

            <h1 class="services-hero__title">
                <span>DỊCH VỤ</span>
                <span><em>ĐẲNG CẤP</em></span>
                <span>TẠI AERO CINEMA</span>
            </h1>

            <div class="services-hero__underline"></div>

            <p class="services-hero__desc">
                Trải nghiệm điện ảnh trọn vẹn hơn với đặt vé trực tuyến, ẩm thực rạp chiếu,
                phòng chờ cao cấp và dịch vụ tổ chức sự kiện chuyên nghiệp.
            </p>
        </div>

        <div class="services-hero__visual" aria-hidden="true">
            <div class="visual-orbit"></div>

            <div class="visual-chair">
                <div class="chair-seat"></div>
            </div>

            <div class="visual-ticket">
                <div class="ticket-logo">
                    <span>A</span>ERO
                    <small>CINEMA</small>
                </div>
                <div class="ticket-label">VÉ ĐIỆN TỬ</div>
                <div class="ticket-qr"></div>
            </div>

            <div class="visual-popcorn">
                <div class="popcorn-kernels"></div>
                <span>AERO</span>
            </div>

            <div class="visual-drink">
                <span>AERO</span>
            </div>

            <div class="visual-glass-card"></div>
            <div class="visual-platform platform-1"></div>
            <div class="visual-platform platform-2"></div>
            <div class="visual-platform platform-3"></div>
            <div class="visual-light-line"></div>
        </div>
    </div>
</section>'''

# Replace the hero block using regex
content = re.sub(r'(?s)<section class="services-hero-full">.*?</section>', new_html, content, count=1)

# Bump CSS version
content = re.sub(r'href="([^"]*services\.css\?v=)\d+"', r'href="\g<1>7"', content)

with codecs.open(services_path, "w", encoding="utf-8-sig") as f:
    f.write(content)

# 2. Rewrite services.css
css_path = r"d:\NĂM 2\HỌC KỲ 3\CÔNG NGHỆ PHẦN MỀM\CINEMABOOKING\CINEMABOOKING\Content\services.css"

new_css = r'''html,
body {
    overflow-x: hidden;
}

.services-hero-full {
    width: 100vw;
    max-width: 100vw;
    margin-left: calc(50% - 50vw);
    margin-right: calc(50% - 50vw);
    padding: 42px 32px 54px;
    background: #ffffff;
    box-sizing: border-box;
    overflow: hidden;
}

.services-hero {
    position: relative;
    width: 100%;
    max-width: 1780px;
    min-height: 540px;
    margin: 0 auto;
    padding: 70px clamp(64px, 6vw, 120px);
    display: grid;
    grid-template-columns: minmax(520px, .92fr) minmax(720px, 1.08fr);
    align-items: center;
    gap: clamp(34px, 4vw, 76px);
    overflow: hidden;
    border-radius: 38px;
    background:
        radial-gradient(circle at 86% 42%, rgba(0, 91, 170, .16), transparent 34%),
        radial-gradient(circle at 74% 88%, rgba(245, 130, 32, .16), transparent 30%),
        radial-gradient(circle at 52% 40%, rgba(255,255,255,.92), transparent 42%),
        linear-gradient(135deg, #ffffff 0%, #fbfdff 48%, #edf6ff 100%);
    box-shadow:
        0 34px 90px rgba(15, 23, 42, .12),
        inset 0 1px 0 rgba(255,255,255,.98);
}

.services-hero::before {
    content: "";
    position: absolute;
    inset: 0;
    background-image: radial-gradient(circle, rgba(245, 130, 32, .13) 1px, transparent 1.6px);
    background-size: 22px 22px;
    opacity: .32;
    -webkit-mask-image: linear-gradient(90deg, black 0%, transparent 56%);
    mask-image: linear-gradient(90deg, black 0%, transparent 56%);
    pointer-events: none;
}

.services-hero::after {
    content: "";
    position: absolute;
    right: -160px;
    bottom: -160px;
    width: 520px;
    height: 520px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(0,91,170,.12), transparent 68%);
    pointer-events: none;
}

.services-hero__content {
    position: relative;
    z-index: 4;
    max-width: 720px;
}

.services-hero__badge {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    height: 48px;
    padding: 0 26px;
    margin-bottom: 30px;
    border-radius: 999px;
    border: 1.5px solid rgba(245,130,32,.65);
    background: rgba(255,255,255,.92);
    color: #07142f;
    font-size: 15px;
    font-weight: 900;
    letter-spacing: .2px;
    box-shadow: 0 12px 28px rgba(15,23,42,.06);
}

.services-hero__badge span {
    color: #f58220;
}

.services-hero__title {
    margin: 0;
    color: #07142f;
    font-size: clamp(46px, 4.2vw, 78px);
    line-height: 1.08;
    letter-spacing: -1.5px;
    font-weight: 1000;
    text-transform: uppercase;
}

.services-hero__title span {
    display: block;
    white-space: nowrap;
    /* Added clipping fix */
    padding-top: 0.25em;
    padding-bottom: 0.25em;
    margin-bottom: calc(-0.5em + 2px);
}
.services-hero__title span:last-child {
    margin-bottom: 0;
}

.services-hero__title em {
    font-style: normal;
    background: linear-gradient(90deg, #ff6b00 0%, #f58220 50%, #ff9d2f 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    /* Added clipping fix */
    padding-top: 0.25em;
    padding-bottom: 0.25em;
}

.services-hero__underline {
    width: 54px;
    height: 4px;
    margin: 24px 0 28px;
    border-radius: 999px;
    background: linear-gradient(90deg, #f58220, #ff9f43);
}

.services-hero__desc {
    max-width: 650px;
    margin: 0;
    color: #53627c;
    font-size: 18px;
    line-height: 1.7;
    font-weight: 500;
}

.services-hero__visual {
    position: relative;
    z-index: 3;
    min-height: 430px;
    overflow: visible;
}

.visual-orbit {
    position: absolute;
    left: 76px;
    top: 48px;
    width: 350px;
    height: 350px;
    border-radius: 50%;
    border: 2px solid rgba(245,130,32,.26);
    border-left-color: transparent;
    border-bottom-color: transparent;
    transform: rotate(-16deg);
}

.visual-orbit::before,
.visual-orbit::after {
    content: "✦";
    position: absolute;
    color: #f58220;
    font-size: 22px;
}

.visual-orbit::before {
    left: 20px;
    top: 44px;
}

.visual-orbit::after {
    right: 34px;
    top: 8px;
}

.visual-platform {
    position: absolute;
    bottom: 34px;
    height: 42px;
    border-radius: 50%;
    background: linear-gradient(180deg, #ffffff, #eef4fb);
    box-shadow: 0 16px 36px rgba(15,23,42,.12);
    z-index: 1;
}

.platform-1 {
    left: 104px;
    width: 260px;
}

.platform-2 {
    left: 340px;
    width: 300px;
}

.platform-3 {
    right: 86px;
    width: 250px;
}

.visual-chair {
    position: absolute;
    left: 135px;
    bottom: 80px;
    width: 160px;
    height: 150px;
    border-radius: 70px 70px 34px 34px;
    background: radial-gradient(circle at 50% 24%, #1d3f83, #071b4f 70%);
    box-shadow: 0 26px 54px rgba(7,27,79,.25);
    z-index: 4;
}

.visual-chair::before {
    content: "";
    position: absolute;
    left: 22px;
    right: 22px;
    bottom: 28px;
    height: 54px;
    border-radius: 22px;
    background: linear-gradient(145deg, #102653, #07142f);
    box-shadow: inset 0 8px 18px rgba(255,255,255,.08);
}

.visual-chair::after {
    content: "";
    position: absolute;
    left: 44px;
    right: 44px;
    bottom: -26px;
    height: 34px;
    border-left: 8px solid #07142f;
    border-right: 8px solid #07142f;
    transform: perspective(80px) rotateX(20deg);
}

.visual-ticket {
    position: absolute;
    left: 340px;
    top: 26px;
    width: 210px;
    height: 360px;
    border-radius: 34px;
    background: linear-gradient(160deg, #ffffff, #eaf3ff);
    border: 9px solid #07142f;
    box-shadow: 0 34px 70px rgba(15,23,42,.22);
    z-index: 7;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.visual-ticket::before,
.visual-ticket::after {
    content: "";
    position: absolute;
    left: 50%;
    width: 42px;
    height: 24px;
    background: #edf6ff;
    border: 9px solid #07142f;
    border-left: 0;
    border-right: 0;
    transform: translateX(-50%);
}

.visual-ticket::before {
    top: -9px;
    border-radius: 0 0 24px 24px;
    border-top: 0;
}

.visual-ticket::after {
    bottom: -9px;
    border-radius: 24px 24px 0 0;
    border-bottom: 0;
}

.ticket-logo {
    margin-top: 52px;
    color: #07142f;
    font-size: 24px;
    font-weight: 1000;
    text-align: center;
    line-height: 1;
}

.ticket-logo span {
    color: #f58220;
}

.ticket-logo small {
    display: block;
    margin-top: 6px;
    font-size: 12px;
    letter-spacing: 1px;
}

.ticket-label {
    margin-top: 34px;
    color: #07142f;
    font-size: 15px;
    font-weight: 900;
}

.ticket-qr {
    width: 88px;
    height: 88px;
    margin-top: 18px;
    border: 8px solid #07142f;
    background:
        linear-gradient(45deg, #07142f 25%, transparent 25%) 0 0 / 18px 18px,
        linear-gradient(-45deg, #07142f 25%, transparent 25%) 0 0 / 18px 18px,
        linear-gradient(45deg, transparent 75%, #07142f 75%) 0 0 / 18px 18px,
        linear-gradient(-45deg, transparent 75%, #07142f 75%) 0 0 / 18px 18px,
        #fff;
}

.visual-popcorn {
    position: absolute;
    right: 210px;
    bottom: 72px;
    width: 158px;
    height: 210px;
    border-radius: 30px 30px 34px 34px;
    background: linear-gradient(145deg, #0b1f5e, #005baa);
    box-shadow: 0 28px 58px rgba(7,27,79,.25);
    z-index: 5;
    display: grid;
    place-items: center;
    color: #fff;
    font-size: 30px;
    font-weight: 1000;
}

.popcorn-kernels {
    position: absolute;
    left: 8px;
    right: 8px;
    top: -48px;
    height: 82px;
    background:
        radial-gradient(circle at 18% 42%, #ffe7a8 0 14px, transparent 15px),
        radial-gradient(circle at 36% 18%, #ffd06a 0 14px, transparent 15px),
        radial-gradient(circle at 56% 40%, #ffeec7 0 15px, transparent 16px),
        radial-gradient(circle at 76% 20%, #ffc75f 0 14px, transparent 15px),
        radial-gradient(circle at 88% 48%, #ffe7a8 0 14px, transparent 15px);
}

.visual-drink {
    position: absolute;
    right: 72px;
    bottom: 80px;
    width: 98px;
    height: 225px;
    border-radius: 30px 30px 34px 34px;
    background: linear-gradient(145deg, #071b4f, #005baa);
    box-shadow: 0 24px 50px rgba(7,27,79,.24);
    z-index: 4;
    display: grid;
    place-items: center;
    color: #f58220;
    font-size: 24px;
    font-weight: 1000;
}

.visual-drink::before {
    content: "";
    position: absolute;
    right: 24px;
    top: -78px;
    width: 7px;
    height: 112px;
    border-radius: 8px;
    background: rgba(255,255,255,.9);
    transform: rotate(14deg);
}

.visual-glass-card {
    position: absolute;
    right: 32px;
    top: 94px;
    width: 240px;
    height: 180px;
    border-radius: 36px;
    background: rgba(255,255,255,.35);
    border: 1px solid rgba(255,255,255,.72);
    box-shadow: 0 20px 50px rgba(0,91,170,.12);
    z-index: 1;
}

.visual-light-line {
    position: absolute;
    left: 108px;
    right: 80px;
    bottom: 54px;
    height: 4px;
    border-radius: 999px;
    background: linear-gradient(90deg, transparent, rgba(245,130,32,.6), rgba(0,91,170,.4), transparent);
    z-index: 2;
}

.services-section,
.services-list-section {
    width: 100vw;
    max-width: 100vw;
    margin-left: calc(50% - 50vw);
    margin-right: calc(50% - 50vw);
    padding: 20px 48px 90px;
    background: linear-gradient(180deg, #ffffff 0%, #f7f7f7 14%, #f7f7f7 100%);
    box-sizing: border-box;
    overflow: hidden;
}

.services-grid {
    width: min(1160px, 100%);
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 28px 32px;
}

.service-card {
    border-radius: 22px;
    background: #ffffff;
    border: 1px solid #e9eef6;
    box-shadow: 0 18px 42px rgba(15,23,42,.09);
    padding: 34px;
    transition: transform .22s ease, box-shadow .22s ease;
}

.service-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 24px 54px rgba(15,23,42,.13);
}

.service-card h3 {
    font-size: 22px;
    font-weight: 900;
    color: #005baa;
    margin-bottom: 12px;
}

.service-card p,
.service-card li {
    font-size: 15.5px;
    line-height: 1.62;
    color: #53627c;
}

.service-card .btn,
.service-card button,
.service-card a.service-btn {
    height: 42px;
    padding: 0 22px;
    border-radius: 12px;
    background: linear-gradient(135deg, #f58220, #ff9f43);
    color: #fff;
    font-weight: 800;
    border: 0;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 10px 22px rgba(245,130,32,.26);
}

@media (max-width: 1200px) {
    .services-hero {
        grid-template-columns: 1fr;
        padding: 52px 42px 44px;
    }

    .services-hero__title span {
        white-space: normal;
        /* Ensure mobile also uses padding fix */
        padding-top: 0.25em;
        padding-bottom: 0.25em;
        margin-bottom: calc(-0.5em + 2px);
    }
    .services-hero__title span:last-child {
        margin-bottom: 0;
    }

    .services-hero__visual {
        min-height: 410px;
    }

    .services-grid {
        grid-template-columns: 1fr;
        max-width: 760px;
    }
}

@media (max-width: 768px) {
    .services-hero-full {
        padding: 22px 14px 34px;
    }

    .services-hero {
        min-height: auto;
        padding: 30px 20px 28px;
        border-radius: 28px;
    }

    .services-hero__badge {
        height: 40px;
        padding: 0 16px;
        margin-bottom: 22px;
        font-size: 13px;
    }

    .services-hero__title {
        font-size: clamp(30px, 8vw, 42px);
        line-height: 1.18;
        letter-spacing: -0.4px;
    }

    .services-hero__title span {
        white-space: normal;
    }

    .services-hero__desc {
        font-size: 15.5px;
        line-height: 1.55;
    }

    .services-hero__visual {
        transform: scale(.74);
        transform-origin: center top;
        min-height: 320px;
        margin-bottom: -48px;
    }

    .services-section,
    .services-list-section {
        padding: 16px 14px 64px;
    }
}'''

with codecs.open(css_path, "w", encoding="utf-8") as f:
    f.write(new_css)

print("Updated HTML and CSS for 3D Visual Hero")
