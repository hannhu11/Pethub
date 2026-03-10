

### ---

**🌟 PROMPT 1: KHỞI TẠO DỰ ÁN & THIẾT LẬP DESIGN SYSTEM (Dán đầu tiên)**

*Dùng prompt này để AI khởi tạo project, cài đặt thư viện và thiết lập CSS/Theme theo đúng chuẩn "Non-AI Vibe".*

Plaintext

Act as an Expert Full-Stack Developer and UI/UX Engineer. I am building a cloud-based SaaS platform called "PetHub" for pet stores and veterinary clinics. 

TECH STACK:   
\- Frontend: Next.js (App Router), Tailwind CSS, Shadcn UI, Phosphor Icons, ApexCharts.  
\- Backend/DB: Node.js/Next.js API routes, PostgreSQL (or Supabase).

DESIGN SYSTEM (CRITICAL RULES \- "New Naturalism meets Brutalism"):  
1\. NO "AI-generated" vibes: Absolutely NO heavy box-shadows, NO glassmorphism, NO neon colors, NO purple/pink gradients, NO overly rounded corners.  
2\. Colors:   
   \- Background: Cream/Off-white (e.g., \#faf9f6) to simulate traditional medical paper.  
   \- Primary: Sage green or Terracotta.  
   \- Card/Surface: Warm gray.  
3\. Borders & Shapes: Use 1px solid black/dark gray borders for all cards, inputs, and sections. Flat design. Wavy section dividers instead of rigid blocks.  
4\. Typography: Serif font for Headings (medical authority vibe), modern Sans-Serif for body text.   
5\. Micro-interactions: Buttons should have a simple \`translate-y-1\` and slight contrast change on hover, no glowing effects. 

TASK:  
Initialize the Next.js project structure, configure Tailwind CSS with the specific color palette mentioned above, and set up the global CSS to enforce the 1px solid border flat design. Create a base Button and Card component following these strict UI rules.

### ---

**💻 PROMPT 2: FRONTEND \- CUSTOMER BOOKING FLOW (Trang Khách hàng & Đặt lịch)**

*Dán kèm theo 1 ảnh layout tham khảo (Screenshot) về giao diện Booking mà bạn thích.*

Plaintext

Act as an Expert Frontend Developer. Based on the Design System established for "PetHub", build the "Customer Booking" interface.

\[ATTACHED IMAGE: Reference layout for structure\]

REQUIREMENTS:  
1\. Keep 80% of the layout structure from the reference image, but strictly apply our "Brutalism \+ New Naturalism" theme (Off-white background, Sage green primary, solid 1px borders, NO box-shadows).  
2\. Create a 'Booking Slot Selection' modal/page.  
3\. Include a Date Picker.  
4\. Include Time Slots (30-minute intervals from 8:00 AM to 9:00 PM).  
5\. Add a Dropdown menu for the customer to select their "Registered Pet".  
6\. Use Phosphor Icons for UI elements.  
7\. The 'Book Appointment' button must use the physical \`translate-Y\` click effect.  
8\. Make it Mobile-First and fully responsive.

Generate the complete Next.js React component using Tailwind CSS and Shadcn UI components.

### ---

**💳 PROMPT 3: FRONTEND \- DIGITAL PET CARD (Thẻ Thú Cưng Kỹ Thuật Số)**

*Dùng để tạo giao diện thẻ vật lý dạng số.*

Plaintext

Act as an Expert UI Developer. Design a 'Digital Pet Card' component for the PetHub project using Next.js and Tailwind CSS.

REQUIREMENTS:  
1\. Layout: Must resemble a physical ID card (like a CCCD or Driver's License).   
2\. Style: Flat design, solid 1px dark border, warm gray background.  
3\. Data Fields:  
   \- Pet Image (Top Left)  
   \- Pet ID (e.g., \#PH-2026)  
   \- Pet Name & Breed  
   \- Owner Name & Owner Phone  
   \- A placeholder for a QR Code on the right side.  
4\. Micro-interaction: When the user hovers over this card, change the mouse cursor to a custom "paw print" icon (use a base64 paw image or CSS cursor url).  
5\. Code structure: Make it a reusable React component that accepts props for the pet and owner details.

Please generate the exact code for this component.

### ---

**📊 PROMPT 4: FRONTEND \- ADMIN DASHBOARD & POS (Trang Quản trị)**

*Dán kèm theo 1 ảnh layout tham khảo về Dashboard.*

Plaintext

Act as an Expert Frontend Developer. Build the "Admin Manager Dashboard" for PetHub.

\[ATTACHED IMAGE: Reference layout for dashboard\]

REQUIREMENTS:  
1\. Apply the strict "Non-AI Vibe" design system (No gradients, no glows, 1px solid borders everywhere).  
2\. Implement 'ApexCharts' to display two charts: 'Revenue by Month' (Bar chart) and 'Revenue by Week' (Line chart). Use earthy colors for the charts.  
3\. Below the charts, create a Data Table showing 'Most Used Services' and 'Total Bookings'. The table must have minimal styling (just 1px solid borders separating rows, no zebra striping).  
4\. Build a POS (Point of Sale) calculation section: Input for "Service Price", input for "Product Price", input for "Quantity". Include a display for "Total \= Service \+ (Product \* Quantity)".  
5\. Add a fast "Scan QR" button mock-up to retrieve Digital Pet Cards.

Generate the Next.js page code.

### ---

**🗄️ PROMPT 5: BACKEND \- DATABASE SCHEMA & API ROUTES (Hệ thống dữ liệu)**

*Dùng prompt này cho AI backend (hoặc cursor) để thiết kế CSDL.*

Plaintext

Act as an Expert Backend Engineer. Design the Database Schema and core API logic for "PetHub", a SaaS platform for veterinary clinics. 

REQUIREMENTS:  
1\. Entities needed:  
   \- Users (Role: Customer, Manager, Admin).  
   \- Pets (Linked to Customer).  
   \- Services & Products.  
   \- Appointments (Booking slots, Status: Pending, Confirm, Completed, Cancelled).  
   \- Invoices/Payments.  
2\. Architecture: Cloud-based RESTful API (or tRPC) using Next.js Route Handlers.  
3\. Security: All sensitive info (passwords) must be hashed. Assume OAuth2 integration for login.  
4\. Real-time requirement: Explain how you would implement real-time synchronization to prevent double-booking of the same 30-minute time slot.  
5\. SaaS Pricing Tiers logic: Add a boolean or role check for "Basic" vs "Premium" (Premium unlocks unlimited pets, CRM, and Digital Card).

Please output the Prisma Schema (schema.prisma) representing this database, and write one example Next.js API route (POST /api/appointments) that includes logic to prevent double-booking.

### ---

**📧 PROMPT 6: BACKEND \- CRM AUTOMATION & SYSTEM (Hệ thống nhắc nhở tự động)**

*Xử lý nghiệp vụ khó nhất của Backend là tự động hóa.*

Plaintext

Act as an Expert Backend Engineer. Implement the "CRM Automation System" for PetHub.

REQUIREMENTS:  
1\. Feature 1: Send an automated email reminder to the Customer and Manager 10 minutes before a scheduled appointment.  
2\. Feature 2: A "Smart Reminder" Cron Job to send recurring vaccination reminders to customers based on their pet's health record.  
3\. Tech Stack: Node.js, Nodemailer (or Resend/SendGrid API), and node-cron (or a background job queue like BullMQ).

TASK:  
Write the backend logic and background worker code to handle these two automated email functions. Ensure the code is robust, handles errors gracefully, and queries the database for "Premium" tier users (as Basic users do not get the CRM feature).

### ---

**💡 Hướng dẫn cách sử dụng hiệu quả:**

1. **Dùng v0.dev hoặc Lovable:** Hãy copy **Prompt 1, 2, 3, 4** (từng cái một) và **nhớ đính kèm một bức ảnh layout (Dribbble/Pinterest)** mà bạn thích vào khung chat của nó. Tụi nó sẽ code ra UI y hệt nhưng tự động ép style (vibe code) theo chuẩn của bạn.  
2. **Dùng Cursor hoặc Claude:** Mở thư mục code của bạn lên, paste **Prompt 1**, sau đó ném **Prompt 5 và 6** vào để AI tự động tạo file schema.prisma và các API xử lý logic phía sau.  
3. **Tuân thủ đúng quy trình:** Làm Frontend (UI/UX) cho đẹp và chốt giao diện trước, sau đó mới móc API (Backend) vào sau để tránh bị lỗi hệ thống.