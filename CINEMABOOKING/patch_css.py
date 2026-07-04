import re

css_path = r"d:\NĂM 2\HỌC KỲ 3\CÔNG NGHỆ PHẦN MỀM\CINEMABOOKING\CINEMABOOKING\Content\promotions.css"

with open(css_path, "r", encoding="utf-8") as f:
    css = f.read()

def replace_block(pattern_str, replacement):
    global css
    # pattern_str is just the selector, we want to match the selector and its block.
    # Note: this simple regex assumes standard formatting and no nested blocks in these specific selectors.
    regex = re.compile(re.escape(pattern_str) + r'\s*\{[^}]*\}', re.DOTALL)
    if regex.search(css):
        css = regex.sub(replacement, css)
    else:
        print(f"Pattern not found: {pattern_str}")
        
def replace_multiple_selectors(regex_pattern, replacement):
    global css
    regex = re.compile(regex_pattern, re.DOTALL)
    if regex.search(css):
        css = regex.sub(replacement, css)
    else:
        print(f"Pattern not found: {regex_pattern}")

# 1. FIX HERO GỌN VÀ CÂN ĐỐI HƠN
replace_multiple_selectors(r'\.promotions-hero,\s*\.aero-promotion-hero\s*\{[^}]*\}', '''.promotions-hero {
    position: relative;
    width: 100%;
    max-width: 1760px;
    min-height: 470px;
    margin: 0 auto;
    padding: 54px clamp(48px, 4.5vw, 88px);
    display: grid;
    grid-template-columns: minmax(480px, .95fr) minmax(600px, 1.05fr);
    align-items: center;
    gap: clamp(18px, 2.2vw, 36px);
    overflow: hidden;
    border-radius: 36px;
    background:
        radial-gradient(circle at 82% 40%, rgba(0, 91, 170, .16), transparent 34%),
        radial-gradient(circle at 72% 88%, rgba(245, 130, 32, .12), transparent 28%),
        linear-gradient(135deg, #ffffff 0%, #fbfdff 44%, #eef5ff 100%);
    box-shadow:
        0 26px 66px rgba(15, 23, 42, .09),
        inset 0 1px 0 rgba(255,255,255,.96);
}''')

# 2. FIX CHỮ BÊN TRÁI NHỎ GỌN HƠN
replace_multiple_selectors(r'\.promotions-hero__content,\s*\.aero-promotion-hero__content\s*\{[^}]*\}', '''.promotions-hero__content {
    position: relative;
    z-index: 3;
    max-width: 660px;
}''')

replace_multiple_selectors(r'\.promotions-hero__badge,\s*\.aero-promotion-hero__badge\s*\{[^}]*\}', '''.promotions-hero__badge {
    height: 44px;
    padding: 0 22px;
    margin-bottom: 26px;
    border-radius: 999px;
    font-size: 14.5px;
    font-weight: 900;
}''')

replace_multiple_selectors(r'\.promotions-hero__title,\s*\.aero-promotion-hero__title\s*\{[^}]*\}', '''.promotions-hero__title {
    margin: 0;
    max-width: 660px;
    color: #07142f;
    font-size: clamp(38px, 3.25vw, 60px);
    line-height: 1.15;
    letter-spacing: -0.8px;
    font-weight: 1000;
    text-transform: uppercase;
}''')

replace_multiple_selectors(r'\.promotions-hero__title span,\s*\.aero-promotion-hero__title span\s*\{[^}]*\}', '''.promotions-hero__title span {
    display: block;
    white-space: nowrap;
}''')

replace_multiple_selectors(r'\.promotions-hero__title em,\s*\.aero-promotion-hero__title em\s*\{[^}]*\}', '''.promotions-hero__title em {
    font-style: normal;
    background: linear-gradient(90deg, #ff6b00 0%, #f58220 50%, #ff9d2f 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
}''')

replace_multiple_selectors(r'\.promotions-hero__desc,\s*\.aero-promotion-hero__desc\s*\{[^}]*\}', '''.promotions-hero__desc {
    max-width: 540px;
    margin: 22px 0 0;
    color: #53627c;
    font-size: 16px;
    line-height: 1.6;
    font-weight: 500;
}''')

replace_multiple_selectors(r'\.promotions-hero__desc strong,\s*\.aero-promotion-hero__desc strong\s*\{[^}]*\}', '''.promotions-hero__desc strong {
    color: #f58220;
    font-weight: 800;
}''')

# 3. KÉO VISUAL VỀ GẦN CHỮ HƠN
replace_multiple_selectors(r'\.promotions-hero__visual,\s*\.aero-promotion-hero__visual\s*\{[^}]*\}', '''.promotions-hero__visual {
    position: relative;
    z-index: 2;
    min-height: 360px;
    overflow: visible;
    transform: translateX(-80px);
}''')

replace_multiple_selectors(r'\.hero-film-reel,\s*\.film-reel\s*\{[^}]*\}', '''.hero-film-reel {
    position: absolute;
    left: 40px !important;
    top: 72px !important;
    width: 178px !important;
    height: 178px !important;
}''')

replace_multiple_selectors(r'\.hero-rewards-card,\s*\.rewards-card\s*\{[^}]*\}', '''.hero-rewards-card {
    position: absolute;
    left: 72px !important;
    bottom: 68px !important;
    width: 310px !important;
    height: 138px !important;
    transform: rotate(-8deg);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border-radius: 16px;
    background: linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(248,250,252,1) 100%);
    box-shadow: 0 20px 40px rgba(15, 23, 42, .12), inset 0 2px 0 rgba(255,255,255,1);
    color: #071b4f;
    font-size: 28px;
    font-weight: 900;
    letter-spacing: -0.5px;
    z-index: 4;
}''')

