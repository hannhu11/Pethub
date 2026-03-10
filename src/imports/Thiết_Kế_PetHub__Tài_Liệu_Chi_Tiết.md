# **BÁO CÁO TIỂU LUẬN: THIẾT KẾ VÀ XÂY DỰNG NỀN TẢNG QUẢN LÝ DỊCH VỤ THÚ CƯNG PETHUB (FRONT-END & BACK-END)**

## **LỜI MỞ ĐẦU**

Sự chuyển dịch mạnh mẽ trong nhận thức của người tiêu dùng Việt Nam đối với thú cưng, từ việc coi chúng là vật nuôi đơn thuần sang vị thế thành viên trong gia đình (hiện tượng nhân hóa \- humanization), đã thúc đẩy một làn sóng tăng trưởng chưa từng có trong ngành công nghiệp chăm sóc thú cưng.1 Số lượng thú cưng tại Việt Nam đã tăng trưởng đều đặn 5% mỗi năm kể từ 2017, đạt mức 12 triệu cá thể vào năm 2023 và được dự báo sẽ chạm mốc 16 triệu vào năm 2027\.1 Sự gia tăng này kéo theo nhu cầu khổng lồ về các dịch vụ y tế, grooming, spa và lưu trú chất lượng cao, biến thị trường "pet care" trở thành một khu vực kinh tế đầy tiềm năng với định giá ước tính 95 triệu USD vào năm 2025 và có thể đạt 165 triệu USD vào năm 2032\.1

Tuy nhiên, song hành với sự bùng nổ về nhu cầu là sự tụt hậu nghiêm trọng trong phương thức quản lý vận hành của phần lớn các cơ sở cung cấp dịch vụ. Dữ liệu thực tế cho thấy các phòng khám thú y và cửa hàng thú cưng quy mô nhỏ đến trung bình (SME) vẫn đang vật lộn với các công cụ thủ công như sổ sách giấy tờ, kết hợp với phần mềm bảng tính Excel hoặc nền tảng tin nhắn như Zalo, Facebook để lên lịch hẹn.1 Sự phân tán dữ liệu này tạo ra hàng loạt điểm nghẽn: nhân viên kiệt sức vì nhập liệu thủ công, nguy cơ trùng lặp hoặc bỏ sót lịch hẹn (double-booking), thất lạc hồ sơ y tế, và nghiêm trọng nhất là sự sụt giảm tỷ lệ giữ chân khách hàng (retention rate) do thiếu một chiến lược chăm sóc tự động và bài bản.1

Các phần mềm quản lý bán hàng (POS) đa ngành hiện có trên thị trường như KiotViet dù giải quyết được bài toán thanh toán, nhưng lại hoàn toàn thất bại trong việc đáp ứng các quy trình nghiệp vụ chuyên sâu của ngành thú y.1 Việc coi thú cưng đơn thuần như một "mặt hàng" trong cơ sở dữ liệu đã bỏ qua yếu tố cốt lõi của ngành: tính cá nhân hóa và mối liên kết cảm xúc giữa chủ nuôi, vật nuôi và cơ sở y tế.

Dự án nền tảng ứng dụng PetHub được ra đời nhằm giải quyết triệt để sự chênh lệch này. Định vị là một phần mềm dịch vụ chuyên biệt (Vertical SaaS), PetHub số hóa toàn bộ vòng đời dịch vụ từ khâu đặt lịch, theo dõi hồ sơ y tế, nhắc nhở tiêm phòng tự động, cho đến quản trị doanh thu.1 Điểm khác biệt cốt lõi của dự án nằm ở giải pháp Thẻ định danh thú cưng (Digital Pet Card) tích hợp công nghệ QR, cho phép truy xuất nhanh toàn bộ lịch sử chăm sóc và tạo ra một điểm chạm (touchpoint) mang đậm tính chuyên nghiệp.1 Báo cáo này sẽ trình bày chi tiết về quá trình phân tích, đặc tả kỹ thuật và xây dựng hệ thống thiết kế (Design System) toàn diện cho dự án PetHub, với định hướng thẩm mỹ "Non-AI vibe" nhằm mang lại một giao diện ấm áp, lấy con người làm trung tâm, rũ bỏ vẻ ngoài rập khuôn và vô hồn của các sản phẩm công nghệ tạo sinh thông thường.

## **CHƯƠNG 1\. TỔNG QUAN VỀ DỰ ÁN PETHUB**

### **1.1 Tên Dự Án**

Thiết Kế Website Và Hệ Thống Quản Lý Dịch Vụ Thú Cưng PetHub (Bao gồm Frontend, Backend và Digital Pet Card).

### **1.2 Định Hướng Của Dự Án**

Dự án tập trung vào việc thiết kế và phát triển một nền tảng quản lý tập trung dựa trên nền tảng đám mây (cloud-based web application). Khác với việc xây dựng một trang web thương mại điện tử tĩnh 1, PetHub là một hệ sinh thái phần mềm tương tác hai chiều, cung cấp giao diện đặt lịch cho khách hàng (Customer) và một trung tâm điều khiển (Dashboard) toàn diện cho người quản lý (Manager).1 Dự án nhằm mục đích loại bỏ hoàn toàn sổ sách thủ công, tự động hóa quy trình nhắc nhở qua CRM (Customer Relationship Management) và chuẩn hóa dữ liệu hồ sơ y tế thú cưng trên một kho lưu trữ duy nhất.1

### **1.3 Ý Nghĩa Thực Tiễn Và Giá Trị Kinh Doanh**

Dự án mang lại ý nghĩa to lớn trong bối cảnh quá trình chuyển đổi số đang diễn ra mạnh mẽ nhưng lại vấp phải rào cản chi phí tại Việt Nam.1 Việc định giá theo mô hình phần mềm dạng dịch vụ (SaaS) giúp các doanh nghiệp SME dễ dàng tiếp cận công nghệ mà không cần đầu tư hạ tầng máy chủ đắt đỏ.1

Thị trường mục tiêu được định lượng chi tiết để đảm bảo tính khả thi tài chính. Sự mở rộng của thị trường Vertical SaaS được thúc đẩy bởi nhu cầu số hóa sâu rộng vào quy trình quản lý thay vì chỉ dùng phần mềm kế toán cơ bản.1

