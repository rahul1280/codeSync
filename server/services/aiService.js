const env = require('../config/env');
const AppError = require('../utils/AppError');

// ─── Provider Detection ─────────────────────────────────────────
// Priority: GEMINI_API_KEY > OLLAMA_BASE_URL > fallback analysis
function getActiveProvider() {
  if (env.GEMINI_API_KEY) return 'gemini';
  if (env.OLLAMA_BASE_URL) return 'ollama';
  return 'none';
}

// ─── Google Gemini AI ────────────────────────────────────────────

async function geminiGenerate(prompt, systemInstruction = '') {
  const apiKey = env.GEMINI_API_KEY;
  const model = env.GEMINI_MODEL || 'gemini-3.8-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const timeoutMs = env.AI_TIMEOUT_MS || 60000;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const body = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ]
    };

    // Add system instruction if provided
    if (systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    // Safety settings — allow code-related content
    body.safetySettings = [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
    ];
    //.........................................
    // body.generationConfig = {
    //   temperature: 0.4,
    //   maxOutputTokens: 2048
    // };

    body.generationConfig = {
      maxOutputTokens: 1024,
      thinkingConfig: {
        thinkingLevel: 'low'
      }
    };

    //.........................................
    //...
    const startedAt = Date.now();
    console.log(`Gemini request started: model=${model}`);
    //..


    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    console.log(
      `Gemini response received in ${Date.now() - startedAt}ms, status=${response.status}`
    );

    clearTimeout(timeout);
    //............................................
    // if (!response.ok) {
    //   const errorData = await response.text();
    //   let errorMsg = `Gemini API error (${response.status})`;

    //   if (response.status === 400) {
    //     errorMsg = 'Invalid request to Gemini API. Check your API key and model name.';
    //   } else if (response.status === 403) {
    //     errorMsg = 'Gemini API key is invalid or expired. Please check your GEMINI_API_KEY.';
    //   } else if (response.status === 429) {
    //     errorMsg = 'Gemini API rate limit exceeded. Free tier allows 15 requests/minute. Please wait and try again.';
    //   }

    //   throw new AppError(errorMsg, response.status === 429 ? 429 : 502, 'AI_SERVICE_ERROR');
    // }


    if (!response.ok) {
      const errorData = await response.text();

      console.error('Gemini API error:', {
        status: response.status,
        body: errorData
      });

      throw new AppError(
        `Gemini API error (${response.status}): ${errorData}`,
        response.status === 429 ? 429 : 502,
        'AI_SERVICE_ERROR'
      );
    }

    //............................................
    const data = await response.json();

    // Extract text from Gemini response
    const candidates = data.candidates;
    if (!candidates || candidates.length === 0) {
      throw new AppError('Gemini returned empty response', 502, 'AI_EMPTY_RESPONSE');
    }

    const text = candidates[0].content?.parts?.[0]?.text;
    if (!text) {
      throw new AppError('Gemini returned no text content', 502, 'AI_EMPTY_RESPONSE');
    }

    return text;
  } catch (error) {
    clearTimeout(timeout);
    if (error.name === 'AbortError') {
      throw new AppError(
        `AI request timed out after ${timeoutMs / 1000}s. Try again.`,
        504,
        'AI_TIMEOUT'
      );
    }
    if (error instanceof AppError) throw error;
    throw new AppError(
      `Gemini AI error: ${error.message}`,
      503,
      'AI_SERVICE_UNAVAILABLE'
    );
  }
}

// ─── Ollama (Local) ──────────────────────────────────────────────

async function ollamaGenerate(prompt, systemInstruction = '') {
  const baseUrl = env.OLLAMA_BASE_URL.replace(/\/$/, '');
  const timeoutMs = env.AI_TIMEOUT_MS || 60000;

  // Resolve model name
  let model = env.OLLAMA_MODEL || 'codellama';
  try {
    const tagRes = await fetch(`${baseUrl}/api/tags`, { signal: AbortSignal.timeout(3000) });
    if (tagRes.ok) {
      const tagData = await tagRes.json();
      const installed = (tagData.models || []).map((m) => m.name);
      if (installed.length > 0) {
        const match = installed.find(
          (m) => m === model || m.startsWith(`${model}:`) || m.replace(/:latest$/, '') === model
        );
        model = match || installed[0];
      }
    }
  } catch (_) { /* ignore */ }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        system: systemInstruction,
        stream: false
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      throw new AppError(
        `Ollama error (${response.status}): ${errorText}`,
        502,
        'AI_SERVICE_ERROR'
      );
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    clearTimeout(timeout);
    if (error.name === 'AbortError') {
      throw new AppError(
        `AI request timed out after ${timeoutMs / 1000}s. Model may still be loading.`,
        504,
        'AI_TIMEOUT'
      );
    }
    if (error instanceof AppError) throw error;
    throw new AppError(
      `Ollama unavailable: ${error.message}`,
      503,
      'AI_SERVICE_UNAVAILABLE'
    );
  }
}

