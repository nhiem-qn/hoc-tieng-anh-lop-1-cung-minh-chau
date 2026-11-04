import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SafeAreaTopScrim } from "@hatch/space-sdk/client";
import { api } from "./api";
import {
ALL_STICKERS,
EXTRA_SETS,
GIFTS,
SPECIALS,
UNITS,
extensionForLessonId,
giftForUnit,
wordsForUnits,
type ExtensionWordDef,
type ExtraSet,
type Special,
type Unit,
type Word,
} from "./content";
import { AUDIO } from "./audioMap";
import { ExploreGame } from "./Game3D";
import mascotImg from "./assets/mascot.webp";
import giftCapybara from "./assets/gift-capybara.webp";
import giftAxolotl from "./assets/gift-axolotl.webp";
import giftQuokka from "./assets/gift-quokka.webp";
import giftRedpanda from "./assets/gift-redpanda.webp";

const GIFT_IMAGES: Record<string, string> = {
  capybara: giftCapybara,
  axolotl: giftAxolotl,
  quokka: giftQuokka,
  redpanda: giftRedpanda,
};

// ---------- Chế độ giao diện: Điện thoại / Máy tính ----------
export type DisplayMode = "phone" | "desktop";

function DisplayModeToggle({
  mode,
  onChange,
  compact,
}: {
  mode: DisplayMode;
  onChange: (m: DisplayMode) => void;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 ${compact ? "" : "flex-wrap justify-center"}`}
      role="group"
      aria-label="Chọn giao diện hiển thị: điện thoại hoặc máy tính"
    >
      <span className="font-display hidden text-sm font-bold text-[var(--dim)] sm:inline">
        Giao diện:
      </span>
      <div className="flex rounded-full bg-white p-1 shadow-md ring-1 ring-black/5">
        <button
          type="button"
          onClick={() => onChange("phone")}
          aria-pressed={mode === "phone"}
          aria-label="Chuyển sang giao diện điện thoại"
          className={`font-display flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-extrabold transition-all sm:px-4 sm:text-base ${
            mode === "phone"
              ? "bg-[var(--accent)] text-white shadow"
              : "text-[var(--text)] hover:bg-[#FFF0F5]"
          }`}
        >
          <span aria-hidden>📱</span> Điện thoại
        </button>
        <button
          type="button"
          onClick={() => onChange("desktop")}
          aria-pressed={mode === "desktop"}
          aria-label="Chuyển sang giao diện máy tính"
          className={`font-display flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-extrabold transition-all sm:px-4 sm:text-base ${
            mode === "desktop"
              ? "bg-[var(--accent)] text-white shadow"
              : "text-[var(--text)] hover:bg-[#FFF0F5]"
          }`}
        >
          <span aria-hidden>💻</span> Máy tính
        </button>
      </div>
      <span className="hidden text-xs font-semibold text-[var(--dim)] md:inline">
        {mode === "phone" ? "Khung hẹp như điện thoại" : "Màn hình rộng cho máy tính"}
      </span>
    </div>
  );
}

function ViewShell({
  mode,
  onModeChange,
  children,
}: {
  mode: DisplayMode;
  onModeChange: (m: DisplayMode) => void;
  children: ReactNode;
}) {
  const isPhone = mode === "phone";
  return (
    <div
      className={
        isPhone
          ? "min-h-screen bg-[#EDE6FF] sm:bg-[#EDE6FF]"
          : "min-h-screen bg-[var(--bg)]"
      }
      data-display-mode={mode}
    >
      <SafeAreaTopScrim backgroundColor={isPhone ? "#EDE6FF" : "var(--bg)"} />
      {/* Thanh chọn giao diện — luôn ở trên cùng, dễ chạm */}
      <div
        className={
          isPhone
            ? "sticky top-0 z-50 mx-auto w-full max-w-[430px] px-3 pt-3"
            : "sticky top-0 z-50 mx-auto w-full max-w-6xl px-4 pt-3 sm:px-6"
        }
      >
        <div
          className={
            isPhone
              ? "flex items-center justify-between gap-2 rounded-full bg-white/90 px-2 py-1.5 shadow-md backdrop-blur"
              : "flex flex-wrap items-center justify-between gap-3 rounded-[20px] bg-white/90 px-4 py-2.5 shadow-md backdrop-blur"
          }
        >
          <span className="font-display pl-2 text-sm font-extrabold whitespace-nowrap sm:text-base">
            {isPhone ? "📱 Chế độ điện thoại" : "💻 Chế độ máy tính"}
          </span>
          <DisplayModeToggle mode={mode} onChange={onModeChange} compact />
        </div>
        {isPhone && (
          <p className="mt-1.5 text-center text-[11px] font-semibold text-[#6B5B8A]">
            Đang xem dạng điện thoại — khung hẹp ở giữa màn hình
          </p>
        )}
      </div>

      {/* Nội dung chính: điện thoại = khung 430px có viền như máy, máy tính = rộng */}
      <div
        className={
          isPhone
            ? "mx-auto w-full max-w-[430px] px-0 pb-0 sm:py-3"
            : "mx-auto w-full max-w-6xl"
        }
      >
        <div
          className={
            isPhone
              ? "min-h-[calc(100vh-76px)] overflow-hidden bg-[var(--bg)] shadow-2xl ring-1 ring-black/10 sm:rounded-[36px] sm:border-[6px] sm:border-[#2B2233]"
              : "min-h-[calc(100vh-64px)] bg-[var(--bg)]"
          }
        >
          {children}
        </div>
      </div>
    </div>
  );
}

const CONFETTI_COLORS = ["#FF5D8F", "#FFC53D", "#2EC4B6", "#4CC9F0", "#FF9F45", "#F15BB5"];
const CHEER_EMOJIS = ["🎉", "🌟", "⭐", "🦄", "🌈", "🍭", "🎊", "💖"];
const PRAISE_KEYS = ["vipraise1", "vipraise2", "vipraise3"];
const PRAISE_TEXTS = [
  "Đúng rồi! Minh Châu giỏi quá!",
  "Tuyệt vời! Con là ngôi sao!",
  "Chính xác! Cô khen con!",
];
const TRY_AGAIN_TEXT = "Gần đúng rồi! Minh Châu thử lại nhé!";

/** Phát một lời khen tiếng Việt ngẫu nhiên — chữ hiện trên màn hình và
 * tiếng cô khen luôn khớp nhau (cùng một chỉ số). */
function randomPraise(): { key: string; text: string } {
  const i = Math.floor(Math.random() * PRAISE_KEYS.length);
  return { key: PRAISE_KEYS[i]!, text: PRAISE_TEXTS[i]! };
}

// ---------- Câu hỏi đọc bằng tiếng Việt ----------
// Bé lớp 1 chưa đọc sõi chữ nên mỗi câu hỏi trong trò chơi có thêm tiếng cô
// đọc câu hỏi bằng TIẾNG VIỆT (ghi sẵn cùng giọng nữ trẻ với phần tiếng
// Anh). File MP3 lỗi thì bộ phát đọc dự phòng bằng giọng tiếng Việt của
// thiết bị — xem speakWithDeviceVoice với lang "vi-VN".
const VI_QUESTION_TEXTS: Record<string, string> = {
  listen: "Nghe cô đọc từ này nhé! Rồi chọn hình đúng nào!",
  picture: "Nhìn hình này! Đây là gì nhỉ? Chọn từ đúng nhé!",
  blank: "Điền từ còn thiếu vào câu nhé!",
  sentence: "Nghe cô đọc câu này nhé! Rồi chọn đúng câu cô vừa đọc nào!",
  count: "Đếm xem có mấy hình nhé! Rồi chọn số đúng nào!",
};
/** Tên gọi tiếng Việt của từng chữ cái — cô đọc đúng tên chữ cho bé nghe. */
const VI_LETTER_NAMES: Record<string, string> = {
  a: "a", b: "bê", c: "xê", d: "đê", e: "e", f: "ép", g: "gờ", h: "hát",
  i: "i", l: "lờ", m: "mờ", n: "nờ", o: "o", t: "tê", u: "u", w: "vê kép",
};

function questionViAudio(q: Question, lesson: LessonData): { key: string; text: string } {
  if (q.type === "letter") {
    const ch = (lesson.letter?.[0] ?? "a").toLowerCase();
    return {
      key: `qv-letter-${ch}`,
      text: `Từ nào bắt đầu bằng chữ ${VI_LETTER_NAMES[ch] ?? ch}?`,
    };
  }
  return { key: `qv-${q.type}`, text: VI_QUESTION_TEXTS[q.type] ?? "" };
}

// ---------- Âm thanh ----------
// Vì sao bản trước vẫn "không nghe được tiếng": app DÙNG CHUNG một thẻ
// <audio> cho mọi lần phát — trong webview, đổi src liên tục khiến lần phát
// sau bị hủy (AbortError) hoặc kẹt trạng thái; cộng với phát tự động lúc mở
// bài/chuyển thẻ (chưa có chạm) bị chính sách autoplay chặn và lỗi bị nuốt
// im lặng. Khắc phục gốc rễ ở bản này:
// 1) MỖI lần phát tạo một thẻ <audio> MỚI (preload, playsInline), không tái
//    sử dụng thẻ cũ → không còn lỗi hủy chồng lấn.
// 2) KHÔNG phát tự động khi chưa có thao tác chạm: mọi phát đều từ nút bấm;
//    lần chạm đầu tiên mở khóa bộ phát (phát thử tiếng cực nhỏ trong đúng
//    ngữ cảnh chạm) và phát lại tiếng đang chờ bị chặn.
// 3) File MP3 lỗi/không phát được → đọc bằng giọng nữ trẻ của thiết bị
//    (speechSynthesis) để bé luôn nghe được.
// 4) Mọi lần phát đều BÁO TRẠNG THÁI ra giao diện (đang phát / bị chặn /
//    lỗi): nếu chưa nghe thấy tiếng, app hiện dải hướng dẫn chạm để bật
//    tiếng thay vì im lặng như trước.
export type AudioEvent =
  | { type: "playing"; key: string }
  | { type: "blocked"; key: string }
  | { type: "error"; key: string };

const audioListeners = new Set<(e: AudioEvent) => void>();
function emitAudio(e: AudioEvent) {
  audioListeners.forEach((cb) => {
    try {
      cb(e);
    } catch {
      /* bỏ qua */
    }
  });
}
export function onAudioEvent(cb: (e: AudioEvent) => void): () => void {
  audioListeners.add(cb);
  return () => {
    audioListeners.delete(cb);
  };
}

let currentAudio: HTMLAudioElement | null = null;
let pendingSound: { key: string; fallbackText?: string; lang?: string } | null = null;
let audioCtxUnlocked = false;

function speakWithDeviceVoice(text: string, lang = "en-US"): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const synth = window.speechSynthesis;
      if (!synth) {
        resolve(false);
        return;
      }
      const prefix = lang.toLowerCase().slice(0, 2);
      const pickVoice = (): SpeechSynthesisVoice | undefined => {
        const voices = synth
          .getVoices()
          .filter((v) => v.lang.toLowerCase().startsWith(prefix));
        const nameRe =
          prefix === "vi"
            ? /female|hoai my|linh/i
            : /female|zira|samantha|aria|jenny|google us english/i;
        return voices.find((v) => nameRe.test(v.name)) ?? voices[0];
      };
      const speakNow = () => {
        try {
          synth.cancel();
          const u = new SpeechSynthesisUtterance(text);
          u.lang = lang;
          u.rate = 0.92;
          const v = pickVoice();
          if (v) u.voice = v;
          let done = false;
          const finish = (ok: boolean) => {
            if (!done) {
              done = true;
              resolve(ok);
            }
          };
          u.onstart = () => finish(true);
          u.onerror = () => finish(false);
          synth.speak(u);
          window.setTimeout(() => finish(true), 600);
        } catch {
          resolve(false);
        }
      };
      // Một số máy trả danh sách giọng rỗng ở lần đầu → chờ voiceschanged.
      if (synth.getVoices().length === 0) {
        let waited = false;
        const onVoices = () => {
          if (waited) return;
          waited = true;
          synth.removeEventListener?.("voiceschanged", onVoices);
          speakNow();
        };
        synth.addEventListener?.("voiceschanged", onVoices);
        window.setTimeout(onVoices, 350);
      } else {
        speakNow();
      }
    } catch {
      resolve(false);
    }
  });
}

/** Phát 1 file MP3 bằng thẻ audio mới; trả về true nếu tiếng đã lên.
 * `lang` chỉ dùng cho giọng thiết bị dự phòng khi file lỗi: "vi-VN" cho
 * câu hỏi/lời khen tiếng Việt, mặc định "en-US" cho nội dung tiếng Anh. */
async function playAudio(
  key: string,
  fallbackText?: string,
  lang = "en-US",
): Promise<boolean> {
  const url = AUDIO[key];
  if (!url) {
    if (fallbackText) {
      const ok = await speakWithDeviceVoice(fallbackText, lang);
      emitAudio(ok ? { type: "playing", key } : { type: "error", key });
      return ok;
    }
    emitAudio({ type: "error", key });
    return false;
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
    await a.play();
    emitAudio({ type: "playing", key });
    return true;
  } catch (err) {
    const name = (err as { name?: string })?.name ?? "";
    if (name === "NotAllowedError") {
      // Chưa có thao tác chạm hợp lệ → giữ lại phát ở lần chạm kế tiếp.
      pendingSound = { key, fallbackText, lang };
      emitAudio({ type: "blocked", key });
      return false;
    }
    // Lỗi tải/giải mã file → đọc bằng giọng của thiết bị.
    if (fallbackText) {
      const ok = await speakWithDeviceVoice(fallbackText, lang);
      emitAudio(ok ? { type: "playing", key } : { type: "error", key });
      return ok;
    }
    emitAudio({ type: "error", key });
    return false;
  }
}

/** Mở khóa âm thanh trong đúng ngữ cảnh lần chạm đầu tiên của người dùng. */
function unlockAudio() {
  try {
    // Kích hoạt speechSynthesis trong ngữ cảnh chạm (Chrome yêu cầu).
    const synth = window.speechSynthesis;
    if (synth && !audioCtxUnlocked) {
      const u = new SpeechSynthesisUtterance(" ");
      u.volume = 0;
      synth.speak(u);
    }
  } catch {
    /* bỏ qua */
  }
  if (!audioCtxUnlocked) {
    audioCtxUnlocked = true;
    try {
      const a = new Audio();
      a.muted = true;
      void a
        .play()
        .then(() => {
          a.pause();
          a.muted = false;
        })
        .catch(() => undefined);
    } catch {
      /* bỏ qua */
    }
  }
  if (pendingSound) {
    const p = pendingSound;
    pendingSound = null;
    window.setTimeout(() => {
      void playAudio(p.key, p.fallbackText, p.lang);
    }, 50);
  }
}
if (typeof window !== "undefined") {
  window.addEventListener("pointerdown", unlockAudio, { passive: true });
  window.addEventListener("touchstart", unlockAudio, { passive: true });
}

/** Dải cảnh báo khi tiếng bị chặn/lỗi — bé chạm vào là nghe lại được. */
function useAudioHint(): { hint: boolean; dismiss: () => void } {
  const [hint, setHint] = useState(false);
  useEffect(
    () =>
      onAudioEvent((e) => {
        if (e.type === "playing") setHint(false);
        else setHint(true);
      }),
    [],
  );
  return { hint, dismiss: () => setHint(false) };
}

function AudioHintBar({ show, onTap }: { show: boolean; onTap: () => void }) {
  if (!show) return null;
  return (
    <button
      type="button"
      onClick={onTap}
      aria-label="Bật tiếng: chạm để nghe lại tiếng cô đọc"
      className="mc-pop mt-4 flex w-full items-center gap-3 rounded-[20px] bg-[#FFF0D6] px-4 py-3 text-left shadow-md active:scale-[0.99]"
      style={{ borderBottom: "5px solid var(--sun)" }}
    >
      <span className="text-3xl" aria-hidden>🔇</span>
      <span className="font-display text-base leading-tight font-bold">
        Chưa nghe thấy tiếng cô? Chạm vào đây một lần để bật tiếng, rồi bấm nút
        loa nghe lại nhé!
      </span>
    </button>
  );
}

// ---------- Nhận diện giọng nói để chấm điểm đọc (Web Speech API) ----------
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

// ---------- Ghi nhớ quyền micro: hỏi 1 lần, các lần sau không hỏi lại ----------
// Vì sao trước đây app cứ hỏi lại: mỗi lần ghi âm app mở một luồng micro
// MỚI rồi tắt ngay sau từng câu, và không hề kiểm tra quyền đã cấp — nhiều
// trình duyệt/webview vì thế hiện lại hộp xin phép. Cách sửa ở bản này:
// 1) Trước khi bật micro, app ĐỌC trạng thái quyền bằng Permissions API
//    (navigator.permissions) — thao tác này KHÔNG hiện hộp hỏi. Nếu đã
//    "granted" (lần trước ba/mẹ đã chọn Cho phép) thì app vào thẳng phần
//    đọc, không gọi xin phép thừa nữa.
// 2) Lựa chọn được LƯU VÀO MÁY (localStorage, giống cách app ghi nhớ giao
//    diện điện thoại/máy tính): lần đầu cấp quyền → lưu "granted"; các lần
//    mở app sau app biết ngay micro đã sẵn sàng.
// 3) Chỉ khi chưa từng cấp quyền, app mới xin đúng 1 lần bằng getUserMedia
//    trong đúng ngữ cảnh chạm; và trong một buổi luyện, app GIỮ MỘT luồng
//    micro chung cho mọi câu (không tắt sau mỗi câu) để không bị hỏi lại
//    giữa chừng. Luồng chỉ tắt khi rời khỏi bài học.
const MIC_PERM_KEY = "mc-mic-permission";

type MicPermState = "granted" | "denied" | "prompt" | "unknown";

function loadStoredMicPerm(): "granted" | "denied" | null {
  try {
    const v = localStorage.getItem(MIC_PERM_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

function storeMicPerm(v: "granted" | "denied") {
  try {
    localStorage.setItem(MIC_PERM_KEY, v);
  } catch {
    /* bỏ qua */
  }
}

/** Đọc trạng thái quyền micro hiện tại từ trình duyệt — không hề xin phép. */
async function queryMicPerm(): Promise<MicPermState> {
  try {
    if (typeof navigator !== "undefined" && navigator.permissions?.query) {
      const st = await navigator.permissions.query({
        name: "microphone" as PermissionName,
      });
      if (st.state === "granted" || st.state === "denied" || st.state === "prompt") {
        return st.state;
      }
    }
  } catch {
    /* một số trình duyệt không hỗ trợ tra quyền "microphone" */
  }
  return loadStoredMicPerm() ?? "unknown";
}

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
/** Chấm điểm câu bé đọc so với câu mẫu: 0–100. */
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
    // Từ gần đúng (chênh 1 ký tự) tính nửa điểm từ.
    if (hWords.some((hw) => levenshtein(hw, tw) <= 1)) matched += 0.5;
  }
  let score = (matched / tWords.length) * 100;
  const dist = levenshtein(tWords.join(" "), hJoined);
  const sim = 1 - dist / Math.max(tWords.join(" ").length, hJoined.length, 1);
  score = Math.max(score, sim * 100);
  return Math.max(0, Math.min(100, Math.round(score)));
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i]!;
    a[i] = a[j]!;
    a[j] = t;
  }
  return a;
}

// ---------- Pháo giấy ----------
function Confetti({ burstKey, big }: { burstKey: number; big?: boolean }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: big ? 60 : 26 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * (big ? 0.9 : 0.35),
        duration: 2.2 + Math.random() * 1.8,
        size: 7 + Math.random() * 8,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length]!,
        round: Math.random() > 0.5,
      })),
    [burstKey, big],
  );
  if (burstKey === 0) return null;
  return (
    <div key={burstKey} className="pointer-events-none fixed inset-0 z-[70] overflow-hidden" aria-hidden>
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            position: "absolute",
            top: "-4vh",
            left: `${p.left}%`,
            width: p.size,
            height: p.size * (p.round ? 1 : 0.45),
            background: p.color,
            borderRadius: p.round ? "50%" : 2,
            animation: `mc-confetti-fall ${p.duration}s ease-in ${p.delay}s both`,
          }}
        />
      ))}
    </div>
  );
}

// ---------- Mô hình bài học gộp (Unit SGK / mục mở rộng) ----------
interface LessonData {
  id: string;
  kind: "unit" | "extra" | "special";
  titleEn: string;
  titleVi: string;
  color: string;
  scene: string;
  words: Word[];
  letter: string | null;
  sound: string | null;
  phonicsAudio: string | null;
  pattern: string | null;
  patternVi: string | null;
  patternAudio: string | null;
  pattern2: string | null;
  patternVi2: string | null;
  patternAudio2: string | null;
  stickerId: string;
  stickerEmoji: string;
  stickerName: string;
  unitNum: number | null;
}

function unitLesson(u: Unit): LessonData {
  return {
    id: u.id, kind: "unit", titleEn: u.titleEn, titleVi: u.titleVi, color: u.color,
    scene: u.scene, words: u.words, letter: u.letter, sound: u.sound,
    phonicsAudio: u.phonicsAudio, pattern: u.pattern, patternVi: u.patternVi,
    patternAudio: u.patternAudio,
    pattern2: u.pattern2 ?? null, patternVi2: u.patternVi2 ?? null,
    patternAudio2: u.patternAudio2 ?? null,
    stickerId: `stk-${u.id}`, stickerEmoji: u.stickerEmoji,
    stickerName: u.stickerName, unitNum: u.num,
  };
}

function extraLesson(s: ExtraSet): LessonData {
  return {
    id: s.id, kind: "extra", titleEn: s.titleEn, titleVi: s.titleVi, color: s.color,
    scene: s.emoji, words: s.words, letter: null, sound: null, phonicsAudio: null,
    pattern: null, patternVi: null, patternAudio: null,
    pattern2: null, patternVi2: null, patternAudio2: null,
    stickerId: `stk-${s.id}`, stickerEmoji: s.stickerEmoji, stickerName: s.stickerName,
    unitNum: null,
  };
}

function specialLesson(s: Special): LessonData {
  return {
    id: s.id, kind: "special", titleEn: s.titleEn, titleVi: s.titleVi, color: s.color,
    scene: s.emoji, words: wordsForUnits(s.unitNums), letter: null, sound: null,
    phonicsAudio: null, pattern: null, patternVi: null, patternAudio: null,
    pattern2: null, patternVi2: null, patternAudio2: null,
    stickerId: `stk-${s.id}`, stickerEmoji: s.stickerEmoji, stickerName: s.stickerName,
    unitNum: null,
  };
}

// ---------- Câu hỏi trò chơi ----------
// 6 dạng bài tập xoay quanh đúng từ vựng + mẫu câu của bài:
// - listen: nghe từ, chọn hình · picture: nhìn hình, chọn từ
// - letter: từ nào bắt đầu bằng chữ cái trọng tâm của Unit
// - blank: điền từ còn thiếu vào mẫu câu trong sách (vd "I like ____.")
// - sentence: nghe cô đọc mẫu câu, chọn đúng câu (câu nhiễu lấy từ Unit
//   khác → ôn chéo, nhớ lâu hơn)
// - count: đếm số hình rồi chọn số (Unit có từ chỉ số — đúng mẫu câu
//   "How many…?" trong sách)
type QuestionType = "listen" | "picture" | "letter" | "blank" | "sentence" | "count";

interface Question {
  word: Word;
  type: QuestionType;
  options: Word[];
  /** blank: phần câu trước/sau chỗ trống. */
  blankBefore?: string;
  blankAfter?: string;
  /** sentence: 3 câu để chọn (1 câu của bài + 2 câu của Unit khác). */
  sentences?: string[];
  /** count: vật được đếm (null = ngôi sao) và số lượng. */
  countItem?: Word | null;
  countValue?: number;
}

const NUMBER_VALUES: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
};

function buildQuestions(lesson: LessonData): Question[] {
  const picked = shuffle(lesson.words).slice(0, 6);
  // Câu hỏi chữ cái: chỉ dùng từ thật sự bắt đầu bằng chữ cái của bài, và các
  // đáp án nhiễu không được bắt đầu bằng chữ đó (tránh câu hỏi sai sư phạm).
  const firstLetter = lesson.letter?.[0]?.toLowerCase() ?? null;
  const base: Question[] = picked.map((word, idx) => {
    let type: QuestionType = idx % 2 === 0 ? "listen" : "picture";
    let target = word;
    if (lesson.kind === "unit" && idx === 3 && firstLetter) {
      const letterWords = lesson.words.filter((x) =>
        x.en.toLowerCase().startsWith(firstLetter),
      );
      // Chỉ hỏi chữ cái khi còn ít nhất 2 từ KHÔNG bắt đầu bằng chữ đó làm
      // đáp án nhiễu — Unit mà mọi từ đều bắt đầu bằng chữ trọng tâm (vd
      // Unit 1: ball, bike, book, Bill) thì câu hỏi chữ cái chỉ còn 1 đáp
      // án, quá dễ và vô nghĩa, nên giữ dạng nghe/nhìn hình như thường.
      const nonLetter = lesson.words.filter(
        (x) => !x.en.toLowerCase().startsWith(firstLetter),
      );
      if (letterWords.length > 0 && nonLetter.length >= 2) {
        type = "letter";
        target = letterWords[Math.floor(Math.random() * letterWords.length)]!;
      }
    }
    const pool =
      type === "letter" && firstLetter
        ? lesson.words.filter(
            (x) => x.key !== target.key && !x.en.toLowerCase().startsWith(firstLetter),
          )
        : lesson.words.filter((x) => x.key !== target.key);
    const distractors = shuffle(pool).slice(0, 2);
    const options = shuffle([target, ...distractors]);
    return { word: target, type, options };
  });

  const extras: Question[] = [];

  // Điền từ còn thiếu: tìm một từ vựng của bài xuất hiện nguyên vẹn (hoặc
  // dạng số nhiều thêm "s") trong mẫu câu của sách rồi giấu đi.
  if (lesson.pattern) {
    const lower = lesson.pattern.toLowerCase();
    for (const wd of lesson.words) {
      const en = wd.en.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      let hitLen = 0;
      let hitIdx = -1;
      for (const suffix of ["", "s"]) {
        const m = new RegExp(`\\b${en}${suffix}\\b`).exec(lower);
        if (m) {
          hitIdx = m.index;
          hitLen = m[0].length;
          break;
        }
      }
      if (hitIdx >= 0) {
        const distractors = shuffle(
          lesson.words.filter((x) => x.key !== wd.key),
        ).slice(0, 2);
        extras.push({
          word: wd,
          type: "blank",
          options: shuffle([wd, ...distractors]),
          blankBefore: lesson.pattern.slice(0, hitIdx),
          blankAfter: lesson.pattern.slice(hitIdx + hitLen),
        });
        break;
      }
    }
  }

  // Nghe mẫu câu, chọn câu đúng: câu nhiễu là mẫu câu của 2 Unit khác.
  if (lesson.pattern && lesson.patternAudio) {
    const others = shuffle(
      UNITS.filter((u) => u.id !== lesson.id && u.pattern).map((u) => u.pattern),
    ).slice(0, 2);
    if (others.length === 2) {
      extras.push({
        word: lesson.words[0]!,
        type: "sentence",
        options: [],
        sentences: shuffle([lesson.pattern, ...others]),
      });
    }
  }

  // Đếm số lượng: bài có từ chỉ số thì đếm hình của một từ khác trong bài.
  const numberWords = lesson.words.filter(
    (wd) => NUMBER_VALUES[wd.en.toLowerCase()] != null,
  );
  if (numberWords.length >= 3) {
    const correct = numberWords[Math.floor(Math.random() * numberWords.length)]!;
    const distractors = shuffle(
      numberWords.filter((x) => x.key !== correct.key),
    ).slice(0, 2);
    extras.push({
      word: correct,
      type: "count",
      options: shuffle([correct, ...distractors]),
      countItem:
        lesson.words.find((wd) => NUMBER_VALUES[wd.en.toLowerCase()] == null) ??
        null,
      countValue: NUMBER_VALUES[correct.en.toLowerCase()] ?? 1,
    });
  }

  return shuffle([...base, ...extras]);
}

// ================= NGHE & ĐỌC LẠI — GHI ÂM, CHẤM ĐIỂM =================
interface PracticeItem {
  text: string;
  vi: string;
  ipa: string | null;
  audioKey: string;
  emoji: string;
}
interface PracticeResult {
  score: number;
  heard: string | null;
  status: "scored" | "unsupported" | "recorded";
}

function scoreFeedback(score: number): string {
  if (score >= 90) return "Xuất sắc! Con đọc gần như giống hệt cô! 🌟";
  if (score >= 70) return "Đọc rất tốt! Chỉ còn một chút nữa thôi! 💪";
  if (score >= 45) return "Con đã cố gắng rồi! Nghe cô đọc lại rồi thử lần nữa nhé!";
  return "Không sao đâu! Nghe cô đọc chậm rồi đọc theo cô nhé!";
}

function SpeechPractice({
  lesson,
  onFinish,
  onGreat,
}: {
  lesson: LessonData;
  onFinish: (score: number | null) => void;
  onGreat: () => void;
}) {
  const items = useMemo<PracticeItem[]>(() => {
    const list: PracticeItem[] = lesson.words.map((wd) => ({
      text: wd.en,
      vi: wd.vi,
      ipa: wd.ipa,
      audioKey: wd.key,
      emoji: wd.emoji,
    }));
    if (lesson.pattern && lesson.patternAudio) {
      list.push({
        text: lesson.pattern,
        vi: lesson.patternVi ?? "",
        ipa: null,
        audioKey: lesson.patternAudio,
        emoji: "💬",
      });
    }
    if (lesson.pattern2 && lesson.patternAudio2) {
      list.push({
        text: lesson.pattern2,
        vi: lesson.patternVi2 ?? "",
        ipa: null,
        audioKey: lesson.patternAudio2,
        emoji: "💬",
      });
    }
    return list;
  }, [lesson]);

  const [idx, setIdx] = useState(0);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [results, setResults] = useState<Record<number, PracticeResult>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const finishedRef = useRef(false);
  // Nhận diện hay tự ngắt giữa chừng (nhất là trên điện thoại): cờ "vẫn muốn
  // nghe" + số lần nối lại để app tự bật lại micro thay vì im lặng dừng.
  const wantListenRef = useRef(false);
  const restartRef = useRef(0);
  const gotResultRef = useRef(false);
  // Chế độ ghi âm nghe lại (khi thiết bị không có nhận diện giọng nói).
  const recognitionSupported = useMemo(() => getRecognitionCtor() != null, []);
  const [recording, setRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  // Trạng thái quyền micro: đọc từ trình duyệt + cờ đã lưu trong máy.
  const [micPerm, setMicPerm] = useState<MicPermState>("unknown");

  // Khi mở phần đọc: kiểm tra (không xin phép) xem micro đã được cấp quyền
  // từ lần trước chưa, và theo dõi nếu ba/mẹ đổi quyền trong cài đặt.
  useEffect(() => {
    let alive = true;
    let status: PermissionStatus | null = null;
    void (async () => {
      const s = await queryMicPerm();
      if (alive) setMicPerm(s);
      try {
        if (navigator.permissions?.query) {
          status = await navigator.permissions.query({
            name: "microphone" as PermissionName,
          });
          status.onchange = () => {
            if (!status || !alive) return;
            const st = status.state;
            if (st === "granted" || st === "denied" || st === "prompt") {
              setMicPerm(st);
              if (st === "granted") storeMicPerm("granted");
              if (st === "denied") storeMicPerm("denied");
            }
          };
        }
      } catch {
        /* bỏ qua */
      }
    })();
    return () => {
      alive = false;
      if (status) status.onchange = null;
    };
  }, []);

  function hasLiveStream(): boolean {
    return (
      !!streamRef.current &&
      streamRef.current.getAudioTracks().some((t) => t.readyState === "live")
    );
  }

  /**
   * Đảm bảo micro dùng được mà KHÔNG hỏi lại khi đã cấp quyền:
   * - Đã "granted" từ lần trước → trả true ngay (mở luồng micro lúc này
   *   không hiện hộp hỏi vì quyền đã có).
   * - Chưa từng cấp → xin đúng 1 lần; kết quả lưu vào máy cho các lần sau.
   * - Đang bị "denied" → trình duyệt sẽ không hiện hộp hỏi nữa, nên app
   *   hướng dẫn ba/mẹ bật lại trong cài đặt trang web.
   * keepStream: giữ luồng micro lại để các câu sau dùng chung, không xin lại.
   */
  async function ensureMicAccess(keepStream: boolean): Promise<boolean> {
    if (!navigator.mediaDevices?.getUserMedia) return false;
    const state = await queryMicPerm();
    if (state === "granted") {
      storeMicPerm("granted");
      setMicPerm("granted");
      if (keepStream && !hasLiveStream()) {
        try {
          streamRef.current = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
        } catch {
          return false;
        }
      }
      return true;
    }
    if (state === "denied") {
      setMicPerm("denied");
      setErrorMsg(
        "Micro đang bị trình duyệt chặn nên app không hỏi lại được. Ba/mẹ mở cài đặt trang web (biểu tượng 🔒 ở thanh địa chỉ) → cho phép Micro, rồi bấm Đọc lại nhé!",
      );
      return false;
    }
    // "prompt" / "unknown": xin phép đúng 1 lần, lưu lại cho các lần sau.
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      storeMicPerm("granted");
      setMicPerm("granted");
      if (keepStream) {
        streamRef.current = stream;
      } else {
        stream.getTracks().forEach((t) => t.stop());
      }
      return true;
    } catch {
      storeMicPerm("denied");
      setMicPerm("denied");
      setErrorMsg(
        "Ứng dụng chưa được phép dùng micro. Ba/mẹ hãy cho phép micro rồi bấm Đọc lại nhé!",
      );
      return false;
    }
  }

  const item = items[idx] ?? items[0]!;
  const result = results[idx];
  const scoredList = Object.values(results).filter((r) => r.status === "scored");
  const avgScore =
    scoredList.length > 0
      ? Math.round(scoredList.reduce((s, r) => s + r.score, 0) / scoredList.length)
      : null;
  const isLast = idx >= items.length - 1;

  // KHÔNG tự phát tiếng mẫu khi sang câu mới: phát tự động lúc chưa có chạm
  // bị trình duyệt chặn. Bé bấm nút "Nghe cô đọc mẫu" (đúng ngữ cảnh chạm)
  // thì tiếng luôn lên. Chuyển câu thì dừng micro/ghi âm đang chạy.
  useEffect(() => {
    wantListenRef.current = false;
    try {
      recRef.current?.abort();
    } catch {
      /* bỏ qua */
    }
    setListening(false);
    setInterim("");
    setErrorMsg(null);
    setRecordedUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
  }, [idx]);

  useEffect(
    () => () => {
      wantListenRef.current = false;
      try {
        recRef.current?.abort();
      } catch {
        /* bỏ qua */
      }
      try {
        mediaRecRef.current?.stop();
      } catch {
        /* bỏ qua */
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
    },
    [],
  );

  function finish() {
    if (finishedRef.current) return;
    finishedRef.current = true;
    wantListenRef.current = false;
    try {
      recRef.current?.abort();
    } catch {
      /* bỏ qua */
    }
    onFinish(avgScore);
  }

  function startListening() {
    setErrorMsg(null);
    setInterim("");
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      // Không có nhận diện giọng nói → chuyển sang chế độ ghi âm nghe lại.
      void startRecording();
      return;
    }
    void (async () => {
      // Đã cấp quyền ở lần trước (app đã lưu) → vào thẳng phần nghe,
      // không xin phép lại. Chưa có quyền thì ensureMicAccess xin 1 lần.
      const ok = await ensureMicAccess(false);
      if (!ok) return;
      wantListenRef.current = true;
      restartRef.current = 0;
      gotResultRef.current = false;
      launchRecognition(Ctor);
    })();
  }

  function launchRecognition(Ctor: new () => SpeechRecognitionLike) {
    try {
      recRef.current?.abort();
    } catch {
      /* bỏ qua */
    }
    const rec = new Ctor();
    recRef.current = rec;
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.maxAlternatives = 3;
    rec.continuous = false;
    rec.onresult = (e) => {
      let interimText = "";
      let best: { score: number; heard: string } | null = null;
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (!res) continue;
        if (res.isFinal) {
          for (let j = 0; j < res.length; j++) {
            const alt = res[j];
            if (!alt) continue;
            const s = scoreSpeech(item.text, alt.transcript);
            if (!best || s > best.score) best = { score: s, heard: alt.transcript };
          }
        } else if (res[0]) {
          interimText += res[0].transcript;
        }
      }
      if (interimText) setInterim(interimText);
      if (best) {
        const b: { score: number; heard: string } = best;
        gotResultRef.current = true;
        // Nhận diện nghe được tiếng = micro đã có quyền → ghi nhớ luôn.
        storeMicPerm("granted");
        setMicPerm("granted");
        wantListenRef.current = false;
        setResults((r) => ({
          ...r,
          [idx]: { score: b.score, heard: b.heard, status: "scored" },
        }));
        setListening(false);
        if (b.score >= 80) onGreat();
      }
    };
    rec.onerror = (e) => {
      if (e.error === "aborted") return; // app chủ động dừng — không báo lỗi
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        wantListenRef.current = false;
        setListening(false);
        storeMicPerm("denied");
        setMicPerm("denied");
        setErrorMsg(
          "Ứng dụng chưa được phép dùng micro. Ba/mẹ hãy cho phép micro (app sẽ ghi nhớ, lần sau không hỏi lại) rồi bấm Đọc lại nhé!",
        );
      } else if (e.error === "audio-capture") {
        wantListenRef.current = false;
        setListening(false);
        setErrorMsg("Chưa tìm thấy micro. Ba/mẹ kiểm tra lại micro giúp con nhé!");
      } else if (e.error === "network") {
        wantListenRef.current = false;
        setListening(false);
        setErrorMsg(
          "Cô cần có mạng internet để nghe con đọc. Ba/mẹ kiểm tra kết nối mạng rồi bấm Đọc lại nhé!",
        );
      } else if (e.error === "no-speech") {
        // Chưa nghe thấy tiếng: onend sẽ tự nối lại micro vài lần.
        setErrorMsg("Cô chưa nghe thấy tiếng con. Con đọc to hơn một chút nhé!");
      }
      // Các lỗi khác: để onend xử lý nối lại.
    };
    rec.onend = () => {
      if (wantListenRef.current && !gotResultRef.current) {
        // Nhận diện tự ngắt giữa chừng → tự bật lại, tối đa 3 lần.
        if (restartRef.current < 3) {
          restartRef.current += 1;
          window.setTimeout(() => {
            if (wantListenRef.current && !gotResultRef.current) {
              launchRecognition(Ctor);
            }
          }, 350);
          return;
        }
        wantListenRef.current = false;
        setListening(false);
        setErrorMsg(
          "Cô chưa nghe rõ tiếng con. Con ngồi gần micro, đọc to và chậm rồi thử lại nhé!",
        );
        return;
      }
      setListening(false);
    };
    try {
      rec.start();
      setListening(true);
    } catch {
      // start() ném lỗi khi phiên cũ chưa đóng hẳn → thử lại sau một nhịp.
      if (wantListenRef.current && restartRef.current < 3) {
        restartRef.current += 1;
        window.setTimeout(() => {
          if (wantListenRef.current) launchRecognition(Ctor);
        }, 400);
      } else {
        wantListenRef.current = false;
        setListening(false);
        setErrorMsg("Chưa bật được micro. Con thử lại nhé!");
      }
    }
  }

  function stopListening() {
    wantListenRef.current = false;
    try {
      recRef.current?.stop();
    } catch {
      /* bỏ qua */
    }
    setListening(false);
  }

  // ----- Ghi âm nghe lại (thiết bị không có nhận diện giọng nói) -----
  async function startRecording() {
    setErrorMsg(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
        setResults((r) => ({
          ...r,
          [idx]: { score: 0, heard: null, status: "unsupported" },
        }));
        return;
      }
      // Dùng lại luồng micro chung của buổi học nếu còn sống; chỉ xin phép
      // khi chưa có luồng (lần đầu) — quyền đã cấp thì không hỏi lại.
      if (!hasLiveStream()) {
        const ok = await ensureMicAccess(true);
        if (!ok) {
          setRecording(false);
          return;
        }
      }
      const stream = streamRef.current;
      if (!stream) {
        setRecording(false);
        return;
      }
      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mediaRecRef.current = mr;
      mr.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      mr.onstop = () => {
        // KHÔNG tắt luồng micro ở đây: giữ lại cho các câu sau trong buổi
        // học để không phải xin phép lại. Luồng chỉ tắt khi rời bài học
        // (dọn dẹp ở useEffect unmount).
        setRecording(false);
        const blob = new Blob(chunksRef.current, {
          type: mr.mimeType || "audio/webm",
        });
        if (blob.size > 0) {
          setRecordedUrl((old) => {
            if (old) URL.revokeObjectURL(old);
            return URL.createObjectURL(blob);
          });
          setResults((r) => ({
            ...r,
            [idx]: { score: 0, heard: null, status: "recorded" },
          }));
        }
      };
      mr.start();
      setRecording(true);
    } catch {
      setRecording(false);
      setErrorMsg(
        "Ứng dụng chưa được phép dùng micro. Ba/mẹ hãy cho phép micro rồi bấm Đọc lại nhé!",
      );
    }
  }

  function stopRecording() {
    try {
      mediaRecRef.current?.stop();
    } catch {
      setRecording(false);
    }
  }

  function playRecorded() {
    if (!recordedUrl) return;
    try {
      const a = new Audio(recordedUrl);
      void a.play().catch(() => undefined);
    } catch {
      /* bỏ qua */
    }
  }

  return (
    <div className="mt-5">
      <div className="flex items-center gap-2" aria-hidden>
        {items.map((_, i) => (
          <span
            key={i}
            className="h-3 flex-1 rounded-full"
            style={{
              background: results[i]
                ? "#2EC4B6"
                : i === idx
                  ? lesson.color
                  : "#F0D9CE",
            }}
          />
        ))}
      </div>
      <p className="mt-2 text-center text-sm font-bold text-[var(--dim)]">
        🎤 Nghe cô đọc, rồi đọc lại theo cô nhé! Câu {idx + 1}/{items.length}
        {avgScore != null ? ` · Điểm đọc hiện tại: ${avgScore}/100` : ""}
      </p>

      {/* Trạng thái ghi nhớ quyền micro */}
      {micPerm === "granted" ? (
        <p
          className="mc-pop mt-3 rounded-2xl bg-[#D8F5F0] px-4 py-2.5 text-center text-sm font-bold"
          aria-live="polite"
        >
          ✅ Micro đã được cấp quyền và ghi nhớ trên máy này — con cứ bấm là
          đọc, app không hỏi lại nữa.
        </p>
      ) : micPerm === "denied" ? (
        <p className="mc-pop mt-3 rounded-2xl bg-[#FFE3EE] px-4 py-2.5 text-center text-sm font-bold">
          🔒 Micro đang bị chặn nên app không hỏi lại được. Ba/mẹ mở cài đặt
          trang web (biểu tượng 🔒 ở thanh địa chỉ) → cho phép Micro một lần,
          app sẽ ghi nhớ cho các lần sau.
        </p>
      ) : (
        <p className="mt-3 rounded-2xl bg-[#FFF0D6] px-4 py-2.5 text-center text-sm font-bold">
          🎤 Lần đầu bấm đọc, trình duyệt sẽ hỏi xin phép micro đúng 1 lần —
          ba/mẹ chọn <b>“Cho phép”</b>, app sẽ ghi nhớ trên máy này và không
          hỏi lại nữa. (Riêng khi mở app bằng chế độ ẩn danh, trình duyệt sẽ
          hỏi lại mỗi lần.)
        </p>
      )}

      <div key={idx} className="mc-pop mt-4 rounded-[28px] bg-white p-6 text-center shadow-lg"
        style={{ borderBottom: `8px solid ${lesson.color}` }}
      >
        <div className="text-[76px] leading-none" aria-hidden>{item.emoji}</div>
        <p className="font-display mt-2 text-4xl font-extrabold">{item.text}</p>
        <p className="mt-1 text-base text-[var(--dim)]">
          {item.ipa ? `${item.ipa} · ` : ""}{item.vi}
        </p>
        <button
          type="button"
          onClick={() => playAudio(item.audioKey, item.text)}
          aria-label={`Nghe cô đọc mẫu: ${item.text}`}
          className="font-display mt-4 inline-flex items-center gap-2 rounded-full px-7 py-3 text-xl font-bold text-white shadow-md active:scale-95"
          style={{ background: lesson.color }}
        >
          🔊 Nghe cô đọc mẫu
        </button>

        <div className="mt-5">
          {recognitionSupported ? (
            <>
              {!listening ? (
                <button
                  type="button"
                  onClick={startListening}
                  aria-label={`Bắt đầu ghi âm đọc từ ${item.text}`}
                  className="font-display inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-8 py-4 text-2xl font-extrabold text-white shadow-lg active:scale-95"
                >
                  🎤 Bấm để đọc lại
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopListening}
                  aria-label="Dừng ghi âm"
                  className="mc-wiggle font-display inline-flex items-center gap-2 rounded-full bg-[#E63946] px-8 py-4 text-2xl font-extrabold text-white shadow-lg active:scale-95"
                >
                  ⏺ Đang nghe con đọc… chạm để dừng
                </button>
              )}
              {listening && (
                <p className="mt-3 text-base font-semibold text-[var(--dim)]" aria-live="polite">
                  {interim ? `Cô đang nghe: “${interim}”` : "Con đọc to và rõ nhé… 🎙️"}
                </p>
              )}
            </>
          ) : (
            <>
              <p className="mb-3 text-base font-semibold text-[var(--dim)]">
                Thiết bị này cô chưa chấm điểm tự động được — con ghi âm rồi nghe
                lại giọng mình nhé! 🎧
              </p>
              {!recording ? (
                <button
                  type="button"
                  onClick={() => void startRecording()}
                  aria-label={`Ghi âm giọng con đọc từ ${item.text}`}
                  className="font-display inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-8 py-4 text-2xl font-extrabold text-white shadow-lg active:scale-95"
                >
                  🎤 Bấm để ghi âm
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  aria-label="Dừng ghi âm"
                  className="mc-wiggle font-display inline-flex items-center gap-2 rounded-full bg-[#E63946] px-8 py-4 text-2xl font-extrabold text-white shadow-lg active:scale-95"
                >
                  ⏺ Đang ghi âm… chạm để dừng
                </button>
              )}
              {recordedUrl && !recording && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={playRecorded}
                    aria-label="Nghe lại giọng con vừa ghi âm"
                    className="font-display inline-flex items-center gap-2 rounded-full bg-[var(--sun)] px-6 py-3 text-xl font-extrabold shadow-md active:scale-95"
                  >
                    🎧 Nghe lại giọng con
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {errorMsg && !listening && (
          <p className="mc-pop mt-4 rounded-2xl bg-[var(--space-surface-alt)] px-4 py-3 font-bold text-[var(--accent)]">
            {errorMsg}
          </p>
        )}

        {result?.status === "scored" && (
          <div className="mc-pop mt-5 rounded-[24px] bg-[var(--space-surface-alt)] p-4">
            <p className="text-4xl" aria-hidden>
              {result.score >= 90 ? "⭐⭐⭐" : result.score >= 60 ? "⭐⭐" : "⭐"}
            </p>
            <p className="font-display mt-1 text-3xl font-extrabold">
              Điểm đọc: {result.score}/100
            </p>
            {result.heard && (
              <p className="mt-1 text-sm font-semibold text-[var(--dim)]">
                Cô nghe con đọc: “{result.heard}”
              </p>
            )}
            <p className="mt-1 font-bold">{scoreFeedback(result.score)}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={startListening}
                aria-label="Đọc lại câu này"
                className="font-display rounded-full bg-white px-5 py-2.5 text-lg font-bold shadow-md active:scale-95"
              >
                🔁 Đọc lại
              </button>
              <button
                type="button"
                onClick={() => (isLast ? finish() : setIdx(idx + 1))}
                aria-label={isLast ? "Hoàn thành phần đọc" : "Sang câu đọc tiếp theo"}
                className="font-display rounded-full bg-[var(--mint)] px-5 py-2.5 text-lg font-extrabold text-white shadow-md active:scale-95"
              >
                {isLast ? "🏁 Hoàn thành phần đọc" : "➡️ Câu tiếp theo"}
              </button>
            </div>
          </div>
        )}

        {result?.status === "recorded" && (
          <div className="mc-pop mt-5 rounded-[24px] bg-[var(--space-surface-alt)] p-4">
            <p className="text-4xl" aria-hidden>🎧⭐</p>
            <p className="font-display mt-1 text-2xl font-extrabold">
              Con vừa đọc xong rồi!
            </p>
            <p className="mt-1 font-bold">
              Bấm "Nghe lại giọng con" để tự nghe, rồi nhờ ba/mẹ tặng sao cho con
              nhé! Muốn chấm điểm tự động, ba/mẹ mở app bằng trình duyệt Chrome
              hoặc Edge có micro và mạng nhé.
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => void startRecording()}
                aria-label="Ghi âm lại câu này"
                className="font-display rounded-full bg-white px-5 py-2.5 text-lg font-bold shadow-md active:scale-95"
              >
                🔁 Ghi âm lại
              </button>
              <button
                type="button"
                onClick={() => (isLast ? finish() : setIdx(idx + 1))}
                aria-label={isLast ? "Hoàn thành phần đọc" : "Sang câu đọc tiếp theo"}
                className="font-display rounded-full bg-[var(--mint)] px-5 py-2.5 text-lg font-extrabold text-white shadow-md active:scale-95"
              >
                {isLast ? "🏁 Hoàn thành phần đọc" : "➡️ Câu tiếp theo"}
              </button>
            </div>
          </div>
        )}

        {result?.status === "unsupported" && (
          <div className="mc-pop mt-5 rounded-[24px] bg-[var(--space-surface-alt)] p-4">
            <p className="font-bold">
              Thiết bị này chưa hỗ trợ cô nghe & chấm điểm tự động. Con cứ nghe cô đọc
              mẫu, đọc to theo cô, rồi nhờ ba/mẹ chấm sao cho con nhé! ⭐
            </p>
            <button
              type="button"
              onClick={() => (isLast ? finish() : setIdx(idx + 1))}
              aria-label={isLast ? "Hoàn thành phần đọc" : "Sang câu đọc tiếp theo"}
              className="font-display mt-3 rounded-full bg-[var(--mint)] px-5 py-2.5 text-lg font-extrabold text-white shadow-md active:scale-95"
            >
              {isLast ? "🏁 Hoàn thành phần đọc" : "➡️ Câu tiếp theo"}
            </button>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={finish}
        aria-label="Kết thúc phần đọc, chuyển sang trò chơi"
        className="font-display mt-4 w-full rounded-full bg-white py-3 text-lg font-bold shadow-md active:scale-[0.98]"
      >
        {avgScore != null
          ? `✅ Xong phần đọc (điểm ${avgScore}/100) — Sang trò chơi`
          : "Bỏ qua phần đọc — Sang trò chơi ▶"}
      </button>
    </div>
  );
}

// ================= GHÉP ĐÔI TRÍ NHỚ =================
// Lật thẻ ghép cặp HÌNH ↔ TỪ của chính bài học: vừa chơi vừa ghi nhớ mặt
// chữ. Mỗi lần lật thẻ đều phát tiếng đọc của từ để bé nghe–nhìn–nhớ cùng
// lúc. Ghép hết 4 cặp là thắng, nhận sticker Trí Nhớ Siêu Phàm (lần đầu).
interface MemoryCard {
  id: string;
  wordKey: string;
  kind: "pic" | "word";
}

function MemoryGame({
  lesson,
  onComplete,
  onGoQuiz,
  onBackLearn,
}: {
  lesson: LessonData;
  onComplete: () => void;
  onGoQuiz: () => void;
  onBackLearn: () => void;
}) {
  const [round, setRound] = useState(0);
  const pairs = useMemo(
    () => shuffle(lesson.words).slice(0, 4),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lesson, round],
  );
  const cards = useMemo<MemoryCard[]>(
    () =>
      shuffle(
        pairs.flatMap((wd) => [
          { id: `${wd.key}-pic`, wordKey: wd.key, kind: "pic" as const },
          { id: `${wd.key}-word`, wordKey: wd.key, kind: "word" as const },
        ]),
      ),
    [pairs],
  );
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [moves, setMoves] = useState(0);
  const [lock, setLock] = useState(false);
  const [cheerBurst, setCheerBurst] = useState(0);
  const doneFiredRef = useRef(false);
  const allDone = pairs.length > 0 && matched.size >= pairs.length;

  useEffect(() => {
    if (allDone && !doneFiredRef.current) {
      doneFiredRef.current = true;
      onComplete();
    }
  }, [allDone, onComplete]);

  function wordOf(card: MemoryCard): Word {
    return pairs.find((x) => x.key === card.wordKey) ?? lesson.words[0]!;
  }

  function flip(card: MemoryCard) {
    if (lock || flipped.includes(card.id) || matched.has(card.wordKey)) return;
    const wd = wordOf(card);
    void playAudio(wd.key, wd.en);
    const next = [...flipped, card.id];
    setFlipped(next);
    if (next.length === 2) {
      setMoves((m) => m + 1);
      const first = cards.find((c) => c.id === next[0]);
      if (first && first.wordKey === card.wordKey) {
        setMatched((s) => new Set(s).add(card.wordKey));
        setFlipped([]);
        setCheerBurst((b) => b + 1);
      } else {
        setLock(true);
        window.setTimeout(() => {
          setFlipped([]);
          setLock(false);
        }, 950);
      }
    }
  }

  function restart() {
    doneFiredRef.current = false;
    setFlipped([]);
    setMatched(new Set());
    setMoves(0);
    setLock(false);
    setRound((r) => r + 1);
  }

  return (
    <div className="mt-5">
      <p className="text-center text-sm font-bold text-[var(--dim)]">
        🧠 Lật thẻ, ghép hình với từ cho khớp nhé! Đã ghép {matched.size}/
        {pairs.length} cặp · {moves} lượt lật
      </p>
      <div className="mt-4 grid grid-cols-4 gap-2.5" key={round}>
        {cards.map((card) => {
          const wd = wordOf(card);
          const isUp = flipped.includes(card.id) || matched.has(card.wordKey);
          const isMatched = matched.has(card.wordKey);
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => flip(card)}
              disabled={isUp}
              aria-label={
                isUp
                  ? card.kind === "pic"
                    ? `Thẻ hình ${wd.vi}`
                    : `Thẻ từ ${wd.en}`
                  : "Lật thẻ bí mật"
              }
              className={`flex aspect-[3/4] flex-col items-center justify-center rounded-[20px] p-1 shadow-md transition-all ${
                isUp ? "bg-white" : "active:scale-95"
              }`}
              style={
                isMatched
                  ? { borderBottom: "6px solid var(--mint)", background: "#D8F5F0" }
                  : isUp
                    ? { borderBottom: `6px solid ${lesson.color}` }
                    : {
                        background: `linear-gradient(145deg, ${lesson.color}, var(--sun))`,
                        borderBottom: "6px solid rgba(0,0,0,0.15)",
                      }
              }
            >
              {isUp ? (
                card.kind === "pic" ? (
                  <span className="text-5xl" aria-hidden>{wd.emoji}</span>
                ) : (
                  <>
                    <span className="text-3xl" aria-hidden>{wd.emoji}</span>
                    <span className="font-display mt-0.5 text-lg leading-tight font-extrabold break-all">
                      {wd.en}
                    </span>
                  </>
                )
              ) : (
                <span className="text-4xl" aria-hidden>🌟</span>
              )}
            </button>
          );
        })}
      </div>

      {cheerBurst > 0 && !allDone && (
        <p key={cheerBurst} className="mc-pop mt-3 text-center text-lg font-bold text-[var(--mint)]">
          Đúng cặp rồi! Giỏi lắm 🎉
        </p>
      )}

      {allDone ? (
        <div className="mc-pop mt-5 rounded-[24px] bg-white p-5 text-center shadow-lg">
          <div className="text-6xl" aria-hidden>🧠🏆</div>
          <p className="font-display mt-2 text-2xl font-extrabold">
            Con ghép hết các cặp rồi!
          </p>
          <p className="mt-1 font-semibold text-[var(--dim)]">
            Chỉ {moves} lượt lật thôi — trí nhớ của Minh Châu siêu quá! Sticker
            🧠 Trí Nhớ Siêu Phàm đã vào bộ sưu tập (nếu chưa có).
          </p>
          <div className="mt-4 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={onGoQuiz}
              aria-label="Sang phần trò chơi câu hỏi"
              className="font-display w-full rounded-full bg-[var(--accent)] py-3.5 text-xl font-extrabold text-white shadow-md active:scale-[0.98]"
            >
              🎮 Sang trò chơi câu hỏi
            </button>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={restart}
                aria-label="Chơi lại ghép đôi trí nhớ"
                className="font-display flex-1 rounded-full bg-white py-3 text-lg font-bold shadow-md active:scale-[0.98]"
              >
                🔁 Chơi lại
              </button>
              <button
                type="button"
                onClick={onBackLearn}
                aria-label="Quay lại phần thẻ từ"
                className="font-display flex-1 rounded-full bg-white py-3 text-lg font-bold shadow-md active:scale-[0.98]"
              >
                📖 Về thẻ từ
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={onBackLearn}
          aria-label="Quay lại phần thẻ từ"
          className="font-display mt-4 w-full rounded-full bg-white py-3 text-lg font-bold shadow-md active:scale-[0.98]"
        >
          📖 Về thẻ từ
        </button>
      )}
    </div>
  );
}

// ================= ĐỢT 5: THỬ THÁCH TRÍ TUỆ THEO TỪNG BÀI =================
// 4 dạng tư duy dùng 100% từ vựng của chính bài đó (trừ vai "lạc nhóm"):
// 👀 Ai biến mất? (trí nhớ) · 👥 Ai không cùng nhóm? (phân loại)
// 🌑 Tìm bóng của bạn (quan sát) · 🔁 Đi tiếp theo mẫu (quy luật)
// Sai không trừ điểm; đúng ngay lần đầu tính sao như bài học. Hết thử thách
// hiện thẻ 🌟 Con có biết? + từ mở rộng ngoài SGK (gắn nhãn rõ).
type BrainKind = "missing" | "odd" | "shadow" | "pattern";
interface BrainItem {
  kind: BrainKind;
  promptVi: string;
  answer: Word;
  options: Word[];
  displayWords?: Word[];
  sequence?: Word[];
  patternLabel?: string;
  explanationVi?: string;
}

const BRAIN_CATEGORY_VI: Record<string, string> = {
  // con vật
  dog: "con vật", cat: "con vật", duck: "con vật", chicken: "con vật", fish: "con vật",
  goat: "con vật", horse: "con vật", monkey: "con vật", mouse: "con vật", tiger: "con vật",
  turtle: "con vật", elephant: "con vật", lion: "con vật", zebra: "con vật", frog: "con vật", pig: "con vật",
  // đồ ăn, đồ uống & trái cây
  cake: "đồ ăn và đồ uống", milk: "đồ ăn và đồ uống", chips: "đồ ăn và đồ uống",
  noodles: "đồ ăn và đồ uống", nuts: "đồ ăn và đồ uống",
  apple: "trái cây", mango: "trái cây", lemons: "trái cây", bananas: "trái cây",
  orange: "trái cây", grape: "trái cây", watermelon: "trái cây", strawberry: "trái cây",
  // xe cộ, đồ chơi, đồ dùng học tập
  car: "xe cộ", bike: "xe cộ", bus: "xe cộ", truck: "xe cộ",
  ball: "đồ chơi", football: "đồ chơi", top: "đồ chơi", "teddy bear": "đồ chơi",
  book: "đồ dùng học tập", pen: "đồ dùng học tập", pencil: "đồ dùng học tập",
  bag: "đồ dùng học tập", bell: "đồ dùng học tập", desk: "đồ dùng học tập",
  ruler: "đồ dùng học tập", crayon: "đồ dùng học tập", board: "đồ dùng học tập",
  // người, cơ thể, nhà, thiên nhiên
  bill: "người", girl: "người", mother: "người trong gia đình", father: "người trong gia đình",
  sister: "người trong gia đình", brother: "người trong gia đình", baby: "người trong gia đình",
  grandma: "người trong gia đình", grandpa: "người trong gia đình", teacher: "người",
  hair: "bộ phận cơ thể", hand: "bộ phận cơ thể", head: "bộ phận cơ thể",
  face: "bộ phận cơ thể", foot: "bộ phận cơ thể", eye: "bộ phận cơ thể",
  ear: "bộ phận cơ thể", nose: "bộ phận cơ thể", mouth: "bộ phận cơ thể",
  cup: "đồ dùng trong nhà", can: "đồ dùng trong nhà", door: "đồ dùng trong nhà",
  window: "đồ dùng trong nhà", clocks: "đồ dùng trong nhà", locks: "đồ dùng trong nhà",
  mops: "đồ dùng trong nhà", pots: "đồ dùng trong nhà", sofa: "đồ dùng trong nhà",
  table: "đồ dùng trong nhà", chair: "đồ dùng trong nhà", bed: "đồ dùng trong nhà",
  lamp: "đồ dùng trong nhà", tv: "đồ dùng trong nhà", kitchen: "nơi trong nhà", bathroom: "nơi trong nhà",
  garden: "thiên nhiên và ngoài trời", gate: "thiên nhiên và ngoài trời",
  lake: "thiên nhiên và ngoài trời", leaf: "thiên nhiên và ngoài trời", sun: "thiên nhiên và ngoài trời",
  hat: "đồ đội mặc",
  // số, màu, thời tiết, hành động, cảm xúc
  one: "số đếm", two: "số đếm", three: "số đếm", four: "số đếm", five: "số đếm",
  six: "số đếm", seven: "số đếm", eight: "số đếm", nine: "số đếm", ten: "số đếm",
  eleven: "số đếm", twelve: "số đếm", thirteen: "số đếm", fourteen: "số đếm", fifteen: "số đếm",
  sixteen: "số đếm", seventeen: "số đếm", eighteen: "số đếm", nineteen: "số đếm", twenty: "số đếm",
  red: "màu sắc", blue: "màu sắc", yellow: "màu sắc", green: "màu sắc",
  pink: "màu sắc", black: "màu sắc", white: "màu sắc",
  sunny: "thời tiết", rainy: "thời tiết", windy: "thời tiết", cloudy: "thời tiết",
  snowy: "thời tiết", hot: "thời tiết", cold: "thời tiết",
  run: "hành động", wash: "hành động", "sit down": "hành động", "stand up": "hành động",
  "open your book": "hành động", "close your book": "hành động", look: "hành động",
  listen: "hành động", point: "hành động", "sing a song": "hành động",
  happy: "cảm xúc", sad: "cảm xúc", hungry: "cảm giác", thirsty: "cảm giác",
};
function brainCategory(word: Word): string | null {
  const en = word.en.toLowerCase();
  return BRAIN_CATEGORY_VI[en] ?? BRAIN_CATEGORY_VI[en.split(" ")[0] ?? ""] ?? null;
}

function buildBrainItems(lesson: LessonData): BrainItem[] {
  const words = lesson.words;
  const items: BrainItem[] = [];
  // 1) Ai biến mất?
  {
    const shown = shuffle(words).slice(0, Math.min(4, words.length));
    const missing = shown[Math.floor(Math.random() * shown.length)] ?? shown[0]!;
    const outside = words.filter((x) => !shown.some((s) => s.key === x.key));
    const options =
      outside.length >= 2
        ? shuffle([missing, ...shuffle(outside).slice(0, 2)])
        : shuffle(shown);
    items.push({
      kind: "missing",
      promptVi: "Nhìn kỹ các bạn này rồi nhớ nhé! Một bạn sẽ biến mất đó!",
      answer: missing,
      options,
      displayWords: shown,
    });
  }
  // 2) Ai không cùng nhóm? — bộ 3 PHẢI thật sự cùng một nhóm và bạn lạc nhóm
  // thuộc nhóm khác hẳn. Ưu tiên: (a) cùng nhóm nghĩa (con vật/đồ ăn/…) trong
  // chính kho từ của bài; (b) cùng chữ cái trọng tâm của Unit (âm đầu giống
  // nhau — đúng trọng tâm phonics của sách); (c) cuối cùng mới là "từ của bài
  // này" và lời giải thích nói đúng định nghĩa nhóm đó, không nói sai nghĩa.
  {
    const allOther = UNITS.flatMap((u) => u.words).filter(
      (x) => !words.some((lw) => lw.key === x.key),
    );
    // (a) Nhóm nghĩa: gom từ của bài theo brainCategory, lấy nhóm có ≥3 từ
    const byCat = new Map<string, Word[]>();
    for (const wd of words) {
      const c = brainCategory(wd);
      if (!c) continue;
      byCat.set(c, [...(byCat.get(c) ?? []), wd]);
    }
    const semantic = [...byCat.entries()].find(([, v]) => v.length >= 3);
    let inGroup: Word[] | null = null;
    let odd: Word | null = null;
    let explanationVi = "";
    if (semantic) {
      const [cat, groupWords] = semantic;
      inGroup = shuffle(groupWords).slice(0, 3);
      const oddPool = shuffle(
        allOther.filter((x) => {
          const c = brainCategory(x);
          return c !== null && c !== cat;
        }),
      );
      odd = oddPool[0] ?? null;
      if (odd && inGroup) {
        explanationVi = `Đúng rồi! Ba bạn ${inGroup.map((x) => x.en).join(", ")} đều là ${cat}, còn bạn ${odd.en} — ${odd.vi} là ${brainCategory(odd)} nên không cùng nhóm đó con.`;
      }
    }
    // (b) Âm đầu / chữ cái trọng tâm của Unit
    if ((!inGroup || !odd) && lesson.letter) {
      const ch = lesson.letter[0]!.toLowerCase();
      const starters = words.filter((x) => x.en.toLowerCase().startsWith(ch));
      if (starters.length >= 3) {
        const oddPool = shuffle(
          allOther.filter((x) => !x.en.toLowerCase().startsWith(ch)),
        );
        if (oddPool[0]) {
          inGroup = shuffle(starters).slice(0, 3);
          odd = oddPool[0];
          explanationVi = `Đúng rồi! Ba bạn ${inGroup.map((x) => x.en).join(", ")} đều bắt đầu bằng chữ ${ch.toUpperCase()} — chữ của bài này, còn bạn ${odd.en} — ${odd.vi} bắt đầu bằng chữ khác nên lạc nhóm đó con.`;
        }
      }
    }
    // (c) Nhóm "từ của bài này" — giải thích nói đúng định nghĩa này
    if (!inGroup || !odd) {
      inGroup = shuffle(words).slice(0, 3);
      odd = shuffle(allOther)[0] ?? inGroup[0]!;
      explanationVi = `Đúng rồi! Ba bạn ${inGroup.map((x) => x.en).join(", ")} đều là từ của bài “${lesson.titleVi}” mà con vừa học, còn bạn ${odd.en} — ${odd.vi} là từ của bài khác lạc vào đó con.`;
    }
    items.push({
      kind: "odd",
      promptVi: "Ba bạn cùng một nhóm, một bạn lạc nhóm. Bạn nào không cùng nhóm?",
      answer: odd,
      options: shuffle([...inGroup, odd]),
      explanationVi,
    });
  }
  // 3) Tìm bóng của bạn
  {
    const target = words[Math.floor(Math.random() * words.length)] ?? words[0]!;
    const distractors = shuffle(words.filter((x) => x.key !== target.key)).slice(0, 3);
    items.push({
      kind: "shadow",
      promptVi: `Đây là bạn ${target.en}. Bóng nào là bóng của bạn ${target.en}?`,
      answer: target,
      options: shuffle([target, ...distractors]),
    });
  }
  // 4) Đi tiếp theo mẫu (ABAB hoặc AAB)
  {
    const pair = shuffle(words).slice(0, 2);
    const a = pair[0] ?? words[0]!;
    const b = pair[1] ?? words[1] ?? a;
    const useAAB = (lesson.unitNum ?? 1) % 2 === 0;
    const sequence = useAAB ? [a, a, b, a, a] : [a, b, a, b, a];
    const answer = b;
    const extra = shuffle(words.filter((x) => x.key !== a.key && x.key !== b.key)).slice(0, 1);
    items.push({
      kind: "pattern",
      promptVi: "Nhìn dãy hình này có quy luật đó! Hình nào đi tiếp theo mẫu?",
      answer,
      options: shuffle([answer, a, ...extra]).filter(
        (x, i, arr) => arr.findIndex((y) => y.key === x.key) === i,
      ),
      sequence,
      patternLabel: useAAB ? "Mẫu: hai bạn giống nhau, rồi một bạn khác…" : "Mẫu: xen kẽ một bạn này, một bạn kia…",
    });
  }
  // Xoay vòng thứ tự dạng theo số Unit để mỗi bài một cảm giác khác nhau
  const rot = (lesson.unitNum ?? 0) % items.length;
  return [...items.slice(rot), ...items.slice(0, rot)];
}

function ExtensionWordCard({ word, color }: { word: ExtensionWordDef; color: string }) {
  const [sayState, setSayState] = useState<
    | { kind: "idle" }
    | { kind: "listening" }
    | { kind: "scored"; score: number }
    | { kind: "unsupported" }
  >({ kind: "idle" });
  function sayIt() {
    const Ctor = getRecognitionCtor();
    void playAudio(word.key, word.en);
    if (!Ctor) {
      window.setTimeout(() => setSayState({ kind: "unsupported" }), 900);
      return;
    }
    window.setTimeout(() => {
      try {
        const rec = new Ctor();
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
              if (alt) best = Math.max(best, scoreSpeech(word.en, alt.transcript));
            }
          }
          done = true;
          setSayState({ kind: "scored", score: best });
        };
        rec.onerror = () => {
          if (!done) { done = true; setSayState({ kind: "unsupported" }); }
        };
        rec.onend = () => {
          if (!done) { done = true; setSayState({ kind: "unsupported" }); }
        };
        setSayState({ kind: "listening" });
        rec.start();
      } catch {
        setSayState({ kind: "unsupported" });
      }
    }, 1300);
  }
  return (
    <div className="rounded-[22px] bg-[var(--space-surface-alt)] p-4 text-center">
      <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-extrabold text-[var(--accent)]">
        Từ mở rộng — ngoài sách
      </span>
      <div className="mt-1 text-6xl leading-none" aria-hidden>{word.emoji}</div>
      <p className="font-display mt-1 text-2xl font-extrabold">{word.en}</p>
      <p className="text-sm font-semibold text-[var(--dim)]">{word.ipa} · {word.vi}</p>
      <div className="mt-2 flex justify-center gap-2">
        <button
          type="button"
          onClick={() => void playAudio(word.key, word.en)}
          aria-label={`Nghe đọc từ mở rộng ${word.en}`}
          className="font-display rounded-full px-4 py-2 text-base font-extrabold text-white shadow active:scale-95"
          style={{ background: color }}
        >
          🔊 Nghe
        </button>
        <button
          type="button"
          onClick={sayIt}
          disabled={sayState.kind === "listening"}
          aria-label={`Nói theo cô từ mở rộng ${word.en}`}
          className="font-display rounded-full bg-[var(--sky)] px-4 py-2 text-base font-extrabold text-white shadow active:scale-95 disabled:opacity-60"
        >
          {sayState.kind === "listening" ? "🎤 Cô đang nghe…" : "🎤 Nói theo cô"}
        </button>
      </div>
      {sayState.kind === "scored" && (
        <p className="mc-pop mt-2 rounded-xl bg-white px-3 py-1.5 text-sm font-extrabold" role="status">
          {sayState.score >= 80 ? "⭐⭐⭐ Đọc hay quá!" : sayState.score >= 50 ? "⭐⭐ Đọc tốt lắm!" : "⭐ Gần được rồi, thử lại nhé!"}
          <span className="block text-xs text-[var(--dim)]">Điểm đọc: {sayState.score}/100</span>
        </p>
      )}
      {sayState.kind === "unsupported" && (
        <p className="mc-pop mt-2 rounded-xl bg-white px-3 py-1.5 text-sm font-bold" role="status">
          Máy này chưa chấm điểm tự động được — con nghe cô rồi đọc to theo nhé!
        </p>
      )}
    </div>
  );
}

function BrainChallenge({
  lesson,
  onComplete,
  onGreat,
  onBackLearn,
  onGoQuiz,
}: {
  lesson: LessonData;
  onComplete: (correct: number, total: number) => void;
  onGreat: () => void;
  onBackLearn: () => void;
  onGoQuiz: () => void;
}) {
  const [round, setRound] = useState(0);
  const items = useMemo(
    () => buildBrainItems(lesson),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lesson, round],
  );
  const [idx, setIdx] = useState(0);
  const [stage, setStage] = useState<"memorize" | "ask">("ask");
  const [wrongKeys, setWrongKeys] = useState<Set<string>>(new Set());
  const [missed, setMissed] = useState(false);
  const [solved, setSolved] = useState(false);
  const [finishedAll, setFinishedAll] = useState(false);
  const correctRef = useRef(0);
  const firedRef = useRef(false);
  const item = items[idx] ?? items[0]!;
  const extension = useMemo(
    () =>
      extensionForLessonId(
        lesson.id,
        lesson.kind === "special"
          ? (SPECIALS.find((s) => s.id === lesson.id)?.unitNums[0] ?? null)
          : lesson.unitNum,
      ),
    [lesson],
  );

  useEffect(() => {
    setWrongKeys(new Set());
    setMissed(false);
    setSolved(false);
    if (item?.kind === "missing") {
      setStage("memorize");
      const t = window.setTimeout(() => setStage("ask"), 4200);
      return () => window.clearTimeout(t);
    }
    setStage("ask");
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, round]);

  function speakPrompt() {
    if (!item) return;
    void playAudio(`brainq-${lesson.id}-${item.kind}`, item.promptVi, "vi-VN");
    // Sau câu tiếng Việt, cô đọc lần lượt tên tiếng Anh của các từ liên quan
    // (MP3 giọng cô, cách nhau ~1,1 giây để không chồng tiếng) như lệ cũ.
    const related: Word[] =
      item.kind === "missing"
        ? (item.displayWords ?? [])
        : item.kind === "pattern"
          ? (item.sequence ?? [])
          : item.kind === "odd"
            ? item.options
            : [item.answer];
    related.forEach((wd, i) => {
      window.setTimeout(() => void playAudio(wd.key, wd.en), 1700 + i * 1100);
    });
  }

  function choose(chosen: Word) {
    if (solved || !item) return;
    if (chosen.key === item.answer.key) {
      if (!missed) correctRef.current += 1;
      setSolved(true);
      onGreat();
    } else {
      setMissed(true);
      setWrongKeys((s) => new Set(s).add(chosen.key));
      void playAudio("vitryagain", TRY_AGAIN_TEXT, "vi-VN");
    }
  }

  function next() {
    if (idx + 1 >= items.length) {
      setFinishedAll(true);
      if (!firedRef.current) {
        firedRef.current = true;
        onComplete(correctRef.current, items.length);
      }
    } else {
      setIdx(idx + 1);
    }
  }

  function restart() {
    correctRef.current = 0;
    firedRef.current = false;
    setIdx(0);
    setFinishedAll(false);
    setRound((r) => r + 1);
  }

  if (finishedAll) {
    const total = items.length;
    const correct = correctRef.current;
    const stars = total > 0 && correct / total >= 0.9 ? 3 : correct / total >= 0.5 ? 2 : 1;
    return (
      <div className="mt-5">
        <div className="mc-pop rounded-[28px] bg-white p-6 text-center shadow-lg" style={{ borderBottom: `8px solid ${lesson.color}` }}>
          <div className="text-6xl" aria-hidden>🧠🏆</div>
          <p className="font-display mt-2 text-3xl font-extrabold">Con làm xong thử thách trí tuệ rồi!</p>
          <p className="mt-1 text-3xl" aria-label={`Nhận ${stars} sao`}>{"⭐".repeat(stars)}</p>
          <p className="font-semibold text-[var(--dim)]">
            Đúng ngay lần đầu {correct}/{total} thử thách · Sticker 🧩 Nhà Tư Duy Nhí và 🔎 Ngôi Sao Tò Mò đã vào bộ sưu tập (nếu chưa có)!
          </p>
        </div>

        {/* 🌟 Con có biết? + từ mở rộng ngoài SGK */}
        <div className="mc-pop mt-4 rounded-[28px] bg-white p-5 shadow-lg" style={{ borderBottom: "8px solid var(--sun)" }}>
          <p className="font-display text-2xl font-extrabold">🌟 Con có biết?</p>
          <div className="mt-2 flex items-start gap-3">
            <p className="flex-1 text-lg leading-snug font-bold">{extension.factVi}</p>
            <button
              type="button"
              onClick={() => void playAudio(`fact-${lesson.id}`, extension.factVi, "vi-VN")}
              aria-label="Nghe cô kể sự thật thú vị"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--sun)] text-2xl shadow active:scale-95"
            >
              🔊
            </button>
          </div>
          <p className="font-display mt-4 text-xl font-extrabold">Học thêm từ mới cùng chủ đề nhé!</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {extension.words.map((wd) => (
              <ExtensionWordCard key={wd.en} word={wd} color={lesson.color} />
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2.5">
          <button type="button" onClick={onGoQuiz} aria-label="Sang phần trò chơi câu hỏi" className="font-display w-full rounded-full bg-[var(--accent)] py-3.5 text-xl font-extrabold text-white shadow-md active:scale-[0.98]">
            🎮 Sang trò chơi câu hỏi
          </button>
          <div className="flex gap-2.5">
            <button type="button" onClick={restart} aria-label="Chơi lại thử thách trí tuệ" className="font-display flex-1 rounded-full bg-white py-3 text-lg font-bold shadow-md active:scale-[0.98]">
              🔁 Chơi lại
            </button>
            <button type="button" onClick={onBackLearn} aria-label="Quay lại phần thẻ từ" className="font-display flex-1 rounded-full bg-white py-3 text-lg font-bold shadow-md active:scale-[0.98]">
              📖 Về thẻ từ
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!item) return null;
  const kindTitle =
    item.kind === "missing" ? "👀 Ai biến mất?" :
    item.kind === "odd" ? "👥 Ai không cùng nhóm?" :
    item.kind === "shadow" ? "🌑 Tìm bóng của bạn" : "🔁 Đi tiếp theo mẫu";

  return (
    <div className="mt-5">
      <div className="flex items-center gap-2" aria-hidden>
        {items.map((_, i) => (
          <span key={i} className="h-3 flex-1 rounded-full" style={{ background: i < idx ? "#2EC4B6" : i === idx ? lesson.color : "#F0D9CE" }} />
        ))}
      </div>
      <p className="mt-2 text-center text-sm font-bold text-[var(--dim)]">
        🧠 Thử thách {idx + 1}/{items.length} · {kindTitle} · Dùng từ của bài này thôi đó!
      </p>

      <div key={`${round}-${idx}`} className="mc-pop mt-4 rounded-[28px] bg-white p-5 text-center shadow-lg" style={{ borderBottom: `8px solid ${lesson.color}` }}>
        <p className="font-display text-2xl leading-snug font-extrabold">{item.promptVi}</p>
        <button
          type="button"
          onClick={speakPrompt}
          aria-label="Nghe cô đọc câu hỏi thử thách bằng tiếng Việt"
          className="font-display mt-3 inline-flex items-center gap-2 rounded-full bg-[var(--mint)] px-5 py-2.5 text-lg font-extrabold text-white shadow active:scale-95"
        >
          🔊 Nghe cô hỏi
        </button>

        {item.kind === "missing" && stage === "memorize" && (
          <div className="mt-4">
            <div className="flex flex-wrap justify-center gap-3">
              {(item.displayWords ?? []).map((wd) => (
                <button key={wd.key} type="button" onClick={() => void playAudio(wd.key, wd.en)} aria-label={`Nghe từ ${wd.en}`} className="rounded-[20px] bg-[var(--space-surface-alt)] px-4 py-3 shadow-sm active:scale-95">
                  <span className="block text-6xl" aria-hidden>{wd.emoji}</span>
                  <span className="font-display block text-lg font-extrabold">{wd.en}</span>
                </button>
              ))}
            </div>
            <p className="mc-pop mt-3 font-bold text-[var(--accent)]">Nhớ kỹ nhé… một bạn sắp trốn đi! 🙈</p>
            <button type="button" onClick={() => setStage("ask")} aria-label="Con nhớ rồi, bắt đầu đoán bạn biến mất" className="font-display mt-2 rounded-full bg-[var(--accent)] px-6 py-3 text-xl font-extrabold text-white shadow active:scale-95">
              Con nhớ rồi! ▶
            </button>
          </div>
        )}

        {item.kind === "missing" && stage === "ask" && (
          <div className="mt-4">
            <div className="flex flex-wrap justify-center gap-3" aria-hidden>
              {(item.displayWords ?? []).map((wd) =>
                wd.key === item.answer.key ? (
                  <span key={wd.key} className="flex h-[104px] w-[92px] items-center justify-center rounded-[20px] border-4 border-dashed border-[#E8CFC2] text-5xl">❓</span>
                ) : (
                  <span key={wd.key} className="rounded-[20px] bg-[var(--space-surface-alt)] px-4 py-3">
                    <span className="block text-6xl">{wd.emoji}</span>
                    <span className="font-display block text-lg font-extrabold">{wd.en}</span>
                  </span>
                ),
              )}
            </div>
            <p className="font-display mt-3 text-xl font-extrabold">Bạn nào đã biến mất?</p>
          </div>
        )}

        {item.kind === "pattern" && (
          <div className="mt-4">
            <div className="flex flex-wrap items-center justify-center gap-2" aria-hidden>
              {(item.sequence ?? []).map((wd, i) => (
                <span key={i} className="rounded-2xl bg-[var(--space-surface-alt)] px-3 py-2 text-5xl">{wd.emoji}</span>
              ))}
              <span className="flex h-[68px] w-[60px] items-center justify-center rounded-2xl border-4 border-dashed border-[#E8CFC2] text-4xl">❓</span>
            </div>
            {item.patternLabel && <p className="mt-2 text-sm font-bold text-[var(--dim)]">{item.patternLabel}</p>}
          </div>
        )}

        {item.kind === "shadow" && (
          <div className="mt-4">
            <span className="text-[84px] leading-none" aria-hidden>{item.answer.emoji}</span>
            <p className="font-display mt-1 text-3xl font-extrabold">{item.answer.en} <span className="text-lg text-[var(--dim)]">{item.answer.vi}</span></p>
          </div>
        )}
      </div>

      {/* Đáp án */}
      {!(item.kind === "missing" && stage === "memorize") && (
        <div className={`mt-4 grid gap-3 ${item.kind === "shadow" ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2"}`}>
          {item.options.map((opt) => {
            const isWrong = wrongKeys.has(opt.key);
            const isAnswer = solved && opt.key === item.answer.key;
            return (
              <button
                key={opt.key}
                type="button"
                disabled={isWrong || solved}
                onClick={() => choose(opt)}
                aria-label={
                  item.kind === "shadow" ? `Chọn bóng hình ${opt.vi}` :
                  item.kind === "odd" ? `Chọn bạn ${opt.en} — ${opt.vi}` :
                  `Chọn hình ${opt.en} — ${opt.vi}`
                }
                className={`rounded-[22px] bg-white p-3 shadow-md active:scale-[0.97] ${isWrong ? "mc-shake opacity-40" : ""}`}
                style={{ borderBottom: `6px solid ${isAnswer ? "var(--mint)" : lesson.color}`, background: isAnswer ? "#D8F5F0" : undefined }}
              >
                {item.kind === "shadow" ? (
                  <span className="block py-2 text-6xl" style={{ filter: "brightness(0)", opacity: 0.88 }} aria-hidden>{opt.emoji}</span>
                ) : (
                  <>
                    <span className="block text-6xl" aria-hidden>{opt.emoji}</span>
                    <span className="font-display mt-1 block text-xl font-extrabold">{opt.en}</span>
                    <span className="block text-sm font-semibold text-[var(--dim)]">{opt.vi}</span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      )}

      {missed && !solved && (
        <p className="mc-pop mt-4 text-center text-lg font-bold text-[var(--accent)]" role="status">
          Gần đúng rồi! Nhìn kỹ lại một chút nhé 💪 {item.kind === "pattern" ? "Đếm lại dãy hình theo mẫu nào!" : item.kind === "odd" ? "Ba bạn nào giống nhau về một điểm nào đó?" : item.kind === "shadow" ? "So hình của bóng với bạn thật nhé!" : "Nhớ lại lúc đầu có những bạn nào nào!"}
        </p>
      )}
      {solved && (
        <div className="mc-pop mt-4 rounded-[24px] bg-[#D8F5F0] p-4 text-center">
          <p className="font-display text-2xl font-extrabold">🎉 Đúng rồi! Giỏi quá!</p>
          {item.explanationVi && <p className="mt-1 font-bold">{item.explanationVi}</p>}
          {item.kind === "shadow" && <p className="mt-1 font-bold">Bóng này đúng là của bạn {item.answer.en} đó con!</p>}
          {item.kind === "pattern" && <p className="mt-1 font-bold">Đúng mẫu rồi! Tiếp theo mẫu là bạn {item.answer.en} đó con!</p>}
          {item.kind === "missing" && <p className="mt-1 font-bold">Bạn {item.answer.en} — {item.answer.vi} đã trốn đi đó, con nhớ giỏi quá!</p>}
          <button type="button" onClick={next} aria-label={idx + 1 >= items.length ? "Xem kết quả thử thách và thẻ Con có biết" : "Sang thử thách tiếp theo"} className="font-display mt-3 rounded-full bg-[var(--mint)] px-6 py-3 text-xl font-extrabold text-white shadow active:scale-95">
            {idx + 1 >= items.length ? "🌟 Xem điều thú vị ▶" : "➡️ Thử thách tiếp theo"}
          </button>
        </div>
      )}

      {!solved && (
        <button type="button" onClick={onBackLearn} aria-label="Quay lại phần thẻ từ" className="font-display mt-4 w-full rounded-full bg-white py-3 text-lg font-bold shadow-md active:scale-[0.98]">
          📖 Về thẻ từ
        </button>
      )}
    </div>
  );
}

// ================= MÀN HÌNH BÀI HỌC =================
function LessonScreen({
  lesson,
  completedUnitIds,
  bestSpeechScore,
  onBack,
  onReplay,
  onPlayGame,
  displayMode = "phone",
}: {
  lesson: LessonData;
  completedUnitIds: Set<string>;
  bestSpeechScore: number | null;
  onBack: () => void;
  onReplay: () => void;
  onPlayGame: () => void;
  displayMode?: DisplayMode;
}) {
  const isDesktop = displayMode === "desktop";
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<"learn" | "practice" | "memory" | "brain" | "quiz" | "done">("learn");
  const [practiceScore, setPracticeScore] = useState<number | null>(null);
  const practiceDoneRef = useRef(false);
  const [cardIdx, setCardIdx] = useState(0);
  const [questions] = useState<Question[]>(() => buildQuestions(lesson));
  const [qIdx, setQIdx] = useState(0);
  const [wrongKeys, setWrongKeys] = useState<Set<string>>(new Set());
  const [wrongSentences, setWrongSentences] = useState<Set<string>>(new Set());
  const [missedThisQ, setMissedThisQ] = useState(false);
  const [firstTryCorrect, setFirstTryCorrect] = useState(0);
  // Chuỗi lửa: số câu đúng liền nhau (đúng ngay lần đầu mới tính).
  const [streak, setStreak] = useState(0);
  const streakRewardRef = useRef(false);
  const memoryRewardRef = useRef(false);
  const [celebrate, setCelebrate] = useState(0);
  const [cheerEmoji, setCheerEmoji] = useState("🎉");
  const [praiseText, setPraiseText] = useState(PRAISE_TEXTS[0]!);
  const [confettiKey, setConfettiKey] = useState(0);
  const [giftOpened, setGiftOpened] = useState(false);
  const [starsEarned, setStarsEarned] = useState(0);
  const submittedRef = useRef(false);

  const word = lesson.words[cardIdx] ?? lesson.words[0]!;
  const question = questions[qIdx];

  const completeMut = useMutation({
    mutationFn: (args: {
      lessonId: string; correct: number; total: number;
      rewardIds: string[]; giftId: string | null;
    }) => api.completeLesson(args),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["state"] }),
  });

  const speechMut = useMutation({
    mutationFn: (args: { lessonId: string; score: number }) =>
      api.saveSpeechScore(args),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["state"] }),
  });

  const grantMut = useMutation({
    mutationFn: (rewardIds: string[]) => api.grantRewards({ rewardIds }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["state"] }),
  });

  const brainRewardRef = useRef(false);
  function handleBrainComplete(correct: number, total: number) {
    setConfettiKey((k) => k + 1);
    if (!brainRewardRef.current) {
      brainRewardRef.current = true;
      // Sao của thử thách trí tuệ vào đúng hệ thống sao sẵn có (lessonId riêng
      // brain-<id> để không ghi đè sao của phần câu hỏi), kèm 2 sticker mới.
      completeMut.mutate({
        lessonId: `brain-${lesson.id}`,
        correct,
        total,
        rewardIds: ["stk-brain", "stk-curiosity"],
        giftId: null,
      });
    }
  }
  function handleBrainGreat() {
    setConfettiKey((k) => k + 1);
    const praise = randomPraise();
    void playAudio(praise.key, praise.text, "vi-VN");
  }

  function handleMemoryComplete() {
    setConfettiKey((k) => k + 1);
    const praise = randomPraise();
    playAudio(praise.key, praise.text, "vi-VN");
    if (!memoryRewardRef.current) {
      memoryRewardRef.current = true;
      grantMut.mutate(["stk-memory"]);
    }
  }

  function finishPractice(score: number | null) {
    if (practiceDoneRef.current) return;
    practiceDoneRef.current = true;
    setPracticeScore(score);
    if (score != null) {
      speechMut.mutate({ lessonId: lesson.id, score });
    }
    setPhase("quiz");
  }

  // KHÔNG còn tự phát tiếng khi mở bài/chuyển thẻ/vào câu hỏi: phát tự động
  // lúc chưa có chạm bị trình duyệt chặn — đó là gốc rễ lỗi "không có tiếng".
  // Mọi tiếng nay phát từ nút loa do chính bé bấm (đúng ngữ cảnh chạm).

  function finishLesson(correctCount: number) {
    const total = questions.length;
    const ratio = total > 0 ? correctCount / total : 0;
    const stars = ratio >= 0.9 ? 3 : ratio >= 0.6 ? 2 : 1;
    setStarsEarned(stars);
    setPhase("done");
    setConfettiKey((k) => k + 1);
    if (!submittedRef.current) {
      submittedRef.current = true;
      const rewardIds = [lesson.stickerId];
      if (lesson.kind === "unit") {
        const after = new Set(completedUnitIds);
        after.add(lesson.id);
        if (after.size === 1) rewardIds.push("stk-first");
        if (after.size >= 8) rewardIds.push("stk-half");
        if (after.size >= 16) rewardIds.push("stk-all");
      }
      completeMut.mutate({
        lessonId: lesson.id,
        correct: correctCount,
        total,
        rewardIds,
        giftId: lesson.unitNum != null ? `gift-unit${lesson.unitNum}` : null,
      });
    }
  }

  function handleCorrect() {
    const gained = missedThisQ ? 0 : 1;
    const newCorrect = firstTryCorrect + gained;
    if (!missedThisQ) {
      setFirstTryCorrect(newCorrect);
      // Chuỗi lửa: đúng liền nhau từ 3 câu → pháo giấy thêm + sticker 🔥.
      const ns = streak + 1;
      setStreak(ns);
      if (ns >= 3 && !streakRewardRef.current) {
        streakRewardRef.current = true;
        grantMut.mutate(["stk-streak"]);
      }
    }
    setCheerEmoji(CHEER_EMOJIS[Math.floor(Math.random() * CHEER_EMOJIS.length)]!);
    const praise = randomPraise();
    setPraiseText(praise.text);
    setCelebrate((c) => c + 1);
    setConfettiKey((k) => k + 1);
    playAudio(praise.key, praise.text, "vi-VN");
    window.setTimeout(() => {
      setCelebrate(0);
      setMissedThisQ(false);
      setWrongKeys(new Set());
      setWrongSentences(new Set());
      if (qIdx + 1 >= questions.length) finishLesson(newCorrect);
      else setQIdx(qIdx + 1);
    }, 1500);
  }

  function handleWrong() {
    setMissedThisQ(true);
    setStreak(0);
    // Cô động viên bằng tiếng Việt để bé không nản và thử lại.
    playAudio("vitryagain", TRY_AGAIN_TEXT, "vi-VN");
  }

  function answer(q: Question, chosen: Word) {
    if (chosen.key === q.word.key) {
      handleCorrect();
    } else {
      handleWrong();
      setWrongKeys((s) => new Set(s).add(chosen.key));
    }
  }

  function answerSentence(_q: Question, chosen: string) {
    if (lesson.pattern && chosen === lesson.pattern) {
      handleCorrect();
    } else {
      handleWrong();
      setWrongSentences((s) => new Set(s).add(chosen));
    }
  }

  const gift =
    lesson.kind === "unit" && lesson.unitNum != null
      ? giftForUnit(lesson.unitNum)
      : null;
  const audioHint = useAudioHint();

  return (
    <div className={isDesktop ? "mx-auto w-full max-w-5xl px-4 pb-10 sm:px-6 lg:px-8" : "mx-auto w-full max-w-2xl px-4 pb-10"}>
      <Confetti burstKey={confettiKey} big={phase === "done" && giftOpened} />
      <AudioHintBar show={audioHint.hint} onTap={audioHint.dismiss} />

      {/* Thanh đầu bài */}
      <div className={`flex items-center gap-3 pt-4 ${isDesktop ? "pt-6" : ""}`}>
        <button
          type="button"
          onClick={onBack}
          aria-label="Quay lại trang chủ"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-2xl shadow-md"
        >
          ←
        </button>
        <div className="min-w-0">
          <p className="font-display truncate text-xl leading-tight font-bold">
            {lesson.kind === "unit" ? `Unit ${lesson.unitNum}: ` : ""}{lesson.titleEn}
          </p>
          <p className="text-sm text-[var(--dim)]">{lesson.titleVi}</p>
        </div>
        <span className="ml-auto text-4xl" aria-hidden>{lesson.scene}</span>
      </div>

      {phase === "learn" && (
        <div className="mt-5">
          {/* Thẻ từ lớn */}
          <div
            key={word.key}
            className="mc-pop rounded-[28px] bg-white p-6 text-center shadow-lg"
            style={{ borderBottom: `8px solid ${lesson.color}` }}
          >
            <div className="text-[92px] leading-none" aria-hidden>{word.emoji}</div>
            <p className="font-display mt-3 text-5xl font-extrabold tracking-wide">{word.en}</p>
            <p className="mt-1 text-lg text-[var(--dim)]">{word.ipa} · {word.vi}</p>
            <button
              type="button"
              onClick={() => playAudio(word.key, word.en)}
              aria-label={`Nghe đọc từ ${word.en}`}
              className="font-display mt-4 inline-flex items-center gap-2 rounded-full px-7 py-3 text-xl font-bold text-white shadow-md active:scale-95"
              style={{ background: lesson.color }}
            >
              🔊 Nghe cô đọc
            </button>
          </div>

          {/* Điều hướng thẻ */}
          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              disabled={cardIdx === 0}
              onClick={() => setCardIdx(cardIdx - 1)}
              aria-label="Từ trước"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl shadow-md disabled:opacity-30"
            >
              ‹
            </button>
            <div className="flex gap-1.5" aria-hidden>
              {lesson.words.map((x, i) => (
                <span
                  key={x.key}
                  className="h-2.5 rounded-full transition-all"
                  style={{
                    width: i === cardIdx ? 22 : 10,
                    background: i === cardIdx ? lesson.color : "#F0D9CE",
                  }}
                />
              ))}
            </div>
            <button
              type="button"
              disabled={cardIdx >= lesson.words.length - 1}
              onClick={() => setCardIdx(cardIdx + 1)}
              aria-label="Từ tiếp theo"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl shadow-md disabled:opacity-30"
            >
              ›
            </button>
          </div>

          {/* Tất cả từ của bài — máy tính: hàng ngang rộng, điện thoại: 4 cột gọn */}
          <div className={isDesktop ? "mt-5 grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-8" : "mt-5 grid grid-cols-4 gap-2"}>
            {lesson.words.map((x, i) => (
              <button
                key={x.key}
                type="button"
                onClick={() => setCardIdx(i)}
                aria-label={`Xem từ ${x.en}`}
                className="rounded-2xl bg-white px-1 py-2.5 text-center shadow-sm"
                style={i === cardIdx ? { outline: `3px solid ${lesson.color}` } : undefined}
              >
                <span className="block text-3xl" aria-hidden>{x.emoji}</span>
                <span className="font-display block truncate text-sm font-bold">{x.en}</span>
              </button>
            ))}
          </div>

          {/* Âm & mẫu câu trong sách */}
          {lesson.letter && (
            <div className="mt-5 rounded-[24px] bg-white p-5 shadow-md">
              <div className="flex items-center gap-4">
                <span
                  className="font-display flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-3xl font-extrabold text-white"
                  style={{ background: lesson.color }}
                  aria-hidden
                >
                  {lesson.letter}
                </span>
                <div className="min-w-0">
                  <p className="font-display text-lg font-bold">
                    Chữ {lesson.letter} đọc là {lesson.sound}
                  </p>
                  <p className="truncate text-sm text-[var(--dim)]">
                    {lesson.words.slice(0, 4).map((x) => x.en).join(" · ")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    lesson.phonicsAudio &&
                    playAudio(
                      lesson.phonicsAudio,
                      lesson.words.map((x) => x.en).join(", "),
                    )
                  }
                  aria-label="Nghe đọc chữ cái và các từ"
                  className="ml-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--sun)] text-2xl shadow-md active:scale-95"
                >
                  🔊
                </button>
              </div>
              {lesson.pattern && (
                <div className="mt-4 flex items-center gap-3 rounded-2xl bg-[var(--space-surface-alt)] p-4">
                  <div className="min-w-0">
                    <p className="font-display text-xl font-bold">{lesson.pattern}</p>
                    <p className="text-sm text-[var(--dim)]">{lesson.patternVi}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      lesson.patternAudio &&
                      playAudio(lesson.patternAudio, lesson.pattern ?? undefined)
                    }
                    aria-label="Nghe đọc mẫu câu"
                    className="ml-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--sun)] text-2xl shadow-md active:scale-95"
                  >
                    🔊
                  </button>
                </div>
              )}
              {lesson.pattern2 && (
                <div className="mt-3 flex items-center gap-3 rounded-2xl bg-[var(--space-surface-alt)] p-4">
                  <div className="min-w-0">
                    <p className="font-display text-xl font-bold">{lesson.pattern2}</p>
                    <p className="text-sm text-[var(--dim)]">{lesson.patternVi2}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      lesson.patternAudio2 &&
                      playAudio(lesson.patternAudio2, lesson.pattern2 ?? undefined)
                    }
                    aria-label="Nghe đọc mẫu câu trả lời"
                    className="ml-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--sun)] text-2xl shadow-md active:scale-95"
                  >
                    🔊
                  </button>
                </div>
              )}
            </div>
          )}

          {lesson.kind === "unit" && (
            <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-center text-sm font-bold text-[var(--dim)] shadow-sm">
              📖 Trong sách, bài này có 8 hoạt động: Nghe &amp; nhắc lại · Chỉ &amp;
              nói · Nghe &amp; hát đồng dao · Nghe &amp; đánh dấu ✓ · Tô &amp; viết
              chữ · Mẫu câu · Cùng nói · Cùng hát 🎵
            </p>
          )}

          <div className={isDesktop ? "mt-6 grid grid-cols-3 gap-4" : ""}>
            <button
              type="button"
              onClick={() => setPhase("practice")}
              className={`font-display w-full rounded-full bg-[var(--mint)] py-4 text-2xl font-extrabold text-white shadow-lg active:scale-[0.98] ${isDesktop ? "" : "mt-6"}`}
            >
              🎤 Nghe & đọc lại theo cô
              {bestSpeechScore != null ? ` · Kỷ lục: ${bestSpeechScore}/100` : ""}
            </button>
            <button
              type="button"
              onClick={() => setPhase("memory")}
              className={`font-display w-full rounded-full bg-[#7B61FF] py-4 text-2xl font-extrabold text-white shadow-lg active:scale-[0.98] ${isDesktop ? "" : "mt-3"}`}
            >
              🧠 Ghép đôi trí nhớ
            </button>
            <button
              type="button"
              onClick={() => setPhase("quiz")}
              className={`font-display w-full rounded-full bg-[var(--accent)] py-4 text-2xl font-extrabold text-white shadow-lg active:scale-[0.98] ${isDesktop ? "" : "mt-3"}`}
            >
              🎮 Chơi trò chơi thôi!
            </button>
          </div>

          {/* ĐỢT 5: Thử thách trí tuệ của chính bài này — ở cuối phần hoạt động */}
          <div className="mt-6 rounded-[28px] bg-white p-5 shadow-lg" style={{ borderBottom: `8px solid ${lesson.color}` }}>
            <p className="font-display text-2xl font-extrabold">🧠 Thử thách trí tuệ của {lesson.kind === "unit" ? `Unit ${lesson.unitNum}` : "bài này"}</p>
            <p className="mt-1 font-semibold text-[var(--dim)]">
              4 trò tư duy dùng đúng từ vựng của bài này — chơi xong còn được học điều thú vị và từ mới mở rộng nữa!
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-left">
              <span className="rounded-2xl bg-[var(--space-surface-alt)] px-3 py-2 font-display text-base font-extrabold">👀 Ai biến mất? <span className="block text-sm font-bold text-[var(--dim)]">Trí nhớ siêu phàm</span></span>
              <span className="rounded-2xl bg-[var(--space-surface-alt)] px-3 py-2 font-display text-base font-extrabold">👥 Ai không cùng nhóm? <span className="block text-sm font-bold text-[var(--dim)]">Phân loại thông minh</span></span>
              <span className="rounded-2xl bg-[var(--space-surface-alt)] px-3 py-2 font-display text-base font-extrabold">🌑 Tìm bóng của bạn <span className="block text-sm font-bold text-[var(--dim)]">Mắt tinh quan sát</span></span>
              <span className="rounded-2xl bg-[var(--space-surface-alt)] px-3 py-2 font-display text-base font-extrabold">🔁 Đi tiếp theo mẫu <span className="block text-sm font-bold text-[var(--dim)]">Tìm quy luật</span></span>
            </div>
            <button
              type="button"
              onClick={() => setPhase("brain")}
              aria-label={`Bắt đầu thử thách trí tuệ của ${lesson.titleEn} bằng từ vựng của bài này`}
              className="font-display mt-4 w-full rounded-full py-4 text-2xl font-extrabold text-white shadow-lg active:scale-[0.98]"
              style={{ background: "linear-gradient(90deg, #7B61FF, var(--sky))" }}
            >
              🧠 Bắt đầu thử thách trí tuệ ▶
            </button>
          </div>
        </div>
      )}

      {phase === "brain" && (
        <BrainChallenge
          lesson={lesson}
          onComplete={handleBrainComplete}
          onGreat={handleBrainGreat}
          onBackLearn={() => setPhase("learn")}
          onGoQuiz={() => setPhase("quiz")}
        />
      )}

      {phase === "memory" && (
        <MemoryGame
          lesson={lesson}
          onComplete={handleMemoryComplete}
          onGoQuiz={() => setPhase("quiz")}
          onBackLearn={() => setPhase("learn")}
        />
      )}

      {phase === "practice" && (
        <SpeechPractice
          lesson={lesson}
          onFinish={finishPractice}
          onGreat={() => {
            setConfettiKey((k) => k + 1);
            const praise = randomPraise();
            playAudio(praise.key, praise.text, "vi-VN");
          }}
        />
      )}

      {phase === "quiz" && question && (
        <div className="mt-5">
          <div className="flex items-center gap-2" aria-hidden>
            {questions.map((_, i) => (
              <span
                key={i}
                className="h-3 flex-1 rounded-full"
                style={{ background: i < qIdx ? "#2EC4B6" : i === qIdx ? lesson.color : "#F0D9CE" }}
              />
            ))}
          </div>
          <p className="mt-2 text-center text-sm font-bold text-[var(--dim)]">
            Câu {qIdx + 1} / {questions.length} · Đúng ngay lần đầu: {firstTryCorrect} ⭐
            {streak >= 2 ? (
              <span className="text-[#E8590C]"> · 🔥 Chuỗi lửa ×{streak} — đúng liền {streak} câu!</span>
            ) : null}
          </p>

          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={() => {
                const qv = questionViAudio(question, lesson);
                playAudio(qv.key, qv.text, "vi-VN");
              }}
              aria-label="Nghe cô đọc câu hỏi bằng tiếng Việt"
              className="font-display inline-flex items-center gap-2 rounded-full px-6 py-3 text-lg font-extrabold text-white shadow-md active:scale-95"
              style={{ background: "var(--mint)" }}
            >
              🗣 Nghe cô hỏi bằng tiếng Việt
            </button>
          </div>

          <div key={qIdx} className="mc-pop mt-4 rounded-[28px] bg-white p-6 text-center shadow-lg">
            {question.type === "listen" && (
              <>
                <p className="font-display text-2xl font-bold">Nghe và chọn hình đúng nhé!</p>
                <button
                  type="button"
                  onClick={() => playAudio(question.word.key, question.word.en)}
                  aria-label="Nghe lại từ"
                  className="mt-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-[var(--sun)] text-4xl shadow-md active:scale-95"
                >
                  🔊
                </button>
              </>
            )}
            {question.type === "picture" && (
              <>
                <div className="text-[84px] leading-none" aria-hidden>{question.word.emoji}</div>
                <p className="font-display mt-3 text-2xl font-bold">Đây là gì nhỉ?</p>
                <button
                  type="button"
                  onClick={() => playAudio(question.word.key, question.word.en)}
                  aria-label="Nghe gợi ý phát âm"
                  className="mt-2 inline-flex items-center gap-1 rounded-full bg-[var(--space-surface-alt)] px-4 py-1.5 text-base font-bold active:scale-95"
                >
                  🔊 Nghe gợi ý
                </button>
              </>
            )}
            {question.type === "letter" && (
              <>
                <p className="font-display text-2xl font-bold">
                  Từ nào bắt đầu bằng chữ{" "}
                  <span style={{ color: lesson.color }}>{lesson.letter?.[0]}</span>?
                </p>
                <div className="mt-3 text-6xl" aria-hidden>🔤</div>
              </>
            )}
            {question.type === "blank" && (
              <>
                <p className="font-display text-2xl font-bold">Điền từ còn thiếu vào câu nhé!</p>
                <p className="font-display mt-4 text-3xl leading-snug font-extrabold">
                  {question.blankBefore}
                  <span className="mx-1 rounded-xl bg-[#FFF0D6] px-3 py-0.5 text-[var(--accent)]">
                    ____
                  </span>
                  {question.blankAfter}
                </p>
                {lesson.patternVi && (
                  <p className="mt-2 text-base font-semibold text-[var(--dim)]">
                    Gợi ý nghĩa câu: {lesson.patternVi}
                  </p>
                )}
              </>
            )}
            {question.type === "sentence" && (
              <>
                <p className="font-display text-2xl font-bold">
                  Nghe cô đọc, rồi chọn đúng câu cô vừa đọc nhé!
                </p>
                <button
                  type="button"
                  onClick={() =>
                    lesson.patternAudio &&
                    playAudio(lesson.patternAudio, lesson.pattern ?? undefined)
                  }
                  aria-label="Nghe cô đọc mẫu câu"
                  className="mt-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-[var(--sun)] text-4xl shadow-md active:scale-95"
                >
                  🔊
                </button>
              </>
            )}
            {question.type === "count" && (
              <>
                <p className="font-display text-2xl font-bold">
                  Đếm xem có mấy{" "}
                  {question.countItem ? question.countItem.vi : "ngôi sao"} nhé!
                </p>
                <div
                  className="mx-auto mt-4 flex max-w-sm flex-wrap justify-center gap-1.5 text-5xl"
                  aria-hidden
                >
                  {Array.from({ length: question.countValue ?? 0 }).map((_, i) => (
                    <span key={i}>{question.countItem?.emoji ?? "⭐"}</span>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    playAudio(
                      `countq-${lesson.id}`,
                      `How many ${question.countItem?.en ?? "stars"} can you see?`,
                    )
                  }
                  aria-label="Nghe câu hỏi đếm số bằng tiếng Anh"
                  className="font-display mt-3 inline-flex items-center gap-1 rounded-full bg-[var(--space-surface-alt)] px-4 py-1.5 text-base font-bold active:scale-95"
                >
                  🔊 How many {question.countItem?.en ?? "stars"}?
                </button>
              </>
            )}
          </div>

          {question.type === "sentence" ? (
            <div className="mt-4 grid gap-3 grid-cols-1">
              {(question.sentences ?? []).map((s) => {
                const isWrong = wrongSentences.has(s);
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={isWrong || celebrate > 0}
                    onClick={() => answerSentence(question, s)}
                    aria-label={`Chọn câu: ${s}`}
                    className={`rounded-[22px] bg-white shadow-md active:scale-[0.97] ${isWrong ? "mc-shake opacity-40" : ""}`}
                    style={{ borderBottom: `6px solid ${lesson.color}` }}
                  >
                    <span className="font-display block py-4 text-2xl font-extrabold">
                      {s}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className={`mt-4 grid gap-3 ${question.type === "listen" || question.type === "count" ? "grid-cols-3" : isDesktop ? "grid-cols-3" : "grid-cols-1"}`}>
              {question.options.map((opt) => {
                const isWrong = wrongKeys.has(opt.key);
                return (
                  <button
                    key={opt.key}
                    type="button"
                    disabled={isWrong || celebrate > 0}
                    onClick={() => answer(question, opt)}
                    aria-label={
                      question.type === "listen"
                        ? `Chọn hình ${opt.vi}`
                        : question.type === "count"
                          ? `Chọn số ${opt.en}`
                          : `Chọn từ ${opt.en}`
                    }
                    className={`rounded-[22px] bg-white shadow-md active:scale-[0.97] ${isWrong ? "mc-shake opacity-40" : ""}`}
                    style={{ borderBottom: `6px solid ${lesson.color}` }}
                  >
                    {question.type === "listen" ? (
                      <span className="block py-5 text-6xl" aria-hidden>{opt.emoji}</span>
                    ) : (
                      <span className="font-display block py-4 text-3xl font-extrabold">
                        {opt.en} <span aria-hidden>{opt.emoji}</span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          {missedThisQ && celebrate === 0 && (
            <p className="mc-pop mt-4 text-center text-lg font-bold text-[var(--accent)]">
              Gần đúng rồi! Minh Châu thử lại nhé 💪
            </p>
          )}
        </div>
      )}

      {phase === "done" && (
        <div className="mt-6 text-center">
          <div className="flex justify-center gap-2" aria-label={`Con được ${starsEarned} sao`}>
            {[1, 2, 3].map((s) =>
              s <= starsEarned ? (
                <span
                  key={s}
                  className="mc-star-burst inline-block text-6xl"
                  style={{ animationDelay: `${(s - 1) * 0.18}s` }}
                  aria-hidden
                >
                  ⭐
                </span>
              ) : (
                <span key={s} className="inline-block text-6xl opacity-25 grayscale" aria-hidden>
                  ⭐
                </span>
              ),
            )}
          </div>
          <h2 className="font-display mt-3 text-3xl font-extrabold">
            Minh Châu hoàn thành bài học rồi!
          </h2>
          <p className="mt-1 text-lg text-[var(--dim)]">
            Đúng ngay lần đầu {firstTryCorrect}/{questions.length} câu · Con nhận được sticker{" "}
            <b>{lesson.stickerEmoji} {lesson.stickerName}</b>
          </p>
          {practiceScore != null && (
            <p className="mt-1 text-lg font-bold">
              🎤 Điểm đọc lại của con: {practiceScore}/100
              {bestSpeechScore != null && practiceScore < bestSpeechScore
                ? ` (kỷ lục: ${bestSpeechScore}/100)`
                : ""}
            </p>
          )}

          {!giftOpened ? (
            <div className="mt-8">
              <button
                type="button"
                onClick={() => {
                  setGiftOpened(true);
                  setConfettiKey((k) => k + 1);
                  playAudio("vipraise2", PRAISE_TEXTS[1], "vi-VN");
                }}
                aria-label="Mở hộp quà cuối bài"
                className="mc-gift-shake inline-block text-[120px] leading-none"
              >
                🎁
              </button>
              <p className="font-display mt-2 text-xl font-bold text-[var(--accent)]">
                Chạm vào hộp quà để mở nhé!
              </p>
            </div>
          ) : (
            <div className="mc-pop mx-auto mt-8 max-w-sm rounded-[28px] bg-white p-5 shadow-xl">
              {gift ? (
                <>
                  <img
                    src={GIFT_IMAGES[gift.key]}
                    alt={`Phần quà: ${gift.name}`}
                    className="mx-auto w-56 rounded-3xl"
                  />
                  <p className="font-display mt-3 text-2xl font-extrabold">{gift.name}</p>
                  <p className="text-[var(--dim)]">
                    Phần quà khích lệ cho Minh Châu chăm học! 🎉
                  </p>
                </>
              ) : (
                <>
                  <div className="text-[110px] leading-none" aria-hidden>{lesson.stickerEmoji}</div>
                  <p className="font-display mt-2 text-2xl font-extrabold">{lesson.stickerName}</p>
                  <p className="text-[var(--dim)]">Sticker mới đã vào bộ sưu tập của con!</p>
                </>
              )}
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setPhase("brain")}
              aria-label="Chơi thử thách trí tuệ của bài này và học từ mở rộng"
              className="font-display w-full rounded-full py-4 text-2xl font-extrabold text-white shadow-lg active:scale-[0.98]"
              style={{ background: "linear-gradient(90deg, #7B61FF, var(--accent))" }}
            >
              🧠 Thử thách trí tuệ + Con có biết? ▶
            </button>
            <button
              type="button"
              onClick={onPlayGame}
              aria-label="Chơi Game Khám Phá 3D — phần thưởng sau khi học xong bài học"
              className="font-display w-full rounded-full py-4 text-2xl font-extrabold text-white shadow-lg active:scale-[0.98]"
              style={{ background: "linear-gradient(90deg, var(--sky), var(--mint))" }}
            >
              🎁 Chơi game khám phá (phần thưởng) ▶
            </button>
            <button
              type="button"
              onClick={onBack}
              className="font-display w-full rounded-full bg-[var(--accent)] py-4 text-2xl font-extrabold text-white shadow-lg active:scale-[0.98]"
            >
              🏠 Về trang chủ
            </button>
            <button
              type="button"
              onClick={onReplay}
              className="font-display w-full rounded-full bg-white py-3 text-xl font-bold shadow-md active:scale-[0.98]"
            >
              🔁 Học lại bài này
            </button>
          </div>
        </div>
      )}

      {/* Lớp chúc mừng khi trả lời đúng */}
      {celebrate > 0 && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/25" aria-live="polite">
          <div className="mc-pop mx-6 rounded-[32px] bg-white px-8 py-7 text-center shadow-2xl">
            <div className="mc-wiggle text-[92px] leading-none" aria-hidden>{cheerEmoji}</div>
            <p className="font-display mt-2 text-3xl font-extrabold text-[var(--accent)]">{praiseText}</p>
            <div className="mt-1 text-3xl" aria-hidden>⭐⭐⭐</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ================= BỘ SƯU TẬP =================
function CollectionScreen({
  rewards,
  onBack,
  displayMode = "phone",
}: {
  rewards: Map<string, string>;
  onBack: () => void;
  displayMode?: DisplayMode;
}) {
  const isDesktop = displayMode === "desktop";
  return (
    <div className={isDesktop ? "mx-auto w-full max-w-5xl px-4 pb-10 sm:px-6 lg:px-8" : "mx-auto w-full max-w-2xl px-4 pb-10"}>
      <div className="flex items-center gap-3 pt-4">
        <button
          type="button"
          onClick={onBack}
          aria-label="Quay lại trang chủ"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-2xl shadow-md"
        >
          ←
        </button>
        <h2 className="font-display text-2xl font-extrabold">🏆 Bộ sưu tập của Minh Châu</h2>
      </div>

      <h3 className="font-display mt-6 text-xl font-bold">
        Sticker đã nhận ({ALL_STICKERS.filter((s) => rewards.has(s.id)).length}/{ALL_STICKERS.length})
      </h3>
      <div className={isDesktop ? "mt-3 grid grid-cols-4 gap-3 sm:grid-cols-5 lg:grid-cols-6" : "mt-3 grid grid-cols-3 gap-3"}>
        {ALL_STICKERS.map((s) => {
          const earned = rewards.has(s.id);
          return (
            <div
              key={s.id}
              className="rounded-[22px] bg-white p-3 text-center shadow-md"
              style={earned ? { borderBottom: "6px solid var(--sun)" } : undefined}
            >
              <div className={`text-5xl ${earned ? "mc-bounce-soft" : "opacity-25 grayscale"}`} aria-hidden>
                {earned ? s.emoji : "❔"}
              </div>
              <p className="font-display mt-1.5 text-sm leading-tight font-bold">
                {earned ? s.name : "Chưa mở khóa"}
              </p>
              <p className="mt-0.5 text-xs text-[var(--dim)]">{s.how}</p>
            </div>
          );
        })}
      </div>

      <h3 className="font-display mt-8 text-xl font-bold">🎁 Kệ quà khích lệ</h3>
      <div className={isDesktop ? "mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4" : "mt-3 grid grid-cols-2 gap-3"}>
        {GIFTS.map((g) => {
          const earned = UNITS.some(
            (u) => giftForUnit(u.num).key === g.key && rewards.has(`gift-unit${u.num}`),
          );
          return (
            <div key={g.key} className="rounded-[22px] bg-white p-3 text-center shadow-md">
              <img
                src={GIFT_IMAGES[g.key]}
                alt={earned ? `Phần quà: ${g.name}` : "Phần quà chưa mở khóa"}
                className={`mx-auto w-full rounded-2xl ${earned ? "" : "opacity-30 grayscale"}`}
              />
              <p className="font-display mt-2 text-base leading-tight font-bold">
                {earned ? g.name : "🔒 Hoàn thành bài học để nhận quà"}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ================= TRANG CHỦ =================
export function App() {
  const [view, setView] = useState<
    | { kind: "home" }
    | { kind: "lesson"; lesson: LessonData }
    | { kind: "collection" }
    | { kind: "game" }
  >({ kind: "home" });
  const [session, setSession] = useState(0);
  const [displayMode, setDisplayMode] = useState<DisplayMode>(() => {
    try {
      const saved = localStorage.getItem("mc-display-mode");
      if (saved === "phone" || saved === "desktop") return saved;
    } catch {
      /* bỏ qua */
    }
    if (typeof window !== "undefined") {
      return window.innerWidth >= 1024 ? "desktop" : "phone";
    }
    return "phone";
  });
  useEffect(() => {
    try {
      localStorage.setItem("mc-display-mode", displayMode);
    } catch {
      /* bỏ qua */
    }
  }, [displayMode]);
  const isDesktop = displayMode === "desktop";

  const state = useQuery({ queryKey: ["state"], queryFn: () => api.getState({}) });
  const audioHint = useAudioHint();

  const progressMap = useMemo(() => {
    const m = new Map<string, { stars: number; completions: number }>();
    for (const p of state.data?.progress ?? []) m.set(p.lessonId, p);
    return m;
  }, [state.data]);
  const rewardsMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of state.data?.rewards ?? []) m.set(r.rewardId, r.earnedAt);
    return m;
  }, [state.data]);
  const speechMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of state.data?.speechScores ?? []) m.set(s.lessonId, s.bestScore);
    return m;
  }, [state.data]);

  const completedUnitIds = useMemo(
    () => new Set(UNITS.filter((u) => (progressMap.get(u.id)?.completions ?? 0) > 0).map((u) => u.id)),
    [progressMap],
  );
  const totalStars = useMemo(
    () => [...progressMap.values()].reduce((sum, p) => sum + p.stars, 0),
    [progressMap],
  );
  const nextUnit = UNITS.find((u) => !completedUnitIds.has(u.id)) ?? UNITS[0]!;

  if (view.kind === "lesson") {
    return (
      <ViewShell mode={displayMode} onModeChange={setDisplayMode}>
        <LessonScreen
          key={`${view.lesson.id}-${session}`}
          lesson={view.lesson}
          completedUnitIds={completedUnitIds}
          bestSpeechScore={speechMap.get(view.lesson.id) ?? null}
          onBack={() => setView({ kind: "home" })}
          onReplay={() => setSession((s) => s + 1)}
          onPlayGame={() => setView({ kind: "game" })}
          displayMode={displayMode}
        />
      </ViewShell>
    );
  }
  if (view.kind === "collection") {
    return (
      <ViewShell mode={displayMode} onModeChange={setDisplayMode}>
        <CollectionScreen rewards={rewardsMap} onBack={() => setView({ kind: "home" })} displayMode={displayMode} />
      </ViewShell>
    );
  }
  if (view.kind === "game") {
    return (
      <ViewShell mode={displayMode} onModeChange={setDisplayMode}>
        <ExploreGame onBack={() => setView({ kind: "home" })} />
      </ViewShell>
    );
  }

  return (
    <ViewShell mode={displayMode} onModeChange={setDisplayMode}>
      <main className={isDesktop ? "mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6 lg:px-8" : "mx-auto w-full max-w-2xl px-4 pb-10"}>
        <AudioHintBar show={audioHint.hint} onTap={audioHint.dismiss} />
        {/* Hero chào Minh Châu — máy tính: rộng, chữ lớn, linh vật lớn; điện thoại: gọn */}
        <section className="mt-4 overflow-hidden rounded-[32px] bg-white shadow-lg">
          <div className={isDesktop ? "flex items-center gap-6 p-7 pb-0 lg:p-9 lg:pb-0" : "flex items-center gap-3 p-5 pb-0"}>
            <div className="min-w-0 flex-1">
              <p className={isDesktop ? "font-display text-4xl leading-tight font-extrabold lg:text-5xl" : "font-display text-3xl leading-tight font-extrabold"}>
                Xin chào, <span className="text-[var(--accent)]">Minh Châu</span>! 👋
              </p>
              <p className={isDesktop ? "mt-2 text-lg font-semibold text-[var(--dim)]" : "mt-1 font-semibold text-[var(--dim)]"}>
                Cùng học Tiếng Anh lớp 1 thật vui nhé!
                {isDesktop ? " — Giao diện máy tính: xem được nhiều bài cùng lúc, chữ to rõ cho ba mẹ ngồi cạnh con." : ""}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-[var(--sun)] px-3.5 py-1.5 font-display text-base font-bold">
                  ⭐ {totalStars} sao
                </span>
                <span className="rounded-full bg-[#D8F5F0] px-3.5 py-1.5 font-display text-base font-bold">
                  📚 Đã học {completedUnitIds.size}/16 bài
                </span>
                <button
                  type="button"
                  onClick={() => playAudio("hello", "Hello, Minh Chau! Let's learn English!")}
                  aria-label="Nghe cô giáo chào Minh Châu"
                  className="rounded-full bg-[#FFE3EE] px-3.5 py-1.5 font-display text-base font-bold active:scale-95"
                >
                  🔊 Cô chào con
                </button>
              </div>
            </div>
            <img
              src={mascotImg}
              alt="Linh vật bé gái cầm sách, vẫy tay chào"
              className={isDesktop ? "mc-bounce-soft w-44 shrink-0 rounded-3xl lg:w-56" : "mc-bounce-soft w-32 shrink-0 rounded-3xl sm:w-40"}
            />
          </div>
          <button
            type="button"
            onClick={() => setView({ kind: "lesson", lesson: unitLesson(nextUnit) })}
            className="font-display mt-4 block w-full bg-[var(--accent)] py-4 text-center text-2xl font-extrabold text-white active:scale-[0.99]"
          >
            ▶ Học tiếp: Unit {nextUnit.num} · {nextUnit.titleEn}
          </button>
        </section>

        {/* Nhiệm vụ hôm nay + Đường đua vương miện — mục tiêu rõ ràng để bé ham học */}
        <section
          className="mt-4 rounded-[28px] bg-white p-5 shadow-lg"
          style={{ borderBottom: "7px solid var(--mint)" }}
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-4xl" aria-hidden>🎯</span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-xl font-extrabold">Nhiệm vụ hôm nay</p>
              {completedUnitIds.size < UNITS.length ? (
                <p className="font-semibold text-[var(--dim)]">
                  Học <b>Unit {nextUnit.num} · {nextUnit.titleEn}</b> để nhận sticker{" "}
                  {nextUnit.stickerEmoji} {nextUnit.stickerName} nhé!
                </p>
              ) : (
                <p className="font-semibold text-[var(--dim)]">
                  Con đã học hết 16 Unit rồi! Hôm nay ôn lại một bài bất kỳ, giữ
                  chuỗi lửa 🔥 và phá kỷ lục điểm đọc của con nhé!
                </p>
              )}
            </div>
            {completedUnitIds.size < UNITS.length && (
              <button
                type="button"
                onClick={() => setView({ kind: "lesson", lesson: unitLesson(nextUnit) })}
                aria-label={`Làm nhiệm vụ hôm nay: học Unit ${nextUnit.num}`}
                className={`font-display rounded-full bg-[var(--mint)] px-5 py-2.5 text-lg font-extrabold text-white shadow-md active:scale-95 ${isDesktop ? "" : "w-full"}`}
              >
                Làm ngay ▶
              </button>
            )}
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between text-sm font-bold text-[var(--dim)]">
              <span>🏁 Đường đua tới Vương miện</span>
              <span>
                Đã qua {completedUnitIds.size}/16 chặng · {totalStars} ⭐
              </span>
            </div>
            <div className="relative mt-2 h-5 rounded-full bg-[#F0D9CE]">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.max(3, (completedUnitIds.size / UNITS.length) * 100)}%`,
                  background: "linear-gradient(90deg, var(--sun), var(--accent))",
                }}
              />
              {[
                { at: 1, emoji: "🌟", label: "Chặng 1: sticker Bước Đầu Tiên" },
                { at: 8, emoji: "🌈", label: "Chặng 8: sticker Nửa Chặng Đường" },
                { at: 16, emoji: "👑", label: "Chặng 16: Vương miện Nữ Hoàng Tiếng Anh" },
              ].map((m) => (
                <span
                  key={m.at}
                  className={`absolute -top-2 text-2xl ${completedUnitIds.size >= m.at ? "" : "opacity-40 grayscale"}`}
                  style={{ left: `calc(${(m.at / UNITS.length) * 100}% - 12px)` }}
                  role="img"
                  aria-label={m.label}
                >
                  {m.emoji}
                </span>
              ))}
            </div>
            <p className="mt-2.5 text-sm font-semibold text-[var(--dim)]">
              Qua chặng 1 nhận 🌟 Bước Đầu Tiên · chặng 8 nhận 🌈 Nửa Chặng Đường ·
              về đích 16 Unit nhận 👑 Nữ Hoàng Tiếng Anh!
            </p>
          </div>
        </section>

        <p className="mt-3 text-center text-sm font-semibold text-[var(--dim)]">
          Theo sách giáo khoa <b>Tiếng Anh 1 – Global Success</b> · NXB Giáo dục Việt Nam · Giọng đọc cô giáo trẻ 🔊
        </p>

        {/* 16 Unit SGK + Fun time/Review xen đúng vị trí như trong sách */}
        <h2 className="font-display mt-7 text-2xl font-extrabold">📚 Bài học trong sách giáo khoa</h2>
        <p className="mt-0.5 text-sm font-semibold text-[var(--dim)]">
          {isDesktop ? "Chế độ máy tính: 3–4 bài trên một hàng, nhìn bao quát cả chương trình." : "Chế độ điện thoại: 2 bài trên một hàng, nút to dễ chạm cho bé."}
        </p>
        <div className={isDesktop ? "mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4" : "mt-3 grid grid-cols-2 gap-3"}>
          {UNITS.flatMap((u) => {
            const p = progressMap.get(u.id);
            const done = (p?.completions ?? 0) > 0;
            const unitCard = (
              <button
                key={u.id}
                type="button"
                onClick={() => setView({ kind: "lesson", lesson: unitLesson(u) })}
                aria-label={`Học Unit ${u.num}: ${u.titleEn} – ${u.titleVi}`}
                className="relative rounded-[24px] bg-white p-4 text-left shadow-md active:scale-[0.98]"
                style={{ borderBottom: `7px solid ${u.color}` }}
              >
                <div className="flex items-start justify-between">
                  <span
                    className="font-display rounded-full px-2.5 py-0.5 text-sm font-extrabold text-white"
                    style={{ background: u.color }}
                  >
                    Unit {u.num}
                  </span>
                  <span className="text-4xl" aria-hidden>{u.scene}</span>
                </div>
                <p className="font-display mt-2 leading-tight text-lg font-bold">{u.titleEn}</p>
                <p className="text-sm text-[var(--dim)]">{u.titleVi}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="rounded-full bg-[var(--space-surface-alt)] px-2 py-0.5 text-xs font-extrabold">
                    Chữ {u.letter} · {u.sound}
                  </span>
                  <span className="text-sm" aria-label={done ? `Đã đạt ${p?.stars ?? 0} sao` : "Chưa học"}>
                    {done ? "⭐".repeat(p?.stars ?? 0) + " ✅" : "▶️"}
                    {speechMap.has(u.id) ? ` 🎤${speechMap.get(u.id)}` : ""}
                  </span>
                </div>
              </button>
            );
            const specialCards = SPECIALS.filter((s) => s.afterUnit === u.num).map(
              (s) => {
                const sp = progressMap.get(s.id);
                const sDone = (sp?.completions ?? 0) > 0;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setView({ kind: "lesson", lesson: specialLesson(s) })}
                    aria-label={`${s.titleEn}: ${s.titleVi}`}
                    className="relative rounded-[24px] p-4 text-left shadow-md active:scale-[0.98]"
                    style={{
                      background: s.kind === "funtime" ? "#FFF0F7" : "#F0EEFF",
                      borderBottom: `7px solid ${s.color}`,
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <span
                        className="font-display rounded-full px-2.5 py-0.5 text-sm font-extrabold text-white"
                        style={{ background: s.color }}
                      >
                        {s.kind === "funtime" ? `Fun time ${s.num}` : `Review ${s.num}`}
                      </span>
                      <span className="text-4xl" aria-hidden>{s.emoji}</span>
                    </div>
                    <p className="font-display mt-2 leading-tight text-lg font-bold">
                      {s.kind === "funtime" ? "Giờ vui chơi" : "Ôn tập & truyện Phil and Sue"}
                    </p>
                    <p className="text-sm text-[var(--dim)]">{s.titleVi}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="rounded-full bg-white px-2 py-0.5 text-xs font-extrabold">
                        📖 Trong sách giáo khoa
                      </span>
                      <span className="text-sm" aria-label={sDone ? `Đã đạt ${sp?.stars ?? 0} sao` : "Chưa học"}>
                        {sDone ? "⭐".repeat(sp?.stars ?? 0) + " ✅" : "▶️"}
                        {speechMap.has(s.id) ? ` 🎤${speechMap.get(s.id)}` : ""}
                      </span>
                    </div>
                  </button>
                );
              },
            );
            return [unitCard, ...specialCards];
          })}
        </div>

        {/* Học thêm */}
        <h2 className="font-display mt-8 text-2xl font-extrabold">🌈 Học thêm nếu con thích</h2>
        <p className="mt-0.5 text-sm font-semibold text-[var(--dim)]">
          Kiến thức mở rộng ngoài sách giáo khoa — học lúc nào cũng được!
        </p>
        <div className={isDesktop ? "mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4" : "mt-3 grid grid-cols-2 gap-3"}>
          {EXTRA_SETS.map((s) => {
            const p = progressMap.get(s.id);
            const done = (p?.completions ?? 0) > 0;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setView({ kind: "lesson", lesson: extraLesson(s) })}
                aria-label={`Học thêm: ${s.titleVi}`}
                className="rounded-[24px] bg-white p-4 text-left shadow-md active:scale-[0.98]"
                style={{ borderBottom: `7px solid ${s.color}` }}
              >
                <span className="text-4xl" aria-hidden>{s.emoji}</span>
                <p className="font-display mt-1.5 leading-tight text-lg font-bold">{s.titleEn}</p>
                <p className="text-sm text-[var(--dim)]">{s.titleVi} · {s.words.length} từ</p>
                <p className="mt-1 text-sm">{done ? "⭐".repeat(p?.stars ?? 0) + " ✅" : "▶️"}</p>
              </button>
            );
          })}
        </div>

        {/* Bộ sưu tập */}
        <button
          type="button"
          onClick={() => setView({ kind: "collection" })}
          aria-label="Mở bộ sưu tập sticker và quà của Minh Châu"
          className="mt-8 w-full rounded-[28px] bg-white p-5 text-left shadow-lg active:scale-[0.99]"
          style={{ borderBottom: "7px solid var(--sun)" }}
        >
          <div className="flex items-center gap-4">
            <span className="text-5xl" aria-hidden>🏆</span>
            <div>
              <p className="font-display text-2xl font-extrabold">Bộ sưu tập của Minh Châu</p>
              <p className="font-semibold text-[var(--dim)]">
                Đã nhận {rewardsMap.size} sticker & quà · Chạm để xem tất cả!
              </p>
            </div>
            <span className="ml-auto text-3xl" aria-hidden>›</span>
          </div>
          <div className="mt-3 flex gap-1.5 text-2xl" aria-hidden>
            {ALL_STICKERS.slice(0, 10).map((s) => (
              <span key={s.id} className={rewardsMap.has(s.id) ? "" : "opacity-25 grayscale"}>
                {s.emoji}
              </span>
            ))}
          </div>
        </button>

        {/* Game Khám Phá 3D — chọn nhân vật, đi trong thành phố / đồng quê, làm nhiệm vụ tìm đồ vật */}
        <button
          type="button"
          onClick={() => setView({ kind: "game" })}
          aria-label="Mở Game Khám Phá 3D — phần thưởng sau khi học xong: chọn nhân vật, khám phá thành phố, đồng quê, bãi biển và sở thú, làm nhiệm vụ"
          className="mt-4 w-full rounded-[28px] bg-white p-5 text-left shadow-lg active:scale-[0.99]"
          style={{ borderBottom: "7px solid var(--sky)" }}
        >
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <span className="text-5xl" aria-hidden>🎮</span>
            <p className="font-display min-w-[150px] flex-1 text-2xl font-extrabold">Phần thưởng: Chơi game sau khi học xong 🎁</p>
            <span className="font-display shrink-0 rounded-full bg-[var(--sky)] px-4 py-2 text-base font-extrabold text-white shadow">
              Chơi ngay ▶
            </span>
            <p className="w-full font-semibold text-[var(--dim)]">
              Học xong bài là được chơi game nhé! Chọn nhân vật, đi dạo trong
              Thành phố 🏙️, Đồng quê 🌾, Bãi biển 🏖️ và Sở thú 🦁, bấm vào đồ vật
              để nghe tên tiếng Anh, luyện nói theo cô, làm 7 nhiệm vụ mỗi lượt —
              xong một nơi là tự đi tiếp nơi mới đẹp hơn!
            </p>
          </div>
          <div className="mt-3 flex gap-1.5 text-2xl" aria-hidden>
            <span>👧</span><span>👦</span><span>🐰</span><span>🐱</span>
            <span className="ml-2">🚌</span><span>🚗</span><span>🐶</span><span>🦆</span><span>🐴</span><span>🍎</span>
          </div>
        </button>

        <p className="mt-6 text-center text-xs font-semibold text-[var(--dim)]">
          Hoàn thành mỗi bài học để nhận sticker và mở quà bất ngờ cuối bài 🎁
        </p>
      </main>
    </ViewShell>
  );
}
