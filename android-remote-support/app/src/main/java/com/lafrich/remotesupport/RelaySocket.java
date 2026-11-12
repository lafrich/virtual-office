package com.lafrich.remotesupport;

import android.util.Base64;
import org.json.JSONObject;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.WebSocket;
import okhttp3.WebSocketListener;
import java.util.concurrent.TimeUnit;

public final class RelaySocket {
    public interface Listener {
        void onStatus(String status);
        void onMessage(JSONObject message);
    }
    private static final OkHttpClient CLIENT = new OkHttpClient.Builder()
            .pingInterval(25, TimeUnit.SECONDS).build();
    private static volatile WebSocket current;
    private static volatile Listener listener;
    private static volatile boolean connected = false;

    private RelaySocket() {}

    public static synchronized void connect(String url, String code, String role, Listener nextListener) {
        close();
        listener = nextListener;
        if (!url.startsWith("wss://")) {
            nextListener.onStatus("Use a secure wss:// relay URL.");
            return;
        }
        try {
            Request request = new Request.Builder().url(url).build();
            current = CLIENT.newWebSocket(request, new WebSocketListener() {
                @Override public void onOpen(WebSocket socket, Response response) {
                    if (socket != current) return;
                    connected = true;
                    try {
                        JSONObject hello = new JSONObject();
                        hello.put("type", "hello");
                        hello.put("role", role);
                        hello.put("code", code);
                        socket.send(hello.toString());
                    } catch (Exception ignored) {}
                    emitStatus("Connected to relay.");
                }
                @Override public void onMessage(WebSocket socket, String text) {
                    if (socket != current) return;
                    try {
                        JSONObject message = new JSONObject(text);
                        Listener target = listener;
                        if (target != null) target.onMessage(message);
                    } catch (Exception ignored) {}
                }
                @Override public void onFailure(WebSocket socket, Throwable error, Response response) {
                    if (socket != current) return;
                    connected = false;
                    emitStatus("Connection failed: " + error.getClass().getSimpleName());
                }
                @Override public void onClosed(WebSocket socket, int code, String reason) {
                    if (socket != current) return;
                    connected = false;
                    emitStatus("Disconnected: " + reason);
                }
                @Override public void onClosing(WebSocket socket, int code, String reason) {
                    socket.close(code, reason);
                }
            });
        } catch (Exception e) {
            emitStatus("Invalid server URL.");
        }
    }

    public static boolean isConnected() { return connected; }

    public static synchronized void close() {
        connected = false;
        if (current != null) current.close(1000, "User disconnected");
        current = null;
    }

    public static boolean send(JSONObject data) {
        WebSocket socket = current;
        return connected && socket != null && socket.send(data.toString());
    }

    public static void sendType(String type) {
        try { JSONObject obj = new JSONObject(); obj.put("type", type); send(obj); }
        catch (Exception ignored) {}
    }

    public static void sendFrame(byte[] jpeg) {
        if (!connected) return;
        try {
            JSONObject obj = new JSONObject();
            obj.put("type", "frame");
            obj.put("jpeg", Base64.encodeToString(jpeg, Base64.NO_WRAP));
            send(obj);
        } catch (Exception ignored) {}
    }

    private static void emitStatus(String message) {
        Listener target = listener;
        if (target != null) target.onStatus(message);
    }
}
