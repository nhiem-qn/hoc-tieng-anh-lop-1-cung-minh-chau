// ============================================================
// Game Khám Phá 3D — bé chọn nhân vật, chọn nơi (Thành phố /
// Đồng quê), đi lại bằng phím mũi tên hoặc nút mũi tên trên màn
// hình, bấm vào đồ vật 3D để nghe cô đọc tên tiếng Anh, và làm
// nhiệm vụ để nhận sao (lưu qua action completeLesson với
// lessonId "game3d-city" / "game3d-countryside").
// Từ vựng lấy đúng từ SGK lớp 1 (content.ts) và đọc bằng MP3
// giọng cô trong audioMap.ts; từ chưa có MP3 (tree, flower) đọc
// bằng giọng hệ thống tiếng Anh.
//
// NÂNG CẤP ĐỢT 2:
// 1) Mũi tên chỉ đường tới vật của nhiệm vụ + sau 20 giây vật
//    cần tìm tự phát sáng nhấp nháy; nút "Nghe lại nhiệm vụ".
// 2) Thẻ từ có nút "Nói theo cô": nghe cô đọc mẫu rồi đọc lại,
//    chấm điểm 0–100 bằng đúng cơ chế chấm đọc của ứng dụng
//    (lưu speech_scores, lessonId "game3d-say-<map>").
// 3) Sổ Khám Phá: vật đã bấm được lưu bền (bảng
//    explore_discoveries qua action discoverObject); tìm đủ
//    100% vật của một map → tặng sticker thám hiểm vào Bộ sưu tập.
// 4) Thêm 2 dạng nhiệm vụ: MÀU SẮC ("Find the red car!") và
//    ĐẾM SỐ ("Tap 3 ducks!" — cô đếm One! Two! Three! bằng MP3 số).
// 5) Map sống động: chim bay vòng, cá nhảy khỏi mặt hồ, xe chạy
//    qua đường, mây trôi, nhân vật có nhịp thở khi đứng yên.
//
// NÂNG CẤP ĐỢT 3:
// - Đồ họa thật hơn: vòm trời gradient, texture cỏ canvas, nắng +
//   bóng đổ mềm PCFSoft (tự tắt trên máy yếu), đèn đường, công viên,
//   cầu gỗ, vườn cây; con vật có chuyển động riêng (gà mổ thóc, vịt
//   bơi vòng, chó nhảy mừng, ngựa/dê gặm cỏ, ếch nhảy), chim có bóng.
// - Camera qua-vai gần tầm mắt trẻ em: bám êm theo hướng đi bằng
//   lerp góc, bob rất nhẹ khi bước, di chuyển theo góc camera nên
//   ↑ luôn là "tới" trên màn hình; đầu nhiệm vụ lia nhẹ về vật cần tìm.
// - Panel nhiệm vụ: hiện to ~3 giây đầu rồi thu thành thanh 1 dòng
//   (số nhiệm vụ + hình + câu Anh–Việt rút gọn + loa + bỏ qua).
// - Nhiệm vụ mới TỰ ĐỘNG đọc tiếng Việt (speechSynthesis vi-VN,
//   không có MP3 ghép câu sẵn) rồi đọc tiếp tiếng Anh.
// - Map rộng: bán kính đi được 24 → 38; thành phố +3 vật (ball,
//   hat, cake ở khu công viên/cửa hàng), đồng quê +3 vật (lemon,
//   frog, grape ở vườn cây/ao lớn) → Sổ Khám Phá 13/14 bạn mỗi map,
//   dữ liệu đã lưu theo khóa cũ không đổi nên không mất.
// ============================================================
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AUDIO } from "./audioMap";
import { api } from "./api";

// ---------- Dữ liệu nhân vật & bản đồ ----------
export interface CharacterDef {
  id: string;
  kind: "girl" | "boy" | "bunny" | "cat";
  nameVi: string;
  nameEn: string;
  emoji: string;
  descVi: string;
  bodyColor: number;
  accentColor: number;
}

export const CHARACTERS: CharacterDef[] = [
  {
    id: "chau", kind: "girl", nameVi: "Minh Châu", nameEn: "Chau",
    emoji: "👧", descVi: "Bé gái váy hồng, thích đọc sách",
    bodyColor: 0xff5d8f, accentColor: 0x7a4a21,
  },
  {
    id: "bill", kind: "boy", nameVi: "Bill", nameEn: "Bill",
    emoji: "👦", descVi: "Bé trai áo xanh, chạy rất nhanh",
    bodyColor: 0x4cc9f0, accentColor: 0xffc53d,
  },
  {
    id: "bunny", kind: "bunny", nameVi: "Thỏ Bông", nameEn: "Bunny",
    emoji: "🐰", descVi: "Chú thỏ trắng tai dài, nhảy tung tăng",
    bodyColor: 0xffffff, accentColor: 0xff9fc6,
  },
  {
    id: "meo", kind: "cat", nameVi: "Mèo Miu", nameEn: "Miu the Cat",
    emoji: "🐱", descVi: "Mèo cam tinh nghịch, thích khám phá",
    bodyColor: 0xff9f45, accentColor: 0xfff3e4,
  },
];

// ---------- Màu sắc & số đếm (từ vựng lớp 1, có MP3 giọng cô) ----------
export type ColorId = "red" | "blue" | "yellow" | "green";

export const COLORS: Record<
  ColorId,
  { en: string; vi: string; ipa: string; audioKey: string; css: string }
> = {
  red: { en: "red", vi: "đỏ", ipa: "/red/", audioKey: "red", css: "#FF4444" },
  blue: { en: "blue", vi: "xanh dương", ipa: "/bluː/", audioKey: "x-blue", css: "#3D7BFF" },
  yellow: { en: "yellow", vi: "vàng", ipa: "/ˈjeləʊ/", audioKey: "x-yellow", css: "#FFC53D" },
  green: { en: "green", vi: "xanh lá", ipa: "/ɡriːn/", audioKey: "x-green", css: "#3FA34D" },
};
export const COLOR_IDS: ColorId[] = ["red", "blue", "yellow", "green"];

/** Số đếm 1–5: khóa MP3 giọng cô trong audioMap (one, two, three, four, five). */
export const NUMBERS = [
  { n: 1, en: "One", key: "one" },
  { n: 2, en: "Two", key: "two" },
  { n: 3, en: "Three", key: "three" },
  { n: 4, en: "Four", key: "four" },
  { n: 5, en: "Five", key: "five" },
];

export interface WorldObjectDef {
  id: string;
  en: string;
  ipa: string;
  vi: string;
  emoji: string;
  /** Khóa MP3 giọng cô; null = chưa có MP3, đọc bằng giọng hệ thống. */
  audioKey: string | null;
  x: number;
  z: number;
  /** Vật ở trên trời (mặt trời) — không tính "đi đến gần". */
  inSky?: boolean;
  /** Màu của vật (xe / hoa nhiều màu) — dùng cho nhiệm vụ màu sắc. */
  colorId?: ColorId;
  /** Vật phụ thuộc nhóm vật chính nào (xe màu vẫn là "car", vịt thêm vẫn là "duck"). */
  variantOf?: string;
  /** Màu lông/tông riêng khi dựng hình (vd: chó phụ màu khác chó chính). */
  tint?: number;
}

export type MapId = "city" | "countryside" | "beach" | "zoo";

export interface MapDef {
  id: MapId;
  nameEn: string;
  nameVi: string;
  emoji: string;
  descVi: string;
  groundColor: number;
  skyColor: number;
  /** Vật chính học từ vựng — được tính vào Sổ Khám Phá. */
  objects: WorldObjectDef[];
  /** Vật phụ (xe nhiều màu, con vật thêm cho nhiệm vụ đếm) — bấm được, không tính vào Sổ. */
  extras: WorldObjectDef[];
  /** Nhóm vật dùng cho nhiệm vụ MÀU SẮC (thành phố: car, đồng quê: flower). */
  colorBaseId: string;
  /** Nhóm vật dùng cho nhiệm vụ ĐẾM SỐ (thành phố: dog, đồng quê: duck). */
  countBaseId: string;
}

const o = (
  id: string, en: string, ipa: string, vi: string, emoji: string,
  audioKey: string | null, x: number, z: number, inSky = false,
  colorId?: ColorId, variantOf?: string, tint?: number,
): WorldObjectDef => ({ id, en, ipa, vi, emoji, audioKey, x, z, inSky, colorId, variantOf, tint });

export const MAPS: MapDef[] = [
  {
    id: "city",
    nameEn: "City", nameVi: "Thành phố", emoji: "🏙️",
    descVi: "Nhà cao tầng, xe buýt, công viên và tiệm bánh — map rộng!",
    groundColor: 0xb9d97c, skyColor: 0x87ceeb,
    colorBaseId: "car", countBaseId: "dog",
    objects: [
      o("bus", "bus", "/bʌs/", "xe buýt", "🚌", "bus", -18, -16),
      o("car", "car", "/kɑː/", "xe ô tô", "🚗", "car", 14, -18, false, "red"),
      o("bike", "bike", "/baɪk/", "xe đạp", "🚲", "bike", -8, 18),
      o("truck", "truck", "/trʌk/", "xe tải", "🚚", "truck", 20, 12),
      o("dog", "dog", "/dɒɡ/", "con chó", "🐶", "dog", -20, 8),
      o("cat", "cat", "/kæt/", "con mèo", "🐱", "cat", 9, 4),
      o("book", "book", "/bʊk/", "quyển sách", "📖", "book", -4, -19),
      o("bell", "bell", "/bel/", "cái chuông", "🔔", "bell", 18, -4),
      o("tree", "tree", "/triː/", "cái cây", "🌳", null, 24, 21),
      o("sun", "sun", "/sʌn/", "mặt trời", "☀️", "sun", -24, -24, true),
      // Khu công viên + khu cửa hàng mới (đợt 3, từ vựng lớp 1 sẵn có)
      o("ball", "ball", "/bɔːl/", "quả bóng", "⚽", "ball", 30, 26),
      o("hat", "hat", "/hæt/", "cái mũ", "🧢", "hat", -30, 27),
      o("cake", "cake", "/keɪk/", "bánh kem", "🎂", "cake", 32, -26),
    ],
    extras: [
      // Xe ô tô nhiều màu cho nhiệm vụ "Find the red car!"
      o("car", "car", "/kɑː/", "xe ô tô", "🚗", "car", -20, -8, false, "blue", "car"),
      o("car", "car", "/kɑː/", "xe ô tô", "🚗", "car", 20, -12, false, "yellow", "car"),
      o("car", "car", "/kɑː/", "xe ô tô", "🚗", "car", -12, 20, false, "green", "car"),
      // Thêm 4 bạn chó cho nhiệm vụ đếm số 1–5 (cả map có 5 bạn chó)
      o("dog", "dog", "/dɒɡ/", "con chó", "🐶", "dog", 14, 20, false, undefined, "dog", 0xe8e0d0),
      o("dog", "dog", "/dɒɡ/", "con chó", "🐶", "dog", -20, 14, false, undefined, "dog", 0x6b4a2f),
      o("dog", "dog", "/dɒɡ/", "con chó", "🐶", "dog", 23, -8, false, undefined, "dog", 0xd9b48c),
      o("dog", "dog", "/dɒɡ/", "con chó", "🐶", "dog", -6, -21, false, undefined, "dog", 0x555560),
    ],
  },
  {
    id: "countryside",
    nameEn: "Countryside", nameVi: "Đồng quê", emoji: "🌾",
    descVi: "Đồng cỏ, ao cá lớn, cầu gỗ và vườn cây ăn quả — map rộng!",
    groundColor: 0x7ec850, skyColor: 0x8ed6ff,
    colorBaseId: "flower", countBaseId: "duck",
    objects: [
      o("duck", "duck", "/dʌk/", "con vịt", "🦆", "duck", -13, -7),
      o("fish", "fish", "/fɪʃ/", "con cá", "🐟", "fish", 17, 12),
      o("chicken", "chicken", "/ˈtʃɪkɪn/", "con gà", "🐔", "chicken", 7, -16),
      o("horse", "horse", "/hɔːs/", "con ngựa", "🐴", "horse", -19, 13),
      o("goat", "goat", "/ɡəʊt/", "con dê", "🐐", "goat", 20, -15),
      o("dog", "dog", "/dɒɡ/", "con chó", "🐶", "dog", -6, 19),
      o("cat", "cat", "/kæt/", "con mèo", "🐱", "cat", 23, 4),
      o("apple", "apple", "/ˈæpl/", "quả táo", "🍎", "apple", -23, -19),
      o("banana", "banana", "/bəˈnɑːnə/", "quả chuối", "🍌", "banana", 4, 22),
      o("flower", "flower", "/ˈflaʊə/", "bông hoa", "🌸", null, 12, -4),
      o("sun", "sun", "/sʌn/", "mặt trời", "☀️", "sun", 22, -24, true),
      // Khu vườn cây ăn quả mới (đợt 3, từ vựng lớp 1 sẵn có)
      o("lemon", "lemon", "/ˈlemən/", "quả chanh", "🍋", "lemon", -32, 26),
      o("frog", "frog", "/frɒɡ/", "con ếch", "🐸", "x-frog", 30, 30),
      o("grape", "grape", "/ɡreɪp/", "chùm nho", "🍇", "x-grape", 34, -22),
    ],
    extras: [
      // Thêm 4 bạn vịt cho nhiệm vụ đếm số 1–5 (cả map có 5 bạn vịt)
      o("duck", "duck", "/dʌk/", "con vịt", "🦆", "duck", -9, -11, false, undefined, "duck"),
      o("duck", "duck", "/dʌk/", "con vịt", "🦆", "duck", 18, 15, false, undefined, "duck"),
      o("duck", "duck", "/dʌk/", "con vịt", "🦆", "duck", -17, -3, false, undefined, "duck"),
      o("duck", "duck", "/dʌk/", "con vịt", "🦆", "duck", 8, 21, false, undefined, "duck"),
      // Hoa nhiều màu cho nhiệm vụ "Find the red flower!"
      o("flower", "flower", "/ˈflaʊə/", "bông hoa", "🌸", null, -2, -18, false, "red", "flower"),
      o("flower", "flower", "/ˈflaʊə/", "bông hoa", "🌸", null, 19, 19, false, "blue", "flower"),
      o("flower", "flower", "/ˈflaʊə/", "bông hoa", "🌸", null, -22, 2, false, "yellow", "flower"),
      o("flower", "flower", "/ˈflaʊə/", "bông hoa", "🌸", null, 1, 11, false, "green", "flower"),
    ],
  },
  {
    id: "beach",
    nameEn: "Beach", nameVi: "Bãi biển", emoji: "🏖️",
    descVi: "Biển xanh, cát vàng, thuyền buồm và kem mát — hoàng hôn nhẹ thật đẹp!",
    groundColor: 0xe8d8a8, skyColor: 0x8fd8f2,
    colorBaseId: "ball", countBaseId: "duck",
    objects: [
      o("sun", "sun", "/sʌn/", "mặt trời", "☀️", "sun", -24, -26, true),
      o("fish", "fish", "/fɪʃ/", "con cá", "🐟", "fish", 18, -20),
      o("hat", "hat", "/hæt/", "cái mũ", "🧢", "hat", -14, 6),
      o("ball", "ball", "/bɔːl/", "quả bóng", "⚽", "ball", 8, 14),
      o("cake", "cake", "/keɪk/", "bánh kem", "🎂", "cake", 26, 20),
      o("boat", "boat", "/bəʊt/", "con thuyền", "⛵", null, -26, -14),
      o("water", "water", "/ˈwɔːtə/", "nước", "💧", "water", 30, -8),
      o("duck", "duck", "/dʌk/", "con vịt", "🦆", "duck", -6, -24),
      o("banana", "banana", "/bəˈnɑːnə/", "quả chuối", "🍌", "banana", -28, 22),
      o("apple", "apple", "/ˈæpl/", "quả táo", "🍎", "apple", 16, 28),
      o("cat", "cat", "/kæt/", "con mèo", "🐱", "cat", -18, -2),
      o("dog", "dog", "/dɒɡ/", "con chó", "🐶", "dog", 4, -12),
    ],
    extras: [
      // Bóng nhiều màu cho nhiệm vụ "Find the red ball!"
      o("ball", "ball", "/bɔːl/", "quả bóng", "⚽", "ball", -22, 14, false, "red", "ball"),
      o("ball", "ball", "/bɔːl/", "quả bóng", "⚽", "ball", 22, 4, false, "blue", "ball"),
      o("ball", "ball", "/bɔːl/", "quả bóng", "⚽", "ball", -10, 28, false, "yellow", "ball"),
      o("ball", "ball", "/bɔːl/", "quả bóng", "⚽", "ball", 30, 30, false, "green", "ball"),
      // Thêm 4 bạn vịt cho nhiệm vụ đếm số (cả bãi có 5 bạn vịt)
      o("duck", "duck", "/dʌk/", "con vịt", "🦆", "duck", -12, -20, false, undefined, "duck"),
      o("duck", "duck", "/dʌk/", "con vịt", "🦆", "duck", 12, -26, false, undefined, "duck"),
      o("duck", "duck", "/dʌk/", "con vịt", "🦆", "duck", -30, -24, false, undefined, "duck"),
      o("duck", "duck", "/dʌk/", "con vịt", "🦆", "duck", 24, -18, false, undefined, "duck"),
    ],
  },
  {
    id: "zoo",
    nameEn: "Zoo", nameVi: "Sở thú", emoji: "🦁",
    descVi: "Sư tử, hổ, voi, khỉ và ngựa vằn — bao nhiêu bạn thú đang chờ con!",
    groundColor: 0x8fce62, skyColor: 0x8ed6ff,
    colorBaseId: "flower", countBaseId: "monkey",
    objects: [
      o("lion", "lion", "/ˈlaɪən/", "con sư tử", "🦁", "x-lion", -20, -16),
      o("tiger", "tiger", "/ˈtaɪɡə/", "con hổ", "🐯", "tiger", 18, -18),
      o("elephant", "elephant", "/ˈelɪfənt/", "con voi", "🐘", "x-elephant", -26, 10),
      o("monkey", "monkey", "/ˈmʌŋki/", "con khỉ", "🐵", "monkey", 8, -6),
      o("zebra", "zebra", "/ˈzebrə/", "ngựa vằn", "🦓", "x-zebra", 24, 12),
      o("horse", "horse", "/hɔːs/", "con ngựa", "🐴", "horse", -10, 20),
      o("goat", "goat", "/ɡəʊt/", "con dê", "🐐", "goat", 28, -4),
      o("duck", "duck", "/dʌk/", "con vịt", "🦆", "duck", 2, 26),
      o("chicken", "chicken", "/ˈtʃɪkɪn/", "con gà", "🐔", "chicken", -30, -24),
      o("frog", "frog", "/frɒɡ/", "con ếch", "🐸", "x-frog", 14, 24),
      o("flower", "flower", "/ˈflaʊə/", "bông hoa", "🌸", null, -4, -22),
      o("sun", "sun", "/sʌn/", "mặt trời", "☀️", "sun", 26, -26, true),
    ],
    extras: [
      // Thêm 4 bạn khỉ cho nhiệm vụ đếm số (cả vườn thú có 5 bạn khỉ)
      o("monkey", "monkey", "/ˈmʌŋki/", "con khỉ", "🐵", "monkey", 14, -12, false, undefined, "monkey", 0x8a5a3b),
      o("monkey", "monkey", "/ˈmʌŋki/", "con khỉ", "🐵", "monkey", -14, -8, false, undefined, "monkey", 0xa9743f),
      o("monkey", "monkey", "/ˈmʌŋki/", "con khỉ", "🐵", "monkey", 20, 22, false, undefined, "monkey", 0x6b4a2f),
      o("monkey", "monkey", "/ˈmʌŋki/", "con khỉ", "🐵", "monkey", -24, 26, false, undefined, "monkey", 0x9c7248),
      // Hoa nhiều màu cho nhiệm vụ "Find the red flower!"
      o("flower", "flower", "/ˈflaʊə/", "bông hoa", "🌸", null, 10, 8, false, "red", "flower"),
      o("flower", "flower", "/ˈflaʊə/", "bông hoa", "🌸", null, -18, 2, false, "blue", "flower"),
      o("flower", "flower", "/ˈflaʊə/", "bông hoa", "🌸", null, 30, 26, false, "yellow", "flower"),
      o("flower", "flower", "/ˈflaʊə/", "bông hoa", "🌸", null, -32, 14, false, "green", "flower"),
    ],
  },
];

const PRAISE_KEYS = ["vipraise1", "vipraise2", "vipraise3"];
const PRAISE_TEXTS = [
  "Đúng rồi! Minh Châu giỏi quá!",
  "Tuyệt vời! Con là ngôi sao!",
  "Chính xác! Cô khen con!",
];
const MISSIONS_PER_ROUND = 7; // Đợt 4: mỗi lượt 7 nhiệm vụ
const WORLD_BOUND = 38; // Đợt 3: map rộng ~2.5 lần diện tích (bán kính đi được 24 → 38)
/** Quá thời gian này chưa tìm được → vật cần tìm tự phát sáng nhấp nháy gợi ý. */
const HINT_AFTER_MS = 20000;

// ---------- Âm thanh (MP3 giọng cô + giọng hệ thống dự phòng) ----------
let currentAudio: HTMLAudioElement | null = null;

function speakDevice(text: string, lang = "en-US") {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = 0.92;
    synth.speak(u);
  } catch {
    /* bỏ qua */
  }
}

