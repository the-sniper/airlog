# Whisper Transcription Service

A self-hosted speech-to-text service using OpenAI's Whisper model, containerized with Docker for easy deployment.

## Overview

This service provides a REST API endpoint that accepts audio files and returns transcribed text. It uses the `openai-whisper` library with the "base" model for a good balance of speed and accuracy.

## Prerequisites

- Docker
- Docker Compose

## Quick Start

### Using Docker Compose (Recommended)

```bash
# Start the service
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the service
docker-compose down
```

### Using Docker Directly

```bash
# Build the image
docker build -t whisper-service .

# Run the container
docker run -d -p 9000:9000 --name whisper whisper-service
```

## Environment Variables

| Variable        | Default | Description                                           |
| --------------- | ------- | ----------------------------------------------------- |
| `WHISPER_MODEL` | `base`  | Whisper model size (tiny, base, small, medium, large) |
| `PORT`          | `9000`  | Port to run the service on                            |

### Model Sizes

| Model    | Parameters | Speed   | Accuracy | VRAM Required |
| -------- | ---------- | ------- | -------- | ------------- |
| `tiny`   | 39M        | Fastest | Lower    | ~1 GB         |
| `base`   | 74M        | Fast    | Good     | ~1 GB         |
| `small`  | 244M       | Medium  | Better   | ~2 GB         |
| `medium` | 769M       | Slow    | High     | ~5 GB         |
| `large`  | 1550M      | Slowest | Highest  | ~10 GB        |

To use a different model, update the `docker-compose.yml`:

```yaml
environment:
  - WHISPER_MODEL=small
```

## API Reference

### Health Check

```
GET /health
```

**Response:**

```json
{
  "status": "healthy",
  "model": "base"
}
```

### Transcribe Audio

```
POST /asr
Content-Type: multipart/form-data
```

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `audio_file` | File | Yes | Audio file (wav, mp3, m4a, webm, etc.) |

**Example Request:**

```bash
curl -X POST http://localhost:9000/asr \
  -F "audio_file=@recording.wav"
```

**Success Response (200):**

```json
{
  "text": "This is the transcribed text from the audio file.",
  "language": "en",
  "confidence": 0.95,
  "words": [{ "word": "This", "start": 0.0, "end": 0.5, "confidence": 0.98 }]
}
```

**Error Response (400):**

```json
{
  "error": "No file provided"
}
```

**Error Response (500):**

```json
{
  "error": "Transcription failed: <error message>"
}
```

## Supported Audio Formats

- WAV
- MP3
- M4A
- WebM
- FLAC
- OGG
- And most other common audio formats

## Integration with Next.js App

The Next.js app connects to this service via the `NEXT_PUBLIC_WHISPER_URL` environment variable. Make sure to set it in your `.env.local`:

```bash
NEXT_PUBLIC_WHISPER_URL=http://localhost:9000
```

The `/api/transcribe` route in the Next.js app forwards audio files to this service.

## Performance Tips

1. **Use GPU acceleration**: For faster transcription, use NVIDIA GPU with CUDA support:

   ```yaml
   # docker-compose.yml
   services:
     whisper:
       deploy:
         resources:
           reservations:
             devices:
               - driver: nvidia
                 count: 1
                 capabilities: [gpu]
   ```

2. **Increase memory**: For larger models, increase Docker memory limits:

   ```yaml
   deploy:
     resources:
       limits:
         memory: 4G
   ```

3. **Persistent model cache**: Mount a volume to avoid re-downloading the model:
   ```yaml
   volumes:
     - whisper-cache:/root/.cache/whisper
   ```

## Troubleshooting

### Service won't start

- Check Docker logs: `docker-compose logs`
- Ensure port 9000 is not in use: `lsof -i :9000`

### Transcription is slow

- Consider using a smaller model (`tiny` or `base`)
- Enable GPU acceleration if available
- Ensure adequate CPU/memory resources

### Out of memory errors

- Use a smaller Whisper model
- Increase Docker memory limits
- Process shorter audio clips

### Audio format not supported

- Convert audio to WAV format before uploading
- Ensure the audio file is not corrupted

## Development

To run the service locally without Docker:

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
python server.py
```

Note: You'll need FFmpeg installed on your system for audio processing.

## License

MIT
