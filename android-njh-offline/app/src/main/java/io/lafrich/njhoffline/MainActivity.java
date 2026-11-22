package io.lafrich.njhoffline;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;
import android.webkit.ValueCallback;
import android.widget.Toast;
import androidx.webkit.WebViewAssetLoader;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;

/**
 * Offline-only wrapper around the EXISTING NJH Mainkan + native Semesta engine.
 * Every game request resolves from the APK; no INTERNET permission is granted.
 */
public final class MainActivity extends Activity {
    private static final String HOST="appassets.androidplatform.net";
    private static final String START="https://"+HOST+"/virtual-office/mainkan/index.html";
    private static final int REQUEST_FILE=4051;
    private WebView game;
    private ValueCallback<Uri[]> pendingFile;
    private WebViewAssetLoader local;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
                             WindowManager.LayoutParams.FLAG_FULLSCREEN);
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_FULLSCREEN |
            View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY |
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE
        );
        local=new WebViewAssetLoader.Builder()
            .setDomain(HOST)
            .addPathHandler("/",new WebViewAssetLoader.AssetsPathHandler(this))
            .build();
        game=new WebView(this);
        game.setBackgroundColor(Color.rgb(0,128,128));
        setContentView(game);
        WebSettings settings=game.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setBlockNetworkLoads(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        settings.setMediaPlaybackRequiresUserGesture(true);

        game.setWebChromeClient(new WebChromeClient(){
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback,
                                                        FileChooserParams params) {
                if(pendingFile!=null)pendingFile.onReceiveValue(null);
                pendingFile=callback;
                try{startActivityForResult(params.createIntent(),REQUEST_FILE);return true;}
                catch(Exception e){
                    pendingFile=null;
                    Toast.makeText(MainActivity.this,"Tidak dapat membuka file",Toast.LENGTH_SHORT).show();
                    return false;
                }
            }
        });
        game.setWebViewClient(new WebViewClient(){
            @Override public WebResourceResponse shouldInterceptRequest(WebView view,WebResourceRequest request){
                Uri u=request.getUrl();
                if("https".equalsIgnoreCase(u.getScheme())&&HOST.equalsIgnoreCase(u.getHost())){
                    WebResourceResponse asset=local.shouldInterceptRequest(u);
                    if(asset!=null)return asset;
                    return denied("Aset game tidak ada di APK: "+u.getPath(),404);
                }
                // Deny everything else, including remote CDN, GitHub, login and
                // analytics; a genuinely offline game must not depend on these.
                return denied("NJH offline: permintaan jaringan ditolak",403);
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request) {
                Uri uri=request.getUrl();
                return !("https".equalsIgnoreCase(uri.getScheme())
                    &&HOST.equalsIgnoreCase(uri.getHost()));
            }
            @Override public void onReceivedError(WebView view,WebResourceRequest request,
                                                  android.webkit.WebResourceError error){
                if(request.isForMainFrame())Toast.makeText(MainActivity.this,
                    "Game belum bisa dimuat. Periksa paket APK.",Toast.LENGTH_LONG).show();
            }
        });
        if(state!=null)game.restoreState(state);
        else game.loadUrl(START);
    }
    private static WebResourceResponse denied(String message,int code){
        byte[] bytes=message.getBytes(StandardCharsets.UTF_8);
        WebResourceResponse r=new WebResourceResponse("text/plain","UTF-8",new ByteArrayInputStream(bytes));
        r.setStatusCodeAndReasonPhrase(code,code==404?"Not Found":"Forbidden");
        r.getResponseHeaders().put("Access-Control-Allow-Origin","*");
        return r;
    }
    @Override protected void onPause(){
        try{game.evaluateJavascript("window.NJHOfflineUI?.persist?.()",null);game.onPause();game.pauseTimers();}
        catch(Exception ignored){}
        super.onPause();
    }
    @Override protected void onResume(){
        super.onResume();
        if(game!=null){game.onResume();game.resumeTimers();}
    }
    @Override protected void onSaveInstanceState(Bundle outState){
        if(game!=null)game.saveState(outState);
        super.onSaveInstanceState(outState);
    }
    @Override protected void onActivityResult(int request,int result,Intent data){
        super.onActivityResult(request,result,data);
        if(request==REQUEST_FILE&&pendingFile!=null){
            pendingFile.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result,data));
            pendingFile=null;
        }
    }
    @Override public void onBackPressed(){
        new AlertDialog.Builder(this)
            .setTitle("Keluar dari Namanya Juga Hidup?")
            .setMessage("Progres akan disimpan di perangkat ini.")
            .setNegativeButton("Batal",null)
            .setPositiveButton("Keluar",(dialog,which)->{
                if(game!=null)game.evaluateJavascript(
                    "window.NJHOfflineUI?.persist?.()",null);
                finish();
            }).show();
    }
    @Override protected void onDestroy(){
        if(game!=null){game.destroy();game=null;}
        super.onDestroy();
    }
}
