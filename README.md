# 🚀 Gemini API Template - Next.js

> Een ultra-lean, professionele template om direct te starten met Gemini API projecten.
>
> **Gemaakt door Tom Naberink**

Een direct bruikbare Next.js template met een veilige Gemini API integratie en een ingebouwde API key tester. Ideaal als startpunt voor jouw innovatieve AI-projecten, speciaal gericht op het onderwijs!

## ✨ Features

- 💜 **Moderne & Clean UI**: Strakke paarse interface met Tailwind CSS.
- 🔒 **Veilige API Key Setup**: Gemini API keys blijven server-side en worden direct getest.
- ⚡ **Direct Starten**: Clone, configureer je API key, test, en begin met bouwen!
- 📱 **Responsive Design**: Werkt perfect op alle apparaten.
- 🚀 **Next.js 15 & TypeScript**: Gebouwd met de nieuwste technologieën.
- 🛠️ **Ultra-Lean**: Geen overbodige code, enkel de essentials.
- 💡 **Onderwijs Focus**: Met een call-to-action gericht op onderwijsinnovatie.
- 🌐 **Netlify Ready**: Geoptimaliseerd voor Bolt + Netlify deployment.

## 🚀 Snelle Start: In 4 Stappen naar Gemini!

### Stap 1: Verkrijg een Gemini API Key
Ga naar [Google AI Studio](https://makersuite.google.com/app/apikey) en maak je gratis API key aan.

⚠️ **Let op**: Je kunt gratis en risicovrij oefenen met de Gemini API. Daarnaast kun je $300 gratis budget krijgen. Als dat op is, moet je het koppelen aan je creditcard. Zorg ervoor dat je weet wat je doet op dat moment!

### Stap 2: Configureer je API Key Lokaal
Maak een `.env.local` bestand in de root van je project en voeg je API key toe:

```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
```
Vervang `your_actual_gemini_api_key_here` met jouw echte API key.

### Stap 3: Test je API Key Direct
Start de development server:
```bash
npm install # Als je dit nog niet gedaan hebt
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in je browser. Je kunt nu direct je API key testen met de ingebouwde test-chatbot!

### Stap 4: Bouwen maar!
Wat ga jij maken om het onderwijs te verbeteren? De Gemini API staat tot je beschikking!

## 🌐 Netlify Deployment (via Bolt)

### ⚡ Quick Deploy via Bolt.new:
1. **In Bolt:** Klik "Deploy to Netlify"
2. **Check Build Settings:** Ga naar Netlify → Site Settings → Build & Deploy
   - ✅ Build command: `npm run build` 
   - ✅ Publish directory: (leeg laten!)
   - ✅ Base directory: (leeg laten!)
3. **Add Environment Variable:** Site Settings → Environment Variables
   - Key: `GEMINI_API_KEY`
   - Value: jouw_echte_api_key
4. **Redeploy:** Trigger nieuwe build na het toevoegen van de API key

### 🚨 Veel voorkomende Netlify problemen:

| Probleem | Oorzaak | Oplossing |
|----------|---------|-----------|
| **Blanco site** | Verkeerde publish directory | Zet publish directory op leeg |
| **API errors** | GEMINI_API_KEY ontbreekt | Check environment variables + redeploy |
| **Build fails** | Verkeerde build command | Zet build command op `npm run build` |
| **404 op API routes** | Next.js routing issue | Check of `netlify.toml` aanwezig is |

📋 **Gedetailleerde troubleshooting:** Zie [DEPLOYMENT.md](./DEPLOYMENT.md) voor een complete gids.

## 🛠️ API Gebruik (Voorbeeld)

Je Gemini API is beschikbaar via een `POST` request naar `/api/chat`.

```javascript
async function callGemini(userMessage) {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: userMessage }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Er is een fout opgetreden');
    }

    const data = await response.json();
    return data.response; // Dit is het antwoord van Gemini
  } catch (error) {
    console.error("Fout bij het aanroepen van de Gemini API:", error);
    // Handel de fout hier af in je UI
    return null;
  }
}

