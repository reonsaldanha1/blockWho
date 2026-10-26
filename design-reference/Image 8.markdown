---
name: Zenith Monolith
colors:
  surface: '#131315'
  surface-dim: '#131315'
  surface-bright: '#39393b'
  surface-container-lowest: '#0e0e10'
  surface-container-low: '#1c1b1d'
  surface-container: '#201f22'
  surface-container-high: '#2a2a2c'
  surface-container-highest: '#353437'
  on-surface: '#e5e1e4'
  on-surface-variant: '#c4c7c8'
  inverse-surface: '#e5e1e4'
  inverse-on-surface: '#313032'
  outline: '#8e9192'
  outline-variant: '#444748'
  surface-tint: '#c6c6c7'
  primary: '#ffffff'
  on-primary: '#2f3131'
  primary-container: '#e2e2e2'
  on-primary-container: '#636565'
  inverse-primary: '#5d5f5f'
  secondary: '#c6c5cf'
  on-secondary: '#2f3038'
  secondary-container: '#4a4b53'
  on-secondary-container: '#bcbbc5'
  tertiary: '#ffffff'
  on-tertiary: '#690003'
  tertiary-container: '#ffdad5'
  on-tertiary-container: '#ca0a0f'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c7'
  on-primary-fixed: '#1a1c1c'
  on-primary-fixed-variant: '#454747'
  secondary-fixed: '#e3e1ec'
  secondary-fixed-dim: '#c6c5cf'
  on-secondary-fixed: '#1a1b22'
  on-secondary-fixed-variant: '#46464e'
  tertiary-fixed: '#ffdad5'
  tertiary-fixed-dim: '#ffb4aa'
  on-tertiary-fixed: '#410001'
  on-tertiary-fixed-variant: '#930005'
  background: '#131315'
  on-background: '#e5e1e4'
  surface-variant: '#353437'
typography:
  display:
    fontFamily: Space Grotesk
    fontSize: 56px
    fontWeight: '600'
    lineHeight: 60px
    letterSpacing: -0.04em
  display-mobile:
    fontFamily: Space Grotesk
    fontSize: 38px
    fontWeight: '600'
    lineHeight: 42px
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '500'
    lineHeight: 38px
    letterSpacing: -0.03em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 26px
    fontWeight: '500'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 22px
    fontWeight: '500'
    lineHeight: 28px
    letterSpacing: -0.02em
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.01em
  mono-metric:
    fontFamily: JetBrains Mono
    fontSize: 28px
    fontWeight: '500'
    lineHeight: 32px
    letterSpacing: -0.02em
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.06em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 12px
    letterSpacing: 0.08em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-lg: 1.5rem
  margin: 1rem
  margin-md: 2rem
  margin-lg: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system embodies radical digital intentionality, drawing direct cues from mindful screen-time blockers and Nothing OS's mechanical, transparent minimalism. It rejects visual clutter, gamified dopamine loops, and heavy ornamentation in favor of absolute clarity, purpose, and focus.

### Personality & Demeanor
- **Radical Reduction:** The interface feels quiet, disciplined, and utilitarian. Every element on the canvas serves an explicit function.
- **Atmospheric Quietude:** Uses boundless pitch-black voids to calm optical fatigue and discourage compulsive screen scanning.
- **Tactile Precision:** Physical metaphors are expressed through sharp micro-borders, clean matrix alignments, and purposeful state shifts rather than artificial drop shadows or skeumorphic gloss.

### Target Audience & Emotional Impact
Designed for high-agency digital minimalists, programmers, writers, and individuals actively reducing screen dependency. The UI evokes a sense of tranquil control, monastic discipline, and pristine mechanical engineering.

## Colors

The palette is strictly zero-saturation monochrome with a single, highly deliberate emergency status accent.

- **Canvas & Depths:** Pure deep black (`#000000`) forms the base layer, while elevated planes use Obsidian Zinc (`#09090B` and `#18181B`).
- **Structure & Demarcation:** Subtle tactile boundaries leverage `#27272A` and semi-transparent white overlays (`rgba(255, 255, 255, 0.08)` to `rgba(255, 255, 255, 0.15)`).
- **Typography & Interaction:** Pure stark white (`#FFFFFF`) commands high-priority foreground hierarchy, tempered by muted mid-tone zinc (`#71717A`) for passive or secondary contexts.
- **Functional Accent:** Electric Crimson (`#FF3B30`) is reserved strictly for destructive actions, timer limits, urgent blockers, and critical interruptions. Amber (`#F59E0B`) and Emerald (`#10B981`) remain isolated to live operational metrics and strict pass/fail states.

## Typography

The typographic hierarchy juxtaposes geometric structural headlines with surgical monospace accents.

