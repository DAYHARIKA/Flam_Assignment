/**
 * A robust streaming JSON parser that extracts completed objects from an array in a partially generated JSON string.
 * This allows rendering cards/questions as they stream from the LLM, without waiting for the full stream to finish.
 */
export function parsePartialJson(jsonStr) {
  const result = {
    type: null,
    title: '',
    items: [],
    raw: jsonStr
  };

  if (!jsonStr) return result;

  // 1. Attempt to extract the type property (usually appears first)
  const typeMatch = jsonStr.match(/"type"\s*:\s*"([^"]*)"/);
  if (typeMatch) {
    result.type = typeMatch[1];
  }

  // 2. Attempt to extract the title property
  const titleMatch = jsonStr.match(/"title"\s*:\s*"([^"]*)"/);
  if (titleMatch) {
    result.title = titleMatch[1];
  }

  // 3. Determine the list key based on type or contents
  let listKey = null;
  if (result.type === 'flashcards' || jsonStr.includes('"cards"')) {
    listKey = 'cards';
  } else if (result.type === 'quiz' || jsonStr.includes('"questions"')) {
    listKey = 'questions';
  } else if (result.type === 'roadmap' || jsonStr.includes('"steps"')) {
    listKey = 'steps';
  }

  if (!listKey) return result;

  // 4. Locate the list array start '['
  const listKeyIndex = jsonStr.indexOf(`"${listKey}"`);
  if (listKeyIndex === -1) return result;

  const arrayStartIndex = jsonStr.indexOf('[', listKeyIndex);
  if (arrayStartIndex === -1) return result;

  // 5. Scan the text inside the array, balancing braces to find complete objects
  let braceDepth = 0;
  let objectStartIdx = -1;
  let inString = false;
  let escapeNext = false;

  for (let i = arrayStartIndex + 1; i < jsonStr.length; i++) {
    const char = jsonStr[i];

    // Handle escape characters inside strings
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    if (char === '\\') {
      escapeNext = true;
      continue;
    }

    // Toggle string literal flag to ignore braces inside string values
    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === '{') {
        if (braceDepth === 0) {
          objectStartIdx = i;
        }
        braceDepth++;
      } else if (char === '}') {
        braceDepth--;
        if (braceDepth === 0 && objectStartIdx !== -1) {
          const itemJsonStr = jsonStr.slice(objectStartIdx, i + 1);
          try {
            const parsedObj = JSON.parse(itemJsonStr);
            result.items.push(parsedObj);
          } catch (e) {
            // Failed to parse, wait for more data
          }
          objectStartIdx = -1;
        }
      } else if (char === ']') {
        // End of array reached
        if (braceDepth === 0) {
          break;
        }
      }
    }
  }

  return result;
}