| Cấp độ thị trường | Khái niệm và Công thức tính | Định giá ước tính |
| :---- | :---- | :---- |
| **TAM (Thị trường tổng thể)** | Tổng chi tiêu cho dịch vụ chăm sóc thú cưng tại Việt Nam. | Khoảng 2,375 tỷ VND.1 |
| **SAM (Thị trường khả dụng)** | Tỷ trọng các cơ sở pet care chuyên nghiệp tại khu vực đô thị có năng lực và nhu cầu áp dụng phần mềm (ước tính chiếm khoảng 17.6%). | Khoảng 418.9 tỷ VND.1 |
| **SOM (Thị trường thâm nhập)** | Phần thị phần mà PetHub dự kiến đạt được trong năm đầu tiên (giả định 0.2% của SAM) tập trung vào nhóm khách hàng sẵn sàng thử nghiệm (early adopters). | Khoảng 0.84 tỷ VND.1 |

Từ góc nhìn kinh doanh, ý nghĩa lớn nhất của nền tảng là khả năng gia tăng tỷ lệ giữ chân khách hàng (retention).1 Trong ngành dịch vụ chăm sóc, chi phí thu hút một khách hàng mới luôn cao hơn nhiều so với việc duy trì khách hàng cũ. Bằng việc tự động hóa lịch nhắc tiêm phòng và tái khám, PetHub trực tiếp tác động đến việc tăng doanh thu vòng lặp (recurring revenue) cho các phòng khám.1

### **1.4 Chân Dung Người Dùng Cuối**

Kiến trúc hệ thống được định hình bởi hai chân dung người dùng (Buyer Personas) mang tính đại diện cao, được đúc kết từ quá trình phỏng vấn chuyên gia và khảo sát diện rộng.1

**Người quản lý cửa hàng dịch vụ (Anh Minh \- Chủ Pet Store khu dân cư):** Là nam giới, độ tuổi từ 32-45, quản lý một cửa hàng quy mô nhỏ với 3-5 nhân sự.1 Doanh thu hàng tháng dao động từ 50-80 triệu đồng. Anh đang phải đối mặt với thách thức quản lý dữ liệu bằng Excel dẫn đến sai sót, khó nhận diện khách quen và không có công cụ nhắn tin CRM bài bản.1 Quyết định sử dụng phần mềm của anh bị chi phối bởi yếu tố tính dễ dùng (do nhân sự thường không rành công nghệ) và chi phí thuê bao hợp lý.1

**Quản lý phòng khám chuyên khoa y tế (Chị Hương \- Quản lý phòng khám thú y):** Là nữ giới, độ tuổi từ 25-40, quản lý một cơ sở y tế với 6-15 nhân sự.1 Khác với mô hình bán lẻ, chị Hương đặt ưu tiên tuyệt đối vào độ chính xác của hồ sơ bệnh án, tính bảo mật dữ liệu và hệ thống nhắc lịch tiêm phòng nhằm giảm áp lực cho bộ phận lễ tân.1 Dữ liệu khảo sát cho thấy những người như chị Hương sẵn sàng chi trả mức phí định kỳ nếu nền tảng chứng minh được sự ổn định và hỗ trợ xây dựng hình ảnh phòng khám chuyên nghiệp.1

Dữ liệu từ 100 người tham gia khảo sát củng cố thêm thiết kế này: 74.8% gặp khó khăn với hồ sơ và lịch tiêm, 57.3% mệt mỏi vì đặt lịch thủ công, và 45-50% bày tỏ sự e ngại rằng các phần mềm mới sẽ quá phức tạp để học.1 Điều này đặt ra một mệnh lệnh thiết kế tối thượng: Hệ thống phải cực kỳ trực quan, tối giản thao tác nhập liệu và loại bỏ mọi rào cản kỹ thuật.1

### **1.5 Phân Tích Lĩnh Vực Sử Dụng (Use Cases) Và Chức Năng Cốt Lõi**

Hệ thống PetHub phân tách luồng nghiệp vụ thành ba nhóm chức năng chính phục vụ ba đối tượng tương tác (Actors).1

1. **Nhóm Khách Hàng (Customer Uses):** Đăng ký/đăng nhập (hỗ trợ OAuth2), xem danh sách dịch vụ hiện có của cơ sở, đặt lịch hẹn (Booking) theo các khung giờ 30 phút, xem lịch sử giao dịch và hồ sơ sức khỏe vật nuôi, và truy xuất Thẻ định danh kỹ thuật số (Digital Pet Card).1  
2. **Nhóm Quản Trị Viên (Manager Uses):** Đăng nhập vào bảng điều khiển (Dashboard), quản lý danh mục (CRUD đối với dịch vụ, sản phẩm), xử lý trạng thái lịch hẹn (Pending, Confirm, Completed, Cancel), quản lý toàn quyền hồ sơ y tế vật nuôi, khởi tạo Digital Pet Card, và xem báo cáo tài chính (Revenue Report).1  
3. **Hệ Thống Tự Động (System Uses):** Xử lý ngầm các tác vụ gửi email nhắc lịch trước 10 phút, gửi thông báo tái khám định kỳ, và tính toán động dữ liệu trả về khi mã QR trên Digital Pet Card được quét.1

### **1.6 Kiến Trúc Giao Diện Các Trang Cốt Lõi**

Hệ thống frontend được cấu trúc chặt chẽ dựa trên luồng thao tác 1:

* **Trang Khách Hàng:** Trang chủ (Home), Trang xác thực (Login/Register), Danh sách dịch vụ (Service List), Modal chọn lịch (Slot Selection Modal), Bảng điều khiển cá nhân (Profile Screen), Danh sách vật nuôi (Pet List), Chi tiết bệnh án (Medical History).1  
* **Trang Quản Trị:** Bảng điều khiển tài chính (Dashboard Revenue), Quản lý danh mục và sản phẩm (Category/Product Management), Quản lý lịch hẹn (Booking Management), Màn hình thanh toán (Payment Screen), Quản lý khách hàng và vật nuôi, và Trình tạo thẻ Digital Card.1

