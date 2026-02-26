import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";
import { Language, SkillLevel, PracticeFlavor, PracticeMode, PracticeSession, PracticePrompt } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateSpeech(
  text: string,
  voiceName: string = 'Kore',
  accentName: string = ''
): Promise<string> {
  const prompt = accentName 
    ? `Say this in a natural ${accentName} accent: ${text}`
    : text;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("Failed to generate speech");
  return base64Audio;
}

export async function generateAssistantResponse(
  feedback: PracticeSession['feedback'],
  score: number,
  language: 'Target' | 'English',
  targetLanguage: string,
  englishAccent: string
): Promise<string> {
  const prompt = `You are a friendly accent tutor. 
  The student just completed a practice session in ${targetLanguage} and got a score of ${score}/100.
  Strengths: ${feedback.strengths.join(', ')}
  Improvements: ${feedback.improvements.join(', ')}
  
  Generate a short, encouraging conversational response (2-3 sentences) summarizing this feedback.
  The response MUST be in ${language === 'Target' ? targetLanguage : `English with a ${englishAccent} accent style`}.
  Provide ONLY the response text.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return response.text || "Good job on your practice!";
}

export async function generateSlangPrompt(
  language: Language,
  accentName: string,
  region: string,
  passageContext: string = ""
): Promise<{ sentence: string; terms: { term: string; meaning: string; wordType: string }[] }> {
  const contextStr = passageContext ? `The scenario/context for the sentence should be: "${passageContext}".` : "";
  const prompt = `Generate a short, natural sentence in ${language} that uses 1-2 slang terms specific to the ${accentName} accent (Region: ${region}). 
  ${contextStr}
  If the accent is very specific, use local slang. If not, use common ${language} slang.
  Highlight the slang terms in the sentence using **bold** text.
  
  Return the response in JSON format with:
  - sentence: the full sentence with bolded slang.
  - terms: an array of objects, each with 'term' (the slang word), 'meaning' (simple explanation in English), and 'wordType' (e.g., noun, verb, adjective, expression).`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          sentence: { type: Type.STRING },
          terms: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                term: { type: Type.STRING },
                meaning: { type: Type.STRING },
                wordType: { type: Type.STRING }
              },
              required: ["term", "meaning", "wordType"]
            }
          }
        },
        required: ["sentence", "terms"]
      }
    }
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Failed to parse slang prompt", e);
    throw new Error("Slang generation failed");
  }
}

export async function generatePracticePrompt(
  language: Language,
  skillLevel: SkillLevel,
  flavor: PracticeFlavor,
  mode: PracticeMode,
  priorityFlashcards: { word: string; frequency: number }[] = [],
  passageContext: string = ""
): Promise<PracticePrompt> {
  const levelDescriptions: Record<SkillLevel, string> = {
    'Novice': 'no experience, very simple words, very short phrases (3-5 words), basic sentence structure',
    'Beginner': 'basic experience, common vocabulary, simple sentences (5-8 words), clear pronunciation',
    'Intermediate': 'decent experience, varied vocabulary, moderate sentence structures (8-12 words), natural flow',
    'Advanced': 'a lot of experience, sophisticated vocabulary, complex sentences (12-18 words), idiomatic expressions',
    'Expert': 'near-native fluency, highly technical or literary vocabulary, complex structures (18-25 words), subtle nuances'
  };

  const priorityWordsStr = priorityFlashcards.length > 0 
    ? `Try to incorporate some of these words if they fit the context (frequency indicates priority 1-5): ${priorityFlashcards.map(f => `${f.word} (freq: ${f.frequency})`).join(', ')}.`
    : '';

  const contextStr = passageContext ? `The specific scenario or context for this content is: "${passageContext}".` : "";

  const prompt = `Generate a ${mode === 'Read' ? 'phrase to read aloud' : 'open-ended question'} in ${language} for a ${skillLevel} learner. 
  The learner's level is ${skillLevel} (${levelDescriptions[skillLevel]}).
  IMPORTANT: Keep the sentence relatively short and slightly easier than the typical level to ensure success.
  The style/flavor should be ${flavor}. 
  ${contextStr}
  ${priorityWordsStr}
  
  Return the response in JSON format with:
  - text: the ${language} text.
  - translation: English translation. IMPORTANT: Highlight the English equivalents of the vocabulary words below by wrapping them in **bold** text within this translation string.
  - vocabulary: an array of 2-3 advanced or interesting words from the text, each with 'word', 'definition' (in English), 'englishEquivalent' (the specific word or phrase used in the translation), and 'wordType' (e.g., noun, verb, adjective).`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING },
          translation: { type: Type.STRING },
          vocabulary: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                word: { type: Type.STRING },
                definition: { type: Type.STRING },
                englishEquivalent: { type: Type.STRING },
                wordType: { type: Type.STRING }
              },
              required: ["word", "definition", "englishEquivalent", "wordType"]
            }
          }
        },
        required: ["text", "translation", "vocabulary"]
      }
    }
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Failed to parse practice prompt", e);
    throw new Error("Prompt generation failed");
  }
}

export async function translateDefinition(
  definition: string,
  targetLanguage: string
): Promise<string> {
  const prompt = `Translate the following English definition into natural ${targetLanguage}: "${definition}". 
  Provide ONLY the translated text.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return response.text || definition;
}

export async function analyzeSpeech(
  audioBase64: string,
  prompt: string,
  language: Language,
  targetAccent: string,
  mode: PracticeMode,
  skillLevel: SkillLevel,
  mimeType: string = "audio/webm"
): Promise<PracticeSession['feedback'] & { score: number }> {
  const systemInstruction = `You are an expert accent coach for ${language}. 
  You are analyzing a student's recording of them ${mode === 'Read' ? 'reading' : 'responding to'} the prompt: "${prompt}".
  The student is a ${skillLevel} learner aiming for a ${targetAccent} accent.
  
  Analyze the audio for:
  1. Pronunciation accuracy (relative to a ${skillLevel} level).
  2. Intonation and rhythm (prosody).
  3. Specific accent features of ${targetAccent}.
  
  Provide feedback in JSON format with:
  - score: a number from 0 to 100.
  - strengths: an array of 2-3 things they did well.
  - improvements: an array of 2-3 specific areas to work on.
  - detailedAnalysis: a markdown string explaining the phonetics and rhythm issues.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: mimeType,
            data: audioBase64,
          },
        },
        { text: "Analyze this speech recording." }
      ],
    },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
          detailedAnalysis: { type: Type.STRING },
        },
        required: ["score", "strengths", "improvements", "detailedAnalysis"],
      },
    },
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    throw new Error("Analysis failed");
  }
}