// Voorbeeld aanroep:
// callGemini("Leg kwantumfysica uit in simpele termen").then(aiResponse => {
//   if (aiResponse) {
//     console.log("Gemini:", aiResponse);
//   }
// });
```

## 📁 Project Structuur (Lean & Mean)

```
.
├── .env.local                # 🔑 Jouw API Key (zelf aanmaken!)
├── .env.example              # 📝 Template voor environment variables
├── .nvmrc                    # 🔧 Node version voor Netlify
├── netlify.toml              # 🌐 Netlify configuratie
├── DEPLOYMENT.md             # 📋 Deployment troubleshooting guide
├── .gitignore                # Beschermt gevoelige bestanden
├── next.config.js            # Next.js configuratie (dev UI uit)
├── package.json              # Project dependencies
├── README.md                 # Deze documentatie
├── src/
│   ├── app/
│   │   ├── api/chat/route.ts # 🔥 KERN: Veilige Gemini API endpoint
│   │   ├── globals.css       # Tailwind CSS basis
│   │   ├── layout.tsx        # Hoofd layout (hydration fix)
│   │   └── page.tsx          # De template startpagina
│   └── components/
│       └── TestChatBot.tsx   # 💬 Ingebouwde API Key Tester
└── tsconfig.json             # TypeScript configuratie
```

## 🎨 Customization

### Gemini Model
Het huidige model is `gemini-2.5-flash-preview-05-20`. Je kunt dit aanpassen in `src/app/api/chat/route.ts`:
```typescript
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-05-20' });
```
Andere modellen zoals `gemini-1.5-pro-latest` zijn ook beschikbaar. Check de [Google documentatie](https://ai.google.dev/models/gemini) voor de meest recente lijst.

### Styling
De UI gebruikt Tailwind CSS met een paars kleurenschema. Pas `src/app/globals.css` en de Tailwind classes in de `.tsx` bestanden aan voor een eigen look.

## 🚀 Deployment

### Netlify (via Bolt.new - Aanbevolen)
1. **In Bolt:** Gebruik "Deploy to Netlify" functie
2. **Environment Variables:** Voeg `GEMINI_API_KEY` toe in Netlify dashboard
3. **Check Settings:** Build command = `npm run build`, Publish directory = leeg
4. **Troubleshoot:** Gebruik [DEPLOYMENT.md](./DEPLOYMENT.md) bij problemen

### Vercel (Alternatief)
1. Push je code naar GitHub.
2. Ga naar [Vercel](https://vercel.com) en importeer je repository.
3. Voeg je `GEMINI_API_KEY` toe als Environment Variable in de Vercel projectinstellingen.
4. Deploy!

### Andere Platforms
Zorg ervoor dat je platform Node.js 18+ ondersteunt en je environment variabelen kunt instellen.
- Build command: `npm run build`
- Start command: `npm start`

## 🛡️ Ingebouwde Robuustheid
- **Veilige API Keys**: Keys worden server-side gehouden.
- **Input Validatie**: Basisvalidatie op de API route.
- **Netlify Optimized**: `netlify.toml` en `.nvmrc` voor foutloze deploys.
- **Development UI Uitgeschakeld**: `devIndicators: false` in `next.config.js` voor een clean dev ervaring.
- **Hydration Warning Onderdrukt**: `suppressHydrationWarning` op `<body>` in `layout.tsx` voor compatibiliteit met browser extensies.
- **Verbeterde Error Handling**: Duidelijke foutmeldingen voor debugging.

## 🤝 Bijdragen
Voel je vrij om deze template te forken, te verbeteren en pull requests in te dienen!

---

**💜 Gemaakt met passie door Tom Naberink. Veel bouwplezier!** 