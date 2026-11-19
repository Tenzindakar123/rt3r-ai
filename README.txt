RT3R AI — VERSION 0.1 (iPhone-first prototype)
================================================

WHAT WORKS IN THIS VERSION
- Import one video from your device.
- Import one music/audio file.
- Preview the video.
- Trim start and end.
- Choose 9:16, 1:1, 16:9 or original aspect ratio.
- Change playback speed.
- Add a text overlay and choose its position and size.
- Adjust music volume.
- Export a rendered video using browser MediaRecorder when supported.
- Local-first: selected media is processed in the browser and is not uploaded to a server.

IMPORTANT LIMITATIONS
- This is an editor prototype, not the complete AI editor.
- No automatic beat detection, AI scene selection, meme detection, trend radar, AI image generation, advanced transitions, keyframe editor or AI-generated effects yet.
- Browser video export support varies. Safari/iOS versions may export MP4 or WebM depending on the browser. Test with a short clip first.
- Keep the page open while exporting. Large videos may exceed iPhone memory or battery limits.
- The prototype uses the browser's local media APIs; it does not promise professional CapCut-level rendering.
- Google Fonts is optional styling and requires internet; the app itself does not require an AI API key.

HOW TO TEST ON IPHONE
1. Put this folder on a static HTTPS host (for example, a GitHub Pages site or another static host).
2. Open the HTTPS site in Safari on your iPhone.
3. Tap Share → Add to Home Screen.
4. Launch RT3R AI from the Home Screen.
5. Import a short test video (10–20 seconds) and a music file.
6. Try trim, text, speed, then Export.
7. If export is unavailable or fails, note the iOS version, browser and error message.

LOCAL COMPUTER TEST
- Open index.html in a modern browser for basic preview/edit testing.
- Service worker/PWA install requires HTTPS or localhost.
- For a local server with Python installed, run: python -m http.server 8000
  Then open http://localhost:8000 on that computer.

PRIVACY
- The app does not upload your video or music.
- The browser may cache the app files for offline launch after first successful load.
- Do not upload copyrighted music or footage unless you have permission to use it.
