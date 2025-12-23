export default function BuddyStats() {
  return (
    <div className="p-6 safe-area-bottom">
      <h2 className="text-3xl font-black mb-8">Your Impact</h2>
      
      {/* Visual Progress Graph Mockup */}
<div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 mb-6">
  <p className="text-xs font-bold text-gray-400 uppercase mb-4">Weekly Earnings</p>

<div className="flex items-end justify-between h-32 w-full px-2 gap-2">
  {[
    { h: 40, day: 'M' },
    { h: 70, day: 'T' },
    { h: 45, day: 'W' },
    { h: 90, day: 'T' },
    { h: 0, day: 'F' },
    { h: 0, day: 'S' },
    { h: 0, day: 'S' }
  ].map((item, i) => (
    <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
      {/* The Bar - Now with a fixed width and fallback color */}
      <div 
        className={`w-full max-w-[20px] rounded-t-lg transition-all duration-500 
          ${i === 3 ? 'bg-orange-500' : 'bg-gray-200'}`} 
        style={{ height: `${item.h}%`, minHeight: '4px' }} 
      ></div>
      {/* Label */}
      <span className="text-[10px] font-bold text-gray-400">{item.day}</span>
    </div>
  ))}
</div>
</div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100">
          <p className="text-[10px] font-bold text-blue-600 uppercase">Steps Walked</p>
          <p className="text-2xl font-black text-blue-900">12.4k</p>
        </div>
        <div className="bg-orange-50 p-6 rounded-[2rem] border border-orange-100">
          <p className="text-[10px] font-bold text-orange-600 uppercase">CO2 Saved</p>
          <p className="text-2xl font-black text-orange-900">2.1 kg</p>
        </div>
      </div>

      <button className="w-full mt-8 p-4 bg-gray-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2">
        <span>📤</span> Cash Out Earnings
      </button><br/>
    </div>
  );
}