import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import datetime
import random

# Initialize Firebase Admin SDK
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

print("Connected to Firestore. Starting seeding process...")

# Clear existing collections (optional, but good for clean seed)
def delete_collection(coll_ref, batch_size=100):
    docs = coll_ref.limit(batch_size).stream()
    deleted = 0
    for doc in docs:
        doc.reference.delete()
        deleted += 1
    if deleted >= batch_size:
        return delete_collection(coll_ref, batch_size)

# List of collections to seed
collections_to_clear = [
    "movies", "cinemas", "rooms", "showtimes", "seats", "banners", "promotions", "news", "reviews"
]

for coll in collections_to_clear:
    print(f"Clearing collection '{coll}'...")
    delete_collection(db.collection(coll))

# Helper for Batch Writes (500 limit)
class FirestoreBatchWriter:
    def __init__(self, db):
        self.db = db
        self.batch = db.batch()
        self.count = 0
        self.total_writes = 0

    def set(self, doc_ref, data):
        self.batch.set(doc_ref, data)
        self.count += 1
        if self.count >= 500:
            self.commit()

    def commit(self):
        if self.count > 0:
            self.batch.commit()
            self.total_writes += self.count
            print(f"Committed batch of {self.count} documents. Total: {self.total_writes}")
            self.batch = self.db.batch()
            self.count = 0

    def flush(self):
        self.commit()

batch_writer = FirestoreBatchWriter(db)

# ----------------- 1. SEED CINEMAS -----------------
print("Seeding cinemas...")
cinema_data = [
    {"name": "CINEMABOOKING Cần Thơ", "address": "Vincom Plaza Xuân Khánh, 209 Đường 30/4, Ninh Kiều, Cần Thơ", "phone": "0292 3739 888"},
    {"name": "CINEMABOOKING TP.HCM", "address": "Vạn Hạnh Mall, 11 Sư Vạn Hạnh, Quận 10, TP. Hồ Chí Minh", "phone": "028 3862 0888"},
    {"name": "CINEMABOOKING Hà Nội", "address": "Vincom Center Bà Triệu, 191 Bà Triệu, Hai Bà Trưng, Hà Nội", "phone": "024 3974 8888"},
    {"name": "CINEMABOOKING Đà Nẵng", "address": "Lotte Mart Đà Nẵng, 6 Nại Nam, Hải Châu, Đà Nẵng", "phone": "0236 3611 888"},
    {"name": "CINEMABOOKING Hải Phòng", "address": "Vincom Plaza Imperia, Số 1 Đường Bạch Đằng, Hồng Bàng, Hải Phòng", "phone": "0225 3246 888"}
]

cinema_ids = []
cinemas_ref = db.collection("cinemas")
for c in cinema_data:
    doc_ref = cinemas_ref.document()
    c["createdAt"] = firestore.SERVER_TIMESTAMP
    batch_writer.set(doc_ref, c)
    cinema_ids.append((doc_ref.id, c["name"]))

batch_writer.flush()

# ----------------- 2. SEED ROOMS -----------------
print("Seeding rooms...")
rooms_ref = db.collection("rooms")
room_ids_by_cinema = {}

room_types = ["2D", "3D", "IMAX"]

for c_id, c_name in cinema_ids:
    room_ids_by_cinema[c_id] = []
    for r_num in range(1, 6): # 5 rooms
        r_name = f"Phòng {r_num}"
        r_type = "IMAX" if r_num == 5 else ("3D" if r_num == 4 else "2D")
        room_doc = {
            "cinemaId": c_id,
            "cinemaName": c_name,
            "name": r_name,
            "type": r_type,
            "totalSeats": 100,
            "createdAt": firestore.SERVER_TIMESTAMP
        }
        doc_ref = rooms_ref.document()
        batch_writer.set(doc_ref, room_doc)
        room_ids_by_cinema[c_id].append((doc_ref.id, r_name))

batch_writer.flush()

# ----------------- 3. SEED MOVIES -----------------
print("Seeding movies...")
movies_ref = db.collection("movies")

genres = ["Hành Động", "Tình Cảm", "Kinh Dị", "Hoạt Hình", "Hài Hước", "Phiêu Lưu", "Kịch Tính", "Khoa Học Viễn Tưởng", "Gia Đình"]
ratings = ["P", "T13", "T16", "T18"]
countries = ["Việt Nam", "Mỹ", "Hàn Quốc", "Nhật Bản", "Pháp"]
languages = ["Tiếng Việt", "Tiếng Anh (Phụ đề)", "Tiếng Hàn (Phụ đề)", "Tiếng Nhật (Lồng tiếng)"]

