import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { AIProvider } from "./AIProvider.js";
import { ChatbotServices } from "./chatbot-services.js";

console.log("AERO Chatbot loaded");
console.log("window.db", window.db);
console.log("window.auth", window.auth);

const HISTORY_KEY = "aeroChatHistory";
const HISTORY_LIMIT = 30;
const EMPTY_TEXT = "Hiện chưa có dữ liệu phù hợp.";
const ERROR_TEXT = "Xin lỗi, hiện chưa thể tải dữ liệu. Vui lòng thử lại sau.";
const FALLBACK_TEXT = "Tôi có thể hỗ trợ:\n\n• Phim đang chiếu\n• Lịch chiếu\n• Vé của tôi\n• Giá vé\n• Khuyến mãi\n• Gợi ý phim";
const quickActions = [
    "🎬 Phim đang chiếu",
    "🎟 Lịch chiếu hôm nay",
    "📍 Rạp gần tôi",
    "💰 Giá vé",
    "🎁 Khuyến mãi",
    "🎫 Vé của tôi",
    "❤️ Gợi ý phim",
    "🎭 Thể loại phim"
];

const genreAliases = {
    "hanh dong": ["hành động", "action"],
    "kinh di": ["kinh dị", "horror"],
    "hoat hinh": ["hoạt hình", "animation"],
    "lang man": ["lãng mạn", "romance"],
    "gia dinh": ["gia đình", "family"],
    "hai": ["hài", "comedy"],
    "phieu luu": ["phiêu lưu", "adventure"]
};

const intentRules = [
    { name: "seat_advice", keywords: ["ghe nao dep", "ghe dep", "chon ghe", "best seat"] },
    { name: "budget_search", test: text => /(?:\d+[\s.]?k|\d{4,})/.test(text) && hasAny(text, ["toi co", "ngan sach", "gia", "budget"]) },
    { name: "ticket_search", keywords: ["ve cua toi", "lich su ve", "my ticket", "ve da dat"] },
    { name: "promotion_search", keywords: ["khuyen mai", "uu dai", "voucher", "promotion", "coupon"] },
    { name: "cinema_search", keywords: ["rap gan toi", "rap nao gan", "rap phim", "dia chi rap", "cinema", "location"] },
    { name: "price_search", keywords: ["gia ve", "ticket price", "bao nhieu tien"] },
    { name: "situation_recommendation", keywords: ["ban gai", "nguoi yeu", "gia dinh", "tre em", "con nho", "couple"] },
    { name: "genre_search", test: text => hasAny(text, ["toi thich", "the loai", "goi y phim", "recommend"]) || detectGenre(text) !== null },
    { name: "showtime_search", keywords: ["lich chieu", "suat chieu", "chieu luc", "may gio", "toi nay", "sau 19", "showtime", "today"] },
    { name: "now_showing", keywords: ["phim dang chieu", "now showing"] }
];

let services = null;
let currentUser = null;
let isSending = false;
let history = [];

function normalize(value) {
    return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().trim();
}

function hasAny(text, keywords) {
    return keywords.some(keyword => text.includes(keyword));
}

function detectGenre(text) {
    const normalized = normalize(text);
    return Object.entries(genreAliases).find(([key, aliases]) => normalized.includes(key) || aliases.some(alias => normalized.includes(normalize(alias))))?.[0] || null;
}

function detectIntent(message) {
    const text = normalize(message).replace(/[?!.,]/g, " ");
    const rule = intentRules.find(item => item.test ? item.test(text) : hasAny(text, item.keywords));
    if (rule) return { name: rule.name, text };
    return { name: text.split(/\s+/).length <= 7 ? "movie_search" : "fallback", text };
}

function waitForFirebaseReady(maxRetries = 20, retryDelay = 200) {
    return new Promise((resolve, reject) => {
        let retries = 0;
        const check = () => {
            if (window.db && window.auth) {
                resolve({ db: window.db, auth: window.auth });
                return;
            }
            if (retries >= maxRetries) {
                reject(new Error("Firebase chưa sẵn sàng sau 20 lần thử."));
                return;
            }
            retries += 1;
            window.setTimeout(check, retryDelay);
        };
        check();
    });
}

