# Nurreen Zahia & Associates — website, client portal and admin

Static site (HTML/CSS/vanilla JS, no build step) for a Malaysian law firm serving international clients.

| Page | What it is |
|---|---|
| `index.html` | Public website: firm, practice areas, international clients, people, testimonials, FAQ, consultation form |
| `login.html` / `register.html` | Client and staff sign-in, client sign-up |
| `client.html` | Client portal: case progress, timeline, documents, messages, appointments, invoices, preferences |
| `admin.html` | Chambers admin: dashboard, case-progress board, enquiries, clients, matters, appointments, messages, documents, invoices, settings |

## International features
- Interface in English, Bahasa Melayu, 中文 and العربية (right-to-left layout for Arabic)
- Live chambers-vs-visitor clocks and a time-zone planner showing office hours in the visitor's own time
- Consultation slots offered in the client's time zone (with Shah Alam time alongside)
- Country dialling codes, client time zone and currency stored on every profile
- Invoices billed in MYR, with indicative amounts in 11 currencies (rates editable in admin → Settings)
- Animated world-map backdrop linking Shah Alam to client cities

## Case progress
Each matter moves through six stages (Enquiry → Engagement & KYC → Case review → Pleadings / Negotiation → Hearing / Settlement → Closed).
Admins advance stages, post updates (optionally as internal notes hidden from the client) and set the next key date; the client sees the same tracker and timeline in their portal.

## Running locally
```bash
python -m http.server 5510
```
Then open http://localhost:5510. The sign-in page has one-click sample accounts (seeded in `assets/js/store.js`).

## Status: demo project
Data is stored in the visitor's browser (`localStorage`), so the site runs with no backend and each visitor gets their own copy of the sample data. Use the one-click **Sample client** / **Sample admin** buttons on the sign-in page; admin → Settings → *Reset demo data* restores the original samples.

`supabase/schema.sql` is an optional starting point if the project ever needs a real database.

## Deploying
Static site — import the GitHub repo into Vercel with the default settings (no build command, output directory = repo root). `vercel.json` adds clean URLs and security headers.

## Content to confirm with the firm
- Stats (years, matters, RM value, client countries), testimonials and lawyer bios
- Chinese and Arabic interface translations — have a native speaker review
- Claims about remote signing, enforcement of foreign judgments and payment methods in the FAQ
- Bank / SWIFT details for international transfers
