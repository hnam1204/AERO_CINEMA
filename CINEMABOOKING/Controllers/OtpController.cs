using System;
using System.Configuration;
using System.Globalization;
using System.Net;
using System.Net.Mail;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using System.Web.Mvc;
using System.Web.Script.Serialization;

namespace CINEMABOOKING.Controllers
{
    public class OtpController : Controller
    {
        private const int OtpLifetimeMinutes = 5;

        private void SetCulture(string lang)
        {
            if (!string.IsNullOrEmpty(lang))
            {
                try
                {
                    var cultureName = string.Equals(lang, "en", StringComparison.OrdinalIgnoreCase) ? "en-US" : "vi-VN";
                    var culture = CultureInfo.GetCultureInfo(cultureName);
                    System.Threading.Thread.CurrentThread.CurrentCulture = culture;
                    System.Threading.Thread.CurrentThread.CurrentUICulture = culture;
                }
                catch { }
            }
        }

        [HttpPost]
        public JsonResult Send(string email, string lang = "vi")
        {
            return SendRegisterOtp(email, lang);
        }

        [HttpPost]
        public JsonResult Verify(string email, string code, string lang = "vi")
        {
            return VerifyRegisterOtp(email, code, lang);
        }

        [HttpPost]
        public JsonResult SendRegisterOtp(string email, string lang = "vi")
        {
            SetCulture(lang);
            return SendOtp(
                email,
                "REGISTER_OTP_EMAIL",
                "REGISTER_OTP_CODE",
                "REGISTER_OTP_EXPIRE_AT",
                Resources.Language.RegisterOtpSubject,
                BuildRegisterOtpBody,
                lang);
        }

        [HttpPost]
        public JsonResult VerifyRegisterOtp(string email, string code, string lang = "vi")
        {
            SetCulture(lang);
            return VerifyOtp(
                email,
                code,
                "REGISTER_OTP_EMAIL",
                "REGISTER_OTP_CODE",
                "REGISTER_OTP_EXPIRE_AT",
                "REGISTER_OTP_VERIFIED_EMAIL",
                lang);
        }

        [HttpPost]
        public JsonResult SendForgotPasswordOtp(string email, string lang = "vi")
        {
            SetCulture(lang);
            return SendOtp(
                email,
                "FORGOT_OTP_EMAIL",
                "FORGOT_OTP_CODE",
                "FORGOT_OTP_EXPIRE_AT",
                Resources.Language.ForgotOtpSubject,
                BuildForgotPasswordOtpBody,
                lang);
        }

        [HttpPost]
        public JsonResult VerifyForgotPasswordOtp(string email, string code, string lang = "vi")
        {
            SetCulture(lang);
            return VerifyOtp(
                email,
                code,
                "FORGOT_OTP_EMAIL",
                "FORGOT_OTP_CODE",
                "FORGOT_OTP_EXPIRE_AT",
                "FORGOT_OTP_VERIFIED_EMAIL",
                lang);
        }

        [HttpPost]
        public JsonResult SendLoginAlert(string email)
        {
            var normalizedEmail = NormalizeEmail(email);

            if (!IsValidEmail(normalizedEmail))
            {
                return Json(new { success = false, message = "Email không hợp lệ." });
            }

            SmtpSettings smtpSettings;
            var configError = TryGetSmtpSettings(out smtpSettings);
            if (!string.IsNullOrEmpty(configError))
            {
                return Json(new { success = false, message = configError });
            }

            try
            {
                var loginInfo = BuildLoginInfo();
                SendEmail(
                    smtpSettings,
                    normalizedEmail,
                    "Cảnh báo đăng nhập AERO Cinema",
                    BuildLoginAlertBody(loginInfo));

                return Json(new { success = true, message = "Đã gửi email cảnh báo đăng nhập." });
            }
            catch (Exception ex)
            {
                return Json(new
                {
                    success = false,
                    message = "Không thể gửi email cảnh báo đăng nhập.",
                    detail = ex.Message
                });
            }
        }

