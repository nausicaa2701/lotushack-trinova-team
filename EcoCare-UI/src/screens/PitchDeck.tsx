import React from 'react';

export const PitchDeck: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 bg-white">
      <iframe
        src="/pitch-deck/index.html"
        className="w-full h-full border-0"
        title="Pitch Deck"
        sandbox="allow-scripts allow-same-origin allow-presentation"
      />
    </div>
  );
};
