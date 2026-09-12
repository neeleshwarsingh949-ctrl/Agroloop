package com.agroloop.app;

import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.webkit.JavascriptInterface;

import com.getcapacitor.BridgeActivity;

import java.util.Locale;

public class MainActivity extends BridgeActivity {
	private TextToSpeech textToSpeech;
	private String pendingText;
	private String pendingLanguage;
	private boolean textToSpeechReady;

	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);

		textToSpeech = new TextToSpeech(this, status -> {
			textToSpeechReady = status == TextToSpeech.SUCCESS;
			if (textToSpeechReady && pendingText != null) {
				speakPendingText();
			}
		});

		getBridge().getWebView().addJavascriptInterface(new SpeechBridge(), "AgroLoopSpeech");
	}

	private void speakPendingText() {
		Locale locale = "ta".equals(pendingLanguage) ? new Locale("ta", "IN")
				: "hi".equals(pendingLanguage) || "bho".equals(pendingLanguage) ? new Locale("hi", "IN")
				: Locale.US;
		textToSpeech.setLanguage(locale);
		textToSpeech.speak(pendingText, TextToSpeech.QUEUE_FLUSH, null, "agroloop-voice");
		pendingText = null;
	}

	private class SpeechBridge {
		@JavascriptInterface
		public void speak(String text, String language) {
			runOnUiThread(() -> {
				pendingText = text;
				pendingLanguage = language;
				if (textToSpeechReady) {
					speakPendingText();
				}
			});
		}

		@JavascriptInterface
		public void stop() {
			runOnUiThread(() -> {
				if (textToSpeech != null) {
					textToSpeech.stop();
				}
				pendingText = null;
			});
		}
	}

	@Override
	public void onDestroy() {
		if (textToSpeech != null) {
			textToSpeech.stop();
			textToSpeech.shutdown();
		}
		super.onDestroy();
	}
}
