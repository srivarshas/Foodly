// src/pages/BuddyTask.jsx
import { useState, useEffect } from 'react';

export default function BuddyTask({ user }) {
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const buddySteps = [
    { id: 1, label: "Confirm Pickup", icon: "🍱", status: 'PICKED_UP' },
    { id: 2, label: "Heading to Drop-off", icon: "🚴", status: 'OUT_FOR_DELIVERY' },
    { id: 3, label: "Mark as Delivered", icon: "✅", status: 'DELIVERED' }
  ];

  useEffect(() => {
    loadActiveOrders();
    // Poll for updates every 5 seconds for real-time feel
    const interval = setInterval(loadActiveOrders, 5000);
    return () => clearInterval(interval);
  }, [user?.name]);

  const loadActiveOrders = async () => {
    if (!user?.name) return;

    try {
      const res = await fetch('http://localhost:3000/orders');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to load orders');

      const orders = Array.isArray(data) ? data : (data ? Object.values(data) : []);
      
      // Filter orders accepted by this buddy and not yet delivered
      const myActiveTasks = orders.filter(order =>
        String(order?.pickedby || '').toLowerCase() === user.name.toLowerCase() &&
        !['DELIVERED', 'CANCELLED'].includes(String(order?.status || '').toUpperCase())
      );
      
      setActiveOrders(myActiveTasks);
      setError('');
    } catch (e) {
      setError(e.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus, deliveryFee) => {
    try {
      const res = await fetch(`http://localhost:3000/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) throw new Error('Failed to update order status');

      // If order is marked as delivered, add delivery fee to user's earnings
      if (newStatus === 'DELIVERED') {
        const earnRes = await fetch(`http://localhost:3000/delivery-users/${user.name}/earn`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: deliveryFee,
            orderId: orderId
          })
        });

        if (!earnRes.ok) console.error('Earnings update failed');
      }

      // Local update for immediate feedback
      setActiveOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      await loadActiveOrders();
    } catch (e) {
      alert('Status update failed: ' + e.message);
    }
  };

  const getStepIndex = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'DELIVERED') return 3;
    if (s === 'OUT_FOR_DELIVERY') return 2;
    if (s === 'PICKED_UP') return 1;
    return 0;
  };

  return (
    <div className="p-4 pb-24 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-black text-gray-800 tracking-tight">Active Tasks</h2>
        <div className="flex justify-between items-center mt-1">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Multiple Order Handling</p>
          <span className="bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full">
            {activeOrders.length} ORDERS
          </span>
        </div>
      </div>

      {loading && activeOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 italic text-gray-400">
          <div className="animate-spin mb-4 text-2xl">🔄</div>
          <p>Fetching your tasks...</p>
        </div>
      ) : error ? (
        <p className="text-center text-red-600 py-10 font-bold">{error}</p>
      ) : activeOrders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-gray-200">
           <p className="text-gray-400 italic">No orders currently assigned to you.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {activeOrders.map((order) => {
            const currentStep = getStepIndex(order.status);

            return (
              <div key={order.id} className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-gray-100 relative">
                {/* Order ID and Earnings */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-1 rounded-md uppercase">
                       {order.canteenName}
                    </span>
                    <h2 className="text-xl font-black mt-1">Order #{order.id}</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Fee</p>
                    <p className="text-lg font-black text-green-600">₹{order.deliveryFee}</p>
                  </div>
                </div>

                {/* Logistics Info */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                   <div className="bg-gray-50 p-3 rounded-2xl">
                      <p className="text-[9px] text-gray-400 font-bold uppercase">Drop Point</p>
                      <p className="text-xs font-bold text-gray-800 truncate">{order.dropLocation}</p>
                   </div>
                   <div className="bg-gray-50 p-3 rounded-2xl">
                      <p className="text-[9px] text-gray-400 font-bold uppercase">Student</p>
                      <p className="text-xs font-bold text-gray-800">{order.placedby}</p>
                   </div>
                </div>

                {/* Progress Steps for this specific order */}
                <div className="space-y-3">
                  {buddySteps.map((step) => {
                    const isCompleted = currentStep >= step.id;
                    const isNext = currentStep === step.id - 1;

                    return (
                      <button
                        key={step.id}
                        disabled={!isNext}
                        onClick={() => updateOrderStatus(order.id, step.status, order.deliveryFee)}
                        className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all ${
                          isCompleted
                            ? "bg-green-50 text-green-600 opacity-60 scale-95"
                            : isNext
                            ? "bg-gray-900 text-white shadow-lg active:scale-95"
                            : "bg-gray-50 text-gray-300"
                        }`}
                      >
                        <span className="font-bold text-xs flex items-center gap-2">
                           <span className="text-lg">{step.icon}</span> {step.label}
                        </span>
                        {isCompleted && <span className="text-green-500 font-black">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}