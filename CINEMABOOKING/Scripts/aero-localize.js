(function () {
    const dictionary = {
        vi: {
            // Layout & Menu
            "nav_booking": "Mua Vé",
            "nav_movies": "Phim",
            "nav_promotions": "Ưu Đãi",
            "nav_services": "Sự Kiện",
            "nav_cinemas": "Rạp",
            "nav_membership": "Thành Viên",
            "nav_admin": "Quản Trị",
            "nav_login": "Đăng nhập",
            "nav_register": "Đăng ký",
            "nav_logout": "Đăng xuất",
            "search_placeholder": "Tìm kiếm phim...",
            "footer_desc": "Hệ thống rạp chiếu phim hiện đại và tiện lợi, mang đến trải nghiệm điện ảnh chuẩn quốc tế ngay tại Việt Nam.",
            "footer_hotline": "Hotline",
            "footer_support": "Hỗ trợ",
            "footer_faq": "Hỏi đáp FAQ",
            "footer_guide": "Hướng dẫn đặt vé trực tuyến",
            "footer_feedback": "Liên hệ góp ý",
            "footer_policy": "Chính sách",
            "footer_policy_member": "Chính sách thành viên",
            "footer_policy_terms": "Điều khoản sử dụng",
            "footer_policy_payment": "Chính sách thanh toán & đổi trả",
            "footer_connect": "Kết nối",
            "footer_rights": "AERO Cinema. Bảo lưu mọi quyền.",
            "footer_coop": "Hợp tác cùng thương hiệu AERO Cinema",
            
            // Login Page
            "login_title": "ĐĂNG NHẬP",
            "login_subtitle": "Tiếp tục đặt vé và quản lý tài khoản.",
            "login_email_label": "Email",
            "login_email_placeholder": "Nhập email của bạn",
            "login_pass_label": "Mật khẩu",
            "login_pass_placeholder": "Nhập mật khẩu",
            "login_forgot": "Quên mật khẩu?",
            "login_submit": "Đăng nhập",
            "login_no_acc": "Chưa có tài khoản?",
            "login_reg_now": "Đăng ký ngay",
            "login_remember": "Ghi nhớ đăng nhập",
            "error_invalid_email": "Email không hợp lệ",
            "error_require_password": "Vui lòng nhập mật khẩu",
            
            // Register Page
            "reg_title": "ĐĂNG KÝ TÀI KHOẢN",
            "reg_subtitle": "Đăng ký thành viên để nhận ưu đãi.",
            "reg_name_label": "Họ tên",
            "reg_name_placeholder": "Nhập họ tên của bạn",
            "reg_email_label": "Email",
            "reg_email_placeholder": "Nhập email của bạn",
            "reg_phone_label": "Số điện thoại",
            "reg_phone_placeholder": "Nhập số điện thoại",
            "reg_pass_label": "Mật khẩu",
            "reg_pass_placeholder": "Nhập mật khẩu",
            "reg_confirm_label": "Xác nhận mật khẩu",
            "reg_confirm_placeholder": "Nhập lại mật khẩu",
            "reg_otp_btn": "Nhận OTP",
            "reg_otp_sent": "Mã OTP đã được gửi đến email",
            "reg_otp_label": "Mã xác thực OTP",
            "reg_otp_placeholder": "Nhập mã OTP 6 số",
            "reg_submit": "Đăng ký",
            "reg_has_acc": "Đã có tài khoản?",
            "reg_login_now": "Đăng nhập ngay",
            "error_invalid_name": "Vui lòng nhập họ tên",
            "error_invalid_phone": "Số điện thoại không hợp lệ",
            "error_invalid_confirm": "Mật khẩu xác nhận không khớp",
            "error_invalid_otp": "Mã OTP không hợp lệ",
            
            // Forgot Password Page
            "forgot_title": "KHÔI PHỤC MẬT KHẨU",
            "forgot_desc": "Nhập email của bạn để nhận mã xác thực OTP khôi phục mật khẩu.",
            "forgot_email_placeholder": "Nhập email của bạn",
            "forgot_otp_btn": "Gửi mã OTP",
            "forgot_otp_placeholder": "Nhập mã OTP 6 số",
            "forgot_new_pass_label": "Mật khẩu mới",
            "forgot_new_pass_placeholder": "Nhập mật khẩu mới",
            "forgot_submit": "Đổi mật khẩu",
            "forgot_back_login": "Quay lại Đăng nhập",
            "error_require_otp": "Vui lòng nhập mã OTP",
            "error_require_new_password": "Vui lòng nhập mật khẩu mới",
            
            // Movies Page
            "movies_now_showing": "ĐANG CHIẾU",
            "movies_coming_soon": "SẮP CHIẾU",
            "movies_search_title": "Kết quả tìm kiếm",
            "movies_no_found": "Không tìm thấy phim phù hợp.",
            "movie_detail_btn": "Xem Chi Tiết",
            "movie_buy_btn": "Mua Vé",
            
            // Seats Page
            "seats_screen": "MÀN HÌNH CHIẾU PHIM",
            "seats_type_standard": "Ghế thường",
            "seats_type_vip": "Ghế VIP",
            "seats_type_couple": "Ghế đôi",
            "seats_status_selected": "Đang chọn",
            "seats_status_sold": "Đã bán",
            "seats_btn_next": "Tiếp tục",
            "seats_total_temp": "Tạm tính",
            "seats_step_title": "Chọn Ghế",
            "seats_step_combo": "Combo",
            "seats_step_payment": "Thanh Toán",
            "seats_step_complete": "Hoàn Tất",
            "seats_cinema": "Rạp",
            "seats_room": "Phòng chiếu",
            "seats_showtime": "Suất chiếu",
            "seats_time": "Thời gian",
            "seats_selected": "Ghế đã chọn",
            "seats_not_selected": "Chưa chọn",
            
            // Checkout Page
            "checkout_title": "Thanh toán vé",
            "checkout_summary": "Thông tin vé đặt",
            "checkout_movie": "Phim",
            "checkout_cinema": "Rạp",
            "checkout_room": "Phòng chiếu",
            "checkout_showtime": "Suất chiếu",
            "checkout_seats": "Ghế đã chọn",
            "checkout_price": "Giá vé",
            "checkout_total": "Tổng cộng",
            "checkout_payment_method": "Phương thức thanh toán",
            "checkout_bank_transfer": "Chuyển khoản ngân hàng",
            "checkout_confirm_btn": "Tôi đã chuyển khoản - Xác nhận đặt vé",
            "checkout_processing": "Đang xử lý...",
            "checkout_momo": "Ví điện tử MoMo",
            "checkout_vnpay": "Cổng thanh toán VNPAY",
            "checkout_total_label": "Tổng cộng",
            "checkout_acc_owner": "Chủ tài khoản",
            "checkout_acc_num": "Số tài khoản",
            "checkout_info": "Nội dung chuyển khoản",
            "checkout_billing_details": "CHI TIẾT THANH TOÁN",
            "checkout_service_fee": "Phí dịch vụ",
            "checkout_combo_total": "Tiền combo",
            "checkout_discount": "Khuyến mãi",
            "checkout_promo_code": "Mã khuyến mãi",
            "checkout_promo_placeholder": "Mã giảm giá (DGCINE50 / CINEMA10)",
            "checkout_apply_btn": "Áp dụng",
            "checkout_modal_title": "Thanh toán đơn hàng",
            "checkout_checking_transaction": "Hệ thống đang kiểm tra giao dịch...",

            // Ticket History Page
            "history_title": "Lịch sử đặt vé",
            "history_no_tickets": "Bạn chưa đặt vé nào.",
            "history_booking_code": "Mã đặt vé",
            "history_seats": "Ghế",
            "history_amount": "Số tiền",
            "history_status": "Trạng thái",
            "history_date": "Ngày đặt",
            "history_view_ticket": "Xem vé",
            
            // General & Alerts
            "alert_logout_confirm": "Bạn có chắc chắn muốn đăng xuất?",
            "alert_logout_btn": "Đăng xuất",
            "alert_cancel_btn": "Hủy",
            "alert_success": "Thành công",
            "alert_error": "Lỗi",
            "alert_loading": "Vui lòng đợi..."
        },
        en: {
            // Layout & Menu
            "nav_booking": "Book Tickets",
            "nav_movies": "Movies",
            "nav_promotions": "Promotions",
            "nav_services": "Events",
            "nav_cinemas": "Cinemas",
            "nav_membership": "Membership",
            "nav_admin": "Admin Dashboard",
            "nav_login": "Login",
            "nav_register": "Register",
            "nav_logout": "Logout",
            "search_placeholder": "Search movies...",
            "footer_desc": "Modern and convenient cinema system, bringing international standards movie experience in Vietnam.",
            "footer_hotline": "Hotline",
            "footer_support": "Support",
            "footer_faq": "FAQ",
            "footer_guide": "Online Booking Guide",
            "footer_feedback": "Contact & Feedback",
            "footer_policy": "Policy",
            "footer_policy_member": "Membership Policy",
            "footer_policy_terms": "Terms of Service",
            "footer_policy_payment": "Payment & Refund Policy",
            "footer_connect": "Connect Us",
            "footer_rights": "AERO Cinema. All rights reserved.",
            "footer_coop": "In partnership with AERO Cinema",
            
            // Login Page
            "login_title": "LOGIN",
            "login_subtitle": "Continue booking and managing account.",
            "login_email_label": "Email",
            "login_email_placeholder": "Enter your email",
            "login_pass_label": "Password",
            "login_pass_placeholder": "Enter your password",
            "login_forgot": "Forgot Password?",
            "login_submit": "Login",
            "login_no_acc": "Don't have an account?",
            "login_reg_now": "Register now",
            "login_remember": "Remember me",
            "error_invalid_email": "Invalid email",
            "error_require_password": "Password is required",
            
            // Register Page
            "reg_title": "CREATE ACCOUNT",
            "reg_subtitle": "Sign up to receive special updates.",
            "reg_name_label": "Full Name",
            "reg_name_placeholder": "Enter your full name",
            "reg_email_label": "Email",
            "reg_email_placeholder": "Enter your email",
            "reg_phone_label": "Phone Number",
            "reg_phone_placeholder": "Enter phone number",
            "reg_pass_label": "Password",
            "reg_pass_placeholder": "Enter password",
            "reg_confirm_label": "Confirm Password",
            "reg_confirm_placeholder": "Re-enter password",
            "reg_otp_btn": "Get OTP",
            "reg_otp_sent": "OTP verification code sent to email",
            "reg_otp_label": "OTP Verification Code",
            "reg_otp_placeholder": "Enter 6-digit OTP",
            "reg_submit": "Register",
            "reg_has_acc": "Already have an account?",
            "reg_login_now": "Login now",
            "error_invalid_name": "Full name is required",
            "error_invalid_phone": "Invalid phone number",
            "error_invalid_confirm": "Confirm password does not match",
            "error_invalid_otp": "Invalid OTP code",
            
            // Forgot Password Page
            "forgot_title": "RESET PASSWORD",
            "forgot_desc": "Enter your email address to receive password reset OTP code.",
            "forgot_email_placeholder": "Enter your email address",
            "forgot_otp_btn": "Send OTP",
            "forgot_otp_placeholder": "Enter 6-digit OTP",
            "forgot_new_pass_label": "New Password",
            "forgot_new_pass_placeholder": "Enter new password",
            "forgot_submit": "Change Password",
            "forgot_back_login": "Back to Login",
            "error_require_otp": "OTP code is required",
            "error_require_new_password": "New password is required",
            
            // Movies Page
            "movies_now_showing": "NOW SHOWING",
            "movies_coming_soon": "COMING SOON",
            "movies_search_title": "Search Results",
            "movies_no_found": "No movies found.",
            "movie_detail_btn": "View Details",
            "movie_buy_btn": "Buy Tickets",
            
            // Seats Page
            "seats_screen": "SCREEN",
            "seats_type_standard": "Standard",
            "seats_type_vip": "VIP",
            "seats_type_couple": "Couple",
            "seats_status_selected": "Selected",
            "seats_status_sold": "Sold",
            "seats_btn_next": "Continue",
            "seats_total_temp": "Subtotal",
            "seats_step_title": "Select Seats",
            "seats_step_combo": "Combo",
            "seats_step_payment": "Checkout",
            "seats_step_complete": "Complete",
            "seats_cinema": "Cinema",
            "seats_room": "Room",
            "seats_showtime": "Showtime",
            "seats_time": "Time",
            "seats_selected": "Selected Seats",
            "seats_not_selected": "Not selected",
            
            // Checkout Page
            "checkout_title": "Checkout Ticket",
            "checkout_summary": "Booking Summary",
            "checkout_movie": "Movie",
            "checkout_cinema": "Cinema",
            "checkout_room": "Room",
            "checkout_showtime": "Showtime",
            "checkout_seats": "Selected Seats",
            "checkout_price": "Ticket Price",
            "checkout_total": "Total Amount",
            "checkout_payment_method": "Payment Method",
            "checkout_bank_transfer": "Bank Transfer",
            "checkout_confirm_btn": "Confirm Booking",
            "checkout_processing": "Processing...",
            "checkout_momo": "MoMo E-Wallet",
            "checkout_vnpay": "VNPAY Gate",
            "checkout_total_label": "Total Amount",
            "checkout_acc_owner": "Account Holder",
            "checkout_acc_num": "Account Number",
            "checkout_info": "Transfer Description",
            "checkout_billing_details": "PAYMENT DETAILS",
            "checkout_service_fee": "Service Fee",
            "checkout_combo_total": "Combo total",
            "checkout_discount": "Discount",
            "checkout_promo_code": "Promo code",
            "checkout_promo_placeholder": "Promo code (DGCINE50 / CINEMA10)",
            "checkout_apply_btn": "Apply",
            "checkout_modal_title": "Order Payment",
            "checkout_checking_transaction": "Checking transaction status...",

            // Ticket History Page
            "history_title": "Booking History",
            "history_no_tickets": "You have no bookings.",
            "history_booking_code": "Booking Code",
            "history_seats": "Seats",
            "history_amount": "Amount",
            "history_status": "Status",
            "history_date": "Booking Date",
            "history_view_ticket": "View Ticket",
            
            // General & Alerts
            "alert_logout_confirm": "Are you sure you want to log out?",
            "alert_logout_btn": "Logout",
            "alert_cancel_btn": "Cancel",
            "alert_success": "Success",
            "alert_error": "Error",
            "alert_loading": "Please wait..."
        }
    };

    function highlightToggle(lang) {
        const viBtn = document.getElementById("lang-toggle-vi");
        const enBtn = document.getElementById("lang-toggle-en");
        if (viBtn && enBtn) {
            if (lang === "vi") {
                viBtn.classList.add("active");
                viBtn.style.fontWeight = "bold";
                viBtn.style.color = "var(--accent-color)";
                enBtn.classList.remove("active");
                enBtn.style.fontWeight = "normal";
                enBtn.style.color = "";
            } else {
                enBtn.classList.add("active");
                enBtn.style.fontWeight = "bold";
                enBtn.style.color = "var(--accent-color)";
                viBtn.classList.remove("active");
                viBtn.style.fontWeight = "normal";
                viBtn.style.color = "";
            }
        }
    }

    function applyTranslations(lang) {
        const currentLang = (lang === "en" || lang === "vi") ? lang : "vi";
        document.documentElement.setAttribute("lang", currentLang);

        // Translate elements with data-translate attribute
        document.querySelectorAll('[data-translate]').forEach(el => {
            const key = el.getAttribute('data-translate');
            const translation = dictionary[currentLang] ? dictionary[currentLang][key] : null;
            if (translation !== null && translation !== undefined) {
                el.innerHTML = translation;
            }
        });

        // Translate inputs with data-translate-placeholder attribute
        document.querySelectorAll('[data-translate-placeholder]').forEach(el => {
            const key = el.getAttribute('data-translate-placeholder');
            const translation = dictionary[currentLang] ? dictionary[currentLang][key] : null;
            if (translation !== null && translation !== undefined) {
                el.placeholder = translation;
            }
        });

        // Update document titles based on active route path
        const path = window.location.pathname.toLowerCase();
        if (path.includes("/account/login")) {
            document.title = currentLang === "en" ? "Login - AERO Cinema" : "Đăng Nhập - AERO Cinema";
        } else if (path.includes("/account/register")) {
            document.title = currentLang === "en" ? "Register - AERO Cinema" : "Đăng Ký - AERO Cinema";
        } else if (path.includes("/account/forgotpassword")) {
            document.title = currentLang === "en" ? "Reset Password - AERO Cinema" : "Khôi Phục Mật Khẩu - AERO Cinema";
        } else if (path.includes("/movies")) {
            document.title = currentLang === "en" ? "Movies - AERO Cinema" : "Danh Sách Phim - AERO Cinema";
        } else if (path.includes("/showtimes") || path.includes("/booking")) {
            if (path.includes("/seats")) {
                document.title = currentLang === "en" ? "Select Seats - AERO Cinema" : "Chọn Ghế - AERO Cinema";
            } else if (path.includes("/checkout")) {
                document.title = currentLang === "en" ? "Checkout - AERO Cinema" : "Thanh Toán - AERO Cinema";
            } else if (path.includes("/success")) {
                document.title = currentLang === "en" ? "Booking Success - AERO Cinema" : "Đặt Vé Thành Công - AERO Cinema";
            } else {
                document.title = currentLang === "en" ? "Book Tickets - AERO Cinema" : "Mua Vé - AERO Cinema";
            }
        } else if (path.includes("/account/tickethistory")) {
            document.title = currentLang === "en" ? "Booking History - AERO Cinema" : "Lịch Sử Đặt Vé - AERO Cinema";
        } else if (path.includes("/account/profile")) {
            document.title = currentLang === "en" ? "Profile - AERO Cinema" : "Thông Tin Cá Nhân - AERO Cinema";
        }

        // Localize dynamic role label elements
        const roleLabelEl = document.getElementById("nav-role-label");
        if (roleLabelEl) {
            const isTextAdmin = roleLabelEl.textContent.trim().toLowerCase().includes("admin");
            if (currentLang === "en") {
                roleLabelEl.textContent = isTextAdmin ? "Admin" : "Member";
            } else {
                roleLabelEl.textContent = isTextAdmin ? "Admin" : "Thành viên";
            }
        }

        highlightToggle(currentLang);
    }

    window.setLanguage = function (lang) {
        const targetLang = (lang === "en" || lang === "vi") ? lang : "vi";
        localStorage.setItem("language", targetLang);

        // Smooth transition effect (0.2s fade)
        document.body.style.transition = 'opacity 0.2s ease-in-out';
        document.body.style.opacity = '0';
        
        setTimeout(() => {
            applyTranslations(targetLang);
            document.body.style.opacity = '1';

            // Sync with Firestore if logged in
            if (window.updateUserLanguageInFirestore) {
                window.updateUserLanguageInFirestore(targetLang);
            }
        }, 200);
    };

    window.applyLanguage = function (lang) {
        applyTranslations(lang);
    };

    // Auto run on load
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            const lang = localStorage.getItem("language") || "vi";
            applyTranslations(lang);
        });
    } else {
        const lang = localStorage.getItem("language") || "vi";
        applyTranslations(lang);
    }
})();
