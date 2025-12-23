import { useState } from 'react';
import Timeline from '../components/Timeline';

export default function OrderTracking() {
  const [rating, setRating] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // In a real app, this 'currentStep' would come from the database
  // For the demo, we simulate it being at the last step to show the rating UI
  const steps = [
    { label: 'Order Confirmed', time: '12:40 PM', done: true },
    { label: 'Food is Ready', time: '12:55 PM', done: true },
    { label: 'Picked up by Campus Hero', time: '01:02 PM', done: true },
    { label: 'Delivered', time: '01:15 PM', done: true }, // Set to true for demo
  ];

  const isDelivered = steps[steps.length - 1].done;

  return (
    <div className="p-6 safe-area-bottom">
      <div className="text-center mb-10">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
          {isDelivered ? "✅" : "🚴"}
        </div>
        <h2 className="text-2xl font-black italic">
          {isDelivered ? "Enjoy your meal!" : "Foodly Hero is on the way!"}
        </h2>
        <p className="text-gray-500 text-sm">
          {isDelivered ? "Order #4402 delivered" : "Estimated arrival: 01:12 PM"}
        </p>
      </div>

      <Timeline steps={steps} />

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

      <div className="mt-8 bg-white p-5 rounded-3xl border border-gray-100 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-secondary/20 rounded-2xl flex items-center justify-center text-xl">🎓</div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Foodly Buddy</p>
            <p className="font-bold">Bob</p>
          </div>
        </div>
        <button className="bg-primary p-3 rounded-2xl text-white shadow-lg shadow-primary/30 active:scale-90 transition-all">
          💬
        </button>
      </div>
      <br/>
    </div>
  );
}