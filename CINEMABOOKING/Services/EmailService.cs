using Google.Apis.Auth.OAuth2;
using Newtonsoft.Json.Linq;
using QRCoder;
using iTextSharp.text;
using iTextSharp.text.pdf;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Net;
using System.Net.Mail;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using System.Web.Hosting;

namespace CINEMABOOKING.Services
{
    public class EmailService
    {
        public static async Task<string> SendTicketEmailAsync(string bookingId, string ticketId)
        {
            string logUserEmail = "unknown";
            string logUserId = "";
            string logTicketId = ticketId;
            string projectId = "cinemabooking-759b6"; // default fallback

            try
            {
                // 1. Get Service Account Path and load Credentials
                string saPath = GetServiceAccountPath();
                if (string.IsNullOrEmpty(saPath))
                {
                    throw new FileNotFoundException("Không tìm thấy tệp service-account.json trong App_Data hoặc thư mục Downloads.");
                }

                string saContent = File.ReadAllText(saPath);
                var saObject = JObject.Parse(saContent);
                string saProjectId = saObject["project_id"]?.ToString();
                if (!string.IsNullOrEmpty(saProjectId))
                {
                    projectId = saProjectId;
                }

                // Get Access Token
                var credential = GoogleCredential.FromJson(saContent)
                    .CreateScoped("https://www.googleapis.com/auth/datastore");
                string token = await credential.UnderlyingCredential.GetAccessTokenForRequestAsync();

                using (var client = new HttpClient())
                {
                    client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

                    // 2. Fetch Booking Document
                    string bookingUrl = $"https://firestore.googleapis.com/v1/projects/{projectId}/databases/(default)/documents/bookings/{bookingId}";
                    var bookingRes = await client.GetAsync(bookingUrl);
                    if (!bookingRes.IsSuccessStatusCode)
                    {
                        throw new Exception($"Không thể tải booking {bookingId}. Firestore trả về: {bookingRes.StatusCode}");
                    }
                    var bookingDoc = JObject.Parse(await bookingRes.Content.ReadAsStringAsync());

                    string bookingStatus = GetString(bookingDoc, "status");
                    string userId = GetString(bookingDoc, "userId");
                    logUserId = userId;
                    string userEmail = GetString(bookingDoc, "userEmail");
                    logUserEmail = userEmail;

                    // 3. Check Booking Status & Associated Payment Status
                    bool isStatusEligible = string.Equals(bookingStatus, "paid", StringComparison.OrdinalIgnoreCase) ||
                                            string.Equals(bookingStatus, "confirmed", StringComparison.OrdinalIgnoreCase);

                    bool isPaymentPaid = false;
                    try
                    {
                        string queryUrl = $"https://firestore.googleapis.com/v1/projects/{projectId}/databases/(default)/documents:runQuery";
                        var payQueryBody = new JObject(
                            new JProperty("structuredQuery", new JObject(
                                new JProperty("from", new JArray(new JObject(new JProperty("collectionId", "payments")))),
                                new JProperty("where", new JObject(new JProperty("fieldFilter", new JObject(
                                    new JProperty("field", new JObject(new JProperty("fieldPath", "bookingId"))),
                                    new JProperty("op", "EQUAL"),
                                    new JProperty("value", new JObject(new JProperty("stringValue", bookingId)))
                                )))),
                                new JProperty("limit", 1)
                            ))
                        );
                        var payQueryContent = new StringContent(payQueryBody.ToString(), Encoding.UTF8, "application/json");
                        var payQueryRes = await client.PostAsync(queryUrl, payQueryContent);
                        if (payQueryRes.IsSuccessStatusCode)
                        {
                            var payResults = JArray.Parse(await payQueryRes.Content.ReadAsStringAsync());
                            if (payResults.Count > 0 && payResults[0]["document"] != null)
                            {
                                var paymentDoc = payResults[0]["document"];
                                string paymentStatus = GetString(paymentDoc, "status");
                                if (string.Equals(paymentStatus, "paid", StringComparison.OrdinalIgnoreCase))
                                {
                                    isPaymentPaid = true;
                                }
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        System.Diagnostics.Debug.WriteLine("Lỗi kiểm tra payment: " + ex.Message);
                    }

                    if (!isStatusEligible && !isPaymentPaid)
                    {
                        // Booking not confirmed/paid yet. Skip.
                        return "NOT_ELIGIBLE";
                    }

                    // 4. Fetch User Details for FullName
                    string fullName = "";
                    if (!string.IsNullOrEmpty(userId))
                    {
                        try
                        {
                            string userUrl = $"https://firestore.googleapis.com/v1/projects/{projectId}/databases/(default)/documents/users/{userId}";
                            var userRes = await client.GetAsync(userUrl);
                            if (userRes.IsSuccessStatusCode)
                            {
                                var userDoc = JObject.Parse(await userRes.Content.ReadAsStringAsync());
                                fullName = GetString(userDoc, "fullName");
                                if (string.IsNullOrEmpty(userEmail))
                                {
                                    userEmail = GetString(userDoc, "email");
                                    logUserEmail = userEmail;
                                }
                            }
                        }
                        catch (Exception ex)
                        {
                            System.Diagnostics.Debug.WriteLine("Lỗi tải thông tin user: " + ex.Message);
                        }
                    }
                    if (string.IsNullOrEmpty(fullName)) fullName = userEmail;

                    // 5. Fetch Ticket Document directly by ID
                    string ticketUrl = $"https://firestore.googleapis.com/v1/projects/{projectId}/databases/(default)/documents/tickets/{ticketId}";
                    var ticketRes = await client.GetAsync(ticketUrl);
                    if (!ticketRes.IsSuccessStatusCode)
                    {
                        throw new Exception($"Không thể tải vé {ticketId}. Firestore trả về: {ticketRes.StatusCode}");
                    }
                    var ticketDoc = JObject.Parse(await ticketRes.Content.ReadAsStringAsync());
                    string ticketCode = GetString(ticketDoc, "ticketCode");
                    string qrText = GetString(ticketDoc, "qrText");
                    if (string.IsNullOrEmpty(qrText)) qrText = ticketCode;

                    bool emailSent = GetBool(ticketDoc, "emailSent", false);
                    if (emailSent)
                    {
                        // Already sent, prevent duplicates.
                        return "ALREADY_SENT";
                    }

                    // 6. Gather Email Fields
                    string movieTitle = GetString(bookingDoc, "movieTitle");
                    string cinemaName = GetString(bookingDoc, "cinemaName");
                    string roomName = GetString(bookingDoc, "roomName");
                    string showDate = FormatDateSafe(GetString(bookingDoc, "date"));
                    string showTime = GetString(bookingDoc, "time");

                    var seatsList = new List<string>();
                    var seatsField = bookingDoc["fields"]?["seats"]?["arrayValue"]?["values"];
                    if (seatsField != null)
                    {
                        foreach (var val in seatsField)
                        {
                            var s = val["stringValue"]?.ToString();
                            if (!string.IsNullOrEmpty(s)) seatsList.Add(s);
                        }
                    }
                    string seatNames = string.Join(", ", seatsList);

                    // 5.5 Set Culture based on booking language
                    string language = GetString(bookingDoc, "language", "vi");
                    if (string.IsNullOrEmpty(language)) language = "vi";
                    var cultureName = string.Equals(language, "en", StringComparison.OrdinalIgnoreCase) ? "en-US" : "vi-VN";
                    var culture = System.Globalization.CultureInfo.GetCultureInfo(cultureName);
                    System.Threading.Thread.CurrentThread.CurrentCulture = culture;
                    System.Threading.Thread.CurrentThread.CurrentUICulture = culture;

                    double totalPrice = GetNumber(bookingDoc, "totalPrice");
                    string amountStr = totalPrice.ToString("N0", culture) + (string.Equals(language, "en", StringComparison.OrdinalIgnoreCase) ? " VND" : "đ");

                    // 7. Generate QR Code bytes using QRCoder
                    byte[] qrCodeBytes = GenerateQrCodeBytes(qrText);

                    // 8. Generate PDF using iTextSharp
                    byte[] pdfBytes = GenerateTicketPdf(ticketCode, movieTitle, cinemaName, roomName, showDate, showTime, seatNames, qrCodeBytes);

                    // 9. Send SMTP Email
                    string smtpError = SendSmtpMail(userEmail, fullName, movieTitle, cinemaName, roomName, showDate, showTime, seatNames, ticketCode, bookingId, amountStr, qrCodeBytes, pdfBytes);
                    if (!string.IsNullOrEmpty(smtpError))
                    {
                        throw new Exception("Lỗi khi gửi SMTP email: " + smtpError);
                    }

                    // 10. Update Ticket status in Firestore (emailSent = true, emailSentAt = now)
                    string patchUrl = $"https://firestore.googleapis.com/v1/projects/{projectId}/databases/(default)/documents/tickets/{ticketId}?updateMask.fieldPaths=emailSent&updateMask.fieldPaths=emailSentAt";
                    var patchBody = new JObject(
                        new JProperty("fields", new JObject(
                            new JProperty("emailSent", new JObject(new JProperty("booleanValue", true))),
                            new JProperty("emailSentAt", new JObject(new JProperty("timestampValue", DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"))))
                        ))
                    );
                    var patchContent = new StringContent(patchBody.ToString(), Encoding.UTF8, "application/json");
                    var patchMethod = new HttpMethod("PATCH");
                    var patchRequest = new HttpRequestMessage(patchMethod, patchUrl) { Content = patchContent };
                    var patchRes = await client.SendAsync(patchRequest);
                    if (!patchRes.IsSuccessStatusCode)
                    {
                        System.Diagnostics.Debug.WriteLine($"Cảnh báo: Không thể cập nhật trạng thái emailSent trên ticket {ticketId}. Firestore: {patchRes.StatusCode}");
                    }

                    // 11. Create activity_log "ticket_email_sent" in Firestore
                    await LogActivityAsync(client, projectId, "ticket_email_sent", userId, bookingId, ticketId, userEmail);
                    return "SUCCESS";
                }
            }
            catch (Exception ex)
            {
                // Write failure log and do NOT rollback booking
                System.Diagnostics.Debug.WriteLine("LỖI GỬI EMAIL VÉ: " + ex.ToString());
                try
                {
                    string saPath = GetServiceAccountPath();
                    if (!string.IsNullOrEmpty(saPath))
                    {
                        string saContent = File.ReadAllText(saPath);
                        var saObject = JObject.Parse(saContent);
                        string saProjectId = saObject["project_id"]?.ToString() ?? projectId;
                        var credential = GoogleCredential.FromJson(saContent)
                            .CreateScoped("https://www.googleapis.com/auth/datastore");
                        string token = await credential.UnderlyingCredential.GetAccessTokenForRequestAsync();

                        using (var client = new HttpClient())
                        {
                            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
                            await LogActivityAsync(client, saProjectId, "ticket_email_failed", logUserId, bookingId, logTicketId, logUserEmail, ex.ToString());
                        }
                    }
                }
                catch (Exception logEx)
                {
                    System.Diagnostics.Debug.WriteLine("Không thể tạo log activity_logs thất bại: " + logEx.Message);
                }
                throw;
            }
        }

        private static string GetServiceAccountPath()
        {
            // 1. App_Data path
            string path1 = HostingEnvironment.MapPath("~/App_Data/service-account.json");
            if (File.Exists(path1)) return path1;

            // 2. User Downloads path fallback
            string path2 = @"C:\Users\HAI NAM\Downloads\service-account.json";
            if (File.Exists(path2)) return path2;

            return null;
        }

        private static byte[] GenerateQrCodeBytes(string text)
        {
            using (QRCodeGenerator qrGenerator = new QRCodeGenerator())
            {
                using (QRCodeData qrCodeData = qrGenerator.CreateQrCode(text, QRCodeGenerator.ECCLevel.Q))
                {
                    using (QRCode qrCode = new QRCode(qrCodeData))
                    {
                        using (Bitmap qrCodeImage = qrCode.GetGraphic(10))
                        {
                            using (MemoryStream ms = new MemoryStream())
                            {
                                qrCodeImage.Save(ms, ImageFormat.Png);
                                return ms.ToArray();
                            }
                        }
                    }
                }
            }
        }

        private static byte[] GenerateTicketPdf(
            string ticketCode,
            string movieTitle,
            string cinemaName,
            string roomName,
            string showDate,
            string showTime,
            string seatNames,
            byte[] qrCodeBytes)
        {
            using (MemoryStream ms = new MemoryStream())
            {
                // Create document A6 size for compact e-ticket receipt
                Document document = new Document(PageSize.A6, 20, 20, 20, 20);
                PdfWriter writer = PdfWriter.GetInstance(document, ms);
                document.Open();

                // Load system font Arial to fully support Vietnamese Unicode accents
                string fontPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Windows), "Fonts", "arial.ttf");
                if (!File.Exists(fontPath))
                {
                    fontPath = "C:\\Windows\\Fonts\\arial.ttf";
                }

                BaseFont bf;
                if (File.Exists(fontPath))
                {
                    bf = BaseFont.CreateFont(fontPath, BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
                }
                else
                {
                    bf = BaseFont.CreateFont(BaseFont.HELVETICA, BaseFont.CP1252, BaseFont.NOT_EMBEDDED);
                }

                iTextSharp.text.Font fontTitle = new iTextSharp.text.Font(bf, 16, iTextSharp.text.Font.BOLD, new BaseColor(0, 91, 170)); // Primary #005baa
                iTextSharp.text.Font fontSubtitle = new iTextSharp.text.Font(bf, 12, iTextSharp.text.Font.BOLD, new BaseColor(245, 130, 32)); // Accent #f58220
                iTextSharp.text.Font fontBodyBold = new iTextSharp.text.Font(bf, 10, iTextSharp.text.Font.BOLD, BaseColor.BLACK);
                iTextSharp.text.Font fontBody = new iTextSharp.text.Font(bf, 10, iTextSharp.text.Font.NORMAL, BaseColor.DARK_GRAY);
                iTextSharp.text.Font fontFooter = new iTextSharp.text.Font(bf, 8, iTextSharp.text.Font.ITALIC, BaseColor.GRAY);

                // Add content to PDF document
                Paragraph header = new Paragraph("AERO CINEMA", fontTitle);
                header.Alignment = Element.ALIGN_CENTER;
                document.Add(header);

                Paragraph subHeader = new Paragraph(Resources.Language.PdfSubHeader, fontSubtitle);
                subHeader.Alignment = Element.ALIGN_CENTER;
                subHeader.SpacingAfter = 12;
                document.Add(subHeader);

                document.Add(new Paragraph($"{Resources.Language.EmailMovie}: {movieTitle}", fontBodyBold));
                document.Add(new Paragraph($"{Resources.Language.EmailCinema}: {cinemaName}", fontBody));
                document.Add(new Paragraph($"{Resources.Language.EmailRoom}: {roomName}", fontBody));
                document.Add(new Paragraph($"{Resources.Language.EmailShowDate}: {showDate}", fontBody));
                document.Add(new Paragraph($"{Resources.Language.EmailShowTime}: {showTime}", fontBody));
                document.Add(new Paragraph($"{Resources.Language.EmailSeats}: {seatNames}", fontBodyBold));
                document.Add(new Paragraph($"{Resources.Language.EmailTicketCode}: {ticketCode}", fontBodyBold));

                Paragraph line = new Paragraph("--------------------------------------------------", fontBody);
                line.Alignment = Element.ALIGN_CENTER;
                document.Add(line);

                if (qrCodeBytes != null)
                {
                    iTextSharp.text.Image qrImage = iTextSharp.text.Image.GetInstance(qrCodeBytes);
                    qrImage.Alignment = Element.ALIGN_CENTER;
                    qrImage.ScaleAbsolute(110f, 110f);
                    qrImage.SpacingBefore = 8;
                    qrImage.SpacingAfter = 8;
                    document.Add(qrImage);
                }

                Paragraph footer = new Paragraph(Resources.Language.EmailEnjoy, fontFooter);
                footer.Alignment = Element.ALIGN_CENTER;
                document.Add(footer);

                document.Close();
                writer.Close();
                return ms.ToArray();
            }
        }

        private static string SendSmtpMail(
            string toEmail,
            string fullName,
            string movieTitle,
            string cinemaName,
            string roomName,
            string showDate,
            string showTime,
            string seatNames,
            string ticketCode,
            string bookingCode,
            string amountStr,
            byte[] qrCodeBytes,
            byte[] pdfBytes)
        {
            string email = ConfigurationManager.AppSettings["SmtpEmail"];
            string password = ConfigurationManager.AppSettings["SmtpAppPassword"];
            string displayName = ConfigurationManager.AppSettings["SmtpDisplayName"] ?? "AERO Cinema";

            if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(password))
            {
                return "SMTP chưa được cấu hình. Vui lòng kiểm tra SmtpEmail và SmtpAppPassword trong Web.config.";
            }

            try
            {
                using (var message = new MailMessage())
                {
                    message.From = new MailAddress(email, displayName, Encoding.UTF8);
                    message.To.Add(toEmail);
                    message.Subject = Resources.Language.TicketEmailSubject;
                    message.SubjectEncoding = Encoding.UTF8;
                    message.BodyEncoding = Encoding.UTF8;
                    message.IsBodyHtml = true;

                    // Build HTML Body with inline QR
                    string html = GetHtmlTemplate(fullName, movieTitle, cinemaName, roomName, showDate, showTime, seatNames, ticketCode, bookingCode, amountStr);
                    message.Body = html;

                    // Attach QR Code as inline resource
                    var qrAttachment = new Attachment(new MemoryStream(qrCodeBytes), "qrcode.png", "image/png");
                    qrAttachment.ContentId = "QRCodeImage";
                    qrAttachment.ContentDisposition.Inline = true;
                    message.Attachments.Add(qrAttachment);

                    // Attach PDF E-ticket
                    var pdfAttachment = new Attachment(new MemoryStream(pdfBytes), $"Ticket_{ticketCode}.pdf", "application/pdf");
                    message.Attachments.Add(pdfAttachment);

                    using (var smtp = new SmtpClient("smtp.gmail.com", 587))
                    {
                        smtp.EnableSsl = true;
                        smtp.UseDefaultCredentials = false;
                        smtp.Credentials = new NetworkCredential(email, password);
                        smtp.Send(message);
                    }
                }
                return null;
            }
            catch (Exception ex)
            {
                return ex.Message;
            }
        }

        private static async Task LogActivityAsync(
            HttpClient client,
            string projectId,
            string type,
            string userId,
            string bookingId,
            string ticketId,
            string email,
            string error = "")
        {
            try
            {
                string logUrl = $"https://firestore.googleapis.com/v1/projects/{projectId}/databases/(default)/documents/activity_logs";
                var logBody = new JObject(
                    new JProperty("fields", new JObject(
                        new JProperty("type", new JObject(new JProperty("stringValue", type))),
                        new JProperty("userId", new JObject(new JProperty("stringValue", userId ?? ""))),
                        new JProperty("bookingId", new JObject(new JProperty("stringValue", bookingId ?? ""))),
                        new JProperty("ticketId", new JObject(new JProperty("stringValue", ticketId ?? ""))),
                        new JProperty("email", new JObject(new JProperty("stringValue", email ?? ""))),
                        new JProperty("error", new JObject(new JProperty("stringValue", error ?? ""))),
                        new JProperty("createdAt", new JObject(new JProperty("timestampValue", DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"))))
                    ))
                );
                var logContent = new StringContent(logBody.ToString(), Encoding.UTF8, "application/json");
                await client.PostAsync(logUrl, logContent);
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine("Không thể lưu log hoạt động: " + ex.Message);
            }
        }

        private static string GetHtmlTemplate(
            string fullName,
            string movieTitle,
            string cinemaName,
            string roomName,
            string showDate,
            string showTime,
            string seatNames,
            string ticketCode,
            string bookingCode,
            string amountStr)
        {
            return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset=""utf-8"" />
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"" />
    <title>{Resources.Language.TicketEmailSubject}</title>
</head>
<body style=""margin: 0; padding: 0; background-color: #f6f6f6; font-family: Arial, Helvetica, sans-serif; -webkit-text-size-adjust: none; -ms-text-size-adjust: none;"">
    <table border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""background-color: #f6f6f6; padding: 20px 0;"">
        <tr>
            <td align=""center"">
                <table border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""max-width: 500px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.04);"">
                    <!-- Header -->
                    <tr>
                        <td align=""center"" style=""background-color: #005baa; padding: 25px 20px; border-bottom: 3px solid #f58220;"">
                            <h1 style=""color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 1px;"">AERO CINEMA</h1>
                        </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                        <td style=""padding: 30px 24px;"">
                            <p style=""margin: 0 0 15px 0; font-size: 16px; color: #1f2937; line-height: 1.5;"">{Resources.Language.EmailGreeting} <strong>{fullName}</strong>,</p>
                            <p style=""margin: 0 0 25px 0; font-size: 14px; color: #4b5563; line-height: 1.5;"">{Resources.Language.EmailThankYou}</p>
                            
                            <!-- Ticket Card -->
                            <table border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 25px;"">
                                <tr>
                                    <td colspan=""2"" style=""padding-bottom: 15px; border-bottom: 1px dashed #d1d5db;"">
                                        <div style=""font-size: 12px; color: #9ca3af; text-transform: uppercase; font-weight: bold; margin-bottom: 4px;"">{Resources.Language.EmailMovie}</div>
                                        <div style=""font-size: 18px; color: #005baa; font-weight: bold; text-transform: uppercase;"">{movieTitle}</div>
                                    </td>
                                </tr>
                                <tr>
                                    <td width=""50%"" style=""padding: 12px 0 6px 0;"">
                                        <div style=""font-size: 11px; color: #9ca3af; text-transform: uppercase; font-weight: bold; margin-bottom: 2px;"">{Resources.Language.EmailCinema}</div>
                                        <div style=""font-size: 14px; color: #1f2937; font-weight: 600;"">{cinemaName}</div>
                                    </td>
                                    <td width=""50%"" style=""padding: 12px 0 6px 0;"">
                                        <div style=""font-size: 11px; color: #9ca3af; text-transform: uppercase; font-weight: bold; margin-bottom: 2px;"">{Resources.Language.EmailRoom}</div>
                                        <div style=""font-size: 14px; color: #1f2937; font-weight: 600;"">{roomName}</div>
                                    </td>
                                </tr>
                                <tr>
                                    <td style=""padding: 6px 0;"">
                                        <div style=""font-size: 11px; color: #9ca3af; text-transform: uppercase; font-weight: bold; margin-bottom: 2px;"">{Resources.Language.EmailShowDate}</div>
                                        <div style=""font-size: 14px; color: #1f2937; font-weight: 600;"">{showDate}</div>
                                    </td>
                                    <td style=""padding: 6px 0;"">
                                        <div style=""font-size: 11px; color: #9ca3af; text-transform: uppercase; font-weight: bold; margin-bottom: 2px;"">{Resources.Language.EmailShowTime}</div>
                                        <div style=""font-size: 14px; color: #1f2937; font-weight: 600;"">{showTime}</div>
                                    </td>
                                </tr>
                                <tr>
                                    <td style=""padding: 6px 0;"">
                                        <div style=""font-size: 11px; color: #9ca3af; text-transform: uppercase; font-weight: bold; margin-bottom: 2px;"">{Resources.Language.EmailSeats}</div>
                                        <div style=""font-size: 14px; color: #f58220; font-weight: bold;"">{seatNames}</div>
                                    </td>
                                    <td style=""padding: 6px 0;"">
                                        <div style=""font-size: 11px; color: #9ca3af; text-transform: uppercase; font-weight: bold; margin-bottom: 2px;"">{Resources.Language.EmailTotal}</div>
                                        <div style=""font-size: 14px; color: #1f2937; font-weight: bold;"">{amountStr}</div>
                                    </td>
                                </tr>
                                <tr>
                                    <td style=""padding: 6px 0 0 0; border-top: 1px dashed #d1d5db;"">
                                        <div style=""font-size: 11px; color: #9ca3af; text-transform: uppercase; font-weight: bold; margin-bottom: 2px;"">{Resources.Language.EmailBookingCode}</div>
                                        <div style=""font-size: 14px; color: #1f2937; font-weight: 600;"">{bookingCode}</div>
                                    </td>
                                    <td style=""padding: 6px 0 0 0; border-top: 1px dashed #d1d5db;"">
                                        <div style=""font-size: 11px; color: #9ca3af; text-transform: uppercase; font-weight: bold; margin-bottom: 2px;"">{Resources.Language.EmailTicketCode}</div>
                                        <div style=""font-size: 14px; color: #005baa; font-weight: bold;"">{ticketCode}</div>
                                    </td>
                                </tr>
                            </table>

                            <!-- QR Code Box -->
                            <table border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"">
                                <tr>
                                    <td align=""center"" style=""padding: 10px 0 20px 0;"">
                                        <div style=""background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; display: inline-block; box-shadow: 0 4px 12px rgba(0,0,0,0.03);"">
                                            <img src=""cid:QRCodeImage"" alt=""Vé QR Code"" width=""150"" height=""150"" style=""display: block; border: 0;"" />
                                        </div>
                                        <div style=""margin-top: 10px; font-size: 12px; color: #6b7280; font-weight: bold; letter-spacing: 0.5px;"">{Resources.Language.EmailInstruction}</div>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style=""margin: 0; font-size: 13px; color: #6b7280; line-height: 1.5; text-align: center; font-style: italic;"">
                                {Resources.Language.EmailDisclaimer}
                            </p>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style=""background-color: #f9fafb; padding: 20px; border-top: 1px solid #e5e7eb; text-align: center;"">
                            <p style=""margin: 0; font-size: 12px; color: #9ca3af;"">&copy; 2026 AERO Cinema. All rights reserved.</p>
                            <p style=""margin: 4px 0 0 0; font-size: 11px; color: #d1d5db;"">{Resources.Language.AutoSentMessage}</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
";
        }

        private static string GetString(JToken doc, string fieldName, string defaultValue = "")
        {
            var field = doc["fields"]?[fieldName];
            if (field == null) return defaultValue;
            return field["stringValue"]?.ToString() ?? defaultValue;
        }

        private static bool GetBool(JToken doc, string fieldName, bool defaultValue = false)
        {
            var field = doc["fields"]?[fieldName];
            if (field == null) return defaultValue;
            if (field["booleanValue"] != null)
            {
                return (bool)field["booleanValue"];
            }
            return defaultValue;
        }

        private static double GetNumber(JToken doc, string fieldName, double defaultValue = 0)
        {
            var field = doc["fields"]?[fieldName];
            if (field == null) return defaultValue;
            if (field["integerValue"] != null) return double.Parse(field["integerValue"].ToString());
            if (field["doubleValue"] != null) return double.Parse(field["doubleValue"].ToString());
            return defaultValue;
        }

        private static string FormatDateSafe(string dateValue)
        {
            if (string.IsNullOrEmpty(dateValue)) return "Đang cập nhật";
            try
            {
                DateTime parsedDate;
                if (DateTime.TryParse(dateValue, out parsedDate))
                {
                    return parsedDate.ToString("dd/MM/yyyy");
                }
                var parts = dateValue.Split('-');
                if (parts.Length == 3)
                {
                    return $"{parts[2]}/{parts[1]}/{parts[0]}";
                }
                return dateValue;
            }
            catch
            {
                return dateValue;
            }
        }
    }
}
