package com.lafrich.remotesupport;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.GestureDescription;
import android.graphics.Path;
import android.util.DisplayMetrics;
import android.view.WindowManager;
import android.view.accessibility.AccessibilityEvent;
import org.json.JSONObject;

public class RemoteAccessibilityService extends AccessibilityService {
    private static volatile RemoteAccessibilityService instance;

    @Override protected void onServiceConnected() {
        super.onServiceConnected();
        instance = this;
    }
    @Override public void onAccessibilityEvent(AccessibilityEvent event) {}
    @Override public void onInterrupt() {}
    @Override public void onDestroy() {
        if (instance == this) instance = null;
        super.onDestroy();
    }

    public static boolean isAvailable() { return instance != null; }

    public static void execute(JSONObject command) {
        RemoteAccessibilityService target = instance;
        if (!BuildConfig.IS_CLIENT || target == null || !ProjectionService.isSharing()) return;
        final String action = command.optString("action");
        final double x = command.optDouble("x", -1);
        final double y = command.optDouble("y", -1);
        if (!inside(x) || !inside(y)) return;
        WindowManager wm = (WindowManager) target.getSystemService(WINDOW_SERVICE);
        if (wm == null) return;
        DisplayMetrics metrics = new DisplayMetrics();
        wm.getDefaultDisplay().getRealMetrics(metrics);
        Path path = new Path();
        path.moveTo((float) (x * (metrics.widthPixels - 1)),
                (float) (y * (metrics.heightPixels - 1)));
        long duration = 70;
        if ("swipe".equals(action)) {
            double endX = command.optDouble("endX", -1);
            double endY = command.optDouble("endY", -1);
            if (!inside(endX) || !inside(endY)) return;
            path.lineTo((float) (endX * (metrics.widthPixels - 1)),
                    (float) (endY * (metrics.heightPixels - 1)));
            duration = 350;
        } else if (!"tap".equals(action)) {
            return;
        }
        GestureDescription.StrokeDescription stroke =
                new GestureDescription.StrokeDescription(path, 0, duration);
        target.dispatchGesture(new GestureDescription.Builder()
                .addStroke(stroke).build(), null, null);
    }

    private static boolean inside(double n) {
        return !Double.isNaN(n) && !Double.isInfinite(n) && n >= 0 && n <= 1;
    }
}
