using CINEMABOOKING.Models;
using Google.Apis.Auth.OAuth2;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using System.Web.Hosting;

namespace CINEMABOOKING.Services
{
    public class ShowtimeService
    {
        public const int DefaultCleaningTimeMinutes = 15;

        private const int DefaultDurationMinutes = 120;
        private const int VipPriceDelta = 15000;
        private const int CouplePriceDelta = 40000;
        private const string FirestoreScope = "https://www.googleapis.com/auth/datastore";
        private static readonly string[] BlockingStatuses = { "active", "upcoming", "showing" };

        public async Task EnsureAdminAsync(string idToken)
        {
            if (string.IsNullOrWhiteSpace(idToken))
            {
                throw new UnauthorizedAccessException("Phiên đăng nhập admin không hợp lệ.");
            }

            var firebaseApiKey = ConfigurationManager.AppSettings["FirebaseApiKey"];
            if (string.IsNullOrWhiteSpace(firebaseApiKey))
            {
                throw new InvalidOperationException("Chưa cấu hình FirebaseApiKey trong Web.config.");
            }

            string userId;
            using (var authClient = new HttpClient())
            {
                var lookupBody = new JObject(new JProperty("idToken", idToken));
                var response = await authClient.PostAsync(
                    "https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=" + Uri.EscapeDataString(firebaseApiKey),
                    new StringContent(lookupBody.ToString(), Encoding.UTF8, "application/json"));

                if (!response.IsSuccessStatusCode)
                {
                    throw new UnauthorizedAccessException("Phiên đăng nhập Firebase đã hết hạn hoặc không hợp lệ.");
                }

                var lookupResult = JObject.Parse(await response.Content.ReadAsStringAsync());
                userId = lookupResult["users"]?.First?["localId"]?.ToString();
            }

            if (string.IsNullOrWhiteSpace(userId))
            {
                throw new UnauthorizedAccessException("Không xác định được tài khoản Firebase.");
            }

            using (var firestore = await CreateFirestoreClientAsync())
            {
                var user = await GetDocumentAsync(firestore.Client, firestore.ProjectId, "users", userId);
                var role = GetString(user, "role").Trim().ToLowerInvariant();
                var status = GetString(user, "status", "active").Trim().ToLowerInvariant();
                if (role != "admin" || status != "active")
                {
                    throw new UnauthorizedAccessException("Tài khoản không có quyền quản trị.");
                }
            }
        }

        public async Task<AvailableRoomResult> GetAvailableRoomsAsync(
            string cinemaId,
            string movieId,
            string showDate,
            string startTime,
            int cleaningTime,
            string excludeShowtimeId)
        {
            ValidateRequired(cinemaId, "Rạp");
            ValidateRequired(movieId, "Phim");
            var start = ParseStart(showDate, startTime);
            cleaningTime = Math.Max(0, cleaningTime);

            using (var firestore = await CreateFirestoreClientAsync())
            {
                var movie = await GetDocumentAsync(firestore.Client, firestore.ProjectId, "movies", movieId);
                var duration = GetPositiveInt(movie, "duration", DefaultDurationMinutes);
                var end = start.AddMinutes(duration + cleaningTime);
                var rooms = await QueryByFieldAsync(firestore.Client, firestore.ProjectId, "rooms", "cinemaId", cinemaId);
                var result = new AvailableRoomResult();

                foreach (var room in rooms.OrderBy(item => GetString(item, "name"), StringComparer.Create(new CultureInfo("vi-VN"), false)))
                {
                    var roomId = GetDocumentId(room);
                    var roomName = GetString(room, "name", "Phòng chiếu");
                    var roomStatus = GetString(room, "status", "active").Trim().ToLowerInvariant();
                    if (IsRoomUnavailableStatus(roomStatus))
                    {
                        result.OccupiedRooms.Add(new RoomAvailabilityItem
                        {
                            Id = roomId,
                            Name = roomName,
                            Reason = "Phòng đang tạm ngưng hoạt động."
                        });
                        continue;
                    }
                    var conflict = await FindConflictAsync(
                        firestore.Client,
                        firestore.ProjectId,
                        roomId,
                        showDate,
                        start,
                        end,
                        excludeShowtimeId,
                        null);

                    if (conflict == null)
                    {
                        result.AvailableRooms.Add(new RoomAvailabilityItem { Id = roomId, Name = roomName });
                    }
                    else
                    {
                        result.OccupiedRooms.Add(new RoomAvailabilityItem
                        {
                            Id = roomId,
                            Name = roomName,
                            Reason = BuildConflictReason(conflict)
                        });
                    }
                }

                return result;
            }
        }

