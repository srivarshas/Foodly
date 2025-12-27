import { useState, useEffect } from 'react';

export default function BuddyTask({ user }) {
  const [activeOrder, setActiveOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const buddySteps = [
    { id: 1, label: "Confirm Pickup", icon: "🍱", status: 'PICKED_UP' },
    { id: 2, label: "I'm Heading to Drop-off", icon: "🚴", status: 'OUT_FOR_DELIVERY' },
    { id: 3, label: "Mark as Delivered", icon: "✅", status: 'DELIVERED' }
  ];

  useEffect(() => {
    loadActiveOrder();
    // Poll for updates every 5 seconds for real-time feel
    const interval = setInterval(loadActiveOrder, 5000);
    return () => clearInterval(interval);
  }, [user?.name]);

  const loadActiveOrder = async () => {
    if (!user?.name) return;

    try {
      setLoading(true);
      const res = await fetch('http://localhost:3000/orders');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to load orders');

      const orders = Array.isArray(data) ? data : [];
      // Find order accepted by this buddy and not yet delivered
      const buddyOrder = orders.find(order =>
        String(order?.pickedby || '').toLowerCase() === user.name.toLowerCase() &&
        !['DELIVERED', 'CANCELLED'].includes(String(order?.status || '').toUpperCase())
      );
      setActiveOrder(buddyOrder || null);
    } catch (e) {
      setError(e.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (newStatus) => {
    if (!activeOrder) return;

    try {
      const res = await fetch(`http://localhost:3000/orders/${activeOrder.id}/status`, {
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
            amount: activeOrder.deliveryFee,
            orderId: activeOrder.id
          })
        });

        if (!earnRes.ok) {
          console.error('Failed to update earnings, but order status updated successfully');
        }
      }

      // Reload to update state
      await loadActiveOrder();
    } catch (e) {
      alert('Failed to update status: ' + e.message);
    }
  };

  const getCurrentStep = () => {
    if (!activeOrder) return 0;
    const status = String(activeOrder.status || '').toUpperCase();
    if (status === 'DELIVERED') return 3;
    if (status === 'OUT_FOR_DELIVERY') return 2;
    if (status === 'PICKED_UP') return 1;
    return 0; // Accepted but not picked up yet
  };

  const currentStep = getCurrentStep();

  return (
    <div className="p-4 safe-area-bottom">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">My Tasks</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Buddy Dashboard</p>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-10 italic">Loading Task...</p>
      ) : error ? (
        <p className="text-center text-red-600 py-10 font-bold">{error}</p>
      ) : !activeOrder ? (
        <p className="text-center text-gray-400 py-10 italic">No active tasks. Accept an order to get started!</p>
      ) : (
        <div className="space-y-6">
          {/* Active Order Card */}
          <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-gray-100">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-md uppercase">Active Task</span>
                <h2 className="text-xl font-black mt-2">Order #{activeOrder.id}</h2>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-400 font-bold uppercase">Earnings</p>
                <p className="text-lg font-black text-green-600">₹{activeOrder.deliveryFee}</p>
              </div>
            </div>

            {/* Order Details */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-lg">👤</div>
                  <div>
                    <p className="font-bold text-sm">{activeOrder.placedby} (Student)</p>
                    <p className="text-[10px] text-gray-500">Order placed by</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-2xl">
                <p className="text-sm font-bold text-gray-800 mb-2">📍 Drop Point</p>
                <p className="text-sm text-gray-600">{activeOrder.dropLocation}</p>
              </div>

              <div className="p-4 bg-orange-50 rounded-2xl">
                <p className="text-sm font-bold text-gray-800 mb-2">🏪 Pickup From</p>
                <p className="text-sm text-gray-600">{activeOrder.canteenName}</p>
              </div>

              <div className="p-4 bg-purple-50 rounded-2xl">
                <p className="text-sm font-bold text-gray-800 mb-2">🛒 Order Items</p>
                <div className="space-y-1">
                  {activeOrder.items && activeOrder.items.length > 0 ? (
                    activeOrder.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.name}</span>
                        <span className="font-bold">₹{item.price} x {item.quantity}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-600">No items listed</p>
                  )}
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span>Total</span>
                    <span>₹{activeOrder.totalAmount || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Indicator */}
            <div className="text-center mb-6">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                Status: {activeOrder.status || 'Accepted'}
              </span>
            </div>

            {/* Progress Steps */}
            <div className="space-y-4">
              <p className="text-xs font-bold text-gray-400 uppercase text-center">Update Progress</p>
              {buddySteps.map((s) => (
                <button
                  key={s.id}
                  disabled={currentStep !== s.id - 1}
                  onClick={() => updateOrderStatus(s.status)}
                  className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all ${
                    currentStep === s.id
                      ? "bg-green-50 text-green-600 opacity-50"
                      : currentStep > s.id - 1
                      ? "bg-gray-100 text-gray-400 opacity-30"
                      : "bg-gray-900 text-white scale-100 shadow-lg"
                  }`}
                >
                  <span className="font-bold text-sm">{s.icon} {s.label}</span>
                  {currentStep >= s.id && <span>✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
