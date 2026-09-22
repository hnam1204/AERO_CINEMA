using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;
using CINEMABOOKING.Models;
using CINEMABOOKING.Services;

namespace CINEMABOOKING.Controllers
{
    public class AdminController : Controller
    {
        private readonly ShowtimeService _showtimeService = new ShowtimeService();

        public ActionResult Dashboard()
        {
            return View();
        }

        public ActionResult Movies()
        {
            return View();
        }

        public ActionResult Cinemas()
        {
            return View();
        }

        public ActionResult Rooms()
        {
            return View();
        }

        public ActionResult Showtimes()
        {
            return View();
        }

        [HttpGet]
        public async Task<JsonResult> GetAvailableRooms(
            string cinemaId,
            string movieId,
            string showDate,
            string startTime,
            int cleaningTime = ShowtimeService.DefaultCleaningTimeMinutes,
            string excludeShowtimeId = null)
        {
            try
            {
                await _showtimeService.EnsureAdminAsync(GetBearerToken());
                var result = await _showtimeService.GetAvailableRoomsAsync(
                    cinemaId,
                    movieId,
                    showDate,
                    startTime,
                    cleaningTime,
                    excludeShowtimeId);
                return Json(new
                {
                    success = true,
                    availableRooms = result.AvailableRooms.Select(room => new
                    {
                        id = room.Id,
                        name = room.Name
                    }),
                    occupiedRooms = result.OccupiedRooms.Select(room => new
                    {
                        id = room.Id,
                        name = room.Name,
                        reason = room.Reason
                    })
                }, JsonRequestBehavior.AllowGet);
            }
            catch (UnauthorizedAccessException ex)
            {
                Response.StatusCode = 401;
                return Json(new { success = false, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
            catch (ShowtimeValidationException ex)
            {
                Response.StatusCode = 400;
                return Json(new { success = false, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                Response.StatusCode = 500;
                return Json(new { success = false, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public async Task<JsonResult> SaveShowtimes(ShowtimeBatchRequest request)
        {
            try
            {
                await _showtimeService.EnsureAdminAsync(GetBearerToken());
                var result = await _showtimeService.SaveShowtimesAsync(request);
                return Json(new
                {
                    success = true,
                    savedCount = result.SavedCount,
                    showtimeIds = result.ShowtimeIds
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                Response.StatusCode = 401;
                return Json(new { success = false, message = ex.Message });
            }
            catch (ShowtimeValidationException ex)
            {
                Response.StatusCode = 409;
                return Json(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                Response.StatusCode = 500;
                return Json(new { success = false, message = ex.Message });
            }
        }

        private string GetBearerToken()
        {
            var authorization = Request.Headers["Authorization"] ?? "";
            const string prefix = "Bearer ";
            return authorization.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)
                ? authorization.Substring(prefix.Length).Trim()
                : "";
        }

        public ActionResult Users()
        {
            return View();
        }

        public ActionResult Bookings()
        {
            return View();
        }

        public ActionResult Tickets()
        {
            return View();
        }

        public ActionResult Payments()
        {
            return View();
        }

        public ActionResult Reports()
        {
            return View();
        }

        public ActionResult Banners()
        {
            return View();
        }

        public ActionResult Promotions()
        {
            return View();
        }

        public ActionResult FoodCombos()
        {
            return View();
        }

        public ActionResult News()
        {
            return View();
        }

        public ActionResult Reviews()
        {
            return View();
        }

        public ActionResult SupportTickets()
        {
            return View();
        }

        public ActionResult ActivityLogs()
        {
            return View();
        }

        public ActionResult Settings()
        {
            return View();
        }
    }
}
