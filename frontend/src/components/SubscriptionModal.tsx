import React, { useState } from 'react';
import { X, Check, Crown, Zap, Users, CreditCard } from 'lucide-react';
import { SUBSCRIPTION_PLANS, SubscriptionPlan } from '../types/subscription';
import { usePayment } from '../hooks/usePayment';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (plan: SubscriptionPlan, paymentId?: string) => void;
  currentPlan?: string;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  onSelectPlan,
  currentPlan = 'free'
}) => {
  const [selectedDuration, setSelectedDuration] = useState<'monthly' | 'yearly'>('monthly');
  const { isProcessing, error, processPayment, clearError } = usePayment();

  const handlePlanSelect = async (plan: SubscriptionPlan) => {
    clearError();
    
    if (plan.price === 0) {
      // Free plan - no payment required
      onSelectPlan(plan);
      return;
    }

    // Paid plan - process payment first
    const paymentResult = await processPayment(plan);
    
    if (paymentResult.success) {
      // Payment successful, now subscribe with payment ID
      onSelectPlan(plan, paymentResult.paymentId);
    }
    // Error handling is done by the usePayment hook
  };

  if (!isOpen) return null;

  const filteredPlans = SUBSCRIPTION_PLANS.filter(plan => 
    plan.duration === selectedDuration || plan.id === 'free'
  );

  const getPlanIcon = (planId: string) => {
    if (planId.includes('pro')) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (planId.includes('enterprise')) return <Users className="w-6 h-6 text-purple-500" />;
    if (planId.includes('basic')) return <Zap className="w-6 h-6 text-purple-500" />;
    return <Check className="w-6 h-6 text-green-500" />;
  };

  const formatPrice = (price: number, duration: string) => {
    if (price === 0) return 'Free';
    return `₹${price}/${duration === 'yearly' ? 'year' : 'month'}`;
  };

  const getMonthlyPrice = (plan: SubscriptionPlan) => {
    if (plan.duration === 'yearly') {
      return `₹${(plan.price / 12).toFixed(2)}/month`;
    }
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Choose Your Plan</h2>
              <p className="text-gray-600 mt-1">Upgrade to unlock premium features</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
          
          {/* Duration Toggle */}
          <div className="flex items-center justify-center mt-6">
            <div className="bg-gray-100 rounded-lg p-1 flex">
              <button
                onClick={() => setSelectedDuration('monthly')}
                className={`px-6 py-2 rounded-md transition-all ${
                  selectedDuration === 'monthly'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setSelectedDuration('yearly')}
                className={`px-6 py-2 rounded-md transition-all relative ${
                  selectedDuration === 'yearly'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Yearly
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  Save 17%
                </span>
              </button>
            </div>
          </div>
          
          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <X className="w-5 h-5 text-red-500" />
                <span className="text-red-700 text-sm">{error}</span>
                <button 
                  onClick={clearError}
                  className="ml-auto text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Plans Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-xl border-2 p-6 transition-all hover:shadow-lg ${
                  plan.isPopular
                    ? 'border-purple-500 bg-purple-50'
                    : currentPlan === plan.id
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Popular Badge */}
                {plan.isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Current Plan Badge */}
                {currentPlan === plan.id && (
                  <div className="absolute -top-3 right-4">
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Current Plan
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center mb-3">
                    {getPlanIcon(plan.id)}
                    <h3 className="text-xl font-semibold text-gray-900 ml-2">{plan.name}</h3>
                  </div>
                  
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-gray-900">
                      {formatPrice(plan.price, plan.duration)}
                    </span>
                    {getMonthlyPrice(plan) && (
                      <span className="block text-sm text-gray-500 mt-1">
                        {getMonthlyPrice(plan)} billed annually
                      </span>
                    )}
                  </div>
                  
                  {plan.discount && (
                    <div className="text-green-600 text-sm font-medium">
                      Save {plan.discount}% with yearly billing
                    </div>
                  )}
                </div>

                {/* Features List */}
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Action Button */}
                <button
                  onClick={() => handlePlanSelect(plan)}
                  disabled={currentPlan === plan.id || isProcessing}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                    currentPlan === plan.id
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : plan.isPopular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : plan.price === 0
                      ? 'bg-gray-900 text-white hover:bg-gray-800'
                      : 'bg-white border-2 border-gray-300 text-gray-900 hover:border-gray-400'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent animate-spin rounded-full"></div>
                      Processing...
                    </>
                  ) : currentPlan === plan.id ? (
                    'Current Plan'
                  ) : plan.price === 0 ? (
                    'Continue with Free'
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      Upgrade Now - ₹{plan.price}
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <span>⚠️</span>
              <span className="text-sm font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50 rounded-b-2xl">
          <div className="text-center text-sm text-gray-600">
            <p>✨ All plans include 24/7 support and regular updates</p>
            <p className="mt-2">💳 Secure payment processing • 🔒 Cancel anytime • 📧 No spam guarantee</p>
          </div>
        </div>
      </div>
    </div>
  );
};
