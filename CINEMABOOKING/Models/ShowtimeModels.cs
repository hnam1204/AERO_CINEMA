using System.Collections.Generic;

namespace CINEMABOOKING.Models
{
    public class ShowtimeBatchRequest
    {
        public string MovieId { get; set; }
        public string CinemaId { get; set; }
        public string ShowDate { get; set; }
        public int CleaningTime { get; set; }
        public string Status { get; set; }
        public string ExcludeShowtimeId { get; set; }
        public List<ShowtimeRowRequest> Rows { get; set; }
    }

    public class ShowtimeRowRequest
    {
        public string Time { get; set; }
        public string RoomId { get; set; }
        public long Price { get; set; }
    }

    public class AvailableRoomResult
    {
        public List<RoomAvailabilityItem> AvailableRooms { get; set; } = new List<RoomAvailabilityItem>();
        public List<RoomAvailabilityItem> OccupiedRooms { get; set; } = new List<RoomAvailabilityItem>();
    }

    public class RoomAvailabilityItem
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string Reason { get; set; }
    }

    public class ShowtimeSaveResult
    {
        public int SavedCount { get; set; }
        public List<string> ShowtimeIds { get; set; } = new List<string>();
    }
}
