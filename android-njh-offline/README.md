# NJH Offline — Android preview

This is a true **installed** game wrapper for the EXISTING NJH Mainkan / Semesta / Jiwa runtime, not a second game. It packages the art pipeline, Three.js and HTML/JS/CSS inside an Android APK. The app has no INTERNET permission and blocks all remote WebView loads.

Build occurs in GitHub Actions via **NJH Offline Android APK (Preview)** and produces the artifact **NJH-Offline-Android-APK**. It intentionally does not publish to the production site or GitHub Releases.

A green Android build only proves it assembled, **not** that all game scenes run. Test airplane mode from cold launch, creation, movement, eating, sleep, save/load, kos, interiors and four Genesis directions on a physical device. Record missing asset URLs from WebView logs; do not release until fixed. Offline progress remains only in the Android app's private local storage.

No cloud account is required. The development editor applications remain separate and can stay online.