        private JsonResult SendOtp(
            string email,
            string emailSessionKey,
            string codeSessionKey,
            string expireSessionKey,
            string subject,
            Func<string, string> bodyBuilder,
            string lang)
        {
            SetCulture(lang);
            var normalizedEmail = NormalizeEmail(email);

            if (!IsValidEmail(normalizedEmail))
            {
                return Json(new { success = false, message = Resources.Language.InvalidEmail });
            }

            SmtpSettings smtpSettings;
            var configError = TryGetSmtpSettings(out smtpSettings);
            if (!string.IsNullOrEmpty(configError))
            {
                return Json(new { success = false, message = configError });
            }

            var otpCode = GenerateOtpCode();

            Session[emailSessionKey] = normalizedEmail;
            Session[codeSessionKey] = otpCode;
            Session[expireSessionKey] = DateTime.UtcNow.AddMinutes(OtpLifetimeMinutes);

            try
            {
                SendEmail(smtpSettings, normalizedEmail, subject, bodyBuilder(otpCode));
                return Json(new { success = true, message = Resources.Language.OtpSent });
            }
            catch (Exception ex)
            {
                ClearOtpSession(emailSessionKey, codeSessionKey, expireSessionKey);
                return Json(new
                {
                    success = false,
                    message = Resources.Language.OtpSendFailed,
                    detail = ex.Message
                });
            }
        }

        private JsonResult VerifyOtp(
            string email,
            string code,
            string emailSessionKey,
            string codeSessionKey,
            string expireSessionKey,
            string verifiedSessionKey,
            string lang)
        {
            SetCulture(lang);
            var normalizedEmail = NormalizeEmail(email);
            var inputCode = (code ?? string.Empty).Trim();
            var sessionEmail = Session[emailSessionKey] as string;
            var sessionCode = Session[codeSessionKey] as string;
            var expireObj = Session[expireSessionKey];

            if (!IsValidEmail(normalizedEmail) ||
                !Regex.IsMatch(inputCode, @"^\d{6}$") ||
                string.IsNullOrWhiteSpace(sessionEmail) ||
                string.IsNullOrWhiteSpace(sessionCode) ||
                !(expireObj is DateTime))
            {
                return Json(new { success = false, message = Resources.Language.OtpInvalidOrExpired });
            }

            var expireAt = (DateTime)expireObj;

            if (DateTime.UtcNow > expireAt)
            {
                ClearOtpSession(emailSessionKey, codeSessionKey, expireSessionKey);
                return Json(new { success = false, message = Resources.Language.OtpInvalidOrExpired });
            }

            if (!string.Equals(sessionEmail, normalizedEmail, StringComparison.OrdinalIgnoreCase) ||
                !string.Equals(sessionCode, inputCode, StringComparison.Ordinal))
            {
                return Json(new { success = false, message = Resources.Language.OtpInvalidOrExpired });
            }

            Session[verifiedSessionKey] = normalizedEmail;
            ClearOtpSession(emailSessionKey, codeSessionKey, expireSessionKey);

            return Json(new { success = true, message = Resources.Language.VerificationSuccess });
        }

        private static string BuildRegisterOtpBody(string otpCode)
        {
            if (IsEnglishCulture())
            {
                return
                    "Hello,\n\n" +
                    "Your AERO Cinema account registration verification code is:\n\n" +
                    otpCode + "\n\n" +
                    "This code is valid for 5 minutes.\n\n" +
                    "If you did not make this request, please ignore this email.\n\n" +
                    "AERO Cinema";
            }

            return
                "Xin chào,\n\n" +
                "Mã xác nhận đăng ký tài khoản AERO Cinema của bạn là:\n\n" +
                otpCode + "\n\n" +
                "Mã có hiệu lực trong 5 phút.\n\n" +
                "Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.\n\n" +
                "AERO Cinema";
        }

        private static string BuildForgotPasswordOtpBody(string otpCode)
        {
            if (IsEnglishCulture())
            {
                return
                    "Hello,\n\n" +
                    "Your AERO Cinema password recovery verification code is:\n\n" +
                    otpCode + "\n\n" +
                    "This code is valid for 5 minutes.\n\n" +
                    "If you did not request password recovery, please ignore this email.\n\n" +
                    "AERO Cinema";
            }

            return
                "Xin chào,\n\n" +
                "Mã xác nhận khôi phục mật khẩu AERO Cinema của bạn là:\n\n" +
                otpCode + "\n\n" +
                "Mã có hiệu lực trong 5 phút.\n\n" +
                "Nếu bạn không yêu cầu khôi phục mật khẩu, vui lòng bỏ qua email này.\n\n" +
                "AERO Cinema";
        }

