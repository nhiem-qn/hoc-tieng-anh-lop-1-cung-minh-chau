# Học Tiếng Anh Lớp 1 Cùng Minh Châu

Ứng dụng học tiếng Anh cho bé lớp 1, bám sát SGK **Tiếng Anh 1 – Global Success** (Bộ GD&ĐT):
16 Unit theo đúng thứ tự sách, xen 4 Fun time và 4 Review, thẻ từ (hình + phiên âm + nghĩa),
giọng cô ghi sẵn (209 file MP3), chấm điểm phát âm 0–100, trò chơi theo từng bài,
**Game Khám Phá 3D** (4 map: Thành phố, Đồng quê, Bãi biển, Sở thú) và
**Thử thách trí tuệ** cuối mỗi Unit kèm thẻ "Con có biết?" với từ mở rộng ngoài SGK.

## Cách dựng lại / sửa tiếp bằng bất kỳ tài khoản Muse nào

Cách đơn giản và đầy đủ nhất — dùng file **`GOI-MA-NGUON.txt`** ở thư mục gốc của repo này:

1. Mở Muse bằng tài khoản của bạn, tải file `GOI-MA-NGUON.txt` lên cuộc trò chuyện.
2. Gửi yêu cầu: **"Hãy dựng lại ứng dụng dựa theo mã nguồn trong file này."**
3. Muse sẽ tạo ứng dụng mới từ đúng mã nguồn này (file có mục lục SHA-256 để
   kiểm chứng từng file, gồm cả 209 file MP3 và hình WebP được mã hoá Base64).

Sau khi dựng xong, bạn có thể yêu cầu Muse ở tài khoản đó sửa / nâng cấp tiếp
(thêm bài, thêm map, đổi giao diện...) — mọi thay đổi nằm ở bản của tài khoản đó.

## Vì sao file MP3 / WebP không nằm trực tiếp trong cây thư mục?

Repo này được đẩy lên qua kết nối GitHub của Muse, kênh này chỉ nhận file văn
bản (UTF-8). Toàn bộ file nhị phân (209 MP3 giọng cô, 5 ảnh WebP, icon) nằm
**nguyên vẹn trong `GOI-MA-NGUON.txt`** dưới dạng Base64 kèm SHA-256.
Cây thư mục trong repo là toàn bộ mã nguồn dạng chữ mới nhất để xem và sửa trực tiếp trên GitHub.

## Cấu trúc mã nguồn

| Đường dẫn | Nội dung |
|---|---|
| `space.json` | Khai báo ứng dụng (tên, slug, entry) |
| `package.json`, `bun.lock`, `bunfig.toml` | Dependencies + cấu hình Bun |
| `client/src/App.tsx` | Toàn bộ giao diện ứng dụng |
| `client/src/Game3D.tsx` | Game Khám Phá 3D |
| `client/src/content.ts` | Toàn bộ nội dung bài học (16 Unit, Fun time, Review, Học thêm) |
| `client/src/audioMap.ts` | Bảng ánh xạ 209 file MP3 giọng cô |
| `server/src/actions.ts`, `server/src/schema.ts` | Logic máy chủ + schema dữ liệu (tiến độ, sticker/quà, điểm đọc, Sổ Khám Phá) |
| `drizzle/*.sql` | 4 migration cơ sở dữ liệu |

## Lưu ý

- **Dữ liệu học của bé (app.db) không có trong repo này** — repo chỉ chứa mã nguồn.
  Khi dựng lại, ứng dụng bắt đầu với dữ liệu trống.
- Lệnh dựng trong thư mục ứng dụng: `bun install` rồi build theo hướng dẫn trong `AGENTS.md`.
