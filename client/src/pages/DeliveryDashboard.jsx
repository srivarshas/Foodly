import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function DeliveryDashboard({ user }) {
  const navigate = useNavigate();

  const [availableOrders, setAvailableOrders] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [balance, setBalance] = useState(0.00);
  const [deliveryStats, setDeliveryStats] = useState({
    totalEarnings: 0,
    deliveryCount: 0,
    rating: 4.9
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 1. STATS POLLING
  useEffect(() => {
    if (user?.name) {
      loadDeliveryStats();
      const statsInterval = setInterval(loadDeliveryStats, 10000);
      return () => clearInterval(statsInterval);
    }
  }, [user?.name]);

  // 2. ORDER POLLING
  useEffect(() => {
    loadOrders();
    const ordersInterval = setInterval(loadOrders, 5000);
    return () => clearInterval(ordersInterval);
  }, [user?.name]);

  const loadDeliveryStats = async () => {
    if (!user?.name) return;
    try {
      const res = await fetch(`http://localhost:3000/delivery-users/${user.name}`);
      const data = await res.json();
      if (res.ok) {
        setBalance(data.totalEarnings || 0);
        setDeliveryStats({
          totalEarnings: data.totalEarnings || 0,
          deliveryCount: data.deliveryCount || 0,
          rating: data.rating || 4.9
        });
      }
    } catch (e) {
      console.error('Failed to load delivery stats:', e);
    }
  };

  const loadOrders = async () => {
    try {
      const res = await fetch('http://localhost:3000/orders');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to load orders');

      const orders = Array.isArray(data) ? data : Object.values(data || {});
      
      // Filter for orders that haven't been picked up yet
      const placedOrders = orders.filter(order =>
        String(order?.status || '').toUpperCase() === 'PLACED' && !order.pickedby
      );
      setAvailableOrders(placedOrders);

      // Identify if this buddy already has an order in progress
      const activeDelivery = orders.find(order =>
        String(order?.pickedby || '').toLowerCase() === user.name.toLowerCase() &&
        ['PICKED_UP', 'OUT_FOR_DELIVERY'].includes(String(order?.status || '').toUpperCase())
      );
      setActiveOrder(activeDelivery || null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const acceptOrder = async (orderId) => {
    if (!user || !user.name) {
      alert("Buddy profile not loaded. Please log in again.");
      return;
    }

    try {
      // 1. Assign the Buddy to the order
      const acceptRes = await fetch(`http://localhost:3000/orders/${orderId}/accept`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          pickedby: user?.name,
          buddyPhone: user?.phone || "+91 99999 88888" // Attach buddy's phone for the student
        })
      });

      if (!acceptRes.ok) throw new Error('Could not secure order');

      // 2. Set initial status
      const statusRes = await fetch(`http://localhost:3000/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PICKED_UP' })
      });

      if (!statusRes.ok) throw new Error('Status update failed');

      // 3. Navigate to the task management page
      navigate('/tasks'); 
    } catch (e) {
      alert(e.message);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Do you want to logout?")) navigate('/');
  };

  return (
    <div className="p-4 pb-24 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight italic">Buddy Hub</h2>
          <p className="text-[10px] text-primary font-bold uppercase tracking-widest">Active Duty: {user?.name}</p>
        </div>
        <button onClick={handleLogout} className="p-2 px-4 bg-white border border-gray-200 rounded-full text-[10px] font-black uppercase text-gray-400">Logout</button>
      </div>

      {/* Buddy Earnings Card */}
<div className="bg-primary rounded-[2.5rem] p-6 text-white shadow-xl shadow-primary/20 mb-8">
  <div className="flex justify-between items-start mb-4">
    <div>
      <p className="text-[10px] font-black uppercase opacity-80 tracking-widest">Total Earnings</p>
      <h2 className="text-4xl font-black">₹{deliveryStats.totalEarnings}</h2>
    </div>
    <div className="bg-black/20 p-3 rounded-2xl text-center min-w-[60px]">
      <p className="text-[18px] font-black">{deliveryStats.rating}</p>
      <p className="text-[8px] font-bold uppercase opacity-60">Rating</p>
    </div>
  </div>
  
  <div className="grid grid-cols-2 gap-3 mt-6">
    <div className="bg-white/10 rounded-2xl p-3">
      <p className="text-[8px] font-bold uppercase opacity-60 mb-1">Deliveries</p>
      <p className="font-black">{deliveryStats.deliveryCount}</p>
    </div>
    <div className="bg-white/10 rounded-2xl p-3">
      <p className="text-[8px] font-bold uppercase opacity-60 mb-1">Status</p>
      <p className="font-black text-green-300">Active</p>
    </div>
  </div>
</div>

      {/* Active Order Banner */}
      {activeOrder ? (
        <div className="bg-primary p-6 rounded-[2.5rem] mb-8 shadow-lg shadow-primary/20 animate-pulse cursor-pointer" onClick={() => navigate('/tasks')}>
          <div className="flex justify-between items-center mb-2">
            <span className="bg-white/20 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase">Task in Progress</span>
            <span className="text-white text-xl">→</span>
          </div>
          <h4 className="text-white font-black text-lg">Order #{activeOrder.id}</h4>
          <p className="text-white/80 text-xs font-medium">Deliver to {activeOrder.dropLocation}</p>
        </div>
      ) : (
        <div className="bg-white border-2 border-dashed border-gray-200 p-8 rounded-[2.5rem] mb-8 text-center">
          <p className="text-gray-400 font-bold text-sm italic">Ready for a new gig?</p>
        </div>
      )}

      {/* Available Orders List */}
      <h2 className="font-black text-xl mb-4 text-gray-800 px-2 italic">Open Gigs</h2>
      {loading ? (
        <div className="text-center py-10 animate-bounce">🍕</div>
      ) : availableOrders.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm italic">No orders currently waiting. Check back in a bit!</div>
      ) : (
        <div className="space-y-4">
          {availableOrders.map((order) => (
            <div key={order.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm transition-all active:scale-95">
              <div className="flex justify-between items-start mb-4">
                <span className="bg-primary/10 text-primary text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">
                  {order.canteenName}
                </span>
                <p className="text-lg font-black text-gray-900">₹{order.deliveryFee}</p>
              </div>
              
              <div className="space-y-1 mb-6">
                <h4 className="font-black text-gray-800">Drop: {order.dropLocation}</h4>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Student: {order.placedby}</p>
              </div>

              <button
                onClick={() => acceptOrder(order.id)}
                className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg active:bg-black"
              >
                Accept Gig
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}