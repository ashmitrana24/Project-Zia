/**
 * Wandbox Compiler IDs for supported languages.
 * Source: wandbox.org/api/compiler/list.json
 */
export const LANGUAGE_MAP = {
  'cpp': {
    compiler: 'gcc-13.2.0',
    name: 'C++'
  },
  'java': {
    compiler: 'openjdk-jdk-21+35',
    name: 'Java'
  },
  'python': {
    compiler: 'cpython-3.13.8',
    name: 'Python'
  }
};

/**
 * Validates if the language is supported.
 * @param {string} lang 
 * @returns {boolean}
 */
export function isSupported(lang) {
  return !!LANGUAGE_MAP[lang.toLowerCase()];
}

/**
 * Gets the Wandbox compiler for a language.
 * @param {string} lang 
 * @returns {Object|null}
 */
export function getLanguageConfig(lang) {
  return LANGUAGE_MAP[lang.toLowerCase()] || null;
}
