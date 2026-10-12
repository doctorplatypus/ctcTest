# P2C Insights - Path-to-Conversion Analytics & Report Engine

P2C Insights is an advanced multi-touch attribution and conversion journey analytics platform. It provides deterministic sequence modeling, assist metrics, Gemini AI synthesis, and automated executive Google Slides generation.

---

## Features

- **Multi-Touch Attribution**: Compare Linear, First-Touch, Last-Touch, Time-Decay, and Position-Based (U-Shaped) attribution models.
- **Conversion Journey Mapping**: Interactive Sankey and sequence flow visualizers tracking path drops, velocity, and touchpoint depth.
- **AI Attribution Synthesis**: Server-side Gemini intelligence synthesizing channel efficiencies, conversion drivers, and strategic budget recommendations.
- **Executive Presentation Generator**: Automated creation of formatted Google Slides decks and an interactive in-app slide deck viewer with HTML export.

---

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Recharts
- **Backend**: Node.js, Express, tsx, esbuild
- **AI & Integrations**: Google Gen AI SDK (`@google/genai`), Google Slides API, Google Drive API

---

## Getting Started

### Prerequisites
- Node.js 18+ installed

### Installation
```bash
# Clone the repository
git clone <your-repo-url>
cd p2c-insights

# Install dependencies
npm install
```

### Environment Variables
Copy `.env.example` to `.env` and fill in your keys:
```bash
cp .env.example .env
```
Key configuration:
- `GEMINI_API_KEY`: Your Google Gemini API key (optional; deterministic attribution engine acts as an instant fallback).
- `GOOGLE_CLIENT_ID`: Your Google OAuth 2.0 Web Client ID for Google Slides export.

### Running in Development
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production
```bash
npm run build
npm start
```