## **CHƯƠNG 2\. KIẾN TRÚC THIẾT KẾ VÀ TRIẾT LÝ "NON-AI VIBE" DESIGN SYSTEM**

### **2.1 Khủng Hoảng Giao Diện AI Và Triết Lý "Non-AI Vibe"**

Thị trường phát triển phần mềm những năm 2024-2026 chứng kiến sự thống trị của các công cụ thiết kế tự động hóa bằng AI (như Google Stitch, v0.dev, MagicUI).2 Mặc dù các công cụ này mang lại năng suất phi thường, chúng đồng thời tạo ra một cuộc "khủng hoảng đồng dạng" (homogenization) trong thiết kế. Các giao diện do AI tạo ra thường mang một thẩm mỹ vô hồn, quá hoàn hảo (pixel-perfect), lạm dụng hiệu ứng kính (glassmorphism), viền đổ bóng (glow/box-shadows) sặc sỡ và cấu trúc lưới cứng nhắc.6

Đối với ngành công nghiệp chăm sóc thú cưng—nơi cảm xúc, sự gắn kết, tính nhân văn và thiên nhiên là cốt lõi—một giao diện lạnh lẽo mang phong cách "máy móc" sẽ tạo ra rào cản tâm lý cực lớn đối với người dùng.6 Vì vậy, PetHub từ chối đi theo lối mòn này. Triết lý "Non-AI Vibe" của hệ thống được định hình dựa trên các phong cách thiết kế tiên phong của năm 2025-2026: **New Naturalism** (Chủ nghĩa tự nhiên mới) kết hợp với những mảng miếng của **Brutalism** (Chủ nghĩa thô mộc).8

Thiết kế "Non-AI" tập trung vào việc mô phỏng những đường nét hữu cơ (organic shapes), sự bất hoàn hảo có chủ ý (intentional asymmetry), và cảm giác "được tạo ra bởi bàn tay con người".6 Thay vì các khối hộp vuông vức vô hồn, các dải phân cách phần (section dividers) được thiết kế dạng gợn sóng (wavy).6 Không gian âm (negative space) được mở rộng tối đa để giao diện có thể "thở", tạo sự thanh bình khi khách hàng theo dõi hồ sơ bệnh án của vật nuôi.9

### **2.2 Xây Dựng Design System Chuyên Biệt Bằng Shadcn UI**

Để kiểm soát tuyệt đối tính toàn vẹn của thiết kế "Non-AI", quá trình phát triển từ chối sử dụng các thư viện UI đóng gói sẵn (như Bootstrap hay Material UI). Việc sử dụng các thư viện này thường giới hạn khả năng can thiệp thiết kế và dễ dẫn đến tình trạng giao diện trông giống một "sản phẩm AI sinh ra hàng loạt".10 Thay vào đó, kiến trúc sử dụng **Shadcn UI** làm nền tảng cốt lõi.10

Shadcn UI mang triết lý "Treat UI as Source Code" (Coi UI như mã nguồn).10 Nó không phải là một gói phụ thuộc (dependency package) cài đặt qua NPM, mà cung cấp một bộ mã nguồn (được viết bằng Tailwind CSS và Radix UI) sao chép trực tiếp vào dự án.10 Điều này trao quyền cho nhóm phát triển kiểm soát 100% từng điểm ảnh (pixel), loại bỏ các hiệu ứng thừa thãi và tùy biến sâu mã nguồn để đạt được phong cách tự nhiên, thô mộc.10

**Kiến trúc Design Token và Màu Sắc (Color Palette):** Hệ thống loại bỏ hoàn toàn các màu neon hay gradient công nghiệp. Thay vào đó, các lớp CSS Variable được cấu hình dựa trên tông màu đất (earthy tones) và màu pastel làm chủ đạo.6 Một tệp globals.css được thiết lập với các biến ngữ nghĩa (Semantic Variables) 13:

* \--background: Tông màu kem nhạt (Cream) hoặc trắng ngà (Off-white), mô phỏng màu giấy của sổ y bạ truyền thống.  
* \--primary: Màu xanh rêu (Sage green) hoặc cam đất (Terracotta), tạo cảm giác an toàn, ấm áp và liên kết với thiên nhiên.8  
* \--card: Màu xám nhạt ấm (Warm gray), với đường viền (border) nét liền (solid 1px), loại bỏ hoàn toàn thuộc tính box-shadow để tạo hiệu ứng Flat Design pha chút Brutalism.8

**Hệ Thống Biểu Tượng (Iconography) và Chữ (Typography):** Việc sử dụng icon ảnh hưởng trực tiếp đến "vibe" của sản phẩm. Nền tảng tích hợp thư viện **Phosphor Icons**—một bộ biểu tượng mang đường nét mềm mại, linh hoạt và thân thiện, thay thế cho các bộ icon góc cạnh, kỹ thuật cao.14 Về nghệ thuật chữ (Typography), thiết kế ứng dụng các phông chữ có chân (Serif) cho các tiêu đề (Heading) để tạo ra sự uy tín trong y khoa, nhưng sử dụng phông chữ Sans-Serif hiện đại, dễ đọc cho các đoạn văn bản dài (body text). Đôi khi, các nhãn cảnh báo (tags) có thể sử dụng phong cách chữ viết tay (handwritten fonts) để tạo sự cá nhân hóa.6

### **2.3 Tương Tác Vi Mô (Micro-interactions) Vượt Qua Sự Khô Khan**

Một giao diện có hồn không chỉ nằm ở tĩnh mạo mà còn ở cách nó phản hồi. Các nền tảng UI tự động (như MagicUI hay 21st.dev) thường cung cấp những hoạt ảnh phức tạp, chuyển động 3D hào nhoáng.15 Trong PetHub, chuyển động (animation) được tinh giản đến mức tối đa và chỉ sử dụng cho mục đích dẫn dắt người dùng (Storytelling Animation).8

