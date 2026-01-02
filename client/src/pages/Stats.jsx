import { API_BASE_URL } from '../utils/api';
import { useState, useEffect } from 'react';

export default function BuddyStats({ user }) {
  const [stats, setStats] = useState({
    totalEarnings: 0,
    deliveryCount: 0,
    rating: 4.9,
    weeklyEarnings: [],
    stepsWalked: 0,
    co2Saved: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.name) {
      loadStats();
    }
  }, [user?.name]);

  const loadStats = async () => {
    if (!user?.name) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/delivery-users/${user.name}`);
      const data = await res.json();

      if (res.ok) {
        // Calculate weekly earnings from deliveries
        const weeklyEarnings = calculateWeeklyEarnings(data.deliveries || []);

        // Calculate steps walked (rough estimate: 100 steps per delivery)
        const stepsWalked = data.deliveryCount * 100;

        // Calculate CO2 saved (rough estimate: 0.2 kg per delivery)
        const co2Saved = data.deliveryCount * 0.2;

        setStats({
          totalEarnings: data.totalEarnings || 0,
          deliveryCount: data.deliveryCount || 0,
          rating: data.rating || 4.9,
          weeklyEarnings,
          stepsWalked,
          co2Saved
        });
      }
    } catch (e) {
      console.error('Failed to load stats:', e);
    } finally {
      setLoading(false);
    }
  };

  const calculateWeeklyEarnings = (deliveries) => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const dailyEarnings = [0, 0, 0, 0, 0, 0, 0];

    deliveries.forEach(delivery => {
      // Check for timestamp or createdAt (common in Firebase)
      const dateSource = delivery.timestamp || delivery.createdAt;
      if (dateSource) {
        const deliveryDate = new Date(dateSource);
        if (deliveryDate >= weekAgo) {
          const dayOfWeek = deliveryDate.getDay(); 
          const mondayFirstIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          
          // Use whatever field name you actually use in your DB (amount/deliveryFee/price)
          const amount = delivery.amount || delivery.deliveryFee || 0;
          dailyEarnings[mondayFirstIndex] += amount;
        }
      }
    });

    const maxEarning = Math.max(...dailyEarnings);
    
    // If no earnings yet, return 0s so the chart doesn't crash
    if (maxEarning === 0) return [0, 0, 0, 0, 0, 0, 0];

    // Return percentages
    return dailyEarnings.map(amount => (amount / maxEarning) * 100);
  };

  if (loading) {
    return (
      <div className="p-6 safe-area-bottom">
        <h2 className="text-3xl font-black mb-8">Your Impact</h2>
        <p className="text-center text-gray-400 py-10 italic">Loading stats...</p>
      </div>
    );
  }

  return (
    <div className="p-6 safe-area-bottom">
      <h2 className="text-3xl font-black mb-8">Your Impact</h2>

      {/* Weekly Earnings Chart */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 mb-6">
        <p className="text-xs font-bold text-gray-400 uppercase mb-4">Weekly Earnings</p>

        <div className="flex items-end justify-between h-32 w-full px-2 gap-2">
          {stats.weeklyEarnings.map((height, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <div
                className="w-full max-w-[20px] rounded-t-lg transition-all duration-1000 ease-out"
                style={{ 
                  height: `${height}%`, 
                  backgroundColor: height > 0 ? '#FF4D00' : '#F3F4F6', // Orange if data exists, gray if 0
                  minHeight: height > 0 ? '10px' : '2px' // Ensures even small earnings are visible
                }}
              ></div>
              <span className="text-[10px] font-bold text-gray-400">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100">
          <p className="text-[10px] font-bold text-blue-600 uppercase">Steps Walked</p>
          <p className="text-2xl font-black text-blue-900">{stats.stepsWalked.toLocaleString()}</p>
        </div>
        <div className="bg-orange-50 p-6 rounded-[2rem] border border-orange-100">
          <p className="text-[10px] font-bold text-orange-600 uppercase">CO2 Saved</p>
          <p className="text-2xl font-black text-orange-900">{stats.co2Saved.toFixed(1)} kg</p>
        </div>
      </div>

      {/* Total Earnings Summary */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-[2rem] border border-green-100 mt-6">
        <p className="text-[10px] font-bold text-green-600 uppercase mb-2">Total Earnings</p>
        <p className="text-3xl font-black text-green-900">₹{stats.totalEarnings.toFixed(2)}</p>
        <p className="text-xs text-green-600 mt-1">{stats.deliveryCount} deliveries completed</p>
      </div>

      <button className="w-full mt-8 p-4 bg-gray-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2">
        <span>📤</span> Cash Out Earnings
      </button><br/>
    </div>
  );
}