function injectChatbot() {
    if (document.getElementById("aeroChatbot")) return;
    const chatbotHtml = `<div id="aeroChatbot">
        <button class="aero-chat-toggle aero-chatbot-launcher" type="button" aria-label="Mở AERO AI Assistant" aria-expanded="false" aria-controls="aeroChatbox"><i class="fas fa-comments" aria-hidden="true"></i><span>AERO Bot</span></button>
        <span class="aero-chat-tooltip" role="tooltip">AERO AI Assistant</span>
        <section class="aero-chatbox aero-chatbot-panel" id="aeroChatbox" role="dialog" aria-labelledby="aeroChatTitle" aria-hidden="true">
            <header class="aero-chat-header">
                <div class="aero-chat-brand"><span class="aero-chat-avatar" aria-hidden="true"><b>A</b></span><div><strong id="aeroChatTitle">AERO AI Assistant</strong><small><i></i> Trợ lý rạp phim trực tuyến</small></div></div>
                <button class="aero-chat-close" type="button" aria-label="Đóng chatbot"><i class="fas fa-times" aria-hidden="true"></i></button>
            </header>
            <div class="aero-chat-messages" role="log" aria-live="polite" aria-relevant="additions"></div>
            <form class="aero-chat-form"><input class="aero-chat-input" type="text" maxlength="250" autocomplete="off" placeholder="Hỏi AERO về phim, lịch chiếu..." aria-label="Câu hỏi cho AERO AI Assistant" /><button class="aero-chat-send" type="submit" aria-label="Gửi tin nhắn"><i class="fas fa-paper-plane" aria-hidden="true"></i></button></form>
        </section>
    </div>`;
    document.body.insertAdjacentHTML("beforeend", chatbotHtml);
    const root = document.getElementById("aeroChatbot");
    root.querySelector(".aero-chat-toggle").addEventListener("click", () => setChatOpen(true));
    root.querySelector(".aero-chat-close").addEventListener("click", () => setChatOpen(false));
    root.querySelector(".aero-chat-form").addEventListener("submit", event => {
        event.preventDefault();
        sendMessage(root.querySelector(".aero-chat-input").value);
    });
    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && root.classList.contains("is-open")) setChatOpen(false);
    });
}

function setChatOpen(open) {
    const root = document.getElementById("aeroChatbot");
    if (!root) return;
    const panel = root.querySelector(".aero-chatbot-panel");
    root.classList.toggle("is-open", open);
    panel.classList.toggle("open", open);
    root.querySelector(".aero-chat-toggle").setAttribute("aria-expanded", String(open));
    panel.setAttribute("aria-hidden", String(!open));
    window.setTimeout(() => (open ? root.querySelector(".aero-chat-input") : root.querySelector(".aero-chat-toggle"))?.focus(), 100);
}

function messagesElement() {
    return document.querySelector("#aeroChatbot .aero-chat-messages");
}

function scrollLatest() {
    const element = messagesElement();
    if (element) element.scrollTop = element.scrollHeight;
}

function appendMessage(role, response, save = true) {
    const normalizedResponse = typeof response === "string" ? { text: response } : response;
    const wrapper = document.createElement("div");
    wrapper.className = `aero-message ${role}`;
    if (Array.isArray(normalizedResponse.cards) && normalizedResponse.cards.length) wrapper.classList.add("has-cards");
    if (normalizedResponse.text) {
        const text = document.createElement("div");
        text.className = "aero-message-text";
        text.textContent = normalizedResponse.text;
        wrapper.appendChild(text);
    }
    if (Array.isArray(normalizedResponse.cards)) renderCards(wrapper, normalizedResponse.cards);
    messagesElement()?.appendChild(wrapper);
    if (save) saveHistory(role, normalizedResponse);
    scrollLatest();
    return wrapper;
}