Thay vì hiệu ứng sáng rực khi di chuột (hover glow), các thành phần nút bấm (Button) hoặc thẻ dịch vụ (Card) trong PetHub sử dụng hiệu ứng thay đổi độ tương phản nhẹ và dịch chuyển tọa độ (translate Y), mô phỏng cảm giác nhấn vật lý chân thực.9 Tương tác con trỏ (Cursor animation) cũng là một điểm nhấn: khi người dùng tương tác với hồ sơ vật nuôi, con trỏ có thể biến đổi thành hình dấu chân thú cưng, tạo ra một trải nghiệm vi mô mang lại sự thích thú (delight) mạnh mẽ.6 Đây là sự khác biệt tinh tế mà các thuật toán tạo UI hàng loạt thường bỏ qua.4

## **CHƯƠNG 3: PHÂN TÍCH, ĐẶC TẢ HỆ THỐNG VÀ KIẾN TRÚC CƠ SỞ DỮ LIỆU**

Việc xây dựng một trải nghiệm người dùng hoàn hảo bên ngoài phải được hậu thuẫn bởi một kiến trúc hệ thống vững chắc, an toàn và tối ưu hiệu suất ở phía sau.

### **3.1 Đặc Tả Yêu Cầu Phi Chức Năng (Non-functional Specifications)**

Hệ thống PetHub tuân thủ các quy chuẩn khắt khe về kỹ thuật 1:

* **Hiệu suất (Performance):** Nền tảng được thiết kế để chịu tải lên đến 100 người dùng thực hiện giao dịch đồng thời (concurrent users), với thời gian phản hồi (response time) cho mỗi yêu cầu (request) dưới 3 giây.1 Quá trình đồng bộ dữ liệu lịch hẹn và thông tin y tế diễn ra theo thời gian thực (real-time data processing) để đảm bảo bác sĩ và lễ tân luôn nắm bắt được trạng thái cập nhật nhất.1  
* **Bảo mật và Quản trị Dữ liệu (Security & Data Management):** Tính toàn vẹn của dữ liệu y tế là yếu tố sống còn. Mọi kết nối mạng phải được mã hóa qua giao thức HTTPS. Các thông tin nhạy cảm của khách hàng (mật khẩu, số điện thoại, định danh) được mã hóa tại tầng cơ sở dữ liệu. Quá trình xác thực tuân thủ giao thức OAuth2, phân tách quyền truy cập rõ ràng giữa vai trò Khách hàng và Quản lý.1  
* **Khả năng tiếp cận (Packaging):** Là một ứng dụng web đám mây (cloud web-app), hệ thống chạy mượt mà trên các trình duyệt hiện đại (Chrome, Safari, Edge) mà không yêu cầu cài đặt, tương thích hoàn toàn (responsive) trên các thiết bị di động (mobile-first).1 Hạ tầng được triển khai (hosted) trên nền tảng đám mây Render, đảm bảo thời gian hoạt động (uptime) liên tục.1

### **3.2 Phân Tích Định Vị Cạnh Tranh (Competitive Analysis Framework)**

Sự phân tích thị trường 1 cho thấy sự hiện diện của hai nhóm đối thủ chính: Các hệ thống PIMS (Practice Information Management System) chuyên sâu y khoa nhưng quá phức tạp, và các hệ thống POS bán lẻ thiếu chiều sâu ngành. PetHub định hình một khoảng trống thị trường (Market Gap) riêng biệt.

| Yếu Tố Phân Tích | Các Giải Pháp Hiện Tại (KiotViet, GPC Vet, v.v.) | Giải Pháp PetHub (Khác Biệt) |
| :---- | :---- | :---- |
| **Trọng tâm sản phẩm** | Quản lý kho, kế toán, luồng công việc nội bộ phức tạp. Dữ liệu bị "nhốt" ở phía phòng khám.1 | Quản trị quan hệ khách hàng (CRM), tăng tỷ lệ giữ chân (Retention) thông qua hồ sơ kỹ thuật số.1 |
| **Mức độ phức tạp** | Giao diện công nghiệp, nhiều tính năng thừa, yêu cầu thời gian đào tạo dài.1 | Thiết kế "Non-AI vibe", loại bỏ tính năng thừa, trực quan, nhân viên có thể sử dụng ngay.1 |
| **Tương tác với khách hàng** | Không cung cấp cổng thông tin cá nhân hóa cho người nuôi thú cưng.1 | Digital Pet Card qua QR, trao quyền truy xuất dữ liệu cho chủ nuôi, tạo sự gắn kết.1 |
| **Chi phí** | Phí triển khai lớn, khó tiếp cận cho phòng khám quy mô siêu nhỏ.1 | Mô hình Freemium (0 VND \- 249.000 VND), định giá theo giá trị (Value-based).1 |

Sự khác biệt cốt lõi của PetHub là việc sử dụng **Digital Pet Card** như một công cụ tạo ra chi phí chuyển đổi (switching cost) cao.1 Khi dữ liệu của thú cưng được nhúng vào một hệ sinh thái quét mã QR dễ dàng, khách hàng sẽ có xu hướng quay lại phòng khám cũ để duy trì tính liền mạch của hồ sơ y tế, trực tiếp gia tăng lòng trung thành (customer loyalty).1

### **3.3 Luồng Hoạt Động Chức Năng (Workflow Logic)**

Hệ thống hoạt động dựa trên sự phối hợp của ba luồng (workflows) riêng biệt 1:

1. **Luồng Hoạt Động Khách Hàng (Customer Workflow):** Khách hàng truy cập trang chủ, duyệt danh sách dịch vụ mà không cần đăng nhập. Khi quyết định đặt lịch, họ được yêu cầu xác thực. Quá trình "Booking" tuân theo thiết kế giảm tải nhận thức: chọn dịch vụ \-\> chọn ngày giờ (slot 30 phút từ 8h \- 21h) \-\> chọn thú cưng (danh sách thả xuống) \-\> xác nhận. Trạng thái lịch hẹn lúc này là Pending.1 Khách hàng có thể hủy (Cancel) hoặc xem lại lịch sử y tế dưới dạng chỉ đọc (Read-only).  
2. **Luồng Hoạt Động Quản Trị (Manager Workflow):** Khi có lịch hẹn mới, người quản lý nhận thông báo trên Dashboard và duyệt chuyển trạng thái từ Pending sang Confirm.1 (Dựa trên kết quả MVP Testing 1, trạng thái Checked-in rườm rà đã được lược bỏ để tinh gọn quy trình). Sau khi cung cấp dịch vụ, quản lý bổ sung các sản phẩm bán kèm (thuốc, thức ăn) vào hóa đơn. Hệ thống tính tổng tiền bằng công thức Total \= Sum(Service price) \+ Sum(Product price × quantity). Quản lý xác nhận thanh toán ngoại tuyến và đổi trạng thái thành Completed.1 Ngoài ra, quản lý thực hiện toàn bộ thao tác CRUD đối với danh mục, sản phẩm, và cập nhật hồ sơ y tế cho thú cưng.1  
3. **Luồng Hệ Thống (System Workflow):** Kích hoạt tiến trình ngầm (cron jobs) để tự động gửi email nhắc nhở trước 10 phút đến cả khách hàng và quản lý. Phân tích chu kỳ y tế để gửi email nhắc lịch tái khám/tiêm phòng, đảm bảo tính liên tục trong CRM.1

