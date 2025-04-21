import React, { useState, useEffect } from "react";

// Helper function to generate random glitchy characters
const getRandomChar = () => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789~!@#$%^&*()_+`-={}|[]\\:\";'<>?,./";
  // Add some block elements and symbols for extra chaos
  const specials = ["█", "▓", "▒", "░", "_", "-", "=", "*", "+", "#", "@"];
  const combined = chars + specials.join("");
  return combined[Math.floor(Math.random() * combined.length)];
};

const LoadingFallback: React.FC = () => {
  const baseText = "Loading...";
  const [displayText, setDisplayText] = useState(baseText);

  useEffect(() => {
    let glitchInterval: NodeJS.Timeout;

    const updateText = () => {
      let newText = "";
      for (let i = 0; i < baseText.length; i++) {
        // Randomly replace characters or keep original
        newText += Math.random() > 0.85 ? getRandomChar() : baseText[i];
      }
      // Occasionally apply the full glitch animation class via state (less frequent)
      // For now, let's rely on character replacement and the flicker on the parent
      setDisplayText(newText);
    };

    // Update text rapidly for a chaotic effect
    glitchInterval = setInterval(updateText, 100);

    // Clean up interval on component unmount
    return () => clearInterval(glitchInterval);
  }, [baseText]);

  return (
    // Apply flicker animation to the main container
    <div className="flex items-center justify-center h-screen w-screen bg-background text-foreground font-mono animate-flicker overflow-hidden">
      {/* Apply glitch animation to the text container */}
      {/* Note: Applying `animate-glitch` constantly can be visually jarring; consider applying it more selectively */}
      <div className="relative">
        <p className="text-2xl text-accentGreen relative z-10">
          {displayText}
          {/* Blinking cursor */}
          <span className="inline-block w-3 h-6 bg-accentGreen ml-1 animate-blink"></span>
        </p>
        {/* Optional: Add a second layer for more intense glitch text-shadow effects if needed */}
        {/* <p className="absolute top-0 left-0 text-2xl text-accentRed opacity-70 animate-glitch z-0">{displayText}</p> */}
      </div>
    </div>
  );
};

export default LoadingFallback;
