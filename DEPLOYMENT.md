# 🚀 Netlify Deployment Guide

## ⚡ Snelle Netlify Deploy via Bolt

### Stap 1: Deploy via Bolt
1. **In Bolt.new:** Klik op "Deploy to Netlify"
2. **Volg de prompts** om je Netlify account te koppelen
3. **Wacht tot de eerste build compleet is** (kan 2-3 minuten duren)

### Stap 2: Configureer Build Settings
Ga direct naar je Netlify dashboard en controleer:

**Site Settings → Build & Deploy → Build Settings:**
- ✅ **Build command:** `npm run build` 
- ✅ **Publish directory:** (moet LEEG zijn!)
- ✅ **Base directory:** (moet LEEG zijn!)

⚠️ **Veel voorkomende fout:** Bolt zet soms een verkeerde publish directory. Haal dit weg!

### Stap 3: Environment Variables (KRITISCH!)
**Site Settings → Environment Variables:**
- **Key:** `GEMINI_API_KEY`
- **Value:** jouw_echte_gemini_api_key
- **Scope:** Alle scopes

🔑 **Verkrijg je API key:** [Google AI Studio](https://makersuite.google.com/app/apikey)

### Stap 4: Redeploy
Na het instellen van de API key:
- **Deploys tab → Trigger deploy** 
- Of maak een kleine code wijziging en push naar GitHub

## 🔧 Troubleshooting Guide

### Probleem: Blanco/Witte Pagina
**Oorzaak:** Verkeerde publish directory
**Oplossing:** 
1. Ga naar Build Settings
2. Zet Publish directory op **leeg**
3. Redeploy

### Probleem: "API Key niet ingesteld" Error
**Oorzaak:** Environment variable niet correct ingesteld
**Oplossing:**
1. Check of `GEMINI_API_KEY` exact zo geschreven is (hoofdlettergevoelig)
2. Check of de waarde geen extra spaties heeft
3. Redeploy na wijzigen

### Probleem: Build Faalt
**Mogelijke oorzaken:**
- **Node versie:** Dit project vereist Node 18+
- **Build command:** Moet `npm run build` zijn, niet `npm start`
- **Dependencies:** Check het build log voor module errors

**Oplossing:**
1. Check Build Settings (command = `npm run build`)
2. Check of alle dependencies in package.json staan
3. Bekijk het volledige build log voor specifieke errors

### Probleem: API Routes Werken Niet (404 op /api/*)
**Oorzaak:** Next.js API routes niet correct omgezet naar Netlify Functions
**Oplossing:**
1. Check of `netlify.toml` bestand aanwezig is
2. Zorg dat publish directory leeg is
3. Next.js 15 vereist de nieuwste Netlify build image

### Probleem: PDF Upload Werkt Niet
**Oorzaak:** pdf-parse library kan problemen hebben in Netlify Functions
**Oplossing:**
1. Test eerst met kleinere PDF bestanden (< 5MB)
2. Check function logs in Netlify voor specifieke errors
3. Gebruik alleen .docx bestanden als workaround

## 📊 Build Log Analysis

### Positieve Signalen in Build Log:
```
✅ "Build command: npm run build"
✅ "Dependency installation completed"
✅ "Next.js build output"
✅ "Deploying functions from .netlify/functions"
✅ "Site deploy completed"
```

### Waarschuwingssignalen:
```
❌ "Build command failed"
❌ "Module not found"
❌ "Function build failed"
❌ "No publish directory specified" (dit is eigenlijk goed!)
```

## 🎯 Post-Deploy Checklist

Na succesvolle deploy, test deze functionaliteiten:

1. **Homepage laadt** → Basis deployment werkt
2. **Chat functie** → API key en Gemini integratie werkt  
3. **File upload** → Serverless functions werken
4. **Voice input** → Browser API's werken (alleen op HTTPS)
5. **Responsive design** → CSS/Tailwind correct geladen

## 🔄 Development Workflow

### Voor verdere ontwikkeling:
1. **Lokaal ontwikkelen** met `npm run dev`
2. **Commit naar GitHub** (indien gekoppeld)
3. **Automatische deploy** via Netlify
4. **Of:** Gebruik Bolt's "Re-deploy" functie

### Tips:
- Test altijd lokaal voordat je deployed
- Check console errors in browser developer tools
- Use Netlify function logs voor backend debugging

## 💡 Pro Tips

### Performance:
- Gemini API calls kunnen 2-10 seconden duren
- PDF parsing kan memory-intensief zijn
- Voice recognition werkt alleen via HTTPS

### Security:
- API keys blijven server-side via environment variables
- Netlify Functions draaien in een veilige sandbox
- Input validatie is ingebouwd in de API routes

### Monitoring:
- Check Netlify Analytics voor usage patterns
- Monitor Function logs voor errors
- Set up Netlify notifications voor build failures

## 🆘 Hulp Nodig?

### Waar je hulp kunt vinden:
1. **Dit project's README.md** - Basis setup instructies
2. **Netlify documentatie** - [docs.netlify.com](https://docs.netlify.com)
3. **Next.js + Netlify guide** - [nextjs.org/docs](https://nextjs.org/docs)
4. **Bolt community** - Voor Bolt-specifieke vragen

### Common Support Vragen:
- **Environment variables werken niet:** Altijd redeploy na toevoegen
- **Functions timeout:** Netlify Functions hebben 10s limit
- **Build fails:** Check exact error in build log

---

**🎉 Veel succes met je deployment!** Dit template is geoptimaliseerd voor Netlify maar werkt ook uitstekend op Vercel als backup optie. 