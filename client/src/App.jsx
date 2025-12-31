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
import AIAssistant from './pages/AIAssistant';

function App() {
  const [role, setRole] = useState('student');
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [selectedCanteen, setSelectedCanteen] = useState(null);

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
        <div className="w-full max-w-md bg-white min-h-screen shadow-2xl flex flex-col">
          
          <div className="flex-1 pb-24">
            <Routes>
              {/* No Nav on these pages */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login setRole={setRole} setUser={setUser} />} />

              {/* Home Page */}
              <Route path="/home" element={
                <>
                  {role === 'student' ? <StudentDashboard user={user} /> : <DeliveryDashboard user={user} />}
                  <MobileNav role={role} cartCount={cart.length} />
                </>
              } />

              {/* Menu Page - Using the robust addToCart logic */}
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

              {/* Cart Page */}
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

              {/* Other Pages */}
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

              <Route path="/ai-assistant" element={
                <>
                  <AIAssistant user={user} addToCart={addToCart} />
                  <MobileNav role={role} cartCount={cart.length} />
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
