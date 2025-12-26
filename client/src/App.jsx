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

function App() {
  const [role, setRole] = useState('student'); 
  const [cart, setCart] = useState([]);

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
      {/* Remove 'relative' and 'overflow-x-hidden' if they cause clipping */}
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl flex flex-col">
        
        {/* Content Area - 'flex-1' allows this to grow and push Nav down */}
        <div className="flex-1 pb-24"> {/* Added padding-bottom to clear the Nav */}
          <Routes>
          {/* Landing and Login don't show the MobileNav */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login setRole={setRole} />} />
          
          {/* Main App Routes */}
          <Route path="/home" element={
            <>
              {role === 'student' ? <StudentDashboard /> : <DeliveryDashboard />}
              <MobileNav role={role} cartCount={cart.length} />
            </>
          } />

          <Route path="/track" element={
            <>
              <OrderTracking />
              <MobileNav role={role} cartCount={cart.length} />
            </>
          } />

          <Route path="/stats" element={
            <>
              <BuddyStats /> 
              <MobileNav role={role} />
            </>
          } />

          <Route path="/tasks" element={
            <>
              <BuddyTask /> 
              <MobileNav role={role} />
            </>
          } />

          <Route path="/home" element={<StudentDashboard />} />
        
        {/* Pass cart and addToCart to Menu */}
        <Route path="/menu/:id" element={
          <>
            <Menu 
              addToCart={addToCart} 
              cart={cart} 
            />
            <MobileNav role={role} cartCount={cart.length} />
          </>
        } />
        
        {/* Pass cart and setCart to Cart */}
        <Route 
          path="/cart" 
          element={<Cart cart={cart} setCart={setCart} />} 
        />
        </Routes>
        </div>

        {/* The Nav will now sit correctly at the bottom of the flex container */}
      </div>
    </div>
  </Router>
  );
}

export default App;