- **Headlines (Space Grotesk):** Engineered, modern, and austere. Tracking is kept tightly negative for titles and displays to produce a monolithic typographic block.
- **Body & Prose (Geist):** Clean, neutral, and low-fatigue. Used for system messaging, long-form configurations, and descriptions.
- **Labels, Telemetry & Matrix Indicators (JetBrains Mono):** All timestamps, lock intervals, statistics, and category pills leverage monospaced figures set in uppercase tracking to invoke dot-matrix readouts and industrial hardware panels.

## Layout & Spacing

The system enforces a fluid responsive layout governed by strict mathematical rhythm. Whitespace serves as functional isolation rather than decorative luxury.

### Grid & Form Factors
- **Mobile (<768px):** Single-column fluid view with `1rem` margin and `1rem` column gutters. Interactive elements align to thumb reach zones with sticky low-profile navigation bars.
- **Tablet (768px - 1024px):** 6-column grid with `2rem` outer margins. Cards snap into 2-up or 3-up configurations.
- **Desktop (>1024px):** Centered max-width frame of `840px` for focused console tasks or a 12-column structure with `3rem` margins for analytical views. 

### Spacing Philosophy
Rhythm scales on an exact 4px/8px base factor. Margins between disconnected operational groups should default to `space-xl` (`2.5rem`) to create intentional pause and prevent visual density overload.

## Elevation & Depth

This design system avoids blurred drop shadows and multi-layered light simulations entirely. Depth is structural, mechanical, and planar.

- **Tonal Stepping:** True depth is communicated through stepped dark-surface value increases: base screen at `#000000`, card and pill containers at `#09090B`, nested modules or hovered states at `#18181B`.
- **Low-Contrast Outlines:** Surfaces are bounded with a persistent 1px crisp outline at `rgba(255, 255, 255, 0.08)`. Focused or active components transition this boundary to `rgba(255, 255, 255, 0.25)`.
- **Frosted Translucency:** Modal sheets and sticky bars use a translucent substrate (`rgba(9, 9, 11, 0.85)`) coupled with a heavy backdrop blur (`backdrop-blur-md`), keeping background context recognizable while neutralizing distraction.

## Shapes

The interface balances continuous pill enclosures (`rounded-full`) against taut rectangular structural framing.

- **Interactive Nodes:** Buttons, input shells, status badges, and chip filters are rendered as rounded pills (`rounded-full`). This references physical control toggles and creates tactile targets.
- **Containers & Boundary Panes:** Surface cards, dialog panels, and viewports utilize `rounded-2xl` (`1.25rem`) to soften structural layouts without losing technical sharpness.
- **Micro Elements:** Check indicators, sliders, and progress ticks employ either sharp or subtly curved terminals (`0.125rem` to `0.25rem`) to retain an engineered instrument feel.

## Components

### Buttons
- **Primary:** Pure white fill (`#FFFFFF`) with pitch-black text (`#000000`), `rounded-full`, uppercase monospace label (`label-md`). Hover state softens to `#E4E4E7` with zero translation.
- **Secondary / Ghost:** Transparent background with `border border-white/15`, text in pure white (`#FFFFFF`), `rounded-full`. Active state shifts background to `#18181B`.
- **Emergency / Destructive:** Muted crimson fill (`#FF3B30`) or ghost variant with an electric red outline and text (`#FF3B30`).

### Chips & Badges
- Pill-shaped (`rounded-full`), padding `0.25rem 0.75rem`, monospace tracking.
- Inactive: `#18181B` fill with `#71717A` typography.
- Active: `#FFFFFF` fill with `#000000` text, or accompanied by a 4px dot-matrix indicator light.

### Cards & Group Panels
- Surface fill `#09090B`, surrounded by a continuous `1px` border of `rgba(255, 255, 255, 0.08)`.
- Internal element spacing defaults to `space-md` (`1rem`). Hover states elevate subtly via border transition to `rgba(255, 255, 255, 0.2)`.

### Inputs & Toggles
- **Inputs:** Pill container, `#09090B` interior, border `rgba(255, 255, 255, 0.12)`. Placeholder text in `#71717A`. Active focus transitions outline to `#FFFFFF` with no glow.
- **Toggles:** Physical pill track (`#18181B`), sliding thumb in `#71717A` when off, transitioning to `#FFFFFF` when engaged.

### Checkboxes & Radios
- Monolithic geometry: Radios are concentric circles; checkboxes are rounded squares (`0.25rem`). Unselected state is bordered transparently (`border-white/20`); selected state is solid white fill with inverted black glyph.

### Specialized Focus Modules
- **Timer & Countdown Rings:** Monoline circular SVGs with single-pixel tracking arcs and centered `mono-metric` figures.
- **Lockout Screen Banners:** High-contrast full-bleed modular banners with mono dot patterns, emphasizing time remaining and intentional friction barriers.