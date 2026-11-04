import React from 'react';

/**
 * Word component memoized with React.memo.
 * Re-renders only when target characters, typed letters, or active status change.
 */
export const Word = React.memo(function Word({
  word,
  typedLetters,
  isActive,
  wordIndex,
  onLetterMount,
}){
  const letters = word.split('');
  const extraLetters = typedLetters ? typedLetters.slice(letters.length) : [];

  return (
    <div className={`word ${isActive ? 'active' : ''}`} data-word-index={wordIndex}>
      {letters.map((char, charIdx) => {
        let status = 'untyped';
        if (typedLetters && charIdx < typedLetters.length) {
          status = typedLetters[charIdx] === char ? 'correct' : 'incorrect';
        }

        return (
          <span
            key={charIdx}
            className={`letter ${status}`}
            data-char-index={charIdx}
            ref={(el) => {
              if (isActive && onLetterMount) {
                onLetterMount(charIdx, el);
              }
            }}
          >
            {char}
          </span>
        );
      })}

      {extraLetters.map((char, extraIdx) => {
        const charIdx = letters.length + extraIdx;
        return (
          <span
            key={`extra-${charIdx}`}
            className="letter extra"
            data-char-index={charIdx}
            ref={(el) => {
              if (isActive && onLetterMount) {
                onLetterMount(charIdx, el);
              }
            }}
          >
            {char}
          </span>
        );
      })}
    </div>
  );
});

