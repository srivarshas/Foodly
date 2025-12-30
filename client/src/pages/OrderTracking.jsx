import { useEffect, useMemo, useState } from 'react';
import OrderCard from '../components/OrderCard';

export default function OrderTracking({ user }) {
  const [rating, setRating] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  // 1. LIVE POLLING (Every 3 seconds)
  useEffect(() => {
    async function loadOrders() {
      try {
        const res = await fetch('http://localhost:3000/orders');
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to sync');
        
        const ordersArray = Array.isArray(data) ? data : Object.values(data || {});
        setOrders(ordersArray);
        setLoading(false);
      } catch (e) {
        setError(e.message);
        setLoading(false);
      }
    }
    loadOrders();
    const interval = setInterval(loadOrders, 3000);
    return () => clearInterval(interval);
  }, []);

  // 2. FILTERING LOGIC
  const activeOrders = useMemo(() => {
    if (!user?.name) return [];
    return orders.filter((o) => 
      String(o?.placedby || '').toLowerCase() === String(user.name).toLowerCase() &&
      ['PLACED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(String(o?.status || '').toUpperCase())
    );
  }, [orders, user?.name]);

  const latestDelivered = useMemo(() => {
    if (!user?.name) return null;
    const delivered = orders.filter((o) => 
      String(o?.placedby || '').toLowerCase() === String(user.name).toLowerCase() &&
      String(o?.status || '').toUpperCase() === 'DELIVERED'
    );
    return delivered.sort((a, b) => b.id - a.id)[0] || null;
  }, [orders, user?.name]);

  const currentSelectedOrder = useMemo(() => {
    return orders.find(o => o.id === selectedOrderId);
  }, [orders, selectedOrderId]);

  const statusSteps = [
    { key: 'PLACED', label: 'Placed', icon: '📝' },
    { key: 'PICKED_UP', label: 'Picked Up', icon: '🍱' },
    { key: 'OUT_FOR_DELIVERY', label: 'On Way', icon: '🚴' },
    { key: 'DELIVERED', label: 'Arrived', icon: '✅' }
  ];

  return (
    <div className="p-6 pb-32 min-h-screen bg-gray-50">
      <h2 className="text-2xl font-black italic mb-6">Live Orders</h2>

      {/* ACTIVE ORDERS LIST */}
      <div className="space-y-4">
        {activeOrders.map((o) => (
          <div key={o.id} onClick={() => setSelectedOrderId(o.id)} className="relative cursor-pointer active:scale-95 transition-all">
            <OrderCard order={o} />
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-white/90 backdrop-blur px-2 py-1 rounded-lg border border-primary/20 shadow-sm">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-[9px] font-black text-primary uppercase">{o.status || 'PLACED'}</span>
            </div>
          </div>
        ))}
        
        {activeOrders.length === 0 && !latestDelivered && (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100">
            <p className="text-gray-400 font-medium">No active orders found.</p>
          </div>
        )}
      </div>

      {/* RATING BOX */}
      {latestDelivered && !isSubmitted && (
        <div className="mt-8 bg-white p-6 rounded-[2.5rem] shadow-xl border-2 border-green-100 text-center animate-in slide-in-from-bottom duration-500">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl">🎉</div>
          <p className="font-black text-gray-800">Order #{latestDelivered.id} Delivered!</p>
          <p className="text-xs text-gray-400 mb-4 italic">Rate your experience with {latestDelivered.pickedby}</p>
          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} onClick={() => setRating(s)} className={`text-3xl transition-all ${s <= rating ? 'scale-125' : 'grayscale opacity-20'}`}>⭐</button>
            ))}
          </div>
          <button onClick={() => setIsSubmitted(true)} className="w-full bg-gray-900 text-white py-3 rounded-2xl font-black text-xs uppercase tracking-widest">Submit & Dismiss</button>
        </div>
      )}

      {/* FULL INFO MODAL */}
      {currentSelectedOrder && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-end justify-center z-[100]">
          <div className="bg-white rounded-t-[3rem] w-full max-w-md p-8 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8" onClick={() => setSelectedOrderId(null)}></div>
            
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-2xl font-black text-gray-900 leading-none">Order Status</h3>
                <p className="text-primary font-bold text-xs mt-2 uppercase">#{currentSelectedOrder.id} • {currentSelectedOrder.canteenName}</p>
              </div>
              <button onClick={() => setSelectedOrderId(null)} className="bg-gray-100 w-10 h-10 rounded-full flex items-center justify-center text-gray-400">✕</button>
            </div>

            {/* LIVE OTP DISPLAY SECTION */}
            {/* Find this section in OrderTracking.jsx around line 100 */}
{/* Change the status check to include 'PICKED_UP' or just check if it exists */}
{currentSelectedOrder.otp && (
    <div className="mb-8 bg-primary rounded-[2rem] p-6 text-white text-center shadow-lg shadow-primary/30 border-4 border-white">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-80">Share this code for Handover</p>
        <h4 className="text-4xl font-black tracking-[0.4em] ml-3">{currentSelectedOrder.otp || "------"}</h4>
        <p className="text-[9px] mt-3 font-medium bg-white/20 inline-block px-3 py-1 rounded-full">Only give this to {currentSelectedOrder.pickedby} when you get your food</p>
    </div>
)}

            {/* Progress Tracker */}
            <div className="flex justify-between items-start mb-10 relative px-2">
              <div className="absolute top-4 left-0 w-full h-0.5 bg-gray-100 -z-10"></div>
              {statusSteps.map((step, idx) => {
                const stepIdx = statusSteps.findIndex(s => s.key === (currentSelectedOrder.status || 'PLACED'));
                const isCurrent = (currentSelectedOrder.status || 'PLACED') === step.key;
                const isPast = stepIdx > idx;

                return (
                  <div key={step.key} className="flex flex-col items-center gap-2 w-1/4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all ${
                      isCurrent ? 'bg-primary text-white scale-125 ring-4 ring-primary/20' : 
                      isPast ? 'bg-green-500 text-white' : 'bg-white text-gray-300 border border-gray-100'
                    }`}>
                      {isPast ? '✓' : step.icon}
                    </div>
                    <span className={`text-[7px] font-black uppercase text-center ${isCurrent ? 'text-primary' : 'text-gray-400'}`}>{step.label}</span>
                  </div>
                );
              })}
            </div>

            <div className="space-y-6">
              {/* Buddy Details */}
              <div className="bg-gray-900 rounded-[2rem] p-5 text-white flex justify-between items-center shadow-lg">
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Delivery Buddy</p>
                  <p className="text-lg font-black">{currentSelectedOrder.pickedby || "Searching..."}</p>
                </div>
                {currentSelectedOrder.pickedby && (
                  <a href={`tel:${currentSelectedOrder.buddyPhone}`} className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">📞</a>
                )}
              </div>

              {/* Itemized Bill with Option A Status */}
              <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Your Items</p>
                    <span className="text-[8px] font-black text-green-600 bg-green-100 px-2 py-0.5 rounded-full uppercase">Paid via Wallet</span>
                </div>
                <div className="space-y-3">
                  {currentSelectedOrder.items?.map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 font-medium"><span className="text-primary font-bold">{item.qty}x</span> {item.name}</span>
                      <span className="font-bold text-gray-800">₹{item.price * item.qty}</span>
                    </div>
                  ))}
                  <div className="border-t border-dashed border-gray-200 pt-3 mt-3 space-y-2">
                    <div className="flex justify-between text-xs text-gray-400 font-bold uppercase">
                      <span>Delivery Fee (Escrow)</span>
                      <span>₹{currentSelectedOrder.deliveryFee}</span>
                    </div>
                    <div className="flex justify-between text-lg font-black text-gray-900 pt-1">
                      <span>Total</span>
                      <span>₹{currentSelectedOrder.totalAmount}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Drop-off Point */}
              <div className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                <div className="text-2xl">📍</div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase">Drop-off Point</p>
                  <p className="text-sm font-bold text-gray-800">{currentSelectedOrder.dropLocation}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}