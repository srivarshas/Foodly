import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login({ setRole, setUser }) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState('student');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (!email.endsWith('@sastra.ac.in') && !email.endsWith('@gmail.com')) {
      setError('Please use your university or Gmail address');
      return;
    }

    // Extract name from email (part before @)
    const name = email.split('@')[0];

    // Set the global role and user in App.jsx and move to home
    setRole(selectedRole);
    setUser({ email, name, phone });
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 flex flex-col justify-center">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-black text-gray-900">Sign In</h2>
        <p className="text-gray-500 mt-2 font-medium">Use your university credentials</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-6">
        {/* Role Selection Tabs */}
        <div className="flex bg-gray-200 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setSelectedRole('student')}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${selectedRole === 'student' ? 'bg-white shadow-sm text-primary' : 'text-gray-500'}`}
          >
            Order Food
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole('delivery')}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${selectedRole === 'delivery' ? 'bg-white shadow-sm text-primary' : 'text-gray-500'}`}
          >
            Earn Money
          </button>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-400 ml-2 uppercase">University Email</label>
          <input
            type="email"
            placeholder="125XXXXXX@sastra.ac.in"
            className={`w-full mt-1 p-4 rounded-2xl bg-white border ${error ? 'border-red-500' : 'border-transparent'} shadow-sm outline-none focus:ring-2 focus:ring-primary/20`}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            required
          />
          {error && <p className="text-red-500 text-[10px] mt-2 ml-2 font-bold uppercase tracking-wider">{error}</p>}
        </div>

        <div>
          <label className="text-xs font-bold text-gray-400 ml-2 uppercase">Phone Number</label>
          <input
            type="tel"
            placeholder="+91 98765 43210"
            className="w-full mt-1 p-4 rounded-2xl bg-white border border-transparent shadow-sm outline-none focus:ring-2 focus:ring-primary/20"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>

        <button className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl shadow-xl active:scale-95 transition-all">
          Enter Campus →
        </button>
      </form>
      
      <p className="mt-10 text-center text-xs text-gray-400">
        By continuing, you agree to follow the <br /> <b>Campus Code of Conduct.</b>
      </p>
    </div>
  );
}
