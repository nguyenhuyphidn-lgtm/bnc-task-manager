# HƯỚNG DẪN SỬ DỤNG WEBSITE QUẢN LÝ CÔNG VIỆC - BAN KỸ THUẬT HẠ TẦNG (BNC)

Tài liệu này hướng dẫn cài đặt, cấu hình và sử dụng **Hệ thống Quản lý Công việc** dành cho anh **Huy Phi / Ban Kỹ thuật Hạ tầng (BNC) - Sun World Ba Na Hills**.

---

## 1. Giới Thiệu Chung & Cấu Trúc Hệ Thống

Ứng dụng được thiết kế tối ưu, có tốc độ phản hồi cực nhanh trên nền tảng **React (Vite) + TypeScript** kết hợp **Vanilla CSS** (không dùng Tailwind) tạo ra giao diện kính mờ (Glassmorphism) cao cấp, mượt mà và trực quan.

Dữ liệu ban đầu gồm **25 Dự án/Công trình** và **58 Công việc** từ file Excel *“CÔNG VIỆC - HUY PHI.xlsx”* đã được tích hợp sẵn vào ứng dụng.

### Chế độ Lưu trữ Hybrid Thông minh (Offline + Online)
*   **Offline Mode (Mặc định)**: Ứng dụng chạy trực tiếp trên trình duyệt bằng LocalStorage. Mọi thao tác thêm mới, sửa đổi, kéo thả Kanban đều được lưu lại ngay lập tức tại máy của bạn mà **không cần cài đặt bất kỳ cơ sở dữ liệu nào**.
*   **Online Mode (Firebase Cloud)**: Dễ dàng nâng cấp thành hệ thống làm việc nhóm nhiều thiết bị bằng cách nhập thông số Firebase Firestore trực tiếp tại màn hình **Cài đặt**.

---

## 2. Quản Lý Tài Khoản & Cơ Chế Phân Quyền (4 Vai Trò)

Hệ thống được cấu hình sẵn 4 vai trò để kiểm soát quyền hạn thao tác:

1.  **Manager (Lãnh đạo - nguyenhuyphidn@gmail.com)**:
    *   Toàn quyền xem tất cả công việc của mọi nhân sự.
    *   Giao việc mới, chỉnh sửa thông tin, đổi người phụ trách, đổi thời hạn.
    *   Duyệt hoàn thành các nhiệm vụ.
    *   Xuất báo cáo tuần, báo cáo hiệu suất và sử dụng chế độ Trình chiếu Slideshow.
2.  **Admin (Quản trị hệ thống - admin@bnc.com)**:
    *   Quản lý danh sách nhân sự (Thêm mới nhân viên, thay đổi vai trò).
    *   Được phép chỉnh sửa các tham số hệ thống.
3.  **Assignee (Nhân viên thực hiện - Luân, Nguyên, Triết, Bách, Trang, Khánh...)**:
    *   Chỉ cập nhật tiến độ công việc được giao (Kéo thanh tiến độ 0 - 100%).
    *   Đánh dấu checklist công việc con được phân bổ.
    *   Thêm ghi chú/báo cáo tình hình xử lý hàng ngày.
4.  **Viewer (Người xem báo cáo - viewer@bnc.com)**:
    *   Chỉ xem dữ liệu và xuất báo cáo, không có quyền chỉnh sửa, thay đổi dữ liệu.

### Hướng dẫn Đăng nhập
*   **Đăng nhập bằng Form**: Nhập địa chỉ Gmail của bạn tại màn hình Đăng nhập.
*   **Đăng nhập nhanh (Quick Login)**: Đối với việc kiểm thử hoặc sử dụng nội bộ, nhấp chuột vào danh sách nhân sự ở khung bên phải màn hình đăng nhập để đăng nhập ngay lập tức vào vai trò mong muốn mà không cần nhập mật khẩu.

---

## 3. Các Phân Hệ & Màn Hình Chính

### 3.1. Trang Tổng Quan (Dashboard)
*   Hiển thị các thông số đo lường nhanh: Tổng việc, Đã hoàn thành, Sắp đến hạn (màu cam), Quá hạn (màu đỏ).
*   **Biểu đồ tiến độ**: Vẽ biểu đồ Doughnut bằng SVG động hiển thị tỷ lệ hoàn thành dự án tổng quát của ban.
*   **Nhắc việc khẩn cấp**: Liệt kê các công việc quá hạn hoặc sắp đến hạn trong vòng 3 ngày để xử lý sớm.
*   **Thống kê nhân sự & dự án**: Biểu đồ thanh tiến độ trung bình của từng nhân sự và từng dự án.

### 3.2. Sơ Đồ Cây Dự Án (Project Tree View)
*   Trực quan hóa cấu trúc dự án nhiều cấp theo hình cây thư mục:
    *   Cấp 1: Nhóm Dự án / Công trình (ví dụ: *Các gói theo IDP*, *Tiết kiệm năng lượng*...).
    *   Cấp 2: Đầu việc chính trực thuộc dự án.
    *   Cấp 3: Đầu việc con (Sub-task) được tạo để bổ trợ cho đầu việc chính.
