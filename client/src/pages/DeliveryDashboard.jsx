import { useState } from 'react';

export default function DeliveryDashboard() {
  const [currentStep, setCurrentStep] = useState(0);
  const statusSteps = ["Waiting for Pickup", "Picked Up", "Arrived at Hostel", "Delivered"];

  const handleStatusUpdate = () => {
    if (currentStep < statusSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
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
        <h3 className="text-4xl font-black mt-1">₹450.00</h3>
        <div className="flex gap-3 mt-6">
          <div className="bg-white/10 px-4 py-2 rounded-2xl">
            <p className="text-[10px] opacity-60">Deliveries</p>
            <p className="text-sm font-bold">12</p>
          </div>
          <div className="bg-white/10 px-4 py-2 rounded-2xl">
            <p className="text-[10px] opacity-60">Rating</p>
            <p className="text-sm font-bold">4.9 ★</p>
          </div>
        </div>
      </div>

      {/* Active Order Controller */}
      <div className="bg-primary/5 border-2 border-primary/20 p-6 rounded-[2.5rem] mb-8">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-black text-gray-800 tracking-tight">Active Delivery</h4>
          <span className="animate-pulse flex h-2 w-2 rounded-full bg-primary"></span>
        </div>
        <p className="text-sm text-gray-600 mb-6 font-medium">
          Deliver to: <span className="text-black font-bold">VKJ Block 2, Room 402</span>
        </p>
        
        <button 
          onClick={handleStatusUpdate}
          className="w-full bg-primary text-white py-4 rounded-2xl font-black shadow-lg shadow-primary/30 active:scale-95 transition-all text-sm uppercase tracking-wider"
        >
          {currentStep === statusSteps.length - 1 ? "✅ Order Complete" : `Update: ${statusSteps[currentStep]}`}
        </button>
      </div>

      <h2 className="font-black text-xl mb-4 text-gray-800 px-2">New Gigs Near You</h2>
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex justify-between items-center">
            <div>
              <p className="text-[10px] font-bold text-primary uppercase mb-1">Pickup: Main Canteen</p>
              <h4 className="font-bold text-gray-800 text-sm">To: Canopy Mess</h4>
              <p className="text-xs text-gray-400 mt-1 italic font-medium">Earn ₹25 + ₹10 Rush Fee</p>
            </div>
            <button className="bg-gray-900 text-white px-5 py-3 rounded-2xl font-bold text-xs shadow-md">
              Accept
            </button>
          </div>
        ))}
      </div>
      <br/>
    </div>
  );
}