        private static bool IsEnglishCulture()
        {
            return string.Equals(
                System.Threading.Thread.CurrentThread.CurrentUICulture.TwoLetterISOLanguageName,
                "en",
                StringComparison.OrdinalIgnoreCase);
        }

        private string BuildLoginAlertBody(LoginInfo loginInfo)
        {
            return
                "Xin chào,\n\n" +
                "Chúng tôi phát hiện một lần đăng nhập thất thường từ địa điểm mà bạn không sử dụng.\n\n" +
                "Thông tin đăng nhập:\n\n" +
                "* Thời gian: " + DateTime.Now.ToString("dd/MM/yyyy HH:mm:ss", CultureInfo.GetCultureInfo("vi-VN")) + "\n" +
                "* IP: " + loginInfo.Ip + "\n" +
                "* Quốc gia / Thành phố: " + loginInfo.Location + "\n" +
                "* Thiết bị: " + loginInfo.Device + "\n" +
                "* Trình duyệt: " + loginInfo.Browser + "\n" +
                "* Hệ điều hành: " + loginInfo.OperatingSystem + "\n" +
                "* Mức độ chính xác vị trí: " + loginInfo.LocationAccuracy + "\n" +
                "* Độ tin cậy: " + loginInfo.Confidence + "\n\n" +
                "Vị trí chỉ là ước tính theo IP, không đảm bảo chính xác tuyệt đối.\n\n" +
                "Nếu đây là bạn, bạn có thể bỏ qua email này.\n\n" +
                "Nếu không phải bạn, vui lòng đổi mật khẩu ngay.\n\n" +
                "AERO Cinema";
        }

        private LoginInfo BuildLoginInfo()
        {
            var ip = Request.UserHostAddress ?? "Unknown";
            var userAgent = Request.UserAgent ?? string.Empty;
            var browser = Request.Browser != null
                ? (Request.Browser.Browser + " " + Request.Browser.Version).Trim()
                : "Unknown";

            var info = new LoginInfo
            {
                Ip = ip,
                Browser = string.IsNullOrWhiteSpace(browser) ? "Unknown" : browser,
                OperatingSystem = DetectOperatingSystem(userAgent),
                Device = DetectDevice(userAgent),
                Location = "Không xác định",
                LocationAccuracy = "Không xác định",
                Confidence = "Thấp"
            };

            if (IsLocalIp(ip))
            {
                info.Ip = "Localhost";
                info.Location = "Môi trường local";
                info.LocationAccuracy = "Thấp";
                info.Confidence = "Demo local";
                return info;
            }

            try
            {
                using (var client = new WebClient())
                {
                    client.Encoding = Encoding.UTF8;
                    var url = "http://ip-api.com/json/" + Uri.EscapeDataString(ip) + "?fields=status,country,regionName,city,query";
                    var json = client.DownloadString(url);
                    var serializer = new JavaScriptSerializer();
                    var geo = serializer.Deserialize<IpApiResult>(json);

                    if (geo != null && string.Equals(geo.status, "success", StringComparison.OrdinalIgnoreCase))
                    {
                        var region = string.IsNullOrWhiteSpace(geo.regionName) ? string.Empty : ", " + geo.regionName;
                        var city = string.IsNullOrWhiteSpace(geo.city) ? string.Empty : geo.city;
                        var country = string.IsNullOrWhiteSpace(geo.country) ? string.Empty : geo.country;
                        info.Ip = string.IsNullOrWhiteSpace(geo.query) ? ip : geo.query;
                        info.Location = string.IsNullOrWhiteSpace(city + country)
                            ? "Không xác định"
                            : (city + region + ", " + country).Trim(' ', ',');
                        info.LocationAccuracy = "Ước tính theo IP";
                        info.Confidence = "Trung bình";
                    }
                }
            }
            catch
            {
                info.Location = "Không xác định";
                info.LocationAccuracy = "Không xác định";
                info.Confidence = "Thấp";
            }

            return info;
        }

        private static string DetectOperatingSystem(string userAgent)
        {
            if (string.IsNullOrWhiteSpace(userAgent)) return "Unknown";

            var ua = userAgent.ToLowerInvariant();
            if (ua.Contains("windows")) return "Windows";
            if (ua.Contains("mac os") || ua.Contains("macintosh")) return "macOS";
            if (ua.Contains("android")) return "Android";
            if (ua.Contains("iphone") || ua.Contains("ipad") || ua.Contains("ios")) return "iOS";
            if (ua.Contains("linux")) return "Linux";

            return "Unknown";
        }

