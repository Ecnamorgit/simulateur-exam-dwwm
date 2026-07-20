import asyncio

async def transcribe_audio_fallback(file_data: bytes) -> str:
    if not file_data:
        raise ValueError("Le fichier audio est vide")
    
    # Simulate an asynchronous transcription process
    await asyncio.sleep(2)
    
    return "Ceci est une transcription générée par le service de fallback du backend FastAPI."
