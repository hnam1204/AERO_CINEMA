using System.Web.Mvc;

namespace CINEMABOOKING.Controllers
{
    public class NewsController : Controller
    {
        // GET: News
        public ActionResult Index()
        {
            return View();
        }

        // GET: News/Details/5
        public ActionResult Details(string id)
        {
            ViewBag.NewsId = id;
            return View();
        }
    }
}
