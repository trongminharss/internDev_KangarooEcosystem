# KGR — Đánh giá và luồng triển khai UI màn Home

## 1. Mục tiêu và phạm vi

Tổng hợp từ UI được cung cấp và phần phân tích trong cuộc trao đổi, phục vụ triển khai màn Home trên React Native.

Hai mục tiêu chính:

- Kết nối thiết bị lần đầu.
- Khám phá sản phẩm.

Ảnh tham chiếu thể hiện trạng thái **chưa có thiết bị được ghép nối**. Các trạng thái loading, lỗi, dữ liệu rỗng và đích điều hướng bên dưới là đề xuất triển khai, không phải những màn hình đã được thể hiện đầy đủ trong ảnh.

Chưa xác định từ ảnh: UI khi đã có thiết bị, tên/chức năng chính xác của từng tab, quy tắc thêm giỏ hàng. Không tự bổ sung nghiệp vụ cho các phần này.

## 2. Cấu trúc UI theo ảnh

Thứ tự từ trên xuống:

1. Header: lời chào bên trái, avatar bên phải.
2. Banner thiết bị: icon liên kết, thông báo “Chưa có thiết bị nào được ghép nối”, nút “Kết nối ngay”.
3. Tiêu đề “Khám phá sản phẩm”.
4. Lưới sản phẩm 2 cột; ảnh minh họa có 4 card.
5. Nút “Xem thêm”.
6. Thanh điều hướng dưới gồm 4 icon, tab Home đang được chọn.

Mỗi card sản phẩm có ảnh, nhãn HOT/Mới nếu có, tên sản phẩm, giá và icon giỏ hàng. Số lượng 4 card là nội dung minh họa; giới hạn sản phẩm thực tế cần chốt theo dữ liệu/nghiệp vụ.

## 3. Đánh giá và đề xuất UI/UX

| Khu vực | Đánh giá | Đề xuất |
|---|---|---|
| Lời chào và avatar | Gọn, có tính cá nhân hóa | Lời chào theo giờ; avatar mặc định khi chưa có ảnh |
| Banner thiết bị | Nổi bật, CTA rõ ràng | Giữ là một component độc lập; “Kết nối ngay” là hành động chính |
| Lưới sản phẩm | Dễ quan sát | Đồng nhất chiều cao card, vùng ảnh và vùng tên |
| Nhãn HOT/Mới | Dễ nhận biết | Hiển thị theo dữ liệu, không gắn cứng |
| Giá và icon giỏ hàng | Hơi nhỏ | Tăng độ rõ của giá và vùng chạm icon |
| Xem thêm | Chưa nổi bật | Mở rộng vùng chạm; giữ khoảng cách với thanh tab |
| Thanh tab | Phân biệt tab đang chọn bằng màu | Cân nhắc nhãn ngắn khi xác định được tên tab |
| Bố cục chung | Thứ bậc nội dung rõ | Nội dung cuộn; thanh tab cố định, không che nội dung cuối |

Không suy ra mã màu, font size hoặc spacing chính xác từ ảnh. Khi triển khai cần ánh xạ vào token thiết kế đã được xác nhận của dự án.

## 4. Luồng hiển thị màn Home

| Bước | Xử lý | UI hiển thị |
|---|---|---|
| 1. Vào Home | Khởi tạo màn hình | Khung trang, header và thanh tab |
| 2. Tải dữ liệu | Lấy người dùng, thiết bị và sản phẩm | Loading riêng cho từng vùng cần dữ liệu |
| 3. Hiển thị header | Dựa trên giờ và thông tin người dùng | Lời chào, avatar |
| 4. Xác định trạng thái thiết bị | Kiểm tra kết quả tải danh sách | Chưa có thiết bị / có thiết bị / lỗi |
| 5. Hiển thị sản phẩm | Kiểm tra kết quả tải danh sách | Lưới sản phẩm / rỗng / lỗi |
| 6. Nhận tương tác | Xử lý thao tác người dùng | Điều hướng hoặc cập nhật UI |

### 4.1. Nguyên tắc tải dữ liệu

