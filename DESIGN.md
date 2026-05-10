```markdown
# Design System Specification: The Curated Folio

## 1. Overview & Creative North Star
This design system moves away from the sterile, "template-first" look of traditional inventory management. For a stationery brand like this, the interface should feel as tactile and premium as the paper and pens it tracks. 

**Creative North Star: The Curated Folio**  
The vision is to treat the UI as a series of meticulously organized, high-end editorial layouts. We achieve this by breaking the rigid, boxed-in grid of traditional software. We utilize intentional asymmetry, overlapping layers, and high-contrast typography to create a digital workspace that feels like a professional studio desk. We replace "borders" with "depth," ensuring the system feels expansive, breathable, and authoritative.

---

## 2. Colors & Tonal Depth
The palette is rooted in the deep tradition of Talavera Blue and the vibrant energy of Cempasúchil Orange, but executed with a modern, sophisticated restraint.

### The Palette
- **Primary (Talavera):** `primary_container` (#0055a4) serves as our brand anchor.
- **Accent (Cempasúchil):** `secondary_container` (#fd9000) is reserved strictly for high-priority actions and state changes.
- **Neutral Base:** `background` (#f9f9f9) provides a crisp, warm-white canvas.

### The "No-Line" Rule
Designers are **prohibited** from using 1px solid borders to section off content. Traditional lines create visual "noise" that clutters the UI. Instead:
- Define boundaries through background shifts using `surface_container_low` (#f3f3f3) against the `surface` (#f9f9f9).
- Use white space as a structural element, not just a gap.

### Surface Hierarchy & Nesting
Treat the UI as physical layers of fine paper. 
- **Level 0 (Base):** `surface` (#f9f9f9)
- **Level 1 (Sectioning):** `surface_container` (#eeeeee) for sidebar or background groupings.
- **Level 2 (Active Elements):** `surface_container_lowest` (#ffffff) for primary cards and content areas.

### The "Glass & Gradient" Rule
To elevate the "Modern" requirement, floating modals and navigation overlays must use **Glassmorphism**:
- Apply `surface_container_lowest` at 85% opacity with a `24px` backdrop blur.
- Use a subtle linear gradient on primary CTAs: `primary` (#003e7a) to `primary_container` (#0055a4) at a 135-degree angle to give buttons a "gem-like" Talavera finish.

---

## 3. Typography
We use a high-contrast pairing to balance industrial efficiency with editorial elegance.

- **Display & Headlines:** `plusJakartaSans`. This typeface brings a modern, geometric character. Use `display-lg` and `headline-md` for data summaries to make inventory numbers feel like a high-end magazine spread.
- **Body & Labels:** `workSans`. Chosen for its exceptional legibility at small scales. Use `body-md` for general inventory lists and `label-sm` for metadata.
- **The Hierarchy Rule:** Never use more than three font weights on a single screen. Contrast should be achieved through scale (e.g., a `display-sm` title next to a `body-sm` description) rather than bolding everything.

---

## 4. Elevation & Depth
In this system, depth is a functional tool, not a stylistic flourish.

- **The Layering Principle:** Achieve lift by stacking. Place a `surface_container_lowest` (White) card atop a `surface_container_low` (Light Gray) background. This creates a "soft lift" that is easier on the eyes than heavy shadows.
- **Ambient Shadows:** Shadows must be felt, not seen. Use `on_surface` (#1a1c1c) at 6% opacity with a `32px` blur and `8px` Y-offset. This mimics natural light in a bright studio.
- **The Ghost Border Fallback:** If a border is required for accessibility (e.g., in high-contrast modes), use `outline_variant` at 15% opacity. Never use 100% opaque lines.
- **Tactile Roundedness:** Use the `xl` (0.75rem) corner radius for main cards to suggest a soft, high-end paper feel. Use `sm` (0.125rem) for small UI elements like checkboxes to maintain a professional "edge."

---

## 5. Components

### Cards & Lists
- **Rule:** Absolute prohibition of divider lines between list items.
- **Implementation:** Use `16px` of vertical white space to separate items. For nested lists, use a subtle background shift to `surface_container_high` (#e8e8e8) on hover.

### Primary Buttons
- **Style:** Gradient fill (`primary` to `primary_container`), `xl` roundedness. 
- **Interaction:** On hover, the button should not get darker; it should "lift" using the Ambient Shadow spec.

### Input Fields
- **Style:** `surface_container_lowest` background with a `Ghost Border`. 
- **Active State:** The border transitions to `primary_container` (#0055a4) at 2px thickness. Labels must use `label-md` in `on_surface_variant`.

### Inventory Chips
- **Style:** Use `secondary_fixed` (#ffdcc1) for "Low Stock" alerts and `primary_fixed` (#d5e3ff) for "New Arrivals." These soft tonal backgrounds keep the vibrant colors from overwhelming the data.

### Progress Bars (Stock Levels)
- Use a "thick-to-thin" intentional asymmetry. A thick track in `surface_container_highest` with a thin, vibrant `primary_container` indicator bar creates a custom, high-end look.

---

## 6. Do’s and Don’ts

### Do
- **Do** use large amounts of white space (minimum 24px) between major functional groups.
- **Do** use `secondary_container` (Orange) only for "Need to Act" items (e.g., out of stock, urgent orders).
- **Do** overlap elements slightly (e.g., a search bar overlapping a header background) to create a layered, custom feel.

### Don’t
- **Don't** use black text. Always use `on_surface` (#1a1c1c) to maintain a soft, premium contrast.
- **Don't** use standard 1px gray borders; it ruins the "Curated Folio" aesthetic.
- **Don't** use "Drop Shadows" that are dark or sharp. If it looks like a shadow from 1995, it’s wrong. It should look like a soft glow.
- **Don't** crowd the data. If an inventory screen feels "full," use a paginated "Sheet" approach rather than shrinking the typography.