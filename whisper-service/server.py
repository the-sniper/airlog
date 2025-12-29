import os, tempfile
from flask import Flask, request, jsonify
from flask_cors import CORS
from faster_whisper import WhisperModel

app = Flask(__name__)
CORS(app)

MODEL_SIZE = os.environ.get("WHISPER_MODEL", "small")
model = WhisperModel(MODEL_SIZE, device="cpu", compute_type="int8")

# Domain-specific prompt to help with QA/testing terminology
INITIAL_PROMPT = (
    "This is user feedback from software testing. "
    "Common terms: bug, crash, error, freeze, glitch, broken, not working, "
    "feature request, suggestion, improvement, UI, UX, confusing, slow, lag, performance."
)

@app.route("/health", methods=["GET"])
def health(): return jsonify({"status": "healthy", "model": MODEL_SIZE})

@app.route("/asr", methods=["POST"])
def transcribe():
    if "audio_file" not in request.files: return jsonify({"error": "No audio"}), 400
    audio_file = request.files["audio_file"]
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as f:
            audio_file.save(f.name)
            temp_path = f.name
        segments, info = model.transcribe(
            temp_path,
            beam_size=5,
            language="en",
            word_timestamps=True,
            vad_filter=True,
            vad_parameters=dict(min_silence_duration_ms=500),
            condition_on_previous_text=True,
            initial_prompt=INITIAL_PROMPT,
            no_speech_threshold=0.6,
            log_prob_threshold=-1.0,
        )
        text = ""
        words = []
        for seg in segments:
            text += seg.text
            if seg.words:
                for w in seg.words: words.append({"word": w.word.strip(), "start": round(w.start, 2), "end": round(w.end, 2), "confidence": round(w.probability, 3) if w.probability else 0.9})
        os.unlink(temp_path)
        return jsonify({"text": text.strip(), "language": info.language, "confidence": round(info.language_probability, 3) if info.language_probability else 0.9, "words": words})
    except Exception as e:
        if 'temp_path' in locals():
            try: os.unlink(temp_path)
            except: pass
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__": app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 9000)))

