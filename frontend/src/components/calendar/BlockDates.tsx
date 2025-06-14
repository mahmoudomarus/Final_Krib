import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  X,
  AlertCircle
} from 'lucide-react';

interface BlockDatesProps {
  propertyId: string;
  onBlockDates: (dates: string[], reason: string) => Promise<void>;
  onCancel: () => void;
  existingBlockedDates?: string[];
}

export const BlockDates: React.FC<BlockDatesProps> = ({
  propertyId,
  onBlockDates,
  onCancel,
  existingBlockedDates = []
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [blockType, setBlockType] = useState<'single' | 'range'>('single');
  const [rangeStart, setRangeStart] = useState<string>('');
  const [rangeEnd, setRangeEnd] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Generate calendar data
  const generateCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const today = new Date();
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dateString = date.toISOString().split('T')[0];
      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.toDateString() === today.toDateString();
      const isPast = date < today;
      const isSelected = selectedDates.includes(dateString);
      const isBlocked = existingBlockedDates.includes(dateString);
      
      days.push({
        date,
        dateString,
        isCurrentMonth,
        isToday,
        isPast,
        isSelected,
        isBlocked,
        day: date.getDate()
      });
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const getMonthYear = () => {
    return currentDate.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const handleDateClick = (dateString: string, isPast: boolean, isBlocked: boolean) => {
    if (isPast || isBlocked) return;

    if (blockType === 'single') {
      setSelectedDates(prev => 
        prev.includes(dateString) 
          ? prev.filter(d => d !== dateString)
          : [...prev, dateString]
      );
    } else {
      // Range selection logic
      if (!rangeStart) {
        setRangeStart(dateString);
        setSelectedDates([dateString]);
      } else if (!rangeEnd) {
        const start = new Date(rangeStart);
        const end = new Date(dateString);
        
        if (end < start) {
          setRangeStart(dateString);
          setRangeEnd('');
          setSelectedDates([dateString]);
        } else {
          setRangeEnd(dateString);
          // Generate all dates in range
          const dates = [];
          const current = new Date(start);
          while (current <= end) {
            dates.push(current.toISOString().split('T')[0]);
            current.setDate(current.getDate() + 1);
          }
          setSelectedDates(dates);
        }
      } else {
        // Reset and start new range
        setRangeStart(dateString);
        setRangeEnd('');
        setSelectedDates([dateString]);
      }
    }
  };

  const handleSubmit = async () => {
    if (selectedDates.length === 0) {
      alert('Please select at least one date to block');
      return;
    }

    if (!reason.trim()) {
      alert('Please provide a reason for blocking these dates');
      return;
    }

    setLoading(true);
    try {
      await onBlockDates(selectedDates, reason.trim());
    } catch (error) {
      console.error('Error blocking dates:', error);
      alert('Error blocking dates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getDayClass = (day: any) => {
    let baseClass = 'p-2 text-center cursor-pointer transition-colors border border-gray-200 min-h-[40px] flex items-center justify-center';
    
    if (!day.isCurrentMonth) {
      baseClass += ' text-gray-300';
    } else if (day.isPast) {
      baseClass += ' text-gray-400 bg-gray-50 cursor-not-allowed';
    } else if (day.isBlocked) {
      baseClass += ' text-red-500 bg-red-50 cursor-not-allowed';
    } else if (day.isSelected) {
      baseClass += ' bg-primary-600 text-white';
    } else if (day.isToday) {
      baseClass += ' bg-blue-100 text-blue-800';
    } else {
      baseClass += ' text-gray-700 hover:bg-gray-100';
    }
    
    return baseClass;
  };

  const calendarData = generateCalendar();

  return (
    <div className="space-y-6">
      {/* Block Type Selection */}
      <div className="flex items-center space-x-4">
        <label className="font-medium text-gray-700">Selection Mode:</label>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => {
              setBlockType('single');
              setSelectedDates([]);
              setRangeStart('');
              setRangeEnd('');
            }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              blockType === 'single' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Individual Dates
          </button>
          <button
            onClick={() => {
              setBlockType('range');
              setSelectedDates([]);
              setRangeStart('');
              setRangeEnd('');
            }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              blockType === 'range' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Date Range
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="flex items-start space-x-2 p-4 bg-blue-50 rounded-lg">
        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-700">
          {blockType === 'single' ? (
            <p>Click on individual dates to select/deselect them for blocking.</p>
          ) : (
            <p>Click on a start date, then click on an end date to select a range. Click on a new date to start a new range.</p>
          )}
        </div>
      </div>

      {/* Calendar */}
      <Card className="p-4">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <h3 className="text-lg font-semibold text-gray-900">
            {getMonthYear()}
          </h3>
          
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day Headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="p-2 text-center text-sm font-semibold text-gray-600">
              {day}
            </div>
          ))}

          {/* Calendar Days */}
          {calendarData.map((day, index) => (
            <div
              key={index}
              onClick={() => handleDateClick(day.dateString, day.isPast, day.isBlocked)}
              className={getDayClass(day)}
            >
              {day.day}
            </div>
          ))}
        </div>
      </Card>

      {/* Selected Dates Summary */}
      {selectedDates.length > 0 && (
        <Card className="p-4">
          <h4 className="font-semibold text-gray-900 mb-2">
            Selected Dates ({selectedDates.length})
          </h4>
          <div className="max-h-32 overflow-y-auto">
            <div className="flex flex-wrap gap-2">
              {selectedDates.slice(0, 10).map(dateString => (
                <span 
                  key={dateString}
                  className="inline-flex items-center px-2 py-1 bg-primary-100 text-primary-800 text-xs font-medium rounded-md"
                >
                  {new Date(dateString).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                  <button
                    onClick={() => setSelectedDates(prev => prev.filter(d => d !== dateString))}
                    className="ml-1 text-primary-600 hover:text-primary-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {selectedDates.length > 10 && (
                <span className="text-sm text-gray-500">
                  +{selectedDates.length - 10} more
                </span>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Reason Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Reason for Blocking *
        </label>
        <Input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g., Property maintenance, personal use, etc."
          required
        />
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-primary-600 rounded"></div>
          <span>Selected</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
          <span>Already Blocked</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
          <span>Past/Unavailable</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={selectedDates.length === 0 || !reason.trim() || loading}
          loading={loading}
        >
          Block {selectedDates.length} Date{selectedDates.length !== 1 ? 's' : ''}
        </Button>
      </div>
    </div>
  );
}; 