now_showing_titles = [
    "Lật Mặt 7: Một Điều Ước", "Mai", "Đất Rừng Phương Nam", "Nhà Bà Nữ", "Bố Già",
    "Em và Trịnh", "Tiệc Trăng Máu", "Mắt Biếc", "Chị Mười Ba", "Gái Già Lắm Chiêu 3",
    "Chàng Vợ Của Em", "Song Song", "Siêu Sao Siêu Ngố", "Em Chưa 18", "Bẫy Ngọt Ngào"
]

coming_soon_titles = [
    "Lật Mặt 8: Kịch Bản Tử Thần", "Kẻ Kiến Tạo Thế Giới", "Thám Tử Lừng Danh Conan: Ngôi Sao 5 Cánh",
    "Doraemon: Bản Giao Hưởng Địa Cầu", "Inside Out 2: Mảnh Ghép Cảm Xúc", "Deadpool & Wolverine: Song Hùng",
    "Despicable Me 4: Kẻ Trộm Mặt Trăng", "Joker: Điên Có Đôi", "Gladiator II: Võ Sĩ Giác Đấu",
    "Wicked: Phù Thủy Phương Tây", "Moana 2: Hành Trình Mới", "Mufasa: Vua Sư Tử",
    "Sonic the Hedgehog 3: Siêu Nhím", "Avatar 3: Lửa và Tro", "Elio: Cậu Bé Vũ Trụ"
]

movie_ids = []
movie_titles_mapping = {}

def get_placeholder_urls():
    posters = [
        "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=85",
        "https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=600&q=85",
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=85",
        "https://images.unsplash.com/photo-1608889175123-8ee362201f81?auto=format&fit=crop&w=600&q=85"
    ]
    banners = [
        "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1600&q=80",
        "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1600&q=80"
    ]
    return random.choice(posters), random.choice(banners)

# Seed Now Showing
for title in now_showing_titles:
    poster, banner = get_placeholder_urls()
    m_doc = {
        "title": title,
        "genre": ", ".join(random.sample(genres, 2)),
        "duration": random.randint(90, 160),
        "rating": random.choice(ratings),
        "releaseDate": (datetime.date.today() - datetime.timedelta(days=random.randint(1, 20))).isoformat(),
        "director": "Đạo diễn danh tiếng",
        "actors": "Diễn viên ngôi sao 1, Diễn viên ngôi sao 2",
        "language": random.choice(languages),
        "country": random.choice(countries),
        "description": f"Bộ phim '{title}' mang lại những khoảnh khắc tuyệt vời và trải nghiệm điện ảnh khó quên tại CINEMABOOKING.",
        "posterUrl": poster,
        "bannerUrl": banner,
        "trailerUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "status": "now_showing",
        "isHot": random.choice([True, False]),
        "createdAt": firestore.SERVER_TIMESTAMP
    }
    doc_ref = movies_ref.document()
    batch_writer.set(doc_ref, m_doc)
    movie_ids.append((doc_ref.id, "now_showing"))
    movie_titles_mapping[doc_ref.id] = title

# Seed Coming Soon
for title in coming_soon_titles:
    poster, banner = get_placeholder_urls()
    m_doc = {
        "title": title,
        "genre": ", ".join(random.sample(genres, 2)),
        "duration": random.randint(95, 150),
        "rating": random.choice(ratings),
        "releaseDate": (datetime.date.today() + datetime.timedelta(days=random.randint(5, 45))).isoformat(),
        "director": "Đạo diễn Hollywood",
        "actors": "Tài tử quốc tế A, Đại minh tinh B",
        "language": random.choice(languages),
        "country": random.choice(countries),
        "description": f"Tác phẩm bom tấn được mong chờ nhất năm '{title}' sắp cập bến phòng vé CINEMABOOKING.",
        "posterUrl": poster,
        "bannerUrl": banner,
        "trailerUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "status": "coming_soon",
        "isHot": random.choice([True, False]),
        "createdAt": firestore.SERVER_TIMESTAMP
    }
    doc_ref = movies_ref.document()
    batch_writer.set(doc_ref, m_doc)
    movie_ids.append((doc_ref.id, "coming_soon"))
    movie_titles_mapping[doc_ref.id] = title

batch_writer.flush()

# ----------------- 4. SEED SHOWTIMES & SEATS -----------------
print("Seeding 300 showtimes and their corresponding seats...")
showtimes_ref = db.collection("showtimes")
seats_ref = db.collection("seats")

