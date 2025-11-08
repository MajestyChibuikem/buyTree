import { useMemo } from 'react';

const OrderStatusWorkflow = ({ currentStatus, statusHistory = [], className = '' }) => {
  // Define the workflow steps
  const workflowSteps = [
    { key: 'pending', label: 'Order Placed', icon: 'receipt' },
    { key: 'processing', label: 'Processing', icon: 'cog' },
    { key: 'ready_for_pickup', label: 'Ready for Pickup', icon: 'box' },
    { key: 'in_transit', label: 'In Transit', icon: 'truck' },
    { key: 'delivered', label: 'Delivered', icon: 'check-circle' },
  ];

  // Calculate step status
  const stepStatuses = useMemo(() => {
    const statusOrder = {
      'pending': 0,
      'processing': 1,
      'ready_for_pickup': 2,
      'in_transit': 3,
      'delivered': 4,
      'cancelled': -1,
    };

    const currentIndex = statusOrder[currentStatus] ?? 0;
    const isCancelled = currentStatus === 'cancelled';

    return workflowSteps.map((step, index) => {
      const stepHistory = statusHistory.find(h => h.new_status === step.key);

      return {
        ...step,
        completed: isCancelled ? false : index <= currentIndex,
        current: !isCancelled && index === currentIndex,
        timestamp: stepHistory?.created_at,
        isCancelled,
      };
    });
  }, [currentStatus, statusHistory]);

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Render icon based on type
  const renderIcon = (iconType, isCompleted, isCurrent, isCancelled) => {
    const iconClass = `w-6 h-6 ${
      isCancelled
        ? 'text-gray-400'
        : isCompleted
        ? 'text-white'
        : isCurrent
        ? 'text-green-600'
        : 'text-gray-400'
    }`;

    const icons = {
      'receipt': (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      'cog': (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      'box': (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      'truck': (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
        </svg>
      ),
      'check-circle': (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    };

    return icons[iconType] || icons['receipt'];
  };

  // If cancelled, show cancellation notice
  if (currentStatus === 'cancelled') {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-red-900">Order Cancelled</h3>
            <p className="mt-1 text-sm text-red-700">
              This order has been cancelled and will not be processed further.
            </p>
            {statusHistory.find(h => h.new_status === 'cancelled')?.created_at && (
              <p className="mt-2 text-xs text-red-600">
                Cancelled on {formatTimestamp(statusHistory.find(h => h.new_status === 'cancelled').created_at)}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white ${className}`}>
      {/* Progress Bar */}
      <div className="relative">
        {/* Background line */}
        <div className="absolute top-5 left-0 w-full h-1 bg-gray-200">
          {/* Active progress line */}
          <div
            className="h-full bg-green-600 transition-all duration-500 ease-out"
            style={{
              width: `${(stepStatuses.filter(s => s.completed).length / stepStatuses.length) * 100}%`,
            }}
          ></div>
        </div>

        {/* Steps */}
        <div className="relative flex justify-between">
          {stepStatuses.map((step, index) => (
            <div key={step.key} className="flex flex-col items-center" style={{ width: `${100 / stepStatuses.length}%` }}>
              {/* Step circle */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  step.completed
                    ? 'bg-green-600 border-green-600'
                    : step.current
                    ? 'bg-white border-green-600 ring-4 ring-green-100'
                    : 'bg-white border-gray-300'
                }`}
              >
                {step.completed ? (
                  renderIcon(step.icon, true, false, false)
                ) : step.current ? (
                  <div className="w-3 h-3 bg-green-600 rounded-full animate-pulse"></div>
                ) : (
                  renderIcon(step.icon, false, false, false)
                )}
              </div>

              {/* Step label */}
              <div className="mt-3 text-center">
                <p
                  className={`text-xs font-medium ${
                    step.completed || step.current ? 'text-gray-900' : 'text-gray-500'
                  }`}
                >
                  {step.label}
                </p>
                {step.timestamp && (
                  <p className="text-xs text-gray-500 mt-1">{formatTimestamp(step.timestamp)}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current status message */}
      <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-green-900">
              {currentStatus === 'pending' && 'Order received and awaiting processing'}
              {currentStatus === 'processing' && 'Your order is being prepared'}
              {currentStatus === 'ready_for_pickup' && 'Order is ready for pickup or shipping'}
              {currentStatus === 'in_transit' && 'Order is on its way to you'}
              {currentStatus === 'delivered' && 'Order has been delivered successfully'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderStatusWorkflow;
