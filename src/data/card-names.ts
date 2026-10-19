/**
 * Canonical card names, indexed by card number (0–77, Rider–Waite order, same
 * numbering as the CSV and the image files). The AI is always given these exact
 * names and the UI / server-rendered headings use them, so a card can never be
 * shown or spoken under a different (translated or hallucinated) name.
 */
export const CARD_NAMES_EN: readonly string[] = [
  'The Fool', 'The Magician', 'The High Priestess', 'The Empress', 'The Emperor', 'The Hierophant',
  'The Lovers', 'The Chariot', 'Strength', 'The Hermit', 'Wheel of Fortune', 'Justice', 'The Hanged Man',
  'Death', 'Temperance', 'The Devil', 'The Tower', 'The Star', 'The Moon', 'The Sun', 'Judgement', 'The World',
  ...suit('Wands'), ...suit('Cups'), ...suit('Swords'), ...suit('Pentacles'),
];

function suit(name: string): string[] {
  return ['Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Page', 'Knight', 'Queen', 'King'].map(
    (rank) => `${rank} of ${name}`,
  );
}

const MAJOR_VI = [
  'Chàng Khờ', 'Nhà Ảo Thuật', 'Nữ Tư Tế', 'Hoàng Hậu', 'Hoàng Đế', 'Giáo Hoàng', 'Tình Nhân', 'Cỗ Xe',
  'Sức Mạnh', 'Ẩn Sĩ', 'Bánh Xe Số Phận', 'Công Lý', 'Người Treo Ngược', 'Cái Chết', 'Tiết Độ', 'Ác Quỷ',
  'Tòa Tháp', 'Ngôi Sao', 'Mặt Trăng', 'Mặt Trời', 'Phán Xét', 'Thế Giới',
];

const RANKS_VI = ['Át', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Tiểu Đồng', 'Hiệp Sĩ', 'Hoàng Hậu', 'Vua'];
const SUITS_VI = ['Gậy', 'Cốc', 'Kiếm', 'Tiền'];

export const CARD_NAMES_VI: readonly string[] = [
  ...MAJOR_VI,
  ...SUITS_VI.flatMap((s) => RANKS_VI.map((r) => `${r} ${s}`)),
];

/** Vietnamese words for the minor-arcana numbers, used when the name is spoken aloud. */
const NUMBER_WORDS_VI: Record<string, string> = {
  '2': 'Hai', '3': 'Ba', '4': 'Bốn', '5': 'Năm', '6': 'Sáu', '7': 'Bảy', '8': 'Tám', '9': 'Chín', '10': 'Mười',
};

export function cardNameVi(cardNumber: number): string {
  return CARD_NAMES_VI[cardNumber] ?? `Lá ${cardNumber}`;
}

export function cardNameEn(cardNumber: number): string {
  return CARD_NAMES_EN[cardNumber] ?? `Card ${cardNumber}`;
}

/** "Mặt Trời (The Sun)" in Vietnamese sessions, "The Sun" otherwise. */
export function cardDisplayName(cardNumber: number, vietnamese = true): string {
  return vietnamese ? `${cardNameVi(cardNumber)} (${cardNameEn(cardNumber)})` : cardNameEn(cardNumber);
}

/** "Bảy Cốc" instead of "7 Cốc" so text-to-speech reads it naturally. */
export function cardNameViSpoken(cardNumber: number): string {
  return cardNameVi(cardNumber).replace(/^(\d+)(?= )/, (n) => NUMBER_WORDS_VI[n] ?? n);
}