### **3.4 Thiết Kế Lược Đồ Cơ Sở Dữ Liệu (Database Schema / ERD)**

Cơ sở dữ liệu được thiết kế theo mô hình quan hệ (Relational Database) và đạt chuẩn hóa Dạng 3 (3NF) nhằm loại bỏ sự dư thừa dữ liệu (data redundancy) và đảm bảo tính toàn vẹn (referential integrity).18 Việc sử dụng PostgreSQL (hoặc MySQL) kết hợp với khóa chính là chuỗi định danh duy nhất toàn cầu (UUID) giúp bảo mật tài nguyên, ngăn chặn lỗ hổng Enumeration Attack (kẻ tấn công không thể duyệt tuần tự ID của bệnh án).20

Bảng mô tả cấu trúc lược đồ (Schema Design):

| Tên Bảng (Table) | Cấu trúc Khóa (PK/FK) | Đặc tả và Chiến lược tối ưu hóa (Indexing) |
| :---- | :---- | :---- |
| **Users** | user\_id (PK, UUID) | Lưu trữ định danh, email, mật khẩu băm, họ tên, vai trò (role: customer/manager). Tạo Unique Index trên email để tăng tốc độ truy vấn đăng nhập.18 |
| **Pets** | pet\_id (PK, UUID) owner\_id (FK) | Lưu trữ thông tin sinh học (loài, giống, tuổi, giới tính). Quan hệ 1-Nhiều với Users. Chỉ mục (Index) được đặt trên owner\_id để tối ưu tải danh sách thú cưng của khách hàng.18 |
| **Medical\_Records** | record\_id (PK) pet\_id (FK) | Lưu trữ lịch sử điều trị, phác đồ, và ghi chú y khoa. Liên kết chặt chẽ với Pet Profile để truy xuất khi quét mã QR.1 |
| **Categories** | category\_id (PK) | Quản lý phân loại sản phẩm (ví dụ: Thuốc, Thức ăn, Phụ kiện).1 |
| **Products** | product\_id (PK) category\_id (FK) | Thực thể yếu (weak entity) phụ thuộc vào Categories. Quản lý giá, số lượng tồn kho (Inventory).1 |
| **Services** | service\_id (PK) | Danh sách dịch vụ (khám lâm sàng, grooming, lưu chuồng). Chứa tên, giá, mô tả. Đặt chỉ mục trên cột trạng thái kích hoạt (active).1 |
| **Appointments** | appointment\_id (PK) pet\_id (FK) user\_id (FK) | Bảng trung tâm (Fact table). Quản lý lịch hẹn, thời gian (date, slot), và trạng thái (status). Sử dụng Composite Index trên (pet\_id, appointment\_date) để tăng tốc các truy vấn thống kê và CRM tự động.1 |
| **Transactions** | transaction\_id (PK) appointment\_id (FK) | Lưu vết (audit trail) thanh toán, tổng tiền dịch vụ và sản phẩm, phục vụ cho Dashboard Revenue Report.1 |

Để phục vụ phân tích dữ liệu và báo cáo tài chính (Revenue Report by month/week/service) một cách mượt mà, một số trường dữ liệu có thể được tiền tính toán (pre-calculated) hoặc phi chuẩn hóa nhẹ (denormalization) để hạn chế các câu lệnh JOIN quá phức tạp, tăng tốc độ tải màn hình Dashboard.19

## **CHƯƠNG 4: THIẾT KẾ GIAO DIỆN VÀ KỸ THUẬT PROMPT ENGINEERING CHO USE CASE**

Trong kỷ nguyên phát triển phần mềm bằng AI, việc mô tả cấu trúc cho các công cụ như Cursor, Windsurf hay Claude đòi hỏi kỹ năng Prompt Engineering chuyên sâu. Để ngăn chặn AI sinh ra các đoạn mã giao diện mang phong cách vô hồn (AI-generated look), phương pháp "Zoom-Out-Zoom-In" được áp dụng.23 Phương pháp này cung cấp bối cảnh tổng quan (Context) \-\> Chân dung người dùng (User) \-\> Cấu trúc Layout \-\> Ràng buộc thẩm mỹ (Visual Direction) \-\> Mã nguồn đầu ra (Output Expectation).23

### **4.1 Prompt Thiết Kế Giao Diện Đặt Lịch Khách Hàng (Customer Booking Flow)**

Việc đặt lịch là tương tác mang tính chuyển đổi cao nhất. Thiết kế phải loại bỏ sự căng thẳng và rườm rà. Hệ thống luồng được phân tách thành từng bước nhỏ (Step-by-step) thay vì nhồi nhét trên một form dài.

**Prompt chi tiết:**

"Context: You are an expert UI/UX Design Engineer. Design a React (Next.js) functional component using Tailwind CSS and raw Shadcn UI primitives for the 'Customer Booking Flow' of PetHub, a pet clinic SaaS. User: Pet owners who might be anxious about their pet's health and are not highly tech-savvy. They value simplicity and clarity. Goal: Create a multi-step booking interface (Select Service \-\> Choose Pet \-\> Select Time Slot). Visual Direction & Non-AI Vibe: STRICTLY AVOID generic SaaS aesthetics (no glassmorphism, no heavy neon gradients, no excessive box-shadows). Embrace 'New Naturalism' and 'Friendly Brutalism'.6 Use an earthy color palette (cream background \#FAFAFA, warm sage green primary buttons, soft terracotta accents). Borders should be solid 1px dark lines to ground the elements. Use rounded corners (rounded-2xl) to create a playful, organic feel. Layout Hierarchy:

