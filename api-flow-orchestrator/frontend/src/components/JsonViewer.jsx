import React from 'react';
import './JsonViewer.css';

const JsonViewer = ({ data, className = '' }) => {
  const formatJson = (obj) => {
    try {
      const jsonString = typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2);
      return highlightJson(jsonString);
    } catch (e) {
      return String(obj);
    }
  };

  const highlightJson = (jsonString) => {
    // Replace special characters and add syntax highlighting
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

  return (
    <pre 
      className={`json-viewer ${className}`}
      dangerouslySetInnerHTML={{ __html: formatJson(data) }}
    />
  );
};

export default JsonViewer;

// Made with Bob