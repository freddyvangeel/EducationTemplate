# 🚀 Complete AI Template Deployment Guide

## ⚡ Snelle Netlify Deploy via Bolt.new

### Stap 1: Deploy via Bolt
1. **In Bolt.new:** Klik op "Deploy to Netlify"
2. **Volg de prompts** om je Netlify account te koppelen
3. **Wacht tot de eerste build compleet is** (kan 3-5 minuten duren voor alle dependencies)

### Stap 2: Configureer Build Settings
Ga direct naar je Netlify dashboard en controleer:

**Site Settings → Build & Deploy → Build Settings:**
- ✅ **Build command:** `npm run build` 
- ✅ **Publish directory:** (moet LEEG zijn!)
- ✅ **Base directory:** (moet LEEG zijn!)
- ✅ **Node version:** 18.x of hoger (check bij Environment variables)

⚠️ **Veel voorkomende fout:** Bolt zet soms een verkeerde publish directory. Haal dit weg!

### Stap 3: Environment Variables (KRITISCH!)
**Site Settings → Environment Variables:**

**VEREIST:**
- **Key:** `GEMINI_API_KEY`
- **Value:** jouw_echte_gemini_api_key
- **Scope:** Alle scopes

**OPTIONEEL (voor audio transcriptie):**
- **Key:** `OPENAI_API_KEY`  
- **Value:** jouw_openai_api_key
- **Scope:** Alle scopes