        public async Task<ShowtimeSaveResult> SaveShowtimesAsync(ShowtimeBatchRequest request)
        {
            ValidateRequest(request);

            using (var firestore = await CreateFirestoreClientAsync())
            {
                var movie = await GetDocumentAsync(firestore.Client, firestore.ProjectId, "movies", request.MovieId);
                var cinema = await GetDocumentAsync(firestore.Client, firestore.ProjectId, "cinemas", request.CinemaId);
                var rooms = await QueryByFieldAsync(firestore.Client, firestore.ProjectId, "rooms", "cinemaId", request.CinemaId);
                var roomsById = rooms.ToDictionary(GetDocumentId, StringComparer.Ordinal);
                var duration = GetPositiveInt(movie, "duration", DefaultDurationMinutes);
                var cleaningTime = Math.Max(0, request.CleaningTime);
                var prepared = PrepareRows(request, roomsById, duration, cleaningTime);

                ValidateBatchConflicts(prepared);

                var transaction = await BeginTransactionAsync(firestore.Client, firestore.ProjectId);
                try
                {
                    foreach (var row in prepared)
                    {
                        var conflict = await FindConflictAsync(
                            firestore.Client,
                            firestore.ProjectId,
                            row.RoomId,
                            request.ShowDate,
                            row.Start,
                            row.End,
                            request.ExcludeShowtimeId,
                            transaction);

                        if (conflict != null)
                        {
                            throw new ShowtimeConflictException(
                                "Không thể lưu suất chiếu " + row.Time + ". " +
                                GetString(row.Room, "name", "Phòng chiếu") + " " + BuildConflictReason(conflict));
                        }
                    }

                    var result = await CommitShowtimesAsync(
                        firestore.Client,
                        firestore.ProjectId,
                        transaction,
                        request,
                        prepared,
                        movie,
                        cinema,
                        duration,
                        cleaningTime);
                    return result;
                }
                catch
                {
                    await RollbackAsync(firestore.Client, firestore.ProjectId, transaction);
                    throw;
                }
            }
        }

        private static void ValidateRequest(ShowtimeBatchRequest request)
        {
            if (request == null) throw new ShowtimeValidationException("Dữ liệu lịch chiếu không hợp lệ.");
            ValidateRequired(request.MovieId, "Phim");
            ValidateRequired(request.CinemaId, "Rạp");
            ParseStart(request.ShowDate, "00:00");
            if (request.Rows == null || request.Rows.Count == 0)
                throw new ShowtimeValidationException("Chưa có dòng suất chiếu.");
            if (!string.IsNullOrWhiteSpace(request.ExcludeShowtimeId) && request.Rows.Count != 1)
                throw new ShowtimeValidationException("Chỉ được cập nhật một suất chiếu mỗi lần.");
            if (request.CleaningTime < 0)
                throw new ShowtimeValidationException("Thời gian vệ sinh phòng không hợp lệ.");
        }