* Header: A visually clear, text-based progress indicator (e.g., '1. Dịch vụ \-\> 2\. Thú Cưng \-\> 3\. Thời gian').  
* Service Selection: Use a Bento Grid layout for service cards.9 Each card features a custom Phosphor Icon (e.g., stethoscope, grooming scissors).14 Micro-interaction: On hover, the card slightly translates up (-translate-y-1) instead of glowing.9  
* Pet Selection: A clean dropdown or horizontal scroll list showing the customer's registered pets.  
* Time Selection: A grid of pill-shaped buttons for 30-minute time slots (8:00 AM \- 9:00 PM). Unavailability must be clearly marked with a muted, strike-through styling.  
  Constraints: Mobile-first responsiveness is mandatory. Avoid overly complex React state management; keep the payload simple (service\_id, pet\_id, timeslot). Ensure accessible contrast ratios.  
  Output: Provide the full TypeScript (.tsx) code, integrating the custom color configuration."

### **4.2 Prompt Thiết Kế Bảng Điều Khiển Quản Trị (Admin / Manager Dashboard)**

Giao diện quản trị viên phải xử lý khối lượng thông tin lớn nhưng không được gây quá tải nhận thức (cognitive overload).24

**Prompt chi tiết:**

"Context: Design the Manager Dashboard component for PetHub. User: A busy veterinary clinic manager handling multiple workflows simultaneously. Goal: Provide an at-a-glance view of daily operations, revenue reports, and booking status management. Visual Direction: Functional, high-contrast, and deeply structured. Do not use floating, disconnected UI elements (Unexpected Floating Objects) typical of AI designs.9 Stick to strict, asymmetrical grid layouts that maximize screen real estate.9 Use a clean light-mode aesthetic with semantic colors solely for status indication (e.g., Amber for Pending, Emerald for Completed) without saturating the entire screen. Typography should feature a stark Serif font for numeric metrics and a readable Sans-Serif for tabular data.6 Layout Hierarchy:

* Top Section: 3 KPI Cards showing 'Total Revenue (This Week)', 'Appointments Today', and 'Most Popular Service'.1  
* Middle Section (Main): A comprehensive Data Table for today's bookings. Columns include Time, Customer Name, Pet Name, Service, Status, and Action.  
  Constraints:  
* Integrate with Shadcn's Table and DropdownMenu components.12  
* The Action button must allow status change (Pending \-\> Confirm \-\> Completed). Note: DO NOT include a 'CheckedIn' status as it was removed post-MVP testing.1  
* Ensure the table handles empty states gracefully with a friendly illustration or text ("No appointments left today\!").  
  Output: Generate the React code utilizing Recharts for a small revenue sparkline in the KPI cards, and robust Tailwind grid classes."

### **4.3 Prompt Thiết Kế Digital Pet Card Và Hồ Sơ Y Tế**

Thẻ Digital Pet Card là linh hồn của hệ sinh thái, thay thế thẻ giấy vật lý. Nó phải mang tính chất của một chứng minh thư (ID card) nhưng thân thiện và đầy màu sắc.1

**Prompt chi tiết:**

"Context: Design the 'Digital Pet Card' UI component for PetHub. This card acts as a digital identity for the pet and is heavily accessed on mobile phones. User: Pet owners showing the card at the clinic, and Vet staff scanning it. Goal: Create a beautifully crafted digital ID card that holds the pet's core data and a scannable QR code. Visual Direction: Mimic a physical ID card (CCCD format).1 Only design one face (no flipping required). Use a skeuomorphic texture (e.g., subtle noise overlay or grain) to make it feel like a physical object, escaping the flat AI vector look.8 The color theme should adapt to the pet's species (e.g., warm yellow for dogs, pastel blue for cats). Layout Hierarchy:

* Top Left: A high-quality, circular avatar of the pet with an organic, wavy border.6  
* Bottom Left/Middle: Distinct typographic hierarchy showing Pet Name (large, bold Serif), DOB, Gender, Species, Breed, and Pet ID.1  
* Right Side: A prominent, high-contrast QR code component.1 Below it, the Owner's Name and Phone Number for emergency contact. Constraints: Ensure the layout uses Flexbox or Grid to prevent the QR code from overlapping text on smaller devices. Output: React component code using Tailwind CSS for precise absolute positioning and flex layouts to achieve the ID card aspect ratio."

### **4.4 Prompt Thiết Kế Quản Lý Giao Dịch Và Thanh Toán (Payment & Transaction Flow)**

Chức năng này được tối giản hóa theo chiến lược MVP, tập trung vào việc quản lý thanh toán nội bộ thay vì xây dựng cổng thanh toán trực tuyến phức tạp.

**Prompt chi tiết:**

"Context: Design a Payment Confirmation Modal for the Manager workflow in PetHub.

User: Clinic staff processing a checkout at the physical counter.

Goal: Calculate the final bill by adding the base service price and any additional products purchased, then mark the booking as 'Completed'.

Layout Hierarchy:

* A summary list of the provided Service(s).  
* A combo-box/searchable dropdown to add Products (e.g., medicine, pet food) with a quantity selector.1  
* A total calculation row prominently displaying Total \= Service Price \+ (Product Price \* Quantity).1  
* A final 'Confirm Payment' action button. Constraints: No online payment gateway integration (no Stripe/PayPal). This is strictly for record-keeping and revenue reporting.1 Output: Provide the React code for the Modal component, handling the state logic to automatically calculate the grand total when product quantities change."

## **CHƯƠNG 5: KẾT LUẬN VÀ CHIẾN LƯỢC PHÁT TRIỂN**

### **5.1 Đánh Giá Kết Quả MVP Testing Và Phân Tích Mô Hình Kinh Doanh**

