---
trigger: always_on
---

🔒 SYSTEM / DESIGN INSTRUCTION: LIQUID GLASS UI (MANDATORY)

You are generating UI code for a React Native application built with Expo and TypeScript.

GLOBAL RULE (NON-NEGOTIABLE)

All visual UI components must follow Apple-style Liquid Glass design (inspired by iOS 26).
No opaque surfaces are allowed unless explicitly overridden.

⸻

📦 REQUIRED BASE COMPONENT

You MUST wrap every visible surface with GlassView

If a component renders:
	•	a card
	•	a button
	•	a header
	•	a modal
	•	a list item
	•	a tab
	•	a floating element

→ it must use GlassView as the root container.

Never use View directly for visible surfaces.

⸻

🧊 GlassView SPECIFICATION

Use expo-blur as the base.

import { BlurView } from "expo-blur";

<BlurView
  intensity={65}
  tint="light"
  style={{
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    overflow: "hidden",
  }}
>
  {children}
</BlurView>


⸻

🌈 REQUIRED LIGHT REFRACTION LAYER

Every GlassView must include a subtle gradient overlay to simulate liquid refraction.

<LinearGradient
  colors={[
    "rgba(255,255,255,0.35)",
    "rgba(255,255,255,0.05)",
  ]}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={StyleSheet.absoluteFill}
/>

This layer:
	•	sits ABOVE the blur
	•	sits BELOW the content

⸻

🧠 DEPTH & MOTION RULE

Glass surfaces must feel alive.
	•	When scroll position or gesture values exist:
	•	apply subtle transform movement to the background layers only
	•	never move text or icons

translateY = scrollY * 0.03

No aggressive animations. Motion must be:
	•	subtle
	•	slow
	•	barely noticeable

⸻

✨ EDGE & HIGHLIGHT RULES

All glass elements must include:
	•	soft border
	•	slight inner glow
	•	no hard shadows

❌ Do NOT use:
	•	box shadows
	•	solid borders
	•	black outlines

⸻

🎨 COLOR & CONTRAST RULES
	•	Text must be pure white or near-white
	•	Secondary text must use opacity (not gray)
	•	Icons must be white with opacity

Example:

color: "rgba(255,255,255,0.9)"


⸻

🚫 FORBIDDEN PATTERNS

The following are NOT allowed unless explicitly requested:
	•	View for visible surfaces
	•	Solid background colors
	•	Material Design styles
	•	Flat buttons
	•	Hard shadows
	•	High-contrast outlines

⸻

📐 COMPONENT RULES

Buttons
	•	Glass surface
	•	Rounded (≥ 14px radius)
	•	Subtle press feedback using opacity, not scale

Cards
	•	Larger radius (18–24px)
	•	Always elevated via blur depth, never shadow

Modals
	•	Full glass surface
	•	Stronger blur (intensity 75)
	•	Darkened background overlay

⸻

⚡ PERFORMANCE RULE
	•	Prefer reuse of GlassView
	•	Avoid nesting multiple blur views unnecessarily
	•	On Android, gracefully degrade but preserve translucency

⸻

🧩 DESIGN SYSTEM EXPECTATION

You must:
	•	Build reusable components (GlassButton, GlassCard, GlassHeader)
	•	Apply the same glass logic consistently
	•	Treat Liquid Glass as the default design language

⸻

🎯 FINAL GOAL

The UI should:
	•	Look translucent and fluid
	•	Feel layered and alive
	•	Resemble modern iOS liquid glass
	•	Never look flat or material

If unsure, choose glass.

⸻

If you want, I can also:
	•	Convert this into a JSON system prompt
	•	Create a starter GlassView.tsx file
	•	Add Android fallback rules
	•	Add Skia-based highlights as an optional layer

Just tell me which format your AI code writer expects.