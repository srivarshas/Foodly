export default function OrderCard({ order, onClick }) {
  const status = (order?.status || 'PLACED').toUpperCase();
  const isDelivered = status === 'DELIVERED';

  const statusLabelByStatus = {
    PLACED: 'Placed',
    PICKED_UP: 'Picked Up',
    OUT_FOR_DELIVERY: 'Out for delivery',
    DELIVERED: 'Delivered',
  };

  const pillClass = isDelivered
    ? 'bg-green-100 text-green-700'
    : 'bg-primary/10 text-primary';

  const title = Array.isArray(order?.items) && order.items.length > 0
    ? `${order.items[0].name}${order.items.length > 1 ? ` +${order.items.length - 1}` : ''}`
    : 'Order';

  return (
    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm mb-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => onClick && onClick(order)}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
            {order?.canteenName ? `Pickup: ${order.canteenName}` : 'Pickup'}
          </p>
          <h4 className="font-bold text-gray-800">{title}</h4>
        </div>
        <span className={`${pillClass} text-[10px] font-bold px-3 py-1 rounded-full`}>
          {statusLabelByStatus[status] || status}
        </span>
      </div>
      <div className="flex justify-between items-center pt-3 border-t border-dashed">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-[10px]">🏠</div>
          <p className="text-xs text-gray-600 font-medium font-mono">{order?.dropLocation || '-'}</p>
        </div>
        <p className="font-black text-gray-800">₹{typeof order?.totalAmount === 'number' ? order.totalAmount : '-'}</p>
      </div>
    </div>
  );
}