function renderCards(parent, cards) {
    const list = document.createElement("div");
    list.className = "aero-result-list";
    cards.forEach(card => {
        const item = document.createElement("article");
        item.className = "aero-result-card";
        if (card.image) {
            const image = document.createElement("img");
            image.src = card.image;
            image.alt = card.title || "Poster phim";
            image.loading = "lazy";
            image.addEventListener("error", () => image.remove());
            item.appendChild(image);
        }
        const body = document.createElement("div");
        body.className = "aero-result-body";
        const title = document.createElement("strong");
        title.textContent = card.title || "AERO Cinema";
        body.appendChild(title);
        (card.lines || []).filter(Boolean).forEach(value => {
            const line = document.createElement("span");
            line.textContent = value;
            body.appendChild(line);
        });
        if (card.href) {
            const link = document.createElement("a");
            link.className = "aero-result-action";
            link.href = card.href;
            link.textContent = card.action || "Xem chi tiết";
            body.appendChild(link);
        }
        item.appendChild(body);
        list.appendChild(item);
    });
    parent.appendChild(list);
}

function renderQuickActions() {
    const container = document.createElement("div");
    container.className = "aero-quick-actions";
    container.setAttribute("aria-label", "Câu hỏi gợi ý");
    quickActions.forEach(label => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "aero-quick-action";
        button.textContent = label;
        button.addEventListener("click", () => sendMessage(label.replace(/^[^\p{L}\p{N}]+/u, "")));
        container.appendChild(button);
    });
    messagesElement()?.appendChild(container);
}

function showTyping(label) {
    const node = document.createElement("div");
    node.className = "aero-message bot aero-typing";
    const text = document.createElement("span");
    text.textContent = label;
    const dots = document.createElement("span");
    dots.className = "aero-typing-dots";
    dots.setAttribute("aria-hidden", "true");
    dots.innerHTML = "<i></i><i></i><i></i>";
    node.append(text, dots);
    messagesElement()?.appendChild(node);
    scrollLatest();
    return node;
}

function saveHistory(role, response) {
    if (response?.private === true) return;
    history.push({ role, response, createdAt: Date.now() });
    history = history.slice(-HISTORY_LIMIT);
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch (error) { console.warn("[AERO AI] Không thể lưu lịch sử:", error); }
}

function restoreHistory() {
    try {
        const stored = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
        history = Array.isArray(stored) ? stored.slice(-HISTORY_LIMIT) : [];
    } catch (error) {
        history = [];
        console.warn("[AERO AI] Lịch sử chat không hợp lệ:", error);
    }
    if (history.length) history.forEach(item => appendMessage(item.role, item.response, false));
    else appendMessage("bot", "Xin chào! Tôi là AERO AI Assistant. Hôm nay bạn muốn xem phim gì?", true);
    renderQuickActions();
}

function value(data, fields, fallback = "Đang cập nhật") {
    for (const field of fields) if (data?.[field] !== undefined && data[field] !== null && data[field] !== "") return data[field];
    return fallback;
}

function currency(number) {
    const parsed = Number(number);
    return Number.isFinite(parsed) ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(parsed) : "Đang cập nhật";
}

function displayDate(input) {
    if (!input) return "Đang cập nhật";
    const date = input?.toDate ? input.toDate() : new Date(input);
    return Number.isNaN(date.getTime()) ? String(input) : date.toLocaleDateString("vi-VN");
}

function movieCard(movie) {
    return {
        image: movie.posterUrl || movie.poster || "",
        title: value(movie, ["title", "name"]),
        lines: [`🎭 ${value(movie, ["genre"], "Chưa cập nhật thể loại")}`, `⏱ ${value(movie, ["duration"], "-")} phút · ⭐ ${value(movie, ["voteAverage"], "-")}/10`],
        href: `/Movies/Details?id=${encodeURIComponent(movie.id)}`,
        action: "Xem chi tiết"
    };
}

function showtimeCard(showtime) {
    return {
        title: value(showtime, ["movieTitle", "movieName"]),
        lines: [`🕒 ${value(showtime, ["time", "startTime"])}`, `📍 ${value(showtime, ["cinemaName"])} · ${value(showtime, ["roomName"])}`, `💰 ${currency(value(showtime, ["price", "standardPrice"], NaN))}`],
        href: showtime.movieId ? `/Movies/Details?id=${encodeURIComponent(showtime.movieId)}` : "/Showtimes",
        action: "Đặt vé ngay"
    };
}

