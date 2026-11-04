// Nội dung bài học: 16 Unit bám sát SGK Tiếng Anh 1 – Global Success
// (NXB Giáo dục Việt Nam, bộ sách Bộ GD&ĐT phê duyệt) + mục mở rộng riêng.
// Âm thanh: AUDIO[key] trong audioMap.ts — giọng nữ trẻ ghi sẵn.

export interface Word {
  key: string; // khóa file audio
  en: string;
  ipa: string;
  vi: string;
  emoji: string;
}

export interface Unit {
  id: string; // unit1..unit16
  num: number;
  titleEn: string;
  titleVi: string;
  letter: string;
  sound: string;
  scene: string; // emoji khung cảnh
  color: string; // màu chủ đạo của Unit
  words: Word[];
  pattern: string;
  patternVi: string;
  patternAudio: string;
  /** Dòng mẫu câu thứ hai (hội thoại hỏi–đáp trong sách), nếu có. */
  pattern2?: string;
  patternVi2?: string;
  patternAudio2?: string;
  phonicsAudio: string;
  stickerEmoji: string;
  stickerName: string;
}

const w = (key: string, en: string, ipa: string, vi: string, emoji: string): Word => ({
  key,
  en,
  ipa,
  vi,
  emoji,
});

export const UNITS: Unit[] = [
  {
    id: "unit1", num: 1, titleEn: "In the school playground", titleVi: "Ở sân trường",
    letter: "Bb", sound: "/b/", scene: "🛝", color: "#FF5D8F",
    words: [
      w("ball", "ball", "/bɔːl/", "quả bóng", "⚽"),
      w("bike", "bike", "/baɪk/", "xe đạp", "🚲"),
      w("book", "book", "/bʊk/", "quyển sách", "📖"),
      w("bill", "Bill", "/bɪl/", "bạn Bill", "🧒"),
    ],
    pattern: "Hi, I'm Bill.", patternVi: "Chào, tớ là Bill.",
    patternAudio: "pat1", phonicsAudio: "ph1",
    pattern2: "Bye, Bill.", patternVi2: "Tạm biệt, Bill.",
    patternAudio2: "pat1b",
    stickerEmoji: "⭐", stickerName: "Ngôi Sao Sân Trường",
  },
  {
    id: "unit2", num: 2, titleEn: "In the dining room", titleVi: "Trong phòng ăn",
    letter: "Cc", sound: "/k/", scene: "🍽️", color: "#FF9F45",
    words: [
      w("cake", "cake", "/keɪk/", "bánh ngọt", "🎂"),
      w("car", "car", "/kɑː/", "xe ô tô", "🚗"),
      w("cat", "cat", "/kæt/", "con mèo", "🐱"),
      w("cup", "cup", "/kʌp/", "cái tách", "☕"),
    ],
    pattern: "I have a car.", patternVi: "Tớ có một chiếc ô tô.",
    patternAudio: "pat2", phonicsAudio: "ph2",
    stickerEmoji: "🍰", stickerName: "Đầu Bếp Nhí",
  },
  {
    id: "unit3", num: 3, titleEn: "At the street market", titleVi: "Ở chợ",
    letter: "Aa", sound: "/æ/", scene: "🛒", color: "#2EC4B6",
    words: [
      w("apple", "apple", "/ˈæpl/", "quả táo", "🍎"),
      w("bag", "bag", "/bæɡ/", "cái cặp, túi", "🎒"),
      w("can", "can", "/kæn/", "cái lon", "🥫"),
      w("hat", "hat", "/hæt/", "cái mũ", "👒"),
    ],
    pattern: "This is my bag.", patternVi: "Đây là cặp của tớ.",
    patternAudio: "pat3", phonicsAudio: "ph3",
    stickerEmoji: "🍎", stickerName: "Người Bạn Chợ Vui",
  },
  {
    id: "unit4", num: 4, titleEn: "In the bedroom", titleVi: "Trong phòng ngủ",
    letter: "Dd", sound: "/d/", scene: "🛏️", color: "#4CC9F0",
    words: [
      w("desk", "desk", "/desk/", "bàn học", "📚✏️"),
      w("dog", "dog", "/dɒɡ/", "con chó", "🐶"),
      w("door", "door", "/dɔː/", "cánh cửa", "🚪"),
      w("duck", "duck", "/dʌk/", "con vịt", "🦆"),
    ],
    pattern: "This is a dog.", patternVi: "Đây là một chú chó.",
    patternAudio: "pat4", phonicsAudio: "ph4",
    stickerEmoji: "🐶", stickerName: "Bạn Của Cún Con",
  },
  {
    id: "unit5", num: 5, titleEn: "At the fish and chip shop", titleVi: "Ở quán cá và khoai chiên",
    letter: "Ii", sound: "/ɪ/", scene: "🐟", color: "#FFC53D",
    words: [
      w("chicken", "chicken", "/ˈtʃɪkɪn/", "thịt gà, con gà", "🍗"),
      w("chips", "chips", "/tʃɪps/", "khoai tây chiên", "🍟"),
      w("fish", "fish", "/fɪʃ/", "con cá, món cá", "🐟"),
      w("milk", "milk", "/mɪlk/", "sữa", "🥛"),
    ],
    pattern: "I like milk.", patternVi: "Tớ thích sữa.",
    patternAudio: "pat5", phonicsAudio: "ph5",
    stickerEmoji: "🐟", stickerName: "Thực Khách Sành Ăn",
  },
  {
    id: "unit6", num: 6, titleEn: "In the classroom", titleVi: "Trong lớp học",
    letter: "Ee", sound: "/e/", scene: "🏫", color: "#FF5D8F",
    words: [
      w("bell", "bell", "/bel/", "cái chuông", "🔔"),
      w("pen", "pen", "/pen/", "cây bút", "🖊️"),
      w("pencil", "pencil", "/ˈpensl/", "bút chì", "✏️"),
      w("red", "red", "/red/", "màu đỏ", "🟥"),
    ],
    pattern: "It's a red pen.", patternVi: "Đó là một cây bút đỏ.",
    patternAudio: "pat6", phonicsAudio: "ph6",
    stickerEmoji: "✏️", stickerName: "Học Sinh Chăm Chỉ",
  },
  {
    id: "unit7", num: 7, titleEn: "In the garden", titleVi: "Trong khu vườn",
    letter: "Gg", sound: "/g/", scene: "🌻", color: "#2EC4B6",
    words: [
      w("garden", "garden", "/ˈɡɑːdn/", "khu vườn", "🌷"),
      w("gate", "gate", "/ɡeɪt/", "cổng", "🏡"),
      w("girl", "girl", "/ɡɜːl/", "bé gái", "👧"),
      w("goat", "goat", "/ɡəʊt/", "con dê", "🐐"),
    ],
    pattern: "There's a garden.", patternVi: "Có một khu vườn.",
    patternAudio: "pat7", phonicsAudio: "ph7",
    stickerEmoji: "🌻", stickerName: "Người Làm Vườn Nhí",
  },
  {
    id: "unit8", num: 8, titleEn: "In the park", titleVi: "Ở công viên",
    letter: "Hh", sound: "/h/", scene: "🌳", color: "#FF9F45",
    words: [
      w("hair", "hair", "/heə/", "tóc", "💇"),
      w("hand", "hand", "/hænd/", "bàn tay", "✋"),
      w("head", "head", "/hed/", "cái đầu", "👤"),
      w("horse", "horse", "/hɔːs/", "con ngựa", "🐴"),
    ],
    pattern: "Touch your hair.", patternVi: "Hãy chạm vào tóc của con!",
    patternAudio: "pat8", phonicsAudio: "ph8",
    stickerEmoji: "🐴", stickerName: "Bạn Của Ngựa Con",
  },
  {
    id: "unit9", num: 9, titleEn: "In the shop", titleVi: "Ở cửa hàng",
    letter: "Oo", sound: "/ɒ/", scene: "🛍️", color: "#4CC9F0",
    words: [
      w("clocks", "clocks", "/klɒks/", "những chiếc đồng hồ", "🕐"),
      w("locks", "locks", "/lɒks/", "những ổ khóa", "🔒"),
      w("mops", "mops", "/mɒps/", "những cây lau nhà", "🧹"),
      w("pots", "pots", "/pɒts/", "những cái nồi", "🍲"),
      w("one", "one", "/wʌn/", "số 1", "1️⃣"),
      w("two", "two", "/tuː/", "số 2", "2️⃣"),
      w("three", "three", "/θriː/", "số 3", "3️⃣"),
      w("four", "four", "/fɔː/", "số 4", "4️⃣"),
      w("five", "five", "/faɪv/", "số 5", "5️⃣"),
    ],
    pattern: "How many clocks?", patternVi: "Có mấy chiếc đồng hồ?",
    patternAudio: "pat9", phonicsAudio: "ph9",
    pattern2: "Two.", patternVi2: "Hai chiếc.",
    patternAudio2: "pat9b",
    stickerEmoji: "🔢", stickerName: "Bậc Thầy Đếm Số",
  },
  {
    id: "unit10", num: 10, titleEn: "At the zoo", titleVi: "Ở sở thú",
    letter: "Mm", sound: "/m/", scene: "🦒", color: "#FFC53D",
    words: [
      w("mango", "mango", "/ˈmæŋɡəʊ/", "quả xoài", "🥭"),
      w("monkey", "monkey", "/ˈmʌŋki/", "con khỉ", "🐵"),
      w("mother", "mother", "/ˈmʌðə/", "mẹ", "👩"),
      w("mouse", "mouse", "/maʊs/", "con chuột", "🐭"),
    ],
    pattern: "That's a monkey.", patternVi: "Đó là một con khỉ.",
    patternAudio: "pat10", phonicsAudio: "ph10",
    stickerEmoji: "🐵", stickerName: "Nhà Khám Phá Sở Thú",
  },
  {
    id: "unit11", num: 11, titleEn: "At the bus stop", titleVi: "Ở trạm xe buýt",
    letter: "Uu", sound: "/ʌ/", scene: "🚌", color: "#FF5D8F",
    words: [
      w("bus", "bus", "/bʌs/", "xe buýt", "🚌"),
      w("run", "run", "/rʌn/", "chạy", "🏃"),
      w("sun", "sun", "/sʌn/", "mặt trời", "☀️"),
      w("truck", "truck", "/trʌk/", "xe tải", "🚚"),
    ],
    pattern: "She's running.", patternVi: "Bạn gái ấy đang chạy.",
    patternAudio: "pat11", phonicsAudio: "ph11",
    pattern2: "He's running.", patternVi2: "Bạn trai ấy đang chạy.",
    patternAudio2: "pat11b",
    stickerEmoji: "🚌", stickerName: "Lữ Khách Nhí",
  },
  {
    id: "unit12", num: 12, titleEn: "At the lake", titleVi: "Ở bên hồ",
    letter: "Ll", sound: "/l/", scene: "🛶", color: "#2EC4B6",
    words: [
      w("lake", "lake", "/leɪk/", "cái hồ", "🏞️"),
      w("leaf", "leaf", "/liːf/", "chiếc lá", "🍃"),
      w("lemons", "lemons", "/ˈlemənz/", "những quả chanh", "🍋"),
    ],
    pattern: "Look at the lemons.", patternVi: "Hãy nhìn những quả chanh kia!",
    patternAudio: "pat12", phonicsAudio: "ph12",
    stickerEmoji: "🍋", stickerName: "Thám Hiểm Hồ Nước",
  },
  {
    id: "unit13", num: 13, titleEn: "In the school canteen", titleVi: "Ở căn tin trường",
    letter: "Nn", sound: "/n/", scene: "🍜", color: "#FF9F45",
    words: [
      w("bananas", "bananas", "/bəˈnɑːnəz/", "những quả chuối", "🍌"),
      w("noodles", "noodles", "/ˈnuːdlz/", "mì", "🍜"),
      w("nuts", "nuts", "/nʌts/", "các loại hạt", "🥜"),
    ],
    pattern: "She's having noodles.", patternVi: "Bạn gái ấy đang ăn mì.",
    patternAudio: "pat13", phonicsAudio: "ph13",
    stickerEmoji: "🍜", stickerName: "Ngôi Sao Căn Tin",
  },
  {
    id: "unit14", num: 14, titleEn: "In the toy shop", titleVi: "Ở tiệm đồ chơi",
    letter: "Tt", sound: "/t/", scene: "🧸", color: "#4CC9F0",
    words: [
      w("teddy", "teddy bear", "/ˈtedi beə/", "gấu bông", "🧸"),
      w("tiger", "tiger", "/ˈtaɪɡə/", "con hổ", "🐯"),
      w("top", "top", "/tɒp/", "con quay", "🪀"),
      w("turtle", "turtle", "/ˈtɜːtl/", "con rùa", "🐢"),
    ],
    pattern: "I can see a tiger.", patternVi: "Tớ nhìn thấy một con hổ.",
    patternAudio: "pat14", phonicsAudio: "ph14",
    stickerEmoji: "🧸", stickerName: "Vua Đồ Chơi",
  },
  {
    id: "unit15", num: 15, titleEn: "At the football match", titleVi: "Ở trận bóng đá",
    letter: "Ff", sound: "/f/", scene: "⚽", color: "#FFC53D",
    words: [
      w("face", "face", "/feɪs/", "khuôn mặt", "😊"),
      w("father", "father", "/ˈfɑːðə/", "bố", "👨"),
      w("foot", "foot", "/fʊt/", "bàn chân", "🦶"),
      w("football", "football", "/ˈfʊtbɔːl/", "bóng đá", "⚽"),
    ],
    pattern: "Point to your hand.", patternVi: "Hãy chỉ vào bàn tay của con!",
    patternAudio: "pat15", phonicsAudio: "ph15",
    stickerEmoji: "⚽", stickerName: "Cầu Thủ Nhí",
  },
  {
    id: "unit16", num: 16, titleEn: "At home", titleVi: "Ở nhà",
    letter: "Ww", sound: "/w/", scene: "🏠", color: "#FF5D8F",
    words: [
      w("wash", "wash", "/wɒʃ/", "rửa", "🧼"),
      w("water", "water", "/ˈwɔːtə/", "nước", "💧"),
      w("window", "window", "/ˈwɪndəʊ/", "cửa sổ", "🪟"),
      w("six", "six", "/sɪks/", "số 6", "6️⃣"),
      w("seven", "seven", "/ˈsevn/", "số 7", "7️⃣"),
      w("eight", "eight", "/eɪt/", "số 8", "8️⃣"),
      w("nine", "nine", "/naɪn/", "số 9", "9️⃣"),
      w("ten", "ten", "/ten/", "số 10", "🔟"),
    ],
    pattern: "How many windows can you see?",
    patternVi: "Con nhìn thấy mấy cửa sổ?",
    patternAudio: "pat16", phonicsAudio: "ph16",
    pattern2: "I can see six.", patternVi2: "Tớ nhìn thấy sáu cửa sổ.",
    patternAudio2: "pat16b",
    stickerEmoji: "🏠", stickerName: "Ngôi Sao Ở Nhà",
  },
];

