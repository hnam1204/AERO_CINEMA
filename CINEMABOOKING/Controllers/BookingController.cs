using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Threading.Tasks;

namespace CINEMABOOKING.Controllers
{
    public class BookingController : Controller
    {
        public ActionResult Seats()
        {
            return View();
        }

        public ActionResult Checkout()
        {
            return View();
        }

        public ActionResult Combos()
        {
            return View();
        }

        public ActionResult Success()
        {
            return View();
        }

        [HttpPost]
        public async Task<JsonResult> SendTicketEmail(string bookingId, string ticketId)
        {
            if (string.IsNullOrEmpty(bookingId) || string.IsNullOrEmpty(ticketId))
            {
                return Json(new { success = false, message = "Mã đặt vé hoặc mã vé không hợp lệ." });
            }

            try
            {
                string result = await Services.EmailService.SendTicketEmailAsync(bookingId, ticketId);
                if (result == "SUCCESS")
                {
                    return Json(new { success = true, message = "Gửi email vé điện tử thành công." });
                }
                else if (result == "ALREADY_SENT")
                {
                    return Json(new { success = true, message = "Email đã được gửi trước đó." });
                }
                else
                {
                    return Json(new { success = false, message = "Không thể gửi email vé điện tử do trạng thái đơn hàng không hợp lệ." });
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }
    }
}
