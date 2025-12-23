import { useState } from 'react';

export default function BuddyTask() {
  const [step, setStep] = useState(1); // 1: Accepted, 2: Picked, 3: Near, 4: Delivered

  const buddySteps = [
    { id: 1, label: "Confirm Pickup", icon: "🍱" },
    { id: 2, label: "I'm Heading to Drop-off", icon: "🚴" },
    { id: 3, label: "I've Arrived", icon: "📍" },
    { id: 4, label: "Mark as Delivered", icon: "✅" }
  ];

  return (
    <div className="p-6 safe-area-bottom">
      <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-gray-100 mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-md uppercase">Active Task</span>
            <h2 className="text-xl font-black mt-2">Order #4402</h2>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-400 font-bold uppercase">Payout</p>
            <p className="text-lg font-black text-green-600">₹45.00</p>
          </div>
        </div>

        {/* Customer Contact Card */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-lg">👤</div>
            <div>
              <p className="font-bold text-sm">Alice (Student)</p>
              <p className="text-[10px] text-gray-500 font-mono">+91 98XXX XXXXX</p>
            </div>
          </div>
          <a href="tel:9876543210" className="bg-primary p-3 rounded-xl text-white shadow-md">📞</a>
        </div>

        {/* Action Button Area */}
        <div className="space-y-4">
          <p className="text-xs font-bold text-gray-400 uppercase text-center">Update Progress</p>
          {buddySteps.map((s) => (
            <button
              key={s.id}
              disabled={step !== s.id}
              onClick={() => setStep(s.id + 1)}
              className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all ${
                step === s.id 
                  ? "bg-gray-900 text-white scale-100 shadow-lg" 
                  : step > s.id 
                  ? "bg-green-50 text-green-600 opacity-50" 
                  : "bg-gray-100 text-gray-400 opacity-30"
              }`}
            >
              <span className="font-bold text-sm">{s.icon} {s.label}</span>
              {step > s.id && <span>✓</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}