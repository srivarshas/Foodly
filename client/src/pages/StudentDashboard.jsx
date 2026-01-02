import { API_BASE_URL } from '../utils/api';
import { useState, useEffect } from 'react'; // <--- Added useState here
import { useNavigate } from 'react-router-dom';
import { canteens } from '../data/canteens';
import CanteenCard from '../components/CanteenCard';

// Ensure 'user' is passed as a prop if you are using user.name
export default function StudentDashboard({ user }) { 
  const navigate = useNavigate();
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [wallet, setWallet] = useState({ balance: 0, history: [] });

  const handleLogout = () => {
    if (window.confirm("Do you want to logout?")) {
      navigate('/');
    }
  };

  useEffect(() => {
    if (user?.name) {
      fetch(`${API_BASE_URL}/wallet/${user.name}`)
        .then(res => res.json())
        .then(data => setWallet(data))
        .catch(err => console.error("Wallet fetch error:", err));
    }
  }, [user?.name, isWalletOpen]); 

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

      {/* Updated Gemini Recommendation Section */}
      <div className="bg-gradient-to-br from-primary via-[#FF6B6B] to-secondary rounded-[2rem] p-6 text-white shadow-xl shadow-primary/20 relative overflow-hidden">
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
        <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl italic font-black select-none">GEMINI</div>
        <div className="flex items-center gap-2 mb-3 relative z-10">
          <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-md text-xl">✨</div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-90">AI Optimization Active</span>
        </div>
        <h3 className="text-lg font-bold leading-tight relative z-10">Lunch Peak at VKJ! 🏃‍♂️</h3>
        <p className="text-sm opacity-95 mt-2 font-medium relative z-10 leading-relaxed">
          Main Canteen is crowded. Gemini suggests <span className="underline decoration-white/50 decoration-2 font-black italic">Canopy</span> to save you <span className="font-black text-white">12 minutes</span>.
        </p>
      </div>

      {/* --- WALLET CARD DIV --- */}
      <div className="px-2">
        <div 
          onClick={() => setIsWalletOpen(true)}
          className="bg-gray-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-all duration-300"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/40 transition-all"></div>
          <div className="relative z-10 flex justify-between items-center">
            <div>
              <p className="text-[10px] font-black opacity-50 uppercase tracking-[0.2em] mb-1">Total Balance</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold opacity-70">₹</span>
                <h2 className="text-5xl font-black italic tracking-tighter">
                  {(wallet?.balance ?? 0).toFixed(2)}
                </h2>
              </div>
              <p className="text-[9px] mt-4 font-bold text-primary uppercase tracking-widest">Click to view history →</p>
            </div>
            <div className="bg-white/10 p-5 rounded-[2rem] backdrop-blur-md border border-white/5">
              <span className="text-3xl">👛</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- WALLET POPUP MODAL --- */}
      {isWalletOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsWalletOpen(false)}></div>
          <div className="relative bg-white w-full max-w-lg h-[80vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col scale-100 transition-transform">
            <div className="p-8 pb-4 flex justify-between items-center">
              <h3 className="text-2xl font-black italic tracking-tighter text-gray-800">WALLET</h3>
              <button onClick={() => setIsWalletOpen(false)} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto px-8 pb-8">
               <div className="bg-gray-50 rounded-[2rem] p-6 mb-6">
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Current Credits</p>
                  <h4 className="text-3xl font-black text-gray-900">₹{(wallet?.balance ?? 0).toFixed(2)}</h4>
               </div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Recent Activity</p>
               <div className="space-y-3">
                  {wallet?.history && wallet.history.length>0 ? (
    wallet.history.map((tx, i) => (
                      <div key={i} className="flex justify-between items-center p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-lg">
                            {tx.type === 'order' ? '🍱' : '💰'}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-gray-800">{tx.type === 'order' ? 'Food Order' : 'Wallet Top-up'}</p>
                            <p className="text-[9px] text-gray-400 font-bold uppercase">{new Date(tx.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <span className={`font-black ${tx.type === 'order' ? 'text-red-500' : 'text-green-500'}`}>
                          {tx.type === 'order' ? '-' : '+'}₹{tx.amount}
                        </span>
                      </div>
                    )).reverse()
                  ) : (
                    <div className="text-center py-10 opacity-30 italic font-medium">No transactions yet</div>
                  )}
               </div>
            </div>
            <div className="p-6 bg-gray-50 border-t border-gray-100">
              <button className="w-full bg-primary text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em]">Add Credits</button>
            </div>
          </div>
        </div>
      )}

      {/* Canteen List */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-500 text-xs uppercase tracking-widest">Available Kitchens</h3>
          <span className="text-primary text-[10px] font-black uppercase border-b-2 border-primary/20 cursor-pointer">See map</span>
        </div>
        <div className="grid grid-cols-1 gap-4 pb-10">
          {canteens.map((canteen) => (
            <CanteenCard key={canteen.id} canteen={canteen} />
          ))}
        </div>
      </section>

      {/* AI Chat Bubble */}
      <div className="fixed bottom-20 right-7rem z-50">
        <button
          onClick={() => navigate('/ai-assistant')}
          className="w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
        >
          <span className="text-white text-xl group-hover:scale-110 transition-transform">🤖</span>
        </button>
        <div className="absolute -top-2 -left-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
          <span className="text-white text-xs font-bold">AI</span>
        </div>
      </div>
    </div>
  );
}
