import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import ProductFullwidth from './Components/Products';
import HomeDefault from './Components/Index';
import Contact from './Components/Contactus';
import About from './Components/About';
import Profile from './Components/Profile';
import Signup from './Components/Signup';
import Singin from './Components/Singin';




function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomeDefault />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
           <Route path="/products" element={<ProductFullwidth />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/signup" element={<Signup />} />
        <Route path="/signin" element={<Singin/>} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;