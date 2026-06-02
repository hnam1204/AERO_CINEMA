import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const app = getApps().length ? getApp() : initializeApp(window.firebaseConfig);

window.firebaseApp = app;
window.db = getFirestore(app);
window.auth = getAuth(app);
window.storage = getStorage(app);

const AERO_CACHE = window.AERO_CACHE || {
    ttl: 5 * 60 * 1000,
    movies: null,
    cinemas: null,
    rooms: null,
    banners: null,
    promotions: null,
    news: null,
    showtimes: {},
    get(key) {
        const item = this[key];
        if (!item || !item.timestamp) return null;
        return Date.now() - item.timestamp < this.ttl ? item.data : null;
    },
    set(key, data) {
        this[key] = { data, timestamp: Date.now() };
        return data;
    }
};

window.AERO_CACHE = AERO_CACHE;
