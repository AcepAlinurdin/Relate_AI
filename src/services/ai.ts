import { aiConfigService } from './aiConfig';

const constructSystemPrompt = async () => {
    try {
        const config = await aiConfigService.getConfig();
        if (!config) return '';

        let prompt = `You are a helpful AI assistant for a business.\n\n`;
        prompt += `Business Name: ${config.question_1}\n`;
        prompt += `Target Audience: ${config.question_2}\n`;
        prompt += `Unique Selling Point: ${config.question_3}\n`;
        prompt += `Tone of Voice: ${config.question_4}\n`;
        prompt += `Bot Goal: ${config.question_5}\n`;
        if (config.additional_details) {
            prompt += `Additional Details: ${config.additional_details}\n`;
        }
        prompt += `\nPlease answer the user's questions based on this information. Maintain the specified tone of voice.\n\n`;
        return prompt;
    } catch (error) {
        console.warn('Failed to fetch AI config for system prompt:', error);
        return '';
    }
};

export const generateResponse = async (prompt: string, model: string = 'llama3') => {
    const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

    // Construct system prompt from stored config
    const systemPrompt = await constructSystemPrompt();
    const fullPrompt = systemPrompt ? `${systemPrompt}User Question: ${prompt}` : prompt;

    try {
        const response = await fetch(`${ollamaUrl}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model,
                prompt: fullPrompt,
                stream: false,
            }),
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.response;
    } catch (error) {
        console.error('Error calling Ollama:', error);
        throw error;
    }
};