/** Đọc song ngữ: câu tiếng Việt trước, câu tiếng Anh nối tiếp trong hàng đợi. */
function speakBilingual(viText: string, enText: string) {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const u1 = new SpeechSynthesisUtterance(viText);
    u1.lang = "vi-VN";
    u1.rate = 0.95;
    const u2 = new SpeechSynthesisUtterance(enText);
    u2.lang = "en-US";
    u2.rate = 0.9;
    synth.speak(u1);
    synth.speak(u2);
  } catch {
    /* bỏ qua */
  }
}

function playKeyAudio(key: string, fallbackText: string, lang = "en-US") {
  const url = AUDIO[key];
  if (!url) {
    speakDevice(fallbackText, lang);
    return;
  }
  try {
    if (currentAudio) {
      try {
        currentAudio.pause();
      } catch {
        /* bỏ qua */
      }
    }
    const a = new Audio();
    currentAudio = a;
    a.preload = "auto";
    a.setAttribute("playsinline", "true");
    a.src = url;
    void a.play().catch(() => speakDevice(fallbackText, lang));
  } catch {
    speakDevice(fallbackText, lang);
  }
}

function playWordAudio(def: WorldObjectDef) {
  if (def.audioKey) playKeyAudio(def.audioKey, def.en, "en-US");
  else speakDevice(def.en, "en-US");
}

/** Vật có màu: cô đọc màu trước rồi đọc tên vật (vd: "red" → "car"). */
function playWordAudioChained(def: WorldObjectDef) {
  if (!def.colorId) {
    playWordAudio(def);
    return;
  }
  const c = COLORS[def.colorId];
  playKeyAudio(c.audioKey, c.en, "en-US");
  window.setTimeout(() => playWordAudio(def), 850);
}

function playPraise() {
  const i = Math.floor(Math.random() * PRAISE_KEYS.length);
  playKeyAudio(PRAISE_KEYS[i]!, PRAISE_TEXTS[i]!, "vi-VN");
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

// ---------- Chấm điểm đọc (cùng cơ chế với mục Nghe & Đọc theo cô) ----------
function normalizeSpeech(s: string): string {
  return s
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9' ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(
        prev[j]! + 1,
        cur[j - 1]! + 1,
        prev[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = cur;
  }
  return prev[n]!;
}
/** Chấm điểm câu bé đọc so với câu mẫu: 0–100 (giống hệt hàm chấm trong App). */
function scoreSpeech(target: string, heardRaw: string): number {
  const tWords = normalizeSpeech(target).split(" ").filter(Boolean);
  const hWords = normalizeSpeech(heardRaw).split(" ").filter(Boolean);
  if (tWords.length === 0 || hWords.length === 0) return 0;
  const hJoined = hWords.join(" ");
  let matched = 0;
  for (const tw of tWords) {
    if (hWords.includes(tw)) {
      matched++;
      continue;
    }
    if (hWords.some((hw) => levenshtein(hw, tw) <= 1)) matched += 0.5;
  }
  let score = (matched / tWords.length) * 100;
  const dist = levenshtein(tWords.join(" "), hJoined);
  const sim = 1 - dist / Math.max(tWords.join(" ").length, hJoined.length, 1);
  score = Math.max(score, sim * 100);
  return Math.max(0, Math.min(100, Math.round(score)));
}

// ---------- Nhận diện giọng nói (Web Speech API) ----------
interface SpeechAlt {
  transcript: string;
  confidence: number;
}
interface SpeechResultItem {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechAlt;
}
interface SpeechResultEvent {
  resultIndex: number;
  results: { length: number; [index: number]: SpeechResultItem };
}
interface SpeechErrorEvent {
  error?: string;
}
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult: ((e: SpeechResultEvent) => void) | null;
  onerror: ((e: SpeechErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
interface SpeechWindow {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
}
function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as SpeechWindow;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

// ---------- ĐỢT 5: Câu đố của cô (tiếng Việt) cho từng vật trong map ----------
// Cô đọc câu đố bằng tiếng Việt về một vật CÓ TRONG MAP; panel chỉ hiện ❓,
// không ghi đáp án — bé suy luận rồi đi tìm và bấm đúng bạn đó.
export const RIDDLE_VI: Record<string, string> = {
  bus: "Bạn này to, chở được nhiều bạn đi học và kêu bíp bíp. Là bạn nào?",
  car: "Bạn này có bốn bánh, chạy trên đường và chở cả nhà đi chơi. Là bạn nào?",
  bike: "Bạn này có hai bánh, con đạp chân là bạn ấy chạy. Là bạn nào?",
  truck: "Bạn này to khỏe, chở được rất nhiều đồ nặng. Là bạn nào?",
  dog: "Bạn này kêu gâu gâu và rất thích gặm xương. Là bạn nào?",
  cat: "Bạn này kêu meo meo và thích ăn cá. Là bạn nào?",
  book: "Bạn này có nhiều trang giấy, mở ra là đọc được bao nhiêu chuyện hay. Là bạn nào?",
  bell: "Bạn này kêu leng keng khi rung lên. Là bạn nào?",
  tree: "Bạn này cao lớn, có lá xanh và cho bóng mát. Là bạn nào?",
  sun: "Bạn này ở trên trời, tỏa nắng ấm áp mỗi buổi sáng. Là bạn nào?",
  ball: "Bạn này tròn xoe, đá hay ném đều nảy lên rất vui. Là bạn nào?",
  hat: "Bạn này đội lên đầu để che nắng. Là bạn nào?",
  cake: "Bạn này ngọt ngon, hay có nến sinh nhật cắm ở trên. Là bạn nào?",
  duck: "Bạn này kêu quạc quạc và thích bơi dưới nước. Là bạn nào?",
  fish: "Bạn này bơi trong nước và có vây. Là bạn nào?",
  chicken: "Bạn này kêu cục tác và đẻ trứng cho con ăn. Là bạn nào?",
  horse: "Bạn này chạy rất nhanh, có bờm dài và kêu hí hí. Là bạn nào?",
  goat: "Bạn này kêu be be, có sừng nhỏ và thích ăn cỏ. Là bạn nào?",
  apple: "Bạn này là trái cây tròn, màu đỏ, ăn giòn và ngọt. Là bạn nào?",
  banana: "Bạn này là trái cây dài, vỏ vàng, bóc ra ăn mềm và ngọt. Là bạn nào?",
  flower: "Bạn này nở đẹp, có nhiều màu và thơm thơm trong vườn. Là bạn nào?",
  lemon: "Bạn này là trái cây màu vàng, vị chua chua. Là bạn nào?",
  frog: "Bạn này màu xanh, nhảy rất xa và kêu ộp ộp. Là bạn nào?",
  grape: "Bạn này là trái cây mọc thành chùm, quả nhỏ tròn màu tím. Là bạn nào?",
  boat: "Bạn này đi trên mặt nước, có buồm trắng căng gió. Là bạn nào?",
  water: "Bạn này trong veo, con uống vào khi khát. Là bạn nào?",
  lion: "Bạn này là vua của muôn thú, có bờm to và gầm rất lớn. Là bạn nào?",
  tiger: "Bạn này có vằn đen cam, chạy nhanh và là bạn mèo to nhất. Là bạn nào?",
  elephant: "Bạn này to nhất trên cạn, có vòi dài và tai thật to. Là bạn nào?",
  monkey: "Bạn này leo cây rất giỏi, thích ăn chuối và hay làm trò cười. Là bạn nào?",
  zebra: "Bạn này giống ngựa nhưng mặc áo sọc đen trắng. Là bạn nào?",
};
export function riddleFor(def: WorldObjectDef): string {
  return RIDDLE_VI[def.id] ?? `Bạn này là một bạn trong nơi này: ${def.vi}. Con đoán xem là bạn nào?`;
}

// ---------- Nhiệm vụ: các dạng pha trộn mỗi lượt (đợt 5 thêm Câu đố) ----------
export type Mission =
  | { kind: "find"; def: WorldObjectDef }
  | { kind: "listen"; def: WorldObjectDef }
  | { kind: "hide"; def: WorldObjectDef }
  | { kind: "riddle"; def: WorldObjectDef; riddleVi: string }
  | { kind: "color"; baseId: string; colorId: ColorId; sample: WorldObjectDef; targetDef: WorldObjectDef }
  | { kind: "count"; baseId: string; need: number; sample: WorldObjectDef };

/** Khóa duy nhất của từng vật thể trong thế giới (vật phụ trùng id với vật chính). */
export function instKey(def: WorldObjectDef): string {
  return `${def.id}|${def.en}|${def.x}|${def.z}`;
}
/** Khóa dùng cho Sổ Khám Phá — chỉ vật chính, theo map. */
export function bookKey(def: WorldObjectDef): string {
  return def.id + def.en;
}
/** Nhóm của một vật: xe màu vẫn thuộc nhóm "car", vịt phụ vẫn thuộc nhóm "duck". */
export function groupOf(def: WorldObjectDef): string {
  return def.variantOf ?? def.id;
}
export function allDefs(m: MapDef): WorldObjectDef[] {
  return [...m.objects, ...m.extras];
}

function plural(en: string): string {
  return `${en}s`;
}

/** Dựng 1 lượt 7 nhiệm vụ: 2 tìm vật + 1 màu + 1 đếm + 1 nghe-tìm + 1 tìm bạn trốn + 1 câu đố, xáo trộn. */
export function buildRound(m: MapDef): Mission[] {
  const pool = shuffle(m.objects.filter((d) => !d.inSky));
  const finds: Mission[] = pool.slice(0, 2).map((def) => ({ kind: "find", def }));
  const missions: Mission[] = [...finds];
  const listenDef = pool[2];
  if (listenDef) missions.push({ kind: "listen", def: listenDef });
  const hideDef = pool[3];
  if (hideDef) missions.push({ kind: "hide", def: hideDef });
  const riddleDef = pool[4];
  if (riddleDef) missions.push({ kind: "riddle", def: riddleDef, riddleVi: riddleFor(riddleDef) });

  const colorId = COLOR_IDS[Math.floor(Math.random() * COLOR_IDS.length)]!;
  // Tìm đích trong cả vật chính + vật phụ: xe đỏ là vật chính của map Thành phố.
  const colorTarget = allDefs(m).find(
    (d) => groupOf(d) === m.colorBaseId && d.colorId === colorId,
  );
  const colorSample = m.objects.find((d) => d.id === m.colorBaseId);
  if (colorTarget && colorSample) {
    missions.push({
      kind: "color", baseId: m.colorBaseId, colorId,
      sample: colorSample, targetDef: colorTarget,
    });
  }

  const group = allDefs(m).filter((d) => groupOf(d) === m.countBaseId);
  const countSample = m.objects.find((d) => d.id === m.countBaseId) ?? group[0];
  if (countSample && group.length >= 2) {
    // Số cần đếm chạy đủ dải 1–5 của lớp 1 (mỗi nhóm đếm có 5 bạn trong map).
    const need = 1 + Math.floor(Math.random() * Math.min(5, group.length));
    missions.push({ kind: "count", baseId: m.countBaseId, need, sample: countSample });
  }

  // Dự phòng: nếu thiếu nhiệm vụ màu/đếm thì bù bằng nhiệm vụ tìm vật.
  const used = new Set(
    missions.map((x) => (x.kind === "color" || x.kind === "count" ? x.sample : x.def)),
  );
  for (const def of shuffle(m.objects)) {
    if (missions.length >= MISSIONS_PER_ROUND) break;
    if (!used.has(def)) missions.push({ kind: "find", def });
  }
  return shuffle(missions).slice(0, MISSIONS_PER_ROUND);
}

/** Tiêu đề nhiệm vụ để hiển thị + đọc cho bé nghe. */
export function missionText(mis: Mission): {
  enTitle: string; viTitle: string; emoji: string; speakVi: string; speakEn: string;
} {
  if (mis.kind === "find") {
    return {
      enTitle: `Find the ${mis.def.en}!`,
      viTitle: `Hãy tìm và bấm vào: ${mis.def.vi}`,
      emoji: mis.def.emoji,
      speakVi: `Nhiệm vụ mới! Con hãy tìm và bấm vào ${mis.def.vi} nhé!`,
      speakEn: `Find the ${mis.def.en}!`,
    };
  }
  if (mis.kind === "listen") {
    // Nghe và tìm: panel KHÔNG ghi tên vật — bé phải nghe cô đọc tiếng Anh.
    return {
      enTitle: "Listen and find! 👂",
      viTitle: "Nghe cô đọc rồi tìm bạn đó nhé!",
      emoji: "👂",
      speakVi: "Nhiệm vụ mới! Con nghe cô đọc tiếng Anh rồi tìm bạn đó nhé!",
      speakEn: `Find the ${mis.def.en}!`,
    };
  }
  if (mis.kind === "hide") {
    // Tìm bạn đang trốn: không lộ danh tính trên panel.
    return {
      enTitle: "Find the hiding friend! 🫣",
      viTitle: "Có một bạn đang trốn — tìm bạn ấy nhé!",
      emoji: "🫣",
      speakVi: "Nhiệm vụ mới! Có một bạn đang trốn trong này, con tìm bạn ấy nhé!",
      speakEn: "Find the hiding friend!",
    };
  }
  if (mis.kind === "riddle") {
    // Câu đố của cô: panel chỉ hiện ❓, đáp án chỉ có trong lời đọc tiếng Việt.
    return {
      enTitle: "Riddle time! 🤔",
      viTitle: "Câu đố của cô — nghe kỹ rồi đoán nhé!",
      emoji: "❓",
      speakVi: `Câu đố của cô! ${mis.riddleVi}`,
      speakEn: "Can you guess who I am?",
    };
  }
  if (mis.kind === "color") {
    const c = COLORS[mis.colorId];
    return {
      enTitle: `Find the ${c.en} ${mis.sample.en}!`,
      viTitle: `Hãy tìm ${mis.sample.vi} màu ${c.vi}!`,
      emoji: mis.sample.emoji,
      speakVi: `Nhiệm vụ mới! Con hãy tìm ${mis.sample.vi} màu ${c.vi} nhé!`,
      speakEn: `Find the ${c.en} ${mis.sample.en}!`,
    };
  }
  return {
    enTitle: `How many ${plural(mis.sample.en)}? Tap ${mis.need} ${plural(mis.sample.en)}!`,
    viTitle: `Hãy bấm vào ${mis.need} ${mis.sample.vi} nhé!`,
    emoji: mis.sample.emoji,
    speakVi: `Nhiệm vụ mới! Con hãy bấm vào ${mis.need} ${mis.sample.vi} nhé!`,
    speakEn: `How many ${plural(mis.sample.en)}? Tap ${mis.need} ${plural(mis.sample.en)}!`,
  };
}

/** Vật mà mũi tên chỉ đường / gợi ý phát sáng cần dẫn tới (nhiệm vụ đếm: bạn chưa đếm gần nhất còn lại). */
export function missionTargetDef(
  mis: Mission, counted: ReadonlySet<string>, m: MapDef,
): WorldObjectDef | null {
  if (mis.kind === "find" || mis.kind === "listen" || mis.kind === "hide" || mis.kind === "riddle") return mis.def;
  if (mis.kind === "color") return mis.targetDef;
  return (
    allDefs(m).find((d) => groupOf(d) === mis.baseId && !counted.has(instKey(d))) ?? null
  );
}
function mat(color: number, emissive = 0): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.85,
    metalness: 0,
    emissive,
    emissiveIntensity: emissive ? 0.55 : 0,
  });
}

function box(
  g: THREE.Group, w: number, h: number, d: number, color: number,
  x: number, y: number, z: number, rz = 0, rx = 0,
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  m.position.set(x, y, z);
  m.rotation.z = rz;
  m.rotation.x = rx;
  m.castShadow = true;
  g.add(m);
  return m;
}

function ball(
  g: THREE.Group, r: number, color: number,
  x: number, y: number, z: number,
  sx = 1, sy = 1, sz = 1, emissive = 0,
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 18), mat(color, emissive));
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  m.castShadow = true;
  g.add(m);
  return m;
}

function cyl(
  g: THREE.Group, rt: number, rb: number, h: number, color: number,
  x: number, y: number, z: number, rx = 0, rz = 0,
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 18), mat(color));
  m.position.set(x, y, z);
  m.rotation.x = rx;
  m.rotation.z = rz;
  m.castShadow = true;
  g.add(m);
  return m;
}

function cone(
  g: THREE.Group, r: number, h: number, color: number,
  x: number, y: number, z: number, rx = 0, rz = 0,
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 18), mat(color));
  m.position.set(x, y, z);
  m.rotation.x = rx;
  m.rotation.z = rz;
  m.castShadow = true;
  g.add(m);
  return m;
}

/** Ống nối 2 điểm — dùng cho khung xe đạp, cổ ngựa… */
function tube(
  g: THREE.Group, a: THREE.Vector3, b: THREE.Vector3, r: number, color: number,
) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 10), mat(color));
  m.position.copy(a).addScaledVector(dir, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  m.castShadow = true;
  g.add(m);
}

function wheel(g: THREE.Group, x: number, z: number, r = 0.55) {
  cyl(g, r, r, 0.22, 0x333344, x, r, z, Math.PI / 2);
  cyl(g, r * 0.4, r * 0.4, 0.26, 0xcccccc, x, r, z, Math.PI / 2);
}

/** Vòng sáng dưới chân vật — hiện khi bé đến gần / vật được chọn. */
function makeRing(color: number): THREE.Mesh {
  const m = new THREE.Mesh(
    new THREE.RingGeometry(1.5, 1.95, 40),
    new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false,
    }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.06;
  return m;
}

// ----- Từng đồ vật -----
function buildBus(): THREE.Group {
  const g = new THREE.Group();
  box(g, 5.2, 2.1, 2.2, 0xffc53d, 0, 1.65, 0);
  box(g, 5.3, 0.5, 2.3, 0xff9f45, 0, 0.75, 0);
  for (const wx of [-1.9, -0.65, 0.65, 1.9]) box(g, 1.0, 0.8, 0.06, 0xbfefff, wx, 2.0, 1.12);
  box(g, 0.06, 1.5, 1.6, 0xbfefff, 2.62, 1.7, 0);
  wheel(g, -1.7, 1.05); wheel(g, 1.7, 1.05); wheel(g, -1.7, -1.05); wheel(g, 1.7, -1.05);
  return g;
}

function buildCar(body = 0xff5d5d, cabin = 0xff7b7b): THREE.Group {
  const g = new THREE.Group();
  box(g, 3.6, 0.85, 1.9, body, 0, 0.75, 0);
  box(g, 1.9, 0.8, 1.7, cabin, -0.15, 1.5, 0);
  box(g, 1.7, 0.55, 0.06, 0xbfefff, -0.15, 1.55, 0.87);
  box(g, 0.06, 0.55, 1.4, 0xbfefff, 0.82, 1.55, 0);
  wheel(g, -1.15, 0.95, 0.45); wheel(g, 1.15, 0.95, 0.45);
  wheel(g, -1.15, -0.95, 0.45); wheel(g, 1.15, -0.95, 0.45);
  ball(g, 0.13, 0xfff6a5, 1.82, 0.85, 0.55, 1, 1, 1, 0xfff6a5);
  ball(g, 0.13, 0xfff6a5, 1.82, 0.85, -0.55, 1, 1, 1, 0xfff6a5);
  return g;
}

function buildTruck(): THREE.Group {
  const g = new THREE.Group();
  box(g, 3.4, 2.4, 2.2, 0xffffff, -0.9, 1.85, 0);
  box(g, 3.4, 0.5, 2.24, 0x4cc9f0, -0.9, 2.9, 0);
  box(g, 1.5, 1.5, 2.0, 0x2ec4b6, 1.95, 1.3, 0);
  box(g, 0.06, 0.8, 1.5, 0xbfefff, 2.72, 1.6, 0);
  wheel(g, -1.7, 1.05, 0.55); wheel(g, 0.2, 1.05, 0.55); wheel(g, 1.9, 1.05, 0.55);
  wheel(g, -1.7, -1.05, 0.55); wheel(g, 0.2, -1.05, 0.55); wheel(g, 1.9, -1.05, 0.55);
  return g;
}

function buildBike(): THREE.Group {
  const g = new THREE.Group();
  const tire = (x: number) => {
    const t = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.09, 12, 28), mat(0x333344));
    t.position.set(x, 0.62, 0);
    t.castShadow = true;
    g.add(t);
    ball(g, 0.12, 0xcccccc, x, 0.62, 0);
  };
  tire(-0.95); tire(0.95);
  tube(g, new THREE.Vector3(-0.95, 0.62, 0), new THREE.Vector3(-0.15, 1.25, 0), 0.07, 0xff5d8f);
  tube(g, new THREE.Vector3(-0.15, 1.25, 0), new THREE.Vector3(0.35, 0.7, 0), 0.07, 0xff5d8f);
  tube(g, new THREE.Vector3(0.35, 0.7, 0), new THREE.Vector3(-0.95, 0.62, 0), 0.07, 0xff5d8f);
  tube(g, new THREE.Vector3(0.35, 0.7, 0), new THREE.Vector3(0.95, 0.62, 0), 0.07, 0xff5d8f);
  tube(g, new THREE.Vector3(0.75, 1.35, 0), new THREE.Vector3(0.95, 0.62, 0), 0.07, 0xff5d8f);
  box(g, 0.55, 0.1, 0.3, 0x7a4a21, -0.25, 1.32, 0);
  tube(g, new THREE.Vector3(0.75, 1.35, -0.35), new THREE.Vector3(0.75, 1.35, 0.35), 0.06, 0x333344);
  box(g, 0.7, 0.45, 0.55, 0xffc53d, -1.25, 1.15, 0);
  g.scale.setScalar(1.35);
  return g;
}

