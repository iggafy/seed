import { ipcMain } from 'electron';
import { GoogleGenAI, Type } from "@google/genai";
import OpenAI from "openai";

// types definitions locally since we can't easily import from ../types.ts in commonjs/esm mix easily without build step involvement sometimes
// But for this handler, we just need to handle the request execution.

const getGeminiClient = (apiKey) => new GoogleGenAI({ apiKey });
const getOpenAIClient = (apiKey, baseURL) => new OpenAI({ apiKey, baseURL });

export function setupIpcHandlers() {
    ipcMain.handle('ai:generate', async (event, { provider, apiKey, model, messages, jsonSchema, systemPrompt }) => {
        try {
            console.log(`[Main] AI Request: ${provider} - ${model}`);

            if (provider === 'GEMINI') {
                return await handleGemini(apiKey, model, messages, jsonSchema);
            } else {
                // OpenAI or DeepSeek
                return await handleOpenAI(provider, apiKey, model, messages, jsonSchema, systemPrompt);
            }
        } catch (error) {
            console.error("[Main] AI Request Failed:", error);
            // Return serializable error
            return { error: error.message || "Unknown Error", details: error.response ? error.response.data : null };
        }
    });
}

async function handleGemini(apiKey, model, messages, jsonSchema) {
    const client = getGeminiClient(apiKey);
    // Messages from frontend are usually [{role, content}]. 
    // Gemini 1.5/2.0 generic usage often takes a simple prompt or array.
    // For this specific app, aiService.ts sends a prompt string mostly.
    // Let's adapt. If 'messages' is an array, we grab user content.

    // In our aiService, we pass a prompt string. Let's assume the frontend sends the prompt or messages properly.
    // Looking at aiService.ts, it calls runGeminiRequest with a prompt string.
    // We should genericize the IPC payload to accept 'prompt' or 'messages'.

    // Actually, to make it clean, let's keep the logic close to the SDKs.
    // Re-reading aiService.ts... it uses client.models.generateContent({ contents: prompt ... })

    // Let's expect 'contents' field for Gemini for flexibility, or just 'prompt'.
    // Let's go with 'prompt' since that's what aiService uses.

    const prompt = messages.find(m => m.role === 'user')?.content || "";
    const responseSchema = jsonSchema ? jsonSchema : undefined; // Schema should be passed in compatible format

    // Note: The schema passed from frontend might need conversion if complex, 
    // but the Google GenAI SDK Type.OBJECT stuff is simpler if we construct it here or pass raw JSON schema.
    // The current aiService uses Type.OBJECT etc helper enums. 
    // We should probably accept the raw JSON schema object from the frontend.

    const config = {
        responseMimeType: "application/json",
    };
    if (responseSchema) {
        config.responseSchema = responseSchema;
    }

    const response = await client.models.generateContent({
        model: model,
        contents: prompt,
        config: config
    });

    if (response.textAsString) {
        // handle older sdk
        return { content: response.textAsString };
    }
    return { content: response.text() };
}

async function handleOpenAI(provider, apiKey, model, messages, jsonSchema, systemPrompt) {
    const isDeepSeek = provider === 'DEEPSEEK';
    const baseURL = isDeepSeek ? "https://api.deepseek.com/v1" : undefined;

    const client = getOpenAIClient(apiKey, baseURL);

    // Construct response format
    let response_format;
    if (isDeepSeek) {
        response_format = { type: "json_object" };
    } else if (jsonSchema) {
        response_format = {
            type: "json_schema",
            json_schema: jsonSchema
        };
    }

    // Construct messages
    // The frontend aiService passes a system prompt + user prompt usually.
    // We can just accept the full 'messages' array from the frontend.

    const response = await client.chat.completions.create({
        model: model,
        messages: messages, // Array of {role, content}
        response_format: response_format
    });

    return { content: response.choices[0].message.content };
}
