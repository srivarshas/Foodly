export default function FoodCard({ item, onAdd }) {
  return (
    <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex justify-between items-center transition-all active:scale-95">
      <div className="flex gap-4 items-center">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-2xl">
          {item.veg ? "🟢" : "🔴"}
        </div>
        <div>
          <h4 className="font-bold text-gray-800">{item.name}</h4>
          <p className="text-primary font-black">₹{item.price}</p>
        </div>
      </div>
      <button 
        onClick={onAdd}
        className="bg-primary/10 text-primary font-bold px-4 py-2 rounded-xl hover:bg-primary hover:text-white transition-colors"
      >
        Add +
      </button>
    </div>
  );
}