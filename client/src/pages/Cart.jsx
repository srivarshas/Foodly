import { useState } from 'react';
import { calculateDelivery } from '../utils/deliveryCharges';

const zoneDistances = {
  "VKJ": 10,
  "VBH": 12,
  "Library": 5,
  "TIFAC": 15,
  "CVR": 8
};

export default function Cart({ cart, setCart }) {
  const [location, setLocation] = useState("VKJ");
  const canteenName = cart.length > 0 ? cart[0].canteenName : null;

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item =>
      item.id === id ? { ...item, qty: Math.max(1, (item.qty || 1) + delta) } : item
    ));
  };

  const removeItem = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.price * (item.qty || 1)), 0);

  const delivery = cart.length > 0 ? calculateDelivery(zoneDistances[location] || 10, subtotal) : 0;

  const handleClearCart = () => {
    if (window.confirm("Are you sure you want to clear your tray?")) {
      setCart([]);
    }
  };

  return (
    <div className="p-4 safe-area-bottom">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black">Your Tray</h2>
        {cart.length > 0 && (
          <button
            onClick={handleClearCart}
            className="text-[10px] font-black text-red-500 uppercase tracking-widest border border-red-100 px-3 py-1 rounded-full"
          >
            Clear Tray
          </button>
        )}

      </div>
      {canteenName ? (
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full">
            <span className="text-[10px] font-black text-primary uppercase tracking-widest">Ordering from:</span>
            <span className="text-sm font-bold text-gray-700">{canteenName}</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-2 italic font-medium">
            * Note: You can only order from one canteen per order to ensure faster delivery.
          </p>
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-gray-400 italic">Your tray is empty.</p>
        </div>
      )}

      {/* Scrollable Item List */}
      <div className="space-y-3 mb-6">
        {cart.map(item => (
          <div key={item.id} className="bg-white p-4 rounded-3xl flex justify-between items-center shadow-sm border border-gray-100">
            <div>
              <h4 className="font-bold text-gray-800">{item.name}</h4>
              <p className="text-primary font-bold text-sm">₹{item.price}</p>
            </div>
            <div className="flex items-center gap-3 bg-gray-100 rounded-2xl p-1">
              <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 bg-white rounded-xl shadow-sm font-bold text-primary">-</button>
              <span className="font-bold text-sm w-4 text-center">{item.qty || 1}</span>
              <button onClick={() => updateQty(item.id, 1)} className="w-8 h-8 bg-white rounded-xl shadow-sm font-bold text-primary">+</button>
              <button onClick={() => removeItem(item.id)} className="ml-2 text-gray-400 px-2">✕</button>
            </div>
          </div>
        ))}
        {/*{cart.length === 0 && <p className="text-center text-gray-400 py-10 italic">Tray is empty...</p>}*/}

      </div>
      {/* Location Selector */}
      <div className="mb-6 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
        <label className="text-[10px] font-black text-gray-400 uppercase ml-1 tracking-widest">Drop Location</label>
        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full mt-1 bg-transparent border-none outline-none font-bold text-gray-800 text-sm"
        >
          <option value="VKJ">VKJ Hostel (Main Gate)</option>
          <option value="VBH">VBH Hostel Reception</option>
          <option value="Library">Library Portico</option>
          <option value="TIFAC">TIFAC Building Entrance</option>
          <option value="CVR">CVR Hub</option>
        </select>
      </div>

      {/* Pricing Summary */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-gray-100">
        <div className="space-y-3 text-sm font-medium">
          <div className="flex justify-between text-gray-400 font-bold uppercase text-[10px]">
            <span>Subtotal</span>
            <span>₹{subtotal}</span>
          </div>
          <div className="flex justify-between text-gray-400 font-bold uppercase text-[10px]">
            <span>Delivery Fee</span>
            <span>₹{delivery}</span>
          </div>
          <div className="flex justify-between text-xl font-black pt-3 border-t border-dashed border-gray-200 text-gray-900">
            <span>Total</span>
            <span>₹{subtotal + delivery}</span>
          </div>
        </div>
        <button

          disabled={cart.length === 0}
          className="w-full bg-primary text-white font-black py-4 rounded-2xl mt-6 shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50"
        >
          CONFIRM ORDER
        </button>
      </div>
    </div>
  );
}