        private static List<PreparedShowtime> PrepareRows(
            ShowtimeBatchRequest request,
            IDictionary<string, JToken> roomsById,
            int duration,
            int cleaningTime)
        {
            var prepared = new List<PreparedShowtime>();
            for (var index = 0; index < request.Rows.Count; index++)
            {
                var row = request.Rows[index];
                if (row == null) throw new ShowtimeValidationException("Dòng " + (index + 1) + " không hợp lệ.");
                ValidateRequired(row.RoomId, "Phòng ở dòng " + (index + 1));
                if (!roomsById.TryGetValue(row.RoomId, out var room))
                    throw new ShowtimeValidationException("Dòng " + (index + 1) + ": Phòng không thuộc rạp đã chọn.");
                var roomStatus = GetString(room, "status", "active").Trim().ToLowerInvariant();
                if (IsRoomUnavailableStatus(roomStatus))
                    throw new ShowtimeValidationException("Dòng " + (index + 1) + ": Phòng đang tạm ngưng hoạt động.");
                if (row.Price <= 0)
                    throw new ShowtimeValidationException("Dòng " + (index + 1) + ": Giá vé phải lớn hơn 0.");

                var start = ParseStart(request.ShowDate, row.Time);
                prepared.Add(new PreparedShowtime
                {
                    Index = index,
                    Time = row.Time,
                    RoomId = row.RoomId,
                    Price = row.Price,
                    Room = room,
                    Start = start,
                    End = start.AddMinutes(duration + cleaningTime)
                });
            }
            return prepared;
        }

        private static void ValidateBatchConflicts(IList<PreparedShowtime> rows)
        {
            for (var i = 0; i < rows.Count; i++)
            {
                for (var j = i + 1; j < rows.Count; j++)
                {
                    if (rows[i].RoomId != rows[j].RoomId) continue;
                    if (!IntervalsOverlap(rows[i].Start, rows[i].End, rows[j].Start, rows[j].End)) continue;

                    throw new ShowtimeConflictException(
                        "Dòng " + (j + 1) + " trùng phòng với dòng " + (i + 1) + " (" +
                        GetString(rows[i].Room, "name", "Phòng chiếu") + " từ " +
                        FormatInterval(rows[i].Start, rows[i].End) + ").");
                }
            }
        }

        private static bool IntervalsOverlap(DateTime newStart, DateTime newEnd, DateTime existingStart, DateTime existingEnd)
        {
            return newStart < existingEnd && newEnd > existingStart;
        }

        private static bool IsRoomUnavailableStatus(string status)
        {
            return status == "inactive" || status == "deleted" || status == "hidden" || status == "maintenance";
        }

        private static async Task<JToken> FindConflictAsync(
            HttpClient client,
            string projectId,
            string roomId,
            string showDate,
            DateTime newStart,
            DateTime newEnd,
            string excludeShowtimeId,
            string transaction)
        {
            var dates = new[]
            {
                showDate,
                newStart.AddDays(-1).ToString("yyyy-MM-dd"),
                newStart.AddDays(1).ToString("yyyy-MM-dd")
            }.Distinct();
            foreach (var date in dates)
            {
                var existing = await QueryShowtimesAsync(client, projectId, roomId, date, transaction);
                foreach (var showtime in existing)
                {
                    if (GetDocumentId(showtime) == excludeShowtimeId) continue;
                    var interval = GetExistingInterval(showtime);
                    if (interval != null && IntervalsOverlap(newStart, newEnd, interval.Start, interval.End))
                        return showtime;
                }
            }
            return null;
        }

        private static ExistingInterval GetExistingInterval(JToken showtime)
        {
            var start = GetDateTime(showtime, "startAt") ?? ParseOptionalStart(GetString(showtime, "date"), GetString(showtime, "time"));
            if (!start.HasValue) return null;

            var end = GetDateTime(showtime, "endAt");
            if (!end.HasValue)
            {
                var duration = GetPositiveInt(showtime, "duration", DefaultDurationMinutes);
                var cleaning = Math.Max(0, GetInt(showtime, "cleaningTime", DefaultCleaningTimeMinutes));
                end = start.Value.AddMinutes(duration + cleaning);
            }

            return new ExistingInterval { Start = start.Value, End = end.Value };
        }

