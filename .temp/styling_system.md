Dưới đây là file `.md` dạng **styling + layout spec** để bạn dùng làm prompt system/design guideline cho agent. Mình chốt theo hướng enterprise hiện đại: **visual clarity, limited color palette, strong typography hierarchy, dark/light theme parity, data-dense but dễ scan**. Các nguyên tắc này phù hợp với xu hướng dashboard/SaaS gần đây và cũng bám các guideline về readability, theme, và design system consistency. ([Medium][1])

---

# Enterprise UI Styling & Layout Spec

## 1. Design Direction

### Design keywords

* modern enterprise
* minimal but premium
* clean and calm
* data-dense, not cluttered
* soft professionalism
* modular dashboard
* responsive and scalable

### Visual principles

* ưu tiên **clarity over decoration**
* dùng **ít màu nhấn**, nhiều khoảng trắng hoặc khoảng tối
* typography phải tạo được hierarchy rõ
* card, table, filter, sidebar cần nhất quán
* dark mode và light mode phải đồng nhất về structure, chỉ khác tone nền và contrast
* ưu tiên bố cục dạng **modular / bento-like grid** cho dashboard vì dễ scan và phù hợp enterprise app hiện đại. ([Medium][1])

---

## 2. Brand Theme

### Primary color

`#81A6C6`

### Secondary color

`#AACDDC`

### Font

`Manrope`
Manrope là open-source sans-serif hiện đại trên Google Fonts, phù hợp UI vì sạch, gọn, và dễ tạo hierarchy khi dùng nhiều weight. ([Google Fonts][2])

---

## 3. Theme Modes

## 3.1 Light Theme

### Tone

* clean
* airy
* cloudy
* soft enterprise

### Recommended colors

* **Background / app shell:** `#F4F7FA`
* **Surface / card:** `#FFFFFF`
* **Primary:** `#81A6C6`
* **Secondary:** `#AACDDC`
* **Primary hover:** `#6F97BA`
* **Border / divider:** `#D8E2EA`
* **Text primary:** `#111111`
* **Text secondary:** `#4B5563`
* **Muted text:** `#6B7280`
* **Selected background:** `#EAF2F8`
* **Soft accent background:** `#F0F7FA`

### Light theme character

* nền sáng kiểu cloudy, không trắng gắt
* card trắng nổi lên nhẹ bằng border mỏng và shadow rất mềm
* giữ cảm giác chuyên nghiệp, không quá “marketing”

---

## 3.2 Dark Theme

### Tone

* elegant
* quiet
* premium
* focused

### Recommended colors

* **Background / app shell:** `#0B0D10`
* **Surface / card:** `#13171C`
* **Elevated surface:** `#1A2027`
* **Primary:** `#81A6C6`
* **Secondary:** `#AACDDC`
* **Primary hover:** `#96B6D1`
* **Border / divider:** `#242B34`
* **Text primary:** `#FFFFFF`
* **Text secondary:** `#D1D5DB`
* **Muted text:** `#9CA3AF`
* **Selected background:** `#1D2A36`
* **Soft accent background:** `#16212B`

### Dark theme character

* nền đen nhưng không dùng pure black cho tất cả surface
* card nên là dark gray surface để dễ đọc hơn và bớt gắt; Material guidance cũng khuyên dark gray surfaces thay vì phủ đen tuyệt đối cho phần lớn UI. ([Material Design][3])

---

## 4. Color Usage Rules

### Primary `#81A6C6`

Dùng cho:

* primary button
* active nav item
* selected tab
* link hover
* chart highlight
* focus ring nhẹ
* status accent cho item được chọn

### Secondary `#AACDDC`

Dùng cho:

* soft badges
* secondary highlights
* subtle info cards
* background tint cho filter/section phụ
* secondary chart series

### Neutral usage

* 70–80% giao diện nên là neutral background, surface, border, text
* màu brand chỉ dùng để nhấn hành động và trạng thái quan trọng
* tránh dùng quá nhiều màu bổ sung khác nếu không thật sự cần

### Contrast rule

