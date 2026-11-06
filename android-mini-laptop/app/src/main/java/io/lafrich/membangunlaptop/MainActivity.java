package io.lafrich.membangunlaptop;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceError;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;
import android.webkit.ValueCallback;
import android.widget.Toast;

public class MainActivity extends Activity {
    private static final String START_URL =
        "https://lafrich.github.io/virtual-office/membangun/laptop.html?v=1.2.0&app=semesta";
    private WebView webView;
    private ValueCallback<Uri[]> pendingFileSelection;
    private static final int FILE_PICKER_REQUEST = 5417;

    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
                             WindowManager.LayoutParams.FLAG_FULLSCREEN);
        getWindow().getDecorView().setSystemUiVisibility(
             View.SYSTEM_UI_FLAG_FULLSCREEN |
             View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
             View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY |
             View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
             View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION |
             View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
        );
        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(12, 41, 93));
        setContentView(webView);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setSupportMultipleWindows(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setMediaPlaybackRequiresUserGesture(true);
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);
        webView.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(
                WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (pendingFileSelection != null) pendingFileSelection.onReceiveValue(null);
                pendingFileSelection = callback;
                try {
                    Intent intent = params.createIntent();
                    startActivityForResult(intent, FILE_PICKER_REQUEST);
                    return true;
                } catch (Exception e) {
                    pendingFileSelection = null;
                    Toast.makeText(MainActivity.this, "File picker belum tersedia", Toast.LENGTH_SHORT).show();
                    return false;
                }
            }
        });
        webView.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri url = request.getUrl();
                String host = url.getHost();
                // All built-in studio apps are hosted at this same HTTPS origin.
                if ("https".equalsIgnoreCase(url.getScheme()) && "lafrich.github.io".equalsIgnoreCase(host))
                    return false;
                if ("http".equalsIgnoreCase(url.getScheme()) || "https".equalsIgnoreCase(url.getScheme())) {
                    try {
                        startActivity(new Intent(Intent.ACTION_VIEW, url));
                    } catch (Exception ignored) {
                        Toast.makeText(MainActivity.this, "Tidak bisa membuka tautan", Toast.LENGTH_SHORT).show();
                    }
                    return true;
                }
                return true;
            }
            @Override public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) {
                    Toast.makeText(MainActivity.this,
                         "Koneksi gagal. Periksa internet dan buka ulang aplikasi.",
                         Toast.LENGTH_LONG).show();
                }
            }
        });
        if (savedInstanceState != null) webView.restoreState(savedInstanceState);
        else webView.loadUrl(START_URL);
    }

    @Override protected void onSaveInstanceState(Bundle outState) {
        if (webView != null) webView.saveState(outState);
        super.onSaveInstanceState(outState);
    }

    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == FILE_PICKER_REQUEST && pendingFileSelection != null) {
            Uri[] urls = WebChromeClient.FileChooserParams.parseResult(resultCode, data);
            pendingFileSelection.onReceiveValue(urls);
            pendingFileSelection = null;
        }
    }

    @Override public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            new AlertDialog.Builder(this)
                .setTitle("Keluar dari Mini Laptop?")
                .setMessage("Perubahan yang belum disimpan di editor dapat hilang.")
                .setNegativeButton("Batal", null)
                .setPositiveButton("Keluar", (dialog, which) -> finish())
                .show();
        }
    }

    @Override protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
