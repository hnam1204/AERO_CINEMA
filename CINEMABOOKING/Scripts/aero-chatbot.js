import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { AIProvider } from "./AIProvider.js";
import { ChatbotServices } from "./chatbot-services.js";

console.log("AERO Chatbot loaded");
console.log("window.db", window.db);
console.log("window.auth", window.auth);

function getLang() {
    return window.getCurrentLang ? window.getCurrentLang() : (localStorage.getItem("aero_lang") || localStorage.getItem("language") || "vi");
}

function tr(key) {
    return window.t ? window.t(key) : key;
}

function isEn() {
    return getLang() === "en";
}

function emptyText() {
    return tr("chatbot_empty");
}

function errorText() {
    return tr("chatbot_error");
}

function fallbackText() {
    return isEn()
        ? "I can help with:\n\n• Now Showing\n• Showtimes\n• My Tickets\n• Ticket Prices\n• Promotions\n• Movie Recommendations"
        : "Tôi có thể hỗ trợ:\n\n• Phim đang chiếu\n• Lịch chiếu\n• Vé của tôi\n• Giá vé\n• Khuyến mãi\n• Gợi ý phim";
}

const quickActions = [
    { key: "chatbot_now_showing", icon: "🎬", labelVi: "Phim đang chiếu", labelEn: "Now showing", promptVi: "Phim đang chiếu", promptEn: "Now showing" },
    { key: "chatbot_today_showtimes", icon: "🍿", labelVi: "Lịch chiếu hôm nay", labelEn: "Today's showtimes", promptVi: "Lịch chiếu hôm nay", promptEn: "Today's showtimes" },
    { key: "booking", icon: "🎟", labelVi: "Đặt vé", labelEn: "Book tickets", promptVi: "Đặt vé", promptEn: "Book tickets" },
    { key: "chatbot_promotions", icon: "⭐", labelVi: "Khuyến mãi", labelEn: "Promotions", promptVi: "Khuyến mãi", promptEn: "Promotions" },
    { key: "chatbot_cinemas", icon: "🏢", labelVi: "Rạp phim", labelEn: "Cinemas", promptVi: "Rạp phim", promptEn: "Cinemas" },
    { key: "support", icon: "📞", labelVi: "Hỗ trợ", labelEn: "Support", promptVi: "Hỗ trợ", promptEn: "What can you help with?" }
];