// ---------- Fun time & Review — đúng vị trí trong sách ----------
// Sách xen 4 Fun time (sau Unit 2, 6, 10, 14) và 4 Review (sau Unit 4, 8, 12, 16).
// Review ôn tập từ vựng + truyện Phil and Sue của đúng các Unit trong sách.
export interface Special {
  id: string;
  kind: "funtime" | "review";
  num: number;
  afterUnit: number; // xuất hiện ngay sau Unit này, đúng thứ tự sách
  titleEn: string;
  titleVi: string;
  emoji: string;
  color: string;
  unitNums: number[]; // các Unit được ôn/vui chơi
  stickerEmoji: string;
  stickerName: string;
}

export const SPECIALS: Special[] = [
  {
    id: "funtime1", kind: "funtime", num: 1, afterUnit: 2,
    titleEn: "Fun time 1", titleVi: "Giờ vui chơi 1 — ôn Unit 1–2",
    emoji: "🎈", color: "#F15BB5", unitNums: [1, 2],
    stickerEmoji: "🎈", stickerName: "Bong Bóng Vui Chơi",
  },
  {
    id: "review1", kind: "review", num: 1, afterUnit: 4,
    titleEn: "Review 1", titleVi: "Ôn tập 1 — Phil and Sue (Unit 1–4)",
    emoji: "📖", color: "#7B61FF", unitNums: [1, 2, 3, 4],
    stickerEmoji: "🏅", stickerName: "Huy Chương Ôn Tập 1",
  },
  {
    id: "funtime2", kind: "funtime", num: 2, afterUnit: 6,
    titleEn: "Fun time 2", titleVi: "Giờ vui chơi 2 — ôn Unit 5–6",
    emoji: "🧩", color: "#F15BB5", unitNums: [5, 6],
    stickerEmoji: "🧩", stickerName: "Mảnh Ghép Vui Chơi",
  },
  {
    id: "review2", kind: "review", num: 2, afterUnit: 8,
    titleEn: "Review 2", titleVi: "Ôn tập 2 — Phil and Sue (Unit 5–8)",
    emoji: "📖", color: "#7B61FF", unitNums: [5, 6, 7, 8],
    stickerEmoji: "🏅", stickerName: "Huy Chương Ôn Tập 2",
  },
  {
    id: "funtime3", kind: "funtime", num: 3, afterUnit: 10,
    titleEn: "Fun time 3", titleVi: "Giờ vui chơi 3 — ôn Unit 9–10",
    emoji: "🎲", color: "#F15BB5", unitNums: [9, 10],
    stickerEmoji: "🎲", stickerName: "Xúc Xắc Vui Chơi",
  },
  {
    id: "review3", kind: "review", num: 3, afterUnit: 12,
    titleEn: "Review 3", titleVi: "Ôn tập 3 — Phil and Sue (Unit 9–12)",
    emoji: "📖", color: "#7B61FF", unitNums: [9, 10, 11, 12],
    stickerEmoji: "🏅", stickerName: "Huy Chương Ôn Tập 3",
  },
  {
    id: "funtime4", kind: "funtime", num: 4, afterUnit: 14,
    titleEn: "Fun time 4", titleVi: "Giờ vui chơi 4 — ôn Unit 13–14",
    emoji: "🎯", color: "#F15BB5", unitNums: [13, 14],
    stickerEmoji: "🎯", stickerName: "Hồng Tâm Vui Chơi",
  },
  {
    id: "review4", kind: "review", num: 4, afterUnit: 16,
    titleEn: "Review 4", titleVi: "Ôn tập 4 — Phil and Sue (Unit 13–16)",
    emoji: "📖", color: "#7B61FF", unitNums: [13, 14, 15, 16],
    stickerEmoji: "🏆", stickerName: "Cúp Ôn Tập Cuối Năm",
  },
];