- Vùng thiết bị và vùng sản phẩm tải độc lập; một vùng lỗi không chặn vùng còn lại.
- Chỉ hiển thị “Chưa có thiết bị nào được ghép nối” sau khi tải thành công và danh sách thiết bị rỗng.
- Không dùng trạng thái rỗng thay cho loading hoặc lỗi.
- “Thử lại” tải lại vùng đang lỗi.
- Sau khi kết nối thiết bị thành công và quay về Home, tải lại danh sách thiết bị.

### 4.2. Trạng thái vùng thiết bị

| Điều kiện | UI | Hành động |
|---|---|---|
| Đang tải | Skeleton hoặc loading trong vùng thiết bị | Chờ kết quả |
| Thành công, danh sách rỗng | Banner theo ảnh | Kết nối ngay |
| Thành công, có thiết bị | Khu vực thiết bị theo thiết kế bổ sung | Chưa đặc tả từ ảnh này |
| Tải thất bại | Thông báo ngắn | Thử lại |

### 4.3. Trạng thái vùng sản phẩm

| Điều kiện | UI | Hành động |
|---|---|---|
| Đang tải | Skeleton dạng lưới 2 cột | Chờ kết quả |
| Có dữ liệu | Lưới card sản phẩm | Chi tiết / giỏ hàng / xem thêm |
| Danh sách rỗng | Thông báo rỗng gọn, ẩn Xem thêm | Không hiển thị card giả |
| Tải thất bại | Thông báo lỗi | Thử lại |
| Ảnh bị lỗi | Ảnh thay thế, giữ tên và giá | Vẫn thao tác với sản phẩm |

## 5. Luồng tương tác

Đích điều hướng là đề xuất theo ý nghĩa UI; đối chiếu với cấu trúc navigation thực tế khi triển khai.

| Thao tác | Luồng | Kết quả |
|---|---|---|
| Bấm avatar | Home → Tài khoản cá nhân | Mở màn tài khoản |
| Bấm Kết nối ngay | Home → Luồng thêm thiết bị | Bắt đầu quy trình kết nối |
| Kết nối thành công, quay về | Home → tải lại thiết bị | Hiển thị trạng thái theo dữ liệu mới |
| Hủy kết nối, quay về | Trở lại Home | Giữ trạng thái chưa có thiết bị nếu danh sách vẫn rỗng |
| Bấm ảnh hoặc tên sản phẩm | Home → Chi tiết sản phẩm | Mở đúng sản phẩm được chọn |
| Bấm icon giỏ hàng | Xử lý theo quy tắc sản phẩm | Phản hồi thành công hoặc lỗi |
| Bấm Xem thêm | Home → Danh sách sản phẩm | Mở danh mục đầy đủ |
| Bấm tab dưới | Chuyển màn tương ứng | Cập nhật tab đang chọn |
| Bấm Thử lại | Tải lại vùng lỗi | Cập nhật vùng tương ứng |

### 5.1. Kết nối thiết bị

1. Người dùng bấm “Kết nối ngay”.
2. Home điều hướng vào luồng thêm thiết bị đã được xác định của dự án.
3. Các kiểm tra/yêu cầu quyền phục vụ kết nối nằm tại bước cần sử dụng trong luồng đó.
4. Khi hoàn tất và quay về, cập nhật danh sách thiết bị.
5. Khi hủy, trở lại Home và hiển thị dữ liệu hiện có.

Tài liệu này không bổ sung các bước quét, ghép nối hoặc xác nhận quyền sở hữu vào luồng thêm thiết bị.

### 5.2. Sản phẩm và giỏ hàng

- Bấm ảnh/tên: mở chi tiết sản phẩm.
- Bấm icon giỏ hàng: xử lý riêng, không đồng thời mở chi tiết card.
- Nếu sản phẩm có lựa chọn bắt buộc: mở bước chọn trước khi thêm giỏ.
- Chỉ thêm trực tiếp nếu đã đủ thông tin theo nghiệp vụ được xác nhận.
- Hiển thị kết quả thao tác; khi thất bại không báo thành công.

## 6. Phân chia component

| Component | Trách nhiệm |
|---|---|
| HomeScreen | Tổng hợp dữ liệu, trạng thái và điều hướng |
| HomeHeader | Lời chào và avatar |
| DeviceSection | Chọn UI theo trạng thái thiết bị |
| EmptyDeviceCard | Banner chưa có thiết bị và CTA |
| ProductSection | Tiêu đề, danh sách và Xem thêm |
| ProductCard | Ảnh, nhãn, tên, giá, thao tác giỏ hàng |
| BottomTabNavigator | Điều hướng chính và trạng thái tab |

