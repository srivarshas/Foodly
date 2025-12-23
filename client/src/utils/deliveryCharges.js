export const calculateDelivery = (distanceValue, cartTotal) => {
  const baseFee = 10;
  const percentFee = cartTotal * 0.05; // 7% average
  const rushFee = 5; // Static for demo lunch hours
  
  // distanceValue would be a constant passed from your distances.js 
  // e.g., VKJ to Main Canteen = 10, Canopy to Library = 5
  return Math.round(baseFee + percentFee + distanceValue + rushFee);
};