* text/body phải đạt contrast tối thiểu theo WCAG AA: **4.5:1 cho text thường**, **3:1 cho text lớn**. ([Material Design][4])

---

## 5. Typography

## Font family

```css
font-family: "Manrope", ui-sans-serif, system-ui, sans-serif;
```

## Suggested type scale

* **Display / Page Title:** 32px / 700
* **Section Title:** 24px / 700
* **Card Title:** 18px / 600
* **Body Large:** 16px / 500
* **Body Default:** 14px / 500
* **Body Small:** 13px / 500
* **Caption / Meta:** 12px / 500
* **Button Label:** 14px / 600
* **Table Header:** 12px / 700 uppercase optional nhẹ
* **Numeric KPI:** 28–36px / 700

## Typography rules

* chỉ dùng **1 font family**
* tận dụng weight 500 / 600 / 700 để tạo hierarchy
* line-height rộng vừa phải để dashboard dễ đọc
* số liệu lớn phải rõ, đậm, thẳng hàng
* section title ngắn, không dùng wording dài

Material typography guidance nhấn mạnh hierarchy, line height và readability là yếu tố cốt lõi cho UI dễ dùng. ([Material Design][5])

---

## 6. Layout Structure

## Global app shell

### Desktop

* **Left sidebar:** 240–280px
* **Top header:** 64–72px
* **Main content:** fluid
* **Content max width:** 1440px hoặc full-width với gutter rõ

### Tablet

* sidebar thu gọn thành icon rail hoặc drawer
* filter panel chuyển sang off-canvas
* card grid giảm số cột

### Mobile

* sidebar thành drawer
* top bar tối giản
* card xếp 1 cột
* table chuyển thành stacked cards
* sticky CTA cho action chính

## Layout philosophy

* enterprise layout nên có:

  * sidebar điều hướng ổn định
  * header chứa search, notification, profile
  * content area chia theo section rõ
  * dashboard dạng grid module
* thông tin nên tổ chức theo nguyên tắc IA rõ ràng để dễ tìm, dễ scan, dễ quay lại. ([Atlassian Design][6])

---

## 7. Spacing System

Dùng thang spacing 4px:

* 4
* 8
* 12
* 16
* 20
* 24
* 32
* 40
* 48

### Recommended usage

* card padding: 16–24
* section gap: 24–32
* grid gap: 16–24
* input height: 40–44
* button height: 40 hoặc 44
* table row height: 44–52

### Rule

* ưu tiên nhịp đều
* không trộn quá nhiều spacing lẻ
* khoảng cách giữa section luôn lớn hơn khoảng cách giữa element trong cùng section

---

## 8. Border Radius, Border, Shadow

### Radius

* small: 10px
* default: 14px
* large card/modal: 18–20px

### Border

* light theme: `1px solid #D8E2EA`
* dark theme: `1px solid #242B34`

### Shadow

Rất nhẹ, không dramatic:

* light: soft shadow mờ, ngắn
* dark: ít shadow hơn, ưu tiên border + contrast surface

### Rule

* enterprise UI nên “calm”, không dùng glow mạnh
* selected state nên ưu tiên tint + border + icon, không đẩy shadow quá nhiều

---

## 9. Component Styling

## Buttons

### Primary button

* bg: primary
* text: white hoặc gần trắng
* radius: 12px
* hover: darken nhẹ
* disabled: opacity 50–60%

### Secondary button

* bg: transparent hoặc soft tinted surface
* border: subtle
* text: primary hoặc text primary

### Tertiary / ghost

* không border hoặc border rất nhẹ
* dùng cho action phụ

---

## Inputs & Filters

* background tách nhẹ khỏi page
* border mảnh, rõ
* focus state dùng primary ring mềm
* filter chips dùng secondary tint hoặc neutral tint
* form design cần rõ structure, clarity và support để giảm cognitive load. ([Nielsen Norman Group][7])

---

## Cards

### Card style

* bg surface riêng
* radius 16–20
* border nhẹ
* header rõ
* card title + actions nằm trên cùng
* KPI card nên tối giản, chỉ 1 số chính + 1 meta line

### Card content hierarchy

