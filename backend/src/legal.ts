// Hosted legal pages (App Store and Google Play require public URLs): /legal/privacy, /legal/terms, /legal/delete
// Careful templates written to match what the app really does. Have a lawyer review them before launch.
// `npm run legal` writes the same pages as static files into ../store/ so they can be hosted anywhere.

const NAME = process.env.LEGAL_NAME || "Maxim Maslii";
const PLACE = process.env.LEGAL_ADDRESS || "Chișinău, Republic of Moldova";
const SUPPORT = process.env.SUPPORT_EMAIL || "maxim.maslii777@gmail.com";
const UPDATED = "October 6, 2026";
const PACKS = process.env.LEGAL_PRICE_PACKS || "5 figures for US$2.99, 10 figures for US$4.99";
const FREE = process.env.FREE_FIGURES || "2";

type Block = string | string[]; // paragraph, or a bullet list
type Doc = { title: string; intro: string; sections: [string, Block[]][] };

const privacy: Doc = {
  title: "Foldifyer Privacy Policy",
  intro: `Foldifyer is a mobile app that turns a photo of a pet or a person into a printable paper toy template. This policy explains what data the app handles, why, and what choices you have. Foldifyer is operated by ${NAME}, ${PLACE} ("we", "us"). Contact: ${SUPPORT}.`,
  sections: [
    ["1. The short version", [[
      "No account. We never ask for your name, email, phone number or address.",
      "The photo you choose is sent to our server and to our AI provider only to make the figure you asked for. We do not keep the photo.",
      "No advertising, no tracking across apps or websites, no sale of data.",
      "You can delete everything we hold at any time inside the app: More → Delete all my data.",
    ]]],
    ["2. Data we handle", [
      "Device identifier. On first launch the app creates a random identifier and an access token. They are stored on your phone and on our server and link your figures together. They are not tied to your identity.",
      "The photo. When you make a figure, the app sends the photo you chose over an encrypted connection to our server, which passes it to our AI provider, Google (Gemini API), to (a) check that the photo is suitable and (b) draw the printed surfaces of the paper toy. Our server holds the photo in memory for the duration of that request and does not write it to storage.",
      "Figures. The picture generated for each figure (a stylised face and surface textures), a few colour values, the name you typed, the chosen outfit and difficulty. Kept until you delete the figure or all data.",
      "Photos of finished toys. If you photograph your assembled toy to share it, that photo stays on your phone and goes only where you choose to share it. It is not sent to us.",
      "Purchases. Payments are processed by Apple or Google. We receive from our purchase provider (RevenueCat) only which products your device identifier bought. We never see your card or billing details.",
      "Technical data. Our hosting provider and server process your IP address and standard request information to deliver the service and to limit abuse. We do not use it to identify you or to build a profile.",
    ]],
    ["3. What we do not do", [[
      "We do not use face recognition and do not use photos to identify anyone.",
      "We do not use your photos or figures to train AI models, and Google states that data sent through the paid Gemini API is not used to train its models.",
      "We do not use analytics or advertising SDKs and do not collect contacts, location or advertising identifiers.",
      "We do not sell or share personal information for cross-context behavioural advertising.",
    ]]],
    ["4. Why we use data and on what legal basis", [
      "To provide the service you ask for — making, storing and showing your figures (performance of a contract, GDPR Art. 6(1)(b)).",
      "Photos of people: we ask for your explicit consent in the app before a photo is sent for processing (GDPR Art. 6(1)(a)). You can withdraw it at any time by deleting the figure.",
      "To keep the service safe and lawful — checking that a photo is suitable, rate limiting, preventing misuse (legitimate interests, GDPR Art. 6(1)(f), and legal obligations).",
      "To manage purchases and the free figures (performance of a contract).",
    ]],
    ["5. Who processes data for us", [
      "We use the following service providers, each only for the purpose stated:",
      [
        "Google (Gemini API, United States) — photo suitability check and drawing the toy's surfaces. Google states that data sent through the paid Gemini API is not used to train its models and may be retained for a limited period (currently up to 55 days) to detect abuse, after which it is deleted.",
        "Railway (United States) — application hosting.",
        "MongoDB Atlas — database for your device record and figures.",
        "Cloudflare R2 — storage of generated pictures (when enabled).",
        "RevenueCat, Apple and Google — purchases.",
      ],
      "These providers may process data outside your country, including in the United States. Where required, transfers rely on the European Commission's Standard Contractual Clauses or an equivalent mechanism. We may disclose data if the law requires it.",
    ]],
    ["6. How long we keep data", [[
      "The photo: not stored by us (see section 2).",
      "Figures and their pictures: until you delete them or use “Delete all my data”.",
      "Device record with the number of figures used and bought: kept while the app is in use; deleted after 24 months without activity.",
    ]]],
    ["7. Your choices and rights", [
      "In the app you can rename or delete any figure and delete all data held on our server (More → Delete all my data).",
      "Depending on where you live (for example in the EU, EEA, United Kingdom, Switzerland or California) you may have the right to access, correct, delete or receive a copy of your data, to restrict or object to processing, and to withdraw consent. Because the app has no accounts, we can only find your data by your device identifier (shown in More); include it when you write to us. We answer within 30 days.",
      "You may lodge a complaint with your local data-protection authority. In the Republic of Moldova this is the National Center for Personal Data Protection.",
    ]],
    ["8. Other people's photos and children", [
      "Foldifyer is meant to be used by adults (18+), for example parents making paper toys with their family. It is not directed to children and children should not use it on their own.",
      "Use a photo of another person only with that person's permission. Use a photo of a child only if you are the child's parent or legal guardian, or have the parent's or guardian's permission. The app asks you to confirm this before a photo of a person is sent.",
      "Photos in which a person is not dressed are refused automatically and no picture is generated. If you believe a child's data has reached us without permission, contact us and we will delete it.",
    ]],
    ["9. Security", [
      "Connections between the app and our server are encrypted (HTTPS). Access tokens are kept in the phone's secure storage. Pictures are stored under long random identifiers. No system is perfectly secure; if we learn of a breach affecting your data we will inform you and the authorities as the law requires.",
    ]],
    ["10. Changes", ["If we change this policy in a way that matters, we will update the date above and tell you in the app before the change takes effect."]],
    ["11. Contact", [`${NAME}, ${PLACE}. Email: ${SUPPORT}`]],
  ],
};

