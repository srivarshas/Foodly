import { Link, useLocation } from 'react-router-dom';

export default function MobileNav({ role, cartCount }) {
  const location = useLocation();
  
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 px-6 py-3 flex justify-between items-center z-50">
      <Link to="/home" className={`flex flex-col items-center gap-1 ${isActive('/home') ? 'text-primary' : 'text-gray-400'}`}>
        <span className="text-2xl">🏠</span>
        <span className="text-[10px] font-bold uppercase tracking-wider">Home</span>
      </Link>

      {role === 'student' ? (
        <Link to="/cart" className={`flex flex-col items-center gap-1 relative ${isActive('/cart') ? 'text-primary' : 'text-gray-400'}`}>
          <span className="text-2xl">🛒</span>
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-primary text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
              {cartCount}
            </span>
          )}
          <span className="text-[10px] font-bold uppercase tracking-wider">Cart</span>
        </Link>
      ) : (
        <Link 
          to="/stats" 
          className={`flex flex-col items-center gap-1 ${isActive('/stats') ? 'text-primary' : 'text-gray-400'}`}
        >
          <span className="text-2xl">📈</span>
          <span className="text-[10px] font-bold uppercase tracking-wider">Stats</span>
        </Link>
      )}

      {role === 'student' ? (
        <Link to="/track" className={`flex flex-col items-center gap-1 ${isActive('/track') ? 'text-primary' : 'text-gray-400'}`}>
          <span className="text-2xl">📦</span>
          <span className="text-[10px] font-bold uppercase tracking-wider">Orders</span>
        </Link>
      ) : (
        <Link 
          to="/tasks" 
          className={`flex flex-col items-center gap-1 ${isActive('/tasks') ? 'text-primary' : 'text-gray-400'}`}
        >
          <span className="text-2xl">📦</span>
          <span className="text-[10px] font-bold uppercase tracking-wider">Tasks</span>
        </Link>
      )}

    </nav>
  );
}