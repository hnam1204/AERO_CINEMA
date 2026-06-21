using System;

namespace CINEMABOOKING.Models
{
    public class TicketEmailModel
    {
        public string Email { get; set; }
        public string FullName { get; set; }
        public string MovieTitle { get; set; }
        public string CinemaName { get; set; }
        public string RoomName { get; set; }
        public string ShowDate { get; set; }
        public string ShowTime { get; set; }
        public string SeatNames { get; set; }
        public string TicketCode { get; set; }
        public string BookingCode { get; set; }
        public string Amount { get; set; }
        public string QrCodeUrl { get; set; }
    }
}
