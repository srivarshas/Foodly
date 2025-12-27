import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
      <button onClick={() => navigate(-1)} className="mb-4 text-primary font-bold">← Back</button>
      <h2 className="text-xl font-bold mb-2">Canteen Menu</h2>
      <p className="text-gray-500 text-sm mb-6">Estimated prep time: 15 mins</p>

      <div className="space-y-4">
        {MOCK_MENU.map(item => (
         
          <FoodCard key={item.id} item={item} onAdd={() => addToCart(item)} />
        ))}
      </div>
      <br/><br/><br/><br/>
    </div>
  );
}
