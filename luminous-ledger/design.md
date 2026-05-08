# Design System: High-End AI Finance Editorial

## 1. Overview & Creative North Star
**Creative North Star: "The Luminous Ledger"**

This design system moves away from the utilitarian, grid-heavy density of traditional fintech and toward a high-end editorial experience. It is inspired by the interplay of light and transparency found in premium hardware. We prioritize breathing room over information density, using white space as a structural element rather than a void.

The system breaks the "template" look through **intentional asymmetry**—such as staggered card layouts and varied container widths—and **tonal layering**. By utilizing the extreme ends of our typography scale, we create a sense of authority and sophistication, treating financial data as a curated art gallery rather than a spreadsheet.

---

## 2. Colors
Our palette balances professional gravity (Greys/Navys) with the emotive, vibrant energy of AI-driven insights (Sunset Oranges, Purples, Blues).

### The "No-Line" Rule
**Strict Mandate:** Designers are prohibited from using 1px solid borders for sectioning or containment. Boundaries must be defined solely through background color shifts. Use `surface-container-low` for large background sections and `surface-container-lowest` (Pure White) for foreground cards. This creates a "soft" edge that feels more integrated into the OS.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of frosted glass sheets.
- **Base Layer:** `surface` (#f6f6fb).
- **Secondary Sectioning:** `surface-container-low` (#f0f0f6).
- **Primary Interaction Cards:** `surface-container-lowest` (#ffffff).
- **Nested Detail Elements:** Use `surface-container` (#e7e8ee) within a white card to denote secondary information, such as a "search" bar within a list.

### The Glass & Gradient Rule
To achieve the signature AI aesthetic, use **Glassmorphism** for floating action elements or navigation bars. Apply a `surface-container-lowest` color at 70% opacity with a `20px` backdrop-blur.
- **Signature Gradients:** Use a transition from `secondary` (#4c49c9) to `tertiary-container` (#ff9817) for high-impact data visualizations. This "sunset" transition feels organic and high-end.

---

## 3. Typography
We use a high-contrast typographic scale to guide the eye. Our primary typeface is **Inter** (as a high-end alternative to San Francisco), emphasizing bold weights for financial totals.

- **Display (Lg/Md):** Reserved for primary balances. Use `inter` Bold with `-0.02em` tracking. This is the "Hero" of the screen.
- **Headline (Sm/Md):** Used for section titles (e.g., "Latest Transactions"). These should be tight and authoritative.
- **Body (Lg/Md):** All transactional text. We use `on-surface-variant` (#5a5b60) for secondary body text to reduce visual noise.
- **Label (Sm):** Used for micro-data, like "Merchant Category" or "Timestamp."

The hierarchy relies on the jump between `display-lg` and `label-sm`. The vast difference in scale creates a "premium editorial" feel that makes the data feel considered.

---

## 4. Elevation & Depth
Depth is achieved through **Tonal Layering** and ambient light simulation, never through heavy, muddy dropshadows.

### The Layering Principle
Stacking tiers is our primary method of elevation.
- **Level 0:** `background` (#f6f6fb).
- **Level 1:** `surface-container-low` (used for grouping content).
- **Level 2:** `surface-container-lowest` (White cards).
The contrast between the light-grey background and the pure-white card provides all the "lift" required for a clean look.

### Ambient Shadows
When a card must float (e.g., a modal or a primary CTA card), use a shadow tinted with `secondary` (#4c49c9) at 4% opacity with a `40px` blur and `10px` Y-offset. This mimics natural light passing through a financial document.

### The "Ghost Border" Fallback
If contrast is legally required for accessibility, use a "Ghost Border": `outline-variant` (#acadb1) at **15% opacity**. It should be felt, not seen.

---

## 5. Components

### Buttons
- **Primary:** A solid `secondary` (#4c49c9) or a "Sunset Gradient." Use `xl` (1.5rem) roundedness.
- **Secondary:** `surface-container-highest` (#dbdde3) with `on-surface` text. No border.
- **Tertiary:** Transparent background with `secondary` text.

### Cards & Lists
**Forbid the use of divider lines.** Use the spacing scale (`spacing.4` or `spacing.6`) to create separation. In transaction lists, use `surface-container-lowest` for the entire list block, and use a subtle `surface-container` background on the leading icon (e.g., Merchant Logo) to create a "pocket" for the imagery.

### Financial Chips
Use `tertiary-fixed` (#ff9817) for positive AI insights and `secondary-fixed` (#cfcdff) for neutral categories. All chips use `full` (9999px) roundedness and `label-md` typography.

### Input Fields
Inputs should not be "boxes." Use a `surface-container-low` background with a `md` (0.75rem) corner radius. Upon focus, transition the background to `surface-container-lowest` and add a "Ghost Border" of `secondary` at 20% opacity.

---

## 6. Do's and Don'ts

### Do:
- **Do** use `display-lg` for the "Current Balance" to make it the undisputed anchor of the page.
- **Do** use vibrant gradients (Sunset Orange to Purple) for AI-generated wealth-tracking graphs.
- **Do** leverage the `xl` and `lg` corner radius values to make the app feel approachable and modern.
- **Do** use "nested" white space: more space between sections (`spacing.10`) than between items within a section (`spacing.3`).

### Don't:
- **Don't** use black (#000000) for text. Always use `on-surface` (#2d2f33) to maintain the soft, high-end aesthetic.
- **Don't** use 1px dividers to separate transactions. Use vertical rhythm and color shifts.
- **Don't** use traditional "Material Design" drop shadows. Stick to the ambient, tinted shadows defined in Section 4.
- **Don't** clutter the screen. If a piece of data isn't vital to the "current" financial story, move it to a sub-page.
