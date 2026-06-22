import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { AIProvider } from "./AIProvider.js";
import { ChatbotServices } from "./chatbot-services.js";

console.log("AERO Chatbot loaded");
console.log("window.db", window.db);
console.log("window.auth", window.auth);

const EMPTY_TEXT = "Hiện chưa có dữ liệu phù hợp.";
const ERROR_TEXT = "Xin lỗi, hiện chưa thể tải dữ liệu. Vui lòng thử lại sau.";
const FALLBACK_TEXT = "Tôi có thể hỗ trợ:\n\n• Phim đang chiếu\n• Lịch chiếu\n• Vé của tôi\n• Giá vé\n• Khuyến mãi\n• Gợi ý phim";
const quickActions = [
    { label: "🎬 Phim hot", prompt: "Phim đang chiếu" },
    { label: "🍿 Suất chiếu hôm nay", prompt: "Lịch chiếu hôm nay" },
    { label: "🎟 Đặt vé", prompt: "Lịch chiếu hôm nay" },
    { label: "⭐ Khuyến mãi", prompt: "Khuyến mãi" },
    { label: "🏢 Rạp", prompt: "Rạp phim" },
    { label: "📞 Hỗ trợ", prompt: "Bạn có thể hỗ trợ gì?" }
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
        <button id="aeroChatbotLauncher" class="aero-chat-toggle aero-chatbot-launcher" type="button" aria-label="Mở AERO AI" aria-expanded="false" aria-controls="aeroChatbox">
            <span class="aero-chatbot-launcher-icon"><i class="fas fa-robot" aria-hidden="true"></i></span>
            <span class="aero-chatbot-launcher-text">Hỗ trợ</span>
            <span class="aero-chatbot-online-badge" aria-hidden="true"></span>
        </button>
        <section class="aero-chatbox aero-chatbot-panel" id="aeroChatbox" role="dialog" aria-labelledby="aeroChatTitle" aria-hidden="true">
            <header class="aero-chat-header">
                <div class="aero-chat-brand"><span class="aero-chat-avatar" aria-hidden="true"><i class="fas fa-robot"></i></span><div><strong id="aeroChatTitle">AERO AI Assistant</strong><small><i></i> Online · Trợ lý đặt vé thông minh</small></div></div>
                <div class="aero-chat-window-actions">
                    <button class="aero-chat-minimize" type="button" aria-label="Thu nhỏ chatbot"><i class="fas fa-minus" aria-hidden="true"></i></button>
                    <button class="aero-chat-close" type="button" aria-label="Đóng chatbot"><i class="fas fa-times" aria-hidden="true"></i></button>
                </div>
            </header>
            <div class="aero-chat-messages" role="log" aria-live="polite" aria-relevant="additions"></div>
            <form class="aero-chat-form">
                <div class="aero-chat-composer">
                    <textarea class="aero-chat-input" rows="1" maxlength="500" placeholder="Hỏi AERO về phim, lịch chiếu..." aria-label="Câu hỏi cho AERO AI Assistant"></textarea>
                    <div class="aero-chat-tools">
                        <button class="aero-chat-tool aero-chat-voice" type="button" aria-label="Nhập bằng giọng nói"><i class="fas fa-microphone"></i></button>
                        <button class="aero-chat-tool aero-chat-emoji" type="button" aria-label="Thêm biểu tượng cảm xúc"><i class="far fa-smile"></i></button>
                        <button class="aero-chat-tool aero-chat-attachment" type="button" aria-label="Đính kèm tệp"><i class="fas fa-paperclip"></i></button>
                        <input class="aero-chat-file" type="file" hidden />
                        <span class="aero-chat-enter-hint">Enter để gửi</span>
                        <button class="aero-chat-send" type="submit" aria-label="Gửi tin nhắn"><i class="fas fa-paper-plane" aria-hidden="true"></i></button>
                    </div>
                </div>
            </form>
        </section>
    </div>`;
    document.body.insertAdjacentHTML("beforeend", chatbotHtml);
    const root = document.getElementById("aeroChatbot");
    root.querySelector(".aero-chatbot-launcher").addEventListener("click", () => setChatOpen(true));
    root.querySelector(".aero-chat-minimize").addEventListener("click", () => setChatOpen(false));
    root.querySelector(".aero-chat-close").addEventListener("click", () => setChatOpen(false));
    root.querySelector(".aero-chat-form").addEventListener("submit", event => {
        event.preventDefault();
        sendMessage(root.querySelector(".aero-chat-input").value);
    });
    const input = root.querySelector(".aero-chat-input");
    input.addEventListener("keydown", event => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            root.querySelector(".aero-chat-form").requestSubmit();
        }
    });
    input.addEventListener("input", () => resizeComposer(input));
    root.querySelector(".aero-chat-emoji").addEventListener("click", () => insertAtCursor(input, "😊"));
    root.querySelector(".aero-chat-attachment").addEventListener("click", () => root.querySelector(".aero-chat-file").click());
    root.querySelector(".aero-chat-file").addEventListener("change", event => {
        const file = event.target.files?.[0];
        if (file) appendMessage("bot", `Đã nhận tệp “${file.name}”. Tính năng phân tích tệp sẽ sớm được cập nhật.`);
        event.target.value = "";
    });
    root.querySelector(".aero-chat-voice").addEventListener("click", () => startVoiceInput(input));
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

function resizeComposer(input) {
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 96)}px`;
}

