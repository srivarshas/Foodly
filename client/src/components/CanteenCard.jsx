import { useNavigate } from 'react-router-dom';

export default function CanteenCard({ canteen }) {
  const navigate = useNavigate();

  return (
    <div 
      onClick={() => navigate(`/menu/${canteen.id}`)}
      className="bg-white rounded-[2rem] p-4 flex items-center gap-4 border border-gray-100 shadow-sm active:scale-95 transition-all"
    >
      <div className="w-20 h-20 bg-gray-50 rounded-[1.5rem] flex items-center justify-center text-3xl shadow-inner italic font-black text-gray-200">
        {canteen.image}
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <h3 className="font-black text-gray-800 text-lg">{canteen.name}</h3>
          <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-1 rounded-lg">
            ★ {canteen.rating}
          </span>
        </div>
        <p className="text-gray-400 text-xs font-medium">{canteen.location}</p>
        <div className="flex gap-3 mt-2 text-[10px] font-bold text-gray-500 uppercase">
          <span>{canteen.distance} KM</span>
          <span className="text-secondary">•</span>
          <span>{Math.round(canteen.distance * 8)} MINS</span>
        </div>
      </div>
    </div>
  );
}