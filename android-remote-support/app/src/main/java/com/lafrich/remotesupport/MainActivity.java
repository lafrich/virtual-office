package com.lafrich.remotesupport;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.ClipboardManager;
import android.content.ClipData;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.util.Base64;
import android.view.MotionEvent;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import org.json.JSONObject;
import java.security.SecureRandom;

public class MainActivity extends Activity implements RelaySocket.Listener {
    private static final int CAPTURE_REQUEST = 902;
    private SharedPreferences prefs;
    private EditText serverField, codeField;
    private TextView status;
    private ImageView screen;
    private Bitmap currentFrame;
    private float downX = -1, downY = -1;
    private boolean sessionPromptOpen = false;

    @Override protected void onCreate(Bundle state) {
        super.onCreate(state);
        prefs = getSharedPreferences("settings", MODE_PRIVATE);
        if (Build.VERSION.SDK_INT >= 33
                && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)
                   != getPackageManager().PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, 900);
        }
        ScrollView scroll = new ScrollView(this);
        LinearLayout body = new LinearLayout(this);
        body.setOrientation(LinearLayout.VERTICAL);
        body.setPadding(dp(20), dp(24), dp(20), dp(20));
        scroll.addView(body);
        setContentView(scroll);
        title(body, BuildConfig.IS_CLIENT ? "Remote Client" : "Remote Controller");
        text(body, "Bantuan jarak jauh via internet. Koneksi hanya aktif ketika client menyetujui berbagi layar.");
        text(body, "Alamat relay aman (WSS):");
        serverField = input(body, prefs.getString("server", "wss://YOUR-RELAY.example"));
        if (BuildConfig.IS_CLIENT) {
            String pairId = prefs.getString("pair_id", "");
            if (pairId.length() != 24) {
                byte[] bytes = new byte[12];
                new SecureRandom().nextBytes(bytes);
                StringBuilder hex = new StringBuilder();
                for (byte b : bytes) hex.append(String.format("%02x", b & 0xff));
                pairId = hex.toString();
                prefs.edit().putString("pair_id", pairId).apply();
            }
            text(body, "ID privat client (simpan dan bagikan hanya ke controller tepercaya):");
            codeField = input(body, pairId);
            codeField.setEnabled(false);
            button(body, "Salin ID", v -> {
                ClipboardManager cb = (ClipboardManager) getSystemService(CLIPBOARD_SERVICE);
                cb.setPrimaryClip(ClipData.newPlainText("Private pairing ID", codeField.getText().toString()));
                show("ID disalin. Perlakukan seperti password.");
            });
            button(body, "Hubungkan client ke relay", v -> connect("client"));
            button(body, "Aktifkan izin tap / swipe", v ->
                    startActivity(new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)));
            button(body, "Hentikan berbagi layar", v -> stopProjection());
            button(body, "Reset ID (cabut pairing lama)", v -> new AlertDialog.Builder(this)
                .setTitle("Cabut semua pairing?")
                .setMessage("ID baru akan dibuat. Controller lama tidak bisa tersambung lagi.")
                .setPositiveButton("Reset", (dialog, which) -> {
                    stopProjection(); RelaySocket.close();
                    prefs.edit().remove("pair_id").apply();
                    recreate();
                })
                .setNegativeButton("Batal", null).show());
            text(body, "Untuk setiap sesi baru, client tetap harus menerima permintaan Android untuk merekam layar.");
        } else {
            text(body, "Masukkan ID privat dari HP client:");
            codeField = input(body, prefs.getString("last_pair_id", ""));
            button(body, "Connect ke HP client", v -> connect("controller"));
            screen = new ImageView(this);
            screen.setBackgroundColor(0xff111827);
            screen.setScaleType(ImageView.ScaleType.FIT_CENTER);
            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT, dp(520));
            lp.topMargin = dp(16);
            body.addView(screen, lp);
            screen.setOnTouchListener((v, ev) -> {
                if (currentFrame == null || !RelaySocket.isConnected()) return true;
                if (ev.getActionMasked() == MotionEvent.ACTION_DOWN) {
                    downX = normalizeX(ev.getX());
                    downY = normalizeY(ev.getY());
                    return true;
                }
                if (ev.getActionMasked() == MotionEvent.ACTION_UP) {
                    float x = normalizeX(ev.getX()), y = normalizeY(ev.getY());
                    if (downX >= 0 && downY >= 0 && x >= 0 && y >= 0) {
                        boolean swipe = Math.abs(x - downX) + Math.abs(y - downY) > 0.04;
                        sendTouch(swipe ? "swipe" : "tap", downX, downY, x, y);
                    }
                    downX = downY = -1;
                    return true;
                }
                return true;
            });
            text(body, "Sentuh layar untuk tap, geser untuk swipe. Belum mendukung keyboard atau audio.");
        }
        status = text(body, "Belum terhubung.");
    }

    private void connect(String role) {
        String url = serverField.getText().toString().trim();
        String code = codeField.getText().toString().trim().toLowerCase();
        if (!code.matches("[a-f0-9]{24}")) { show("ID harus 24 digit heksadesimal."); return; }
        if (!url.startsWith("wss://") || url.contains("YOUR-RELAY")) {
            show("Isi alamat WSS relay yang sudah dideploy terlebih dahulu.");
            return;
        }
        prefs.edit().putString("server", url)
                .putString("last_pair_id", BuildConfig.IS_CLIENT ? "" : code).apply();
        show("Menghubungkan...");
        RelaySocket.connect(url, code, role, this);
    }

    @Override public void onStatus(String message) { runOnUiThread(() -> show(message)); }

    @Override public void onMessage(JSONObject m) {
        runOnUiThread(() -> {
            String type = m.optString("type");
            switch (type) {
                case "registered":
                    show("Client online. Controller boleh meminta sesi.");
                    break;
                case "controller_joined":
                    if (!BuildConfig.IS_CLIENT || sessionPromptOpen) break;
                    sessionPromptOpen = true;
                    new AlertDialog.Builder(this)
                        .setTitle("Permintaan remote support")
                        .setMessage("Ada controller yang mengetahui ID privatmu. Izinkan sesi layar dan kontrol sekarang?")
                        .setPositiveButton("Izinkan sesi", (d, w) -> {
                            sessionPromptOpen = false;
                            if (!RemoteAccessibilityService.isAvailable()) {
                                show("Aktifkan izin aksesibilitas untuk tap/swipe.");
                            }
                            startActivityForResult(((android.media.projection.MediaProjectionManager)
                                getSystemService(MEDIA_PROJECTION_SERVICE)).createScreenCaptureIntent(),
                                CAPTURE_REQUEST);
                        })
                        .setNegativeButton("Tolak", (d, w) -> {
                            sessionPromptOpen = false;
                            RelaySocket.sendType("deny");
                        })
                        .setOnCancelListener(d -> {
                            sessionPromptOpen = false;
                            RelaySocket.sendType("deny");
                        })
                        .show();
                    break;
                case "touch":
                    if (BuildConfig.IS_CLIENT) RemoteAccessibilityService.execute(m);
                    break;
                case "controller_left":
                    if (BuildConfig.IS_CLIENT) stopProjection();
                    show("Controller keluar.");
                    break;
                case "sharing_started":
                    show("Sesi disetujui. Layar siap dikendalikan.");
                    break;
                case "sharing_stopped":
                    show("Client menghentikan berbagi layar.");
                    break;
                case "denied":
                    show("Client menolak permintaan.");
                    break;
                case "frame":
                    if (BuildConfig.IS_CLIENT || screen == null) break;
                    try {
                        byte[] jpeg = Base64.decode(m.getString("jpeg"), Base64.DEFAULT);
                        Bitmap bm = BitmapFactory.decodeByteArray(jpeg, 0, jpeg.length);
                        if (bm != null && bm.getWidth() <= 2048 && bm.getHeight() <= 2048) {
                            Bitmap old = currentFrame;
                            currentFrame = bm;
                            screen.setImageBitmap(bm);
                            // Allow the ImageView to release old bitmaps naturally.
                        }
                    } catch (Exception ignored) {}
                    break;
                default:
                    show("Status: " + type);
            }
        });
    }

    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != CAPTURE_REQUEST) return;
        if (resultCode != RESULT_OK || data == null) {
            RelaySocket.sendType("deny");
            show("Berbagi layar dibatalkan.");
            return;
        }
        Intent service = new Intent(this, ProjectionService.class);
        service.putExtra("result_code", resultCode);
        service.putExtra("result_data", data);
        startForegroundService(service);
        show("Sesi mulai. Notifikasi Android memiliki tombol Stop.");
    }

    private void stopProjection() {
        Intent intent = new Intent(this, ProjectionService.class).setAction(ProjectionService.ACTION_STOP);
        startService(intent);
    }

    private void sendTouch(String action, float x, float y, float endX, float endY) {
        try {
            JSONObject o = new JSONObject();
            o.put("type", "touch");
            o.put("action", action);
            o.put("x", x); o.put("y", y);
            o.put("endX", endX); o.put("endY", endY);
            RelaySocket.send(o);
        } catch (Exception ignored) {}
    }

    private float normalizeX(float touchX) {
        if (currentFrame == null || screen.getWidth() <= 0) return -1;
        float w = screen.getWidth(), h = screen.getHeight();
        float factor = Math.min(w / currentFrame.getWidth(), h / currentFrame.getHeight());
        float realWidth = currentFrame.getWidth() * factor;
        float left = (w - realWidth) / 2f;
        float x = (touchX - left) / realWidth;
        return x >= 0 && x <= 1 ? x : -1;
    }
    private float normalizeY(float touchY) {
        if (currentFrame == null || screen.getHeight() <= 0) return -1;
        float w = screen.getWidth(), h = screen.getHeight();
        float factor = Math.min(w / currentFrame.getWidth(), h / currentFrame.getHeight());
        float realHeight = currentFrame.getHeight() * factor;
        float top = (h - realHeight) / 2f;
        float y = (touchY - top) / realHeight;
        return y >= 0 && y <= 1 ? y : -1;
    }
    private void show(String s) { if (status != null) status.setText(s); }
    private int dp(int n) { return Math.round(getResources().getDisplayMetrics().density * n); }
    private void title(LinearLayout body, String message) {
        TextView t = text(body, message); t.setTextSize(25); t.setPadding(0, 0, 0, dp(12));
    }
    private TextView text(LinearLayout body, String message) {
        TextView v = new TextView(this);
        v.setText(message); v.setTextSize(15); v.setPadding(0, dp(7), 0, dp(7));
        body.addView(v); return v;
    }
    private EditText input(LinearLayout body, String initial) {
        EditText v = new EditText(this);
        v.setSingleLine(true); v.setText(initial); v.setSelectAllOnFocus(true);
        body.addView(v); return v;
    }
    private void button(LinearLayout body, String title, View.OnClickListener listener) {
        Button b = new Button(this); b.setText(title);
        b.setOnClickListener(listener); body.addView(b);
    }
}