const noShowtimeSuggestions = [
    { labelVi: "Xem phim đang chiếu", labelEn: "Now showing", promptVi: "Phim đang chiếu", promptEn: "Now showing" },
    { labelVi: "Chọn rạp", labelEn: "Choose cinema", promptVi: "Rạp phim", promptEn: "Cinemas" },
    { labelVi: "Xem ngày khác", labelEn: "Choose another date", promptVi: "Lịch chiếu ngày khác", promptEn: "Showtimes another day" }
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
    { name: "showtime_search", keywords: ["lich chieu", "suat chieu", "chieu luc", "may gio", "toi nay", "sau 19", "dat ve", "booking", "book tickets", "showtime", "today"] },
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
        <button id="aeroChatbotLauncher" class="aero-chat-toggle aero-chatbot-launcher" type="button" aria-label="AERO AI" aria-expanded="false" aria-controls="aeroChatbox">
            <span class="aero-chatbot-launcher-icon"><i class="fas fa-robot" aria-hidden="true"></i></span>
            <span class="aero-chatbot-launcher-text" data-i18n="chatbot_support">Hỗ trợ</span>
            <span class="aero-chatbot-online-badge" aria-hidden="true"></span>
        </button>
        <section class="aero-chatbox aero-chatbot-panel" id="aeroChatbox" role="dialog" aria-labelledby="aeroChatTitle" aria-hidden="true">
            <header class="aero-chat-header">
                <div class="aero-chat-brand"><span class="aero-chat-avatar" aria-hidden="true"><i class="fas fa-robot"></i></span><div><strong id="aeroChatTitle">AERO AI Assistant</strong><small data-i18n="chatbot_subtitle"><i></i> Online · Trợ lý đặt vé thông minh</small></div></div>
                <div class="aero-chat-window-actions">
                    <button class="aero-chat-minimize" type="button" aria-label="Minimize chatbot"><i class="fas fa-minus" aria-hidden="true"></i></button>
                    <button class="aero-chat-close" type="button" aria-label="Close chatbot"><i class="fas fa-times" aria-hidden="true"></i></button>
                </div>
            </header>
            <div class="aero-chat-messages" role="log" aria-live="polite" aria-relevant="additions"></div>
            <form class="aero-chat-form">
                <div class="aero-chat-composer">
                    <textarea class="aero-chat-input" rows="1" maxlength="500" data-i18n-placeholder="chatbot_placeholder" placeholder="Hỏi AERO về phim, lịch chiếu, ưu đãi..." aria-label="AERO AI Assistant question"></textarea>
                    <div class="aero-chat-tools">
                        <button class="aero-chat-tool aero-chat-voice" type="button" aria-label="Voice input"><i class="fas fa-microphone"></i></button>
                        <button class="aero-chat-tool aero-chat-emoji" type="button" aria-label="Add emoji"><i class="far fa-smile"></i></button>
                        <button class="aero-chat-tool aero-chat-attachment" type="button" aria-label="Attach file"><i class="fas fa-paperclip"></i></button>
                        <input class="aero-chat-file" type="file" hidden />
                        <span class="aero-chat-enter-hint">Enter</span>
                        <button class="aero-chat-send" type="submit" aria-label="Send message"><i class="fas fa-paper-plane" aria-hidden="true"></i></button>
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
        if (file) appendMessage("bot", isEn() ? `Received "${file.name}". File analysis will be updated soon.` : `Đã nhận tệp “${file.name}”. Tính năng phân tích tệp sẽ sớm được cập nhật.`);
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
    input.style.height = `${Math.min(input.scrollHeight, 82)}px`;
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
        appendMessage("bot", isEn() ? "This browser does not support voice input yet." : "Trình duyệt này chưa hỗ trợ nhập bằng giọng nói.");
        return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = isEn() ? "en-US" : "vi-VN";
    recognition.interimResults = false;
    recognition.addEventListener("result", event => insertAtCursor(input, event.results[0][0].transcript));
    recognition.addEventListener("error", () => appendMessage("bot", isEn() ? "I could not hear that clearly. Please try again." : "Tôi chưa nghe rõ. Bạn vui lòng thử lại nhé."));
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
    if (Array.isArray(normalizedResponse.suggestions) && normalizedResponse.suggestions.length) renderSuggestionActions(wrapper, normalizedResponse.suggestions);
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
        if (card.kind) item.classList.add(`aero-${card.kind}-card`);
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
        if (card.badge) {
            const badge = document.createElement("span");
            badge.className = "aero-result-badge";
            badge.textContent = card.badge;
            body.appendChild(badge);
        }
        const title = document.createElement("strong");
        title.textContent = card.title || "AERO Cinema";
        body.appendChild(title);
        (card.lines || []).filter(Boolean).forEach(value => {
            const line = document.createElement("span");
            line.textContent = value;
            body.appendChild(line);
        });
        const extraActions = Array.isArray(card.actions) ? card.actions : [];
        if (card.href || extraActions.length) {
            const actions = document.createElement("div");
            actions.className = "aero-result-actions";
            if (card.href) {
                const detailLink = document.createElement("a");
                detailLink.className = "aero-result-action secondary";
                detailLink.href = card.href;
                detailLink.textContent = card.action || tr("detail");
                actions.appendChild(detailLink);
            }
            if (card.secondaryHref) {
                const primaryLink = document.createElement("a");
                primaryLink.className = "aero-result-action primary";
                primaryLink.href = card.secondaryHref;
                primaryLink.textContent = card.secondaryAction || tr("movie_book_now");
                actions.appendChild(primaryLink);
            }
            extraActions.forEach(action => {
                const link = document.createElement("a");
                link.className = `aero-result-action ${action.style || "secondary"}`;
                link.href = action.href || "#";
                link.textContent = action.label || action.labelVi || tr("detail");
                if (!action.href) link.addEventListener("click", event => event.preventDefault());
                actions.appendChild(link);
            });
            body.appendChild(actions);
        }
        item.appendChild(body);
        list.appendChild(item);
    });
    parent.appendChild(list);
}

