export const CHATBOT_CACHE_TTL = 5 * 60 * 1000;

export class ChatbotCache {
    constructor(ttl = CHATBOT_CACHE_TTL) {
        this.ttl = ttl;
        this.entries = new Map();
    }

    get(key = "default") {
        const entry = this.entries.get(key);
        if (!entry || Date.now() - entry.timestamp >= this.ttl) {
            this.entries.delete(key);
            return null;
        }
        return entry.data;
    }

    set(key = "default", data) {
        this.entries.set(key, { data, timestamp: Date.now() });
        return data;
    }

    clear() {
        this.entries.clear();
    }
}

export const moviesCache = new ChatbotCache();
export const showtimesCache = new ChatbotCache();
export const promotionsCache = new ChatbotCache();
export const cinemasCache = new ChatbotCache();
