---
name: Aetheric Analytics
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#ccc3d8'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#958da1'
  outline-variant: '#4a4455'
  surface-tint: '#d2bbff'
  primary: '#d2bbff'
  on-primary: '#3f008e'
  primary-container: '#7c3aed'
  on-primary-container: '#ede0ff'
  inverse-primary: '#732ee4'
  secondary: '#44e2cd'
  on-secondary: '#003731'
  secondary-container: '#03c6b2'
  on-secondary-container: '#004d44'
  tertiary: '#ffb95f'
  on-tertiary: '#472a00'
  tertiary-container: '#905b00'
  on-tertiary-container: '#ffe1c0'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#eaddff'
  primary-fixed-dim: '#d2bbff'
  on-primary-fixed: '#25005a'
  on-primary-fixed-variant: '#5a00c6'
  secondary-fixed: '#62fae3'
  secondary-fixed-dim: '#3cddc7'
  on-secondary-fixed: '#00201c'
  on-secondary-fixed-variant: '#005047'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Geist
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 14px
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 32px
  xl: 48px
  gutter: 20px
  margin-page: 32px
---

## Brand & Style

This design system embodies a **Futuristic Corporate** aesthetic, blending high-utility data density with an atmospheric, immersive interface. The brand personality is precise, intelligent, and visionary, targeting data-driven decision-makers in fintech, SaaS, and advanced analytics.

The visual narrative is driven by **Glassmorphism** and depth. Surfaces are treated as translucent layers floating over a deep, cosmic void, utilizing background blurs and subtle inner glows to create a sense of physical space. Vibrant gradients provide "energy" to the data, contrasting sharply against the dark foundations to ensure immediate legibility and visual delight.

## Colors

The palette is anchored in a **Deep Navy/Black** foundation to minimize eye strain and maximize the "glow" of data elements. 

- **Primary (Electric Violet):** Used for primary actions, active states, and top-tier data trends.
- **Secondary (Cyan/Teal):** Used for growth indicators, positive success states, and secondary data categories.
- **Tertiary (Amber):** Reserved for highlights, warnings, or distinct third-party data streams.
- **Neutral:** A spectrum of slate and navy tones to provide structural hierarchy without breaking the dark-mode immersion.

Data visualizations should utilize linear gradients between these core hues (e.g., Violet to Cyan) to represent fluid movement and connectivity.

## Typography

The typography system relies on **Inter** for its neutral, highly legible grotesque qualities, ensuring complex data remains clear. For technical details, monospaced or high-precision fonts like **Geist** are used in labels to evoke a "developer-tool" level of precision.

Hierarchy is established through weight rather than just size. Headlines are bold and slightly tracked-in for a modern, compact look. Labels use increased letter spacing and uppercase styling to differentiate metadata from primary content.

## Layout & Spacing

This design system uses a **12-column fluid grid** for the main dashboard area, with a fixed-width sidebar (280px) for navigation. 

- **Density:** The system maintains a medium-high density. Content is packed for efficiency, but "breathing room" is created via 20px gutters and 24px internal card padding.
- **Rhythm:** All spacing must be a multiple of the 4px base unit. 
- **Adaptation:** On mobile, the 12-column grid collapses to a single column. The sidebar transforms into a bottom navigation bar or a hidden drawer. Page margins reduce from 32px to 16px to maximize screen real estate.

## Elevation & Depth

Depth is achieved through **Tonal Layering** and **Backdrop Blurs** rather than traditional heavy shadows.

- **Level 0 (Canvas):** The deepest background (`#020617`), occasionally featuring subtle radial gradients or "starfield" textures.
- **Level 1 (Panels):** Semi-transparent surfaces (`rgba(30, 41, 59, 0.5)`) with a 12px backdrop-blur. These are defined by a 1px solid border (`rgba(255, 255, 255, 0.1)`).
- **Level 2 (Overlays/Tooltips):** Higher opacity surfaces with a subtle outer glow matching the primary accent color (low spread, 10% opacity) to suggest they are "emitting" light.

Interactive elements use a "lift" effect where the border brightness increases and the backdrop blur intensifies upon hover.

## Shapes

The shape language is consistently **Rounded**. This softens the technical nature of the dashboard, making it feel more approachable and modern.

- **Cards/Panels:** 16px (`rounded-lg`) for large containers.
- **Buttons/Inputs:** 8px (`rounded-md`) for standard UI controls.
- **Status Pills/Tags:** Fully rounded (pill-shaped) to distinguish them from actionable buttons.
- **Data Bars:** Rounded caps on all bar charts and progress indicators to maintain the fluid, organic aesthetic of the gradients.

## Components

### Buttons & Controls
Primary buttons feature a full linear gradient (Violet to Purple) with white text. Secondary buttons are "ghost" style with a 1px border. All controls have a subtle inner glow on hover.

### Cards & Panels
Every card must implement `backdrop-filter: blur(12px)`. The border should be a top-down linear gradient (White at 15% opacity to White at 5% opacity) to simulate a light source hitting the top edge.

### Data Visualization
- **Charts:** Use "area" fills with 20% opacity gradients of the stroke color.
- **Pills:** Use for status indicators (e.g., "Live", "Beta"). These should have a subtle pulsing animation for "Live" states.
- **Nodes:** In Sankey or flow diagrams, use rounded rectangles with saturated fills to indicate high-traffic paths.

### Input Fields
Inputs are dark-filled with a subtle border. On focus, the border transitions to the Primary color with a 4px soft outer glow.