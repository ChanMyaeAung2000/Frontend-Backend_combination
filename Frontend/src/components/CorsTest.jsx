import React, { useState } from 'react';

function ApiCaller() {
  const [responseMessage, setResponseMessage] = useState('');

  const handleApiCall = async () => {
    try {
      // no proxy
    // const response = await fetch('http://localhost:5000/api/hello'); //call backend endpoint directly
    const response = await fetch('/api');
      const data = await response.json();
      setResponseMessage(data.message);
    } catch (error) {
      console.error('Error:', error);
      setResponseMessage('Proxy Error!');
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', maxWidth: '400px', margin: '20px auto' }}>
      <h2>API Caller Component</h2>
      <button 
        onClick={handleApiCall} 
        style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}
      >
        Call Backend API
      </button>
      <p style={{ marginTop: '20px', fontSize: '16px', fontWeight: 'bold', color: 'blue' }}>
        {responseMessage}
      </p>
    </div>
  );
}

export default ApiCaller;