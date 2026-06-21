import { collection, doc, getDocs, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export async function autoUpdateStatuses(db) {
    console.log("[StatusUpdater] Starting auto-update...");
    const now = new Date();
    
    // YYYY-MM-DD local time
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    const todayMidnight = new Date(`${todayStr}T00:00:00`).getTime();

    // 1. Update Movies
    try {
        const moviesSnap = await getDocs(collection(db, "movies"));
        for (const movieDoc of moviesSnap.docs) {
            const movie = movieDoc.data();
            const movieId = movieDoc.id;
            
            // Skip inactive or hidden movies
            if (["inactive", "hidden"].includes(movie.status)) {
                continue;
            }
            
            if (!movie.releaseDate) continue;
            
            // Parse releaseDate at local midnight
            const relDate = new Date(`${movie.releaseDate}T00:00:00`).getTime();
            const runDays = Number(movie.movieRunDays || 30);
            const endDate = relDate + runDays * 24 * 60 * 60 * 1000;
            
            let expectedStatus = movie.status || "now_showing";
            
            if (endDate < todayMidnight) {
                expectedStatus = "ended";
            } else if (relDate <= todayMidnight) {
                expectedStatus = "now_showing";
            } else {
                expectedStatus = "coming_soon";
            }
            
            if (movie.status !== expectedStatus) {
                console.log(`[StatusUpdater] Updating movie ${movieId} (${movie.title}) status: ${movie.status} -> ${expectedStatus}`);
                await updateDoc(doc(db, "movies", movieId), {
                    status: expectedStatus,
                    updatedAt: new Date()
                });
            }
        }
    } catch (err) {
        console.error("[StatusUpdater] Error updating movies:", err);
    }
    
    // 2. Update Showtimes
    try {
        const showtimesSnap = await getDocs(collection(db, "showtimes"));
        const nowTime = now.getTime();
        for (const stDoc of showtimesSnap.docs) {
            const st = stDoc.data();
            const stId = stDoc.id;
            
            // Skip inactive showtimes
            if (st.status === "inactive" || st.status === "disabled") {
                continue;
            }
            
            if (!st.startAt || !st.endAt) continue;
            
            const start = new Date(st.startAt).getTime();
            const end = new Date(st.endAt).getTime();
            
            let expectedStatus = st.status || "upcoming";
            if (end < nowTime) {
                expectedStatus = "completed";
            } else if (start <= nowTime && nowTime <= end) {
                expectedStatus = "showing";
            } else {
                expectedStatus = "upcoming";
            }
            
            if (st.status !== expectedStatus) {
                console.log(`[StatusUpdater] Updating showtime ${stId} status: ${st.status} -> ${expectedStatus}`);
                await updateDoc(doc(db, "showtimes", stId), {
                    status: expectedStatus,
                    updatedAt: new Date()
                });
            }
        }
    } catch (err) {
        console.error("[StatusUpdater] Error updating showtimes:", err);
    }
    
    console.log("[StatusUpdater] Auto-update finished.");
}