const terms: Doc = {
  title: "Foldifyer Terms of Use",
  intro: `These terms are an agreement between you and ${NAME}, ${PLACE} ("we", "us") for the Foldifyer mobile app. By using the app you accept them. If you do not agree, do not use the app.`,
  sections: [
    ["1. What Foldifyer is", [
      "Foldifyer makes printable paper toy templates from a photo. The printed surfaces are drawn by artificial intelligence and are a stylised likeness: they can differ from the real pet or person. You print, cut and glue the template yourself; how the finished toy looks depends on your printer, paper and handiwork.",
    ]],
    ["2. Who may use it", [
      "You must be at least 18 years old. Cutting tools and glue are needed to assemble the toys: children should build them only together with an adult. The app works without an account.",
    ]],
    ["3. Your content and acceptable use", [
      "You keep all rights to the photos you add. You give us permission to process them only as needed to provide the service to you.",
      "You agree that you will:",
      [
        "use photos of other people only with their permission, and photos of children only as their parent or guardian or with the parent's or guardian's permission;",
        "never upload nude, sexual or otherwise unlawful images, and not try to make the app produce them;",
        "not use the app to harass, mock, deceive or impersonate anyone;",
        "not make figures of public figures, brands or characters for sale or in a way that infringes someone's rights;",
        "not attempt to break, overload, scrape or reverse-engineer the service, or get around its limits or safety checks.",
      ],
      "Requests that break these rules are refused. We may limit or block access for devices that repeatedly break them.",
    ]],
    ["4. AI-generated pictures and your templates", [
      "The figures are created for your personal, non-commercial use: printing at home, gifts, crafts with family, a classroom. You can report a picture that is offensive or wrong using “Report this picture” on the figure's screen, and we will review it.",
    ]],
    ["5. Free figures and figure packs", [
      `A new user can make ${FREE} figures for free. Free figures print with the app's name, and outfits, stickers, gift boxes, little houses and scenes stay locked.`,
      [
        `Figure packs are one-time purchases (${PACKS}). There is no subscription and nothing renews.`,
        "Buying any pack adds its figures to your device and permanently unlocks all outfits, stickers, gift boxes, little houses and scenes, including ones added later, for every figure you make.",
        "Figures from a pack do not expire. A figure that fails to generate is not counted.",
        "Prices can differ by country and include applicable taxes; the price shown in the app at the time of purchase applies. Payment is charged to your Apple ID or Google Play account when you confirm the purchase.",
        "Purchases are linked to the app installation on your device and can be restored with “Restore purchases”. Refunds are handled by Apple or Google under their policies; statutory consumer rights are not affected.",
      ],
      "We may change prices for future purchases. Purchases you have already made are not affected.",
    ]],
    ["6. Our rights", [
      "The app, its design, template shapes, texts and software belong to us or our licensors. We grant you a personal, non-exclusive, non-transferable, revocable licence to use the app on devices you own or control, under these terms and the store's usage rules.",
    ]],
    ["7. Availability and changes", [
      "We try to keep the service running but do not promise it will always be available or error-free. We may change or discontinue features. If we discontinue the paid service, unused paid figures will be refunded where the law requires it.",
    ]],
    ["8. Disclaimer and liability", [
      "The app is provided “as is”. To the extent the law allows, we give no warranties about how closely a figure resembles the photo or how a printed toy turns out, and we are not liable for paper, ink or other materials used, or for indirect or consequential loss. Take care with scissors, craft knives and glue. Our total liability to you for any claim is limited to the amount you paid for the app in the 12 months before the claim. Nothing in these terms limits liability that cannot be limited by law, or the rights you have as a consumer in your country.",
    ]],
    ["9. Ending use", ["You can stop using the app at any time and delete your data in More. We may suspend access if you seriously or repeatedly break these terms."]],
    ["10. Law and disputes", [
      "These terms are governed by the laws of the Republic of Moldova. If you are a consumer, you also keep the protection of the mandatory laws of the country where you live and may bring a claim in its courts. Please contact us first — most problems can be solved quickly.",
    ]],
    ["11. Apple App Store terms", [
      "If you downloaded the app from the Apple App Store: these terms are between you and us, not Apple. Apple is not responsible for the app or its content, has no obligation to provide maintenance or support, and is not responsible for any claims relating to the app, including product liability, legal or regulatory compliance, consumer protection, or intellectual-property infringement claims. If the app fails to conform to any applicable warranty, you may notify Apple, and Apple may refund the purchase price (if any); to the maximum extent permitted by law Apple has no other warranty obligation. You confirm that you are not located in a country subject to a U.S. Government embargo and are not on any U.S. Government list of prohibited or restricted parties. Apple and its subsidiaries are third-party beneficiaries of these terms and may enforce them against you.",
    ]],
    ["12. Changes to these terms", ["We may update these terms. If a change matters, we will tell you in the app before it takes effect. Continuing to use the app after that date means you accept the new terms."]],
    ["13. Contact", [`${NAME}, ${PLACE}. Email: ${SUPPORT}`]],
  ],
};

