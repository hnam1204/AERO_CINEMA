import { collection, doc, getDocs, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ============================================================
// AERO Cinema – Auto Status Updater
// Cập nhật trạng thái phim và suất chiếu theo thời gian thực
// ============================================================

const CLEANING_TIME_MS = 15 * 60 * 1000; // 15 phút dọn dẹp

/**
 * Chuẩn hoá trạng thái phim sang các giá trị chuẩn
 */
function normalizeMovieStatus(status) {
    const s = String(status || "").trim().toLowerCase();
    if (["inactive", "hide", "hidden"].includes(s)) return "hidden";
    if (s === "active" || s === "showing" || s === "now_showing") return "now_showing";
    if (s === "coming_soon" || s === "upcoming") return "coming_soon";
    if (s === "ended" || s === "finished") return "ended";
    return s || "now_showing";
}

/**
 * Parse date string "YYYY-MM-DD" và time string "HH:MM" sang timestamp
 */
function parseDateTimeToMs(dateStr, timeStr) {
    if (!dateStr) return null;
    const datePart = String(dateStr).trim();
    const timePart = String(timeStr || "00:00").trim();
    // Đảm bảo format YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return null;
    try {
        return new Date(`${datePart}T${timePart}:00`).getTime();
    } catch {
        return null;
    }
}

/**
 * Tính thời điểm endAt cho showtime từ startAt + duration + cleaningTime
 * duration tính bằng phút, mặc định 120 phút nếu không có
 */
function calcEndAt(startAtMs, durationMinutes) {
    const dur = Number(durationMinutes || 120);
    return startAtMs + dur * 60 * 1000 + CLEANING_TIME_MS;
}

// ============================================================
// MAIN EXPORT: autoUpdateStatuses
// ============================================================
export async function autoUpdateStatuses(db) {
    console.log("[StatusUpdater] Starting auto-update...");
    const now = new Date();
    const nowTime = now.getTime();

    // Tính ngày hiện tại theo local time (midnight)
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const todayStr = `${year}-${month}-${day}`;
    const todayMidnight = new Date(`${todayStr}T00:00:00`).getTime();

    // --------------------------------------------------------
    // 1. Cập nhật trạng thái Phim
    // --------------------------------------------------------
    try {
        const moviesSnap = await getDocs(collection(db, "movies"));
        for (const movieDoc of moviesSnap.docs) {
            const movie = movieDoc.data();
            const movieId = movieDoc.id;

            // Nếu admin đã set thủ công → bỏ qua
            if (movie.statusManual === true) {
                continue;
            }

            // Bỏ qua phim ẩn/inactive (không tự động ghi đè)
            const currentStatus = normalizeMovieStatus(movie.status);
            if (currentStatus === "hidden") {
                continue;
            }

            if (!movie.releaseDate) continue;

            // Parse releaseDate tại local midnight
            const relDate = new Date(`${movie.releaseDate}T00:00:00`).getTime();
            const runDays = Number(movie.movieRunDays || 30);
            // endDate là CUỐI ngày cuối chiếu (midnight của ngày tiếp theo sau runDays)
            const endDate = relDate + runDays * 24 * 60 * 60 * 1000;

            let expectedStatus;

            if (nowTime >= endDate) {
                // Đã qua ngày cuối chiếu
                expectedStatus = "ended";
            } else if (nowTime >= relDate) {
                // Đang trong thời gian chiếu
                expectedStatus = "now_showing";
            } else {
                // Chưa đến ngày chiếu
                expectedStatus = "coming_soon";
            }

            if (movie.status !== expectedStatus) {
                console.log(`[StatusUpdater] Movie ${movieId} (${movie.title}): ${movie.status} → ${expectedStatus}`);
                await updateDoc(doc(db, "movies", movieId), {
                    status: expectedStatus,
                    updatedAt: new Date()
                });
            }
        }
    } catch (err) {
        console.error("[StatusUpdater] Error updating movies:", err);
    }

    // --------------------------------------------------------
    // 2. Cập nhật trạng thái Suất chiếu
    // --------------------------------------------------------
    try {
        const showtimesSnap = await getDocs(collection(db, "showtimes"));
        for (const stDoc of showtimesSnap.docs) {
            const st = stDoc.data();
            const stId = stDoc.id;

            // Tính startAtMs từ nhiều nguồn khác nhau
            let startAtMs = null;
            if (st.startAt) {
                // Có thể là Firestore Timestamp hoặc ISO string
                if (st.startAt.toDate) {
                    startAtMs = st.startAt.toDate().getTime();
                } else if (typeof st.startAt === "string") {
                    startAtMs = new Date(st.startAt).getTime();
                } else if (typeof st.startAt === "number") {
                    startAtMs = st.startAt;
                }
            }
            // Fallback: parse từ date + time string
            if (!startAtMs && st.date && st.time) {
                startAtMs = parseDateTimeToMs(st.date, st.time);
            }

            if (!startAtMs || isNaN(startAtMs)) {
                // Không có đủ thông tin thời gian → bỏ qua
                continue;
            }

            // Tính endAtMs
            let endAtMs = null;
            if (st.endAt) {
                if (st.endAt.toDate) {
                    endAtMs = st.endAt.toDate().getTime();
                } else if (typeof st.endAt === "string") {
                    endAtMs = new Date(st.endAt).getTime();
                } else if (typeof st.endAt === "number") {
                    endAtMs = st.endAt;
                }
            }
            // Tính endAt nếu không có: startAt + duration + 15 phút
            if (!endAtMs || isNaN(endAtMs)) {
                const movieDuration = Number(st.duration || st.movieDuration || 120);
                endAtMs = calcEndAt(startAtMs, movieDuration);
            }

            // Xác định trạng thái mới
            let expectedStatus;
            if (nowTime > endAtMs) {
                expectedStatus = "completed";
            } else if (nowTime >= startAtMs && nowTime <= endAtMs) {
                expectedStatus = "showing";
            } else {
                expectedStatus = "upcoming";
            }

            if (st.status !== expectedStatus) {
                console.log(`[StatusUpdater] Showtime ${stId}: ${st.status} → ${expectedStatus}`);
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

// Alias cho backward compatibility
export const syncMovieStatuses = autoUpdateStatuses;
