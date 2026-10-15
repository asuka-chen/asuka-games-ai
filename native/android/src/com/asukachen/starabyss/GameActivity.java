package com.asukachen.starabyss;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.view.WindowInsets;
import android.view.DisplayCutout;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.ConsoleMessage;
import android.util.Log;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

public final class GameActivity extends Activity {
  private WebView game;
  private void immersive() {
    getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
  }
  @Override public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    getWindow().addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    WindowManager.LayoutParams windowLayout=getWindow().getAttributes();windowLayout.layoutInDisplayCutoutMode=WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;getWindow().setAttributes(windowLayout);
    FrameLayout frame=new FrameLayout(this);frame.setBackgroundColor(Color.rgb(6,12,23));
    game=new WebView(this);game.setBackgroundColor(Color.rgb(6,12,23));
    WebSettings settings=game.getSettings();settings.setJavaScriptEnabled(true);settings.setDomStorageEnabled(true);settings.setMediaPlaybackRequiresUserGesture(false);settings.setAllowFileAccess(false);settings.setAllowContentAccess(false);settings.setAllowFileAccessFromFileURLs(false);settings.setAllowUniversalAccessFromFileURLs(false);settings.setSupportZoom(false);settings.setBuiltInZoomControls(false);settings.setDisplayZoomControls(false);
    game.setWebChromeClient(new WebChromeClient(){@Override public boolean onConsoleMessage(ConsoleMessage message){Log.w("StarAbyss",message.message()+" ("+message.sourceId()+":"+message.lineNumber()+")");return true;}});
    game.setWebViewClient(new WebViewClient(){@Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){return !request.getUrl().toString().startsWith("file:///android_asset/www/");}});
    game.addJavascriptInterface(new NativeActions(),"NativeBridge");
    frame.addView(game,new FrameLayout.LayoutParams(-1,-1));setContentView(frame);
    frame.setOnApplyWindowInsetsListener((view,insets)->{DisplayCutout cut=insets.getDisplayCutout();FrameLayout.LayoutParams layout=(FrameLayout.LayoutParams)game.getLayoutParams();layout.leftMargin=Math.max(insets.getSystemWindowInsetLeft(),cut==null?0:cut.getSafeInsetLeft());layout.rightMargin=Math.max(insets.getSystemWindowInsetRight(),cut==null?0:cut.getSafeInsetRight());layout.topMargin=Math.max(insets.getSystemWindowInsetTop(),cut==null?0:cut.getSafeInsetTop());layout.bottomMargin=Math.max(insets.getSystemWindowInsetBottom(),cut==null?0:cut.getSafeInsetBottom());game.setLayoutParams(layout);return insets;});
    immersive();game.loadUrl("file:///android_asset/www/index.html");
  }
  private final class NativeActions {
    @JavascriptInterface public void shareText(String text,String title){runOnUiThread(()->{Intent share=new Intent(Intent.ACTION_SEND);share.setType("text/plain");share.putExtra(Intent.EXTRA_TEXT,text);share.putExtra(Intent.EXTRA_SUBJECT,title);startActivity(Intent.createChooser(share,"导出星渊日志"));});}
  }
  @Override public void onWindowFocusChanged(boolean focus){super.onWindowFocusChanged(focus);if(focus)immersive();}
  @Override public void onBackPressed(){game.evaluateJavascript("Boolean(window.starAbyssNativeBack && window.starAbyssNativeBack())",value->{if(!"true".equals(value))finish();});}
  @Override protected void onPause(){game.evaluateJavascript("window.dispatchEvent(new Event('blur'))",null);game.onPause();super.onPause();}
  @Override protected void onResume(){super.onResume();if(game!=null)game.onResume();}
  @Override protected void onDestroy(){if(game!=null)game.destroy();super.onDestroy();}
}