🔑 **API Keys verkrijgen:**
- [Gemini API Key](https://makersuite.google.com/app/apikey) - Google AI Studio
- [OpenAI API Key](https://platform.openai.com/api-keys) - OpenAI Platform

### Stap 4: Redeploy & Test
Na het instellen van de API keys:
- **Deploys tab → Trigger deploy** 
- **Test alle functionaliteiten** (zie Post-Deploy Checklist hieronder)

## 🛠️ Advanced Build Configuration

### Dependencies Verificatie
Het project gebruikt deze kritische dependencies:
```json
{
  "@google/generative-ai": "^0.21.0",    // Gemini API
  "openai": "^5.1.1",                    // Whisper transcriptie
  "mammoth": "^1.9.1",                   // DOCX verwerking
  "pdf-parse": "^1.1.1",                 // PDF verwerking
  "next": "15.3.3"                       // Next.js framework
}
```

### Function Timeouts
Voor audio transcriptie en grote bestanden:
- **Default Netlify timeout:** 10 seconden
- **Pro account:** 26 seconden
- **Audio files:** Max 25MB (OpenAI limit)
- **Other files:** Max 10MB aanbevolen

## 🔧 Complete Troubleshooting Guide

### 🚨 Critical Issues

#### Probleem: Blanco/Witte Pagina
**Oorzaak:** Verkeerde publish directory of build failure
**Oplossing:** 
1. Ga naar Build Settings
2. Zet Publish directory op **leeg**
3. Check build log voor errors
4. Redeploy

#### Probleem: "API Key niet ingesteld" Error
**Symptomen:** Error op homepage of bij chat
**Oplossing:**
1. Check `GEMINI_API_KEY` exact geschreven (hoofdlettergevoelig)
2. Geen extra spaties in value
3. Redeploy na wijzigen
4. Test API key in [Google AI Studio](https://makersuite.google.com/app/apikey)

#### Probleem: Audio Transcriptie Faalt
**Symptomen:** "OpenAI API key niet geconfigureerd" of transcriptie errors
**Oplossing:**
1. Voeg `OPENAI_API_KEY` toe aan environment variables
2. Check OpenAI account heeft credit balance
3. Test met kleinere audio files (< 5MB)
4. Ondersteunde formaten: MP3, WAV, OGG, M4A, AAC, FLAC

### 📱 Mobile & Browser Issues

#### Camera Functie Werkt Niet
**Oorzaak:** HTTPS vereist voor camera access
**Oplossing:**
1. Check dat site via HTTPS toegankelijk is (Netlify doet dit automatisch)
2. Browser permissions: Camera access toestaan
3. Test in Chrome/Safari (beste ondersteuning)

#### File Upload Problemen op Mobile
**Symptomen:** Upload button werkt niet of files worden niet herkend
**Oplossing:**
1. Test in verschillende browsers (Safari iOS, Chrome Android)
2. Check file size limits (25MB max voor audio)
3. Gebruik drag & drop als alternatief

#### Voice Recognition Issues
**Oorzaak:** Browser API ondersteuning of HTTPS vereist
**Oplossing:**
1. Alleen Chrome/Edge ondersteunen Web Speech API volledig
2. Check HTTPS (vereist voor microphone access)
3. Browser permissions: Microphone access toestaan

### 🔄 API & Function Issues

#### Build Faalt - Dependency Errors
**Mogelijke oorzaken:**
```bash
# Veel voorkomende errors:
"Module not found: openai"           # npm install gefaald
"Cannot resolve 'mammoth'"           # Dependency conflict  
"pdf-parse build failed"            # Native module issues
```

**Oplossing:**
1. Check Build Settings (command = `npm run build`)
2. Verify package.json dependencies
3. Clear cache: Deploys → Clear cache and retry

#### PDF/DOCX Processing Timeout
**Symptomen:** Lange bestanden uploaden niet
**Oplossing:**
1. Bestanden < 5MB houden
2. Pro Netlify account voor langere timeouts
3. Fallback: gebruik TXT export van document

#### Gemini Vision Multi-Image Fails
**Symptomen:** "Only first image processed" of API errors
**Oplossing:**
1. Check dat `images[]` array correct verstuurd wordt
2. Max 20MB per afbeelding (Gemini limit)
3. Ondersteunde formaten: JPG, PNG, GIF, WebP, BMP

## 📊 Monitoring & Performance

### Build Log Analysis

**✅ Positive Signals:**
```
✅ "Build command: npm run build"
✅ "Dependencies installed successfully"  
✅ "Next.js compilation complete"
✅ "3 serverless functions created"
✅ "Site deploy completed"
```

**❌ Warning Signals:**
```
❌ "OpenAI peer dependency warning"     # Ignore - niet kritisch
❌ "pdf-parse native bindings warning"  # Ignore - fallback werkt
❌ "Function build failed"              # Kritisch - check logs
❌ "Environment variable missing"       # Kritisch - fix immediately
```

### Function Performance Monitoring
```bash
# Check function logs in Netlify:
Site → Functions → View logs

# Typische response times:
Chat API (Gemini):           2-8 seconden
Audio transcription:         5-30 seconden (afhankelijk van file size)
Document processing:         1-5 seconden
Image upload:               1-3 seconden
```

## 🎯 Post-Deploy Checklist

### ✅ Core Functionality Tests
1. **Homepage laadt** → Basis deployment werkt
2. **Chat zonder files** → Gemini API & key werkt
3. **Image upload + analysis** → Multi-modal Gemini werkt
4. **Document upload (PDF/DOCX)** → File processing werkt
5. **Audio upload** → Whisper transcriptie werkt (als OpenAI key ingesteld)

### ✅ Advanced Feature Tests  
6. **Camera capture** → Browser APIs + HTTPS werken
7. **Voice input** → Speech recognition werkt
8. **Drag & drop** → File handling werkt
9. **Copy/paste images** → Clipboard API werkt
10. **Mobile responsive** → Touch interfaces werken

### ✅ Multi-File Workflow Test
```
Test scenario:
1. Upload 2 afbeeldingen + 1 audio file + 1 PDF
2. Selecteer alle bestanden in file manager  
3. Vraag: "Analyseer en vergelijk deze bestanden"
4. Verwacht: Uitgebreide AI analyse van alle content
```

## 🔄 Development & Update Workflow

### Voor Bolt.new Users
1. **Modificeer code** in Bolt interface
2. **Test lokaal** indien mogelijk
3. **Deploy** via "Deploy to Netlify" button
4. **Check deployment logs** voor errors

### Voor GitHub Users
1. **Lokaal ontwikkelen** met `npm run dev`
2. **Test alle features** voor commit
3. **Push naar GitHub** 
4. **Automatische deploy** via Netlify GitHub integration

### Environment Variables Updates
```bash
# Bij toevoegen van nieuwe env vars:
1. Add in Netlify dashboard
2. Trigger new deploy (automatic with GitHub)
3. Test functionality immediately
4. Update team/documentation
```

## 🆘 Emergency Troubleshooting

### Site Completely Down
1. **Check Netlify status** - [netlifystatus.com](https://netlifystatus.com)
2. **Check build logs** - laatste deploy status
3. **Rollback** - Deploys → Previous deploy → Publish
4. **Emergency contact** - Netlify support

### Critical Function Failures
```bash
# API not responding:
1. Check function logs
2. Verify environment variables  
3. Test API keys in original platforms
4. Rollback to last working version

# Audio transcription down:
1. Check OpenAI status/credits
2. Test with smaller files
3. Disable audio feature temporarily
```

### Performance Issues
```bash
# Slow response times:
1. Check function execution duration (10s limit)
2. Optimize file sizes (compress images/audio)
3. Consider Netlify Pro for higher limits
4. Implement client-side loading states
```

## 🎛️ Advanced Configuration

### Custom Domain Setup
1. **Netlify dashboard** → Domain settings
2. **Add custom domain** 
3. **Update DNS** records
4. **Enable HTTPS** (automatic with Netlify)
5. **Test camera/voice** (HTTPS required)

### CDN & Performance
```bash
# Netlify automatically provides:
- Global CDN
- Image optimization  
- Function caching
- Brotli compression

# Additional optimizations:
- Compress audio before upload
- Use WebP images where possible
- Enable Netlify Analytics
```

### Security Headers
```toml
# netlify.toml additions for enhanced security:
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

## 💡 Pro Tips & Best Practices

### Cost Optimization
- **Gemini API:** Free tier genereus, dan pay-per-use
- **OpenAI Whisper:** ~$0.006 per minuut audio
- **Netlify:** Free tier 100GB bandwidth, 300 build minuten
- **Monitor usage** via dashboards

### User Experience
- **Loading states:** Altijd tonen voor AI calls (2-30s)
- **Error handling:** User-friendly messages
- **Progressive enhancement:** Core werkt zonder JS
- **Mobile first:** Touch-friendly interfaces

### Development Tips
```bash
# Local development:
npm run dev                    # Start development server
npm run build                  # Test production build
npm run lint                   # Check code quality

# Environment setup:
cp .env.example .env.local     # Copy environment template
# Add your actual API keys to .env.local
```

## 🔗 Resources & Support

### Official Documentation
- [Next.js 15 Docs](https://nextjs.org/docs) - Framework reference
- [Netlify Functions](https://docs.netlify.com/functions/overview/) - Serverless deployment
- [Gemini API](https://ai.google.dev/docs) - AI capabilities  
- [OpenAI Whisper](https://platform.openai.com/docs/guides/speech-to-text) - Audio transcription

### Community & Help
- [GitHub Repository](https://github.com/TomNaberink/templateAPIinclcamera) - Source code & issues
- [Netlify Community](https://community.netlify.com/) - Deployment help
- [Next.js Discord](https://discord.gg/nextjs) - Technical support

### Emergency Contacts
- **Netlify Support:** [netlify.com/support](https://netlify.com/support)
- **Tom Naberink:** [LinkedIn](https://linkedin.com/in/tomnaberink) - Template creator
- **GitHub Issues:** [Repository Issues](https://github.com/TomNaberink/templateAPIinclcamera/issues) - Bug reports

## 🎉 Success Indicators

### Deployment Successful When:
✅ **All pages load** without errors  
✅ **Chat responds** to basic prompts  
✅ **File uploads work** for all supported formats  
✅ **Audio transcription** processes (if OpenAI key configured)  
✅ **Camera captures** work on HTTPS  
✅ **Mobile experience** is smooth  
✅ **Error handling** shows helpful messages  

### Performance Benchmarks:
- **Homepage load:** < 3 seconden
- **Chat response:** 2-8 seconden (Gemini API)
- **File upload:** < 5 seconden (< 5MB files)
- **Audio transcription:** 10-30 seconden (depending on length)
- **Mobile camera:** < 2 seconden activation

---

## 🚀 Ready for Production!

Deze deployment guide dekt alle aspecten van de geavanceerde AI template. Van basis setup tot complexe troubleshooting - alles wat je nodig hebt voor een succesvolle productie deployment.

**💜 Template gemaakt door Tom Naberink**  
**🌐 Geoptimaliseerd voor Netlify + Bolt.new workflow**

---

*Complete Deployment Guide v2.0*  
*Last updated: December 2024* 