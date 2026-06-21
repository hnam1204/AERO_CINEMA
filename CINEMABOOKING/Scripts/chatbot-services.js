import {
    collection,
    getDocs,
    limit,
    orderBy,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
    ChatbotCache,
    cinemasCache,
    moviesCache,
    promotionsCache,
    showtimesCache
} from "./chatbot-cache.js";

const ticketsCache = new ChatbotCache();

function docs(snapshot) {
    return snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
}

async function remember(cache, key, loader) {
    const cached = cache.get(key);
    if (cached !== null) return cached;
    return cache.set(key, await loader());
}

function dateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export class ChatbotServices {
    constructor(db, auth) {
        if (!db || !auth) throw new Error("Firebase chưa sẵn sàng.");
        this.db = db;
        this.auth = auth;
    }

    getMovies() {
        return remember(moviesCache, "all", async () => docs(await getDocs(query(collection(this.db, "movies"), limit(100)))));
    }

    getNowShowingMovies() {
        return remember(moviesCache, "now_showing", async () => docs(await getDocs(query(
            collection(this.db, "movies"),
            where("status", "==", "now_showing"),
            limit(12)
        ))));
    }

    getActiveShowtimes() {
        return remember(showtimesCache, "active", async () => docs(await getDocs(query(
            collection(this.db, "showtimes"),
            where("status", "==", "active"),
            limit(100)
        ))));
    }

    async getTodayShowtimes() {
        const today = dateKey();
        return remember(showtimesCache, `today:${today}`, async () => docs(await getDocs(query(
            collection(this.db, "showtimes"),
            where("date", "==", today),
            where("status", "==", "active"),
            limit(40)
        ))));
    }

    getPromotions() {
        return remember(promotionsCache, "active", async () => docs(await getDocs(query(
            collection(this.db, "promotions"),
            where("active", "==", true),
            limit(10)
        ))));
    }

    getCinemas() {
        return remember(cinemasCache, "active", async () => docs(await getDocs(query(
            collection(this.db, "cinemas"),
            where("status", "==", "active"),
            limit(20)
        ))));
    }

    async getMyTickets(user) {
        if (!user) return null;
        return remember(ticketsCache, user.uid, async () => {
            let bookingSnapshot;
            try {
                bookingSnapshot = await getDocs(query(
                    collection(this.db, "bookings"),
                    where("userId", "==", user.uid),
                    orderBy("createdAt", "desc"),
                    limit(10)
                ));
            } catch (error) {
                console.warn("[AERO AI] Booking query fallback:", error);
                bookingSnapshot = await getDocs(query(collection(this.db, "bookings"), where("userId", "==", user.uid), limit(10)));
            }

            const ticketSnapshot = await getDocs(query(collection(this.db, "tickets"), where("userId", "==", user.uid), limit(20)));
            const ticketsByBooking = new Map(docs(ticketSnapshot).map(ticket => [ticket.bookingId, ticket]));
            return docs(bookingSnapshot).map(booking => ({
                ...booking,
                ticket: ticketsByBooking.get(booking.id) || null
            })).slice(0, 5);
        });
    }
}

export { dateKey };
