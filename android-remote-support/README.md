# Lafrich Android Remote Support — MVP 0.1

**Two Android applications, one lightweight WebSocket relay.** This prototype is made for consensual technical support, not hidden surveillance or unattended access.

## What is implemented

- **Client APK** registers a stable random 96-bit pairing ID (revoke it with `Reset ID`).
- **Controller APK** remembers the pairing ID and relay URL.
- Client explicitly accepts a controller connection **each session**, then Android prompts for screen capture.
- A visible foreground notification offers **Stop sharing**.
- Compressed screen frames stream over WSS (about 1 frame/second in this early version).
- Tap and swipe gestures are available after the client explicitly enables the Android Accessibility service.
- Only one controller per client. Relay does not store captured frames.

**Not supported yet:** unattended screen capture, automatic background reconnect after reboot, text/keyboard, audio, low-latency video, file transfer, auto server deployment, end-to-end encryption, hardening for production use.

### Android limitation

Android 14+ requires the screen owner to approve every new MediaProjection session. This app does not bypass OS security prompts. Initial installation is not permanent authorization to record the screen.

## Build two APKs

Install JDK 17, Android SDK 35, and Gradle 8.11.1. From this directory:

```bash
gradle assembleClientDebug assembleControllerDebug
```

Outputs: `app/build/outputs/apk/client/debug/app-client-debug.apk` and `app/build/outputs/apk/controller/debug/app-controller-debug.apk`.

The branch's GitHub Actions workflow also builds both APKs and uploads a downloadable **Actions artifact** after a successful run. The debug builds are for development, not app-store distribution.

## Run the internet relay

The relay requires a **public WSS endpoint**; GitHub only hosts source code / Actions, not a live server. Deploy the `relay` directory to a Node.js hosting provider with HTTPS/TLS termination.

- Runtime: Node.js 20 or newer
- Root directory: `android-remote-support/relay`
- Build: `npm install`
- Start: `npm start`
- Port: environment variable `PORT` (defaults to 8080)
- Health: `/health`
- WSS: `wss://your-public-host.example`

Do not expose unencrypted `ws://` over the open internet. The Android app intentionally requires `wss://`.

## Pair and control (consent-based)

1. Install **Client APK** on the other phone and **Controller APK** on your phone.
2. Enter the **same WSS relay URL** in both apps.
3. On the client, enable the Accessibility service under Android Accessibility settings (only if remote touch is needed), then select **Hubungkan client ke relay**.
4. The client copies their private pairing ID and gives it to their trusted controller. Treat the ID as a password.
5. On the controller, enter the pairing ID, then press **Connect ke HP client**.
6. The client taps **Izinkan sesi**, then accepts Android's screen-sharing permission prompt.
7. Control via tap / swipe; the client can end the session from the notification.

Clients need to leave the app running to be available for incoming requests in this prototype. After disconnect or reboot, open Client and connect again.

## Security / operational caveats

- Any person with the pairing ID and relay URL can **request** a session; the owner must approve before the screen is captured.
- The relay forwards screen frames and input and is **not end-to-end encrypted**. Use a relay provider you trust. This prototype is not production-ready for sensitive accounts, banking, passwords or private data.
- Android system protected content and lock screens may not be capturable. Some device vendors restrict Accessibility input.
- Avoid a shared public relay with unknown administrators. Do not distribute to clients for production usage until authentication, audit trails, flood protection, e2e encryption and operational monitoring are added.
- Never rely on APK installation alone as consent for unlimited remote access.

## Architecture

```
Controller APK -> WSS relay <- Client APK
  screen frames <--------------- MediaProjection (user approves each session)
  taps/swipes -----------------> AccessibilityService (user enables explicitly)
```

Project is isolated on the `android-remote-support` branch and does **not** change the production `main` branch of the game.