function fuzzyScore(title, term) {
    const candidate = normalize(title);
    const query = normalize(term);
    if (!query) return 0;
    if (candidate === query) return 100;
    if (candidate.includes(query)) return 80 - Math.abs(candidate.length - query.length);
    const words = query.split(/\s+/).filter(word => word.length > 1);
    return words.reduce((score, word) => score + (candidate.includes(word) ? 10 : 0), 0);
}

function extractBudget(text) {
    const compact = normalize(text).replace(/[.,\s]/g, "");
    const kMatch = compact.match(/(\d+)k/);
    if (kMatch) return Number(kMatch[1]) * 1000;
    const number = compact.match(/\d{4,}/);
    return number ? Number(number[0]) : null;
}

function parseHour(text) {
    if (hasAny(normalize(text), ["toi nay", "buoi toi"])) return 18;
    const match = normalize(text).match(/(?:sau|tu)\s*(\d{1,2})(?:h|\s*gio)?/);
    return match ? Number(match[1]) : null;
}

function timeHour(time) {
    const match = String(time || "").match(/(\d{1,2})[:h]/);
    return match ? Number(match[1]) : -1;
}

async function locationOrNull() {
    if (!navigator.geolocation) return null;
    return new Promise(resolve => navigator.geolocation.getCurrentPosition(
        position => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: false, timeout: 6000, maximumAge: 5 * 60 * 1000 }
    ));
}

