export default function OrderCard({ order }) {
  return (
    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm mb-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Order #4402</p>
          <h4 className="font-bold text-gray-800">Paneer Butter Masala</h4>
        </div>
        <span className="bg-primary/10 text-primary text-[10px] font-bold px-3 py-1 rounded-full">
          In Progress
        </span>
      </div>
      <div className="flex justify-between items-center pt-3 border-t border-dashed">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-[10px]">🏠</div>
          <p className="text-xs text-gray-600 font-medium font-mono">VKJ Hostel, Room 302</p>
        </div>
        <p className="font-black text-gray-800">₹145</p>
      </div>
    </div>
  );
}