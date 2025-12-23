import { useNavigate } from 'react-router-dom'; // Need this for navigation
import { canteens } from '../data/canteens';
import CanteenCard from '../components/CanteenCard';

export default function StudentDashboard() {
  const navigate = useNavigate();

  // Define the logout logic inside the component so the button can access it
  const handleLogout = () => {
    if (window.confirm("Do you want to logout?")) {
      navigate('/');
    }
  };

  return (
    <div className="p-4 space-y-6 safe-area-bottom">
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

{/* Updated Gemini Recommendation Section with Brand Colors */}
<div className="bg-gradient-to-br from-primary via-[#FF6B6B] to-secondary rounded-[2rem] p-6 text-white shadow-xl shadow-primary/20 relative overflow-hidden">
  {/* Decorative Glow */}
  <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
  <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl italic font-black select-none">
    GEMINI
  </div>
  
  <div className="flex items-center gap-2 mb-3 relative z-10">
    <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-md text-xl">✨</div>
    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-90">
      AI Optimization Active
    </span>
  </div>
  
  <h3 className="text-lg font-bold leading-tight relative z-10">
    Lunch Peak at VKJ! 🏃‍♂️
  </h3>
  <p className="text-sm opacity-95 mt-2 font-medium relative z-10 leading-relaxed">
    Main Canteen is crowded. Gemini suggests <span className="underline decoration-white/50 decoration-2 font-black italic">Canopy</span> to save you <span className="font-black text-white">12 minutes</span> of waiting.
  </p>
</div>

      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-500 text-xs uppercase tracking-widest">Available Kitchens</h3>
          <span className="text-primary text-[10px] font-black uppercase border-b-2 border-primary/20">See map</span>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {canteens.map((canteen) => (
            <CanteenCard key={canteen.id} canteen={canteen} />
          ))}
        </div>
      </section>

      <br/>
    </div>
  );
}