times = ["09:00", "11:30", "14:00", "16:30", "19:00", "21:30"]
prices = [75000, 85000, 95000]

now_showing_ids = [m_id for m_id, status in movie_ids if status == "now_showing"]
showtimes_created = []

# Generate 300 showtimes spread across movies, cinemas, and rooms
for st_idx in range(300):
    m_id = random.choice(now_showing_ids)
    m_title = movie_titles_mapping[m_id]
    c_id, c_name = random.choice(cinema_ids)
    r_id, r_name = random.choice(room_ids_by_cinema[c_id])
    
    # Showcase dates: today, tomorrow, and next 5 days
    day_offset = random.randint(0, 6)
    st_date = (datetime.date.today() + datetime.timedelta(days=day_offset)).isoformat()
    st_time = random.choice(times)
    st_price = random.choice(prices)

    st_doc = {
        "movieId": m_id,
        "movieTitle": m_title,
        "cinemaId": c_id,
        "cinemaName": c_name,
        "roomId": r_id,
        "roomName": r_name,
        "date": st_date,
        "time": st_time,
        "price": st_price,
        "status": "active",
        "createdAt": firestore.SERVER_TIMESTAMP
    }
    doc_ref = showtimes_ref.document()
    batch_writer.set(doc_ref, st_doc)
    showtimes_created.append((doc_ref.id, st_price))

batch_writer.flush()

# Seeding seats for each showtime. To prevent performance lag/billing cost in Firebase,
# we will seed seats for each of these 300 showtimes.
# Let's seed 100 seats per room: row A to row J, columns 1 to 10
print("Seeding seats for all showtimes...")
seats_count = 0

for st_id, base_price in showtimes_created:
    for row_char in ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]:
        # If J row, it's double seats: J1-J2, J3-J4, J5-J6, J7-J8, J9-J10 (5 double seats)
        if row_char == "J":
            for col in range(1, 10, 2):
                seat_code = f"J{col}-J{col+1}"
                seat_type = "double"
                seat_price = 160000
                seat_doc = {
                    "showtimeId": st_id,
                    "seatCode": seat_code,
                    "seatType": seat_type,
                    "price": seat_price,
                    "status": "available"
                }
                doc_ref = seats_ref.document()
                batch_writer.set(doc_ref, seat_doc)
        else:
            # Rows A-I: columns 1-10
            is_vip = row_char in ["F", "G", "H", "I"]
            seat_type = "vip" if is_vip else "standard"
            seat_price = base_price + 15000 if is_vip else base_price

            for col in range(1, 11):
                seat_code = f"{row_char}{col}"
                seat_doc = {
                    "showtimeId": st_id,
                    "seatCode": seat_code,
                    "seatType": seat_type,
                    "price": seat_price,
                    "status": "available"
                }
                doc_ref = seats_ref.document()
                batch_writer.set(doc_ref, seat_doc)

batch_writer.flush()

# ----------------- 5. SEED BANNERS -----------------
print("Seeding banners...")
banners_ref = db.collection("banners")

for i, (m_id, status) in enumerate(movie_ids[:5]):
    banner_doc = {
        "title": movie_titles_mapping[m_id],
        "imageUrl": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1600&q=80",
        "movieId": m_id,
        "order": i + 1
    }
    batch_writer.set(banners_ref.document(), banner_doc)

batch_writer.flush()

# ----------------- 6. SEED PROMOTIONS -----------------
print("Seeding promotions...")
promotions_ref = db.collection("promotions")
promo_titles = [
    "Thứ Tư Đồng Giá 50K", "Combo Gia Đình Tiết Kiệm", "Hội Viên Trẻ Đồng Giá 45K",
    "Chào Hè Rực Rỡ Tặng Vé", "Khuyến Mãi Cuối Tuần 20%", "Bắp Nước Free Size",
    "Đặt Vé Trực Tuyến Giảm 10K", "Sinh Nhật Vàng Nhận Quà Khủng", "Thanh Toán MoMo Hoàn Tiền",
    "Hội Viên Thân Thiết Tích Điểm X2"
]

for i, p_title in enumerate(promo_titles):
    promo_doc = {
        "title": p_title,
        "description": f"Chương trình khuyến mãi '{p_title}' áp dụng cho toàn bộ khách hàng đặt vé xem phim trực tuyến qua CINEMABOOKING.",
        "discountPercent": random.choice([10, 15, 20, 30, 50]),
        "startDate": (datetime.date.today() - datetime.timedelta(days=5)).isoformat(),
        "endDate": (datetime.date.today() + datetime.timedelta(days=30)).isoformat()
    }
    batch_writer.set(promotions_ref.document(), promo_doc)

