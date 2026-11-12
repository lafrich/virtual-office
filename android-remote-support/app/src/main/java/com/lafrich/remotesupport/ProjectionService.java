package com.lafrich.remotesupport;

import android.app.Activity;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.graphics.Bitmap;
import android.graphics.PixelFormat;
import android.hardware.display.DisplayManager;
import android.hardware.display.VirtualDisplay;
import android.media.Image;
import android.media.ImageReader;
import android.media.projection.MediaProjection;
import android.media.projection.MediaProjectionManager;
import android.os.Build;
import android.os.Handler;
import android.os.HandlerThread;
import android.os.IBinder;
import android.os.SystemClock;
import android.util.DisplayMetrics;
import android.view.WindowManager;
import java.io.ByteArrayOutputStream;
import java.nio.ByteBuffer;

public class ProjectionService extends Service {
    public static final String ACTION_STOP = "com.lafrich.remotesupport.STOP";
    private static final String CHANNEL = "remote_session";
    private static volatile boolean sharing = false;
    private MediaProjection projection;
    private VirtualDisplay virtualDisplay;
    private ImageReader reader;
    private HandlerThread thread;
    private long lastFrame = 0L;
    private boolean cleaning = false;

    public static boolean isSharing() { return sharing; }

    @Override public IBinder onBind(Intent intent) { return null; }

    @Override public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null || ACTION_STOP.equals(intent.getAction())) {
            stopSharing();
            return START_NOT_STICKY;
        }
        if (sharing || !BuildConfig.IS_CLIENT) return START_NOT_STICKY;

        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        nm.createNotificationChannel(new NotificationChannel(CHANNEL,
                "Active remote screen sharing", NotificationManager.IMPORTANCE_LOW));
        Intent stop = new Intent(this, ProjectionService.class).setAction(ACTION_STOP);
        PendingIntent stopPI = PendingIntent.getService(this, 1, stop,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        Notification notification = new Notification.Builder(this, CHANNEL)
                .setSmallIcon(android.R.drawable.ic_menu_view)
                .setContentTitle("Your screen is being shared")
                .setContentText("Tap Stop to end remote support.")
                .setOngoing(true)
                .addAction(new Notification.Action.Builder(
                        android.R.drawable.ic_menu_close_clear_cancel,
                        "Stop sharing", stopPI).build())
                .build();
        if (Build.VERSION.SDK_INT >= 29) {
            startForeground(101, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION);
        } else { startForeground(101, notification); }

        int resultCode = intent.getIntExtra("result_code", Activity.RESULT_CANCELED);
        Intent resultData = Build.VERSION.SDK_INT >= 33
                ? intent.getParcelableExtra("result_data", Intent.class)
                : intent.getParcelableExtra("result_data");
        if (resultCode != Activity.RESULT_OK || resultData == null) {
            stopSharing();
            return START_NOT_STICKY;
        }
        try {
            MediaProjectionManager manager = (MediaProjectionManager)
                    getSystemService(MEDIA_PROJECTION_SERVICE);
            projection = manager.getMediaProjection(resultCode, resultData);
            projection.registerCallback(new MediaProjection.Callback() {
                @Override public void onStop() { stopSharing(); }
            }, new Handler(getMainLooper()));
            DisplayMetrics dm = new DisplayMetrics();
            ((WindowManager) getSystemService(WINDOW_SERVICE))
                    .getDefaultDisplay().getRealMetrics(dm);
            int w = dm.widthPixels, h = dm.heightPixels;
            float scale = Math.min(1f, 720f / Math.max(w, h));
            w = Math.max(2, (((int)(w * scale)) / 2) * 2);
            h = Math.max(2, (((int)(h * scale)) / 2) * 2);
            thread = new HandlerThread("ScreenFrames");
            thread.start();
            reader = ImageReader.newInstance(w, h, PixelFormat.RGBA_8888, 2);
            final int frameW = w, frameH = h;
            reader.setOnImageAvailableListener(ir -> publishFrame(ir, frameW, frameH),
                    new Handler(thread.getLooper()));
            virtualDisplay = projection.createVirtualDisplay(
                    "Lafrich Remote (approved session)", w, h, dm.densityDpi,
                    DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR, reader.getSurface(), null,
                    new Handler(getMainLooper()));
            sharing = true;
            RelaySocket.sendType("sharing_started");
        } catch (Exception ex) {
            stopSharing();
        }
        return START_NOT_STICKY;
    }

    private void publishFrame(ImageReader ir, int width, int height) {
        Image image = null;
        try {
            image = ir.acquireLatestImage();
            if (image == null || !sharing || !RelaySocket.isConnected()) return;
            long now = SystemClock.elapsedRealtime();
            if (now - lastFrame < 700) return;
            lastFrame = now;
            Image.Plane plane = image.getPlanes()[0];
            int stride = plane.getPixelStride();
            int rowStride = plane.getRowStride();
            if (stride != 4 || rowStride < width * 4) return;
            int paddedWidth = rowStride / 4;
            Bitmap raw = Bitmap.createBitmap(paddedWidth, height, Bitmap.Config.ARGB_8888);
            ByteBuffer buffer = plane.getBuffer();
            buffer.rewind();
            raw.copyPixelsFromBuffer(buffer);
            Bitmap cropped = Bitmap.createBitmap(raw, 0, 0, width, height);
            ByteArrayOutputStream bytes = new ByteArrayOutputStream();
            cropped.compress(Bitmap.CompressFormat.JPEG, 45, bytes);
            raw.recycle();
            cropped.recycle();
            if (bytes.size() < 150000) RelaySocket.sendFrame(bytes.toByteArray());
        } catch (Exception ignored) {
            // A disconnected or locked session is allowed to drop frames.
        } finally {
            if (image != null) image.close();
        }
    }

    private synchronized void stopSharing() {
        if (cleaning) return;
        cleaning = true;
        sharing = false;
        RelaySocket.sendType("sharing_stopped");
        if (virtualDisplay != null) { virtualDisplay.release(); virtualDisplay = null; }
        if (reader != null) { reader.close(); reader = null; }
        if (projection != null) {
            MediaProjection prior = projection;
            projection = null;
            try { prior.stop(); } catch (Exception ignored) {}
        }
        if (thread != null) { thread.quitSafely(); thread = null; }
        stopForeground(STOP_FOREGROUND_REMOVE);
        stopSelf();
    }

    @Override public void onDestroy() {
        stopSharing();
        super.onDestroy();
    }
}
