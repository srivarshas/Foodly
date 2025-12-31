import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { canteens } from '../data/canteens';
import { canteenMenus } from '../data/menus';
import { campusDistances } from '../data/distances';
import { getTrafficTime, getCurrentTrafficStatus } from '../utils/googleMaps';

export default function AIAssistant({ user, addToCart }) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      type: 'ai',
      content: 'Hi! I\'m your AI Canteen Assistant! 🍽️\n\nTell me about your schedule or mood, and I\'ll suggest the perfect food for you. For example:\n• "I have a class in 10 minutes at TIFAC and I\'m starving, what\'s fast?"\n• "I need something quick near the library"\n• "I\'m feeling energetic, what should I eat?"',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const analyzeUserInput = (input) => {
    const lowerInput = input.toLowerCase();

    // Extract location mentions
    const locations = ['tifac', 'vkj', 'vbh', 'library', 'cvr'];
    const mentionedLocation = locations.find(loc => lowerInput.includes(loc));

    // Extract time mentions
    const timePatterns = [
      /(\d+)\s*min(?:ute)?s?/,
      /in\s+(\d+)\s*min(?:ute)?s?/,
      /(\d+)\s*hour(?:s?)/
    ];
    let timeConstraint = null;
    for (const pattern of timePatterns) {
      const match = lowerInput.match(pattern);
      if (match) {
        timeConstraint = parseInt(match[1]);
        break;
      }
    }

    // Extract mood/food preferences
    const preferences = {
      fast: lowerInput.includes('fast') || lowerInput.includes('quick') || lowerInput.includes('hurry'),
      healthy: lowerInput.includes('healthy') || lowerInput.includes('light'),
      filling: lowerInput.includes('filling') || lowerInput.includes('hungry') || lowerInput.includes('starving'),
      sweet: lowerInput.includes('sweet') || lowerInput.includes('dessert'),
      spicy: lowerInput.includes('spicy') || lowerInput.includes('hot'),
      vegetarian: lowerInput.includes('veg') || lowerInput.includes('vegetarian')
    };

    return { mentionedLocation, timeConstraint, preferences };
  };

  const getFoodRecommendations = ({ mentionedLocation, timeConstraint, preferences }) => {
    let suitableCanteens = [...canteens];

    // Filter by location if mentioned
    if (mentionedLocation) {
      suitableCanteens = canteens.filter(canteen => {
        const canteenName = canteen.name.toLowerCase();
        const location = canteen.location.toLowerCase();
        return canteenName.includes(mentionedLocation) || location.includes(mentionedLocation);
      });
    }

    // If no canteens match location, use distance-based filtering
    if (suitableCanteens.length === 0 && mentionedLocation) {
      const locationKey = mentionedLocation.toUpperCase();
      suitableCanteens = canteens.filter(canteen => {
        const distances = campusDistances[canteen.name];
        return distances && distances[locationKey] !== undefined;
      }).sort((a, b) => {
        const distA = campusDistances[a.name][locationKey];
        const distB = campusDistances[b.name][locationKey];
        return distA - distB;
      });
    }

    // If still no canteens, use all
    if (suitableCanteens.length === 0) {
      suitableCanteens = canteens;
    }

    // Get menu items from suitable canteens - only items actually available at that canteen
    const recommendations = [];
    suitableCanteens.forEach(canteen => {
      const menu = canteenMenus[canteen.id.toString()] || [];
      menu.forEach(item => {
        let score = 0;

        // Base score for being at this canteen
        score += 1;

        // Time constraint (prefer quick items under 10-15 min prep)
        if (timeConstraint && timeConstraint <= 15) {
          if (item.name.toLowerCase().includes('sandwich') ||
              item.name.toLowerCase().includes('burger') ||
              item.name.toLowerCase().includes('noodles') ||
              item.name.toLowerCase().includes('coffee') ||
              item.price <= 60) { // Assuming cheaper items are faster
            score += 3;
          }
        }

        // Location bonus - if canteen is near mentioned location
        if (mentionedLocation) {
          const distance = campusDistances[canteen.name]?.[mentionedLocation.toUpperCase()];
          if (distance !== undefined && distance <= 0.5) score += 2; // Bonus for very close canteens
        }

        // Preferences scoring
        if (preferences.fast && (item.price <= 60 || item.name.toLowerCase().includes('sandwich') || item.name.toLowerCase().includes('coffee'))) score += 2;
        if (preferences.healthy && item.veg && (item.name.toLowerCase().includes('salad') || item.name.toLowerCase().includes('veg'))) score += 2;
        if (preferences.filling && item.price >= 100 && (item.name.toLowerCase().includes('biryani') || item.name.toLowerCase().includes('masala'))) score += 2;
        if (preferences.sweet && (item.name.toLowerCase().includes('coffee') || item.name.toLowerCase().includes('latte') || item.name.toLowerCase().includes('muffin'))) score += 2;
        if (preferences.vegetarian && item.veg) score += 3;

        // Always include items with reasonable scores, but prioritize higher scores
        if (score > 0) {
          recommendations.push({
            ...item,
            canteenName: canteen.name,
            canteenId: canteen.id,
            score,
            distance: mentionedLocation ? campusDistances[canteen.name]?.[mentionedLocation.toUpperCase()] || canteen.distance : canteen.distance
          });
        }
      });
    });

    // Sort by score (primary) and distance (secondary)
    return recommendations
      .sort((a, b) => b.score - a.score || a.distance - b.distance)
      .slice(0, 3); // Return top 3 recommendations
  };

  const generateAIResponse = async (input) => {
    const analysis = analyzeUserInput(input);
    const recommendations = getFoodRecommendations(analysis);

    if (recommendations.length === 0) {
      return "I couldn't find any specific recommendations for your request. Try telling me more about what you're in the mood for or your location!";
    }

    const topRecommendation = recommendations[0];
    const timeEstimate = analysis.timeConstraint ?
      `within ${analysis.timeConstraint} minutes` :
      'quickly';

    // Get traffic data if location is mentioned
    let trafficInfo = null;
    if (analysis.mentionedLocation) {
      try {
        trafficInfo = await getTrafficTime(analysis.mentionedLocation.toUpperCase(), topRecommendation.canteenName);
      } catch (error) {
        console.error('Error getting traffic info:', error);
      }
    }

    // Get current traffic status
    const trafficStatus = await getCurrentTrafficStatus();

    let response = `Based on current ${trafficStatus.isPeakHour ? 'traffic conditions' : 'conditions'}, I recommend:\n\n`;

    response += `🍽️ **${topRecommendation.name} from ${topRecommendation.canteenName}**\n`;
    response += `💰 ₹${topRecommendation.price}\n`;

    if (analysis.mentionedLocation) {
      if (trafficInfo) {
        response += `🚶 ${trafficInfo.distanceText} away (${trafficInfo.durationText} walk)\n`;
        if (trafficInfo.trafficDuration !== trafficInfo.duration) {
          response += `🚦 Current traffic: ${trafficInfo.trafficDurationText}\n`;
        }
      } else {
        response += `📍 ${topRecommendation.distance}km from ${analysis.mentionedLocation.toUpperCase()}\n`;
      }
    }

    if (trafficStatus.isPeakHour) {
      response += `\n⚡ *Peak hour alert:* ${trafficStatus.message}\n`;
    }

    response += `\nWould you like me to add this to your tray? Just say "yes" or "add it"!`;

    return {
      text: response,
      recommendation: topRecommendation
    };
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    try {
      const aiResponse = await generateAIResponse(currentInput);

      const aiMessage = {
        type: 'ai',
        content: typeof aiResponse === 'string' ? aiResponse : aiResponse.text,
        recommendation: typeof aiResponse === 'object' ? aiResponse.recommendation : null,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error generating AI response:', error);
      const errorMessage = {
        type: 'ai',
        content: 'Sorry, I encountered an error while processing your request. Please try again!',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = (recommendation) => {
    const cartItem = {
      ...recommendation,
      id: recommendation.id,
      canteenName: recommendation.canteenName,
      canteenId: recommendation.canteenId
    };

    addToCart(cartItem);
    navigate('/cart');

    // Add confirmation message
    const confirmMessage = {
      type: 'ai',
      content: `✅ Added ${recommendation.name} to your tray! Redirecting to cart...`,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, confirmMessage]);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-primary/10">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">🤖</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">AI Canteen Assistant</h1>
              <p className="text-xs text-gray-500">Your personal food recommender</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/home')}
            className="text-gray-400 hover:text-gray-600 p-2"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 p-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.type === 'user'
                  ? 'bg-primary text-white'
                  : 'bg-white border border-gray-100 shadow-sm'
              }`}
            >
              <p className="text-sm whitespace-pre-line leading-relaxed">
                {message.content}
              </p>
              {message.recommendation && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => handleAddToCart(message.recommendation)}
                    className="w-full bg-primary text-white py-2 px-4 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    Add to Tray 🍽️
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-100 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Tell me about your schedule or mood..."
            className="flex-1 px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="px-6 py-3 bg-primary text-white rounded-2xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
