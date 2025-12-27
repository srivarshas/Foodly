import { useEffect, useMemo, useState } from 'react';
import OrderCard from '../components/OrderCard';

export default function OrderTracking({ user, role }) {
  const [rating, setRating] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);

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

      {/* Rating Section - Shows only if Delivered */}
      {isDelivered && !isSubmitted && (
        <div className="mt-10 bg-orange-50 p-6 rounded-[2.5rem] border border-orange-100 text-center animate-in fade-in zoom-in duration-500">
          <p className="font-bold text-gray-800 mb-2">How was Arjun's service?</p>
          <div className="flex justify-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className={`text-3xl transition-transform active:scale-125 ${star <= rating ? 'grayscale-0' : 'grayscale opacity-30'}`}
              >
                ⭐
              </button>
            ))}
          </div>
          <button 
            disabled={rating === 0}
            onClick={() => setIsSubmitted(true)}
            className="bg-white px-6 py-2 rounded-full text-xs font-black text-primary shadow-sm border border-primary/10 disabled:opacity-50"
          >
            Submit Feedback
          </button>
        </div>
      )}

      {isSubmitted && (
        <p className="mt-10 text-center text-green-600 font-bold animate-bounce text-sm">
          Thanks for the rating! ❤️
        </p>
      )}

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
