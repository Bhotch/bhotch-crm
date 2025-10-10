# 360 Tab Quick Reference Card

## 🎯 Quick Start Guide

### Upload Photos for 3D Model Generation

1. **Navigate to:** Dashboard → 360 Tab
2. **Click:** "Upload Photo(s) - Up to 8" button (blue button, left panel)
3. **Select:**
   - **1 photo** → 360° panorama view only
   - **2-8 photos** → Automatic 3D/4D model generation ✨
4. **Wait:** 2-5 seconds for AI processing
5. **View:** Toggle between "360° View" and "3D Model" at the top

---

## 📸 Best Practices for 3D Models

### Recommended Photo Angles (8 photos)
```
1. Front Left Corner     2. Front Right Corner
3. Left Side Elevation   4. Right Side Elevation
5. Back Left Corner      6. Back Right Corner
7. Overhead/Drone View   8. Roof Detail Close-up
```

### Photo Quality Tips
- ✅ Use 1920x1080 minimum resolution
- ✅ Consistent lighting across all photos
- ✅ Clear, focused images
- ✅ Cover all sides of the house
- ✅ Include one aerial/drone shot if possible
- ❌ Avoid blurry or dark photos
- ❌ Don't use photos with different lighting conditions

---

## 🎮 Navigation Controls

### 360° Panorama View
- **Rotate:** Click & drag
- **Zoom:** Scroll wheel

### 3D Model View
- **Rotate:** Click & drag (left mouse)
- **Pan:** Right-click & drag
- **Zoom:** Scroll wheel
- **Reset:** Double-click

---

## 🎨 Features Available

### Phase 2 Features (Left Panel)
1. **AI Auto-Placement** - Automatic product positioning
2. **Measurement Tools** - Measure roof surfaces
3. **8-Photo Capture (3D)** - Guided photo capture
4. **Cost Estimate** - Calculate project costs
5. **Generate PDF Report** - Professional proposals
6. **Export Image** - Download visualization
7. **Share Visualization** - Share via Web Share API
8. **Image Filters** - Adjust brightness, contrast, saturation

### Product Panel (Right Panel)
1. **Shingles Tab** - Apply Malarkey shingle colors
2. **Lighting Tab** - Design Rime lighting systems

---

## 🚀 Advanced Features

### AI-Powered 3D Generation
- **Method:** AI Depth Estimation
- **Quality Levels:**
  - 2-4 photos → Medium quality
  - 5-7 photos → High quality
  - 8+ photos → Ultra quality
- **Processing Time:** 2-5 seconds
- **Output Format:** GLB (standard 3D model)

### Rendering Features
- Physically Based Rendering (PBR)
- HDR Environment Maps
- Dynamic Sky & Stars
- Real-time Shadows
- Professional Materials

---

## 🔧 Troubleshooting

### Model Not Generating?
- Ensure photos are high resolution (1920x1080+)
- Check that files are valid images (JPG, PNG)
- Try with different photos
- Refresh page and try again

### Console Errors?
- All console errors have been fixed ✅
- If you see any, please report with screenshot

### Performance Issues?
- Close other browser tabs
- Use Chrome or Edge for best performance
- Ensure graphics drivers are updated
- Try with fewer photos (4-6 instead of 8)

---

## 📊 Model Quality Comparison

| Photos | Quality | Processing | Detail Level | Use Case |
|--------|---------|-----------|--------------|----------|
| 1 | 360° Only | Instant | N/A | Quick preview |
| 2-4 | Medium | 2-3 sec | Good | Basic 3D view |
| 5-7 | High | 3-4 sec | Very Good | Professional |
| 8+ | Ultra | 4-5 sec | Excellent | Best quality |

---

## 🎯 Common Workflows

### Quick Visualization (1 photo)
```
Upload 1 photo → View 360° → Apply products → Export
```

### Professional 3D Presentation (8 photos)
```
Upload 8 photos → Wait for 3D generation →
Toggle to "3D Model" → Apply products →
Generate PDF report → Share with client
```

### Sales Pitch Workflow
```
Upload photos → Generate 3D model →
Apply shingles & lighting → Show before/after →
Generate cost estimate → Create PDF →
Share with customer
```

---

## 📱 Keyboard Shortcuts (3D View)

| Key | Action |
|-----|--------|
| Mouse Drag | Rotate |
| Right-Click Drag | Pan |
| Scroll | Zoom |
| Double-Click | Reset View |

---

## 🆘 Need Help?

### Documentation
- Full Summary: [360_TAB_ENHANCEMENT_SUMMARY.md](360_TAB_ENHANCEMENT_SUMMARY.md)
- Code Location: `src/features/visualization360/`

### Key Files
- **3D Generator:** `services/AI3DModelGenerator.js`
- **3D Viewer:** `components/Viewer/House3DModel.jsx`
- **Control Panel:** `components/UI/ControlPanel.jsx`
- **Main Component:** `Visualization360.jsx`

### Report Issues
1. Open browser console (F12)
2. Take screenshot of any errors
3. Note steps to reproduce
4. Check [360_TAB_ENHANCEMENT_SUMMARY.md](360_TAB_ENHANCEMENT_SUMMARY.md) first

---

## ✅ Status Indicators

### Upload Progress
```
10%  → Images uploading
30%  → Compressing images
40%  → AI processing started
80%  → 3D model generated
100% → Ready to view
```

### Success Indicators
- ✅ Green checkmark on upload button
- ✅ "3D Model Generated" card appears
- ✅ "3D Model" toggle button becomes active
- ✅ Success notification with model details

---

## 🎉 Pro Tips

1. **Best Results:** Use 8 photos from all angles + 1 aerial view
2. **Faster Generation:** Use 4-6 photos for quicker results
3. **Better Quality:** Ensure consistent lighting in all photos
4. **Save Time:** Use AI Auto-Placement for instant product application
5. **Impress Clients:** Switch between 360° and 3D views during presentation

---

**Last Updated:** 2025-10-10
**Version:** 2.0
**Status:** Production Ready ✅