const del: Doc = {
  title: "Delete your Foldifyer data",
  intro: "Foldifyer has no accounts. Everything we store is linked to a random identifier on your phone, and you can delete it yourself in a few seconds.",
  sections: [
    ["Delete everything from inside the app", [[
      "Open Foldifyer and go to the More tab.",
      "Tap “Delete all my data”, then confirm.",
    ], "This immediately and permanently removes from our server all your figures and their pictures."]],
    ["Delete one figure", [["Open the figure → Delete this figure."]]],
    ["If you no longer have the app", [
      `Email ${SUPPORT} and ask for deletion. If you still know your device identifier (shown in More), include it. Records of devices that have not been used for 24 months are deleted automatically.`,
    ]],
    ["What may be kept", [
      "A record of how many figures the device has used and bought (so the free figures cannot be refilled). Our AI provider may hold request data for a limited period (up to 55 days) for abuse monitoring before deleting it.",
    ]],
  ],
};

const DOCS: Record<string, Doc> = { privacy, terms, delete: del };
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function legalPage(doc: string) {
  const d = DOCS[doc];
  if (!d) return null;
  const block = (b: Block) => (Array.isArray(b) ? `<ul>${b.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : `<p>${esc(b)}</p>`);
  const nav = Object.entries(DOCS).filter(([k]) => k !== doc).map(([k, v]) => `<a href="${k}${process.env.LEGAL_STATIC ? ".html" : ""}">${esc(v.title)}</a>`).join(" · ");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(d.title)}</title>
<style>body{font:17px/1.6 -apple-system,Segoe UI,system-ui,sans-serif;max-width:720px;margin:40px auto;padding:0 20px 60px;color:#2B2118;background:#FFF8EE}h1{font-size:30px;line-height:1.2;margin:0 0 6px}h2{font-size:20px;margin:30px 0 8px}p{margin:0 0 12px}ul{margin:0 0 12px;padding-left:22px}li{margin:0 0 6px}small,nav{color:#6B5D4F}a{color:#C2410C}nav{margin-top:36px;font-size:15px}</style></head>
<body><h1>${esc(d.title)}</h1><small>Last updated: ${UPDATED}</small><p style="margin-top:16px">${esc(d.intro)}</p>${d.sections.map(([h, bs]) => `<h2>${esc(h)}</h2>${bs.map(block).join("")}`).join("")}<nav>${nav}</nav></body></html>`;
}

export const legalDocs = Object.keys(DOCS);
/** The same documents as data, for the screen inside the app. */
export const legalData = () => ({ updated: UPDATED, ai: "Google (Gemini API)", docs: DOCS });
