import { useState, useEffect } from 'react';

export default function StudentWallet({ user }) {
  const [wallet, setWallet] = useState({ balance: 0, history: [] });

  useEffect(() => {
    fetch(`http://localhost:3000/wallet/${user.name}`)
      .then(res => res.json())
      .then(data => setWallet(data));
  }, [user.name]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white shadow-2xl mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <p className="text-xs font-bold opacity-50 uppercase tracking-[0.2em] mb-2">Available Credits</p>
        <h2 className="text-5xl font-black italic">₹{wallet.balance.toFixed(2)}</h2>
        <button className="mt-6 bg-white/10 hover:bg-white/20 py-2 px-6 rounded-full text-xs font-bold transition-all">
          + Top Up
        </button>
      </div>

      <h3 className="text-lg font-black italic mb-4 uppercase tracking-tighter">Transaction History</h3>
      <div className="space-y-3">
        {wallet.history.map((tx, i) => (
          <div key={i} className="bg-white p-4 rounded-2xl flex justify-between items-center border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">🍱</div>
              <div>
                <p className="font-bold text-sm text-gray-800">{tx.type === 'order' ? 'Food Order' : 'Refund'}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase">{tx.date}</p>
              </div>
            </div>
            <span className="font-black text-red-500">-₹{tx.amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}