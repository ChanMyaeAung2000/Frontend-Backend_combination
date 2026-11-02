import ApiCaller from './components/CorsTest'; // Component ကို Import လုပ်ခြင်း
import Frontend_Cokkie_Test from './components/cokkie_test/Frontend_Cokkie_Test';
import JWTTester from './components/jwt/JWTTester';
import JWTApiTester from './components/jwt/JWTApiTester';

function App() {
  return (
    <div >
      {/* Component အသစ်ကို ဤနေရာတွင် ခေါ်သုံးထားသည် */}
      <ApiCaller />
      <br></br>
      <Frontend_Cokkie_Test/>
      <JWTTester/>
      <JWTApiTester/>
      
    </div>
  );
}

export default App;
