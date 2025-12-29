import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import MobileNav from './components/MobileNav';
import StudentDashboard from './pages/StudentDashboard';
import Menu from './pages/Menu';
import Cart from './pages/Cart';
import OrderTracking from './pages/OrderTracking';
import DeliveryDashboard from './pages/DeliveryDashboard';
import Login from './pages/Login';
import Landing from './pages/Landing';
import BuddyStats from './pages/Stats';
import BuddyTask from './pages/BuddyTask';

import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  const [role, setRole] = useState('student');
  const [user, setUser] = useState(null); // { email, name }
  const [cart, setCart] = useState([]);
  const [selectedCanteen, setSelectedCanteen] = useState(null); // { id, name }

  // Robust addToCart logic from 'main'
  const addToCart = (newItem) => {
    setCart((prev) => {
      // 1. BLOCK: Logic check for canteen name
      if (prev.length > 0 && prev[0].canteenName !== newItem.canteenName) {
        alert(`You can only order from one canteen at a time. Current tray: ${prev[0].canteenName}`);
        return prev;
      }

      // 2. INCREMENT: If same item exists
      const existingItem = prev.find((item) => item.id === newItem.id);
      if (existingItem) {
        return prev.map((item) =>
          item.id === newItem.id ? { ...item, qty: (item.qty || 1) + 1 } : item
        );
      }

      // 3. ADD: New item
      return [...prev, { ...newItem, qty: 1 }];
    });
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-100 flex justify-center">
        <div className="w-full max-w-md bg-white min-h-screen shadow-2xl flex flex-col relative overflow-x-hidden">
          
          <div className="flex-1 pb-24">
            <Routes>
              {/* Landing and Login don't show the MobileNav */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login setRole={setRole} setUser={setUser} />} />
              
              {/* Main App Routes */}
              <Route path="/home" element={
                <>
                  {role === 'student' ? <StudentDashboard /> : <DeliveryDashboard user={user} />}
                  <MobileNav role={role} cartCount={cart.length} />
                </>
              } />
              
              <Route path="/menu/:id" element={
                <>
                  <Menu 
                    addToCart={addToCart} 
                    cart={cart}
                    setSelectedCanteen={setSelectedCanteen} 
                  />
                  <MobileNav role={role} cartCount={cart.length} />
                </>
              } />

              <Route path="/cart" element={
                <>
                  <Cart 
                    cart={cart} 
                    setCart={setCart} 
                    selectedCanteen={selectedCanteen} 
                    user={user} 
                    role={role} 
                  />
                  <MobileNav role={role} cartCount={cart.length} />
                </>
              } />

              <Route path="/track" element={
                <>
                  <OrderTracking user={user} role={role} />
                  <MobileNav role={role} cartCount={cart.length} />
                </>
              } />

              <Route path="/stats" element={
                <>
                  <BuddyStats user={user} />
                  <MobileNav role={role} />
                </>
              } />

              <Route path="/tasks" element={
                <>
                  <BuddyTask user={user} />
                  <MobileNav role={role} />
                </>
              } />
            </Routes>
          </div>
          
        </div>
      </div>
    </Router>
  );
}

export default App;