function insertAtCursor(input, text) {
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    input.value = input.value.slice(0, start) + text + input.value.slice(end);
    input.selectionStart = input.selectionEnd = start + text.length;
    input.dispatchEvent(new Event("input"));
    input.focus();
}

function startVoiceInput(input) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        appendMessage("bot", "Trình duyệt này chưa hỗ trợ nhập bằng giọng nói.");
        return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "vi-VN";
    recognition.interimResults = false;
    recognition.addEventListener("result", event => insertAtCursor(input, event.results[0][0].transcript));
    recognition.addEventListener("error", () => appendMessage("bot", "Tôi chưa nghe rõ. Bạn vui lòng thử lại nhé."));
    recognition.start();
}

function appendMessage(role, response) {
    const normalizedResponse = typeof response === "string" ? { text: response } : response;
    const row = document.createElement("div");
    row.className = `aero-message-row ${role}`;
    if (role === "bot") {
        const avatar = document.createElement("span");
        avatar.className = "aero-message-avatar";
        avatar.innerHTML = '<i class="fas fa-robot" aria-hidden="true"></i>';
        row.appendChild(avatar);
    }
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
    row.appendChild(wrapper);
    messagesElement()?.appendChild(row);
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
            const actions = document.createElement("div");
            actions.className = "aero-result-actions";
            const detailLink = document.createElement("a");
            detailLink.className = "aero-result-action secondary";
            detailLink.href = card.href;
            detailLink.textContent = card.action || "Xem chi tiết";
            actions.appendChild(detailLink);
            if (card.secondaryHref) {
                const primaryLink = document.createElement("a");
                primaryLink.className = "aero-result-action primary";
                primaryLink.href = card.secondaryHref;
                primaryLink.textContent = card.secondaryAction || "Đặt vé ngay";
                actions.appendChild(primaryLink);
            }
            body.appendChild(actions);
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
    quickActions.forEach(action => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "aero-quick-action";
        button.textContent = action.label;
        button.addEventListener("click", () => sendMessage(action.prompt));
        container.appendChild(button);
    });
    messagesElement()?.appendChild(container);
}

function showTyping(label) {
    const node = document.createElement("div");
    node.className = "aero-message-row bot aero-typing-row";
    const avatar = document.createElement("span");
    avatar.className = "aero-message-avatar";
    avatar.innerHTML = '<i class="fas fa-robot" aria-hidden="true"></i>';
    const bubble = document.createElement("div");
    bubble.className = "aero-message bot aero-typing";
    const text = document.createElement("span");
    text.textContent = label;
    const dots = document.createElement("span");
    dots.className = "aero-typing-dots";
    dots.setAttribute("aria-hidden", "true");
    dots.innerHTML = "<i></i><i></i><i></i>";
    bubble.append(text, dots);
    node.append(avatar, bubble);
    messagesElement()?.appendChild(node);
    scrollLatest();
    return node;
}

function clearChatHistoryOnPageLoad() {
    localStorage.removeItem("aeroChatHistory");
    localStorage.removeItem("aero_chat_history");
    localStorage.removeItem("aeroChatbotMessages");
    localStorage.removeItem("aeroChatMessages");
    sessionStorage.removeItem("aeroChatHistory");
}

function renderWelcomeMessage() {
    const messages = messagesElement();
    if (!messages) return;
    messages.replaceChildren();
    const welcome = document.createElement("section");
    welcome.className = "aero-welcome";
    welcome.innerHTML = `
        <div class="aero-welcome-avatar"><i class="fas fa-robot" aria-hidden="true"></i></div>
        <h2>Xin chào <span>👋</span></h2>
        <p>Tôi là <strong>AERO AI Assistant</strong>.<br />Tôi có thể giúp bạn:</p>
        <div class="aero-welcome-capabilities">
            <span>🎬 Xem phim đang chiếu</span><span>🍿 Tra cứu suất chiếu</span>
            <span>🎟 Đặt vé nhanh</span><span>🏢 Thông tin rạp</span>
            <span>💳 Thanh toán</span><span>⭐ Khuyến mãi</span>
        </div>`;
    messages.appendChild(welcome);
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
    const detailsUrl = `/Movies/Details?id=${encodeURIComponent(movie.id)}`;
    return {
        image: movie.posterUrl || movie.imageUrl || movie.bannerUrl || movie.poster || "https://placehold.co/160x240/0f172a/ffffff?text=AERO",
        title: value(movie, ["title", "name"]),
        lines: [`⭐ ${value(movie, ["voteAverage"], "-")}/10`, `⏱ ${value(movie, ["duration"], "-")} phút`, `🏷 ${value(movie, ["genre"], "Đang cập nhật")}`, `🔞 ${value(movie, ["rating"], "P")}`],
        href: detailsUrl,
        action: "Xem chi tiết",
        secondaryHref: `${detailsUrl}#booking-section`,
        secondaryAction: "Đặt vé ngay"
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
    return await AIProvider.generateResponse(message, { intent, history: [] }) || FALLBACK_TEXT;
}

async function sendMessage(rawMessage) {
    const message = String(rawMessage || "").trim();
    if (!message || isSending) return;
    isSending = true;
    const input = document.querySelector("#aeroChatbot .aero-chat-input");
    const button = document.querySelector("#aeroChatbot .aero-chat-send");
    if (input) input.value = "";
    if (input) resizeComposer(input);
    if (button) button.disabled = true;
    const intent = detectIntent(message);
    appendMessage("user", message);
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
    clearChatHistoryOnPageLoad();
    injectChatbot();
    renderWelcomeMessage();
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