/** Gộp từ vựng của các Unit cho Fun time / Review (bỏ trùng theo key). */
export function wordsForUnits(unitNums: number[]): Word[] {
  const seen = new Set<string>();
  const out: Word[] = [];
  for (const n of unitNums) {
    const u = UNITS.find((x) => x.num === n);
    if (!u) continue;
    for (const wd of u.words) {
      if (!seen.has(wd.key)) {
        seen.add(wd.key);
        out.push(wd);
      }
    }
  }
  return out;
}

// ---------- Phần mở rộng (ngoài SGK) ----------
export interface ExtraSet {
  id: string;
  titleEn: string;
  titleVi: string;
  emoji: string;
  color: string;
  stickerEmoji: string;
  stickerName: string;
  words: Word[];
}

export const EXTRA_SETS: ExtraSet[] = [
  {
    id: "extra-colors", titleEn: "More colours", titleVi: "Thêm màu sắc",
    emoji: "🎨", color: "#F15BB5", stickerEmoji: "🎨", stickerName: "Họa Sĩ Nhí",
    words: [
      w("x-blue", "blue", "/bluː/", "xanh dương", "🔵"),
      w("x-yellow", "yellow", "/ˈjeləʊ/", "vàng", "🟡"),
      w("x-green", "green", "/ɡriːn/", "xanh lá", "🟢"),
      w("x-pink", "pink", "/pɪŋk/", "hồng", "🩷"),
      w("x-black", "black", "/blæk/", "đen", "⚫"),
      w("x-white", "white", "/waɪt/", "trắng", "⚪"),
    ],
  },
  {
    id: "extra-numbers", titleEn: "Numbers 11–20", titleVi: "Số đếm 11–20",
    emoji: "🔢", color: "#4CC9F0", stickerEmoji: "🔟", stickerName: "Siêu Sao Đếm Số",
    words: [
      w("x-eleven", "eleven", "/ɪˈlevn/", "số 11", "11"),
      w("x-twelve", "twelve", "/twelv/", "số 12", "12"),
      w("x-thirteen", "thirteen", "/ˌθɜːˈtiːn/", "số 13", "13"),
      w("x-fourteen", "fourteen", "/ˌfɔːˈtiːn/", "số 14", "14"),
      w("x-fifteen", "fifteen", "/ˌfɪfˈtiːn/", "số 15", "15"),
      w("x-sixteen", "sixteen", "/ˌsɪksˈtiːn/", "số 16", "16"),
      w("x-seventeen", "seventeen", "/ˌsevnˈtiːn/", "số 17", "17"),
      w("x-eighteen", "eighteen", "/ˌeɪˈtiːn/", "số 18", "18"),
      w("x-nineteen", "nineteen", "/ˌnaɪnˈtiːn/", "số 19", "19"),
      w("x-twenty", "twenty", "/ˈtwenti/", "số 20", "20"),
    ],
  },
  {
    id: "extra-family", titleEn: "My family", titleVi: "Gia đình của bé",
    emoji: "👨‍👩‍👧", color: "#FF9F45", stickerEmoji: "❤️", stickerName: "Trái Tim Gia Đình",
    words: [
      w("x-sister", "sister", "/ˈsɪstə/", "chị gái, em gái", "👧"),
      w("x-brother", "brother", "/ˈbrʌðə/", "anh trai, em trai", "👦"),
      w("x-baby", "baby", "/ˈbeɪbi/", "em bé", "👶"),
      w("x-grandma", "grandma", "/ˈɡrænmɑː/", "bà", "👵"),
      w("x-grandpa", "grandpa", "/ˈɡrænpɑː/", "ông", "👴"),
    ],
  },
  {
    id: "extra-animals", titleEn: "More animals", titleVi: "Thêm con vật",
    emoji: "🦁", color: "#2EC4B6", stickerEmoji: "🦁", stickerName: "Chúa Sơn Lâm Nhí",
    words: [
      w("x-elephant", "elephant", "/ˈelɪfənt/", "con voi", "🐘"),
      w("x-lion", "lion", "/ˈlaɪən/", "sư tử", "🦁"),
      w("x-zebra", "zebra", "/ˈzebrə/", "ngựa vằn", "🦓"),
      w("x-frog", "frog", "/frɒɡ/", "con ếch", "🐸"),
      w("x-pig", "pig", "/pɪɡ/", "con lợn", "🐷"),
    ],
  },
  {
    id: "extra-fruits", titleEn: "Yummy fruits", titleVi: "Trái cây ngon",
    emoji: "🍓", color: "#FF5D8F", stickerEmoji: "🍓", stickerName: "Vườn Trái Cây",
    words: [
      w("x-orange", "orange", "/ˈɒrɪndʒ/", "quả cam", "🍊"),
      w("x-grape", "grape", "/ɡreɪp/", "quả nho", "🍇"),
      w("x-watermelon", "watermelon", "/ˈwɔːtəˌmelən/", "dưa hấu", "🍉"),
      w("x-strawberry", "strawberry", "/ˈstrɔːbəri/", "dâu tây", "🍓"),
    ],
  },
  {
    id: "extra-body", titleEn: "My body & feelings", titleVi: "Cơ thể và cảm xúc",
    emoji: "🖐️", color: "#FFC53D", stickerEmoji: "💪", stickerName: "Cơ Thể Khỏe Mạnh",
    words: [
      w("x-eye", "eye", "/aɪ/", "mắt", "👁️"),
      w("x-ear", "ear", "/ɪə/", "tai", "👂"),
      w("x-nose", "nose", "/nəʊz/", "mũi", "👃"),
      w("x-mouth", "mouth", "/maʊθ/", "miệng", "👄"),
      w("x-happy", "happy", "/ˈhæpi/", "vui vẻ", "😄"),
      w("x-sad", "sad", "/sæd/", "buồn", "😢"),
      w("x-hungry", "hungry", "/ˈhʌŋɡri/", "đói bụng", "😋"),
      w("x-thirsty", "thirsty", "/ˈθɜːsti/", "khát nước", "🥤"),
    ],
  },
  {
    id: "extra-school", titleEn: "School things", titleVi: "Đồ dùng học tập",
    emoji: "🎒", color: "#7B61FF", stickerEmoji: "🖍️", stickerName: "Hộp Bút Đầy Màu",
    words: [
      w("bag", "bag", "/bæɡ/", "cái cặp, túi", "🎒"),
      w("book", "book", "/bʊk/", "quyển sách", "📖"),
      w("pen", "pen", "/pen/", "cây bút", "🖊️"),
      w("pencil", "pencil", "/ˈpensl/", "bút chì", "✏️"),
      w("x-ruler", "ruler", "/ˈruːlə/", "cây thước", "📏"),
      w("x-crayon", "crayon", "/ˈkreɪən/", "bút sáp màu", "🖍️"),
      w("x-board", "board", "/bɔːd/", "cái bảng", "🪧"),
      w("x-chair", "chair", "/tʃeə/", "cái ghế", "🪑"),
      w("x-teacher", "teacher", "/ˈtiːtʃə/", "cô giáo, thầy giáo", "👩‍🏫"),
    ],
  },
  {
    id: "extra-actions", titleEn: "Classroom actions", titleVi: "Việc làm trong lớp",
    emoji: "🙋", color: "#2EC4B6", stickerEmoji: "🙋", stickerName: "Học Trò Ngoan",
    words: [
      w("x-sitdown", "sit down", "/sɪt daʊn/", "ngồi xuống", "🪑"),
      w("x-standup", "stand up", "/stænd ʌp/", "đứng lên", "🧍"),
      w("x-openbook", "open your book", "/ˈəʊpən jɔː bʊk/", "mở sách ra", "📖"),
      w("x-closebook", "close your book", "/kləʊz jɔː bʊk/", "gấp sách lại", "📕"),
      w("x-look", "look", "/lʊk/", "nhìn này", "👀"),
      w("x-listen", "listen", "/ˈlɪsn/", "lắng nghe", "👂"),
      w("x-point", "point", "/pɔɪnt/", "chỉ tay", "👉"),
      w("x-sing", "sing a song", "/sɪŋ ə sɒŋ/", "hát một bài hát", "🎤"),
    ],
  },
  {
    id: "extra-home", titleEn: "At home", titleVi: "Trong nhà của bé",
    emoji: "🏠", color: "#FF9F45", stickerEmoji: "🛋️", stickerName: "Ngôi Nhà Ấm Áp",
    words: [
      w("door", "door", "/dɔː/", "cánh cửa", "🚪"),
      w("window", "window", "/ˈwɪndəʊ/", "cửa sổ", "🪟"),
      w("x-sofa", "sofa", "/ˈsəʊfə/", "ghế sô pha", "🛋️"),
      w("x-table", "table", "/ˈteɪbl/", "cái bàn", "🍽️"),
      w("x-chair", "chair", "/tʃeə/", "cái ghế", "🪑"),
      w("x-bed", "bed", "/bed/", "cái giường", "🛏️"),
      w("x-lamp", "lamp", "/læmp/", "đèn bàn", "💡"),
      w("x-tv", "TV", "/ˌtiː ˈviː/", "ti vi", "📺"),
      w("x-kitchen", "kitchen", "/ˈkɪtʃɪn/", "nhà bếp", "🍳"),
      w("x-bathroom", "bathroom", "/ˈbɑːθruːm/", "phòng tắm", "🛁"),
    ],
  },
  {
    id: "extra-weather", titleEn: "Weather", titleVi: "Thời tiết",
    emoji: "🌤️", color: "#4CC9F0", stickerEmoji: "🌈", stickerName: "Cầu Vồng Sau Mưa",
    words: [
      w("sun", "sun", "/sʌn/", "mặt trời", "☀️"),
      w("x-sunny", "sunny", "/ˈsʌni/", "nắng đẹp", "🌞"),
      w("x-rainy", "rainy", "/ˈreɪni/", "có mưa", "🌧️"),
      w("x-windy", "windy", "/ˈwɪndi/", "có gió", "🌬️"),
      w("x-cloudy", "cloudy", "/ˈklaʊdi/", "nhiều mây", "☁️"),
      w("x-snowy", "snowy", "/ˈsnəʊi/", "có tuyết", "❄️"),
      w("x-hot", "hot", "/hɒt/", "nóng", "🥵"),
      w("x-cold", "cold", "/kəʊld/", "lạnh", "🥶"),
    ],
  },
];