replace_multiple_selectors(r'\.hero-popcorn-bucket,\s*\.popcorn-bucket\s*\{[^}]*\}', '''.hero-popcorn-bucket {
    position: absolute;
    right: 160px !important;
    bottom: 40px !important;
    width: 220px !important;
    height: 274px !important;
    z-index: 3;
}''')

replace_multiple_selectors(r'\.hero-drink-cup,\s*\.drink-cup\s*\{[^}]*\}', '''.hero-drink-cup {
    position: absolute;
    right: 62px !important;
    bottom: 50px !important;
    width: 116px !important;
    height: 238px !important;
    z-index: 2;
}''')

replace_block('.hero-light-line', '''.hero-light-line {
    position: absolute;
    left: 60px !important;
    right: 90px !important;
    bottom: 18px !important;
    height: 2px;
    background: radial-gradient(circle, rgba(245, 130, 32, .5), transparent 70%);
    z-index: 1;
}''')

# 4. KÉO CARD ƯU ĐÃI LÊN GẦN HERO
replace_block('.promotions-list-section', '''.promotions-list-section {
    width: 100vw;
    max-width: 100vw;
    margin-left: calc(50% - 50vw);
    margin-right: calc(50% - 50vw);
    padding: 14px 48px 90px;
    background: linear-gradient(180deg, #ffffff 0%, #f7f7f7 12%, #f7f7f7 100%);
    box-sizing: border-box;
    overflow: hidden;
}''')

replace_multiple_selectors(r'\.promotions-grid,\s*\.promo-wrapper \.promo-grid\s*\{[^}]*\}', '''.promotions-grid,
.promo-wrapper .promo-grid {
    width: min(1500px, 100%);
    max-width: none;
    margin: 0 auto;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 32px;
}''')

# 5. FIX BUTTON VÀ MODAL KHÔNG MẤT STYLE
replace_block('.promo-card-actions', '''.promo-card-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 18px;
}''')

replace_block('.promo-btn', '''.promo-btn {
    height: 40px;
    border-radius: 12px;
    padding: 0 16px;
    font-size: 13px;
    font-weight: 800;
    cursor: pointer;
    border: 0;
    font-family: inherit;
    transition: .2s ease;
}''')

replace_block('.promo-btn-primary', '''.promo-btn-primary {
    flex: 1;
    color: #fff;
    background: linear-gradient(135deg, #f58220, #ff9f43);
    box-shadow: 0 10px 22px rgba(245,130,32,.26);
}''')

replace_block('.promo-btn-copy', '''.promo-btn-copy {
    color: #f58220;
    background: rgba(245,130,32,.08);
    border: 1px dashed #f58220;
}''')

replace_block('.promo-modal', '''.promo-modal {
    position: fixed;
    inset: 0;
    z-index: 9998;
    display: none;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(15, 23, 42, .68);
    backdrop-filter: blur(8px);
}''')

replace_block('.promo-modal.show', '''.promo-modal.show {
    display: flex;
}''')

# 7. RESPONSIVE
# This part replaces specific media queries
css = re.sub(
    r'@media\s*\(\s*max-width:\s*1200px\s*\)\s*\{[^{]*\.promotions-hero,\s*\.aero-promotion-hero\s*\{[^}]*\}[^{]*\.promotions-hero__title span,\s*\.aero-promotion-hero__title span\s*\{[^}]*\}[^{]*\.promotions-hero__visual,\s*\.aero-promotion-hero__visual\s*\{[^}]*\}[^{]*\.promotions-grid,\s*\.promo-wrapper \.promo-grid\s*\{[^}]*\}[^}]*\}',
    '''@media (max-width: 1200px) {
    .promotions-hero {
        grid-template-columns: 1fr;
        padding: 48px 38px 40px;
        gap: 22px;
    }

    .promotions-hero__title span {
        white-space: normal;
    }

    .promotions-hero__visual {
        transform: none;
        min-height: 340px;
    }

    .promotions-grid,
    .promo-wrapper .promo-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}''',
    css, flags=re.DOTALL
)

css = re.sub(
    r'@media\s*\(\s*max-width:\s*768px\s*\)\s*\{.*?(?=@media|$)',
    '''@media (max-width: 768px) {
    .promotions-hero-full {
        padding: 20px 14px 30px;
    }

    .promotions-list-section {
        padding: 14px 14px 64px;
    }

    .promotions-hero {
        min-height: auto;
        padding: 28px 20px 26px;
        border-radius: 28px;
        gap: 20px;
    }

    .promotions-hero__title {
        font-size: clamp(30px, 8vw, 40px);
        line-height: 1.18;
        letter-spacing: -0.4px;
    }

    .promotions-hero__title span {
        white-space: normal;
    }

    .promotions-hero__desc {
        font-size: 15.5px;
        line-height: 1.55;
    }

    .promotions-hero__visual {
        transform: scale(.74);
        transform-origin: center top;
        min-height: 280px;
        margin-bottom: -50px;
    }

    .promotions-grid,
    .promo-wrapper .promo-grid {
        width: 100%;
        grid-template-columns: 1fr;
        gap: 22px;
    }

    .promo-card-actions,
    .promo-modal-actions {
        flex-direction: column;
    }

    .promo-modal-info {
        grid-template-columns: 1fr;
    }

    .promo-modal-media img {
        height: 210px;
    }
}
''',
    css, flags=re.DOTALL
)

with open(css_path, "w", encoding="utf-8") as f:
    f.write(css)
print("Updated CSS successfully.")
