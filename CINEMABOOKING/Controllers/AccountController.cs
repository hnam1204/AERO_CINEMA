using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace CINEMABOOKING.Controllers
{
    public class AccountController : Controller
    {
        public ActionResult Login(string returnUrl = null)
        {
            ViewBag.ReturnUrl = returnUrl;
            return View();
        }

        public ActionResult Register()
        {
            return View();
        }

        public ActionResult ForgotPassword()
        {
            return View();
        }

        public ActionResult Profile()
        {
            return View();
        }

        public ActionResult TicketHistory()
        {
            return View();
        }
    }
}
