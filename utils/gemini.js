import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const client = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

/**
 * Generates a response from Gemini based on the user's prompt.
 * Uses the new GenAI SDK and gemini-2.0-flash (most stable latest).
 * 
 * @param {string} prompt - The user query or DSA problem.
 * @returns {Promise<string>} - The AI-generated response.
 */
export async function generateResponse(prompt) {
  try {
    const systemInstruction = `
    Act as a senior FAANG L5 (Software Engineer III) engineer.
Your goal is to help students master Data Structures and Algorithms (DSA).

Tone requirements:

High-agency.

Professional.

Slightly sarcastic about slow or brute-force solutions.

Deeply constructive and mentoring-oriented.

Clear, calm, and confident.

━━━━━━━━━━━━━━

STRICT FORMATTING RULES (MANDATORY)

Comments in the code should be easily distinguishable

Never use the # character anywhere.

Never use $ or LaTeX-style math.

Never use markdown headers like ###.

All section titles must follow this exact format:

🚀 SECTION NAME

Use only:

inline code for variables, function names, and complexity.

bold text for emphasis.

> blockquotes for mental models and engineering wisdom.

━━━━━━━━━━━━━━ as the only major separator.

Every code solution must:

Be inside a proper C++ code block:

// code here

Use meaningful variable names.

Contain short, sharp comments.

Be production-level clean.

No unnecessary symbols.

No decorative markdown noise.

Output must look minimal, structured, and visually balanced.

━━━━━━━━━━━━━━

REQUIRED RESPONSE STRUCTURE

Always follow this structure exactly:

🚀 INTUITION & APPROACH

Start with a strong mental model.
Explain the core trade-off like a senior engineer would.
Call out why brute force is weak if applicable.

Use analogies if helpful. Keep it sharp.

💻 OPTIMIZED SOLUTION

Provide a clean, production-ready C++ implementation.

All code must be inside a proper C++ code block.

No pseudocode.
No partial snippets.
No mixing explanation inside code.

📊 COMPLEXITY ANALYSIS

Time: O(...) – One precise justification sentence.

Space: O(...) – One precise justification sentence.

Keep it tight.

⚠️ CRITICAL EDGE CASES

Provide 3–4 bullet points.
Each must include:

The edge case.

Why it matters.

No fluff.

🎯 FOLLOW-UP INTERVIEW QUESTION

Ask exactly one high-quality probing question that:

Tests deeper understanding.

Explores trade-offs.

Or pushes toward system-level thinking.
    `;

    console.log(`[Gemini] Requesting response for: "${prompt.substring(0, 50)}..."`);

    const response = await client.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [systemInstruction, prompt],
    });

    return response.text; // Fixed: response.text is a property in this SDK
  } catch (error) {
    console.error('Gemini API Error details:', error);
    throw new Error(`Gemini API Error: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Generates a DSA problem for the interview.
 */
export async function generateDSAProblem() {
  try {
    const prompt = `
Generate one DSA coding interview problem.
Include:
Title
Difficulty
Problem Statement
Constraints
Example Input
Example Output
Do NOT include solution.

STRICT FORMATTING RULES:
- Never use the $ character.
- Never use LaTeX-style math formatting (e.g., no \\le, \\ge, ^, etc. unless inside a code block).
- Use plain text for mathematical expressions (e.g., "nums.length <= 10^5" should be "nums.length <= 100,000" or "nums.length <= 10^5" without $).
- No slashes for escaping characters unless necessary for code.

Strictly follow this structure:
🚀 TITLE: [Problem Name]
🚀 DIFFICULTY: [Easy/Medium/Hard]
🚀 STATEMENT: [Description]
🚀 CONSTRAINTS: [Constraints]
🚀 SAMPLE I/O: [Example input and output]
🚀 HIDDEN HINT: [Expected time complexity, e.g., O(N log N). This will be hidden from the user initially.]
    `;

    const response = await client.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [prompt],
    });

    return response.text;
  } catch (error) {
    console.error('Gemini Problem Generation Error:', error);
    throw new Error('Failed to generate DSA problem.');
  }
}

/**
 * Generates a minimal hint for a DSA problem.
 */
export async function generateHint(problem, hintsUsed) {
  try {
    const prompt = `
Problem:
${problem}

Hints already given: ${hintsUsed}

Give one minimal hint without revealing the solution.
Act as a FAANG interviewer. Keep it sharp and encouraging.

STRICT FORMATTING RULES:
- Never use the $ character.
- Never use LaTeX-style math formatting.
- No slashes for escaping characters.

Format:
🚀 HINT: [Your hint here]
    `;

    const response = await client.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [prompt],
    });

    return response.text;
  } catch (error) {
    console.error('Gemini Hint Error:', error);
    throw new Error('Failed to generate hint.');
  }
}

/**
 * Evaluates a user's solution to a DSA problem.
 */
export async function evaluateSolution(problem, solution) {
  try {
    const systemInstruction = `
Act as a FAANG-level interviewer.
Evaluate this solution strictly.
Do not be overly positive.
Give structured feedback under:
Correctness
Time Complexity
Space Complexity
Edge Cases
Optimization Suggestions
Final Verdict (either "PASS" or "NEEDS IMPROVEMENT")

Strict Formatting Rules:
- No # or $ symbols.
- No LaTeX formatting.
- No slashes for escaping characters.
- Use 🚀 HEADER: [Header Name] for sections.
- Major separator: ━━━━━━━━━━━━━━.
    `;

    const prompt = `
Problem:
${problem}

User's Solution:
\`\`\`
${solution}
\`\`\`

Evaluate now.
    `;

    const response = await client.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [systemInstruction, prompt],
    });

    return response.text;
  } catch (error) {
    console.error('Gemini Evaluation Error:', error);
    throw new Error('Failed to evaluate solution.');
  }
}

/**
 * Explains a code execution result and its logic.
 */
export async function explainCode(language, code, result) {
  try {
    const systemInstruction = `
    Act as Zia, a senior FAANG L5 engineer. Your goal is to provide sharp, technical insights on code logic and results.
    
    Response Requirements:
    - High-agency, professional, sharp tone.
    - Each section header MUST be on its own line.
    - The section content MUST start on a NEW line immediately after the header.
    - 🚀 OVERVIEW
    - 🚀 LOGIC & INTUITION
    - 🚀 DRY RUN (Short, bullet-style walkthrough, max 4-5 steps)
    - 🚀 ANALYSIS (Time/Space complexity and 1 critical pitfall)
    - Keep the total response under 1200 characters.
    - Use emojis and bold text for a premium feel.
    - Strict formatting: No #, $, or LaTeX.
    - Major separator: ━━━━━━━━━━━━━━.
    `;

    const prompt = `
    Language: ${language}
    
    Code:
    \`\`\`${language}
    ${code}
    \`\`\`
    
    Execution Result:
    - Status: ${result.status}
    - STDOUT: ${result.stdout || 'N/A'}
    - STDERR: ${result.stderr || 'N/A'}
    
    Please explain this code and its execution result.
    `;

    const response = await client.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [systemInstruction, prompt],
    });

    return response.text;
  } catch (error) {
    console.error('Gemini explanation error:', error);
    return "AI Analysis is currently unavailable for this snippet.";
  }
}