// ---------- ĐỢT 5: Kiến thức mở rộng theo từng bài (ngoài SGK, có gắn nhãn) ----------
// Mỗi bài có 1 sự thật thú vị ngắn (tiếng Việt, đúng lứa tuổi 6) + 1–2 từ mở
// rộng cùng chủ đề. Từ nào đã có MP3 giọng cô thì dùng đúng khóa audio đó
// (vd x-elephant, banana); từ chưa có MP3 dùng khóa "ext-..." không có trong
// audioMap nên app tự đọc bằng giọng thiết bị tiếng Anh như lệ cũ.
export interface ExtensionWordDef {
  key: string;
  en: string;
  ipa: string;
  vi: string;
  emoji: string;
}
export interface LessonExtensionDef {
  factVi: string;
  words: ExtensionWordDef[];
}
const ew = (key: string, en: string, ipa: string, vi: string, emoji: string): ExtensionWordDef => ({ key, en, ipa, vi, emoji });

export const LESSON_EXTENSIONS: Record<string, LessonExtensionDef> = {
  unit1: { factVi: "Bóng nảy lên được vì bên trong bóng có không khí đó con!", words: [ew("ext-kite", "kite", "/kaɪt/", "con diều", "🪁"), ew("ext-slide", "slide", "/slaɪd/", "cầu trượt", "🛝")] },
  unit2: { factVi: "Sữa giúp xương con chắc khỏe để con cao lớn mỗi ngày đó!", words: [ew("ext-spoon", "spoon", "/spuːn/", "cái thìa", "🥄"), ew("ext-plate", "plate", "/pleɪt/", "cái đĩa", "🍽️")] },
  unit3: { factVi: "Ăn táo giúp răng con chắc khỏe và miệng thơm tho đó con!", words: [ew("banana", "banana", "/bəˈnɑːnə/", "quả chuối", "🍌"), ew("x-orange", "orange", "/ˈɒrɪndʒ/", "quả cam", "🍊")] },
  unit4: { factVi: "Chó là bạn rất trung thành, luôn yêu quý và bảo vệ con đó!", words: [ew("x-bed", "bed", "/bed/", "cái giường", "🛏️"), ew("x-lamp", "lamp", "/læmp/", "đèn bàn", "💡")] },
  unit5: { factVi: "Cá có nhiều chất tốt giúp con thông minh và sáng mắt đó con!", words: [ew("ext-bread", "bread", "/bred/", "bánh mì", "🍞"), ew("ext-egg", "egg", "/eɡ/", "quả trứng", "🥚")] },
  unit6: { factVi: "Khi qua đường, đèn đỏ là dừng lại, đèn xanh mới được đi đó con!", words: [ew("x-ruler", "ruler", "/ˈruːlə/", "cây thước", "📏"), ew("x-crayon", "crayon", "/ˈkreɪən/", "bút sáp màu", "🖍️")] },
  unit7: { factVi: "Cây xanh cho con bóng mát và không khí sạch để thở mỗi ngày!", words: [ew("x-frog", "frog", "/frɒɡ/", "con ếch", "🐸"), ew("ext-flower", "flower", "/ˈflaʊə/", "bông hoa", "🌸")] },
  unit8: { factVi: "Rửa tay sạch trước khi ăn giúp con khỏe mạnh, không bị ốm đó!", words: [ew("x-eye", "eye", "/aɪ/", "con mắt", "👁️"), ew("x-ear", "ear", "/ɪə/", "cái tai", "👂")] },
  unit9: { factVi: "Đồng hồ giúp con biết giờ đi học, giờ ăn và giờ đi ngủ đó con!", words: [ew("x-eleven", "eleven", "/ɪˈlevn/", "số 11", "1️⃣1️⃣"), ew("x-twelve", "twelve", "/twelv/", "số 12", "1️⃣2️⃣")] },
  unit10: { factVi: "Voi là bạn to nhất trên cạn và voi rất yêu gia đình của mình!", words: [ew("x-elephant", "elephant", "/ˈelɪfənt/", "con voi", "🐘"), ew("x-lion", "lion", "/ˈlaɪən/", "con sư tử", "🦁")] },
  unit11: { factVi: "Mặt trời cho con ánh sáng ấm áp và giúp cây cối lớn lên đó!", words: [ew("ext-train", "train", "/treɪn/", "tàu hỏa", "🚆"), ew("ext-boat", "boat", "/bəʊt/", "con thuyền", "⛵")] },
  unit12: { factVi: "Mùa xuân lá cây mọc mới xanh tươi, mùa thu lá lại đổi màu đó con!", words: [ew("x-frog", "frog", "/frɒɡ/", "con ếch", "🐸"), ew("duck", "duck", "/dʌk/", "con vịt", "🦆")] },
  unit13: { factVi: "Ăn trái cây và rau củ mỗi ngày giúp con khỏe mạnh, mau lớn đó!", words: [ew("x-strawberry", "strawberry", "/ˈstrɔːbəri/", "quả dâu tây", "🍓"), ew("x-watermelon", "watermelon", "/ˈwɔːtəˌmelən/", "quả dưa hấu", "🍉")] },
  unit14: { factVi: "Hổ là bạn mèo to nhất thế giới và hổ bơi rất giỏi đó con!", words: [ew("ext-balloon", "balloon", "/bəˈluːn/", "quả bóng bay", "🎈"), ew("ext-robot", "robot", "/ˈrəʊbɒt/", "người máy đồ chơi", "🤖")] },
  unit15: { factVi: "Chơi bóng cùng bạn bè vừa vui vừa giúp con khỏe mạnh đó con!", words: [ew("x-brother", "brother", "/ˈbrʌðə/", "anh trai, em trai", "👦"), ew("x-sister", "sister", "/ˈsɪstə/", "chị gái, em gái", "👧")] },
  unit16: { factVi: "Nước rất quý! Con nhớ tắt vòi nước sau khi rửa tay nhé!", words: [ew("x-sofa", "sofa", "/ˈsəʊfə/", "ghế sô pha", "🛋️"), ew("x-tv", "TV", "/ˌtiː ˈviː/", "ti vi", "📺")] },
  "extra-colors": { factVi: "Sau cơn mưa, đôi khi con thấy cầu vồng có 7 màu thật đẹp trên trời!", words: [ew("ext-rainbow", "rainbow", "/ˈreɪnbəʊ/", "cầu vồng", "🌈"), ew("ext-brown", "brown", "/braʊn/", "màu nâu", "🟤")] },
  "extra-numbers": { factVi: "Con có 10 ngón tay và 10 ngón chân — đếm thử xem có đúng không nhé!", words: [ew("ext-zero", "zero", "/ˈzɪərəʊ/", "số 0", "0️⃣"), ew("ext-hundred", "one hundred", "/wʌn ˈhʌndrəd/", "một trăm", "💯")] },
  "extra-family": { factVi: "Gia đình là nơi mọi người yêu thương và chăm sóc nhau mỗi ngày!", words: [ew("ext-aunt", "aunt", "/ɑːnt/", "cô, dì, bác gái", "👩"), ew("ext-cousin", "cousin", "/ˈkʌzn/", "anh chị em họ", "🧒")] },
  "extra-animals": { factVi: "Hươu cao cổ là bạn cao nhất trên cạn, cổ bạn ấy dài lắm đó con!", words: [ew("ext-giraffe", "giraffe", "/dʒɪˈrɑːf/", "hươu cao cổ", "🦒"), ew("ext-panda", "panda", "/ˈpændə/", "gấu trúc", "🐼")] },
  "extra-fruits": { factVi: "Dứa có nhiều mắt nhỏ xinh, ăn ngọt và thơm lắm đó con!", words: [ew("ext-pineapple", "pineapple", "/ˈpaɪnæpl/", "quả dứa", "🍍"), ew("ext-peach", "peach", "/piːtʃ/", "quả đào", "🍑")] },
  "extra-body": { factVi: "Mắt giúp con nhìn, tai giúp con nghe, mũi giúp con ngửi mùi thơm đó!", words: [ew("ext-knee", "knee", "/niː/", "đầu gối", "🦵"), ew("ext-toe", "toe", "/təʊ/", "ngón chân", "🦶")] },
  "extra-school": { factVi: "Cặp sách giúp con mang sách vở đi học gọn gàng mỗi ngày đó!", words: [ew("ext-schoolbag", "school bag", "/skuːl bæɡ/", "cặp sách", "🎒"), ew("ext-eraser", "eraser", "/ɪˈreɪzə/", "cục tẩy", "🧽")] },
  "extra-actions": { factVi: "Khi cô nói, con lắng nghe chăm chú là con sẽ học được nhiều điều hay!", words: [ew("ext-read", "read", "/riːd/", "đọc sách", "📖"), ew("ext-write", "write", "/raɪt/", "viết chữ", "✍️")] },
  "extra-home": { factVi: "Nhà là nơi ấm áp nhất, nơi con được ba mẹ yêu thương mỗi ngày!", words: [ew("ext-garden-home", "garden", "/ˈɡɑːdn/", "khu vườn", "🌷"), ew("ext-clock-home", "clock", "/klɒk/", "đồng hồ", "🕐")] },
  "extra-weather": { factVi: "Tuyết rơi thành bông trắng xốp, trẻ em ở nước lạnh hay nặn người tuyết đó!", words: [ew("ext-rainbow", "rainbow", "/ˈreɪnbəʊ/", "cầu vồng", "🌈"), ew("ext-snowman", "snowman", "/ˈsnəʊmæn/", "người tuyết", "⛄")] },
};