        private static string BuildConflictReason(JToken showtime)
        {
            var interval = GetExistingInterval(showtime);
            var movieTitle = GetString(showtime, "movieTitle", "phim khác");
            if (interval == null) return "đã có lịch chiếu khác.";
            return "đã được sử dụng bởi " + movieTitle + " từ " + FormatInterval(interval.Start, interval.End) + ".";
        }

        private static string FormatInterval(DateTime start, DateTime end)
        {
            return start.ToString("HH:mm") + " - " + end.ToString("HH:mm");
        }

        private static DateTime ParseStart(string date, string time)
        {
            var value = (date ?? "") + " " + (time ?? "");
            if (!DateTime.TryParseExact(value, "yyyy-MM-dd HH:mm", CultureInfo.InvariantCulture, DateTimeStyles.None, out var result))
                throw new ShowtimeValidationException("Ngày hoặc thời gian chiếu không hợp lệ.");
            return DateTime.SpecifyKind(result, DateTimeKind.Unspecified);
        }

        private static DateTime? ParseOptionalStart(string date, string time)
        {
            try { return ParseStart(date, time); }
            catch (ShowtimeValidationException) { return null; }
        }

        private static void ValidateRequired(string value, string fieldName)
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new ShowtimeValidationException(fieldName + " là bắt buộc.");
        }

        private static async Task<ShowtimeSaveResult> CommitShowtimesAsync(
            HttpClient client,
            string projectId,
            string transaction,
            ShowtimeBatchRequest request,
            IList<PreparedShowtime> rows,
            JToken movie,
            JToken cinema,
            int duration,
            int cleaningTime)
        {
            var writes = new JArray();
            var result = new ShowtimeSaveResult();
            var isEdit = !string.IsNullOrWhiteSpace(request.ExcludeShowtimeId);

            foreach (var row in rows)
            {
                var showtimeId = isEdit ? request.ExcludeShowtimeId : Guid.NewGuid().ToString("N");
                var fields = BuildShowtimeFields(showtimeId, request, row, movie, cinema, duration, cleaningTime, !isEdit);
                var update = new JObject(
                    new JProperty("name", DocumentResourceName(projectId, "showtimes", showtimeId)),
                    new JProperty("fields", fields));
                var write = new JObject(new JProperty("update", update));

                if (isEdit)
                {
                    write["updateMask"] = new JObject(new JProperty("fieldPaths", new JArray(fields.Properties().Select(p => p.Name))));
                    write["currentDocument"] = new JObject(new JProperty("exists", true));
                }

                writes.Add(write);
                result.ShowtimeIds.Add(showtimeId);
            }

            var body = new JObject(
                new JProperty("writes", writes),
                new JProperty("transaction", transaction));
            var response = await client.PostAsync(
                FirestoreBase(projectId) + ":commit",
                new StringContent(body.ToString(), Encoding.UTF8, "application/json"));
            await EnsureSuccessAsync(response, "Không thể lưu lịch chiếu");
            result.SavedCount = rows.Count;
            return result;
        }

