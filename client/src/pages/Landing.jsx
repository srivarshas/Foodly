import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="px-6 pt-20 pb-10 text-center">
        <div className="inline-block px-4 py-1.5 mb-6 bg-primary/10 rounded-full">
          <span className="text-primary text-xs font-bold tracking-widest uppercase">SASTRA University Exclusive</span>
        </div>
        <h1 className="text-5xl font-black text-gray-900 leading-tight mb-6">
          Fueling Your <br />
          <span className="text-primary italic font-serif">Campus Life.</span>
        </h1>
        <p className="text-gray-500 text-lg mb-10 max-w-xs mx-auto">
          Get food delivered from 15+ canteens by fellow students. Fast, fresh, and reliable.
        </p>
        
        <div className="flex flex-col gap-4">
          <button 
            onClick={() => navigate('/login')}
            className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-xl shadow-primary/20 transition-transform active:scale-95"
          >
            Get Started
          </button>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <span>Powered by</span>
            <span className="font-bold text-blue-600">Google Gemini</span>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="px-6 py-10 grid grid-cols-1 gap-4">
        <div className="bg-gray-50 p-6 rounded-[2.5rem]">
          <span className="text-3xl">🏃‍♂️</span>
          <h4 className="font-black mt-4">Zero Queues</h4>
          <p className="text-sm text-gray-500 mt-1">Don't waste your break standing in line at the Main Canteen.</p>
        </div>
        <div className="bg-gray-50 p-6 rounded-[2.5rem]">
          <span className="text-3xl">💰</span>
          <h4 className="font-black mt-4">Earn While Walking</h4>
          <p className="text-sm text-gray-500 mt-1">Deliver food on your way to the next lecture and earn pocket money.</p>
        </div>
      </div>
    </div>
  );
}