function renderSuggestionActions(parent, actions) {
    const container = document.createElement("div");
    container.className = "aero-quick-actions aero-inline-suggestions";
    actions.forEach(action => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "aero-quick-action";
        button.textContent = isEn() ? action.labelEn || action.labelVi : action.labelVi || action.labelEn;
        button.addEventListener("click", () => sendMessage(isEn() ? action.promptEn || action.labelEn : action.promptVi || action.labelVi));
        container.appendChild(button);
    });
    parent.appendChild(container);
}

function renderQuickActions() {
    const container = document.createElement("div");
    container.className = "aero-quick-actions";
    container.setAttribute("aria-label", isEn() ? "Suggested questions" : "Câu hỏi gợi ý");
    quickActions.forEach(action => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "aero-quick-action";
        button.textContent = `${action.icon} ${isEn() ? action.labelEn : action.labelVi}`;
        button.addEventListener("click", () => sendMessage(isEn() ? action.promptEn : action.promptVi));
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
        <h2>${tr("chatbot_welcome_title")} <span>👋</span></h2>
        <p>${tr("chatbot_welcome_text")}</p>`;
    messages.appendChild(welcome);
    renderQuickActions();
}

function value(data, fields, fallback = tr("updating")) {
    for (const field of fields) if (data?.[field] !== undefined && data[field] !== null && data[field] !== "") return data[field];
    return fallback;
}

function currency(number) {
    const parsed = Number(number);
    return Number.isFinite(parsed) ? new Intl.NumberFormat(isEn() ? "en-US" : "vi-VN", { style: "currency", currency: "VND" }).format(parsed) : tr("updating");
}

function displayDate(input) {
    if (!input) return tr("updating");
    const date = input?.toDate ? input.toDate() : new Date(input);
    return Number.isNaN(date.getTime()) ? String(input) : date.toLocaleDateString("vi-VN");
}

function movieCard(movie) {
    const detailsUrl = `/Movies/Details?id=${encodeURIComponent(movie.id)}`;
    return {
        image: movie.posterUrl || movie.imageUrl || movie.bannerUrl || movie.poster || "https://placehold.co/160x240/0f172a/ffffff?text=AERO",
        title: value(movie, ["title", "name"]),
        lines: [`⭐ ${value(movie, ["voteAverage"], "-")}/10`, `⏱ ${value(movie, ["duration"], "-")} ${isEn() ? "mins" : "phút"}`, `🏷 ${window.translateDynamic ? window.translateDynamic(value(movie, ["genre"], tr("updating")), "genre") : value(movie, ["genre"], tr("updating"))}`, `🔞 ${value(movie, ["rating"], "P")}`],
        href: detailsUrl,
        action: tr("detail"),
        secondaryHref: `${detailsUrl}#booking-section`,
        secondaryAction: tr("movie_book_now")
    };
}

