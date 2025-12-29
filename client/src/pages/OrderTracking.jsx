import { useEffect, useMemo, useState } from 'react';
import OrderCard from '../components/OrderCard';

export default function OrderTracking({ user, role }) {
  const [rating, setRating] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    let ignore = false;

    async function loadOrders() {
      try {
        setLoading(true);
        setError('');
        const res = await fetch('http://localhost:3000/orders');
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to load orders');
        if (!ignore) setOrders(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!ignore) setError(e.message || 'Failed to load orders');
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadOrders();
    return () => {
      ignore = true;
    };
  }, []);

  const activeOrders = useMemo(() => {
    return (orders || []).filter((o) =>
      String(o?.status || '').toUpperCase() !== 'DELIVERED' &&
      o.placedby == user?.name // using == for loose equality in case of type mismatch
    );
  }, [orders, user?.name]);

  // For now, rating is shown once an order is DELIVERED.
  // (We keep a minimal rating UI for delivered orders.)
  const deliveredOrders = useMemo(() => {
    return (orders || []).filter((o) => String(o?.status || '').toUpperCase() === 'DELIVERED');
  }, [orders]);
  const isDelivered = deliveredOrders.length > 0;

  return (
    <div className="p-6 safe-area-bottom">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black italic">Your Orders</h2>
          <p className="text-gray-500 text-sm">Showing orders that are placed and not yet delivered</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="text-[10px] font-black text-gray-400 hover:text-primary transition-all border border-gray-200 px-3 py-1.5 rounded-full uppercase"
        >
          Refresh
        </button>
      </div>

      {loading && <p className="text-center text-gray-400 py-10 italic">Loading orders...</p>}
      {!loading && error && <p className="text-center text-red-600 py-10 font-bold">{error}</p>}

      {!loading && !error && (
        <>
          {!user ? (
            <p className="text-center text-red-500 py-10 font-bold">Please log in to view your orders.</p>
          ) : activeOrders.length === 0 ? (
            <p className="text-center text-gray-400 py-10 italic">No active orders.</p>
          ) : (
            <div className="space-y-3">
              {activeOrders.map((o) => (
                <OrderCard key={o.id} order={o} onClick={setSelectedOrder} />
              ))}
            </div>
          )}
        </>
      )}

      {/* RECENTLY DELIVERED / RATING BOX */}
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
          
          <button 
            onClick={() => setIsSubmitted(true)}
            className="w-full bg-gray-900 text-white py-3 rounded-2xl font-black text-xs uppercase tracking-widest active:bg-black"
          >
            Submit & Dismiss
          </button>
        </div>
      )}

      {/* FULL INFO MODAL */}
      {currentSelectedOrder && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-end justify-center z-[100]">
          <div className="bg-white rounded-t-[3rem] w-full max-w-md p-8 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8" onClick={() => setSelectedOrderId(null)}></div>
            
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-2xl font-black text-gray-900 leading-none">Order Status</h3>
                <p className="text-primary font-bold text-xs mt-2 uppercase">#{currentSelectedOrder.id} • {currentSelectedOrder.canteenName}</p>
              </div>
              <button onClick={() => setSelectedOrderId(null)} className="bg-gray-100 w-10 h-10 rounded-full flex items-center justify-center text-gray-400">✕</button>
            </div>

            {/* Live Progress Tracker */}
            <div className="flex justify-between items-start mb-10 relative">
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

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-gray-800">Order Details</h3>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Order ID:</span>
                  <span className="font-mono text-sm text-gray-800">{selectedOrder.id}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    selectedOrder.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : 'bg-primary/10 text-primary'
                  }`}>
                    {selectedOrder.status || 'PLACED'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pickup:</span>
                  <span className="text-sm font-medium text-gray-800">{selectedOrder.canteenName}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Delivery to:</span>
                  <span className="text-sm font-medium text-gray-800">{selectedOrder.dropLocation}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Placed by:</span>
                  <span className="text-sm font-medium text-gray-800">{selectedOrder.placedby}</span>
                </div>

                {selectedOrder.customerPhone && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Phone:</span>
                    <span className="text-sm font-medium text-gray-800 font-mono">{selectedOrder.customerPhone}</span>
                  </div>
                )}

                {selectedOrder.pickedby && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Delivery by:</span>
                    <span className="text-sm font-medium text-gray-800">{selectedOrder.pickedby}</span>
                  </div>
                )}

                <div className="border-t pt-4">
                  <h4 className="font-bold text-gray-800 mb-3">Items Ordered:</h4>
                  <div className="space-y-2">
                    {selectedOrder.items && selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div>
                          <span className="text-sm font-medium text-gray-800">{item.name}</span>
                          <span className="text-xs text-gray-500 ml-2">×{item.quantity || 1}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-800">₹{item.price * (item.quantity || 1)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Subtotal:</span>
                    <span className="text-sm font-medium text-gray-800">₹{selectedOrder.subtotal}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Delivery Fee:</span>
                    <span className="text-sm font-medium text-gray-800">₹{selectedOrder.deliveryFee}</span>
                  </div>
                  <div className="flex justify-between items-center font-bold text-gray-800 border-t pt-2">
                    <span>Total:</span>
                    <span>₹{selectedOrder.totalAmount}</span>
                  </div>
                </div>

                {selectedOrder.createdAt && (
                  <div className="text-xs text-gray-500 text-center pt-2 border-t">
                    Ordered on {new Date(selectedOrder.createdAt).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <br />
    </div>
  );
}
