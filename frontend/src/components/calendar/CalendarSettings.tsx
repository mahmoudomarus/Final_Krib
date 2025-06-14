import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { 
  Eye, 
  EyeOff, 
  DollarSign, 
  Calendar,
  Clock,
  Settings,
  Info
} from 'lucide-react';

interface CalendarSettingsProps {
  settings: {
    showPricing: boolean;
    defaultPrice: number;
    minimumStay: number;
    maximumStay: number;
    advanceBooking: number;
    checkInTime: string;
    checkOutTime: string;
    instantBooking: boolean;
  };
  onSave: (settings: any) => void;
  onCancel: () => void;
}

export const CalendarSettings: React.FC<CalendarSettingsProps> = ({
  settings,
  onSave,
  onCancel
}) => {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSave = () => {
    onSave(localSettings);
  };

  const updateSetting = (key: string, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="space-y-6">
      {/* Display Settings */}
      <Card className="p-4">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
          <Eye className="w-4 h-4 mr-2" />
          Display Settings
        </h4>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-700">Show Pricing</label>
              <p className="text-sm text-gray-500">Display prices on calendar days</p>
            </div>
            <button
              onClick={() => updateSetting('showPricing', !localSettings.showPricing)}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                ${localSettings.showPricing ? 'bg-primary-600' : 'bg-gray-200'}
              `}
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${localSettings.showPricing ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>
        </div>
      </Card>

      {/* Pricing Settings */}
      <Card className="p-4">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
          <DollarSign className="w-4 h-4 mr-2" />
          Pricing Settings
        </h4>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Price per Night (AED)
            </label>
            <Input
              type="number"
              value={localSettings.defaultPrice}
              onChange={(e) => updateSetting('defaultPrice', Number(e.target.value))}
              placeholder="Enter default price"
            />
          </div>
        </div>
      </Card>

      {/* Booking Rules */}
      <Card className="p-4">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
          <Calendar className="w-4 h-4 mr-2" />
          Booking Rules
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Stay (nights)
            </label>
            <Input
              type="number"
              min="1"
              value={localSettings.minimumStay}
              onChange={(e) => updateSetting('minimumStay', Number(e.target.value))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Stay (nights)
            </label>
            <Input
              type="number"
              min="1"
              value={localSettings.maximumStay}
              onChange={(e) => updateSetting('maximumStay', Number(e.target.value))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Advance Booking (days)
            </label>
            <Input
              type="number"
              min="0"
              value={localSettings.advanceBooking}
              onChange={(e) => updateSetting('advanceBooking', Number(e.target.value))}
            />
            <p className="text-xs text-gray-500 mt-1">
              How far in advance guests can book
            </p>
          </div>
        </div>
      </Card>

      {/* Check-in/out Times */}
      <Card className="p-4">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
          <Clock className="w-4 h-4 mr-2" />
          Check-in/out Times
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Check-in Time
            </label>
            <Input
              type="time"
              value={localSettings.checkInTime}
              onChange={(e) => updateSetting('checkInTime', e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Check-out Time
            </label>
            <Input
              type="time"
              value={localSettings.checkOutTime}
              onChange={(e) => updateSetting('checkOutTime', e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Instant Booking */}
      <Card className="p-4">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
          <Info className="w-4 h-4 mr-2" />
          Booking Options
        </h4>
        
        <div className="flex items-center justify-between">
          <div>
            <label className="font-medium text-gray-700">Instant Booking</label>
            <p className="text-sm text-gray-500">Allow guests to book instantly without approval</p>
          </div>
          <button
            onClick={() => updateSetting('instantBooking', !localSettings.instantBooking)}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors
              ${localSettings.instantBooking ? 'bg-primary-600' : 'bg-gray-200'}
            `}
          >
            <span
              className={`
                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                ${localSettings.instantBooking ? 'translate-x-6' : 'translate-x-1'}
              `}
            />
          </button>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          Save Settings
        </Button>
      </div>
    </div>
  );
}; 