function buildDog(color = 0xb08968): THREE.Group {
  const g = new THREE.Group();
  ball(g, 0.78, color, 0, 0.85, 0, 0.78, 0.72, 1.15);
  ball(g, 0.44, color, 0, 1.25, 0.95);
  box(g, 0.34, 0.26, 0.34, 0xd9b48c, 0, 1.12, 1.3);
  ball(g, 0.09, 0x333333, 0, 1.2, 1.48);
  ball(g, 0.08, 0x222222, 0.16, 1.38, 1.3);
  ball(g, 0.08, 0x222222, -0.16, 1.38, 1.3);
  box(g, 0.18, 0.5, 0.3, 0x8a6642, 0.42, 1.35, 0.85, 0.25);
  box(g, 0.18, 0.5, 0.3, 0x8a6642, -0.42, 1.35, 0.85, -0.25);
  for (const [lx, lz] of [[0.35, 0.5], [-0.35, 0.5], [0.35, -0.55], [-0.35, -0.55]] as const)
    cyl(g, 0.11, 0.11, 0.55, 0x8a6642, lx, 0.28, lz);
  cyl(g, 0.08, 0.05, 0.7, color, 0, 1.05, -1.05, -0.8);
  cyl(g, 0.3, 0.34, 0.28, 0xff5d8f, 0, 1.02, 0.62, Math.PI / 2);
  return g;
}

function buildCat(color = 0xff9f45): THREE.Group {
  const g = new THREE.Group();
  ball(g, 0.6, color, 0, 0.68, 0, 0.75, 0.7, 1.1);
  ball(g, 0.38, color, 0, 1.05, 0.72);
  cone(g, 0.16, 0.34, color, 0.24, 1.48, 0.66, 0, 0.2);
  cone(g, 0.16, 0.34, color, -0.24, 1.48, 0.66, 0, -0.2);
  ball(g, 0.07, 0x222222, 0.13, 1.12, 1.06);
  ball(g, 0.07, 0x222222, -0.13, 1.12, 1.06);
  ball(g, 0.07, 0xff8fab, 0, 0.98, 1.1);
  for (const [lx, lz] of [[0.28, 0.4], [-0.28, 0.4], [0.28, -0.45], [-0.28, -0.45]] as const)
    cyl(g, 0.09, 0.09, 0.42, color, lx, 0.21, lz);
  tube(g, new THREE.Vector3(0, 0.75, -0.7), new THREE.Vector3(0.15, 1.5, -1.0), 0.07, color);
  ball(g, 0.1, 0xfff3e4, 0.15, 1.55, -1.0);
  return g;
}

function buildDuck(): THREE.Group {
  const g = new THREE.Group();
  ball(g, 0.62, 0xffd93d, 0, 0.62, 0, 0.85, 0.75, 1.1);
  ball(g, 0.36, 0xffd93d, 0, 1.18, 0.55);
  cone(g, 0.16, 0.42, 0xff9f45, 0, 1.14, 1.05, Math.PI / 2);
  ball(g, 0.07, 0x222222, 0.14, 1.3, 0.82);
  ball(g, 0.07, 0x222222, -0.14, 1.3, 0.82);
  cone(g, 0.22, 0.5, 0xffd93d, 0, 0.85, -0.75, -Math.PI / 2.5);
  cyl(g, 0.05, 0.05, 0.3, 0xff9f45, 0.2, 0.15, 0.15);
  cyl(g, 0.05, 0.05, 0.3, 0xff9f45, -0.2, 0.15, 0.15);
  g.scale.setScalar(1.25);
  return g;
}

function buildChicken(): THREE.Group {
  const g = new THREE.Group();
  ball(g, 0.62, 0xffffff, 0, 0.7, 0, 0.85, 0.8, 1.05);
  ball(g, 0.34, 0xffffff, 0, 1.28, 0.5);
  cone(g, 0.13, 0.36, 0xff9f45, 0, 1.22, 0.92, Math.PI / 2);
  ball(g, 0.11, 0xff4444, 0, 1.62, 0.48);
  ball(g, 0.09, 0xff4444, 0.12, 1.56, 0.5);
  ball(g, 0.09, 0xff4444, -0.12, 1.56, 0.5);
  ball(g, 0.09, 0xff4444, 0, 1.05, 0.78, 1, 1.3, 1);
  ball(g, 0.06, 0x222222, 0.13, 1.36, 0.76);
  ball(g, 0.06, 0x222222, -0.13, 1.36, 0.76);
  box(g, 0.5, 0.55, 0.12, 0xf2e6c9, 0, 1.0, -0.68, 0, -0.5);
  cyl(g, 0.04, 0.04, 0.35, 0xff9f45, 0.18, 0.18, 0.1);
  cyl(g, 0.04, 0.04, 0.35, 0xff9f45, -0.18, 0.18, 0.1);
  g.scale.setScalar(1.2);
  return g;
}

function buildHorse(): THREE.Group {
  const g = new THREE.Group();
  ball(g, 0.85, 0x9c6644, 0, 1.35, 0, 0.72, 0.72, 1.25);
  tube(g, new THREE.Vector3(0, 1.6, 0.85), new THREE.Vector3(0, 2.35, 1.35), 0.26, 0x9c6644);
  box(g, 0.45, 0.5, 0.95, 0x9c6644, 0, 2.5, 1.6, 0, 0.35);
  box(g, 0.3, 0.3, 0.4, 0xc89b6d, 0, 2.32, 2.05);
  cone(g, 0.13, 0.3, 0x9c6644, 0.18, 2.85, 1.4, 0, 0.15);
  cone(g, 0.13, 0.3, 0x9c6644, -0.18, 2.85, 1.4, 0, -0.15);
  box(g, 0.16, 0.9, 0.4, 0x5f4128, 0, 2.25, 1.05, 0, 0.6);
  for (const [lx, lz] of [[0.35, 0.65], [-0.35, 0.65], [0.35, -0.7], [-0.35, -0.7]] as const)
    cyl(g, 0.11, 0.09, 1.05, 0x9c6644, lx, 0.53, lz);
  tube(g, new THREE.Vector3(0, 1.55, -1.05), new THREE.Vector3(0, 0.75, -1.35), 0.09, 0x5f4128);
  return g;
}

function buildGoat(): THREE.Group {
  const g = new THREE.Group();
  ball(g, 0.7, 0xf1f1ea, 0, 1.0, 0, 0.72, 0.7, 1.1);
  box(g, 0.42, 0.48, 0.62, 0xf1f1ea, 0, 1.5, 0.85, 0, 0.2);
  box(g, 0.3, 0.26, 0.3, 0xd9d9cf, 0, 1.32, 1.2);
  cone(g, 0.09, 0.45, 0xcbb590, 0.2, 1.95, 0.7, -0.5, 0.3);
  cone(g, 0.09, 0.45, 0xcbb590, -0.2, 1.95, 0.7, -0.5, -0.3);
  ball(g, 0.07, 0x222222, 0.17, 1.58, 1.12);
  ball(g, 0.07, 0x222222, -0.17, 1.58, 1.12);
  box(g, 0.14, 0.3, 0.1, 0xd9d9cf, 0, 1.08, 1.18);
  for (const [lx, lz] of [[0.3, 0.5], [-0.3, 0.5], [0.3, -0.55], [-0.3, -0.55]] as const)
    cyl(g, 0.09, 0.08, 0.7, 0xe4e4da, lx, 0.35, lz);
  return g;
}

function buildFish(): THREE.Group {
  const g = new THREE.Group();
  ball(g, 0.55, 0xff8c42, 0, 0.35, 0, 0.85, 0.5, 1.25);
  cone(g, 0.34, 0.55, 0xff6b35, 0, 0.35, -0.95, -Math.PI / 2);
  ball(g, 0.08, 0x222222, 0.2, 0.48, 0.5);
  ball(g, 0.08, 0x222222, -0.2, 0.48, 0.5);
  cone(g, 0.2, 0.3, 0xff6b35, 0, 0.75, -0.1, 0);
  g.scale.setScalar(1.5);
  return g;
}

function buildApple(): THREE.Group {
  const g = new THREE.Group();
  cyl(g, 0.75, 0.9, 0.35, 0x7a4a21, 0, 0.18, 0);
  ball(g, 1.0, 0xff4444, 0, 1.35, 0, 1, 0.92, 1, 0xff4444);
  cyl(g, 0.07, 0.09, 0.55, 0x7a4a21, 0, 2.35, 0, 0, 0.15);
  ball(g, 0.32, 0x2ec4b6, 0.35, 2.5, 0, 1.3, 0.45, 0.8);
  ball(g, 0.22, 0xffffff, -0.35, 1.7, 0.85, 1, 1, 0.4);
  return g;
}

function buildBanana(): THREE.Group {
  const g = new THREE.Group();
  cyl(g, 0.8, 0.95, 0.3, 0x7a4a21, 0, 0.15, 0);
  const b = new THREE.Mesh(
    new THREE.TorusGeometry(0.85, 0.3, 14, 24, Math.PI * 0.95),
    mat(0xffd93d, 0xffd93d),
  );
  b.position.set(0, 1.15, 0);
  b.rotation.z = Math.PI * 0.55;
  b.castShadow = true;
  g.add(b);
  cyl(g, 0.09, 0.09, 0.4, 0x7a4a21, 0.78, 2.0, 0, 0, -0.4);
  g.scale.setScalar(1.2);
  return g;
}

function buildBook(): THREE.Group {
  const g = new THREE.Group();
  box(g, 2.4, 0.35, 1.7, 0x7a4a21, 0, 0.18, 0);
  box(g, 2.0, 2.6, 0.42, 0xff5d8f, -0.35, 1.65, 0, 0.18);
  box(g, 1.8, 2.4, 0.46, 0xffffff, -0.32, 1.65, 0.02, 0.18);
  box(g, 2.0, 2.6, 0.42, 0x4cc9f0, 0.55, 1.65, -0.15, -0.14);
  box(g, 0.9, 0.28, 0.5, 0xffc53d, -0.38, 2.2, 0.26, 0.18);
  return g;
}

function buildBell(): THREE.Group {
  const g = new THREE.Group();
  cyl(g, 0.12, 0.12, 3.0, 0x7a4a21, 0, 1.5, 0);
  box(g, 1.5, 0.18, 0.5, 0x7a4a21, 0, 3.05, 0);
  const bell = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.95, 1.15, 22),
    mat(0xffc53d, 0xffc53d),
  );
  bell.position.set(0, 2.3, 0);
  bell.castShadow = true;
  g.add(bell);
  ball(g, 0.2, 0xffc53d, 0, 2.95, 0, 1, 1, 1, 0xffc53d);
  ball(g, 0.16, 0xb8860b, 0, 1.65, 0);
  g.scale.setScalar(1.15);
  return g;
}

function buildTree(): THREE.Group {
  const g = new THREE.Group();
  cyl(g, 0.28, 0.4, 1.9, 0x7a4a21, 0, 0.95, 0);
  ball(g, 1.35, 0x3fa34d, 0, 2.9, 0);
  ball(g, 0.95, 0x4cb944, 0.9, 2.3, 0.3);
  ball(g, 0.9, 0x359744, -0.85, 2.4, -0.25);
  ball(g, 0.22, 0xff4444, 0.6, 2.7, 0.95);
  ball(g, 0.22, 0xff4444, -0.7, 3.1, 0.8);
  ball(g, 0.22, 0xff9f45, 0.1, 2.2, 1.05);
  return g;
}

function buildFlower(petal = 0xff8fab): THREE.Group {
  const g = new THREE.Group();
  cyl(g, 0.09, 0.11, 1.7, 0x3fa34d, 0, 0.85, 0);
  ball(g, 0.3, 0x3fa34d, 0.3, 0.7, 0, 1.4, 0.4, 0.7);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ball(g, 0.34, petal, Math.cos(a) * 0.52, 1.95 + Math.sin(a) * 0.1, Math.sin(a) * 0.52 * 0.4 + 0.1, 1, 1, 1);
  }
  ball(g, 0.3, 0xffc53d, 0, 1.95, 0.18, 1, 1, 0.7, 0xffc53d);
  g.scale.setScalar(1.3);
  return g;
}

function buildSun(): THREE.Group {
  const g = new THREE.Group();
  ball(g, 1.5, 0xffd93d, 0, 0, 0, 1, 1, 1, 0xffd93d);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const ray = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.9, 8), mat(0xffc53d, 0xffc53d));
    ray.position.set(Math.cos(a) * 2.0, Math.sin(a) * 2.0, 0);
    ray.rotation.z = a - Math.PI / 2;
    g.add(ray);
  }
  return g;
}

function buildBall(base = 0xffffff): THREE.Group {
  const g = new THREE.Group();
  ball(g, 0.95, base, 0, 0.95, 0);
  for (const [x, y, z] of [[0.55, 1.45, 0.55], [-0.6, 1.3, 0.5], [0, 0.55, 0.85], [0.7, 0.7, -0.55], [-0.7, 0.7, -0.5]] as const)
    ball(g, 0.28, 0x222233, x, y, z, 1, 1, 0.55);
  return g;
}
function buildHat(): THREE.Group {
  const g = new THREE.Group();
  cyl(g, 0.55, 0.62, 0.35, 0x7a4a21, 0, 0.18, 0);
  cyl(g, 1.05, 1.05, 0.14, 0x4cc9f0, 0, 0.55, 0);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.78, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), mat(0x4cc9f0));
  dome.position.y = 0.6; dome.castShadow = true; g.add(dome);
  box(g, 0.9, 0.12, 0.6, 0x2f7fb8, 0, 0.52, 0.95);
  ball(g, 0.14, 0xffc53d, 0, 1.38, 0, 1, 1, 1, 0xffc53d);
  g.scale.setScalar(1.35);
  return g;
}
function buildCake(): THREE.Group {
  const g = new THREE.Group();
  cyl(g, 1.15, 1.25, 0.25, 0xd9d9d9, 0, 0.13, 0);
  cyl(g, 1.0, 1.0, 0.75, 0xff8fab, 0, 0.62, 0);
  cyl(g, 0.72, 0.72, 0.6, 0xffffff, 0, 1.3, 0);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    ball(g, 0.16, 0xff4444, Math.cos(a) * 0.5, 1.68, Math.sin(a) * 0.5, 1, 1, 1, 0xff4444);
  }
  for (const x of [-0.3, 0, 0.3]) {
    cyl(g, 0.05, 0.05, 0.5, 0xffc53d, x, 1.95, 0);
    ball(g, 0.09, 0xff9f45, x, 2.28, 0, 1, 1.3, 1, 0xff9f45);
  }
  return g;
}
function buildLemon(): THREE.Group {
  const g = new THREE.Group();
  cyl(g, 0.75, 0.9, 0.35, 0x7a4a21, 0, 0.18, 0);
  ball(g, 0.95, 0xffd93d, 0, 1.3, 0, 1.15, 0.9, 0.95, 0xffd93d);
  ball(g, 0.22, 0xffd93d, 1.05, 1.3, 0);
  ball(g, 0.3, 0x2ec4b6, 0.3, 2.2, 0, 1.3, 0.4, 0.8);
  return g;
}
function buildFrog(): THREE.Group {
  const g = new THREE.Group();
  ball(g, 0.75, 0x51cf66, 0, 0.55, 0, 1.1, 0.75, 1);
  ball(g, 0.55, 0x51cf66, 0, 0.95, 0.35);
  for (const s of [1, -1]) {
    ball(g, 0.2, 0xffffff, 0.3 * s, 1.35, 0.55);
    ball(g, 0.1, 0x222222, 0.3 * s, 1.4, 0.7);
    ball(g, 0.32, 0x40b657, 0.75 * s, 0.3, 0.55, 1.2, 0.5, 1);
    ball(g, 0.28, 0x40b657, 0.7 * s, 0.28, -0.55, 1.1, 0.5, 1);
  }
  ball(g, 0.4, 0xd3f9d8, 0, 0.45, 0.62, 1, 0.7, 0.5);
  g.scale.setScalar(1.3);
  return g;
}
function buildGrape(): THREE.Group {
  const g = new THREE.Group();
  cyl(g, 0.8, 0.95, 0.3, 0x7a4a21, 0, 0.15, 0);
  cyl(g, 0.07, 0.09, 0.6, 0x7a4a21, 0, 2.15, 0, 0, 0.2);
  ball(g, 0.3, 0x2ec4b6, 0.35, 2.35, 0, 1.3, 0.45, 0.8);
  const pts: [number, number, number][] = [
    [0, 1.75, 0], [0.45, 1.6, 0.2], [-0.45, 1.6, -0.15], [0.2, 1.6, -0.4], [-0.2, 1.6, 0.4],
    [0.3, 1.25, 0], [-0.3, 1.25, 0.15], [0, 1.25, -0.35], [0.15, 0.9, 0.1], [-0.15, 0.9, -0.1], [0, 0.6, 0],
  ];
  for (const [x, y, z] of pts) ball(g, 0.3, 0x845ef7, x, y, z, 1, 1, 1, 0x845ef7);
  return g;
}