        private static JObject BuildShowtimeFields(
            string showtimeId,
            ShowtimeBatchRequest request,
            PreparedShowtime row,
            JToken movie,
            JToken cinema,
            int duration,
            int cleaningTime,
            bool includeCreatedFields)
        {
            var seatRows = GetSeatRows(row.Room);
            var seatColumns = Math.Max(1, GetInt(row.Room, "seatColumns", 10));
            var vipRows = GetStringArray(row.Room, "vipRows", new[] { "E", "F" });
            var coupleRows = GetStringArray(row.Room, "coupleRows", new[] { "G", "H" });
            var fields = new JObject
            {
                ["showtimeId"] = StringValue(showtimeId),
                ["movieId"] = StringValue(request.MovieId),
                ["movieTitle"] = StringValue(GetString(movie, "title", GetString(movie, "name"))),
                ["moviePoster"] = StringValue(GetString(movie, "posterUrl", GetString(movie, "poster"))),
                ["cinemaId"] = StringValue(request.CinemaId),
                ["cinemaName"] = StringValue(GetString(cinema, "name")),
                ["roomId"] = StringValue(row.RoomId),
                ["roomName"] = StringValue(GetString(row.Room, "name")),
                ["date"] = StringValue(request.ShowDate),
                ["time"] = StringValue(row.Time),
                ["startAt"] = StringValue(row.Start.ToString("yyyy-MM-dd'T'HH:mm:ss")),
                ["endAt"] = StringValue(row.End.ToString("yyyy-MM-dd'T'HH:mm:ss")),
                ["duration"] = IntegerValue(duration),
                ["cleaningTime"] = IntegerValue(cleaningTime),
                ["price"] = IntegerValue(row.Price),
                ["standardPrice"] = IntegerValue(row.Price),
                ["vipPrice"] = IntegerValue(row.Price + VipPriceDelta),
                ["couplePrice"] = IntegerValue(row.Price + CouplePriceDelta),
                ["status"] = StringValue(string.IsNullOrWhiteSpace(request.Status) ? "active" : request.Status.Trim().ToLowerInvariant()),
                ["seatRows"] = ArrayValue(seatRows),
                ["seatColumns"] = IntegerValue(seatColumns),
                ["vipRows"] = ArrayValue(vipRows),
                ["coupleRows"] = ArrayValue(coupleRows),
                ["updatedAt"] = TimestampValue(DateTime.UtcNow)
            };

            if (includeCreatedFields)
            {
                fields["soldSeats"] = ArrayValue(new string[0]);
                fields["createdAt"] = TimestampValue(DateTime.UtcNow);
            }
            return fields;
        }

        private static IList<string> GetSeatRows(JToken room)
        {
            var field = room?["fields"]?["seatRows"];
            var values = field?["arrayValue"]?["values"] as JArray;
            if (values != null)
            {
                var rows = values
                    .Select(value => value["stringValue"]?.ToString())
                    .Where(value => !string.IsNullOrWhiteSpace(value))
                    .ToList();
                if (rows.Count > 0) return rows;
            }

            var text = field?["stringValue"]?.ToString();
            if (!string.IsNullOrWhiteSpace(text) && text.Contains(","))
            {
                var rows = text.Split(',')
                    .Select(value => value.Trim().ToUpperInvariant())
                    .Where(value => value.Length > 0)
                    .ToList();
                if (rows.Count > 0) return rows;
            }

            var count = Math.Max(1, Math.Min(26, GetInt(room, "seatRows", 8)));
            return Enumerable.Range(0, count).Select(index => ((char)('A' + index)).ToString()).ToList();
        }

        private static IList<string> GetStringArray(JToken document, string fieldName, IEnumerable<string> fallback)
        {
            var field = document["fields"]?[fieldName];
            var values = field?["arrayValue"]?["values"] as JArray;
            if (values != null)
                return values.Select(value => value["stringValue"]?.ToString()).Where(value => !string.IsNullOrWhiteSpace(value)).ToList();

            var text = field?["stringValue"]?.ToString();
            if (!string.IsNullOrWhiteSpace(text))
                return text.Split(',').Select(value => value.Trim().ToUpperInvariant()).Where(value => value.Length > 0).ToList();

            return fallback?.ToList();
        }

        private static async Task<List<JToken>> QueryShowtimesAsync(HttpClient client, string projectId, string roomId, string date, string transaction)
        {
            var filters = new JArray(
                FieldFilter("roomId", "EQUAL", StringValue(roomId)),
                FieldFilter("date", "EQUAL", StringValue(date)),
                FieldFilter("status", "IN", ArrayValue(BlockingStatuses)));
            return await RunQueryAsync(client, projectId, "showtimes", filters, transaction);
        }

