const BaseProvider = require('./base.provider');
const { environment } = require('../../../config/environment');
const { GoogleGenAI } = require('@google/genai');

class GeminiProvider extends BaseProvider {
  async generateSummary(systemPrompt, userPrompt) {
    if (!environment.geminiApiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const ai = new GoogleGenAI({ apiKey: environment.geminiApiKey });

    const model = process.env.GEMINI_MODEL || environment.geminiModel || 'gemini-3.6-flash';

    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      });
      
      const textOutput = response.text || '';
      return this.parseJsonResponse(textOutput);
    } catch (error) {
      console.error('[GeminiProvider] SDK Error:', error);
      throw error;
    }
  }
}

module.exports = GeminiProvider;