*   **Thao tác nhanh**: Nhấp nút mũi tên đầu dòng để đóng/mở từng nhánh.
*   **Tạo nhanh việc con**: Rất hữu ích cho Lãnh đạo khi muốn giao nhanh việc trực tiếp tại nút cây của Dự án hoặc việc cha.

### 3.3. Danh Sách Công Việc & Kéo Thả Kanban
*   **View Danh sách**: Trình bày dạng bảng biểu chuyên nghiệp, hỗ trợ sắp xếp theo Mã, Tên việc, Thời hạn, Trạng thái.
*   **Bộ lọc nâng cao**: Lọc theo từ khóa, Dự án, Người thực hiện, Trạng thái (8 trạng thái) và Mức độ ưu tiên.
*   **Bảng Kanban**: Trực quan hóa công việc dưới dạng các cột trạng thái. Bạn có thể **kéo thả các thẻ công việc** từ cột này sang cột khác để cập nhật trạng thái cực kỳ nhanh gọn.

### 3.4. Báo Cáo, In Ấn & Trình Chiếu Giao Ban
*   **Báo cáo tuần**: Tự động lọc các công việc vừa hoàn thành trong tuần qua và các việc đang triển khai trọng tâm.
*   **Báo cáo dự án & Nhân sự**: Tổng hợp dữ liệu thành các bảng thống kê tiến độ trung bình và số lượng việc trễ hạn.
*   **Xuất Excel**: Tải xuống file Excel gồm 3 Sheets dữ liệu chi tiết được định dạng gọn gàng.
*   **In báo cáo / PDF**: Sử dụng CSS `@media print` tối ưu trang giấy trắng sạch sẽ để in ấn trực tiếp hoặc lưu file PDF.
*   **Slideshow Trình chiếu**: Bật chế độ họp giao ban tối giản, hiển thị slide chữ to rõ nét để Lãnh đạo điều hành cuộc họp chiếu lên màn hình máy chiếu.

---

## 4. Hướng Dẫn Cấu Hình Cloud Firebase Firestore

Khi bạn muốn chia sẻ dữ liệu cho nhân viên của mình cùng cập nhật trên điện thoại hoặc PC khác, hãy thực hiện các bước sau:

### Bước 1: Tạo dự án Firebase miễn phí
1.  Truy cập [Firebase Console](https://console.firebase.google.com/) và đăng nhập bằng tài khoản Gmail của bạn.
2.  Nhấn **Add Project** và đặt tên dự án (ví dụ: `bnc-work-manager`).
3.  Tại menu bên trái, vào mục **Build ➔ Firestore Database** và nhấn **Create Database**. Chọn chế độ **Start in test mode** (để mở quyền đọc viết ban đầu) và nhấn Enable.
4.  Nhấp vào biểu tượng bánh răng cài đặt dự án (Project settings), kéo xuống phần *Your apps* và tạo ứng dụng Web mới (biểu tượng `</>`). Firebase sẽ cung cấp cho bạn một đoạn mã cấu hình JSON.

### Bước 2: Nhập thông số vào Website
1.  Mở website quản lý công việc của bạn, chọn tab **Cài đặt hệ thống**.
2.  Điền các thông số từ đoạn mã cấu hình Firebase vào biểu mẫu tương ứng:
    *   *Project ID*
    *   *API Key*
    *   *Auth Domain*
    *   *Storage Bucket*
    *   *Messaging Sender ID*
    *   *App ID*
3.  Nhấp **Lưu cấu hình & Chuyển mây**. Trang web sẽ tự động khởi động lại và kết nối với cơ sở dữ liệu Cloud.
4.  Nhấp nút **Đồng bộ dữ liệu** ở trang cài đặt để đẩy toàn bộ dữ liệu Excel/LocalStorage hiện tại của bạn lên mây lần đầu tiên. Kể từ lúc này, mọi dữ liệu sẽ được lưu trữ tập trung trên Firebase.

---

## 5. Hướng Dẫn Deploy Lên Vercel & GitHub

Chỉ mất 5 phút để đưa trang web này lên internet miễn phí:

### Cách 1: Đẩy mã nguồn lên GitHub của bạn
1.  Tạo một repository mới trên GitHub (Ví dụ: `bnc-task-manager`).
2.  Tại thư mục dự án trên máy tính, chạy các lệnh sau:
    ```bash
    git init
    git add .
    git commit -m "Initial commit of BNC TaskManager"
    git branch -M main
    git remote add origin https://github.com/Tên-Tài-Khoản-Của-Bạn/bnc-task-manager.git
    git push -u origin main
    ```

### Cách 2: Deploy lên Vercel bằng 1 click
1.  Truy cập [Vercel](https://vercel.com/) và đăng nhập bằng tài khoản GitHub của bạn.
2.  Nhấp **Add New ➔ Project**, chọn repository `bnc-task-manager` vừa đẩy lên.
3.  Nhấn nút **Deploy**. Vercel sẽ tự động build và cung cấp cho bạn đường dẫn truy cập website hoàn toàn miễn phí dạng `https://bnc-task-manager.vercel.app`.
4.  Kể từ đó, mỗi khi bạn cập nhật code trên GitHub, Vercel sẽ tự động cập nhật website của bạn.