function showtimeCard(showtime) {
    return {
        title: value(showtime, ["movieTitle", "movieName"]),
        lines: [`🕒 ${value(showtime, ["time", "startTime"])}`, `📍 ${value(showtime, ["cinemaName"])} · ${value(showtime, ["roomName"])}`, `💰 ${currency(value(showtime, ["price", "standardPrice"], NaN))}`],
        href: showtime.movieId ? `/Movies/Details?id=${encodeURIComponent(showtime.movieId)}` : "/Showtimes",
        action: tr("movie_book_now")
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
    return movies.length ? { text: isEn() ? "Now showing at AERO Cinema:" : "Phim đang chiếu tại AERO Cinema:", cards: movies.slice(0, 6).map(movieCard) } : emptyText();
}

async function answerMovieSearch(message) {
    const movies = await services.getMovies();
    const matches = movies.map(movie => ({ movie, score: fuzzyScore(value(movie, ["title", "name"], ""), message) })).filter(item => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 5);
    return matches.length ? { text: isEn() ? `Closest movie results for "${message}":` : `Kết quả phim gần nhất với “${message}”:`, cards: matches.map(item => movieCard(item.movie)) } : fallbackText();
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
    return filtered.length ? { text: minimumHour !== null ? (isEn() ? `Showtimes from ${minimumHour}:00 today:` : `Các suất chiếu từ ${minimumHour}:00 hôm nay:`) : tr("chatbot_today_showtimes") + ":", cards: filtered.slice(0, 8).map(showtimeCard) } : {
        text: isEn()
            ? "I could not find matching showtimes for today. Would you like to see now showing movies or choose a cinema near you?"
            : "Hiện chưa tìm thấy lịch chiếu phù hợp cho hôm nay. Bạn có muốn xem phim đang chiếu hoặc chọn rạp gần bạn không?",
        suggestions: noShowtimeSuggestions
    };
}

async function answerTickets() {
    if (!currentUser) return isEn() ? "Please log in to view your tickets." : "Vui lòng đăng nhập để xem vé của bạn.";
    const bookings = await services.getMyTickets(currentUser);
    if (!bookings?.length) return emptyText();
    return {
        text: isEn() ? "Your recent tickets:" : "Các vé gần đây của bạn:",
        private: true,
        cards: bookings.map(booking => ({
            title: value(booking, ["movieTitle", "movieName"]),
            lines: [`🎫 ${tr("history_seats")}: ${Array.isArray(booking.seats) ? booking.seats.join(", ") : value(booking, ["seats"])}`, `🗓 ${displayDate(booking.date)} · ${value(booking, ["time", "showTime"])}`, `${tr("history_status")}: ${value(booking.ticket || booking, ["status"], isEn() ? "Processing" : "Đang xử lý")}`],
            href: "/Account/TicketHistory",
            action: tr("detail")
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
            return recommended.length ? { text: isEn() ? "Featured movies AERO recommends:" : "Các phim nổi bật AERO gợi ý cho bạn:", cards: recommended.map(movieCard) } : emptyText();
        }
        const genres = [...new Set(movies.flatMap(movie => String(movie.genre || "").split(",")).map(item => item.trim()).filter(Boolean))];
        return genres.length ? `${isEn() ? "Available genres" : "Các thể loại hiện có"}:\n\n${genres.slice(0, 12).map(item => `• ${window.translateDynamic ? window.translateDynamic(item, "genre") : item}`).join("\n")}` : emptyText();
    }
    const aliases = genreAliases[genre] || [genre];
    const matches = movies.filter(movie => aliases.some(alias => normalize(movie.genre).includes(normalize(alias)))).slice(0, 6);
    return matches.length ? { text: isEn() ? `AERO recommends ${aliases[0]} movies for you:` : `AERO gợi ý phim ${aliases[0]} cho bạn:`, cards: matches.map(movieCard) } : emptyText();
}

async function answerBudget(message) {
    const budget = extractBudget(message);
    if (!budget) return isEn() ? "Please tell me your budget, for example: \"I have 100k\"." : "Bạn hãy cho tôi biết ngân sách, ví dụ: “Tôi có 100k”.";
    const showtimes = (await services.getActiveShowtimes()).filter(item => Number(value(item, ["price", "standardPrice"], Infinity)) <= budget).sort((a, b) => Number(value(a, ["price"], 0)) - Number(value(b, ["price"], 0)));
    return showtimes.length ? { text: isEn() ? `Showtimes within ${currency(budget)}:` : `Các suất chiếu trong ngân sách ${currency(budget)}:`, cards: showtimes.slice(0, 8).map(showtimeCard) } : (isEn() ? "No showtimes match this budget yet." : "Chưa có suất chiếu phù hợp ngân sách này.");
}

async function answerCinemas() {
    const [cinemas, userLocation] = await Promise.all([services.getCinemas(), locationOrNull()]);
    const ranked = cinemas.map(cinema => {
        const point = coordinates(cinema);
        return { cinema, distance: userLocation && point ? distanceKm(userLocation, point) : null };
    }).sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    return ranked.length ? {
        text: userLocation && ranked.some(item => item.distance !== null) ? (isEn() ? "Nearest cinemas:" : "Các rạp gần bạn nhất:") : (isEn() ? "Distance could not be detected. Here is the AERO cinema list:" : "Chưa xác định được khoảng cách. Đây là danh sách rạp AERO:"),
        cards: ranked.slice(0, 6).map(item => ({ title: value(item.cinema, ["name"]), lines: [`📍 ${value(item.cinema, ["address"])}`, item.distance !== null ? `Cách khoảng ${item.distance.toFixed(1)} km` : value(item.cinema, ["city"], "")] }))
    } : emptyText();
}

async function answerPromotions() {
    const promotions = await services.getPromotions();
    return promotions.length ? {
        text: isEn() ? "Current AERO offers:" : "Ưu đãi AERO đang áp dụng:",
        cards: promotions.slice(0, 6).map(item => {
            const code = value(item, ["couponCode", "code"], "AERO");
            const title = value(item, ["title", "name"], "Ưu đãi AERO Cinema");
            const discount = value(item, ["discount", "discountPercent"], 0);
            return {
                kind: "promotion",
                badge: isEn() ? "Offer" : "Ưu đãi",
                title,
                lines: [
                    `${isEn() ? "Code" : "Mã"}: ${code}`,
                    `${isEn() ? "Discount" : "Giảm giá"}: ${discount}%`,
                    `${isEn() ? "Valid until" : "Hạn dùng"}: ${displayDate(item.endDate || item.expiryDate)}`
                ],
                actions: [{ label: isEn() ? "Use this code" : "Dùng mã này", href: "/Promotions", style: "primary" }]
            };
        })
    } : emptyText();
}

async function answerPrices() {
    const showtimes = await services.getActiveShowtimes();
    if (!showtimes.length) return isEn() ? "Ticket prices are being updated by showtime." : "Giá vé đang được cập nhật theo từng suất chiếu.";
    const prices = showtimes.flatMap(item => [item.price, item.standardPrice]).map(Number).filter(Number.isFinite);
    return prices.length ? (isEn() ? `Current ticket prices range from ${currency(Math.min(...prices))} to ${currency(Math.max(...prices))}. Exact prices are shown for each showtime.` : `Giá vé hiện tại từ ${currency(Math.min(...prices))} đến ${currency(Math.max(...prices))}. Giá chính xác hiển thị trong từng suất chiếu.`) : (isEn() ? "Ticket prices are being updated by showtime." : "Giá vé đang được cập nhật theo từng suất chiếu.");
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
    seat_advice: () => isEn()
        ? "Rows E-F are usually central, balancing viewing angle and sound well. VIP seats are best for a premium experience; couple seats are a comfortable option for pairs."
        : "Hàng E–F thường là vị trí trung tâm, cân bằng tốt giữa góc nhìn và âm thanh. Ghế VIP phù hợp trải nghiệm tốt nhất; ghế đôi là lựa chọn thoải mái cho các cặp đôi.",
    fallback: () => fallbackText()
};

function typingLabel(intent) {
    return isEn() ? "AERO is finding data..." : "AERO đang tìm dữ liệu...";
}

async function createResponse(message, detectedIntent = null) {
    const intent = detectedIntent || detectIntent(message);
    const localResponse = await handlers[intent.name](message, intent);
    if (localResponse !== fallbackText() || !AIProvider.useGemini) return localResponse;
    return await AIProvider.generateResponse(message, { intent, history: [], lang: getLang() }) || fallbackText();
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
        appendMessage("bot", errorText());
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
    document.addEventListener("aero:languageChanged", () => {
        if (window.applyLanguage) window.applyLanguage(getLang());
        renderWelcomeMessage();
    });
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