function buildBoat(): THREE.Group {
  const g = new THREE.Group();
  box(g, 3.4, 0.7, 1.5, 0xd9480f, 0, 0.55, 0);
  box(g, 2.6, 0.5, 1.2, 0xff8c42, 0, 1.05, 0);
  cyl(g, 0.07, 0.09, 3.0, 0x7a4a21, 0, 2.2, 0);
  const sail = new THREE.Mesh(new THREE.BufferGeometry(), mat(0xffffff));
  const verts = new Float32Array([0, 1.2, 0, 0, 3.4, 0, 1.5, 1.2, 0]);
  sail.geometry.setAttribute("position", new THREE.BufferAttribute(verts, 3));
  sail.geometry.computeVertexNormals();
  (sail.material as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
  sail.castShadow = true;
  g.add(sail);
  ball(g, 0.16, 0xff4444, 0, 3.85, 0, 1, 1, 1, 0xff4444);
  return g;
}
function buildWaterBottle(): THREE.Group {
  const g = new THREE.Group();
  cyl(g, 0.62, 0.68, 1.9, 0x4cc9f0, 0, 1.05, 0);
  cyl(g, 0.3, 0.55, 0.5, 0x4cc9f0, 0, 2.2, 0);
  cyl(g, 0.32, 0.32, 0.28, 0xff5d8f, 0, 2.55, 0);
  box(g, 1.28, 0.7, 0.06, 0xffffff, 0, 1.1, 0.66);
  ball(g, 0.2, 0xffffff, -0.3, 1.55, 0.6, 1, 1.4, 0.5);
  g.scale.setScalar(1.2);
  return g;
}
function buildMonkey(tint = 0x9c6644): THREE.Group {
  const g = new THREE.Group();
  ball(g, 0.62, tint, 0, 0.85, 0, 0.8, 0.85, 0.9);
  ball(g, 0.42, tint, 0, 1.75, 0.1);
  ball(g, 0.3, 0xf2d5b8, 0, 1.68, 0.32, 1, 0.85, 0.7);
  ball(g, 0.16, 0xf2d5b8, 0.42, 1.85, 0.05);
  ball(g, 0.16, 0xf2d5b8, -0.42, 1.85, 0.05);
  ball(g, 0.07, 0x222222, 0.13, 1.78, 0.55);
  ball(g, 0.07, 0x222222, -0.13, 1.78, 0.55);
  ball(g, 0.45, 0xf2d5b8, 0, 0.8, 0.42, 1, 1, 0.5);
  tube(g, new THREE.Vector3(0, 0.9, -0.5), new THREE.Vector3(0.5, 1.9, -0.9), 0.08, tint);
  tube(g, new THREE.Vector3(0.45, 1.15, 0.1), new THREE.Vector3(0.95, 1.8, 0.2), 0.09, tint);
  tube(g, new THREE.Vector3(-0.45, 1.15, 0.1), new THREE.Vector3(-0.8, 0.5, 0.2), 0.09, tint);
  cyl(g, 0.1, 0.1, 0.55, tint, 0.3, 0.28, 0.2);
  cyl(g, 0.1, 0.1, 0.55, tint, -0.3, 0.28, 0.2);
  g.scale.setScalar(1.25);
  return g;
}
function buildTiger(): THREE.Group {
  const g = new THREE.Group();
  ball(g, 0.8, 0xff9f45, 0, 0.95, 0, 0.75, 0.7, 1.2);
  ball(g, 0.46, 0xff9f45, 0, 1.35, 0.95);
  ball(g, 0.3, 0xfff3e4, 0, 1.2, 1.28, 1, 0.8, 0.6);
  cone(g, 0.15, 0.3, 0xff9f45, 0.26, 1.82, 0.9, 0, 0.15);
  cone(g, 0.15, 0.3, 0xff9f45, -0.26, 1.82, 0.9, 0, -0.15);
  ball(g, 0.08, 0x222222, 0.15, 1.45, 1.32);
  ball(g, 0.08, 0x222222, -0.15, 1.45, 1.32);
  for (const sx of [-0.5, 0, 0.5]) box(g, 0.14, 0.5, 1.0, 0x333333, sx, 1.05, -0.05, sx * 0.2);
  for (const [lx, lz] of [[0.35, 0.6], [-0.35, 0.6], [0.35, -0.65], [-0.35, -0.65]] as const)
    cyl(g, 0.12, 0.11, 0.6, 0xff9f45, lx, 0.3, lz);
  tube(g, new THREE.Vector3(0, 1.1, -1.0), new THREE.Vector3(0.2, 1.8, -1.4), 0.08, 0xff9f45);
  g.scale.setScalar(1.2);
  return g;
}
function buildElephant(): THREE.Group {
  const g = new THREE.Group();
  ball(g, 1.05, 0x9db2c8, 0, 1.5, 0, 0.9, 0.85, 1.05);
  ball(g, 0.62, 0x9db2c8, 0, 1.85, 1.0);
  tube(g, new THREE.Vector3(0, 1.7, 1.45), new THREE.Vector3(0, 0.8, 1.75), 0.16, 0x9db2c8);
  ball(g, 0.42, 0xbcccdc, 0.62, 1.9, 0.95, 0.35, 1, 0.9);
  ball(g, 0.42, 0xbcccdc, -0.62, 1.9, 0.95, 0.35, 1, 0.9);
  ball(g, 0.08, 0x222222, 0.25, 2.05, 1.5);
  ball(g, 0.08, 0x222222, -0.25, 2.05, 1.5);
  box(g, 0.1, 0.4, 0.14, 0xffffff, 0.22, 1.25, 1.62, 0, 0.15);
  box(g, 0.1, 0.4, 0.14, 0xffffff, -0.22, 1.25, 1.62, 0, -0.15);
  for (const [lx, lz] of [[0.55, 0.6], [-0.55, 0.6], [0.55, -0.65], [-0.55, -0.65]] as const)
    cyl(g, 0.2, 0.22, 1.1, 0x8fa5bd, lx, 0.55, lz);
  tube(g, new THREE.Vector3(0, 1.7, -1.05), new THREE.Vector3(0, 1.0, -1.3), 0.06, 0x8fa5bd);
  return g;
}
function buildLion(): THREE.Group {
  const g = new THREE.Group();
  ball(g, 0.8, 0xe0a458, 0, 0.95, 0, 0.75, 0.7, 1.2);
  ball(g, 0.62, 0xb56b2c, 0, 1.4, 0.9);
  ball(g, 0.44, 0xe8b06a, 0, 1.38, 1.05);
  ball(g, 0.26, 0xf7dcb0, 0, 1.22, 1.38, 1, 0.75, 0.6);
  ball(g, 0.07, 0x8a4b12, 0, 1.32, 1.62);
  ball(g, 0.08, 0x222222, 0.16, 1.52, 1.42);
  ball(g, 0.08, 0x222222, -0.16, 1.52, 1.42);
  cone(g, 0.14, 0.26, 0xe0a458, 0.3, 1.95, 0.85, 0, 0.15);
  cone(g, 0.14, 0.26, 0xe0a458, -0.3, 1.95, 0.85, 0, -0.15);
  for (const [lx, lz] of [[0.35, 0.6], [-0.35, 0.6], [0.35, -0.65], [-0.35, -0.65]] as const)
    cyl(g, 0.12, 0.11, 0.6, 0xe0a458, lx, 0.3, lz);
  tube(g, new THREE.Vector3(0, 1.1, -1.0), new THREE.Vector3(0.15, 1.7, -1.35), 0.07, 0xe0a458);
  ball(g, 0.13, 0xb56b2c, 0.15, 1.75, -1.35);
  g.scale.setScalar(1.2);
  return g;
}
function buildZebra(): THREE.Group {
  const g = new THREE.Group();
  ball(g, 0.78, 0xffffff, 0, 1.3, 0, 0.7, 0.7, 1.2);
  tube(g, new THREE.Vector3(0, 1.55, 0.8), new THREE.Vector3(0, 2.25, 1.3), 0.24, 0xffffff);
  box(g, 0.42, 0.46, 0.9, 0xffffff, 0, 2.4, 1.55, 0, 0.35);
  box(g, 0.28, 0.28, 0.36, 0xd9d9d9, 0, 2.22, 2.0);
  cone(g, 0.12, 0.28, 0xffffff, 0.17, 2.75, 1.35, 0, 0.15);
  cone(g, 0.12, 0.28, 0xffffff, -0.17, 2.75, 1.35, 0, -0.15);
  box(g, 0.14, 0.8, 0.34, 0x333333, 0, 2.15, 1.02, 0, 0.6);
  for (const sx of [-0.45, 0.05, 0.5]) box(g, 0.13, 0.62, 1.02, 0x333333, sx, 1.32, -0.05, sx * 0.25);
  for (const [lx, lz] of [[0.33, 0.62], [-0.33, 0.62], [0.33, -0.68], [-0.33, -0.68]] as const)
    cyl(g, 0.1, 0.09, 1.0, 0xf1f1ea, lx, 0.5, lz);
  tube(g, new THREE.Vector3(0, 1.5, -1.0), new THREE.Vector3(0, 0.8, -1.3), 0.08, 0x333333);
  return g;
}

/** Gợi ý vị trí cho nhiệm vụ "Tìm bạn đang trốn" sau 15 giây. */
export function hideHintText(def: WorldObjectDef): string {
  const ns = def.z < -12 ? "phía bắc xa xa" : def.z > 12 ? "phía nam" : "ở giữa map";
  const ew = def.x < -12 ? "bên trái" : def.x > 12 ? "bên phải" : "";
  return `💡 Gợi ý: bạn ấy trốn ${ns}${ew ? `, hơi chếch ${ew}` : ""}, gần ${def.x > 0 ? "mép phải" : "mép trái"} của map đó!`;
}

/** Texture mặt đất vẽ bằng canvas: cỏ vệt đậm nhạt / sỏi đất — không tải tài nguyên ngoài. */
function makeGroundTexture(mapId: MapId): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = 256; c.height = 256;
  const ctx2 = c.getContext("2d")!;
  ctx2.fillStyle = mapId === "city" ? "#a8c96a" : mapId === "beach" ? "#ecd9a0" : "#6fbf4a";
  ctx2.fillRect(0, 0, 256, 256);
  let seed = mapId === "city" ? 7 : 21;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < 900; i++) {
    const x = rnd() * 256, y = rnd() * 256, l = 3 + rnd() * 6;
    ctx2.strokeStyle = rnd() > 0.5 ? "rgba(40,110,40,0.35)" : "rgba(190,235,140,0.4)";
    ctx2.lineWidth = 1.4;
    ctx2.beginPath(); ctx2.moveTo(x, y); ctx2.lineTo(x + (rnd() - 0.5) * 2, y - l); ctx2.stroke();
  }
  for (let i = 0; i < 130; i++) {
    ctx2.fillStyle = `rgba(${90 + rnd() * 60},${70 + rnd() * 40},40,${0.05 + rnd() * 0.1})`;
    ctx2.beginPath(); ctx2.arc(rnd() * 256, rnd() * 256, 1 + rnd() * 2.4, 0, Math.PI * 2); ctx2.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(14, 14);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Vòm trời gradient có chiều sâu (canvas texture trên mặt cầu trong). */
function buildSkyDome(scene: THREE.Scene, topColor: string, horizonColor: string) {
  const c = document.createElement("canvas");
  c.width = 16; c.height = 256;
  const ctx2 = c.getContext("2d")!;
  const gr = ctx2.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, topColor); gr.addColorStop(0.62, horizonColor); gr.addColorStop(1, horizonColor);
  ctx2.fillStyle = gr; ctx2.fillRect(0, 0, 16, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(170, 28, 16),
    new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false }),
  );
  scene.add(dome);
}

const BUILDERS: Record<string, () => THREE.Group> = {
  bus: buildBus, car: buildCar, bike: buildBike, truck: buildTruck,
  dog: () => buildDog(), cat: () => buildCat(), duck: buildDuck,
  chicken: buildChicken, horse: buildHorse, goat: buildGoat,
  fish: buildFish, apple: buildApple, banana: buildBanana,
  book: buildBook, bell: buildBell, tree: buildTree,
  flower: buildFlower, sun: buildSun,
  ball: () => buildBall(), hat: buildHat, cake: buildCake,
  lemon: buildLemon, frog: buildFrog, grape: buildGrape,
  boat: buildBoat, water: buildWaterBottle,
  monkey: () => buildMonkey(), tiger: buildTiger, elephant: buildElephant,
  lion: buildLion, zebra: buildZebra,
};

// ----- Nhân vật bé chọn -----
function buildCharacter(def: CharacterDef): THREE.Group {
  const g = new THREE.Group();
  const skin = 0xffd9b3;
  if (def.kind === "bunny") {
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.5, 6, 16), mat(0xffffff));
    body.position.y = 0.85;
    body.castShadow = true;
    g.add(body);
    ball(g, 0.42, 0xffffff, 0, 1.75, 0);
    for (const s of [1, -1]) {
      const ear = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.5, 6, 12), mat(0xffffff));
      ear.position.set(0.2 * s, 2.45, 0);
      ear.rotation.z = -0.15 * s;
      ear.castShadow = true;
      g.add(ear);
      const inner = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.34, 6, 10), mat(0xff9fc6));
      inner.position.set(0.2 * s, 2.45, 0.09);
      inner.rotation.z = -0.15 * s;
      g.add(inner);
    }
    ball(g, 0.07, 0x222222, 0.14, 1.82, 0.38);
    ball(g, 0.07, 0x222222, -0.14, 1.82, 0.38);
    ball(g, 0.08, 0xff8fab, 0, 1.68, 0.42);
    ball(g, 0.16, 0xffffff, 0, 0.95, -0.48);
    return g;
  }
  if (def.kind === "cat") {
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.5, 6, 16), mat(def.bodyColor));
    body.position.y = 0.85;
    body.castShadow = true;
    g.add(body);
    ball(g, 0.42, def.bodyColor, 0, 1.75, 0);
    cone(g, 0.17, 0.36, def.bodyColor, 0.26, 2.2, 0, 0, 0.15);
    cone(g, 0.17, 0.36, def.bodyColor, -0.26, 2.2, 0, 0, -0.15);
    ball(g, 0.07, 0x222222, 0.14, 1.82, 0.38);
    ball(g, 0.07, 0x222222, -0.14, 1.82, 0.38);
    ball(g, 0.07, 0xd96c33, 0, 1.68, 0.42);
    tube(g, new THREE.Vector3(0, 0.8, -0.42), new THREE.Vector3(0.2, 1.6, -0.7), 0.08, def.bodyColor);
    return g;
  }
  // Bé gái / bé trai
  const isGirl = def.kind === "girl";
  if (isGirl) {
    cyl(g, 0.34, 0.58, 0.95, def.bodyColor, 0, 0.85, 0);
  } else {
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 0.45, 6, 16), mat(def.bodyColor));
    body.position.y = 1.0;
    body.castShadow = true;
    g.add(body);
    box(g, 0.62, 0.34, 0.44, 0x3d5a99, 0, 0.5, 0);
  }
  for (const s of [1, -1]) {
    cyl(g, 0.1, 0.09, 0.42, 0x5b4a68, 0.18 * s, 0.21, 0);
    box(g, 0.2, 0.12, 0.34, 0x333344, 0.18 * s, 0.06, 0.06);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.4, 6, 10), mat(skin));
    arm.position.set(0.5 * s, 1.05, 0);
    arm.rotation.z = 0.35 * s;
    arm.castShadow = true;
    g.add(arm);
  }
  ball(g, 0.42, skin, 0, 1.78, 0);
  ball(g, 0.07, 0x222222, 0.14, 1.82, 0.39);
  ball(g, 0.07, 0x222222, -0.14, 1.82, 0.39);
  ball(g, 0.06, 0xff8fab, 0, 1.66, 0.42);
  if (isGirl) {
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.47, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55),
      mat(def.accentColor),
    );
    hair.position.set(0, 1.86, -0.03);
    hair.rotation.x = -0.35;
    hair.castShadow = true;
    g.add(hair);
    ball(g, 0.17, def.accentColor, 0.42, 2.12, 0);
    ball(g, 0.17, def.accentColor, -0.42, 2.12, 0);
    ball(g, 0.09, 0xffc53d, 0.42, 2.12, 0.14, 1, 1, 1, 0xffc53d);
    ball(g, 0.09, 0xffc53d, -0.42, 2.12, 0.14, 1, 1, 1, 0xffc53d);
  } else {
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.46, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5),
      mat(0xff5d5d),
    );
    cap.position.set(0, 1.84, 0);
    cap.castShadow = true;
    g.add(cap);
    box(g, 0.55, 0.07, 0.35, 0xff5d5d, 0, 1.88, 0.48);
  }
  return g;
}

