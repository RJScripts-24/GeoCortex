import React, { useState } from 'react';

const Chatbot = ({ onSend, messages }) => {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim()) {
      onSend(input);
      setInput('');
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg p-4 mt-4 border border-cyan-700">
      <div className="h-40 overflow-y-auto mb-2 bg-gray-800 rounded p-2 text-sm text-gray-200" style={{ maxHeight: 180 }}>
        {messages.length === 0 ? (
          <div className="text-gray-500">AI Consultant is ready to chat.</div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={msg.role === 'user' ? 'text-cyan-300' : 'text-cyan-100'}>
              <b>{msg.role === 'user' ? 'You' : 'AI'}:</b> {msg.text}
            </div>
          ))
        )}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 px-2 py-1 rounded bg-gray-700 text-white border border-cyan-700 focus:outline-none"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask the AI consultant..."
        />
        <button
          className="px-3 py-1 bg-cyan-600 text-white rounded hover:bg-cyan-700 font-mono text-xs"
          onClick={handleSend}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chatbot;
