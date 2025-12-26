import { ipcMain } from 'electron';
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

const getGeminiClient = (apiKey) => new GoogleGenAI({ apiKey });
const getOpenAIClient = (apiKey, baseURL) => new OpenAI({ apiKey, baseURL });

export function setupIpcHandlers() {
    ipcMain.handle('ai:generate', async (event, { provider, apiKey, model, messages, jsonSchema, systemPrompt }) => {
        try {
            console.log(`[Main] AI Request: ${provider} - ${model}`);

            if (provider === 'GEMINI') {
                return await handleGemini(apiKey, model, messages, jsonSchema, systemPrompt);
            } else {
                return await handleOpenAI(provider, apiKey, model, messages, jsonSchema, systemPrompt);
            }
        } catch (error) {
            console.error("[Main] AI Request Failed:", error);
            return { error: error.message || "Unknown Error", details: error.response ? error.response.data : null };
        }
    });
}

async function handleGemini(apiKey, model, messages, jsonSchema, systemPrompt) {
    const client = getGeminiClient(apiKey);
    const modelId = model || "gemini-1.5-flash";

    let prompt = messages.find(m => m.role === 'user')?.content || "";
    if (systemPrompt) {
        prompt = `${systemPrompt}\n\nUSER REQUEST: ${prompt}`;
    }

    const config = {
        responseMimeType: "application/json",
    };
    if (jsonSchema) {
        config.responseSchema = jsonSchema;
    }

    const genModel = client.getGenerativeModel({ model: modelId });
    const result = await genModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: config
    });

    const response = await result.response;
    return { content: response.text() };
}

async function handleOpenAI(provider, apiKey, model, messages, jsonSchema, systemPrompt) {
    const isDeepSeek = provider === 'DEEPSEEK';
    const baseURL = isDeepSeek ? "https://api.deepseek.com/v1" : undefined;
    const defaultModel = isDeepSeek ? "deepseek-chat" : "gpt-4o";
    const modelId = model || defaultModel;

    const client = getOpenAIClient(apiKey, baseURL);

    let response_format;
    if (isDeepSeek) {
        response_format = { type: "json_object" };
    } else if (jsonSchema) {
        response_format = {
            type: "json_schema",
            json_schema: {
                name: "innovation_response",
                strict: true,
                schema: jsonSchema
            }
        };
    } else {
        // Default to json_object if any hint of JSON is needed
        response_format = { type: "json_object" };
    }

    const finalMessages = [...messages];
    if (systemPrompt) {
        finalMessages.unshift({ role: "system", content: systemPrompt });
    } else if (response_format?.type === "json_object") {
        finalMessages.unshift({ role: "system", content: "You are a helpful assistant designed to output JSON." });
    }

    const response = await client.chat.completions.create({
        model: modelId,
        messages: finalMessages,
        response_format: response_format
    });

    return { content: response.choices[0].message.content };
}
