/**
 * Heuristic-based language detector for code snippets.
 * Supports: C++, Java, Python.
 */

export function detectLanguage(code) {
  const codeContent = code.trim();

  // 1. C++ Heuristics
  const cppPatterns = [
    /#include\s*<[a-z]+>/i,
    /std::[a-z]+/i,
    /cout\s*<</,
    /cin\s*>>/,
    /int\s+main\s*\(/,
    /using\s+namespace\s+std/,
    /vector\s*<[a-z0-9_&*]+>/i,
    /unordered_(map|set)\s*</i,
    /Solution\s*{/i,
    /public:\s*[a-z0-9_]+.*\(.*\) {/i
  ];

  // 2. Java Heuristics
  const javaPatterns = [
    /public\s+class\s+[a-z0-9_]+/i,
    /static\s+void\s+main\s*\(/i,
    /System\.out\.print/i,
    /package\s+[a-z0-9_.]+/i,
    /import\s+java\./i,
    /Solution\s*{[\s\n]*public\s+[a-z0-9[\]<>]+\s+[a-z0-9_]+\s*\(/i,
    /int\[\]\s+[a-z0-9_]+/i,
    /List<[A-Z][a-z]+>/
  ];

  // 3. Python Heuristics
  const pythonPatterns = [
    /^def\s+[a-z0-9_]+\s*\(/m,
    /^elif\s+/m,
    /^import\s+[a-z0-9_]+/m,
    /^from\s+[a-z0-9_]+\s+import/m,
    /print\s*\(/,
    /if\s+__name__\s*==\s*['"]__main__['"]:/,
    /class\s+Solution(:\s*|\([\s\S]*\):)/i,
    /self[,.]/i,
    /List\[[a-z0-9_]+\]/i,
    /Optional\[[a-z0-9_]+\]/i,
    /->\s+[a-z0-9[\]]+/i
  ];

  // Scoring
  let scores = {
    cpp: 0,
    java: 0,
    python: 0
  };

  cppPatterns.forEach(pattern => { if (pattern.test(codeContent)) scores.cpp += 2; });
  javaPatterns.forEach(pattern => { if (pattern.test(codeContent)) scores.java += 2; });
  pythonPatterns.forEach(pattern => { if (pattern.test(codeContent)) scores.python += 2; });

  // Additional Check for Semicolons (C++ and Java weighted)
  const semicolonCount = (codeContent.match(/;/g) || []).length;
  if (semicolonCount > 2) {
    scores.cpp += 1;
    scores.java += 1;
  } else if (semicolonCount === 0 && codeContent.length > 20) {
    scores.python += 1;
  }

  // Bracket matching for Java/C++
  if (codeContent.includes('{') && codeContent.includes('}')) {
    scores.cpp += 1;
    scores.java += 1;
  }

  // Determine winner
  let maxScore = 0;
  let detected = 'python'; // Default if no score, but we'll try to be smarter

  for (const lang in scores) {
    if (scores[lang] > maxScore) {
      maxScore = scores[lang];
      detected = lang;
    }
  }

  console.log('Detection Scores:', scores, 'Winner:', detected);
  return detected;
}
