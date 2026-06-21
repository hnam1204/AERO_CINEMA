// Điểm mở rộng cho Gemini. Không chứa API key và không khởi tạo Firebase.
export const AIProvider = {
    useGemini: false,

    async generateResponse(message, context = {}) {
        if (!this.useGemini) return null;

        // Khi tích hợp Gemini, gắn adapter có hàm generateResponse vào window.AEROGeminiProvider.
        const provider = window.AEROGeminiProvider;
        if (!provider || typeof provider.generateResponse !== "function") {
            throw new Error("Gemini đang bật nhưng chưa cấu hình AEROGeminiProvider.");
        }
        return provider.generateResponse(message, context);
    }
};
