import {
    doc,
    getDoc,
    runTransaction,
    collection,
    addDoc,
    serverTimestamp,
    arrayUnion,
    arrayRemove
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ============================================================
// AERO Cinema – Business Logic Module
// Seat Hold, Points, Member Rank Auto Upgrade
// ============================================================

const HOLD_DURATION_MS = 15 * 60 * 1000;  // 15 phút giữ ghế
const CLEANING_TIME_MS = 15 * 60 * 1000;  // 15 phút dọn dẹp
const LATE_BOOKING_MINUTES = 30;           // Không cho đặt vé sau 30 phút
const POINTS_PER_VND = 10000;             // 10.000đ = 1 điểm

// ============================================================
// SEAT HOLD UTILITIES
// ============================================================

/**
 * Parse date + time string → timestamp (ms)
 */
export function parseDateTimeMs(dateStr, timeStr) {
    if (!dateStr) return null;
    const d = String(dateStr).trim();
    const t = String(timeStr || "00:00").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return null;
    const tsParsed = new Date(`${d}T${t}:00`).getTime();
    return isNaN(tsParsed) ? null : tsParsed;
}

/**
 * Lấy startAt (ms) từ showtime document data
 */
export function getShowtimeStartMs(showtimeData) {
    const st = showtimeData;
    if (!st) return null;
    if (st.startAt) {
        if (st.startAt.toDate) return st.startAt.toDate().getTime();
        if (typeof st.startAt === "string") return new Date(st.startAt).getTime();
        if (typeof st.startAt === "number") return st.startAt;
    }
    if (st.date && st.time) return parseDateTimeMs(st.date, st.time);
    return null;
}

/**
 * Kiểm tra suất chiếu đã bắt đầu hơn 30 phút chưa
 * @returns true nếu đã quá 30 phút (không cho đặt vé)
 */
export function isShowtimeLate(showtimeData) {
    const startMs = getShowtimeStartMs(showtimeData);
    if (!startMs) return false;
    const cutoffMs = startMs + LATE_BOOKING_MINUTES * 60 * 1000;
    return Date.now() >= cutoffMs;
}

/**
 * Lọc holdSeats hết hạn khỏi mảng
 */
export function filterActiveHolds(holdSeats) {
    if (!Array.isArray(holdSeats)) return [];
    const now = Date.now();
    return holdSeats.filter(hold => {
        if (!hold || !hold.expiresAt) return false;
        const expMs = hold.expiresAt.toDate
            ? hold.expiresAt.toDate().getTime()
            : new Date(hold.expiresAt).getTime();
        return expMs > now;
    });
}

/**
 * Kiểm tra ghế có đang bị hold (chưa hết hạn) không
 */
export function isSeatHeld(holdSeats, seatCode, currentUserId) {
    const active = filterActiveHolds(holdSeats);
    return active.some(h => {
        if (String(h.seatCode || "").toUpperCase() !== String(seatCode).toUpperCase()) return false;
        // Không tính là bị hold nếu chính user đang hold
        if (currentUserId && h.userId === currentUserId) return false;
        return true;
    });
}

/**
 * Kiểm tra ghế có đang bị user hiện tại hold không
 */
export function isSeatHeldByMe(holdSeats, seatCode, currentUserId) {
    if (!currentUserId) return false;
    const active = filterActiveHolds(holdSeats);
    return active.some(h =>
        String(h.seatCode || "").toUpperCase() === String(seatCode).toUpperCase() &&
        h.userId === currentUserId
    );
}

/**
 * Hold ghế – Firestore Transaction
 * Thêm vào holdSeats[] trong showtimes/{showtimeId}
 */
export async function holdSeat(db, showtimeId, seatCode, userId, source = "online") {
    const showtimeRef = doc(db, "showtimes", showtimeId);
    const normalCode = String(seatCode).trim().toUpperCase();
    const now = Date.now();
    const expiresAt = new Date(now + HOLD_DURATION_MS);

    try {
        await runTransaction(db, async (transaction) => {
            const stSnap = await transaction.get(showtimeRef);
            if (!stSnap.exists()) throw new Error("Suất chiếu không tồn tại.");

            const stData = stSnap.data();
            const soldSeats = (stData.soldSeats || []).map(s => String(s).toUpperCase());
            if (soldSeats.includes(normalCode)) {
                throw new Error(`Ghế ${normalCode} đã được bán.`);
            }

            const holdSeats = filterActiveHolds(stData.holdSeats || []);
            const alreadyHeld = holdSeats.some(h =>
                String(h.seatCode || "").toUpperCase() === normalCode && h.userId !== userId
            );
            if (alreadyHeld) {
                throw new Error(`Ghế ${normalCode} đang được người khác giữ.`);
            }

            // Xóa hold cũ của chính user (nếu có) rồi thêm mới
            const filteredHolds = holdSeats.filter(h =>
                !(String(h.seatCode || "").toUpperCase() === normalCode && h.userId === userId)
            );

            filteredHolds.push({
                seatCode: normalCode,
                userId,
                source,
                holdAt: new Date().toISOString(),
                expiresAt: expiresAt.toISOString()
            });

            transaction.update(showtimeRef, {
                holdSeats: filteredHolds,
                updatedAt: new Date()
            });
        });
        return { success: true };
    } catch (err) {
        return { success: false, message: err.message };
    }
}

/**
 * Release ghế – Xóa khỏi holdSeats
 */
export async function releaseSeat(db, showtimeId, seatCode, userId) {
    const showtimeRef = doc(db, "showtimes", showtimeId);
    const normalCode = String(seatCode).trim().toUpperCase();

    try {
        await runTransaction(db, async (transaction) => {
            const stSnap = await transaction.get(showtimeRef);
            if (!stSnap.exists()) return;

            const stData = stSnap.data();
            const holdSeats = Array.isArray(stData.holdSeats) ? stData.holdSeats : [];
            const updatedHolds = holdSeats.filter(h =>
                !(String(h.seatCode || "").toUpperCase() === normalCode && h.userId === userId)
            );

            transaction.update(showtimeRef, {
                holdSeats: updatedHolds,
                updatedAt: new Date()
            });
        });
        return { success: true };
    } catch (err) {
        console.warn("[SeatHold] releaseSeat error:", err);
        return { success: false };
    }
}

/**
 * Release tất cả ghế của user trong showtime hiện tại
 */
export async function releaseAllMySeats(db, showtimeId, userId) {
    const showtimeRef = doc(db, "showtimes", showtimeId);
    try {
        await runTransaction(db, async (transaction) => {
            const stSnap = await transaction.get(showtimeRef);
            if (!stSnap.exists()) return;

            const stData = stSnap.data();
            const holdSeats = Array.isArray(stData.holdSeats) ? stData.holdSeats : [];
            const updatedHolds = holdSeats.filter(h => h.userId !== userId);

            transaction.update(showtimeRef, {
                holdSeats: updatedHolds,
                updatedAt: new Date()
            });
        });
    } catch (err) {
        console.warn("[SeatHold] releaseAllMySeats error:", err);
    }
}

/**
 * Release tất cả hold hết hạn trong showtime (cleanup)
 */
export async function releaseExpiredHolds(db, showtimeId) {
    const showtimeRef = doc(db, "showtimes", showtimeId);
    try {
        await runTransaction(db, async (transaction) => {
            const stSnap = await transaction.get(showtimeRef);
            if (!stSnap.exists()) return;

            const stData = stSnap.data();
            const holdSeats = Array.isArray(stData.holdSeats) ? stData.holdSeats : [];
            const activeHolds = filterActiveHolds(holdSeats);

            if (activeHolds.length !== holdSeats.length) {
                transaction.update(showtimeRef, {
                    holdSeats: activeHolds,
                    updatedAt: new Date()
                });
            }
        });
    } catch (err) {
        console.warn("[SeatHold] releaseExpiredHolds error:", err);
    }
}

// ============================================================
// MEMBER RANK UTILITIES
// ============================================================

/**
 * Tính hạng thành viên dựa trên điểm tích lũy
 */
export function calcMemberRank(points) {
    const p = Number(points || 0);
    if (p >= 3000) return "Diamond";
    if (p >= 1000) return "Gold";
    if (p >= 500)  return "Silver";
    return "Standard";
}

// ============================================================
// POINTS LOGIC – Cộng điểm sau booking thành công
// ============================================================

/**
 * Cộng điểm cho user sau khi đặt vé thành công
 * Chống duplicate: kiểm tra booking.pointsAdded !== true
 * 
 * @param {Object} db - Firestore instance
 * @param {string} bookingId - ID của booking
 * @param {string} userId - UID của user
 * @param {number} totalAmount - Tổng tiền thanh toán (VND)
 * @returns {Object} { success, earnedPoints, newTotal, oldRank, newRank, rankUpgraded }
 */
export async function addPointsAfterBooking(db, bookingId, userId, totalAmount) {
    const bookingRef = doc(db, "bookings", bookingId);
    const userRef = doc(db, "users", userId);

    const earnedPoints = Math.floor(Number(totalAmount || 0) / POINTS_PER_VND);

    if (earnedPoints <= 0) {
        return { success: false, message: "Không đủ điều kiện cộng điểm." };
    }

    try {
        let result = { success: false };

        await runTransaction(db, async (transaction) => {
            // Đọc booking và user trong cùng transaction
            const bookingSnap = await transaction.get(bookingRef);
            const userSnap = await transaction.get(userRef);

            if (!bookingSnap.exists()) throw new Error("Booking không tồn tại.");
            if (!userSnap.exists()) throw new Error("User không tồn tại.");

            const bookingData = bookingSnap.data();
            const userData = userSnap.data();

            // Chống cộng điểm 2 lần
            if (bookingData.pointsAdded === true) {
                result = { success: false, message: "Điểm đã được cộng cho booking này." };
                return; // Abort transaction
            }

            // Chỉ cộng điểm nếu đã paid
            const payStatus = String(bookingData.paymentStatus || bookingData.status || "").toLowerCase();
            if (payStatus !== "paid" && payStatus !== "confirmed") {
                result = { success: false, message: "Booking chưa được thanh toán." };
                return;
            }

            // Tính điểm hiện tại
            const currentPoints = Number(userData.points || 0);
            const newTotal = currentPoints + earnedPoints;

            // Daily points logic
            const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
            const lastPointDate = userData.lastPointDate || "";
            let currentDailyPoints = Number(userData.dailyPoints || 0);

            if (lastPointDate !== today) {
                // Sang ngày mới → reset dailyPoints
                currentDailyPoints = 0;
            }
            const newDailyPoints = currentDailyPoints + earnedPoints;

            // Auto calc rank
            const oldRank = userData.memberRank || calcMemberRank(currentPoints);
            const newRank = calcMemberRank(newTotal);
            const rankUpgraded = newRank !== oldRank;

            // Update user points
            transaction.update(userRef, {
                points: newTotal,
                dailyPoints: newDailyPoints,
                lastPointDate: today,
                memberRank: newRank,
                updatedAt: serverTimestamp()
            });

            // Mark booking as points added
            transaction.update(bookingRef, {
                pointsAdded: true,
                pointsAddedAt: serverTimestamp(),
                earnedPoints: earnedPoints
            });

            result = {
                success: true,
                earnedPoints,
                newTotal,
                oldRank,
                newRank,
                rankUpgraded
            };
        });

        // Sau transaction thành công → ghi log vào point_histories
        if (result.success) {
            try {
                await addDoc(collection(db, "point_histories"), {
                    userId,
                    bookingId,
                    points: earnedPoints,
                    amount: Number(totalAmount),
                    type: "booking_paid",
                    createdAt: serverTimestamp()
                });
            } catch (logErr) {
                // Log lỗi nhưng không throw – điểm đã được cộng
                console.warn("[Points] Failed to write point_histories:", logErr);
            }

            // Nếu rank thay đổi → ghi log activity_logs
            if (result.rankUpgraded) {
                try {
                    await addDoc(collection(db, "activity_logs"), {
                        type: "member_rank_upgraded",
                        userId,
                        oldRank: result.oldRank,
                        newRank: result.newRank,
                        points: result.newTotal,
                        createdAt: serverTimestamp()
                    });
                } catch (logErr) {
                    console.warn("[Points] Failed to write activity_logs:", logErr);
                }
            }
        }

        return result;
    } catch (err) {
        console.error("[Points] addPointsAfterBooking error:", err);
        return { success: false, message: err.message };
    }
}
