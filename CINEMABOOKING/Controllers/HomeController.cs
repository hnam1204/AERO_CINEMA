using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace CINEMABOOKING.Controllers
{
    public class HomeController : Controller
    {
        public ActionResult Index()
        {
            return View();
        }

        public ActionResult About()
        {
            ViewBag.Message = "Your application description page.";
            return View();
        }

        public ActionResult Contact()
        {
            ViewBag.Message = "Your contact page.";
            return View();
        }

        public ActionResult Services()
        {
            return View();
        }

        public ActionResult Promotions()
        {
            return View();
        }

        public ActionResult Cinemas()
        {
            return View();
        }

        public ActionResult Membership()
        {
            return View();
        }

        public ActionResult Support()
        {
            return View();
        }

        public ActionResult Policy()
        {
            return View();
        }

        public ActionResult Terms()
        {
            return View("Policy");
        }

        public ActionResult Privacy()
        {
            return View("Policy");
        }
    }
}