function coordinates(cinema) {
    const lat = Number(value(cinema, ["latitude", "lat"], NaN));
    const lng = Number(value(cinema, ["longitude", "lng", "lon"], NaN));
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

function distanceKm(a, b) {
    const rad = degree => degree * Math.PI / 180;
    const dLat = rad(b.lat - a.lat);
    const dLng = rad(b.lng - a.lng);
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

async function answerNowShowing() {
    const movies = await services.getNowShowingMovies();
    return movies.length ? { text: "Phim đang chiếu tại AERO Cinema:", cards: movies.slice(0, 6).map(movieCard) } : EMPTY_TEXT;
}

async function answerMovieSearch(message) {
    const movies = await services.getMovies();
    const matches = movies.map(movie => ({ movie, score: fuzzyScore(value(movie, ["title", "name"], ""), message) })).filter(item => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 5);
    return matches.length ? { text: `Kết quả phim gần nhất với “${message}”:`, cards: matches.map(item => movieCard(item.movie)) } : FALLBACK_TEXT;
}

async function answerShowtimes(message) {
    const [showtimes, movies] = await Promise.all([services.getTodayShowtimes(), services.getMovies()]);
    const minimumHour = parseHour(message);
    const mentionedMovie = movies
        .map(movie => ({
            movie,
            score: fuzzyScore(value(movie, ["title", "name"], ""), message)
        }))
        .sort((a, b) => b.score - a.score)[0];
    let filtered = showtimes;
    if (minimumHour !== null) {
        filtered = filtered.filter(item => timeHour(value(item, ["time", "startTime"], "")) >= minimumHour);
    }
    if (mentionedMovie?.score >= 10) {
        const movieId = mentionedMovie.movie.id;
        const movieTitle = normalize(value(mentionedMovie.movie, ["title"], ""));
        filtered = filtered.filter(item =>
            item.movieId === movieId || normalize(value(item, ["movieTitle"], "")).includes(movieTitle)
        );
    }
    filtered.sort((a, b) => {
        const firstTime = String(value(a, ["time"], ""));
        const secondTime = String(value(b, ["time"], ""));
        return firstTime.localeCompare(secondTime);
    });
    return filtered.length ? { text: minimumHour !== null ? `Các suất chiếu từ ${minimumHour}:00 hôm nay:` : "Lịch chiếu hôm nay:", cards: filtered.slice(0, 8).map(showtimeCard) } : EMPTY_TEXT;
}

async function answerTickets() {
    if (!currentUser) return "Vui lòng đăng nhập để xem vé của bạn.";
    const bookings = await services.getMyTickets(currentUser);
    if (!bookings?.length) return EMPTY_TEXT;
    return {
        text: "Các vé gần đây của bạn:",
        private: true,
        cards: bookings.map(booking => ({
            title: value(booking, ["movieTitle", "movieName"]),
            lines: [`🎫 Ghế: ${Array.isArray(booking.seats) ? booking.seats.join(", ") : value(booking, ["seats"])}`, `🗓 ${displayDate(booking.date)} · ${value(booking, ["time", "showTime"])}`, `Trạng thái: ${value(booking.ticket || booking, ["status"], "Đang xử lý")}`],
            href: "/Account/TicketHistory",
            action: "Xem chi tiết"
        }))
    };
}

async function answerGenre(message, situation = false) {
    let genre = detectGenre(message);
    const text = normalize(message);
    if (situation) {
        if (hasAny(text, ["ban gai", "nguoi yeu", "couple"])) genre = "lang man";
        else if (hasAny(text, ["tre em", "con nho"])) genre = "hoat hinh";
        else genre = "gia dinh";
    }
    const movies = await services.getMovies();
    if (!genre) {
        if (normalize(message).includes("goi y phim")) {
            const recommended = [...movies].filter(movie => ["now_showing", "active"].includes(normalize(movie.status))).sort((a, b) => Number(b.voteAverage || 0) - Number(a.voteAverage || 0)).slice(0, 6);
            return recommended.length ? { text: "Các phim nổi bật AERO gợi ý cho bạn:", cards: recommended.map(movieCard) } : EMPTY_TEXT;
        }
        const genres = [...new Set(movies.flatMap(movie => String(movie.genre || "").split(",")).map(item => item.trim()).filter(Boolean))];
        return genres.length ? `Các thể loại hiện có:\n\n${genres.slice(0, 12).map(item => `• ${item}`).join("\n")}` : EMPTY_TEXT;
    }
    const aliases = genreAliases[genre] || [genre];
    const matches = movies.filter(movie => aliases.some(alias => normalize(movie.genre).includes(normalize(alias)))).slice(0, 6);
    return matches.length ? { text: `AERO gợi ý phim ${aliases[0]} cho bạn:`, cards: matches.map(movieCard) } : EMPTY_TEXT;
}

async function answerBudget(message) {
    const budget = extractBudget(message);
    if (!budget) return "Bạn hãy cho tôi biết ngân sách, ví dụ: “Tôi có 100k”.";
    const showtimes = (await services.getActiveShowtimes()).filter(item => Number(value(item, ["price", "standardPrice"], Infinity)) <= budget).sort((a, b) => Number(value(a, ["price"], 0)) - Number(value(b, ["price"], 0)));
    return showtimes.length ? { text: `Các suất chiếu trong ngân sách ${currency(budget)}:`, cards: showtimes.slice(0, 8).map(showtimeCard) } : "Chưa có suất chiếu phù hợp ngân sách này.";
}

async function answerCinemas() {
    const [cinemas, userLocation] = await Promise.all([services.getCinemas(), locationOrNull()]);
    const ranked = cinemas.map(cinema => {
        const point = coordinates(cinema);
        return { cinema, distance: userLocation && point ? distanceKm(userLocation, point) : null };
    }).sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    return ranked.length ? {
        text: userLocation && ranked.some(item => item.distance !== null) ? "Các rạp gần bạn nhất:" : "Chưa xác định được khoảng cách. Đây là danh sách rạp AERO:",
        cards: ranked.slice(0, 6).map(item => ({ title: value(item.cinema, ["name"]), lines: [`📍 ${value(item.cinema, ["address"])}`, item.distance !== null ? `Cách khoảng ${item.distance.toFixed(1)} km` : value(item.cinema, ["city"], "")] }))
    } : EMPTY_TEXT;
}

async function answerPromotions() {
    const promotions = await services.getPromotions();
    return promotions.length ? {
        text: "Ưu đãi đang áp dụng:",
        cards: promotions.slice(0, 6).map(item => ({ title: value(item, ["couponCode", "title"]), lines: [value(item, ["title", "description"]), `🎁 Giảm ${value(item, ["discount"], 0)}%`, `Hết hạn: ${displayDate(item.endDate)}`] }))
    } : EMPTY_TEXT;
}

async function answerPrices() {
    const showtimes = await services.getActiveShowtimes();
    if (!showtimes.length) return "Giá vé đang được cập nhật theo từng suất chiếu.";
    const prices = showtimes.flatMap(item => [item.price, item.standardPrice]).map(Number).filter(Number.isFinite);
    return prices.length ? `Giá vé hiện tại từ ${currency(Math.min(...prices))} đến ${currency(Math.max(...prices))}. Giá chính xác hiển thị trong từng suất chiếu.` : "Giá vé đang được cập nhật theo từng suất chiếu.";
}

const handlers = {
    now_showing: () => answerNowShowing(),
    movie_search: message => answerMovieSearch(message),
    showtime_search: message => answerShowtimes(message),
    ticket_search: () => answerTickets(),
    genre_search: message => answerGenre(message),
    situation_recommendation: message => answerGenre(message, true),
    budget_search: message => answerBudget(message),
    cinema_search: () => answerCinemas(),
    promotion_search: () => answerPromotions(),
    price_search: () => answerPrices(),
    seat_advice: () => "Hàng E–F thường là vị trí trung tâm, cân bằng tốt giữa góc nhìn và âm thanh. Ghế VIP phù hợp trải nghiệm tốt nhất; ghế đôi là lựa chọn thoải mái cho các cặp đôi.",
    fallback: () => FALLBACK_TEXT
};

function typingLabel(intent) {
    const labels = { movie_search: "Đang tìm phim...", now_showing: "Đang tìm phim...", genre_search: "Đang chọn phim phù hợp...", situation_recommendation: "Đang chọn phim phù hợp...", showtime_search: "Đang tải lịch chiếu...", ticket_search: "Đang tải vé của bạn...", cinema_search: "Đang tìm rạp gần bạn...", promotion_search: "Đang tải khuyến mãi..." };
    return labels[intent] || "AERO AI đang trả lời...";
}

async function createResponse(message, detectedIntent = null) {
    const intent = detectedIntent || detectIntent(message);
    const localResponse = await handlers[intent.name](message, intent);
    if (localResponse !== FALLBACK_TEXT || !AIProvider.useGemini) return localResponse;
    return await AIProvider.generateResponse(message, { intent, history: history.slice(-6) }) || FALLBACK_TEXT;
}

async function sendMessage(rawMessage) {
    const message = String(rawMessage || "").trim();
    if (!message || isSending) return;
    isSending = true;
    const input = document.querySelector("#aeroChatbot .aero-chat-input");
    const button = document.querySelector("#aeroChatbot .aero-chat-send");
    if (input) input.value = "";
    if (button) button.disabled = true;
    const intent = detectIntent(message);
    appendMessage("user", message, intent.name !== "ticket_search");
    const typing = showTyping(typingLabel(intent.name));
    try {
        const [response] = await Promise.all([createResponse(message, intent), new Promise(resolve => window.setTimeout(resolve, 420))]);
        typing.remove();
        appendMessage("bot", response);
    } catch (error) {
        console.error("[AERO AI] Không thể xử lý câu hỏi:", error);
        typing.remove();
        appendMessage("bot", ERROR_TEXT);
    } finally {
        isSending = false;
        if (button) button.disabled = false;
        input?.focus();
    }
}

async function initAeroChatbot() {
    injectChatbot();
    restoreHistory();
    try {
        const firebase = await waitForFirebaseReady();
        console.log("window.db", window.db);
        console.log("window.auth", window.auth);
        services = new ChatbotServices(firebase.db, firebase.auth);
        currentUser = firebase.auth.currentUser;
        onAuthStateChanged(firebase.auth, user => { currentUser = user; });
    } catch (error) {
        console.error("[AERO AI] Khởi tạo dịch vụ thất bại:", error);
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAeroChatbot, { once: true });
} else {
    initAeroChatbot();
}