Các tên component là gợi ý; tổ chức theo cấu trúc source hiện có. ProductSection là vùng UI về mặt chức năng, không bắt buộc tạo một danh sách cuộn lồng riêng.

### Gợi ý bố cục React Native

- Dùng FlatList với 2 cột làm vùng cuộn chính.
- ListHeaderComponent chứa HomeHeader, DeviceSection và tiêu đề “Khám phá sản phẩm”.
- renderItem hiển thị ProductCard.
- ListFooterComponent chứa Xem thêm khi phù hợp.
- Thanh tab nằm ngoài vùng cuộn; nội dung có khoảng đệm đủ cho safe area và thanh tab.
- Giữ tỷ lệ ảnh sản phẩm, bố cục thích ứng chiều rộng màn hình.

## 7. Thứ tự triển khai

| Giai đoạn | Công việc | Kết quả cần đạt |
|---|---|---|
| 1. Khung màn | Nền, safe area, vùng cuộn, thanh tab | Không bị che nội dung |
| 2. Banner và header | Lời chào, avatar, trạng thái chưa có thiết bị | Bám sát ảnh |
| 3. Sản phẩm | Lưới 2 cột, card, nhãn, giá, Xem thêm | Card đồng nhất |
| 4. Trạng thái dữ liệu | Loading, rỗng, lỗi, ảnh thay thế | Phân biệt rõ từng trạng thái |
| 5. Tương tác | Nối callback và navigation | Mỗi vùng bấm thực hiện đúng hành động |
| 6. Dữ liệu thực | Nối nguồn dữ liệu, cập nhật sau kết nối | Các vùng hoạt động độc lập |
| 7. Kiểm tra UI | Màn nhỏ, tên dài, chữ lớn, vùng chạm | Nội dung đọc và thao tác được |

## 8. Checklist nghiệm thu

- [ ] Đúng thứ tự bố cục theo ảnh tham chiếu.
- [ ] Banner rỗng chỉ xuất hiện khi đã xác nhận danh sách thiết bị rỗng.
- [ ] Loading, lỗi và dữ liệu rỗng được phân biệt.
- [ ] Vùng thiết bị lỗi không chặn vùng sản phẩm và ngược lại.
- [ ] Thử lại chỉ tải lại vùng cần thiết.
- [ ] Kết nối thành công rồi quay về cập nhật danh sách thiết bị.
- [ ] Hủy kết nối không tạo trạng thái thiết bị giả.
- [ ] Lưới giữ 2 cột và card nhất quán trên các kích thước màn hình mục tiêu.
- [ ] Tên dài không chồng giá hoặc icon giỏ hàng.
- [ ] Nhãn HOT/Mới lấy từ dữ liệu.
- [ ] Ảnh lỗi có nội dung thay thế.
- [ ] Bấm giỏ hàng không đồng thời mở chi tiết sản phẩm.
- [ ] Xem thêm dẫn đúng màn và ẩn khi danh sách rỗng.
- [ ] Avatar có nội dung mặc định khi thiếu ảnh.
- [ ] Thanh tab và safe area không che phần cuối nội dung.
- [ ] Kiểm tra với chữ hệ thống lớn và vùng chạm của các nút nhỏ.

## 9. Các điểm cần chốt để hoàn thiện Home

| Điểm còn thiếu | Ảnh hưởng |
|---|---|
| UI khi đã có thiết bị | Chưa thể hoàn thiện nhánh hiển thị thiết bị |
| Tên và chức năng 4 tab | Chưa thể xác nhận mapping navigation |
| Quy tắc thêm giỏ và lựa chọn sản phẩm | Chưa thể chốt hành vi icon giỏ hàng |
| Giới hạn sản phẩm trên Home | Chưa thể chốt số card thực tế |

Có thể dựng UI trạng thái chưa có thiết bị và các component ngay theo ảnh. Những phần chưa được xác định cần giữ thành điểm tích hợp, không tự thêm nghiệp vụ.