/** Lấy kiến thức mở rộng của một bài; Fun time/Review dùng bài mở rộng của
 * Unit đầu tiên trong nhóm ôn (đúng tính chất ôn tập trộn). */
export function extensionForLessonId(lessonId: string, firstUnitNum?: number | null): LessonExtensionDef {
  const direct = LESSON_EXTENSIONS[lessonId];
  if (direct) return direct;
  if (firstUnitNum != null) {
    const byUnit = LESSON_EXTENSIONS[`unit${firstUnitNum}`];
    if (byUnit) return byUnit;
  }
  return {
    factVi: "Mỗi ngày học thêm một điều mới là mỗi ngày con thông minh hơn đó!",
    words: [ew("ext-giraffe", "giraffe", "/dʒɪˈrɑːf/", "hươu cao cổ", "🦒"), ew("ext-panda", "panda", "/ˈpændə/", "gấu trúc", "🐼")],
  };
}

// ---------- Sticker & quà ----------
export interface StickerDef {
  id: string;
  emoji: string;
  name: string;
  how: string; // cách nhận
}

export const ALL_STICKERS: StickerDef[] = [
  ...UNITS.map((u) => ({
    id: `stk-${u.id}`,
    emoji: u.stickerEmoji,
    name: u.stickerName,
    how: `Hoàn thành Unit ${u.num}`,
  })),
  ...SPECIALS.map((s) => ({
    id: `stk-${s.id}`,
    emoji: s.stickerEmoji,
    name: s.stickerName,
    how: `Hoàn thành ${s.titleEn} trong sách`,
  })),
  { id: "stk-first", emoji: "🌟", name: "Bước Đầu Tiên", how: "Hoàn thành bài học đầu tiên" },
  { id: "stk-half", emoji: "🌈", name: "Nửa Chặng Đường", how: "Hoàn thành 8 Unit" },
  { id: "stk-all", emoji: "👑", name: "Nữ Hoàng Tiếng Anh", how: "Hoàn thành cả 16 Unit" },
  { id: "stk-memory", emoji: "🧠", name: "Trí Nhớ Siêu Phàm", how: "Hoàn thành trò Ghép đôi trí nhớ trong một bài học" },
  { id: "stk-brain", emoji: "🧩", name: "Nhà Tư Duy Nhí", how: "Hoàn thành Thử thách trí tuệ trong một bài học" },
  { id: "stk-curiosity", emoji: "🔎", name: "Ngôi Sao Tò Mò", how: "Đọc thẻ Con có biết? và học từ mở rộng sau thử thách trí tuệ" },
  { id: "stk-streak", emoji: "🔥", name: "Chuỗi Lửa 3 Câu", how: "Trả lời đúng liền 3 câu trong phần trò chơi" },
  { id: "stk-explorer-city", emoji: "🗺️", name: "Thám Hiểm Thành Phố", how: "Tìm đủ mọi đồ vật ở Thành phố trong Game Khám Phá 3D" },
  { id: "stk-explorer-countryside", emoji: "🧭", name: "Thám Hiểm Đồng Quê", how: "Tìm đủ mọi đồ vật ở Đồng quê trong Game Khám Phá 3D" },
  { id: "stk-explorer-beach", emoji: "🏖️", name: "Thám Hiểm Bãi Biển", how: "Tìm đủ mọi đồ vật ở Bãi biển trong Game Khám Phá 3D" },
  { id: "stk-explorer-zoo", emoji: "🦁", name: "Thám Hiểm Sở Thú", how: "Tìm đủ mọi đồ vật ở Sở thú trong Game Khám Phá 3D" },
  ...EXTRA_SETS.map((s) => ({
    id: `stk-${s.id}`,
    emoji: s.stickerEmoji,
    name: s.stickerName,
    how: `Học xong mục mở rộng: ${s.titleVi}`,
  })),
];

export interface GiftDef {
  key: string; // khớp ảnh gift-*.webp
  name: string;
  en: string;
}

export const GIFTS: GiftDef[] = [
  { key: "capybara", name: "Capybara uống trà sữa", en: "Capybara" },
  { key: "axolotl", name: "Kỳ giông Axolotl đội vương miện", en: "Axolotl" },
  { key: "quokka", name: "Quokka cười tươi với kẹo cầu vồng", en: "Quokka" },
  { key: "redpanda", name: "Gấu trúc đỏ ôm dâu tây", en: "Red panda" },
];

/** Quà của 1 Unit: quay vòng 4 món quà theo số Unit. */
export function giftForUnit(num: number): GiftDef {
  return GIFTS[(num - 1) % GIFTS.length] ?? GIFTS[0]!;
}