        private static async Task<List<JToken>> QueryByFieldAsync(HttpClient client, string projectId, string collectionId, string field, string value)
        {
            return await RunQueryAsync(client, projectId, collectionId, new JArray(FieldFilter(field, "EQUAL", StringValue(value))), null);
        }

        private static async Task<List<JToken>> RunQueryAsync(
            HttpClient client,
            string projectId,
            string collectionId,
            JArray filters,
            string transaction)
        {
            JToken where = filters.Count == 1
                ? filters[0]
                : new JObject(new JProperty("compositeFilter", new JObject(
                    new JProperty("op", "AND"),
                    new JProperty("filters", filters))));
            var body = new JObject(new JProperty("structuredQuery", new JObject(
                new JProperty("from", new JArray(new JObject(new JProperty("collectionId", collectionId)))),
                new JProperty("where", where))));
            if (!string.IsNullOrWhiteSpace(transaction)) body["transaction"] = transaction;

            var response = await client.PostAsync(
                FirestoreBase(projectId) + ":runQuery",
                new StringContent(body.ToString(), Encoding.UTF8, "application/json"));
            await EnsureSuccessAsync(response, "Không thể truy vấn Firestore");
            var results = JArray.Parse(await response.Content.ReadAsStringAsync());
            return results.Select(item => item["document"]).Where(item => item != null).ToList();
        }

        private static JObject FieldFilter(string field, string op, JObject value)
        {
            return new JObject(new JProperty("fieldFilter", new JObject(
                new JProperty("field", new JObject(new JProperty("fieldPath", field))),
                new JProperty("op", op),
                new JProperty("value", value))));
        }

        private static async Task<JToken> GetDocumentAsync(HttpClient client, string projectId, string collectionId, string documentId)
        {
            var response = await client.GetAsync(DocumentUrl(projectId, collectionId, documentId));
            await EnsureSuccessAsync(response, "Không tìm thấy " + collectionId + "/" + documentId);
            return JObject.Parse(await response.Content.ReadAsStringAsync());
        }

        private static async Task<string> BeginTransactionAsync(HttpClient client, string projectId)
        {
            var response = await client.PostAsync(
                FirestoreBase(projectId) + ":beginTransaction",
                new StringContent("{}", Encoding.UTF8, "application/json"));
            await EnsureSuccessAsync(response, "Không thể bắt đầu giao dịch Firestore");
            return JObject.Parse(await response.Content.ReadAsStringAsync())["transaction"]?.ToString();
        }

        private static async Task RollbackAsync(HttpClient client, string projectId, string transaction)
        {
            if (string.IsNullOrWhiteSpace(transaction)) return;
            try
            {
                var body = new JObject(new JProperty("transaction", transaction));
                await client.PostAsync(
                    FirestoreBase(projectId) + ":rollback",
                    new StringContent(body.ToString(), Encoding.UTF8, "application/json"));
            }
            catch { }
        }

        private static async Task EnsureSuccessAsync(HttpResponseMessage response, string message)
        {
            if (response.IsSuccessStatusCode) return;
            var detail = await response.Content.ReadAsStringAsync();
            throw new InvalidOperationException(message + ". Firestore: " + detail);
        }

        private static async Task<FirestoreClientContext> CreateFirestoreClientAsync()
        {
            var path = HostingEnvironment.MapPath("~/App_Data/service-account.json");
            if (string.IsNullOrWhiteSpace(path) || !File.Exists(path))
                throw new FileNotFoundException("Không tìm thấy App_Data/service-account.json.");

            var json = File.ReadAllText(path);
            var serviceAccount = JObject.Parse(json);
            var projectId = serviceAccount["project_id"]?.ToString();
            var credential = GoogleCredential.FromJson(json).CreateScoped(FirestoreScope);
            var token = await credential.UnderlyingCredential.GetAccessTokenForRequestAsync();
            var client = new HttpClient();
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
            return new FirestoreClientContext(client, projectId);
        }

