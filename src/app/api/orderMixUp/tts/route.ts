import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // ElevenLabs API configuration
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    const VOICE_ID = "NMbn4FNN0acONjKLsueJ"; // Bob's voice for Mike the cashier

    if (!ELEVENLABS_API_KEY) {
      console.error('ElevenLabs API key not configured');
      return NextResponse.json({ error: 'TTS service not configured' }, { status: 500 });
    }

    // Call ElevenLabs TTS API
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      return NextResponse.json({ error: 'TTS generation failed' }, { status: response.status });
    }

    // Get the audio data
    const audioBuffer = await response.arrayBuffer();

    // Return the audio file
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error('Error in TTS endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