Giai đoạn thử nghiệm Sản phẩm Khả thi Tối thiểu (MVP Testing) đã được thực hiện nghiêm ngặt trên một nhóm mẫu (tối thiểu 10 người dùng) thông qua các buổi phỏng vấn Google Meet và thu thập dữ liệu bằng Google Form.1 Mục tiêu cốt lõi là kiểm chứng (validate) xem các tính năng được xây dựng có thực sự giải quyết được các nỗi đau của thị trường (Market Pains) đã phân tích ở Chương 1 hay không.1

Dữ liệu phản hồi (User Feedback) mang lại kết quả cực kỳ khả quan. Khách hàng đánh giá cao thiết kế giao diện mang tính nhân bản, thân thiện và hệ thống màu sắc hài hòa của luồng đặt lịch (Appointment Booking Flow) cũng như màn hình quản lý hồ sơ thú cưng.1 Tuy nhiên, quá trình kiểm thử cũng phát hiện ra một số điểm nghẽn trong luồng thao tác. Cụ thể, các kiểm thử viên (testers) nhận định rằng việc phải cập nhật trạng thái lịch hẹn qua bước "Checked-In" là quá rườm rà và không cần thiết đối với một phòng khám quy mô nhỏ.1 Quyết định kiến trúc (Iterate) đã ngay lập tức được đưa ra: loại bỏ trạng thái "Checked-In" khỏi hệ thống, chuyển thẳng từ Confirm sang Completed, nhằm bám sát nguyên tắc thiết kế tối giản, giảm thiểu số lần nhấp chuột (click) cho nhân viên.1

Về mô hình kinh doanh, chiến lược định giá (Pricing Strategy) của PetHub được xây dựng dựa trên nguyên tắc định giá theo giá trị (Value-Based Pricing).1 Hệ thống loại bỏ rào cản chi phí ban đầu bằng việc cung cấp một gói cơ bản (0 VND) giới hạn ở 50 hồ sơ và thao tác thủ công.1 Gói cao cấp (Premium) được định giá ở mức 249.000 VND/tháng, cung cấp toàn bộ quyền lực của hệ thống: không giới hạn hồ sơ, phân tích báo cáo doanh thu chi tiết, tự động hóa hệ thống nhắc lịch CRM (email), và phát hành Digital Pet Card.1 Dựa trên khảo sát thực tế cho thấy mức sẵn sàng chi trả của nhóm khách hàng mục tiêu dao động từ 100.000 đến 300.000 VND, mức giá 249.000 VND chứng minh được tính khả thi về mặt thị trường (Viability) trong khi vẫn duy trì được biên lợi nhuận gộp (Gross Margin) lý tưởng ở mức xấp xỉ 70% \- 72%, một tiêu chuẩn vàng cho các nền tảng SaaS.1

### **5.2 Những Giới Hạn Của Hệ Thống Hiện Tại**

Dù đã đạt được một mô hình hoạt động trơn tru, dự án ở giai đoạn MVP vẫn tồn tại một số hạn chế nhất định.

Thứ nhất, việc biểu diễn dữ liệu thống kê trên Dashboard hiện chỉ dừng lại ở các biểu đồ cơ bản (doanh thu theo tuần/tháng) mà chưa tích hợp các công cụ khai phá dữ liệu sâu hơn (data mining) để dự báo xu hướng tiêu dùng theo mùa vụ.

Thứ hai, hệ thống thanh toán hoàn toàn là ngoại tuyến (offline tracking). Việc thiếu tích hợp với các cổng thanh toán nội địa (như VNPay, MoMo) khiến khách hàng chưa có một trải nghiệm thanh toán "không chạm" hoàn toàn xuyên suốt.

Thứ ba, tính năng quản lý sản phẩm (Product & Category) chỉ đáp ứng nhu cầu bán kèm cơ bản, chưa phát triển thành một hệ thống quản lý kho (Inventory Management) chuyên sâu cảnh báo hết hạn sử dụng của thuốc y tế.

### **5.3 Hướng Phát Triển Của Đề Tài (Persevere and Iterate)**

Với những phản hồi tích cực từ MVP, chiến lược chủ đạo của PetHub là Kiên định (Persevere) với mô hình cấu trúc hệ thống và phong cách thiết kế "Non-AI vibe" hiện tại.1 Giá trị cốt lõi của việc kết nối phòng khám và chủ nuôi thông qua Digital Pet Card đã được thị trường công nhận.

Trong lộ trình phát triển tương lai (Product Roadmap), hệ thống sẽ tiến hành cải tiến (Iterate) và bổ sung các phân hệ còn thiếu. Cụ thể:

* Nâng cấp kiến trúc dữ liệu để hỗ trợ theo dõi vòng đời sản phẩm, phục vụ cho các cửa hàng có doanh số bán lẻ (Retail) lớn.1  
* Tích hợp hệ thống phân tích dữ liệu 360 độ nhằm báo cáo hành vi của khách hàng, giúp doanh nghiệp thiết lập các chương trình khách hàng thân thiết (Loyalty Program) tự động thông qua tần suất sử dụng dịch vụ.1  
* Khám phá tiềm năng kết nối API với các thiết bị định vị GPS hoặc microchip để đồng bộ dữ liệu vào Digital Pet Card, gia tăng tiện ích tìm kiếm thú cưng thất lạc.25

Tựu trung lại, với bối cảnh chuyển đổi số đang trở thành mệnh lệnh sống còn của các doanh nghiệp, PetHub không chỉ cung cấp một phần mềm quản lý, mà còn trao cho các cơ sở chăm sóc thú cưng một công cụ sắc bén để xây dựng hình ảnh chuyên nghiệp, nâng cao chất lượng dịch vụ y tế, và tạo dựng mối quan hệ gắn kết bền chặt với những người yêu động vật tại Việt Nam.1 Việc tuân thủ triệt để triết lý thiết kế lấy con người làm trung tâm (Human-centric), từ chối sự sáo rỗng của xu hướng AI, chính là chìa khóa để nền tảng này phát triển bền vững và lâu dài.

#### **Works cited**

