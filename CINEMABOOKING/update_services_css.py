import codecs

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
    padding: 34px 28px 42px;
    background: #ffffff;
    box-sizing: border-box;
    overflow: hidden;
}

.services-hero {
    position: relative;
    width: 100%;
    max-width: 1760px;
    min-height: 500px;
    margin: 0 auto;
    padding: 58px clamp(52px, 5vw, 96px);
    display: grid;
    grid-template-columns: minmax(500px, .95fr) minmax(620px, 1.05fr);
    align-items: center;
    gap: clamp(28px, 3vw, 54px);
    overflow: hidden;
    border-radius: 38px;
    background:
        radial-gradient(circle at 84% 40%, rgba(0, 91, 170, .16), transparent 34%),
        radial-gradient(circle at 72% 88%, rgba(245, 130, 32, .12), transparent 28%),
        linear-gradient(135deg, #ffffff 0%, #fbfdff 44%, #eef5ff 100%);
    box-shadow:
        0 28px 72px rgba(15, 23, 42, .10),
        inset 0 1px 0 rgba(255,255,255,.96);
}

.services-hero::before {
    content: "";
    position: absolute;
    inset: 0;
    background-image: radial-gradient(circle, rgba(245,130,32,.13) 1px, transparent 1.6px);
    background-size: 22px 22px;
    opacity: .28;
    -webkit-mask-image: linear-gradient(90deg, black 0%, transparent 58%);
    mask-image: linear-gradient(90deg, black 0%, transparent 58%);
    pointer-events: none;
}

.services-hero__content {
    position: relative;
    z-index: 3;
    max-width: 680px;
}

.services-hero__badge {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    height: 44px;
    padding: 0 22px;
    margin-bottom: 28px;
    border-radius: 999px;
    border: 1.5px solid rgba(245,130,32,.65);
    background: rgba(255,255,255,.92);
    color: #071b4f;
    font-size: 14.5px;
    font-weight: 900;
    letter-spacing: .2px;
}

.services-hero__badge span,
.services-hero__badge i {
    color: #f58220;
}

.services-hero__title {
    margin: 0;
    max-width: 680px;
    color: #07142f;
    font-size: clamp(40px, 3.45vw, 66px);
    line-height: 1.13;
    letter-spacing: -1px;
    font-weight: 1000;
    text-transform: uppercase;
}

.services-hero__title span {
    display: block;
    white-space: nowrap;
}

.services-hero__title em {
    font-style: normal;
    background: linear-gradient(90deg, #ff6b00 0%, #f58220 50%, #ff9d2f 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
}

.services-hero__desc {
    max-width: 610px;
    margin: 26px 0 0;
    color: #53627c;
    font-size: 17px;
    line-height: 1.65;
    font-weight: 500;
}

.services-hero__visual {
    position: relative;
    z-index: 2;
    min-height: 390px;
    overflow: visible;
    transform: translateX(-20px);
}

.service-chair {
    position: absolute;
    left: 40px !important;
    bottom: 54px !important;
    width: 210px !important;
    height: 220px !important;
    border-radius: 34px;
    background: linear-gradient(145deg, #102653, #07142f);
    box-shadow: 0 30px 60px rgba(7,20,47,.22);
}

.service-chair::before {
    content: "";
    position: absolute;
    left: 28px;
    right: 28px;
    top: 24px;
    height: 118px;
    border-radius: 24px;
    background:
        linear-gradient(135deg, transparent 48%, rgba(255,255,255,.18) 49%, transparent 51%),
        linear-gradient(45deg, transparent 48%, rgba(255,255,255,.14) 49%, transparent 51%);
    background-size: 38px 38px;
    border: 1px solid rgba(255,255,255,.16);
}

.service-phone {
    position: absolute;
    left: 260px !important;
    bottom: 40px !important;
    width: 210px !important;
    height: 355px !important;
    border-radius: 34px;
    background: linear-gradient(160deg, #ffffff, #eaf3ff);
    border: 9px solid #07142f;
    box-shadow: 0 34px 70px rgba(15,23,42,.20);
    z-index: 6;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.phone-logo {
    position: absolute;
    top: 34px;
    color: #07142f;
    font-size: 24px;
    font-weight: 1000;
    text-align: center;
    line-height: 1;
}

.phone-logo::first-letter {
    color: #f58220;
}

.phone-logo small {
    font-size: 12px;
    letter-spacing: 1px;
}

.phone-ticket {
    width: 145px;
    height: 170px;
    border-radius: 18px;
    background: #ffffff;
    border: 2px dashed rgba(245,130,32,.55);
    box-shadow: 0 16px 34px rgba(15,23,42,.12);
    color: #07142f;
    font-size: 15px;
    font-weight: 900;
    text-align: center;
    padding-top: 26px;
}

.phone-ticket span {
    display: grid;
    place-items: center;
    margin: 18px auto 0;
    width: 78px;
    height: 78px;
    color: #fff;
    background: repeating-linear-gradient(
        45deg,
        #07142f 0 6px,
        #ffffff 6px 10px
    );
    border: 8px solid #07142f;
    font-size: 18px;
}

.service-popcorn {
    position: absolute;
    right: 150px !important;
    bottom: 50px !important;
    width: 170px !important;
    height: 210px !important;
    border-radius: 28px 28px 34px 34px;
    background: linear-gradient(145deg, #0b1f5e, #005baa);
    box-shadow: 0 28px 58px rgba(7,27,79,.25);
    z-index: 5;
}

.service-popcorn::before {
    content: "";
    position: absolute;
    left: 8px;
    right: 8px;
    top: -42px;
    height: 78px;
    background:
        radial-gradient(circle at 20% 45%, #ffe7a8 0 14px, transparent 15px),
        radial-gradient(circle at 38% 18%, #ffd06a 0 14px, transparent 15px),
        radial-gradient(circle at 58% 40%, #ffeec7 0 15px, transparent 16px),
        radial-gradient(circle at 78% 20%, #ffc75f 0 14px, transparent 15px);
}

.service-popcorn::after {
    content: "AERO";
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    color: #fff;
    font-size: 34px;
    font-weight: 1000;
}

.service-drink {
    position: absolute;
    right: 32px !important;
    bottom: 58px !important;
    width: 98px !important;
    height: 222px !important;
    border-radius: 28px 28px 34px 34px;
    background: linear-gradient(145deg, #071b4f, #005baa);
    box-shadow: 0 24px 50px rgba(7,27,79,.24);
    z-index: 4;
}

.service-drink::before {
    content: "";
    position: absolute;
    right: 20px;
    top: -76px;
    width: 7px;
    height: 108px;
    border-radius: 8px;
    background: rgba(255,255,255,.9);
    transform: rotate(14deg);
}

.service-drink::after {
    content: "AERO";
    position: absolute;
    top: 80px;
    left: 0;
    right: 0;
    text-align: center;
    color: #f58220;
    font-size: 24px;
    font-weight: 1000;
}

.service-event-icon {
    position: absolute;
    right: 0;
    top: 72px;
    width: 150px;
    height: 150px;
    border-radius: 34px;
    background: rgba(255,255,255,.38);
    border: 1px solid rgba(255,255,255,.7);
    box-shadow: 0 20px 50px rgba(0,91,170,.12);
    z-index: 1;
}

.service-event-icon::before {
    content: "★";
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    color: rgba(0,91,170,.28);
    font-size: 60px;
}

.service-light-line {
    position: absolute;
    left: 40px !important;
    right: 40px !important;
    bottom: 22px !important;
    height: 4px;
    border-radius: 999px;
    background: linear-gradient(90deg, transparent, rgba(245,130,32,.55), rgba(0,91,170,.38), transparent);
}

.services-section,
.services-list-section {
    width: 100vw;
    max-width: 100vw;
    margin-left: calc(50% - 50vw);
    margin-right: calc(50% - 50vw);
    padding: 22px 48px 90px;
    background: linear-gradient(180deg, #ffffff 0%, #f7f7f7 15%, #f7f7f7 100%);
    box-sizing: border-box;
    overflow: hidden;
}

.services-grid {
    width: min(1120px, 100%);
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
        gap: 26px;
    }

    .services-hero__title span {
        white-space: normal;
    }

    .services-hero__visual {
        transform: none;
        min-height: 360px;
    }

    .services-grid {
        grid-template-columns: 1fr;
        max-width: 760px;
    }
}

@media (max-width: 768px) {
    .services-hero-full {
        padding: 20px 14px 32px;
    }

    .services-section,
    .services-list-section {
        padding: 16px 14px 64px;
    }

    .services-hero {
        min-height: auto;
        padding: 30px 20px 28px;
        border-radius: 28px;
        gap: 20px;
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
        min-height: 280px;
        margin-bottom: -48px;
    }

    .service-card {
        padding: 24px;
    }
}'''

with codecs.open(css_path, "w", encoding="utf-8") as f:
    f.write(new_css)

print("Updated services.css")
