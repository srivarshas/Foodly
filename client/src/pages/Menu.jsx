import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { canteenMenus } from '../data/menus';
import { canteens } from '../data/canteens';
import FoodCard from '../components/FoodCard';

export default function Menu({ addToCart, cart = [], setSelectedCanteen }) {
  const { id } = useParams();
  const navigate = useNavigate();

  // Find the current canteen and its menu items
  const canteen = canteens?.find((c) => String(c.id) === id);
  const currentMenu = canteenMenus[id] || [];

  // Logic to prevent ordering from multiple canteens
  const isLockedToOtherCanteen = cart.length > 0 && cart[0].canteenName !== canteen?.name;

  // Persist selected canteen in app state for the order payload
  useEffect(() => {
    const canteenId = Number(id);
    const match = canteens.find((c) => Number(c.id) === canteenId);
    if (match && typeof setSelectedCanteen === 'function') {
      setSelectedCanteen({ id: match.id, name: match.name });
    }
  }, [id, setSelectedCanteen]);

  if (!canteen) {
    return <div className="p-10 text-center font-bold">Canteen ID {id} not found!</div>;
  }

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

        {/* Menu Items List */}
        <div className="space-y-4">
          {currentMenu.length > 0 ? (
            currentMenu.map((item) => (
              <FoodCard 
                key={item.id} 
                item={item} 
                onAdd={() => addToCart({ ...item, canteenName: canteen.name })} 
              />
            ))
          ) : (
            <p className="text-gray-400">No items available for this canteen yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}