1. title
2. primary metric/content
3. secondary explanation
4. actions / details

---

## Tables

* table header sticky nếu dài
* zebra rất nhẹ hoặc không cần
* row hover nhẹ
* text left aligned, số liệu right aligned
* status dùng badge
* trên mobile chuyển sang stacked cards

---

## Badges / Status

Chỉ nên có 5 nhóm:

* neutral
* info
* success
* warning
* danger

Tone các badge phải dịu, tránh neon.

---

## Charts

* nền sạch
* grid line rất nhẹ
* tối đa 1–2 màu brand + neutral
* không dùng quá nhiều màu cho 1 chart
* label ngắn, legend dễ scan
* chart phải đứng sau KPI summary, không thay thế KPI

---

## 10. Responsive Behavior

## Desktop first, but mobile-safe

### Breakpoints gợi ý

* `sm`: 640
* `md`: 768
* `lg`: 1024
* `xl`: 1280
* `2xl`: 1536

### Responsive rules

* sidebar collapse từ `lg` trở xuống
* dashboard grid:

  * 4 cột ở desktop rộng
  * 2 cột ở tablet
  * 1 cột ở mobile
* form 2 cột chỉ dùng từ tablet trở lên
* table dài không ép full table trên mobile
* top bar phải giữ search/action quan trọng ở mọi kích thước

---

## 11. Page Composition

## Standard enterprise page structure

1. **Page header**

   * title
   * subtitle ngắn
   * primary action
   * secondary action
2. **Quick filters / breadcrumbs**
3. **KPI summary row**
4. **Main content grid**

   * charts
   * tables
   * cards
   * side insights
5. **Detail / activity section**
6. **Footer tools hoặc pagination**

## Recommended dashboard composition

* hàng 1: 3–4 KPI cards
* hàng 2: chart lớn + side panel
* hàng 3: data table / booking list / activity feed
* hàng 4: secondary widgets

---

## 12. Theme Tokens

```css
:root {
  --font-sans: "Manrope", ui-sans-serif, system-ui, sans-serif;

  --color-primary: #81A6C6;
  --color-secondary: #AACDDC;

  --radius-sm: 10px;
  --radius-md: 14px;
  --radius-lg: 20px;
}
```

### Light

```css
[data-theme="light"] {
  --bg: #F4F7FA;
  --surface: #FFFFFF;
  --surface-elevated: #FFFFFF;
  --text-primary: #111111;
  --text-secondary: #4B5563;
  --text-muted: #6B7280;
  --border: #D8E2EA;
  --selected-bg: #EAF2F8;
  --accent-soft: #F0F7FA;
}
```

### Dark

```css
[data-theme="dark"] {
  --bg: #0B0D10;
  --surface: #13171C;
  --surface-elevated: #1A2027;
  --text-primary: #FFFFFF;
  --text-secondary: #D1D5DB;
  --text-muted: #9CA3AF;
  --border: #242B34;
  --selected-bg: #1D2A36;
  --accent-soft: #16212B;
}
```

---

## 13. Style Rules for Agent

* Use **Manrope only**
* Use **simple enterprise palette**, not colorful startup palette
* Keep interfaces **modular, clean, and calm**
* Prefer **cloudy light background** and **black/dark-gray background**
* Text colors can stay mostly **black and white**
* Use `#81A6C6` as the main action color
* Use `#AACDDC` for secondary highlights
* Avoid heavy gradients, glassmorphism overload, neon glows, and overly playful visuals
* Prefer **soft cards, clear borders, subtle shadows**
* Always design **light and dark theme together**
* All pages must be **responsive across desktop, tablet, and mobile**
* Prefer **bento-style dashboard sections** and **clear visual hierarchy**
* Keep charts and tables readable first, decorative second

---

## 14. Final Design Intent

Create an enterprise UI that feels:

* trustworthy
* modern
* calm
* premium
* efficient
* scalable for data-heavy workflows

The interface should look like a polished internal/external SaaS product with strong hierarchy, limited colors, excellent readability, and consistent light/dark behavior. ([Atlassian Design][6])

```
