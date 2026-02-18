# Open Graph Image Specifications

## og-image.png (Primary)
- **Dimensions:** 1200x630px
- **Format:** PNG
- **File Size:** <1MB (recommended <200KB)
- **Color Space:** sRGB
- **Usage:** Facebook, LinkedIn, Twitter, WhatsApp, etc.

### Design Recommendations
1. **Background:** Teal gradient (#0f766e to #0d9488)
2. **Logo:** Kawa Note logo (centered, 200-300px)
3. **Tagline:** "Your notes. Your connections. Only yours." (white text, 48-60px)
4. **Accent:** Cyan connection nodes (#06b6d4) as decorative elements
5. **Padding:** 60px on all sides
6. **Font:** Geist Sans or Inter (bold for tagline)

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    [Kawa Note Logo]                         │
│                                                             │
│        Your notes. Your connections. Only yours.            │
│                                                             │
│                  [Cyan Connection Nodes]                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## og-image-square.png (Alternative)
- **Dimensions:** 800x800px
- **Format:** PNG
- **File Size:** <1MB
- **Usage:** Pinterest, Instagram, Square previews

### Design Recommendations
1. **Background:** Same teal gradient
2. **Logo:** Larger (300-400px)
3. **Tagline:** Shorter or omitted (space constraints)
4. **Accent:** More prominent cyan nodes
5. **Padding:** 80px on all sides

---

## Tools to Create These Images

### Option 1: Figma (Recommended)
1. Create 1200x630 artboard
2. Add teal gradient background
3. Import logo.svg
4. Add text with Geist Sans
5. Export as PNG

### Option 2: Canva
1. Create custom 1200x630 design
2. Use Kawa Note colors
3. Add logo and text
4. Download as PNG

### Option 3: Command Line (ImageMagick)
```bash
# Create OG image from SVG + text
convert -size 1200x630 xc:'#0f766e' \
  -fill white -pointsize 60 -font Geist-Sans-Bold \
  -gravity center -annotate +0+100 "Your notes. Your connections. Only yours." \
  -composite logo.svg -gravity center -composite \
  og-image.png

# Create square variant
convert -size 800x800 xc:'#0f766e' \
  -composite logo.svg -gravity center -composite \
  og-image-square.png
```

### Option 4: Online Tools
- **Figma:** https://figma.com
- **Canva:** https://canva.com
- **Pixlr:** https://pixlr.com
- **Photopea:** https://photopea.com

---

## Testing & Validation

### Before Publishing
1. **Facebook Sharing Debugger:** https://developers.facebook.com/tools/debug/sharing/
2. **Twitter Card Validator:** https://cards-dev.twitter.com/validator
3. **LinkedIn Post Inspector:** https://www.linkedin.com/post-inspector/
4. **WhatsApp Preview:** Send link to yourself
5. **Mobile Preview:** Test on mobile device

### After Publishing
1. Monitor social impressions
2. Track click-through rates
3. Monitor engagement
4. Update if needed (cache clears in 24-48 hours)

---

## File Naming Convention
- `og-image.png` — Primary (1200x630)
- `og-image-square.png` — Square variant (800x800)
- `og-image-mobile.png` — Mobile variant (600x315) [optional]

---

## Integration

### HTML Head
```html
<!-- Open Graph Image -->
<meta property="og:image" content="https://kawanote.app/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:type" content="image/png">
<meta property="og:image:alt" content="Kawa Note - Encrypted Note-Taking Platform">

<!-- Alternative Images -->
<meta property="og:image" content="https://kawanote.app/og-image-square.png">
<meta property="og:image:width" content="800">
<meta property="og:image:height" content="800">
```

---

## Next Steps
1. Design og-image.png (1200x630) using Figma or Canva
2. Design og-image-square.png (800x800) for Pinterest
3. Export as PNG (<1MB each)
4. Upload to frontend/public/
5. Test with social debuggers
6. Monitor performance

---

**Note:** These are placeholder specifications. Actual image creation requires design tools (Figma, Canva, etc.) or command-line tools (ImageMagick, ffmpeg).
