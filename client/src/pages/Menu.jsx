import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { canteenMenus } from '../data/menus';
import { canteens } from '../data/canteens';
import FoodCard from '../components/FoodCard';
import { canteens } from '../data/canteens';

const MOCK_MENU = [
  { id: 1, name: "Paneer Butter Masala", price: 120, veg: true },
  { id: 2, name: "Chicken Biryani", price: 180, veg: false },
  { id: 3, name: "Masala Dosa", price: 60, veg: true },
];

export default function Menu({ addToCart, setSelectedCanteen }) {
  const { id } = useParams();
  const navigate = useNavigate();

  // Persist selected canteen in app state so Cart can include it in the order payload.
  useEffect(() => {
    const canteenId = Number(id);
    const match = canteens.find((c) => Number(c.id) === canteenId);
    if (match && typeof setSelectedCanteen === 'function') {
      setSelectedCanteen({ id: match.id, name: match.name });
    }
  }, [id, setSelectedCanteen]);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-black">{canteen.name}</h2>
      
      <div className="space-y-4 mt-6">
        {/* Restriction Alert */}
        {isLockedToOtherCanteen && (
          <div className="bg-red-50 border border-red-100 p-4 rounded-2xl mb-6 shadow-sm">
            <p className="text-xs text-red-600 font-bold leading-tight">
              🚫 TRAY RESTRICTION
            </p>
            <p className="text-[11px] text-gray-600 mt-1">
              To maintain delivery speed, you can only order from one canteen per order. 
              You currently have items from <span className="font-bold underline text-red-700">{cart[0].canteenName}</span>.
            </p>
            <button 
              onClick={() => navigate('/cart')} 
              className="mt-3 text-[10px] font-black bg-red-600 text-white px-3 py-1.5 rounded-lg uppercase"
            >
              Go to Cart to Clear Tray
            </button>
          </div>
        )}

      <div className="space-y-4">
        {MOCK_MENU.map(item => (
         
          <FoodCard key={item.id} item={item} onAdd={() => addToCart(item)} />
        ))}
      </div>
    </div>
  );
}
