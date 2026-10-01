# 🔮 Tarot Sanctuary (Tarot Viewer AI)

> *A quiet, mystical sanctuary for reflection, clarity, and contemplation powered by AI.*

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![LangChain](https://img.shields.io/badge/LangGraph-StateGraph-green?style=for-the-badge)](https://langchain-ai.github.io/langgraphjs/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

---

## 🌟 Giới thiệu / Overview

**Tarot Sanctuary** là ứng dụng bói và chiêm nghiệm Tarot tương tác thế hệ mới, kết hợp nghệ thuật bài Tarot Rider-Waite-Smith lịch sử với trí tuệ nhân tạo (AI) đa bước. Ứng dụng mang đến trải nghiệm trực quan sống động theo phong cách **Visual Novel** huyền bí, giúp người dùng đặt câu hỏi, xốc bài, chọn bài và nhận được những lời luận giải sâu sắc, ấm áp bằng chính ngôn ngữ của mình kèm giọng đọc truyền cảm.

---

## ✨ Tính năng nổi bật / Key Features

- 🃏 **Bộ bài Tarot Lịch Sử (Historical Rider-Waite Scans)**:
  - Bản scan chất lượng cao từ các bản in gốc: **1909 (Pam A)**, **1910 (Pam A)**, **1920s (Pam B)**, **1920s–1930s (Pam C)**.
  - Đầy đủ 78 lá bài (Ẩn chính Major Arcana & Ẩn phụ Minor Arcana) kèm mặt sau cổ điển.
- 🔮 **Các Kiểu Trải Bài Phong Phú (Spread Types)**:
  - **Daily Draw (1 Lá)**: Thông điệp cốt lõi và bài học tâm linh định hướng cho ngày mới.
  - **Past, Present & Future (3 Lá)**: Trải bài kinh điển khai mở quá khứ, hiện tại và xu hướng tương lai.
  - **Toàn Bộ 78 Lá (78-Card Spread)**: Chế độ khám phá và chiêm ngưỡng toàn bộ bộ bài.
- 🧠 **Luồng AI Thông Minh Đa Bước (LangGraph StateGraph)**:
  - **Greeting & Intent**: Lắng nghe tâm sự, câu hỏi và tâm nguyện của người xem.
  - **Language Detection**: Tự động nhận diện ngôn ngữ câu hỏi (hỗ trợ mượt mà Tiếng Việt, Tiếng Anh và nhiều ngôn ngữ khác).
  - **Card Interpretation**: Kết hợp ý nghĩa truyền thống từ cơ sở dữ liệu chuyên sâu với trực giác phân tích theo ngữ cảnh vị trí trải bài.
  - **Interactive Follow-up & Synthesis**: Trò chuyện tương tác trực tiếp với Reader về từng lá bài trước khi nhận thông điệp đúc kết.
- 🎙️ **Giọng Đọc AI Truyền Cảm (ElevenLabs TTS Integration)**:
  - Phát âm thanh streaming lời thoại của Reader thời gian thực với chất giọng trầm ấm, bí ẩn.
- 🌌 **Giao Diện Huyền Bí Sống Động (Mystical Visual Novel UI)**:
  - Bầu không khí tĩnh lặng với hiệu ứng ánh nến lung linh, tinh tú chuyển động, hiệu ứng xào bài và lật bài 3D mượt mà.

---

## 🛠️ Công nghệ sử dụng / Tech Stack

- **Frontend**: [Next.js](https://nextjs.org/) (App Router), [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/)
- **AI & Workflow Engine**:
  - [LangGraph.js](https://langchain-ai.github.io/langgraphjs/) & [LangChain Core](https://js.langchain.com/)
  - **LLM**: Alibaba Cloud DashScope (`qwen-plus`) thông qua OpenAI-compatible API
- **Voice AI**: [ElevenLabs](https://elevenlabs.io/) Text-to-Speech API (`eleven_flash_v2_5`)
- **Data**: Hệ thống dữ liệu CSV chuẩn hóa diễn giải 78 lá bài (`tarot_card_meanings.csv`)

---

## 📁 Cấu trúc thư mục / Project Structure

```text
tarotviewerAI/
├── public/
│   └── cards/                  # Hình ảnh quét 78 lá bài theo từng phiên bản lịch sử
│       ├── 1909/               # Rider-Waite-Smith 1909 Pam A
│       ├── 1910/               # Rider-Waite-Smith 1910
│       ├── 1920s-b/            # Phiên bản 1920s Pam B
│       ├── 1920s-c/            # Phiên bản 1920s-1930s Pam C
│       └── back.jpg            # Mặt sau lá bài cổ điển
├── scripts/
│   └── setup-images.js         # Script tự động xử lý và trích xuất ảnh lá bài
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── cards/route.ts          # API nạp thông tin danh sách bài
│   │   │   ├── reading/route.ts        # API thực thi đồ thị LangGraph Tarot
│   │   │   ├── reading/draw/route.ts   # API bốc bài ngẫu nhiên
│   │   │   └── tts/route.ts            # API streaming âm thanh ElevenLabs
│   │   ├── reading/page.tsx            # Trang chính trải bài Tarot
│   │   ├── page.tsx                    # Trang chào đón (Tarot Sanctuary Welcome)
│   │   └── globals.css                 # Hệ thống màu sắc huyền bí & animations
│   ├── components/
│   │   ├── CardDeck.tsx                # Hiệu ứng tụ bài & xào bài
│   │   ├── TarotCard.tsx               # Component thẻ bài & lật bài 3D
│   │   ├── SpreadPicker.tsx            # Lựa chọn kiểu trải bài
│   │   ├── SpreadLayout.tsx            # Bố cục hiển thị vị trí các lá bài
│   │   ├── VisualNovelScene.tsx        # Khung thoại tương tác với Tarot Reader
│   │   └── SeventyEightCardsSpread.tsx # Hiển thị danh mục 78 lá
│   ├── data/
│   │   └── spreads.ts                  # Cấu hình các kiểu trải bài
│   ├── hooks/
│   │   ├── useReading.ts               # Hook quản lý tiến trình phiên trải bài
│   │   └── useTTS.ts                   # Hook phát âm thanh giọng đọc
│   ├── lib/
│   │   ├── csv-parser.ts               # Bộ đọc ý nghĩa lá bài từ CSV
│   │   └── langgraph/                  # LangGraph Workflow, Prompts & States
│   └── types/
│       └── tarot.ts                    # TypeScript types & interfaces
├── tarot meaning/
│   └── tarot_card_meanings.csv         # Dữ liệu giải nghĩa 78 lá bài Tarot
├── .env.example                        # Mẫu biến môi trường
├── package.json
└── README.md
```

---

## 🚀 Hướng dẫn cài đặt & Khởi chạy / Getting Started

### 1. Yêu cầu hệ thống
- [Node.js](https://nodejs.org/) phiên bản 18.18 trở lên hoặc Node.js 20+
- Trình quản lý gói `npm`, `pnpm` hoặc `yarn`

### 2. Clone dự án
```bash
git clone https://github.com/ahuhu789/tarot-viewer-ai.git
cd tarotviewerAI
```

### 3. Cài đặt thư viện dependencies
```bash
npm install
```

### 4. Thiết lập biến môi trường
Tạo file `.env.local` từ mẫu `.env.example`:

```bash
cp .env.example .env.local
```

Mở `.env.local` và điền các khóa API của bạn:
```env
# Khóa API Alibaba Cloud DashScope (Dùng cho mô hình Qwen-plus)
ALIBABA_API_KEY=your_alibaba_dashscope_api_key_here
ALIBABA_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1

# Khóa API ElevenLabs (Tùy chọn - Dùng cho tính năng đọc giọng nói)
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

> 💡 *Ghi chú: Nếu không cung cấp `ELEVENLABS_API_KEY`, ứng dụng vẫn hoạt động bình thường ở chế độ hội thoại chữ.*

### 5. Khởi chạy môi trường phát triển (Development)
```bash
npm run dev
```

Mở trình duyệt và truy cập: [http://localhost:3000](http://localhost:3000)

### 6. Build cho môi trường Production
```bash
npm run build
npm run start
```

---

## 🔮 Hướng dẫn trải nghiệm / How to Use

1. **Bước vào Sanctuary**: Nhấn *"Enter the Sanctuary"* tại trang chủ.
2. **Chọn bộ bài & Kiểu trải**: Lựa chọn phiên bản Rider-Waite mong muốn và hình thức trải (1 lá hoặc 3 lá).
3. **Đặt tâm niệm & Đặt câu hỏi**: Nhập câu hỏi, vấn đề bạn đang băn khoăn bằng Tiếng Việt hoặc bất kỳ ngôn ngữ nào.
4. **Rút bài**: Tập trung tâm trí và chạm vào bộ bài để rút các lá bài định mệnh.
5. **Lắng nghe & Trò chuyện**:
   - Lật từng lá bài để chiêm ngưỡng hình ảnh nghệ thuật nguyên bản.
   - Nhận luận giải từ Tarot Reader AI.
   - Bạn có thể đặt câu hỏi tiếp theo để đào sâu thêm ý nghĩa của từng lá bài hoặc nhận lời khuyên tổng kết.

---

## 📜 Bản quyền & Ghi nhận / License & Credits

- Thiết kế bộ bài Tarot nguyên bản bởi **Pamela Colman Smith** dưới sự chỉ dẫn của **Arthur Edward Waite** (1909).
- Bản scan thuộc phạm vi công cộng (Public Domain).
- Phát triển bởi [@ahuhu789](https://github.com/ahuhu789).

---

<p align="center">
  <i>"The cards do not predict a fixed destiny; they illuminate the choices before you."</i>
</p>