1. CP3.docx  
2. Google Stitch AI Walkthrough: Comparison, Features, Alternatives, accessed March 10, 2026, [https://uxpilot.ai/blogs/google-stitch-ai](https://uxpilot.ai/blogs/google-stitch-ai)  
3. Google Stitch Review: Features, Pricing \+ Alternative To Try \- Flowstep, accessed March 10, 2026, [https://flowstep.ai/blog/google-stitch-review/](https://flowstep.ai/blog/google-stitch-review/)  
4. The 2025 State of Visual Development and Vibe Coding \- Bubble, accessed March 10, 2026, [https://bubble.io/blog/2025-state-of-visual-development-ai-app-building/](https://bubble.io/blog/2025-state-of-visual-development-ai-app-building/)  
5. From idea to app: Introducing Stitch, a new way to design UIs, accessed March 10, 2026, [https://developers.googleblog.com/stitch-a-new-way-to-design-uis/](https://developers.googleblog.com/stitch-a-new-way-to-design-uis/)  
6. Web Design Trends for 2025: What's In and How to Stand Out, accessed March 10, 2026, [https://rebekahreadcreative.com/website-design-trends-2025/](https://rebekahreadcreative.com/website-design-trends-2025/)  
7. Google Stitch: Complete Guide to AI UI Design Tool (2026) \- ALM Corp, accessed March 10, 2026, [https://almcorp.com/blog/google-stitch-complete-guide-ai-ui-design-tool-2026/](https://almcorp.com/blog/google-stitch-complete-guide-ai-ui-design-tool-2026/)  
8. 10 Graphic Design Trends to Pay Attention to in 2025 | GraphicMama, accessed March 10, 2026, [https://graphicmama.com/blog/graphic-design-trends-2025/](https://graphicmama.com/blog/graphic-design-trends-2025/)  
9. 25 Web Design Trends to Watch in 2025 \- DEV Community, accessed March 10, 2026, [https://dev.to/watzon/25-web-design-trends-to-watch-in-2025-e83](https://dev.to/watzon/25-web-design-trends-to-watch-in-2025-e83)  
10. What Is Shadcn UI A Guide for Modern Developers \- Magic UI, accessed March 10, 2026, [https://magicui.design/blog/shadcn-ui](https://magicui.design/blog/shadcn-ui)  
11. How to Use Shadcn UI in Your Project?, accessed March 10, 2026, [https://shadcnstudio.com/blog/how-to-use-shadcn-ui](https://shadcnstudio.com/blog/how-to-use-shadcn-ui)  
12. Shadcn UI Best Practices for 2026 | by Vaibhav Gupta \- Medium, accessed March 10, 2026, [https://medium.com/write-a-catalyst/shadcn-ui-best-practices-for-2026-444efd204f44](https://medium.com/write-a-catalyst/shadcn-ui-best-practices-for-2026-444efd204f44)  
13. Accelerating Themeable Design Systems with shadcn/ui \- Perpetual, accessed March 10, 2026, [https://www.perpetualny.com/blog/accelerating-themeable-design-systems-with-shadcn-ui-a-step-by-step-guide](https://www.perpetualny.com/blog/accelerating-themeable-design-systems-with-shadcn-ui-a-step-by-step-guide)  
14. Phosphor Icons, accessed March 10, 2026, [https://phosphoricons.com/](https://phosphoricons.com/)  
15. Magic UI | Vibe Coding Tool Review & Features, accessed March 10, 2026, [https://www.vibe-coding.uk/tools/magic-ui](https://www.vibe-coding.uk/tools/magic-ui)  
16. 21st.dev: The Future Of Frontend Development | Vibe Coding, accessed March 10, 2026, [https://medium.com/vibe-coding/21st-dev-the-future-of-frontend-development-149d05f35db7](https://medium.com/vibe-coding/21st-dev-the-future-of-frontend-development-149d05f35db7)  
17. Magic UI, accessed March 10, 2026, [https://magicui.design/](https://magicui.design/)  
18. Designing an Efficient Database Schema to Manage Pet ... \- Zigpoll, accessed March 10, 2026, [https://www.zigpoll.com/content/how-can-i-design-an-efficient-database-schema-to-manage-pet-profiles-appointment-scheduling-and-customer-feedback-for-a-pet-care-company](https://www.zigpoll.com/content/how-can-i-design-an-efficient-database-schema-to-manage-pet-profiles-appointment-scheduling-and-customer-feedback-for-a-pet-care-company)  
19. Database Schema Design: Key Concepts and Best Practices, accessed March 10, 2026, [https://www.solarwinds.com/database-optimization/database-schema-design](https://www.solarwinds.com/database-optimization/database-schema-design)  
20. Top 10 Database Schema Design Best Practices \- Bytebase, accessed March 10, 2026, [https://www.bytebase.com/blog/top-database-schema-design-best-practices/](https://www.bytebase.com/blog/top-database-schema-design-best-practices/)  
21. Designing your database schema \- best practices, accessed March 10, 2026, [https://towardsdatascience.com/designing-your-database-schema-best-practices-31843dc78a8d/](https://towardsdatascience.com/designing-your-database-schema-best-practices-31843dc78a8d/)  
22. Pet Database Management System Overview | PDF \- Scribd, accessed March 10, 2026, [https://www.scribd.com/document/937381765/Pet-Database-Management-System](https://www.scribd.com/document/937381765/Pet-Database-Management-System)  
23. Google Stitch for UI Design \- UX Planet, accessed March 10, 2026, [https://uxplanet.org/google-stitch-for-ui-design-544cf8b42d52](https://uxplanet.org/google-stitch-for-ui-design-544cf8b42d52)  
24. Pet Pulse — A UX Case Study \- Design Interactive \- Medium, accessed March 10, 2026, [https://davisdesigninteractive.medium.com/pet-pulse-a-ux-case-study-47f7cc43d452](https://davisdesigninteractive.medium.com/pet-pulse-a-ux-case-study-47f7cc43d452)  
25. Digging into PetHub Tech: How to Set-Up Privacy Controls and, accessed March 10, 2026, [https://www.pethub.com/articles/2438660/digging-into-pethub-tech-how-to-set-up-privacy-controls-and-access-information](https://www.pethub.com/articles/2438660/digging-into-pethub-tech-how-to-set-up-privacy-controls-and-access-information)  
26. PetHub | Your Pet Connected, accessed March 10, 2026, [https://www.pethub.com/](https://www.pethub.com/)