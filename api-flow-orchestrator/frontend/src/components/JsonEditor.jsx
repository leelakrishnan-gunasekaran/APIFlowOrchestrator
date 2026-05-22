import React, { useRef, useEffect } from 'react';
import './JsonEditor.css';

const JsonEditor = ({ value, onChange, placeholder, disabled, className = '' }) => {
  const textareaRef = useRef(null);
  const highlightRef = useRef(null);

  const highlightJson = (jsonString) => {
    if (!jsonString) return '';
    
    try {
      // Try to parse and format if valid JSON
      const parsed = JSON.parse(jsonString);
      jsonString = JSON.stringify(parsed, null, 2);
    } catch (e) {
      // Keep as is if not valid JSON
    }

    return jsonString
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
        let cls = 'json-number';
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'json-key';
          } else {
            cls = 'json-string';
          }
        } else if (/true|false/.test(match)) {
          cls = 'json-boolean';
        } else if (/null/.test(match)) {
          cls = 'json-null';
        }
        return `<span class="${cls}">${match}</span>`;
      });
  };

  const handleScroll = () => {
    if (highlightRef.current && textareaRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  useEffect(() => {
    handleScroll();
  }, [value]);

  return (
    <div className={`json-editor ${className}`}>
      <div
        ref={highlightRef}
        className="json-editor-highlight"
        dangerouslySetInnerHTML={{ __html: highlightJson(value) }}
      />
      <textarea
        ref={textareaRef}
        className="json-editor-textarea"
        value={value}
        onChange={onChange}
        onScroll={handleScroll}
        placeholder={placeholder}
        disabled={disabled}
        spellCheck="false"
      />
    </div>
  );
};

export default JsonEditor;

// Made with Bob