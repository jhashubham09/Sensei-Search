//components/SearchInterface.jsx

"use client";
import React, { useState, useRef, useEffect } from "react";
import { useSpeechRecognition } from "react-speech-kit";

export default function SearchInterface() {
  const [query, setQuery] = useState("");
  const [image, setImage] = useState(null);

  const [mode, setMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("searchMode") || "hybrid";
    }
    return "hybrid";
  });
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  const { listen, listening, stop } = useSpeechRecognition({
    onResult: (result) => setQuery(result),
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("searchMode", mode);
    }
  }, [mode]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData();

    // Ensure query is a string
    if (query) {
      formData.append("text", query.trim());
    }

    if (image) {
      formData.append("image", image);
    }

    try {
      const response = await fetch(`/api/search?mode=${mode}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Search error:", error);
      setResults([
        {
          title: "Error",
          content: `An error occurred during search: ${error.message}`,
          source: null,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && !file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }
    setImage(file);
  };

  const triggerImageUpload = () => fileInputRef.current.click();

  const clearSearch = () => {
    setQuery("");
    setImage(null);
    setResults([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="cyber-container">
      <div className="cyber-header">
        <h1 className="cyber-title">
          <span className="glitch" data-text="Sensei-Search">
            Sensei-Search
          </span>
        </h1>
        <button
          onClick={() =>
            setMode((prev) => (prev === "hybrid" ? "semantic" : "hybrid"))
          }
          className="cyber-btn mode-btn"
        >
          <span className="cyber-text">{mode.toUpperCase()} MODE</span>
        </button>
      </div>

      <form onSubmit={handleSearch} className="cyber-form">
        <div className="input-group">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="cyber-input"
            placeholder="ENTER SEARCH QUERY..."
          />
          <button
            type="button"
            onMouseDown={listen}
            onMouseUp={stop}
            className={`cyber-btn voice-btn ${listening ? "listening" : ""}`}
          >
            <span className="cyber-text">
              {listening ? "LISTENING..." : "VOICE INPUT"}
            </span>
          </button>
        </div>

        <div className="file-upload-group">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            className="hidden"
            accept="image/*"
          />
          <button
            type="button"
            onClick={triggerImageUpload}
            className="cyber-btn upload-btn"
          >
            <span className="cyber-text">UPLOAD IMAGE</span>
          </button>
          {image && (
            <div className="file-info">
              <span className="file-name">{image.name}</span>
              <button
                type="button"
                onClick={() => setImage(null)}
                className="cyber-btn clear-btn"
              >
                <span className="cyber-text">×</span>
              </button>
            </div>
          )}
        </div>

        <div className="button-group">
          <button
            type="submit"
            className={`cyber-btn submit-btn ${isLoading ? "processing" : ""}`}
            disabled={isLoading}
          >
            <span className="cyber-text">
              {isLoading ? "PROCESSING..." : "INITIATE SEARCH"}
            </span>
          </button>

          {(query || image || results.length > 0) && (
            <button
              type="button"
              onClick={clearSearch}
              className="cyber-btn clear-all-btn"
            >
              <span className="cyber-text">CLEAR ALL</span>
            </button>
          )}
        </div>
      </form>

      {results.length > 0 && (
        <div className="results-container">
          <h2 className="cyber-subtitle">SEARCH RESULTS</h2>
          <div className="results-grid">
            {results.map((result, index) => (
              <div key={index} className="cyber-card">
                <h3 className="result-title">{result.title}</h3>
                <p className="result-content">
                  {typeof result.content === "string"
                    ? result.content
                    : JSON.stringify(result.content)}
                </p>
                {result.source && (
                  <a
                    href={result.source}
                    className="cyber-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    [SOURCE ↗]
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx global>{`
        :root {
          --bg-primary: #0a0b0d;
          --bg-secondary: #12151a;
          --bg-tertiary: #1a1d23;
          --text-primary: #e2e8f0;
          --text-secondary: #94a3b8;
          --accent-primary: #00ff9d;
          --accent-secondary: #f700ff;
          --accent-tertiary: #0ef;
          --accent-dark: #1a4a3c;
          --accent-shadow: #2d1a4a;
          --btn-mode: var(--accent-primary);
          --btn-voice: var(--accent-tertiary);
          --btn-upload: var(--accent-secondary);
          --btn-submit: var(--accent-primary);
          --glow-primary: 0 0 15px rgba(0, 255, 157, 0.2);
          --glow-secondary: 0 0 15px rgba(247, 0, 255, 0.2);
          --glow-tertiary: 0 0 15px rgba(0, 238, 255, 0.2);
        }

        body {
          background: var(--bg-primary);
          color: var(--text-primary);
          font-family: "Fira Code", monospace;
          min-height: 100vh;
          margin: 0;
          padding: 0;
        }

        .cyber-container {
          max-width: 1200px;
          margin: 2rem auto;
          padding: 2rem;
          background: var(--bg-secondary);
          box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(0, 255, 157, 0.1);
        }

        .cyber-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 3rem;
          padding: 1.5rem;
          background: var(--bg-tertiary);
          border: 1px solid var(--accent-dark);
          box-shadow: var(--glow-primary);
          position: relative;
          overflow: hidden;
        }

        .cyber-title {
          font-size: 2.5rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--accent-primary);
          margin: 0;
        }

        .cyber-subtitle {
          color: var(--accent-tertiary);
          font-size: 1.5rem;
          margin: 2rem 0;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .glitch {
          position: relative;
          text-shadow: 0.05em 0 0 var(--accent-secondary),
            -0.05em -0.025em 0 var(--accent-tertiary);
          animation: glitch 725ms infinite;
        }

        .cyber-btn {
          padding: 0.8rem 1.5rem;
          border: 1px solid rgba(0, 255, 157, 0.2);
          background: var(--bg-tertiary);
          color: var(--text-primary);
          font-family: inherit;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .cyber-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .cyber-btn::before {
          content: "";
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.1),
            transparent
          );
          transition: transform 0.5s ease;
        }

        .cyber-btn:not(:disabled):hover::before {
          transform: translateX(200%);
        }

        .cyber-btn:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        }

        .mode-btn {
          border-color: var(--btn-mode);
          box-shadow: 0 0 10px rgba(0, 255, 157, 0.1);
        }

        .voice-btn {
          border-color: var(--btn-voice);
          box-shadow: 0 0 10px rgba(0, 238, 255, 0.1);
          min-width: 120px;
        }

        .voice-btn.listening {
          animation: pulse 1.5s infinite;
        }

        .upload-btn {
          border-color: var(--btn-upload);
          box-shadow: 0 0 10px rgba(247, 0, 255, 0.1);
        }

        .clear-btn {
          padding: 0.2rem 0.6rem;
          font-size: 1.2rem;
          border-color: var(--text-secondary);
        }

        .clear-all-btn {
          border-color: var(--text-secondary);
          margin-left: 1rem;
        }

        .submit-btn {
          flex: 1;
          border-color: var(--btn-submit);
          background: linear-gradient(
            45deg,
            var(--accent-dark),
            var(--accent-shadow)
          );
          box-shadow: 0 0 15px rgba(0, 255, 157, 0.1);
        }

        .button-group {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
        }

        .cyber-input {
          width: 100%;
          padding: 1rem;
          background: var(--bg-tertiary);
          border: 1px solid var(--accent-dark);
          color: var(--text-primary);
          font-family: inherit;
          transition: all 0.3s ease;
        }

        .cyber-input:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 15px rgba(0, 255, 157, 0.1);
        }

        .cyber-card {
          padding: 1.5rem;
          background: var(--bg-tertiary);
          border: 1px solid var(--accent-dark);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .cyber-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 2px;
          background: linear-gradient(
            90deg,
            var(--accent-primary),
            var(--accent-secondary),
            var(--accent-tertiary)
          );
        }

        .cyber-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--glow-primary);
        }

        .results-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 2rem;
          margin-top: 2rem;
        }

        .input-group {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .file-upload-group {
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .file-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .file-name {
          color: var(--text-secondary);
          font-size: 0.9em;
        }

        .cyber-link {
          color: var(--accent-tertiary);
          text-decoration: none;
          transition: all 0.3s ease;
          position: relative;
          display: inline-block;
          margin-top: 1rem;
        }

        .cyber-link:hover {
          color: var(--accent-primary);
          text-shadow: 0 0 5px var(--accent-primary);
        }

        .processing {
          background: linear-gradient(
            -45deg,
            var(--accent-dark),
            var(--accent-shadow),
            var(--accent-dark)
          );
          background-size: 200% 200%;
          animation: gradient 2s ease infinite;
        }

        .hidden {
          display: none;
        }

        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        @keyframes glitch {
          0% {
            text-shadow: 0.05em 0 0 var(--accent-secondary),
              -0.05em -0.025em 0 var(--accent-tertiary);
          }
          15% {
            text-shadow: -0.05em -0.025em 0 var(--accent-secondary),
              0.025em 0.025em 0 var(--accent-tertiary);
          }
          49% {
            text-shadow: -0.05em -0.025em 0 var(--accent-secondary),
              0.025em 0.025em 0 var(--accent-tertiary);
          }
          50% {
            text-shadow: 0.025em 0.05em 0 var(--accent-secondary),
              0.05em 0 0 var(--accent-tertiary);
          }
          99% {
            text-shadow: 0.025em 0.05em 0 var(--accent-secondary),
              0.05em 0 0 var(--accent-tertiary);
          }
          100% {
            text-shadow: -0.05em 0 0 var(--accent-secondary),
              -0.025em -0.025em 0 var(--accent-tertiary);
          }
        }

        @keyframes glitch-anim {
          0% {
            clip: rect(24px, 550px, 90px, 0);
          }
          20% {
            clip: rect(45px, 550px, 50px, 0);
          }
          40% {
            clip: rect(66px, 550px, 92px, 0);
          }
          60% {
            clip: rect(88px, 550px, 73px, 0);
          }
          80% {
            clip: rect(12px, 550px, 44px, 0);
          }
          100% {
            clip: rect(95px, 550px, 78px, 0);
          }
        }

        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(0, 238, 255, 0.4);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(0, 238, 255, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(0, 238, 255, 0);
          }
        }
      `}</style>
    </div>
  );
}
