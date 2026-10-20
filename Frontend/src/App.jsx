import React from 'react';
import ApiCaller from './components/CorsTest'; // Component ကို Import လုပ်ခြင်း

function App() {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Vite + React CORS Proxy Test</h1>
      <p>This is the main App component.</p>
      
      {/* Component အသစ်ကို ဤနေရာတွင် ခေါ်သုံးထားသည် */}
      <ApiCaller />
      
    </div>
  );
}

export default App;