// ----- Trang trí bản đồ (không bấm được) -----
function buildDecor(scene: THREE.Scene, mapId: MapId) {
  const sway: THREE.Object3D[] = [];
  const waters: THREE.Mesh[] = [];
  // Hàng rào cỏ quanh vùng đất để bé thấy rõ biên
  const hedge = 0x2f9e44;
  for (const [w, d, x, z] of [
    [86, 1.2, 0, -42.4], [86, 1.2, 0, 42.4], [1.2, 86, -42.4, 0], [1.2, 86, 42.4, 0],
  ] as const) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, 1.1, d), mat(hedge));
    m.position.set(x, 0.55, z);
    m.castShadow = true;
    scene.add(m);
  }
  const cloud = (x: number, y: number, z: number, s: number) => {
    const g = new THREE.Group();
    ball(g, 1.1, 0xffffff, 0, 0, 0, 1.4, 0.62, 1);
    ball(g, 0.8, 0xffffff, 1.1, 0.1, 0.2);
    ball(g, 0.7, 0xffffff, -1.1, 0.05, -0.1);
    g.position.set(x, y, z);
    g.scale.setScalar(s);
    g.traverse((c) => { c.castShadow = false; });
    scene.add(g);
    return g;
  };
  const clouds = [cloud(-24, 14, -32, 1.6), cloud(18, 16, -24, 2.0), cloud(2, 15, -38, 1.3), cloud(-32, 15, 18, 1.8), cloud(30, 14, 26, 1.5)];
  // Biển chỉ đường trang trí ở ngã rẽ
  const signpost = (x: number, z: number, ry: number, color: number) => {
    const g = new THREE.Group();
    cyl(g, 0.09, 0.11, 2.4, 0x7a4a21, 0, 1.2, 0);
    box(g, 1.7, 0.5, 0.1, color, 0.35, 2.1, 0);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.5, 4), mat(color));
    tip.position.set(1.4, 2.1, 0); tip.rotation.z = -Math.PI / 2; g.add(tip);
    g.position.set(x, 0, z); g.rotation.y = ry;
    scene.add(g);
  };
  if (mapId === "city") {
    // Đường nhựa chữ thập (dài theo map mới)
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x707a8a, roughness: 1 });
    const r1 = new THREE.Mesh(new THREE.PlaneGeometry(11, 86), roadMat);
    r1.rotation.x = -Math.PI / 2;
    r1.position.set(0, 0.02, 0);
    r1.receiveShadow = true;
    scene.add(r1);
    const r2 = new THREE.Mesh(new THREE.PlaneGeometry(86, 11), roadMat);
    r2.rotation.x = -Math.PI / 2;
    r2.position.set(0, 0.02, 0);
    r2.receiveShadow = true;
    scene.add(r2);
    // Vỉa hè dọc hai đường chính
    for (const s of [1, -1]) {
      const sw = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 86), new THREE.MeshStandardMaterial({ color: 0xcfd4da, roughness: 1 }));
      sw.rotation.x = -Math.PI / 2; sw.position.set(6.4 * s, 0.025, 0); sw.receiveShadow = true; scene.add(sw);
      const sw2 = new THREE.Mesh(new THREE.PlaneGeometry(86, 1.8), new THREE.MeshStandardMaterial({ color: 0xcfd4da, roughness: 1 }));
      sw2.rotation.x = -Math.PI / 2; sw2.position.set(0, 0.025, 6.4 * s); sw2.receiveShadow = true; scene.add(sw2);
    }
    // Đèn đường: cột + bóng đèn phát sáng dọc đường
    const lamp = (x: number, z: number) => {
      const g = new THREE.Group();
      cyl(g, 0.09, 0.12, 4.4, 0x44506b, 0, 2.2, 0);
      ball(g, 0.3, 0xfff3b0, 0, 4.55, 0, 1, 1, 1, 0xffedb0);
      g.position.set(x, 0, z);
      scene.add(g);
    };
    for (const p of [[7.5, -18], [-7.5, -18], [7.5, 18], [-7.5, 18], [18, 7.5], [-18, -7.5], [30, -7.5], [-30, 7.5]] as const) lamp(p[0], p[1]);
    signpost(7.6, 7.6, 0.6, 0x4cc9f0);
    signpost(-7.6, -7.6, -2.4, 0xffc53d);
    for (let i = -38; i <= 38; i += 5) {
      if (Math.abs(i) < 7) continue;
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 2.4),
        new THREE.MeshBasicMaterial({ color: 0xfff6a5 }));
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(0, 0.04, i);
      scene.add(dash);
      const dash2 = dash.clone();
      dash2.rotation.z = Math.PI / 2;
      dash2.position.set(i, 0.04, 0);
      scene.add(dash2);
    }
    // Nhà cao tầng quanh rìa
    const building = (x: number, z: number, h: number, color: number) => {
      const g = new THREE.Group();
      box(g, 6, h, 6, color, 0, h / 2, 0);
      const rows = Math.floor(h / 2.2);
      for (let r = 0; r < rows; r++)
        for (const wx of [-1.8, 0, 1.8])
          box(g, 1.0, 1.1, 0.08, 0xfff3b0, wx, 1.6 + r * 2.2, 3.02);
      g.position.set(x, 0, z);
      scene.add(g);
    };
    building(-24, -22, 11, 0xffb3c1);
    building(24, -23, 14, 0xa5d8ff);
    building(-25, 16, 9, 0xffe08a);
    building(25, 21, 12, 0xb2f2bb);
    building(0, -26, 8, 0xd0bfff);
    building(-36, -34, 13, 0xffd6a5);
    building(36, 34, 10, 0xcaffbf);
    building(36, -36, 9, 0xffadad);
    // Cửa hàng nhỏ có mái che ở khu mới phía nam
    const shop = (x: number, z: number, color: number) => {
      const g = new THREE.Group();
      box(g, 5, 3, 4, 0xffffff, 0, 1.5, 0);
      box(g, 5.6, 0.35, 4.6, color, 0, 3.2, 0);
      box(g, 2.6, 1.6, 0.08, 0xbfefff, -0.8, 1.7, 2.02);
      box(g, 1.0, 2.0, 0.08, 0x7a4a21, 1.4, 1.0, 2.02);
      box(g, 5.4, 0.9, 0.9, color, 0, 2.45, 2.35, 0, 0.18);
      g.position.set(x, 0, z);
      scene.add(g);
    };
    shop(28, 36, 0xff5d8f);
    shop(-34, 34, 0x2ec4b6);
    // Khu công viên nhỏ phía đông-bắc: thảm cỏ tròn, ghế, cây, bụi hoa, đài phun nhỏ
    const plaza = new THREE.Mesh(new THREE.CircleGeometry(7.5, 32), new THREE.MeshStandardMaterial({ color: 0x8fd16e, roughness: 1 }));
    plaza.rotation.x = -Math.PI / 2; plaza.position.set(31, 0.03, 27); plaza.receiveShadow = true; scene.add(plaza);
    for (const [tx, tz] of [[26, 23], [36, 24], [35, 32], [27, 33]] as const) {
      const t = buildTree(); t.position.set(tx, 0, tz); t.scale.setScalar(0.85); scene.add(t); sway.push(t);
    }
    for (const [bx, bz] of [[28, 29], [34, 29]] as const) {
      const bench = new THREE.Group();
      box(bench, 2.2, 0.14, 0.6, 0xa9743f, 0, 0.55, 0);
      box(bench, 2.2, 0.7, 0.12, 0xa9743f, 0, 1.0, -0.28);
      box(bench, 0.14, 0.55, 0.55, 0x7a4a21, -0.9, 0.28, 0);
      box(bench, 0.14, 0.55, 0.55, 0x7a4a21, 0.9, 0.28, 0);
      bench.position.set(bx, 0, bz); scene.add(bench);
    }
    for (let i = 0; i < 8; i++) {
      const f = buildFlower([0xff8fab, 0xffd93d, 0xff6b6b, 0x845ef7, 0xff9f45][i % 5]!); const a = (i / 8) * Math.PI * 2;
      f.position.set(31 + Math.cos(a) * 6.4, 0, 27 + Math.sin(a) * 6.4); f.scale.setScalar(0.5); scene.add(f); sway.push(f);
    }
    const basin = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.3, 0.7, 20), mat(0xcfd4da));
    basin.position.set(31, 0.35, 27); basin.castShadow = true; scene.add(basin);
    const drop = new THREE.Mesh(new THREE.SphereGeometry(0.45, 18, 14), mat(0x4cc9f0, 0x4cc9f0));
    drop.position.set(31, 1.05, 27); scene.add(drop);
  } else if (mapId === "countryside") {
    // Ao cá + ao vịt
    const pond = (x: number, z: number, r: number) => {
      const p = new THREE.Mesh(
        new THREE.CircleGeometry(r, 36),
        new THREE.MeshStandardMaterial({ color: 0x4cc9f0, roughness: 0.35 }),
      );
      p.rotation.x = -Math.PI / 2;
      p.position.set(x, 0.03, z);
      p.receiveShadow = true;
      scene.add(p);
      waters.push(p);
      const rim = new THREE.Mesh(
        new THREE.RingGeometry(r, r + 0.5, 36),
        new THREE.MeshStandardMaterial({ color: 0xe8d8a8, roughness: 1 }),
      );
      rim.rotation.x = -Math.PI / 2;
      rim.position.set(x, 0.025, z);
      scene.add(rim);
    };
    pond(17, 12, 6.2);
    pond(-15, -10, 3.8);
    pond(31, 31, 3.4);
    // Cầu gỗ nhỏ bắc qua ao cá lớn
    const bridge = new THREE.Group();
    for (let i = 0; i < 7; i++) {
      const px = -3 + i;
      box(bridge, 0.85, 0.16, 3.6, 0xa9743f, px, 0.55 + Math.sin((i / 6) * Math.PI) * 0.55, 0);
    }
    for (const s of [1, -1]) {
      box(bridge, 7.2, 0.14, 0.14, 0x7a4a21, 0, 1.55, 1.75 * s);
      for (const px of [-3, 0, 3]) cyl(bridge, 0.08, 0.08, 0.9, 0x7a4a21, px, 1.05, 1.75 * s);
    }
    bridge.position.set(17, 0, 12);
    bridge.rotation.y = 0.4;
    scene.add(bridge);
    signpost(6, 6, 0.9, 0x3fa34d);
    signpost(-8, -20, 2.6, 0xff9f45);
    // Lối đi đất
    const path = new THREE.Mesh(
      new THREE.PlaneGeometry(4.5, 84),
      new THREE.MeshStandardMaterial({ color: 0xe8d8a8, roughness: 1 }),
    );
    path.rotation.x = -Math.PI / 2;
    path.rotation.z = 0.5;
    path.position.set(0, 0.015, 0);
    path.receiveShadow = true;
    scene.add(path);
    // Nhà gỗ quê
    const house = new THREE.Group();
    box(house, 6, 3.2, 5, 0xffe3b3, 0, 1.6, 0);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(4.9, 2.2, 4), mat(0xd9480f));
    roof.position.y = 4.3;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    house.add(roof);
    box(house, 1.2, 2.0, 0.1, 0x7a4a21, 0, 1.0, 2.53);
    box(house, 1.3, 1.3, 0.1, 0xbfefff, -1.8, 1.9, 2.53);
    box(house, 1.3, 1.3, 0.1, 0xbfefff, 1.8, 1.9, 2.53);
    house.position.set(-23, 0, 20);
    house.rotation.y = -0.5;
    scene.add(house);
    // Cây + hoa trang trí
    for (const [tx, tz] of [[-24, -4], [23, 16], [-8, -22], [22, -22], [-24, 24]] as const) {
      const t = buildTree();
      t.position.set(tx, 0, tz);
      t.scale.setScalar(0.9);
      scene.add(t);
      sway.push(t);
    }
    for (let i = 0; i < 14; i++) {
      const f = buildFlower([0xff8fab, 0xffd93d, 0xff6b6b, 0x845ef7][i % 4]!);
      const fx = -26 + ((i * 37) % 52);
      const fz = -26 + ((i * 53) % 52);
      if (Math.hypot(fx, fz) < 6) continue;
      f.position.set(fx, 0, fz);
      f.scale.setScalar(0.45);
      scene.add(f);
      sway.push(f);
    }
    // Hàng rào gỗ sau nhà
    for (let i = 0; i < 7; i++) box2(scene, 0.25, 1.1, 0.12, 0xa9743f, -20 + i * 1.6, 0.55, -24);
    // Khu vườn cây ăn quả phía tây-nam: hàng cây táo + luống rau + bụi rơm
    for (const [tx, tz] of [[-32, 20], [-32, 28], [-26, 24], [-36, 32], [28, -32], [34, -28]] as const) {
      const t = buildTree();
      t.position.set(tx, 0, tz);
      t.scale.setScalar(1.05);
      scene.add(t);
    }
    for (let r = 0; r < 4; r++) {
      const row = new THREE.Mesh(
        new THREE.BoxGeometry(12, 0.35, 0.9),
        mat(r % 2 ? 0x8a6642 : 0x66bb44),
      );
      row.position.set(-30, 0.18, -28 + r * 2.2);
      row.castShadow = true;
      scene.add(row);
    }
    for (const [hx, hz] of [[24, 24], [-24, -32], [36, 8]] as const) {
      const hay = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 1.3, 16), mat(0xe9c949));
      hay.rotation.z = Math.PI / 2;
      hay.position.set(hx, 0.9, hz);
      hay.castShadow = true;
      scene.add(hay);
    }
    // Hàng rào gỗ chạy dọc vườn
    for (let i = 0; i < 10; i++) box2(scene, 0.25, 1.1, 0.12, 0xa9743f, -38 + i * 1.7, 0.55, 14);
  } else if (mapId === "beach") {
    // Biển lớn phía bắc: mặt nước gợn sáng + bờ cát cong
    const sea = new THREE.Mesh(
      new THREE.PlaneGeometry(86, 26),
      new THREE.MeshStandardMaterial({ color: 0x2fa8dd, roughness: 0.25 }),
    );
    sea.rotation.x = -Math.PI / 2;
    sea.position.set(0, 0.04, -34);
    sea.receiveShadow = true;
    scene.add(sea);
    waters.push(sea);
    const foam = new THREE.Mesh(
      new THREE.PlaneGeometry(86, 1.6),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 }),
    );
    foam.rotation.x = -Math.PI / 2;
    foam.position.set(0, 0.06, -21.5);
    scene.add(foam);
    waters.push(foam);
    // Ô che nắng + cây dừa (cây nghiêng) + vỏ sò trang trí
    const umbrella = (x: number, z: number, color: number) => {
      const g = new THREE.Group();
      cyl(g, 0.08, 0.1, 3.0, 0xffffff, 0, 1.5, 0, 0, 0.12);
      cone(g, 2.0, 0.8, color, 0.35, 3.1, 0);
      g.position.set(x, 0, z);
      scene.add(g);
      sway.push(g);
    };
    umbrella(-12, 12, 0xff5d8f);
    umbrella(20, 16, 0xffc53d);
    umbrella(-26, -6, 0x2ec4b6);
    for (const [tx, tz] of [[-34, 18], [34, 24], [-8, 30], [28, -14]] as const) {
      const t = buildTree();
      t.position.set(tx, 0, tz);
      t.rotation.z = 0.12;
      t.scale.setScalar(1.1);
      scene.add(t);
      sway.push(t);
    }
    for (let i = 0; i < 12; i++) {
      const sx = -36 + ((i * 29) % 72);
      const sz = -18 + ((i * 41) % 52);
      ball2(scene, 0.22 + (i % 3) * 0.07, i % 2 ? 0xfff3e4 : 0xffb3c1, sx, 0.18, sz);
    }
    signpost(6, 4, 0.8, 0xff9f45);
  } else if (mapId === "zoo") {
    // Cổng sở thú + hàng rào chuồng + cây + bụi hoa đung đưa
    const gate = new THREE.Group();
    box(gate, 0.6, 5.2, 0.6, 0xa9743f, -3.4, 2.6, 0);
    box(gate, 0.6, 5.2, 0.6, 0xa9743f, 3.4, 2.6, 0);
    box(gate, 8.6, 1.1, 0.7, 0xff9f45, 0, 5.4, 0);
    ball(gate, 0.5, 0xffc53d, 0, 6.3, 0, 1, 1, 1, 0xffc53d);
    gate.position.set(0, 0, 34);
    scene.add(gate);
    const fenceRun = (x0: number, z0: number, n: number, dx: number, dz: number) => {
      for (let i = 0; i < n; i++) box2(scene, 0.22, 1.15, 0.22, 0xa9743f, x0 + dx * i, 0.58, z0 + dz * i);
      box2(scene, Math.abs(dx) * (n - 1) || 0.18, 0.16, Math.abs(dz) * (n - 1) || 0.18, 0xa9743f, x0 + (dx * (n - 1)) / 2, 1.0, z0 + (dz * (n - 1)) / 2);
    };
    fenceRun(-30, -26, 9, 1.7, 0);
    fenceRun(14, -26, 9, 1.7, 0);
    fenceRun(-34, 2, 9, 0, 1.7);
    fenceRun(30, 18, 8, 0, 1.7);
    for (const [tx, tz] of [[-24, -4], [23, 16], [-8, -22], [22, -22], [-24, 24], [34, -30]] as const) {
      const t = buildTree();
      t.position.set(tx, 0, tz);
      t.scale.setScalar(0.95);
      scene.add(t);
      sway.push(t);
    }
    for (let i = 0; i < 12; i++) {
      const f = buildFlower([0xff8fab, 0xffd93d, 0xff6b6b, 0x845ef7][i % 4]!);
      const fx = -28 + ((i * 31) % 56);
      const fz = -28 + ((i * 47) % 56);
      if (Math.hypot(fx, fz) < 6) continue;
      f.position.set(fx, 0, fz);
      f.scale.setScalar(0.5);
      scene.add(f);
      sway.push(f);
    }
    const pondZ = new THREE.Mesh(
      new THREE.CircleGeometry(4.2, 30),
      new THREE.MeshStandardMaterial({ color: 0x4cc9f0, roughness: 0.3 }),
    );
    pondZ.rotation.x = -Math.PI / 2;
    pondZ.position.set(2, 0.03, 26);
    scene.add(pondZ);
    waters.push(pondZ);
    signpost(-6, 6, 1.2, 0xff9f45);
    signpost(10, -20, -0.7, 0x3fa34d);
  }
  return { clouds, sway, waters };
}

function ball2(
  scene: THREE.Scene, r: number, color: number, x: number, y: number, z: number,
) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), mat(color));
  m.position.set(x, y, z);
  m.scale.y = 0.6;
  scene.add(m);
}

function box2(
  scene: THREE.Scene, w: number, h: number, d: number, color: number,
  x: number, y: number, z: number,
) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  m.position.set(x, y, z);
  m.castShadow = true;
  scene.add(m);
}

