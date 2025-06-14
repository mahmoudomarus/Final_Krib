import React from 'react';
import { Calendar, Home } from 'lucide-react';

export type RentalType = 'SHORT_TERM' | 'LONG_TERM';

interface RentalTypeSelectorProps {
  selectedType?: RentalType;
  onSelect: (type: RentalType) => void;
  error?: string;
}

const RentalTypeSelector: React.FC<RentalTypeSelectorProps> = ({
  selectedType,
  onSelect,
  error
}) => {
  const rentalTypes = [
    {
      type: 'SHORT_TERM' as RentalType,
      title: 'Short-term Rental',
      subtitle: 'Daily/Weekly Stays',
      description: 'Perfect for tourists, business travelers, and short visits',
      icon: Calendar,
    },
    {
      type: 'LONG_TERM' as RentalType,
      title: 'Long-term Rental', 
      subtitle: 'Monthly/Yearly Contracts',
      description: 'Ideal for residents, expats, and families seeking stable housing',
      icon: Home,
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">
          What type of rental is this property?
        </h2>
        <p className="text-neutral-600">
          Choose how you want to rent out your property.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        {rentalTypes.map((rental) => {
          const Icon = rental.icon;
          const isSelected = selectedType === rental.type;

          return (
            <div
              key={rental.type}
              onClick={() => onSelect(rental.type)}
              className={`
                relative cursor-pointer rounded-xl border-2 p-6 transition-all duration-200 hover:shadow-lg
                ${isSelected 
                  ? 'border-primary-500 bg-primary-50 ring-4 ring-primary-200 shadow-lg' 
                  : 'border-neutral-200 hover:border-neutral-300 hover:shadow-md'
                }
              `}
            >
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}

              {/* Header */}
              <div className="flex items-start space-x-4 mb-4">
                <div className={`p-3 rounded-lg ${isSelected ? 'bg-primary-100' : 'bg-neutral-100'}`}>
                  <Icon className={`w-6 h-6 ${isSelected ? 'text-primary-600' : 'text-neutral-600'}`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-neutral-900">
                    {rental.title}
                  </h3>
                  <p className="text-sm text-neutral-600">
                    {rental.subtitle}
                  </p>
                </div>
              </div>

              {/* Description */}
              <p className="text-neutral-700 text-sm leading-relaxed">
                {rental.description}
              </p>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="text-center">
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};

export default RentalTypeSelector; 