import { useState, useEffect } from 'react';

export default function BuddyTask({ user }) {
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // OTP States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  const buddySteps = [
    { id: 1, label: "Confirm Pickup", icon: "🍱", status: 'PICKED_UP' },
    { id: 2, label: "Heading to Drop-off", icon: "🚴", status: 'OUT_FOR_DELIVERY' },
    { id: 3, label: "Mark as Delivered", icon: "✅", status: 'DELIVERED' }
  ];

  useEffect(() => {
    loadActiveOrders();
    const interval = setInterval(loadActiveOrders, 5000);
    return () => clearInterval(interval);
  }, [user?.name]);

  const loadActiveOrders = async () => {
    if (!user?.name) return;
    try {
      const res = await fetch('http://localhost:3000/orders');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to load orders');
      const orders = Array.isArray(data) ? data : Object.values(data || {});
      
      const myActiveTasks = orders.filter(order =>
        String(order?.pickedby || '').toLowerCase() === user.name.toLowerCase() &&
        !['DELIVERED', 'CANCELLED'].includes(String(order?.status || '').toUpperCase())
      );
      
      setActiveOrders(myActiveTasks);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // STEP 1: Handle Normal Status Updates (Pickup & En-Route)
  const handleStepClick = (orderId, stepStatus, deliveryFee, stepId) => {
    if (stepStatus === 'DELIVERED') {
      // For the final step, send OTP email and open the verification modal
      sendOTPEmail(orderId);
      setSelectedOrderId(orderId);
      setShowOtpModal(true);
    } else {
      updateOrderStatus(orderId, stepStatus, deliveryFee);
    }
  };

  const updateOrderStatus = async (orderId, newStatus, deliveryFee) => {
    try {
      const res = await fetch(`http://localhost:3000/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) throw new Error('Failed to update status');

      // OPTION A: Release Payments only if status is DELIVERED
      if (newStatus === 'DELIVERED') {
        const earnRes = await fetch(`http://localhost:3000/delivery-users/${user.name}/earn`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: deliveryFee,
            orderId: orderId
          })
        });
        if (!earnRes.ok) console.error('Earnings update failed');
      }

      await loadActiveOrders();
    } catch (e) {
      alert(e.message);
    }
  };

  // STEP 2: Verify OTP for Final Handover
  const verifyHandoverOTP = async () => {
    setOtpLoading(true);
    setOtpError('');
    try {
      const res = await fetch(`http://localhost:3000/orders/${selectedOrderId}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          otp: otp.replace(/\s/g, ''), // Remove any spaces
          buddyId: user?.name // Use the delivery user's name as buddyId
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Invalid OTP');

      // Correct OTP! Now complete the order and trigger payment
      const order = activeOrders.find(o => o.id === selectedOrderId);
      await updateOrderStatus(selectedOrderId, 'DELIVERED', order.deliveryFee);

      setShowOtpModal(false);
      setOtp('');
      alert("Verification Successful! Earnings added to wallet.");
    } catch (e) {
      setOtpError(e.message);
    } finally {
      setOtpLoading(false);
    }
  };

  // Send OTP email when delivery buddy arrives
  const sendOTPEmail = async (orderId) => {
    try {
      const res = await fetch(`http://localhost:3000/orders/${orderId}/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) {
        const data = await res.json();
        console.error('Failed to send OTP email:', data?.error);
        // Continue anyway - the OTP modal will still open
      } else {
        console.log('OTP email sent successfully');
      }
    } catch (error) {
      console.error('Error sending OTP email:', error);
      // Continue anyway - the OTP modal will still open
    }
  };

  const getStepIndex = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'DELIVERED') return 3;
    if (s === 'OUT_FOR_DELIVERY') return 2;
    if (s === 'PICKED_UP') return 1;
    return 0;
  };

  return (
    <div className="p-4 pb-24 min-h-screen bg-gray-50">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-gray-800 tracking-tight">Active Tasks</h2>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Verification Required for Handover</p>
      </div>

      {activeOrders.map((order) => {
        const currentStep = getStepIndex(order.status);
        return (
          <div key={order.id} className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-gray-100 mb-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-black text-gray-800">Order #{order.id}</h2>
              <p className="text-lg font-black text-green-600">₹{order.deliveryFee}</p>
            </div>

            {/* Customer Contact Info */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Customer Contact</p>
                  <p className="text-sm font-bold text-gray-800">{order.customerPhone || "Not available"}</p>
                </div>
                {order.customerPhone && (
                  <a href={`tel:${order.customerPhone}`} className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">📞</a>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {buddySteps.map((step) => {
                const isCompleted = currentStep >= step.id;
                const isNext = currentStep === step.id - 1;

                return (
                  <button
                    key={step.id}
                    disabled={!isNext}
                    onClick={() => handleStepClick(order.id, step.status, order.deliveryFee, step.id)}
                    className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all ${
                      isCompleted ? "bg-green-50 text-green-600 opacity-60" :
                      isNext ? "bg-gray-900 text-white shadow-lg" : "bg-gray-50 text-gray-300"
                    }`}
                  >
                    <span className="font-bold text-xs flex items-center gap-2">
                      <span className="text-lg">{step.icon}</span> {step.label}
                    </span>
                    {isCompleted && <span>✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* OTP MODAL (Handover Verification) */}
{showOtpModal && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
    <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl max-w-md w-full animate-in zoom-in duration-300">
      
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🤝</span>
        </div>
        <h3 className="text-xl font-black text-gray-800 mb-1">Confirm Handover</h3>
        <p className="text-sm text-gray-500 font-medium">
          Enter the 6-digit code shown on the student's screen
        </p>
      </div>

      {/* 6-Box OTP Input */}
      <div className="flex justify-center gap-2 mb-6">
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <input
            key={index}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength="1"
            value={otp[index] || ''}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '');
              if (value === '') {
                // Handle deletion
                const newOtp = otp.split('');
                newOtp[index] = '';
                setOtp(newOtp.join(''));
                return;
              }

              // Handle new digit input
              const newOtp = otp.split('');
              newOtp[index] = value;
              setOtp(newOtp.join(''));

              // Auto-focus next box
              if (value && index < 5) {
                const nextInput = e.target.parentElement.children[index + 1];
                if (nextInput) nextInput.focus();
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' && index > 0 && !otp[index]) {
                const prevInput = e.target.parentElement.children[index - 1];
                if (prevInput) prevInput.focus();
              }
            }}
            className="w-11 h-14 text-center text-xl font-black border-2 border-gray-100 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
            autoFocus={index === 0}
          />
        ))}
      </div>

      {/* Error Message */}
      {otpError && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4">
          <p className="text-red-600 text-[10px] font-black text-center uppercase tracking-widest">
            {otpError}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => {
            setShowOtpModal(false);
            setOtp('');
            setOtpError('');
          }}
          className="flex-1 bg-gray-100 text-gray-500 font-black py-4 rounded-2xl text-xs uppercase tracking-widest active:scale-95 transition-all"
          disabled={otpLoading}
        >
          Cancel
        </button>
        <button
          onClick={verifyHandoverOTP}
          disabled={otpLoading || otp.length !== 6}
          className="flex-1 bg-primary text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50 transition-all"
        >
          {otpLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Checking...</span>
            </div>
          ) : (
            'Complete'
          )}
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}