batch_writer.flush()

# ----------------- 7. SEED NEWS -----------------
print("Seeding movie news...")
news_ref = db.collection("news")
news_titles = [
    "Những bộ phim Việt hứa hẹn gây bão phòng vé năm 2026",
    "Đạo diễn Lý Hải hé lộ hậu trường độc quyền Lật Mặt 7",
    "Doraemon trở lại màn ảnh rộng với dự án âm nhạc siêu khủng",
    "Marvel công bố chặng đường tiếp theo cho kỷ nguyên Avengers",
    "Review chi tiết siêu phẩm khoa học viễn tưởng mới từ Hollywood",
    "Lịch sử phát triển các công nghệ rạp phim IMAX và 3D",
    "Danh sách những bộ phim kinh dị đáng xem nhất mùa hè này",
    "Tương lai của ngành rạp chiếu Việt Nam sau đại dịch",
    "Tại sao các bộ phim gia đình đang thống trị các phòng vé?",
    "Hậu trường hóa trang kỳ công của phim kinh dị Đêm Định Mệnh",
    "Tác phẩm hoạt hình Inside Out 2 chạm mốc doanh thu kỷ lục",
    "Sự trở lại ngoạn mục của các thương hiệu hoạt hình lớn",
    "Đánh giá sớm siêu phẩm hành động phiêu lưu cuối tuần",
    "Những câu chuyện truyền cảm hứng từ đạo diễn trẻ tài năng",
    "Tại sao bắp rang bơ trở thành món ăn biểu tượng tại rạp phim?",
    "Các cụm rạp CINEMABOOKING nâng cấp phòng chiếu IMAX",
    "Ứng dụng đặt vé CINEMABOOKING bổ sung ví điện tử mới",
    "Ưu đãi ngập tràn dành riêng cho các thành viên VIP",
    "Lễ trao giải Oscar 2026 và những dự đoán sớm nhất",
    "Điểm lại những bài hát chủ đề phim ấn tượng nhất lịch sử"
]

for i, n_title in enumerate(news_titles):
    news_doc = {
        "title": n_title,
        "imageUrl": "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=600&q=80",
        "summary": f"Tóm tắt thông tin quan trọng về bài viết '{n_title}' mới nhất.",
        "content": f"Nội dung chi tiết của bài viết tin tức điện ảnh mang tên '{n_title}'. Cập nhật những xu hướng và tin tức nóng hổi nhất từ thị trường giải trí trong và ngoài nước.",
        "createdAt": firestore.SERVER_TIMESTAMP
    }
    batch_writer.set(news_ref.document(), news_doc)

batch_writer.flush()

# ----------------- 8. SEED REVIEWS -----------------
print("Seeding 100 reviews...")
reviews_ref = db.collection("reviews")

review_names = ["Nguyễn Văn A", "Trần Thị B", "Lê Hoàng C", "Phạm Minh D", "Vũ Tuyết E", "Đỗ Quốc F", "Hoàng Thu G", "Ngô Hữu H"]
review_comments = [
    "Phim quá hay, hình ảnh và âm thanh sống động vô cùng!",
    "Một câu chuyện đầy xúc động, lấy đi nhiều nước mắt.",
    "Kịch bản xuất sắc, diễn xuất của các diễn viên tròn vai.",
    "Hình ảnh đẹp, kỹ xảo hoành tráng nhưng cốt truyện hơi đuối.",
    "Phim giải trí tốt, rất thích hợp xem cùng gia đình.",
    "Tác phẩm đáng xem nhất năm nay, khuyên mọi người nên ra rạp.",
    "Rất ấn tượng với âm nhạc trong phim, nâng tầm cảm xúc.",
    "Phim hơi dài nhưng diễn biến hấp dẫn không gây nhàm chán.",
    "Kinh dị giật gân xem thót tim, rất đáng đồng tiền bát gạo.",
    "Không uổng công chờ đợi, phần mới xuất sắc tuyệt vời!"
]

for i in range(100):
    m_id = random.choice([m_id for m_id, status in movie_ids])
    review_doc = {
        "movieId": m_id,
        "userName": random.choice(review_names),
        "rating": random.choice([3, 4, 5]),
        "comment": random.choice(review_comments)
    }
    batch_writer.set(reviews_ref.document(), review_doc)

batch_writer.flush()

print("\n--- SEEDING COMPLETED SUCCESSFULLY ---")
print(f"Total write operations successfully pushed: {batch_writer.total_writes}")