        private static string DetectDevice(string userAgent)
        {
            if (string.IsNullOrWhiteSpace(userAgent)) return "Desktop";

            var ua = userAgent.ToLowerInvariant();
            if (ua.Contains("ipad") || ua.Contains("tablet")) return "Tablet";
            if (ua.Contains("mobile") || ua.Contains("android") || ua.Contains("iphone")) return "Mobile";

            return "Desktop";
        }

        private static bool IsLocalIp(string ip)
        {
            return string.Equals(ip, "::1", StringComparison.OrdinalIgnoreCase) ||
                   string.Equals(ip, "127.0.0.1", StringComparison.OrdinalIgnoreCase) ||
                   string.Equals(ip, "localhost", StringComparison.OrdinalIgnoreCase);
        }

        private static string NormalizeEmail(string email)
        {
            return (email ?? string.Empty).Trim().ToLowerInvariant();
        }

        private static bool IsValidEmail(string email)
        {
            return Regex.IsMatch(email ?? string.Empty, @"^[^\s@]+@[^\s@]+\.[^\s@]+$");
        }

        private static string GenerateOtpCode()
        {
            return GetSecureNumber(0, 1000000).ToString("D6", CultureInfo.InvariantCulture);
        }

        private static int GetSecureNumber(int minValue, int maxValue)
        {
            using (var rng = new RNGCryptoServiceProvider())
            {
                var range = (uint)(maxValue - minValue);
                var limit = uint.MaxValue - (uint.MaxValue % range);
                var bytes = new byte[4];
                uint value;

                do
                {
                    rng.GetBytes(bytes);
                    value = BitConverter.ToUInt32(bytes, 0);
                }
                while (value >= limit);

                return minValue + (int)(value % range);
            }
        }

        private static string TryGetSmtpSettings(out SmtpSettings settings)
        {
            settings = new SmtpSettings
            {
                Email = ConfigurationManager.AppSettings["SmtpEmail"],
                AppPassword = ConfigurationManager.AppSettings["SmtpAppPassword"],
                DisplayName = ConfigurationManager.AppSettings["SmtpDisplayName"] ?? "AERO Cinema"
            };

            if (string.IsNullOrWhiteSpace(settings.Email) ||
                string.IsNullOrWhiteSpace(settings.AppPassword) ||
                settings.Email.StartsWith("your_", StringComparison.OrdinalIgnoreCase) ||
                settings.AppPassword.StartsWith("your_", StringComparison.OrdinalIgnoreCase))
            {
                return "SMTP chưa được cấu hình. Vui lòng kiểm tra SmtpEmail và SmtpAppPassword trong Web.config.";
            }

            return null;
        }

        private static void SendEmail(SmtpSettings settings, string toEmail, string subject, string body)
        {
            using (var message = new MailMessage())
            {
                message.From = new MailAddress(settings.Email, settings.DisplayName, Encoding.UTF8);
                message.To.Add(toEmail);
                message.Subject = subject;
                message.SubjectEncoding = Encoding.UTF8;
                message.BodyEncoding = Encoding.UTF8;
                message.IsBodyHtml = false;
                message.Body = body;

                using (var smtp = new SmtpClient("smtp.gmail.com", 587))
                {
                    smtp.EnableSsl = true;
                    smtp.UseDefaultCredentials = false;
                    smtp.Credentials = new NetworkCredential(settings.Email, settings.AppPassword);
                    smtp.Send(message);
                }
            }
        }

        private void ClearOtpSession(string emailSessionKey, string codeSessionKey, string expireSessionKey)
        {
            Session.Remove(emailSessionKey);
            Session.Remove(codeSessionKey);
            Session.Remove(expireSessionKey);
        }

        private class SmtpSettings
        {
            public string Email { get; set; }
            public string AppPassword { get; set; }
            public string DisplayName { get; set; }
        }

        private class LoginInfo
        {
            public string Ip { get; set; }
            public string Location { get; set; }
            public string Device { get; set; }
            public string Browser { get; set; }
            public string OperatingSystem { get; set; }
            public string LocationAccuracy { get; set; }
            public string Confidence { get; set; }
        }

        private class IpApiResult
        {
            public string status { get; set; }
            public string country { get; set; }
            public string regionName { get; set; }
            public string city { get; set; }
            public string query { get; set; }
        }
    }
}
