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

  useEffect(() => {
    if (user?.name) {
      loadDeliveryStats();
      // Poll for delivery stats updates every 10 seconds
      const statsInterval = setInterval(loadDeliveryStats, 10000);
      return () => clearInterval(statsInterval);
    }
  }, [user?.name]);

  useEffect(() => {
    loadOrders();
    // Poll for orders updates every 5 seconds
    const ordersInterval = setInterval(loadOrders, 5000);
    return () => clearInterval(ordersInterval);
  }, []);

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
      setLoading(true);
      const res = await fetch('http://localhost:3000/orders');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to load orders');

      const orders = Array.isArray(data) ? data : [];
      const placedOrders = orders.filter(order =>
        String(order?.status || '').toUpperCase() === 'PLACED'
      );
      setAvailableOrders(placedOrders);

      // Check if there's an active delivery (not delivered) accepted by this user
      const activeDelivery = orders.find(order =>
        String(order?.pickedby || '').toLowerCase() === user.name.toLowerCase() &&
        ['PICKED_UP', 'OUT_FOR_DELIVERY'].includes(String(order?.status || '').toUpperCase())
      );
      setActiveOrder(activeDelivery || null);
    } catch (e) {
      setError(e.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const acceptOrder = async (orderId) => {
    try {
      // First update the pickedby field
      const acceptRes = await fetch(`http://localhost:3000/orders/${orderId}/accept`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pickedby: user?.name || null })
      });

      if (!acceptRes.ok) throw new Error('Failed to accept order');

      // Then update the status to PICKED_UP
      const statusRes = await fetch(`http://localhost:3000/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PICKED_UP' })
      });

      if (!statusRes.ok) throw new Error('Failed to update order status');

      // Reload orders to update state
      await loadOrders();
    } catch (e) {
      alert('Failed to accept order: ' + e.message);
    }
  };



const handleLogout = () => {
    if (window.confirm("Do you want to logout?")) {
      navigate('/');
    }
  };

  return (
    <div className="p-4 safe-area-bottom">

{/* Header Area with Logout */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">Canteens</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Sastra University</p>
        </div>
        <button 
          onClick={handleLogout}
          className="text-[10px] font-black text-gray-400 hover:text-primary transition-all border border-gray-200 px-3 py-1.5 rounded-full flex items-center gap-1 uppercase"
        >
          <span>Logout</span>
        </button>
      </div>
      <br/>

      {/* Earnings Overview Card */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-[2.5rem] p-8 text-white mb-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl italic font-black">Foodly</div>
        <p className="opacity-60 text-xs font-bold uppercase tracking-widest">Available Balance</p>
        <h3 className="text-4xl font-black mt-1">₹{balance.toFixed(2)}</h3>
        <div className="flex gap-3 mt-6">
          <div className="bg-white/10 px-4 py-2 rounded-2xl">
            <p className="text-[10px] opacity-60">Deliveries</p>
            <p className="text-sm font-bold">{deliveryStats.deliveryCount}</p>
          </div>
          <div className="bg-white/10 px-4 py-2 rounded-2xl">
            <p className="text-[10px] opacity-60">Rating</p>
            <p className="text-sm font-bold">{deliveryStats.rating} ★</p>
          </div>
        </div>
      </div>

      {/* Active Order Controller */}
      <div className="bg-primary/5 border-2 border-primary/20 p-6 rounded-[2.5rem] mb-8">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-black text-gray-800 tracking-tight">
            {activeOrder ? 'Active Delivery' : 'No Active Order'}
          </h4>
          {activeOrder && <span className="animate-pulse flex h-2 w-2 rounded-full bg-primary"></span>}
        </div>
        {activeOrder ? (
          <>
            <p className="text-sm text-gray-600 mb-6 font-medium">
              Deliver to: <span className="text-black font-bold">{activeOrder.dropLocation}</span>
            </p>
            <p className="text-sm text-gray-600 mb-4 font-medium">
              Order: <span className="text-black font-bold">
                {activeOrder.items && activeOrder.items.length > 0
                  ? `${activeOrder.items[0].name}${activeOrder.items.length > 1 ? ` +${activeOrder.items.length - 1}` : ''}`
                  : 'Order'}
              </span>
            </p>
          </>
        ) : (
          <p className="text-sm text-gray-600 mb-4 font-medium text-center">
            Accept an order from below to start delivering
          </p>
        )}
      </div>

      <h2 className="font-black text-xl mb-4 text-gray-800 px-2">New Gigs Near You</h2>
      {loading ? (
        <p className="text-center text-gray-400 py-10 italic">Loading orders...</p>
      ) : error ? (
        <p className="text-center text-red-600 py-10 font-bold">{error}</p>
      ) : availableOrders.length === 0 ? (
        <p className="text-center text-gray-400 py-10 italic">No orders available for pickup.</p>
      ) : (
        <div className="space-y-4">
          {availableOrders.map((order) => (
            <div key={order.id} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex justify-between items-center">
              <div>
                <p className="text-[10px] font-bold text-primary uppercase mb-1">Pickup: {order.canteenName}</p>
                <h4 className="font-bold text-gray-800 text-sm">To: {order.dropLocation}</h4>
                <p className="text-xs text-gray-400 mt-1 italic font-medium">
                  Earn ₹{order.deliveryFee} - {order.items && order.items.length > 0
                    ? `${order.items[0].name}${order.items.length > 1 ? ` +${order.items.length - 1}` : ''}`
                    : 'Order'}
                </p>
                <p className="text-xs text-gray-500 mt-1 font-medium">
                  Placed by: {order.placedby}
                </p>
              </div>
              <button
                onClick={() => acceptOrder(order.id)}
                className="bg-gray-900 text-white px-5 py-3 rounded-2xl font-bold text-xs shadow-md hover:bg-gray-800 transition-colors"
              >
                Accept
              </button>
            </div>
          ))}
        </div>
      )}
      <br/>
    </div>
  );
}
