# The Web Branding

A premium, state-of-the-art web branding platform designed with high-end modern aesthetics, dynamic user experiences, and a robust hybrid React/Vite architecture.

---

## 🔗 Live Link
*Live site running at:* [https://web-branding-three.vercel.app/](https://web-branding-three.vercel.app/)
*(Local dev server URL: http://localhost:5173/)*

---

## 📸 Screenshots / Demos
*(Pending user-provided screenshots — please upload them to `/public/` or `/assets/` and we will link them here)*

---

## 📝 Project Description
The Web Branding is a highly premium digital presence platform representing a web branding agency. It includes high-performance service portfolios, interactive custom estimate tools, and a dynamic Team section featuring realistic 3D ID badges that swing, rotate, and respond to mouse drag gestures. 

This project transitions seamlessly between vanilla static pages (for raw speed) and a WebGL-based React environment (for advanced interactive features), ensuring top-tier search engine optimization (SEO) and user engagement.

---

## 🛠️ Tech Stack
*   **Core:** HTML5, CSS3 (Vanilla), JavaScript (ES6+)
*   **Frameworks & Bundlers:** React 18, React DOM, Vite 5
*   **3D Graphics & Physics:** Three.js, `@react-three/fiber` (R3F), `@react-three/drei`, `@react-three/rapier` (3D Physics engine), `meshline` (ribbon geometry)
*   **Aesthetics:** Glassmorphism, CSS Custom Properties (Theming), Custom SVG Micro-Animations

---

## ✨ Key Features
*   **Interactive 3D Physics Lanyards:** Drag, swing, and toss realistic 3D employee ID badges with physics-calculated drag inertia and natural rope joints.
*   **Dynamic Badge Generation:** Employee details, avatars, roles, barcodes, and QR codes are drawn dynamically onto the 3D model's texture atlas at runtime.
*   **Glassmorphic Design Language:** Premium obsidian themes, glowing background ambient orbs, and clean cards.
*   **Zero-Delay Mobile Menus:** Custom cascading dropdown menus optimized to expand and contract with native easing curves.
*   **Unified Estimation Engine:** Integrated interactive cost slider and project scope calculator.
*   **Work In Progress Gateways:** Custom placeholder pages matching the exact aesthetics and canvas background animation of the main site.

---

## 🚀 Local Setup & Run Instructions

Ensure you have [Node.js](https://nodejs.org/) installed, then run the following commands:

```bash
# Clone the repository and navigate to the project directory
cd "Web Branding"

# Install all standard and WebGL dependencies
npm install --legacy-peer-deps

# Start the Vite local development server
npm run dev

# Compile and minify the application for production build
npm run build
```

---

## 🔒 Security Policy
This project enforces strict security safeguards to prevent credential leakage.
*   **Never** commit `.env` or `.env.*` files containing secret keys, tokens, or API credentials.
*   A pre-configured `.gitignore` handles standard secret file exclusions automatically.
*   Always check `git status` or run verification checks before pushing changes.
