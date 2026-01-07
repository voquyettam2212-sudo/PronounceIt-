import { GoogleGenAI, Type, Modality } from "@google/genai";
import { PronunciationAnalysis } from "../types";

const getGeminiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
};

export const analyzeSpeech = async (audioBase64: string, transcript: string): Promise<PronunciationAnalysis> => {
  const ai = getGeminiClient();
  
  const prompt = `
    Task: Analyze this English spoken audio for pronunciation and grammar.
    User's Speech Transcript (Reference): "${transcript}"
    
    1. Calculate an accuracy score (0-100).
    2. Identify specific mispronounced words. Compare audio to the standard English pronunciation.
    3. Check for grammar, word choice, or naturalness errors.
    4. Provide short, encouraging feedback in Vietnamese (summaryVi).
    5. For each grammar error, provide a clear explanation in Vietnamese.
    
    Return the result strictly in this JSON format:
    {
      "overallScore": number,
      "transcription": string,
      "words": [{"text": string, "status": "correct" | "mispronounced", "phonetic": string}],
      "grammarErrors": [{"phrase": string, "explanationVi": string, "correction": string, "examples": [string]}],
      "summaryVi": string
    }
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      { text: prompt },
      { inlineData: { mimeType: 'audio/wav', data: audioBase64 } }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          overallScore: { type: Type.NUMBER },
          transcription: { type: Type.STRING },
          words: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                status: { type: Type.STRING, enum: ['correct', 'mispronounced'] },
                phonetic: { type: Type.STRING }
              },
              required: ["text", "status"]
            }
          },
          grammarErrors: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                phrase: { type: Type.STRING },
                explanationVi: { type: Type.STRING },
                correction: { type: Type.STRING },
                examples: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["phrase", "explanationVi", "correction", "examples"]
            }
          },
          summaryVi: { type: Type.STRING }
        },
        required: ["overallScore", "transcription", "words", "grammarErrors", "summaryVi"]
      }
    }
  });

  return JSON.parse(response.text);
};

export const speakWord = async (text: string, voice: 'Kore' | 'Puck' = 'Kore') => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Say clearly: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voice },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (base64Audio) {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const audioData = decode(base64Audio);
    const buffer = await decodeAudioData(audioData, audioContext, 24000, 1);
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start();
  }
};

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}