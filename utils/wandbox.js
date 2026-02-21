import axios from 'axios';
import { getLanguageConfig } from './languages.js';

/**
 * Executes code using the Wandbox API (wandbox.org).
 * 
 * @param {string} language - The language key (cpp, java, python).
 * @param {string} sourceCode - The code to execute.
 * @returns {Promise<Object>} - The execution results.
 */
export async function executeCode(language, sourceCode) {
  const config = getLanguageConfig(language);

  if (!config) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const payload = {
    compiler: config.compiler,
    code: sourceCode,
    save: false
  };

  try {
    const response = await axios.post('https://wandbox.org/api/compile.json', payload);
    const { program_message, program_error, compiler_message, compiler_error, status } = response.data;

    // Wandbox combines stdout and message in program_message
    return {
      stdout: program_message || '',
      stderr: program_error || '',
      compile_output: compiler_message || compiler_error || '',
      status: status === '0' || status === 0 ? 'Success' : `Exit Code: ${status}`,
      time: 'N/A',
      memory: 'N/A'
    };
  } catch (error) {
    console.error('Wandbox API Error:', error.response?.data || error.message);
    throw new Error('Failed to execute code via Wandbox. Please check your internet connection or try again later.');
  }
}
