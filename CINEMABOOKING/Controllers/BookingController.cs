using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

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

        public ActionResult Success()
        {
            return View();
        }
    }
}
