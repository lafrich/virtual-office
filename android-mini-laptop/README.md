# Membangun Mini Laptop — Android

A lightweight installable Android WebView shell for Samsung Galaxy Fold. It opens
the existing [Membangun Mini Laptop](https://lafrich.github.io/virtual-office/membangun/laptop.html)
with its viewport oriented **90 degrees (landscape)**. The top of the unfolded
screen is the editor; the bottom is a virtual touchpad and keyboard. Use the
bottom app switcher to navigate between **Mahluk Hidup, Bangun Ruang,
Semesta, Jiwa, and Ellen** without reloading the others. Emosi is managed
through the current Mahluk Hidup integration rather than a duplicate app tab.

## Install

Download **membangun-mini-laptop.apk** from the most recent GitHub Release, open
it on Android and approve installing from your browser or Files when prompted.
You can uninstall it normally. This is a debug-signed test build; not a
Play Store distribution and not yet verified on the physical Galaxy Fold.

## Build locally

Android SDK 35, JDK 17, Gradle 8.9:
```sh
gradle -p android-mini-laptop assembleDebug
```
The APK is at `android-mini-laptop/app/build/outputs/apk/debug/app-debug.apk`.
A GitHub Actions workflow builds and publishes the APK on updates.

## Notes

- An internet connection is required: the interface uses the hosted web apps.
- Editor storage/Google Drive sign-in depends on Android System WebView behavior
  and must be tested on-device. Ellen uses Google's OAuth popup and is not
  considered cross-device verified until authenticated readback is tested.
- There is no JavaScript-to-Java bridge. Only secure HTTPS links to the studio
  origin load inside the WebView; external links open in the system browser.
- Rotation locking may be overridden by Android 16 or some OEM large-screen
  orientation policies. The web page also offers **↻90°** as a manual fallback.
- Avoid enabling Samsung's automatic Flex Mode panel at the same time or it may
  overlap the lower controls.
