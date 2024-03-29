export function paramsSplitter(params: string | undefined): string[] {
  const list: string[] = [];
  if (!params) return list;

  let insideQuote: '\''|'"'|'' = '';
  let startBlock = 0;
  let i = 0;
  let skipNext = false;

  for (const letter of params) {
    if (skipNext) {
      skipNext = false;
    } else {		
      if (letter === '\\') {
        skipNext = true;

      } else if (letter === ' ') {
        if (!insideQuote) {			
          if (startBlock !== i) {
            list.push(params.slice(startBlock, i));
          }
          startBlock = i + 1;
        }

      } else if (letter === '\'' || letter === '"') {
        if (insideQuote) {
          if (insideQuote === letter) {
            list.push(params.slice(startBlock, i));
            startBlock = i + 1;
            insideQuote = '';
          }
        } else {
          insideQuote = letter;
          startBlock = i + 1;
        }
      }
    }
    i++;
  }
  if (startBlock < i) {
    const lastWord = params.slice(startBlock).trim();
    if (lastWord)
      list.push(lastWord);
  }

  return list;
}