import re

file_path = "d:/NĂM 2/HỌC KỲ 3/CÔNG NGHỆ PHẦN MỀM/CINEMABOOKING/CINEMABOOKING/Views/Home/Index.cshtml"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Locate loadHomeContent target block
target_block = """        const loadHomeContent = async () => {
            try {
                // Auto update movie and showtime statuses
                await autoUpdateStatuses(db);

                const now = Date.now();
                if (!homeCache.movies || (now - homeCache.loadedAt > HOME_CACHE_TTL)) {
                    const [moviesSnap, bannersSnap, promotionsSnap, newsSnap, cinemasSnap] = await Promise.all([
                        getDocs(query(collection(db, "movies"), limit(30))),
                        getDocs(query(collection(db, "banners"), limit(8))),
                        getDocs(query(collection(db, "promotions"), limit(6))),
                        getDocs(query(collection(db, "news"), limit(6))),
                        getDocs(query(collection(db, "cinemas"), limit(15)))
                    ]);

                    homeCache.movies = docsToArray(moviesSnap);
                    homeCache.banners = docsToArray(bannersSnap);
                    homeCache.promotions = promotionsSnap ? docsToArray(promotionsSnap) : [];
                    homeCache.news = newsSnap ? docsToArray(newsSnap) : [];
                    homeCache.cinemas = docsToArray(cinemasSnap);
                    homeCache.loadedAt = now;
                }

                cachedMovies = homeCache.movies;
                cachedBanners = homeCache.banners;
                cachedPromotions = homeCache.promotions;
                cachedNews = homeCache.news;
                cachedCinemas = homeCache.cinemas;

                // 1. Render Hero Banner (Fade Slider)
                if (window.loadHeroBanners) {
                    await window.loadHeroBanners();
                }

                // 2. Load Quick Booking Movies dropdown
                populateQbMovies();

                // 3. Render Tab List (Default Now Showing)
                renderMovieGrid();

                // 4. Render Promotions dynamically
                renderPromotions();

                // 4.5 Render News dynamically
                renderNews();

            } catch (e) {
                console.error("Home loading error: ", e);
            }
        };"""

replacement_block = """        // Offline Fallback & Warning variables
        let firestoreWarningShown = false;

        function warnFirestoreOnce(err) {
            if (firestoreWarningShown) return;
            firestoreWarningShown = true;
            console.warn("Firestore unavailable, fallback mode enabled.", err);
        }

        function withTimeout(promise, ms = 8000) {
            return Promise.race([
                promise,
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Firestore timeout")), ms)
                )
            ]);
        }

        function hideHomeSkeletons() {
            const moviesContainer = document.getElementById("moviesGridDisplay");
            if (moviesContainer) {
                moviesContainer.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-sub);">
                        <i class="fas fa-exclamation-triangle fa-3x" style="color: var(--accent-color); margin-bottom: 15px; display: block;"></i>
                        <span style="display:block; margin-top:10px;">${tr("offline_data_warning", "Đang dùng dữ liệu tạm thời, vui lòng thử lại sau.")}</span>
                    </div>
                `;
            }

            const promoContainer = document.getElementById("offersGrid");
            if (promoContainer) {
                promoContainer.innerHTML = `
                    <div style="grid-column: span 3; text-align: center; padding: 40px; color: var(--text-sub);">
                        <i class="fas fa-gift fa-3x" style="color: var(--accent-color); margin-bottom: 15px; display: block;"></i>
                        <span>${tr("promo_empty")}</span>
                    </div>
                `;
            }

            const newsContainer = document.getElementById("newsGrid");
            if (newsContainer) {
                newsContainer.innerHTML = `
                    <div style="grid-column: span 3; text-align: center; padding: 40px; color: var(--text-sub);">
                        <i class="far fa-newspaper fa-3x" style="color: var(--accent-color); margin-bottom: 15px; display: block;"></i>
                        <span>${tr("no_data")}</span>
                    </div>
                `;
            }
        }

        function showOfflineNotification() {
            const toast = document.createElement("div");
            toast.className = "aero-offline-toast";
            toast.style.cssText = "position: fixed; bottom: 20px; right: 20px; background: rgba(239, 68, 68, 0.95); color: white; padding: 12px 24px; border-radius: 8px; z-index: 9999; font-weight: 600; box-shadow: 0 4px 12px rgba(0,0,0,0.15); display: flex; align-items: center; gap: 10px; transition: opacity 0.5s;";
            toast.innerHTML = `<i class="fas fa-wifi-slash"></i> <span>${tr("offline_mode", "Đang dùng dữ liệu tạm thời, vui lòng thử lại sau.")}</span>`;
            document.body.appendChild(toast);
            setTimeout(() => {
                toast.style.opacity = "0";
                setTimeout(() => toast.remove(), 500);
            }, 6000);
        }

        function renderHomeFallback() {
            hideHomeSkeletons();
            if (window.loadHeroBanners) {
                window.loadHeroBanners([]); 
            }
            showOfflineNotification();
        }

        const loadHomeContent = async () => {
            try {
                // Auto update movie and showtime statuses (max 4s)
                try {
                    await withTimeout(autoUpdateStatuses(db), 4000);
                } catch (err) {
                    warnFirestoreOnce(err);
                }

                const now = Date.now();
                if (!homeCache.movies || (now - homeCache.loadedAt > HOME_CACHE_TTL)) {
                    const snapPromise = Promise.all([
                        getDocs(query(collection(db, "movies"), limit(30))),
                        getDocs(query(collection(db, "banners"), limit(8))),
                        getDocs(query(collection(db, "promotions"), limit(6))),
                        getDocs(query(collection(db, "news"), limit(6))),
                        getDocs(query(collection(db, "cinemas"), limit(15)))
                    ]);

                    const [moviesSnap, bannersSnap, promotionsSnap, newsSnap, cinemasSnap] = await withTimeout(snapPromise, 8000);

                    homeCache.movies = docsToArray(moviesSnap);
                    homeCache.banners = docsToArray(bannersSnap);
                    homeCache.promotions = promotionsSnap ? docsToArray(promotionsSnap) : [];
                    homeCache.news = newsSnap ? docsToArray(newsSnap) : [];
                    homeCache.cinemas = docsToArray(cinemasSnap);
                    homeCache.loadedAt = now;
                }

                cachedMovies = homeCache.movies;
                cachedBanners = homeCache.banners;
                cachedPromotions = homeCache.promotions;
                cachedNews = homeCache.news;
                cachedCinemas = homeCache.cinemas;

                // 1. Render Hero Banner (Fade Slider)
                if (window.loadHeroBanners) {
                    await window.loadHeroBanners();
                }

                // 2. Load Quick Booking Movies dropdown
                populateQbMovies();

                // 3. Render Tab List (Default Now Showing)
                renderMovieGrid();

                // 4. Render Promotions dynamically
                renderPromotions();

                // 4.5 Render News dynamically
                renderNews();

            } catch (e) {
                warnFirestoreOnce(e);
                renderHomeFallback();
            }
        };"""

if target_block in content:
    content = content.replace(target_block, replacement_block)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Successfully replaced loadHomeContent with timeout and fallback support.")
else:
    print("Could not find target_block in file!")
