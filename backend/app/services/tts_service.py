"""
TTS Service using edge-tts (Microsoft Edge Neural Voices).
Provides ultra-realistic, studio-quality French voices for free.
"""

import edge_tts
import io
import asyncio

# Default voice for the jury president: fr-FR-HenriNeural (natural male French voice)
DEFAULT_VOICE = "fr-FR-HenriNeural"

# Available high-quality French neural voices:
# - fr-FR-HenriNeural (Male, deep, professional)
# - fr-FR-DeniseNeural (Female, clear, natural)
# - fr-FR-RemyMultilingualNeural (Male, smooth)

async def generate_speech(text: str, voice: str = DEFAULT_VOICE) -> bytes:
    """
    Generate MP3 audio bytes for the given text using Microsoft Edge Neural TTS.
    """
    if not text or not text.strip():
        return b""

    communicate = edge_tts.Communicate(text, voice)
    audio_stream = io.BytesIO()
    
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_stream.write(chunk["data"])

    audio_stream.seek(0)
    return audio_stream.read()