        private static string FirestoreBase(string projectId)
        {
            return "https://firestore.googleapis.com/v1/projects/" + projectId + "/databases/(default)/documents";
        }

        private static string DocumentResourceName(string projectId, string collectionId, string documentId)
        {
            return "projects/" + projectId
                + "/databases/(default)/documents/"
                + Uri.EscapeDataString(collectionId)
                + "/"
                + Uri.EscapeDataString(documentId);
        }

        private static string DocumentUrl(string projectId, string collectionId, string documentId)
        {
            return FirestoreBase(projectId) + "/" + Uri.EscapeDataString(collectionId) + "/" + Uri.EscapeDataString(documentId);
        }

        private static string GetDocumentId(JToken document)
        {
            var name = document?["name"]?.ToString() ?? "";
            return name.Split('/').LastOrDefault() ?? "";
        }

        private static string GetString(JToken document, string fieldName, string fallback = "")
        {
            return document?["fields"]?[fieldName]?["stringValue"]?.ToString() ?? fallback;
        }

        private static int GetInt(JToken document, string fieldName, int fallback)
        {
            var field = document?["fields"]?[fieldName];
            if (int.TryParse(field?["integerValue"]?.ToString(), out var integer)) return integer;
            if (double.TryParse(field?["doubleValue"]?.ToString(), NumberStyles.Any, CultureInfo.InvariantCulture, out var number)) return (int)number;
            return fallback;
        }

        private static int GetPositiveInt(JToken document, string fieldName, int fallback)
        {
            var value = GetInt(document, fieldName, fallback);
            return value > 0 ? value : fallback;
        }

        private static DateTime? GetDateTime(JToken document, string fieldName)
        {
            var field = document?["fields"]?[fieldName];
            var value = field?["stringValue"]?.ToString() ?? field?["timestampValue"]?.ToString();
            if (string.IsNullOrWhiteSpace(value)) return null;
            if (DateTime.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var result))
                return result.Kind == DateTimeKind.Utc ? result.ToLocalTime() : DateTime.SpecifyKind(result, DateTimeKind.Unspecified);
            return null;
        }

        private static JObject StringValue(string value) => new JObject(new JProperty("stringValue", value ?? ""));
        private static JObject IntegerValue(long value) => new JObject(new JProperty("integerValue", value.ToString(CultureInfo.InvariantCulture)));
        private static JObject TimestampValue(DateTime value) => new JObject(new JProperty("timestampValue", value.ToUniversalTime().ToString("yyyy-MM-dd'T'HH:mm:ss.fff'Z'")));
        private static JObject ArrayValue(IEnumerable<string> values) => new JObject(new JProperty("arrayValue", new JObject(
            new JProperty("values", new JArray((values ?? Enumerable.Empty<string>()).Select(StringValue))))));

        private sealed class PreparedShowtime
        {
            public int Index { get; set; }
            public string Time { get; set; }
            public string RoomId { get; set; }
            public long Price { get; set; }
            public JToken Room { get; set; }
            public DateTime Start { get; set; }
            public DateTime End { get; set; }
        }

        private sealed class ExistingInterval
        {
            public DateTime Start { get; set; }
            public DateTime End { get; set; }
        }

        private sealed class FirestoreClientContext : IDisposable
        {
            public FirestoreClientContext(HttpClient client, string projectId)
            {
                Client = client;
                ProjectId = projectId;
            }

            public HttpClient Client { get; }
            public string ProjectId { get; }
            public void Dispose() => Client.Dispose();
        }
    }

    public class ShowtimeValidationException : Exception
    {
        public ShowtimeValidationException(string message) : base(message) { }
    }

    public class ShowtimeConflictException : ShowtimeValidationException
    {
        public ShowtimeConflictException(string message) : base(message) { }
    }
}
