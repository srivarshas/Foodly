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

  return (
    <Router>
<div className="min-h-screen bg-gray-100 flex justify-center">
  <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative overflow-x-hidden">
    {/* Your Header, Routes, and MobileNav go here */}
  
      <div className="min-h-screen bg-gray-50 font-sans">
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
          
          <Route path="/menu/:id" element={
            <>
              <Menu addToCart={(item) => setCart([...cart, item])} />
              <MobileNav role={role} cartCount={cart.length} />
            </>
          } />

          <Route path="/cart" element={
            <>
              <Cart cart={cart} setCart={setCart} />
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

        </Routes>
      </div>
</div>
</div>
    </Router>
  );
}

export default App;