// ─── Fallback Static Analysis ────────────────────────────────────

function fallbackAnalysis(code, language) {
  const lines = code.trim().split('\n');
  const funcs = lines.filter((l) =>
    /function\s+|const\s+\w+\s*=\s*(async\s*)?\(|def\s+|class\s+/.test(l)
  );

  return (
    `### ⚡ CodeSync Code Analysis\n\n` +
    `*(AI service is not configured. Here is a basic code breakdown:)*\n\n` +
    `1. **Language & Lines**: ${language.toUpperCase()} (${lines.length} lines)\n` +
    `2. **Key Definitions Detected**:\n` +
    (funcs.length > 0
      ? funcs.map((f) => `   - \`${f.trim().slice(0, 80)}\``).join('\n')
      : '   - Inline script without named top-level definitions') +
    '\n\n' +
    `3. **To enable AI explanations**, add a Gemini API key to your \`.env\` file:\n` +
    `   \`\`\`\n   GEMINI_API_KEY=your-api-key-here\n   \`\`\`\n` +
    `   Get a free key at: https://aistudio.google.com/apikey`
  );
}

// ─── Main Generate Function ─────────────────────────────────────

async function generateAiResponse(prompt, systemInstruction = '', fallbackCode = '', fallbackLang = 'javascript') {
  const provider = getActiveProvider();

  if (provider === 'gemini') {
    return geminiGenerate(prompt, systemInstruction);
  }

  if (provider === 'ollama') {
    try {
      return await ollamaGenerate(prompt, systemInstruction);
    } catch (error) {
      // If Ollama fails and we have code, return fallback
      if (fallbackCode) {
        return fallbackAnalysis(fallbackCode, fallbackLang);
      }
      throw error;
    }
  }

  // No provider configured — return fallback analysis
  if (fallbackCode) {
    return fallbackAnalysis(fallbackCode, fallbackLang);
  }

  throw new AppError(
    'AI service is not configured. Set GEMINI_API_KEY in your .env file. Get a free key at https://aistudio.google.com/apikey',
    503,
    'AI_NOT_CONFIGURED'
  );
}

// ─── Public API ─────────────────────────────────────────────────

async function checkAiAvailability() {
  const provider = getActiveProvider();

  if (provider === 'gemini') {
    // Quick validation — try listing models
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${env.GEMINI_API_KEY}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (response.ok) {
        return {
          available: true,
          provider: 'gemini',
          model: env.GEMINI_MODEL || 'gemini-2.0-flash'
        };
      }
      return { available: false, provider: 'gemini', error: `API returned ${response.status}` };
    } catch (error) {
      return { available: false, provider: 'gemini', error: error.message };
    }
  }

  if (provider === 'ollama') {
    try {
      const url = `${env.OLLAMA_BASE_URL.replace(/\/$/, '')}/api/tags`;
      const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (response.ok) {
        const data = await response.json();
        return {
          available: true,
          provider: 'ollama',
          model: env.OLLAMA_MODEL || 'codellama',
          installedModels: (data.models || []).map((m) => m.name)
        };
      }
      return { available: false, provider: 'ollama', error: `HTTP ${response.status}` };
    } catch (error) {
      return { available: false, provider: 'ollama', error: error.message };
    }
  }

  return {
    available: false,
    provider: 'none',
    error: 'No AI provider configured. Set GEMINI_API_KEY in your .env file.'
  };
}

async function explainCode(code, language = 'javascript') {
  const system =
    'You are an expert programming assistant in CodeSync, a collaborative coding platform. ' +
    'Provide clear, concise explanations. Use markdown formatting. ' +
    'Label your response as an AI-generated suggestion that may be inaccurate.';

  const prompt =
    `Please explain the following ${language} code clearly:\n\n` +
    `\`\`\`${language}\n${code}\n\`\`\`\n\n` +
    `Explain:\n` +
    `1. Overall purpose\n` +
    `2. Key functions/logic breakdown\n` +
    `3. Time and space complexity (if applicable)\n` +
    `4. Potential pitfalls or edge cases`;

  return generateAiResponse(prompt, system, code, language);
}

async function suggestTests(code, language = 'javascript') {
  const system =
    'You are an expert software engineer writing comprehensive unit tests. ' +
    'Provide ready-to-run test code. Use markdown formatting. ' +
    'Label your response as an AI-generated suggestion that may be inaccurate.';

  const prompt =
    `Write unit tests for the following ${language} code. ` +
    `Include standard cases, edge cases, and error cases:\n\n` +
    `\`\`\`${language}\n${code}\n\`\`\`\n\n` +
    `Provide ready-to-run test code and brief notes.`;

  return generateAiResponse(prompt, system, code, language);
}

module.exports = {
  checkAiAvailability,
  explainCode,
  suggestTests
};