// ---------- Pháo giấy ăn mừng ----------
const CONFETTI_COLORS = ["#FF5D8F", "#FFC53D", "#2EC4B6", "#4CC9F0", "#FF9F45", "#F15BB5"];
function Confetti({ burstKey }: { burstKey: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        left: (i * 37 + burstKey * 13) % 100,
        delay: ((i * 7) % 10) / 14,
        dur: 2.2 + ((i * 11) % 10) / 12,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length]!,
        size: 8 + ((i * 5) % 8),
        round: i % 3 === 0,
      })),
    [burstKey],
  );
  if (burstKey === 0) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {pieces.map((p, i) => (
        <span
          key={`${burstKey}-${i}`}
          style={{
            position: "absolute",
            top: -24,
            left: `${p.left}%`,
            width: p.size,
            height: p.round ? p.size : p.size * 0.5,
            borderRadius: p.round ? "50%" : 2,
            background: p.color,
            animation: `mc-confetti-fall ${p.dur}s ease-in ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}

// ---------- Dựng hình theo từng vật (xe/hoa nhiều màu, chó nhiều tông) ----------
const CAR_SHADES: Record<ColorId, [number, number]> = {
  red: [0xff5d5d, 0xff7b7b],
  blue: [0x3d7bff, 0x6fa8ff],
  yellow: [0xffd93d, 0xffe873],
  green: [0x3fa34d, 0x69c24f],
};
const FLOWER_PETALS: Record<ColorId, number> = {
  red: 0xff4444,
  blue: 0x6fa8ff,
  yellow: 0xffd93d,
  green: 0x7ed957,
};

function buildFor(def: WorldObjectDef): THREE.Group | null {
  if (def.id === "car") {
    const sh = CAR_SHADES[def.colorId ?? "red"];
    return buildCar(sh[0], sh[1]);
  }
  if (def.id === "flower") {
    return buildFlower(def.colorId ? FLOWER_PETALS[def.colorId] : 0xff8fab);
  }
  if (def.id === "dog") return buildDog(def.tint ?? 0xb08968);
  if (def.id === "ball" && def.colorId) {
    const sh = CAR_SHADES[def.colorId];
    return buildBall(sh[0]);
  }
  if (def.id === "monkey") return buildMonkey(def.tint ?? 0x9c6644);
  const b = BUILDERS[def.id];
  return b ? b() : null;
}

/** Chim trang trí bay vòng trên trời (không bấm được). */
function buildBird(color: number): { group: THREE.Group; wingL: THREE.Group; wingR: THREE.Group } {
  const group = new THREE.Group();
  ball(group, 0.34, color, 0, 0, 0, 1.35, 0.85, 0.95);
  ball(group, 0.2, color, 0, 0.08, 0.42);
  cone(group, 0.09, 0.3, 0xff9f45, 0, 0.05, 0.68, Math.PI / 2);
  ball(group, 0.05, 0x222222, 0.1, 0.14, 0.55);
  ball(group, 0.05, 0x222222, -0.1, 0.14, 0.55);
  cone(group, 0.16, 0.4, color, 0, 0.02, -0.5, -Math.PI / 2);
  const mkWing = (side: 1 | -1) => {
    const pivot = new THREE.Group();
    pivot.position.set(0.12 * side, 0.12, 0);
    const w = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.06, 0.4), mat(color));
    w.position.x = 0.45 * side;
    pivot.add(w);
    group.add(pivot);
    return pivot;
  };
  const wingR = mkWing(1);
  const wingL = mkWing(-1);
  group.traverse((c) => {
    c.castShadow = false;
  });
  return { group, wingL, wingR };
}

// ---------- Màn hình chính của game ----------
export function ExploreGame({ onBack }: { onBack: () => void }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"character" | "map" | "play">("character");
  const [character, setCharacter] = useState<CharacterDef | null>(null);
  const [mapDef, setMapDef] = useState<MapDef | null>(null);
  const [roundKey, setRoundKey] = useState(0);

  // Trạng thái nhiệm vụ trong một lượt chơi (5 nhiệm vụ pha trộn 3 dạng)
  const [missions, setMissions] = useState<Mission[]>([]);
  const [missionIndex, setMissionIndex] = useState(0);
  const [foundCount, setFoundCount] = useState(0);
  const [countTapped, setCountTapped] = useState(0);
  const [wordCard, setWordCard] = useState<WorldObjectDef | null>(null);
  const [nearDef, setNearDef] = useState<WorldObjectDef | null>(null);
  const [feedback, setFeedback] = useState<{ kind: "good" | "try"; text: string } | null>(null);
  const [confettiKey, setConfettiKey] = useState(0);
  const [finished, setFinished] = useState(false);
  const [earnedStars, setEarnedStars] = useState<number | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  const [hintActive, setHintActive] = useState(false);
  const [stickerPop, setStickerPop] = useState<string | null>(null);
  // Đợt 3: panel nhiệm vụ hiện to 2–3 giây đầu rồi tự thu thành thanh nhỏ gọn
  const [missionPanelBig, setMissionPanelBig] = useState(true);

  // Trạng thái "Nói theo cô" trong thẻ từ
  const [sayPhase, setSayPhase] = useState<
    "idle" | "model" | "listening" | "scored" | "unsupported" | "error"
  >("idle");
  const [sayScore, setSayScore] = useState<number | null>(null);
  const [sayMsg, setSayMsg] = useState<string | null>(null);

  const mountRef = useRef<HTMLDivElement | null>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const nudgeRef = useRef<((dx: number, dz: number) => void) | null>(null);
  const bounceRef = useRef<Map<string, number>>(new Map());
  const nearIdRef = useRef<string | null>(null);
  const countedIndexRef = useRef<number>(-1);
  const countedKeysRef = useRef<Set<string>>(new Set());
  const timersRef = useRef<number[]>([]);
  const missionStartRef = useRef<number>(Date.now());
  const guideRef = useRef<{ x: number; z: number } | null>(null);
  const hintKeyRef = useRef<string | null>(null);
  const arrowWrapRef = useRef<HTMLDivElement | null>(null);
  const arrowInnerRef = useRef<HTMLSpanElement | null>(null);
  // Đợt 4: góc mũi tên chỉ đường hiện tại — xoay dần về hướng đích (không giật)
  const arrowAngleRef = useRef<number | null>(null);
  // Đợt 4: chuyển cảnh sang map tiếp theo sau khi xong 1 lượt nhiệm vụ
  const [transitionTo, setTransitionTo] = useState<MapDef | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const sayTokenRef = useRef(0);
  // Đợt 3: góc yaw mượt của camera qua-vai (chia sẻ giữa vòng lặp 3D và nút nhích)
  const camYawRef = useRef(Math.PI);
  const lastSpokenMissionRef = useRef<string | null>(null);

  const mission = missions[missionIndex] ?? null;

  // Sổ Khám Phá: dữ liệu bền từ server (dùng chung query "state" với trang chủ)
  const stateQuery = useQuery({ queryKey: ["state"], queryFn: () => api.getState({}) });
  const discovered = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const d of stateQuery.data?.discoveries ?? []) {
      const s = map.get(d.mapId) ?? new Set<string>();
      s.add(d.objectKey);
      map.set(d.mapId, s);
    }
    return map;
  }, [stateQuery.data]);
  const bookFoundHere = mapDef ? (discovered.get(mapDef.id)?.size ?? 0) : 0;

  const later = (fn: () => void, ms: number) => {
    const t = window.setTimeout(fn, ms);
    timersRef.current.push(t);
  };
  useEffect(() => () => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
  }, []);

  // Vật mà mũi tên chỉ đường dẫn tới + khóa vật phát sáng gợi ý
  const guideTargetDef =
    mission && mapDef ? missionTargetDef(mission, countedKeysRef.current, mapDef) : null;
  useEffect(() => {
    guideRef.current =
      guideTargetDef && !guideTargetDef.inSky
        ? { x: guideTargetDef.x, z: guideTargetDef.z }
        : null;
  }, [guideTargetDef]);
  useEffect(() => {
    hintKeyRef.current = hintActive && guideTargetDef ? instKey(guideTargetDef) : null;
  }, [hintActive, guideTargetDef]);

  // Mỗi nhiệm vụ mới: reset phần đếm số + đồng hồ gợi ý 20 giây
  useEffect(() => {
    countedKeysRef.current = new Set();
    setCountTapped(0);
    setHintActive(false);
    missionStartRef.current = Date.now();
  }, [missionIndex, missions]);

  // Quá 20 giây chưa xong nhiệm vụ → bật gợi ý phát sáng
  useEffect(() => {
    if (step !== "play") return;
    const iv = window.setInterval(() => {
      // Nhiệm vụ "Tìm bạn đang trốn": gợi ý vị trí bằng lời sau 15 giây.
      const limit = mission?.kind === "hide" || mission?.kind === "riddle" ? 15000 : HINT_AFTER_MS;
      if (
        !finished &&
        !celebrating &&
        Date.now() - missionStartRef.current >= limit
      ) {
        setHintActive(true);
      }
    }, 500);
    return () => window.clearInterval(iv);
  }, [step, finished, celebrating, mission]);

  // Đợt 3: nhiệm vụ mới → panel hiện to vài giây rồi thu nhỏ + TỰ ĐỘNG đọc
  // tiếng Việt cho bé biết phải làm gì, nối tiếp câu tiếng Anh ngắn.
  useEffect(() => {
    if (step !== "play" || finished || !mission) return;
    setMissionPanelBig(true);
    const collapse = window.setTimeout(() => setMissionPanelBig(false), 3000);
    const key = `${roundKey}-${missionIndex}-${mission.kind}`;
    let speakTimer = 0;
    if (lastSpokenMissionRef.current !== key) {
      lastSpokenMissionRef.current = key;
      const t = missionText(mission);
      speakTimer = window.setTimeout(() => {
        speakBilingual(t.speakVi, t.speakEn);
      }, 450);
    }
    return () => {
      window.clearTimeout(collapse);
      if (speakTimer) window.clearTimeout(speakTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, mission, missionIndex, roundKey, finished]);

  // Bắt đầu một lượt: dựng 5 nhiệm vụ pha trộn (tìm vật / màu sắc / đếm số)
  const startRound = (m: MapDef) => {
    lastSpokenMissionRef.current = null;
    camYawRef.current = Math.PI;
    setMissionPanelBig(true);
    setMissions(buildRound(m));
    setMissionIndex(0);
    setFoundCount(0);
    setCountTapped(0);
    countedKeysRef.current = new Set();
    setWordCard(null);
    setFeedback(null);
    setFinished(false);
    setEarnedStars(null);
    setCelebrating(false);
    setHintActive(false);
    setStickerPop(null);
    missionStartRef.current = Date.now();
    countedIndexRef.current = -1;
    nearIdRef.current = null;
    setNearDef(null);
  };

  /** Đợt 4: xong 1 lượt → chúc mừng rồi chuyển sang MAP TIẾP THEO (vòng tròn). */
  const nextMapOf = (m: MapDef): MapDef =>
    MAPS[(MAPS.findIndex((x) => x.id === m.id) + 1) % MAPS.length] ?? MAPS[0]!;

  const goToNextMap = () => {
    if (!mapDef || transitionTo) return;
    const next = nextMapOf(mapDef);
    setTransitionTo(next);
    speakBilingual(`Đi đến ${next.nameVi} nào!`, `Let's go to the ${next.nameEn}!`);
    later(() => {
      setMapDef(next);
      startRound(next);
      setRoundKey((k) => k + 1);
      setTransitionTo(null);
    }, 2300);
  };

  const finishRound = (found: number, total: number, m: MapDef) => {
    setFinished(true);
    setCelebrating(false);
    void api
      .completeLesson({
        lessonId: `game3d-${m.id}`,
        correct: found,
        total,
        rewardIds: [],
        giftId: null,
      })
      .then((res) => {
        setEarnedStars(res.stars);
        void queryClient.invalidateQueries({ queryKey: ["state"] });
      })
      .catch(() => setEarnedStars(null));
  };

  /** Hoàn thành nhiệm vụ hiện tại: ăn mừng, khen, rồi sang nhiệm vụ kế / kết lượt. */
  const completeCurrentMission = (goodText: string) => {
    if (!mapDef || countedIndexRef.current === missionIndex) return;
    countedIndexRef.current = missionIndex;
    const newFound = foundCount + 1;
    setFoundCount(newFound);
    setCelebrating(true);
    setFeedback({ kind: "good", text: goodText });
    setConfettiKey((k) => k + 1);
    later(() => playPraise(), 650);
    later(() => {
      if (missionIndex + 1 >= missions.length) {
        finishRound(newFound, missions.length, mapDef);
      } else {
        setMissionIndex(missionIndex + 1);
        setCelebrating(false);
        setFeedback(null);
      }
    }, 2100);
  };

  const tryAgainAudio = () => {
    later(
      () => playKeyAudio("vitryagain", "Gần đúng rồi! Minh Châu thử lại nhé!", "vi-VN"),
      1100,
    );
  };

  const handleSelectObject = (def: WorldObjectDef) => {
    const key = instKey(def);
    bounceRef.current.set(key, performance.now());
    playWordAudioChained(def);
    setWordCard(def);

    // Sổ Khám Phá: chỉ vật chính của map mới được ghi vào sổ (lưu bền trên server)
    if (mapDef && mapDef.objects.includes(def)) {
      const objKey = bookKey(def);
      const already = discovered.get(mapDef.id)?.has(objKey) ?? false;
      if (!already) {
        const mId = mapDef.id;
        const total = mapDef.objects.length;
        void api
          .discoverObject({ mapId: mId, objectKey: objKey, totalObjects: total })
          .then((res) => {
            void queryClient.invalidateQueries({ queryKey: ["state"] });
            if (res.newStickerId) {
              setStickerPop(res.newStickerId);
              setConfettiKey((k) => k + 1);
              later(() => playPraise(), 500);
            }
          })
          .catch(() => undefined);
      }
    }

    if (finished || celebrating || !mission) return;

    if (mission.kind === "find" || mission.kind === "listen" || mission.kind === "hide" || mission.kind === "riddle") {
      if (def === mission.def) {
        completeCurrentMission(
          mission.kind === "hide"
            ? `Tìm thấy rồi! Bạn ${def.en} — ${def.vi} trốn ở đây này! 🎉`
            : mission.kind === "riddle"
              ? `Đoán đúng rồi! Đáp án câu đố là ${def.en} — ${def.vi}! Con suy luận giỏi quá! 🎉`
              : `Đúng rồi! Đây là ${def.en} — ${def.vi}! 🎉`,
        );
      } else {
        setFeedback({
          kind: "try",
          text:
            mission.kind === "find"
              ? `Đây là ${def.en} — ${def.vi}. Nhiệm vụ tìm ${mission.def.en} cơ, con thử lại nhé!`
              : mission.kind === "listen"
                ? `Đây là ${def.en} — ${def.vi}. Con bấm nút loa nghe lại cô đọc rồi tìm tiếp nhé!`
                : mission.kind === "riddle"
                  ? `Đây là ${def.en} — ${def.vi}. Chưa phải đáp án câu đố đâu, con bấm loa nghe lại câu đố rồi đoán tiếp nhé!`
                  : `Đây là ${def.en} — ${def.vi}. Bạn đang trốn chưa phải bạn này đâu, con tìm tiếp nhé!`,
        });
        tryAgainAudio();
      }
      return;
    }

    if (mission.kind === "color") {
      const want = COLORS[mission.colorId];
      if (groupOf(def) === mission.baseId && def.colorId === mission.colorId) {
        completeCurrentMission(
          `Đúng rồi! ${want.en} ${mission.sample.en} — ${mission.sample.vi} màu ${want.vi}! 🎉`,
        );
      } else if (groupOf(def) === mission.baseId) {
        const clicked = def.colorId ? COLORS[def.colorId] : null;
        setFeedback({
          kind: "try",
          text: clicked
            ? `Đây là ${mission.sample.en} màu ${clicked.vi} (${clicked.en}). Nhiệm vụ tìm màu ${want.vi} cơ, con thử lại nhé!`
            : `Bạn ${mission.sample.en} này chưa có màu ${want.vi} đâu. Con tìm bạn màu ${want.vi} nhé!`,
        });
        tryAgainAudio();
      } else {
        setFeedback({
          kind: "try",
          text: `Đây là ${def.en} — ${def.vi}. Nhiệm vụ tìm ${mission.sample.en} màu ${want.vi} cơ, con thử lại nhé!`,
        });
        tryAgainAudio();
      }
      return;
    }

    // Nhiệm vụ đếm số
    if (groupOf(def) === mission.baseId) {
      if (countedKeysRef.current.has(key)) {
        setFeedback({
          kind: "try",
          text: `Bạn ${def.en} này mình đếm rồi! Con tìm bạn ${def.en} khác nhé!`,
        });
        return;
      }
      countedKeysRef.current.add(key);
      const n = countTapped + 1;
      setCountTapped(n);
      const num = NUMBERS[n - 1];
      if (num) playKeyAudio(num.key, num.en, "en-US");
      if (n >= mission.need) {
        completeCurrentMission(
          `Đủ ${n} bạn ${def.en} rồi! Con đếm giỏi quá! 🎉`,
        );
      } else {
        setFeedback({
          kind: "good",
          text: `${num?.en ?? n}! Đã bấm ${n}/${mission.need} bạn ${def.en} — con tìm tiếp nhé!`,
        });
      }
    } else {
      setFeedback({
        kind: "try",
        text: `Đây là ${def.en} — ${def.vi}. Nhiệm vụ bấm vào ${mission.need} bạn ${mission.sample.en} cơ, con thử lại nhé!`,
      });
      tryAgainAudio();
    }
  };
  const handleSelectRef = useRef(handleSelectObject);
  handleSelectRef.current = handleSelectObject;

  const skipMission = () => {
    if (finished || celebrating || !mission || !mapDef) return;
    countedIndexRef.current = missionIndex;
    speakDevice(`Không sao, mình tìm cái khác nhé!`, "vi-VN");
    if (missionIndex + 1 >= missions.length) {
      finishRound(foundCount, missions.length, mapDef);
    } else {
      setMissionIndex(missionIndex + 1);
      setFeedback(null);
    }
  };

  const speakMission = () => {
    if (!mission) return;
    const t = missionText(mission);
    speakBilingual(t.speakVi, t.speakEn);
  };

  // ---------- "Nói theo cô" trong thẻ từ ----------
  const cardColor = wordCard?.colorId ? COLORS[wordCard.colorId] : null;
  const cardTitle = wordCard
    ? cardColor
      ? `${cardColor.en} ${wordCard.en}`
      : wordCard.en
    : "";
  const cardVi = wordCard
    ? cardColor
      ? `${wordCard.vi} màu ${cardColor.vi}`
      : wordCard.vi
    : "";
  const cardIpa = wordCard
    ? cardColor
      ? `${cardColor.ipa} ${wordCard.ipa}`
      : wordCard.ipa
    : "";

  const stopSay = () => {
    sayTokenRef.current += 1;
    try {
      recRef.current?.abort();
    } catch {
      /* bỏ qua */
    }
    recRef.current = null;
  };
  // Đổi thẻ từ → reset phần luyện nói
  useEffect(() => {
    setSayPhase("idle");
    setSayScore(null);
    setSayMsg(null);
    stopSay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordCard]);
  useEffect(
    () => () => {
      sayTokenRef.current += 1;
      try {
        recRef.current?.abort();
      } catch {
        /* bỏ qua */
      }
    },
    [],
  );

  const startSayIt = () => {
    if (!wordCard || !mapDef) return;
    const def = wordCard;
    const targetText = cardTitle;
    const mapIdForSave = mapDef.id;
    stopSay();
    const token = sayTokenRef.current;
    setSayScore(null);
    setSayMsg(null);
    setSayPhase("model");
    // Nghe cô đọc mẫu trước, rồi mới mở micro cho bé đọc lại
    playWordAudioChained(def);
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      later(() => {
        if (sayTokenRef.current !== token) return;
        setSayPhase("unsupported");
        setSayMsg(
          "Máy này chưa nghe chấm điểm được. Con bấm loa nghe cô đọc rồi đọc to theo cô nhé!",
        );
      }, 1000);
      return;
    }
    later(() => {
      if (sayTokenRef.current !== token) return;
      try {
        const rec = new Ctor();
        recRef.current = rec;
        rec.lang = "en-US";
        rec.interimResults = false;
        rec.maxAlternatives = 3;
        rec.continuous = false;
        let done = false;
        rec.onresult = (e) => {
          let best = 0;
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const res = e.results[i];
            if (!res) continue;
            for (let j = 0; j < res.length; j++) {
              const alt = res[j];
              if (!alt) continue;
              best = Math.max(best, scoreSpeech(targetText, alt.transcript));
            }
          }
          done = true;
          setSayScore(best);
          setSayPhase("scored");
          void api
            .saveSpeechScore({ lessonId: `game3d-say-${mapIdForSave}`, score: best })
            .then(() => queryClient.invalidateQueries({ queryKey: ["state"] }))
            .catch(() => undefined);
          if (best >= 80) later(() => playPraise(), 350);
          else if (best < 50)
            later(
              () =>
                playKeyAudio(
                  "vitryagain",
                  "Gần được rồi! Con nghe cô đọc lại rồi đọc theo nhé!",
                  "vi-VN",
                ),
              350,
            );
        };
        rec.onerror = (e) => {
          if (done) return;
          if (e.error === "not-allowed" || e.error === "service-not-allowed") {
            done = true;
            setSayPhase("error");
            setSayMsg(
              "Ứng dụng chưa được phép dùng micro. Ba/mẹ cho phép micro rồi bấm Nói theo cô lại nhé!",
            );
          }
          // Lỗi "no-speech": để onend báo nhẹ nhàng.
        };
        rec.onend = () => {
          if (!done) {
            done = true;
            setSayPhase("error");
            setSayMsg(
              "Cô chưa nghe rõ tiếng con. Con đọc to và chậm hơn một chút rồi thử lại nhé!",
            );
          }
        };
        setSayPhase("listening");
        rec.start();
      } catch {
        setSayPhase("error");
        setSayMsg(
          "Cô chưa nghe rõ tiếng con. Con đọc to và chậm hơn một chút rồi thử lại nhé!",
        );
      }
    }, 1500);
  };

  // ---------- Khởi tạo thế giới 3D ----------
  const charId = character?.id;
  const mapId = mapDef?.id;
  useEffect(() => {
    if (step !== "play" || !character || !mapDef) return;
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(mapDef.skyColor);
    scene.fog = new THREE.Fog(mapDef.skyColor, 70, 165);
    // Bầu trời gradient có chiều sâu (đợt 3)
    buildSkyDome(
      scene,
      mapDef.id === "city" ? "#3d8fd1" : mapDef.id === "beach" ? "#5aa7dd" : "#3f9be0",
      mapDef.id === "beach" ? "#ffe3ae" : "#cfeeff",
    );

    const camera = new THREE.PerspectiveCamera(
      58, mount.clientWidth / Math.max(1, mount.clientHeight), 0.1, 420,
    );
    // Tự giảm chất lượng trên máy yếu để giữ FPS: tắt bóng đổ + giảm pixel ratio
    const navAny = navigator as Navigator & { deviceMemory?: number };
    const weakDevice =
      (navigator.hardwareConcurrency ?? 8) <= 4 || (navAny.deviceMemory ?? 8) <= 4;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, weakDevice ? 1.5 : 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = !weakDevice;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    mount.appendChild(renderer.domElement);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x77aa55, 0.95);
    scene.add(hemi);
    // Bãi biển: nắng hoàng hôn ấm vàng cam nhẹ; các map khác nắng trắng ấm.
    const sunLight = new THREE.DirectionalLight(
      mapDef.id === "beach" ? 0xffd9a0 : 0xfff2cc, 1.9,
    );
    sunLight.position.set(26, mapDef.id === "beach" ? 24 : 38, 18);
    sunLight.castShadow = !weakDevice;
    sunLight.shadow.mapSize.set(2048, 2048);
    sunLight.shadow.camera.left = -48;
    sunLight.shadow.camera.right = 48;
    sunLight.shadow.camera.top = 48;
    sunLight.shadow.camera.bottom = -48;
    sunLight.shadow.camera.far = 120;
    sunLight.shadow.bias = -0.0004;
    scene.add(sunLight);
    const fill = new THREE.DirectionalLight(0xbfe3ff, 0.5);
    fill.position.set(-14, 18, -10);
    scene.add(fill);

    // Mặt đất có kết cấu cỏ vẽ bằng canvas (đợt 3), kích thước theo map mới
    const groundTex = makeGroundTexture(mapDef.id);
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(86, 86),
      new THREE.MeshStandardMaterial({ map: groundTex, color: 0xffffff, roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    const beyond = new THREE.Mesh(
      new THREE.CircleGeometry(190, 40),
      new THREE.MeshStandardMaterial({ color: mapDef.groundColor, roughness: 1 }),
    );
    beyond.rotation.x = -Math.PI / 2;
    beyond.position.y = -0.08;
    scene.add(beyond);

    const { clouds, sway, waters } = buildDecor(scene, mapDef.id);

    // Đợt 4: hạt bụi nắng / phấn hoa bay nhẹ trong không khí (rất nhẹ máy)
    const pCount = weakDevice ? 40 : 90;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 70;
      pPos[i * 3 + 1] = 0.6 + Math.random() * 5;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 70;
    }
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    const motes = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({
        color: mapDef.id === "beach" ? 0xffe9b0 : 0xffffff,
        size: 0.16, transparent: true, opacity: 0.65, depthWrite: false,
      }),
    );
    scene.add(motes);

    // Chim bay vòng trên trời (cả 2 map) — map sống động mà vẫn nhẹ
    const birds: {
      group: THREE.Group; wingL: THREE.Group; wingR: THREE.Group;
      radius: number; speed: number; phase: number; height: number;
      shadow: THREE.Mesh;
    }[] = [];
    for (const s of [
      { radius: 20, speed: 0.22, phase: 0, height: 13, color: 0xffffff },
      { radius: 25, speed: 0.16, phase: 2.2, height: 15, color: 0xffd93d },
      { radius: 16, speed: 0.27, phase: 4.1, height: 12, color: 0xa5d8ff },
    ]) {
      const b = buildBird(s.color);
      scene.add(b.group);
      // Bóng chim lướt trên mặt đất cho cảnh thật hơn
      const bShadow = new THREE.Mesh(
        new THREE.CircleGeometry(0.9, 18),
        new THREE.MeshBasicMaterial({ color: 0x1d4020, transparent: true, opacity: 0.18, depthWrite: false }),
      );
      bShadow.rotation.x = -Math.PI / 2;
      bShadow.position.y = 0.05;
      scene.add(bShadow);
      birds.push({
        group: b.group, wingL: b.wingL, wingR: b.wingR,
        radius: s.radius, speed: s.speed, phase: s.phase, height: s.height,
        shadow: bShadow,
      });
    }

    // Một chiếc xe chạy chậm qua lại trên làn đường dưới (chỉ thành phố),
    // không va chạm với nhân vật — chỉ chạy ngang để ngắm.
    let driveCar: THREE.Group | null = null;
    if (mapDef.id === "city") {
      driveCar = buildCar(0x3d7bff, 0x6fa8ff);
      driveCar.position.set(-29, 0, -4.4);
      scene.add(driveCar);
    }

    // Các đồ vật học từ vựng (vật chính + vật phụ cho nhiệm vụ màu/đếm)
    interface ObjEntry { def: WorldObjectDef; group: THREE.Group; ring: THREE.Mesh }
    const entries: ObjEntry[] = [];
    const clickTargets: THREE.Object3D[] = [];
    for (const def of allDefs(mapDef)) {
      const group = buildFor(def);
      if (!group) continue;
      if (def.inSky) group.position.set(def.x, 10.5, def.z);
      else group.position.set(def.x, 0, def.z);
      group.userData.objKey = instKey(def);
      const ring = makeRing(0xffc53d);
      if (!def.inSky) group.add(ring);
      group.traverse((c) => {
        c.userData.objKey = instKey(def);
      });
      scene.add(group);
      entries.push({ def, group, ring });
      clickTargets.push(group);
    }
    const byKey = new Map(entries.map((e) => [instKey(e.def), e]));

    // Nhân vật của bé
    const player = buildCharacter(character);
    player.position.set(0, 0, 9);
    scene.add(player);

    // Đợt 4: nhãn TÊN nhân vật lơ lửng trên đầu — sprite vẽ bằng canvas,
    // luôn quay mặt về camera (billboard), nền bán trong suốt bo tròn.
    {
      const c = document.createElement("canvas");
      c.width = 512; c.height = 128;
      const g2 = c.getContext("2d")!;
      const label = `⭐ ${character.nameVi}`;
      g2.font = "800 56px 'Baloo 2', 'Nunito', sans-serif";
      const tw = Math.min(480, g2.measureText(label).width + 56);
      const x0 = (512 - tw) / 2;
      g2.beginPath();
      g2.roundRect(x0, 22, tw, 84, 42);
      g2.fillStyle = "rgba(255,255,255,0.88)";
      g2.fill();
      g2.lineWidth = 5;
      g2.strokeStyle = "rgba(255,93,143,0.85)";
      g2.stroke();
      g2.fillStyle = "#3d2c3f";
      g2.textAlign = "center";
      g2.textBaseline = "middle";
      g2.fillText(label, 256, 66);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }),
      );
      sprite.scale.set(2.8, 0.7, 1);
      sprite.position.y = 2.72;
      player.add(sprite);
    }
    const playerPos = new THREE.Vector3(0, 0, 9);
    let facing = Math.PI; // hướng mặt ban đầu: nhìn về phía trước màn hình (-z)
    camYawRef.current = Math.PI;
    // Nút nhích trên màn hình: dx = sang ngang màn hình, dz = dọc màn hình
    // (lên = -1) → đổi sang hướng thế giới theo góc camera hiện tại.
    nudgeRef.current = (dx, dz) => {
      const yaw = camYawRef.current;
      const fx = Math.sin(yaw), fz = Math.cos(yaw);
      const rx = -fz, rz = fx;
      const wx = fx * -dz + rx * dx;
      const wz = fz * -dz + rz * dx;
      const stepLen = Math.hypot(wx, wz) || 1;
      playerPos.x = THREE.MathUtils.clamp(playerPos.x + (wx / stepLen) * 1.15, -WORLD_BOUND, WORLD_BOUND);
      playerPos.z = THREE.MathUtils.clamp(playerPos.z + (wz / stepLen) * 1.15, -WORLD_BOUND, WORLD_BOUND);
      facing = Math.atan2(wx, wz);
    };

    // Camera qua-vai gần ở tầm mắt: sau lưng, lệch vai phải, cao ~2.9
    camera.position.set(playerPos.x + 1.1, 2.9, playerPos.z + 5.2);
    camera.lookAt(playerPos.x, 1.5, playerPos.z - 6);

    // Bấm / chạm vào đồ vật → chọn vật
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const onPointerDown = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(clickTargets, true);
      const hit = hits[0];
      if (!hit) return;
      let obj: THREE.Object3D | null = hit.object;
      while (obj && !obj.userData.objKey) obj = obj.parent;
      const key = obj?.userData.objKey as string | undefined;
      if (!key) return;
      const entry = byKey.get(key);
      if (entry) handleSelectRef.current(entry.def);
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);

    // Bàn phím mũi tên
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.startsWith("Arrow")) {
        e.preventDefault();
        keysRef.current.add(e.key);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const onResize = () => {
      const w = mount.clientWidth;
      const h = Math.max(1, mount.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const resizeObs = new ResizeObserver(onResize);
    resizeObs.observe(mount);

    // Vòng lặp chạy game (bước cố định, delta kẹp)
    const clock = new THREE.Clock();
    let raf = 0;
    let elapsed = 0;
    let walkPhase = 0;
    const camTarget = new THREE.Vector3();
    const camLook = new THREE.Vector3(playerPos.x, 1.5, playerPos.z - 6);
    const animate = () => {
      raf = requestAnimationFrame(animate);
      try {
        const dt = Math.min(clock.getDelta(), 0.05);
        elapsed += dt;
        // Di chuyển THEO GÓC CAMERA: ↑ luôn là đi tới phía trước màn hình,
        // ← → luôn là sang trái/phải màn hình — như đôi mắt bé nhìn.
        const keys = keysRef.current;
        const inSide = (keys.has("ArrowRight") ? 1 : 0) - (keys.has("ArrowLeft") ? 1 : 0);
        const inFwd = (keys.has("ArrowUp") ? 1 : 0) - (keys.has("ArrowDown") ? 1 : 0);
        const moving = inSide !== 0 || inFwd !== 0;
        if (moving) {
          const yaw = camYawRef.current;
          const fx = Math.sin(yaw), fz = Math.cos(yaw);
          const rx = -fz, rz = fx;
          let wx = fx * inFwd + rx * inSide;
          let wz = fz * inFwd + rz * inSide;
          const len = Math.hypot(wx, wz) || 1;
          wx /= len; wz /= len;
          const speed = 8.5;
          playerPos.x = THREE.MathUtils.clamp(
            playerPos.x + wx * speed * dt, -WORLD_BOUND, WORLD_BOUND,
          );
          playerPos.z = THREE.MathUtils.clamp(
            playerPos.z + wz * speed * dt, -WORLD_BOUND, WORLD_BOUND,
          );
          facing = Math.atan2(wx, wz);
          walkPhase += dt * 10;
        }
        player.position.copy(playerPos);
        if (moving) {
          player.position.y = Math.abs(Math.sin(walkPhase)) * 0.1;
          player.scale.y = 1;
        } else {
          player.position.y = 0;
          // Nhịp thở nhẹ khi đứng yên cho nhân vật "sống"
          player.scale.y = 1 + Math.sin(elapsed * 2.4) * 0.022;
        }
        // Xoay mượt về hướng đi — ĐỢT 4: giới hạn tốc độ xoay ~140°/giây
        // kèm easing, nhân vật rẽ chậm và êm hơn, không giật/đảo hướng ngay.
        let diff = facing - player.rotation.y;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        const maxTurn = (140 * Math.PI) / 180 * dt;
        player.rotation.y += THREE.MathUtils.clamp(
          diff * Math.min(1, dt * 6), -maxTurn, maxTurn,
        );
        player.rotation.z = moving ? Math.sin(walkPhase) * 0.045 : 0;

        // ===== Camera như mắt thật: qua vai gần, tầm mắt trẻ em =====
        // Khi đi, góc nhìn xoay ÊM theo hướng đi (không giật, không xoay tự do bằng chuột).
        if (moving) {
          let yDiff = facing - camYawRef.current;
          while (yDiff > Math.PI) yDiff -= Math.PI * 2;
          while (yDiff < -Math.PI) yDiff += Math.PI * 2;
          // ĐỢT 4: camera cũng xoay chậm lại (~120°/giây tối đa) cho êm mắt.
          const maxCamTurn = (120 * Math.PI) / 180 * dt;
          camYawRef.current += THREE.MathUtils.clamp(
            yDiff * Math.min(1, dt * 2.2), -maxCamTurn, maxCamTurn,
          );
        }
        const yawNow = camYawRef.current;
        const cf = { x: Math.sin(yawNow), z: Math.cos(yawNow) };
        const cr = { x: -cf.z, z: cf.x };
        const bobY = moving ? Math.sin(walkPhase * 2) * 0.055 : Math.sin(elapsed * 2.4) * 0.015;
        camTarget.set(
          playerPos.x - cf.x * 5.2 + cr.x * 1.15,
          2.95 + bobY,
          playerPos.z - cf.z * 5.2 + cr.z * 1.15,
        );
        camera.position.lerp(camTarget, Math.min(1, dt * 5 + 0.015));
        // Điểm nhìn: trước mặt nhân vật; 1 giây đầu nhiệm vụ mới lia nhẹ về phía vật cần tìm
        const lookBase = new THREE.Vector3(
          playerPos.x + cf.x * 7,
          1.45 + bobY * 0.5,
          playerPos.z + cf.z * 7,
        );
        const sinceMission = (Date.now() - missionStartRef.current) / 1000;
        const gNow = guideRef.current;
        if (gNow && sinceMission < 1.15) {
          const blend = (1 - sinceMission / 1.15) * 0.38;
          lookBase.lerp(new THREE.Vector3(gNow.x, 1.4, gNow.z), blend);
        }
        camLook.lerp(lookBase, Math.min(1, dt * 6 + 0.02));
        camera.lookAt(camLook);

        // Mây trôi chậm
        for (const c of clouds) {
          c.position.x += dt * 0.55;
          if (c.position.x > 42) c.position.x = -42;
        }

        // Đợt 4: cỏ hoa & cây trang trí đung đưa theo gió; mặt nước gợn
        // sáng lăn tăn (đổi độ nhám/độ mờ theo sóng sin); hạt nắng bay nhẹ.
        for (let i = 0; i < sway.length; i++) {
          sway[i]!.rotation.z = Math.sin(elapsed * 1.6 + i * 1.35) * 0.032;
        }
        for (const w of waters) {
          const wm = w.material as THREE.MeshStandardMaterial;
          if (typeof wm.roughness === "number") {
            wm.roughness = 0.32 + Math.sin(elapsed * 2.2) * 0.1;
          }
          if (wm.transparent) wm.opacity = 0.6 + Math.sin(elapsed * 2.6) * 0.18;
        }
        motes.rotation.y = elapsed * 0.012;
        motes.position.y = Math.sin(elapsed * 0.45) * 0.25;

        // Chim bay vòng tròn, vỗ cánh
        for (const b of birds) {
          const a = elapsed * b.speed + b.phase;
          b.group.position.set(
            Math.cos(a) * b.radius,
            b.height + Math.sin(elapsed * 0.8 + b.phase) * 0.7,
            Math.sin(a) * b.radius,
          );
          b.group.rotation.y = -a;
          const flap = Math.sin(elapsed * 9 + b.phase) * 0.55;
          b.wingR.rotation.z = flap;
          b.wingL.rotation.z = -flap;
          b.shadow.position.x = b.group.position.x;
          b.shadow.position.z = b.group.position.z;
        }

        // Xe chạy qua lại trên làn đường dưới (thành phố)
        if (driveCar) {
          const s = (elapsed * 5.2) % 116;
          if (s < 58) {
            driveCar.position.set(-29 + s, 0, -4.4);
            driveCar.rotation.y = 0;
          } else {
            driveCar.position.set(29 - (s - 58), 0, -4.4);
            driveCar.rotation.y = Math.PI;
          }
        }

        // Mũi tên chỉ đường: xoay theo hướng từ nhân vật tới vật của nhiệm vụ
        const gTarget = guideRef.current;
        const aWrap = arrowWrapRef.current;
        const aInner = arrowInnerRef.current;
        if (aWrap && aInner) {
          if (!gTarget) {
            aWrap.style.opacity = "0";
          } else {
            const adx = gTarget.x - playerPos.x;
            const adz = gTarget.z - playerPos.z;
            if (Math.hypot(adx, adz) < 3.2) {
              aWrap.style.opacity = "0";
            } else {
              aWrap.style.opacity = "1";
              // Mũi tên tính theo góc camera hiện tại: lên = phía trước mắt bé
              const distA = Math.hypot(adx, adz);
              aWrap.style.transform = `translateX(-50%) scale(${distA > 26 ? 1.22 : 1})`;
              // ĐỢT 4: mũi tên chỉ đường XOAY DẦN về hướng đích (tối đa
              // ~130°/giây, có easing) thay vì đảo hướng ngay lập tức.
              const targetAng = camYawRef.current - Math.atan2(adx, adz);
              if (arrowAngleRef.current === null) arrowAngleRef.current = targetAng;
              let aDiff = targetAng - arrowAngleRef.current;
              while (aDiff > Math.PI) aDiff -= Math.PI * 2;
              while (aDiff < -Math.PI) aDiff += Math.PI * 2;
              const maxArrowTurn = (130 * Math.PI) / 180 * dt;
              arrowAngleRef.current += THREE.MathUtils.clamp(
                aDiff * Math.min(1, dt * 3), -maxArrowTurn, maxArrowTurn,
              );
              aInner.style.transform = `rotate(${(arrowAngleRef.current * 180) / Math.PI}deg)`;
            }
          }
        }

        // Vật ở gần → vòng sáng + báo cho giao diện hiện gợi ý
        let nearest: ObjEntry | null = null;
        let nearestDist = Infinity;
        for (const entry of entries) {
          if (entry.def.inSky) continue;
          const d = Math.hypot(
            entry.group.position.x - playerPos.x,
            entry.group.position.z - playerPos.z,
          );
          if (d < nearestDist) {
            nearestDist = d;
            nearest = entry;
          }
          const key = instKey(entry.def);
          // Hiệu ứng nảy khi được bấm chọn / phát sáng nhấp nháy khi là gợi ý
          let scaleF = 1;
          const bStart = bounceRef.current.get(key);
          if (bStart) {
            const t = (performance.now() - bStart) / 650;
            if (t >= 1) {
              bounceRef.current.delete(key);
              // Trả các biến đổi của hiệu ứng tương tác về như cũ
              entry.group.rotation.z = 0;
              entry.group.rotation.x = 0;
              if (entry.def.id === "book") entry.group.rotation.y = 0;
              if (entry.def.id === "ball" || entry.def.id === "monkey" || entry.def.id === "duck")
                entry.group.position.y = 0;
              if (["car", "bus", "truck", "boat"].includes(entry.def.id))
                entry.group.position.x = entry.def.x;
            } else {
              scaleF = 1 + 0.28 * Math.sin(t * Math.PI);
            }
          } else if (hintKeyRef.current === key) {
            scaleF = 1 + 0.17 * Math.sin(elapsed * 7);
          }
          entry.group.scale.setScalar(scaleF);
          if (entry.def.id === "sun") entry.group.rotation.z += dt * 0.25;
          if (entry.def.id === "fish") {
            // Cá thỉnh thoảng nhảy vọt lên khỏi mặt hồ rồi rơi xuống
            const ph = elapsed % 3.8;
            if (ph < 1) {
              entry.group.position.y = Math.sin(ph * Math.PI) * 1.6;
              entry.group.rotation.x = -Math.sin(ph * Math.PI) * 1.1;
            } else {
              entry.group.position.y = 0;
              entry.group.rotation.x = 0;
            }
          }
          // Chuyển động riêng của con vật cho cảnh sống động (đợt 3)
          const ph2 = entry.def.x * 1.7 + entry.def.z * 2.3;
          if (entry.def.id === "chicken") {
            // Gà mổ thóc: cúi xuống từng nhịp ngắn
            const peck = Math.pow(Math.max(0, Math.sin(elapsed * 2.1 + ph2)), 6);
            entry.group.rotation.x = peck * 0.38;
          } else if (entry.def.id === "duck") {
            // Vịt bơi vòng tròn nhỏ quanh chỗ đứng + lúc lắc thân
            entry.group.position.x = entry.def.x + Math.cos(elapsed * 0.55 + ph2) * 0.85;
            entry.group.position.z = entry.def.z + Math.sin(elapsed * 0.55 + ph2) * 0.85;
            entry.group.rotation.y = -(elapsed * 0.55 + ph2) + Math.PI;
            entry.group.rotation.z = Math.sin(elapsed * 3 + ph2) * 0.05;
          } else if (entry.def.id === "dog") {
            // Chó vẫy đuôi: lắc thân nhẹ + thỉnh thoảng nhảy mừng
            entry.group.rotation.y = Math.sin(elapsed * 2.2 + ph2) * 0.1;
            entry.group.position.y = Math.max(0, Math.sin(elapsed * 1.4 + ph2)) > 0.92 ? 0.16 : 0;
          } else if (entry.def.id === "horse" || entry.def.id === "goat") {
            // Ngựa/dê gặm cỏ: cúi đầu chậm rãi từng đợt
            const graze = (Math.sin(elapsed * 0.6 + ph2) + 1) / 2;
            entry.group.rotation.x = graze > 0.72 ? 0.1 : 0;
            entry.group.rotation.y = Math.sin(elapsed * 0.4 + ph2) * 0.06;
          } else if (entry.def.id === "cat") {
            entry.group.rotation.y = Math.sin(elapsed * 0.9 + ph2) * 0.14;
          } else if (entry.def.id === "frog") {
            // Ếch thỉnh thoảng nhảy tại chỗ
            const jp = elapsed % 2.9;
            entry.group.position.y = jp < 0.5 ? Math.sin((jp / 0.5) * Math.PI) * 0.55 : 0;
          }
          // ĐỢT 4: PHẢN ỨNG khi bé bấm vào vật — mỗi loại một hành động vui
          // (chuông rung leng keng, bóng nảy, xe chạy một đoạn, sách mở ra,
          // cây rung quả, cá nhảy cao, khỉ nhảy, vịt nhảy mừng…).
          const rb = bounceRef.current.get(key);
          if (rb) {
            const rt = (performance.now() - rb) / 650;
            if (rt >= 0 && rt < 1) {
              const decay = 1 - rt;
              const id = entry.def.id;
              if (id === "bell") {
                entry.group.rotation.z = Math.sin(rt * Math.PI * 6) * 0.32 * decay;
              } else if (id === "ball") {
                entry.group.position.y = Math.abs(Math.sin(rt * Math.PI * 2)) * 0.9 * decay;
              } else if (id === "car" || id === "bus" || id === "truck" || id === "boat") {
                entry.group.position.x = entry.def.x + Math.sin(rt * Math.PI) * 1.7;
              } else if (id === "duck") {
                entry.group.position.y = Math.abs(Math.sin(rt * Math.PI * 3)) * 0.35 * decay;
              } else if (id === "book") {
                entry.group.rotation.y = Math.sin(rt * Math.PI) * 0.8;
              } else if (
                id === "tree" || id === "apple" || id === "lemon" ||
                id === "grape" || id === "banana"
              ) {
                entry.group.rotation.z = Math.sin(rt * Math.PI * 8) * 0.07 * decay;
              } else if (id === "fish") {
                entry.group.position.y = Math.max(
                  entry.group.position.y, Math.sin(rt * Math.PI) * 2.3,
                );
              } else if (id === "monkey") {
                entry.group.position.y = Math.abs(Math.sin(rt * Math.PI * 3)) * 0.55 * decay;
              } else if (id === "elephant") {
                entry.group.rotation.x = Math.sin(rt * Math.PI * 2) * 0.05 * decay;
              } else if (id === "flower") {
                entry.group.scale.setScalar(scaleF * (1 + 0.3 * Math.sin(rt * Math.PI)));
              }
            }
          }
        }
        for (const entry of entries) {
          const ringMat = entry.ring.material as THREE.MeshBasicMaterial;
          const key = instKey(entry.def);
          const isNear = nearest === entry && nearestDist < 6;
          let targetOpacity = isNear ? 0.55 + 0.35 * Math.sin(elapsed * 5) : 0;
          if (hintKeyRef.current === key) {
            targetOpacity = 0.8 + 0.2 * Math.sin(elapsed * 7);
          }
          if (countedKeysRef.current.has(key)) {
            // Bạn đã đếm trong nhiệm vụ đếm số: vòng xanh ngọc ở lại
            ringMat.color.setHex(0x2ec4b6);
            targetOpacity = Math.max(targetOpacity, 0.85);
          }
          ringMat.opacity += (targetOpacity - ringMat.opacity) * Math.min(1, dt * 10);
        }
        const nearKey = nearest && nearestDist < 6 ? instKey(nearest.def) : null;
        if (nearKey !== nearIdRef.current) {
          nearIdRef.current = nearKey;
          setNearDef(nearest && nearestDist < 6 ? nearest.def : null);
        }
      } catch {
        /* giữ vòng lặp sống */
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      resizeObs.disconnect();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      nudgeRef.current = null;
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const m = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(m)) m.forEach((x) => x.dispose());
        else if (m) m.dispose();
      });
      renderer.dispose();
      if (renderer.domElement.parentElement === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, charId, mapId, roundKey]);

  // ---------- Nút mũi tên trên màn hình (bấm giữ để đi, chạm để nhích một bước) ----------
  const padBtn =
    "flex h-12 w-12 items-center justify-center rounded-full bg-white/80 text-2xl shadow-lg ring-1 ring-black/10 select-none backdrop-blur-[2px] transition-opacity active:bg-[#FFE3EE] active:opacity-100 sm:h-14 sm:w-14";
  const padHandlers = (key: string, dx: number, dz: number) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      keysRef.current.add(key);
      nudgeRef.current?.(dx * 1.1, dz * 1.1);
    },
    onPointerUp: () => keysRef.current.delete(key),
    onPointerLeave: () => keysRef.current.delete(key),
    onPointerCancel: () => keysRef.current.delete(key),
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  });

  const stepsBar = (
    <div className="mt-3 flex items-center justify-center gap-2 text-sm font-bold text-[var(--dim)]" aria-hidden>
      <span className={step === "character" ? "text-[var(--accent)]" : ""}>1️⃣ Chọn bạn</span>
      <span>➜</span>
      <span className={step === "map" ? "text-[var(--accent)]" : ""}>2️⃣ Chọn nơi</span>
      <span>➜</span>
      <span className={step === "play" ? "text-[var(--accent)]" : ""}>3️⃣ Khám phá!</span>
    </div>
  );

  // ===== Bước 1: Chọn nhân vật =====
  if (step === "character") {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 pb-10">
        <button
          type="button"
          onClick={onBack}
          aria-label="Quay về trang chủ"
          className="font-display mt-4 rounded-full bg-white px-4 py-2 text-base font-extrabold shadow-md active:scale-95"
        >
          ‹ Trang chủ
        </button>
        <h2 className="font-display mt-4 text-center text-3xl font-extrabold sm:text-4xl">
          🎮 Game Khám Phá 3D
        </h2>
        <p className="mt-1 text-center text-lg font-bold text-[var(--dim)]">
          Con chọn một người bạn đồng hành nhé!
        </p>
        {stepsBar}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {CHARACTERS.map((c) => {
            const chosen = character?.id === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setCharacter(c);
                  speakDevice(
                    c.id === "bill" ? "Bill" : c.nameVi,
                    c.id === "bill" ? "en-US" : "vi-VN",
                  );
                }}
                aria-label={`Chọn nhân vật ${c.nameVi}: ${c.descVi}`}
                aria-pressed={chosen}
                className={`rounded-[26px] bg-white p-4 text-center shadow-md transition-transform active:scale-95 ${
                  chosen ? "mc-pop ring-4 ring-[var(--accent)]" : ""
                }`}
                style={{ borderBottom: `7px solid ${chosen ? "var(--accent)" : "var(--border)"}` }}
              >
                <span className={`block text-7xl ${chosen ? "mc-bounce-soft" : ""}`} aria-hidden>
                  {c.emoji}
                </span>
                <span className="font-display mt-2 block text-2xl font-extrabold">{c.nameVi}</span>
                <span className="block text-sm font-bold text-[var(--dim)]">{c.nameEn}</span>
                <span className="mt-1 block text-sm font-semibold text-[var(--dim)]">{c.descVi}</span>
                {chosen && (
                  <span className="font-display mt-2 inline-block rounded-full bg-[var(--accent)] px-3 py-1 text-sm font-extrabold text-white">
                    ✓ Đã chọn bạn này!
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          disabled={!character}
          onClick={() => setStep("map")}
          aria-label="Tiếp tục: đi chọn nơi khám phá"
          className="font-display mx-auto mt-6 block rounded-full bg-[var(--accent)] px-8 py-4 text-2xl font-extrabold text-white shadow-lg active:scale-95 disabled:opacity-40"
        >
          {character ? `Đi với ${character.nameVi} ▶` : "Hãy chọn một người bạn trước nhé"}
        </button>
      </main>
    );
  }

  // ===== Bước 2: Chọn nơi khám phá =====
  if (step === "map") {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 pb-10">
        <button
          type="button"
          onClick={() => setStep("character")}
          aria-label="Quay lại chọn nhân vật"
          className="font-display mt-4 rounded-full bg-white px-4 py-2 text-base font-extrabold shadow-md active:scale-95"
        >
          ‹ Chọn lại bạn
        </button>
        <h2 className="font-display mt-4 text-center text-3xl font-extrabold sm:text-4xl">
          {character?.emoji} {character?.nameVi} muốn đi đâu?
        </h2>
        <p className="mt-1 text-center text-lg font-bold text-[var(--dim)]">
          Chọn một nơi để khám phá và học từ mới nhé!
        </p>
        {stepsBar}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {MAPS.map((m) => {
            const chosen = mapDef?.id === m.id;
            const foundSet = discovered.get(m.id);
            const foundN = foundSet?.size ?? 0;
            const complete = foundN >= m.objects.length;
            return (
              <div
                key={m.id}
                className={`overflow-hidden rounded-[26px] bg-white shadow-md ${chosen ? "ring-4 ring-[var(--mint)]" : ""}`}
              >
                <button
                  type="button"
                  onClick={() => setMapDef(m)}
                  aria-label={`Chọn nơi khám phá: ${m.nameVi} — ${m.nameEn}. ${m.descVi}`}
                  aria-pressed={chosen}
                  className="block w-full p-5 text-left active:scale-[0.99]"
                >
                  <span className="block text-center text-8xl" aria-hidden>{m.emoji}</span>
                  <span className="font-display mt-2 block text-center text-3xl font-extrabold">
                    {m.nameEn}
                  </span>
                  <span className="block text-center text-lg font-bold text-[var(--dim)]">
                    {m.nameVi}
                  </span>
                  <span className="mt-1 block text-center font-semibold text-[var(--dim)]">
                    {m.descVi}
                  </span>
                  <span className="mt-2 block text-center text-2xl" aria-hidden>
                    {m.objects.slice(0, 6).map((d) => d.emoji).join(" ")}
                  </span>
                  {chosen && (
                    <span className="font-display mx-auto mt-2 block w-fit rounded-full bg-[var(--mint)] px-3 py-1 text-sm font-extrabold text-white">
                      ✓ Đã chọn nơi này!
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => speakBilingual(m.nameVi, m.nameEn)}
                  aria-label={`Nghe tên nơi: ${m.nameVi} — ${m.nameEn}`}
                  className="font-display block w-full bg-[var(--space-surface-alt)] py-2.5 text-base font-extrabold active:scale-[0.99]"
                >
                  🔊 Nghe tên nơi này
                </button>
                {/* Sổ Khám Phá của map này */}
                <div className="px-5 pt-3 pb-4">
                  <p className="font-display text-center text-base font-extrabold">
                    🧭 Sổ Khám Phá: {foundN}/{m.objects.length} bạn
                    {complete ? " — Đủ hết rồi! 🏆" : ""}
                  </p>
                  <div className="mt-1.5 flex flex-wrap justify-center gap-1 text-2xl" aria-hidden>
                    {m.objects.map((d) => {
                      const got = foundSet?.has(bookKey(d)) ?? false;
                      return (
                        <span key={bookKey(d)} className={got ? "" : "opacity-40 grayscale"}>
                          {got ? d.emoji : "❔"}
                        </span>
                      );
                    })}
                  </div>
                  <p className="mt-1 text-center text-xs font-semibold text-[var(--dim)]">
                    Bấm vào đồ vật trong game để sưu tập vào sổ. Tìm đủ hết được
                    tặng sticker Thám Hiểm vào Bộ sưu tập!
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <button
          type="button"
          disabled={!mapDef}
          onClick={() => {
            if (!mapDef) return;
            startRound(mapDef);
            setRoundKey((k) => k + 1);
            setStep("play");
          }}
          aria-label="Vào thế giới 3D để chơi"
          className="font-display mx-auto mt-6 block rounded-full bg-[var(--mint)] px-8 py-4 text-2xl font-extrabold text-white shadow-lg active:scale-95 disabled:opacity-40"
        >
          {mapDef ? `Vào ${mapDef.nameVi} chơi thôi! ▶` : "Hãy chọn một nơi trước nhé"}
        </button>
        <p className="mt-4 text-center font-semibold text-[var(--dim)]">
          Cách chơi: dùng phím mũi tên ⌨️ hoặc nút mũi tên trên màn hình để đi,
          rồi bấm vào đồ vật để nghe tên tiếng Anh nhé!
        </p>
      </main>
    );
  }

  // ===== Bước 3: Thế giới 3D =====
  const mText = mission ? missionText(mission) : null;
  return (
    <main className="mx-auto w-full max-w-5xl px-3 pb-8 sm:px-4">
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          aria-label="Thoát game, quay về trang chủ"
          className="font-display rounded-full bg-white px-4 py-2 text-base font-extrabold shadow-md active:scale-95"
        >
          ‹ Trang chủ
        </button>
        <span className="font-display text-base font-extrabold sm:text-lg">
          🎮 {mapDef?.nameVi} · {character?.emoji} {character?.nameVi}
        </span>
        <span className="ml-auto flex gap-1.5">
          <span
            className="font-display rounded-full bg-white px-2.5 py-1 text-xs font-extrabold shadow"
            aria-label={`Sổ Khám Phá ${mapDef?.nameVi}: đã tìm thấy ${bookFoundHere} trên ${mapDef?.objects.length ?? 0} bạn`}
          >
            📖 {bookFoundHere}/{mapDef?.objects.length ?? 0}
          </span>
          <button
            type="button"
            onClick={() => setStep("character")}
            aria-label="Đổi nhân vật khác"
            className="font-display rounded-full bg-white px-2.5 py-1 text-xs font-extrabold shadow active:scale-95"
          >
            🔄 Đổi bạn
          </button>
          <button
            type="button"
            onClick={() => setStep("map")}
            aria-label="Đổi nơi khám phá khác"
            className="font-display rounded-full bg-white px-2.5 py-1 text-xs font-extrabold shadow active:scale-95"
          >
            🗺️ Đổi nơi
          </button>
        </span>
      </div>

      <div className="relative mt-3 touch-none overflow-hidden rounded-[24px] shadow-lg ring-1 ring-black/10">
        <div
          ref={mountRef}
          className="w-full bg-[#87ceeb] [&>canvas]:block"
          style={{ height: "min(60vh, 540px)", minHeight: 360 }}
          aria-label={`Thế giới 3D ${mapDef?.nameVi}: dùng phím mũi tên để di chuyển, bấm vào đồ vật để học từ tiếng Anh`}
        />
        <Confetti burstKey={confettiKey} />

        {/* Panel nhiệm vụ — đợt 3: hiện to vài giây đầu, sau đó thu thành
            thanh nhỏ gọn 1 dòng ở mép trên để không che cảnh */}
        {!finished && mission && mText && missionPanelBig && (
          <div className="mc-pop absolute top-2 left-2 max-w-[76%] rounded-[18px] bg-white/95 p-2.5 shadow-lg sm:max-w-[320px]">
            <div className="flex items-center gap-2">
              <span className="text-xl" aria-hidden>
                {mission.kind === "color" ? "🎨" : mission.kind === "count" ? "🔢" : mission.kind === "riddle" ? "🤔" : "🎯"}
              </span>
              <span className="font-display text-xs font-extrabold text-[var(--dim)]">
                NHIỆM VỤ MỚI {missionIndex + 1}/{missions.length} · ⭐ {foundCount}
              </span>
              <span className="ml-auto flex gap-1" aria-hidden>
                {missions.map((_, i) => (
                  <span
                    key={i}
                    className={`h-2 w-2 rounded-full ${
                      i < missionIndex
                        ? "bg-[var(--mint)]"
                        : i === missionIndex
                          ? "bg-[var(--accent)]"
                          : "bg-[#E8D8CE]"
                    }`}
                  />
                ))}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-3xl" aria-hidden>{mText.emoji}</span>
              {mission.kind === "color" && (
                <span
                  className="h-7 w-7 shrink-0 rounded-full shadow ring-2 ring-white"
                  style={{ background: COLORS[mission.colorId].css }}
                  aria-hidden
                />
              )}
              <div className="min-w-0">
                <p className="font-display text-lg leading-tight font-extrabold">
                  {mText.enTitle}
                </p>
                <p className="text-[13px] leading-tight font-bold text-[var(--dim)]">{mText.viTitle}</p>
              </div>
            </div>
            {mission.kind === "count" && (
              <p
                className="font-display mt-1 text-sm font-extrabold text-[var(--mint)]"
                aria-label={`Đã bấm ${countTapped} trên ${mission.need} bạn`}
              >
                Đã bấm: {"⭐".repeat(countTapped)}
                {"☆".repeat(Math.max(0, mission.need - countTapped))} ({countTapped}/
                {mission.need})
              </p>
            )}
            <div className="mt-1.5 flex gap-1.5">
              <button
                type="button"
                onClick={speakMission}
                aria-label={`Nghe lại nhiệm vụ: ${mText.viTitle} — ${mText.enTitle}`}
                className="font-display flex-1 rounded-full bg-[var(--sun)] px-3 py-1.5 text-[13px] font-extrabold shadow active:scale-95"
              >
                🔊 Nghe lại nhiệm vụ
              </button>
              <button
                type="button"
                onClick={skipMission}
                aria-label="Bỏ qua nhiệm vụ này, sang nhiệm vụ khác"
                className="font-display rounded-full bg-white px-3 py-1.5 text-[13px] font-extrabold shadow ring-1 ring-black/10 active:scale-95"
              >
                ⏭ Bỏ qua
              </button>
            </div>
            {hintActive && guideTargetDef && (
              <p className="mc-pop font-display mt-1.5 rounded-xl bg-[#FFF0D6] px-2.5 py-1.5 text-[13px] font-extrabold" role="status">
                {mission.kind === "hide"
                  ? hideHintText(guideTargetDef)
                  : mission.kind === "riddle"
                    ? `💡 Gợi ý câu đố: đáp án bắt đầu bằng chữ “${guideTargetDef.en.charAt(0).toUpperCase()}” — ${hideHintText(guideTargetDef)}`
                    : `💡 Nhìn kìa! Bạn ${guideTargetDef.emoji} đang phát sáng nhấp nháy đó!`}
              </p>
            )}
            {mission.kind === "riddle" && !hintActive && (
              <p className="font-display mt-1.5 rounded-xl bg-[#F0EEFF] px-2.5 py-1.5 text-[13px] font-extrabold" role="status">
                🤔 Nghe câu đố, suy nghĩ rồi đi tìm bạn đó nhé! Bấm 🔊 để nghe lại câu đố.
              </p>
            )}
          </div>
        )}
        {!finished && mission && mText && !missionPanelBig && (
          <div className="absolute top-2 right-2 left-2 flex h-11 items-center gap-1.5 rounded-full bg-white/90 pr-1.5 pl-3 shadow-md backdrop-blur-[2px]">
            <button
              type="button"
              onClick={() => {
                setMissionPanelBig(true);
                window.setTimeout(() => setMissionPanelBig(false), 3000);
              }}
              aria-label={`Xem nhiệm vụ ${missionIndex + 1} trên ${missions.length}: ${mText.viTitle} — ${mText.enTitle}`}
              className="flex min-w-0 flex-1 items-center gap-1.5 text-left active:scale-[0.99]"
            >
              <span className="font-display shrink-0 text-xs font-extrabold text-[var(--dim)]">
                {missionIndex + 1}/{missions.length}
              </span>
              <span className="shrink-0 text-xl" aria-hidden>{mText.emoji}</span>
              {mission.kind === "color" && (
                <span
                  className="h-4 w-4 shrink-0 rounded-full ring-1 ring-black/10"
                  style={{ background: COLORS[mission.colorId].css }}
                  aria-hidden
                />
              )}
              <span className="font-display truncate text-[13px] font-extrabold">
                {mText.enTitle}
                <span className="font-bold text-[var(--dim)]"> · {mText.viTitle}</span>
                {mission.kind === "count" ? (
                  <span className="text-[var(--mint)]"> · {countTapped}/{mission.need} ⭐</span>
                ) : null}
              </span>
            </button>
            {hintActive && guideTargetDef && (
              <span className="shrink-0 text-base" role="status" aria-label={`Gợi ý: bạn ${guideTargetDef.en} đang phát sáng nhấp nháy`}>
                💡
              </span>
            )}
            <button
              type="button"
              onClick={speakMission}
              aria-label={`Nghe lại nhiệm vụ: ${mText.viTitle} — ${mText.enTitle}`}
              className="font-display flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--sun)] text-base shadow active:scale-90"
            >
              🔊
            </button>
            <button
              type="button"
              onClick={skipMission}
              aria-label="Bỏ qua nhiệm vụ này, sang nhiệm vụ khác"
              className="font-display flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-base shadow ring-1 ring-black/10 active:scale-90"
            >
              ⏭
            </button>
          </div>
        )}

        {/* Mũi tên chỉ đường tới vật của nhiệm vụ */}
        {!finished && guideTargetDef && !guideTargetDef.inSky && (
          <div
            ref={arrowWrapRef}
            className="pointer-events-none absolute bottom-24 left-1/2 z-10 -translate-x-1/2 transition-opacity duration-300"
            style={{ opacity: 0 }}
            aria-hidden
          >
            <div className="relative flex h-[68px] w-[68px] items-center justify-center rounded-full bg-white/95 shadow-xl ring-4 ring-[var(--sun)]">
              <span ref={arrowInnerRef} className="block text-4xl leading-none">
                ⬆️
              </span>
              <span className="absolute -top-2 -right-2 rounded-full bg-white px-1 text-lg shadow">
                {guideTargetDef.emoji}
              </span>
            </div>
            <p
              className="font-display mt-1 text-center text-xs font-extrabold text-white"
              style={{ textShadow: "0 1px 4px rgba(0,0,0,0.55)" }}
            >
              Đi theo mũi tên!
            </p>
          </div>
        )}

        {/* Thẻ từ / gợi ý — góc dưới trái */}
        {wordCard ? (
          <div className="mc-pop absolute bottom-3 left-3 w-[min(320px,60%)] rounded-[20px] bg-white/97 p-3 shadow-lg">
            <div className="flex items-center gap-3">
              <span className="text-5xl" aria-hidden>{wordCard.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-3xl leading-none font-extrabold">{cardTitle}</p>
                <p className="text-sm font-bold text-[var(--dim)]">
                  {cardIpa} · {cardVi}
                </p>
              </div>
              <button
                type="button"
                onClick={() => playWordAudioChained(wordCard)}
                aria-label={`Nghe lại từ ${cardTitle}`}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-2xl text-white shadow active:scale-90"
              >
                🔊
              </button>
              <button
                type="button"
                onClick={() => setWordCard(null)}
                aria-label="Đóng thẻ từ"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F6E8E0] text-base font-extrabold active:scale-90"
              >
                ✕
              </button>
            </div>
            {feedback && (
              <p
                className={`font-display mt-2 rounded-xl px-3 py-2 text-sm leading-snug font-extrabold ${
                  feedback.kind === "good" ? "bg-[#D8F5F0]" : "bg-[#FFF0D6]"
                }`}
                role="status"
              >
                {feedback.kind === "good" ? "🎉 " : "💪 "}
                {feedback.text}
              </p>
            )}
            {/* Nói theo cô: nghe mẫu → đọc lại → cô chấm điểm */}
            <div className="mt-2 border-t-2 border-dashed border-[#F6E8E0] pt-2">
              <button
                type="button"
                onClick={startSayIt}
                disabled={sayPhase === "listening" || sayPhase === "model"}
                aria-label={`Nói theo cô: nghe cô đọc mẫu rồi đọc lại từ ${cardTitle} để cô chấm điểm`}
                className="font-display w-full rounded-full bg-[var(--sky)] px-3 py-2 text-base font-extrabold text-white shadow active:scale-95 disabled:opacity-60"
              >
                {sayPhase === "model"
                  ? "🔊 Nghe cô đọc nè…"
                  : sayPhase === "listening"
                    ? "🎤 Cô đang nghe… con đọc to nhé!"
                    : "🎤 Nói theo cô"}
              </button>
              {sayPhase === "scored" && sayScore !== null && (
                <p
                  className="mc-pop font-display mt-2 rounded-xl bg-[#D8F5F0] px-3 py-2 text-center text-sm leading-snug font-extrabold"
                  role="status"
                >
                  {sayScore >= 80
                    ? "⭐⭐⭐ Đọc hay quá! Cô khen con!"
                    : sayScore >= 50
                      ? "⭐⭐ Đọc tốt lắm! Đọc lại lần nữa để được 3 sao nhé!"
                      : "⭐ Gần được rồi! Nghe cô đọc lại rồi mình đọc theo nhé!"}
                  <span className="block text-xs font-bold text-[var(--dim)]">
                    Điểm đọc của con: {sayScore}/100
                  </span>
                </p>
              )}
              {(sayPhase === "unsupported" || sayPhase === "error") && sayMsg && (
                <p
                  className="mc-pop font-display mt-2 rounded-xl bg-[#FFF0D6] px-3 py-2 text-center text-sm leading-snug font-extrabold"
                  role="status"
                >
                  💪 {sayMsg}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="absolute bottom-3 left-3 max-w-[58%] rounded-full bg-black/45 px-4 py-2 text-sm font-bold text-white">
            {nearDef
              ? `👉 Gần bạn ${nearDef.emoji} ${nearDef.en} — Bấm vào tớ!`
              : "🚶 Đi dạo quanh và bấm vào một đồ vật nhé!"}
          </div>
        )}

        {/* Bàn phím ảo — góc dưới phải */}
        <div
          className="absolute right-3 bottom-3 grid grid-cols-3 gap-1.5"
          role="group"
          aria-label="Bàn phím mũi tên trên màn hình để di chuyển nhân vật"
        >
          <span />
          <button type="button" aria-label="Đi tới" className={padBtn} {...padHandlers("ArrowUp", 0, -1)}>
            ⬆️
          </button>
          <span />
          <button type="button" aria-label="Sang trái" className={padBtn} {...padHandlers("ArrowLeft", -1, 0)}>
            ⬅️
          </button>
          <button type="button" aria-label="Đi lui" className={padBtn} {...padHandlers("ArrowDown", 0, 1)}>
            ⬇️
          </button>
          <button type="button" aria-label="Sang phải" className={padBtn} {...padHandlers("ArrowRight", 1, 0)}>
            ➡️
          </button>
        </div>

        {/* Ăn mừng nhận sticker Thám Hiểm khi tìm đủ 100% vật của map */}
        {stickerPop && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
            <div className="mc-pop w-full max-w-sm rounded-[26px] bg-white p-6 text-center shadow-2xl">
              <p className="text-6xl" aria-hidden>
                {MAPS.find((m) => `stk-explorer-${m.id}` === stickerPop)?.emoji ?? "🧭"}
              </p>
              <p className="font-display mt-2 text-3xl font-extrabold">Tìm đủ hết rồi!</p>
              <p className="mt-1 font-bold text-[var(--dim)]">
                Con đã khám phá hết mọi bạn ở {mapDef?.nameVi} và nhận được
                sticker Thám Hiểm mới trong Bộ sưu tập! 🎁
              </p>
              <button
                type="button"
                onClick={() => setStickerPop(null)}
                aria-label="Đóng thông báo nhận sticker, chơi tiếp"
                className="font-display mt-4 w-full rounded-full bg-[var(--accent)] py-3 text-xl font-extrabold text-white shadow active:scale-95"
              >
                Tuyệt vời! Chơi tiếp ▶
              </button>
            </div>
          </div>
        )}

        {/* Đợt 4: lớp chuyển cảnh sang map tiếp theo */}
        {transitionTo && (
          <div
            className="absolute inset-0 z-30 flex items-center justify-center p-4"
            style={{
              background:
                "linear-gradient(160deg, rgba(61,143,209,0.92), rgba(46,196,182,0.92))",
            }}
            role="status"
            aria-label={`Đang chuyển sang ${transitionTo.nameVi}`}
          >
            <div className="mc-pop text-center text-white">
              <p className="mc-bounce-soft text-8xl" aria-hidden>{transitionTo.emoji}</p>
              <p className="font-display mt-3 text-4xl font-extrabold">
                Đi đến {transitionTo.nameVi} nào!
              </p>
              <p className="font-display mt-1 text-2xl font-extrabold opacity-90">
                Let's go to the {transitionTo.nameEn}! 🚀
              </p>
              <p className="mt-2 font-bold opacity-90">{transitionTo.descVi}</p>
            </div>
          </div>
        )}

        {/* Màn hình chúc mừng cuối lượt */}
        {finished && !transitionTo && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 p-4">
            <div className="mc-pop w-full max-w-sm rounded-[26px] bg-white p-6 text-center shadow-2xl">
              <p className="text-6xl" aria-hidden>🏆</p>
              <p className="font-display mt-2 text-3xl font-extrabold">Con giỏi quá!</p>
              <p className="mt-1 font-bold text-[var(--dim)]">
                {character?.nameVi} đã xong {foundCount}/{missions.length} nhiệm vụ ở{" "}
                {mapDef?.nameVi}!
              </p>
              <p className="font-display mt-2 text-base font-extrabold text-[var(--mint)]">
                📖 Sổ Khám Phá: đã tìm thấy {bookFoundHere}/{mapDef?.objects.length ?? 0} bạn
              </p>
              <p className="font-display mt-3 text-4xl" aria-label={`Nhận ${earnedStars ?? 0} sao`}>
                {earnedStars === null ? "⭐ Đang cộng sao cho con…" : "⭐".repeat(Math.max(1, earnedStars))}
              </p>
              {earnedStars !== null && (
                <p className="font-display text-lg font-extrabold text-[var(--accent)]">
                  +{earnedStars} sao vào bộ sưu tập sao của con!
                </p>
              )}
              <div className="mt-4 grid gap-2">
                <button
                  type="button"
                  onClick={goToNextMap}
                  aria-label={`Đi tiếp sang nơi mới: ${mapDef ? nextMapOf(mapDef).nameVi : ""}`}
                  className="font-display w-full rounded-full bg-[var(--accent)] py-3 text-xl font-extrabold text-white shadow active:scale-95"
                >
                  🚀 Đi tiếp: {mapDef ? nextMapOf(mapDef).emoji : ""}{" "}
                  {mapDef ? nextMapOf(mapDef).nameVi : ""} ▶
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!mapDef) return;
                    startRound(mapDef);
                    setRoundKey((k) => k + 1);
                  }}
                  aria-label="Chơi lại lượt mới ở nơi này"
                  className="font-display w-full rounded-full bg-[var(--mint)] py-2.5 text-base font-extrabold text-white shadow active:scale-95"
                >
                  🔁 Chơi lại nơi này
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep("map")}
                    aria-label="Đổi nơi khám phá khác"
                    className="font-display flex-1 rounded-full bg-white py-2.5 text-base font-extrabold shadow ring-1 ring-black/10 active:scale-95"
                  >
                    🗺️ Đổi nơi khác
                  </button>
                  <button
                    type="button"
                    onClick={onBack}
                    aria-label="Về trang chủ"
                    className="font-display flex-1 rounded-full bg-white py-2.5 text-base font-extrabold shadow ring-1 ring-black/10 active:scale-95"
                  >
                    🏠 Trang chủ
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="mt-3 text-center text-sm font-semibold text-[var(--dim)]">
        👁️ Camera đi theo sau vai như mắt bé nhìn: ↑ đi tới, ↓ đi lui, ← → rẽ
        trái/phải (xoay êm chậm rãi) · ⌨️ Dùng 4 phím mũi tên hoặc 📱 bấm giữ 4 nút
        mũi tên ở góc phải · ⭐ Tên của bé luôn hiện trên đầu nhân vật · 🔊 Mỗi
        nhiệm vụ mới cô tự đọc tiếng Việt cho bé nghe · 🧭 Mũi tên vàng chỉ đường
        tới vật cần tìm · 🖱️ Bấm vào đồ vật: vật sẽ NHẢY, RUNG, CHẠY… phản ứng
        vui, hiện thẻ từ và luyện nói theo cô · 🏁 Xong 7 nhiệm vụ là đi tiếp
        sang nơi mới đẹp hơn!
      </p>
    </main>
  );
}
