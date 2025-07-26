import { BASEURL } from '../utility/config';
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Play, Pause, CheckCircle, Send, X, RefreshCw, ChevronLeft, ChevronRight, Mail, AlertCircle } from 'lucide-react';

const CampaignScheduler = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Calendar scheduling state
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  console.log(selectedDate, selectedTime);
  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch(`${BASEURL}/get_campaigns`);
      const data = await response.json();
      if (data.success) {
        setCampaigns(data.data);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };

  

  const handleExecuteNow = async (campaignId) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update campaign status to completed
      setCampaigns(prevCampaigns => 
        prevCampaigns.map(campaign => 
          campaign.id === campaignId 
            ? { ...campaign, status: 'completed', is_scheduled: false }
            : campaign
        )
      );
      
      alert('Campaign executed successfully!');
    } catch (error) {
      alert(`Error executing campaign: ${error.message}`);
    }
    setLoading(false);
  };

const handleSchedule = async (campaignId) => {
    if (!selectedDate || !selectedTime) {
      alert('Please select both date and time');
      return;
    }

    setLoading(true);
    
    try {
      // Debug: Log the selected values
      console.log('Selected Date:', selectedDate);
      console.log('Selected Time:', selectedTime);
      
      // Create the datetime string
      const dateTimeString = `${selectedDate}T${selectedTime}:00`;
      console.log('DateTime String:', dateTimeString);
      
      // Create Date object
      const dateTime = new Date(dateTimeString);
      console.log('DateTime Object:', dateTime);
      console.log('DateTime ISO:', dateTime.toISOString());
      
      // Current time for comparison
      const now = new Date();
      console.log('Current Time:', now);
      console.log('Current Time ISO:', now.toISOString());
      
      // Check if future
      const isFuture = dateTime > now;
      console.log('Is Future?', isFuture);
      console.log('Time difference (minutes):', (dateTime - now) / (1000 * 60));
      
      if (!isFuture) {
        alert('Please select a future date and time');
        setLoading(false);
        return;
      }
      
      // Try sending as ISO string first
      const payload = { dateTime: dateTime.toISOString() };
      console.log('Sending payload:', payload);
      
      const response = await fetch(`${BASEURL}/schedule/${campaignId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      console.log('Server response:', data);
      
      if (data.success) {
        alert('Campaign scheduled successfully!');
        fetchCampaigns();
        setShowCalendarModal(false);
        setSelectedDate('');
        setSelectedTime('');
        setSelectedCampaign(null);
      } else {
        alert(`Error: ${data.message}`);
      }
      
    } catch (error) {
      console.error('Error scheduling campaign:', error);
      alert('Failed to schedule campaign');
    }
    
    setLoading(false);
};



    const handleUnschedule = async (campaignId) => {
    setLoading(true);
    try {
      const response = await fetch(`${BASEURL}/campaigns/${campaignId}/schedule`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      if (data.success) {
        alert('Campaign unscheduled successfully!');
        fetchCampaigns();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      alert(`Error unscheduling campaign: ${error.message}`);
    }
    setLoading(false);
  };

 

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'failed': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled': return <Clock className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <AlertCircle className="w-4 h-4" />;
      default: return <Mail className="w-4 h-4" />;
    }
  };

  // Calendar helper functions
  const today = new Date().toISOString().split('T')[0];
  // const today = new Date().toLocaleDateString('en-CA'); // 'YYYY-MM-DD' format

 

 const generateCalendarDays = () => {
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  
  // Get the first day of the month
  const firstDay = new Date(year, month, 1);
  const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Calculate how many days to go back to get to the start of the calendar
  const daysToGoBack = startingDayOfWeek;
  
  const days = [];
  
  // Generate 42 days (6 weeks × 7 days)
  for (let i = 0; i < 42; i++) {
    // Calculate the actual date for this position
    const dayNumber = i - daysToGoBack + 1;
    const date = new Date(year, month, dayNumber);
    days.push(date);
  }
  
  return days;
};
  
  const formatDate = (date) => {
    // return date.toISOString().split('T')[0];
    return date.toLocaleDateString('en-CA')
  };
  
  const isDateSelectable = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  };
  
  const isCurrentMonth = (date) => {
    return date.getMonth() === calendarMonth.getMonth();
  };
  
  const navigateMonth = (direction) => {
    const newMonth = new Date(calendarMonth);
    newMonth.setMonth(calendarMonth.getMonth() + direction);
    setCalendarMonth(newMonth);
  };

 const renderCalendar = () => {
  const calendarDays = generateCalendarDays();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  return (
    <div className="w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigateMonth(-1)}
          className="p-1 hover:bg-gray-100 rounded-md transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <h3 className="text-base font-semibold text-gray-900">
          {monthNames[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
        </h3>
        <button
          onClick={() => navigateMonth(1)}
          className="p-1 hover:bg-gray-100 rounded-md transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
      
      {/* Calendar Grid */}
      <div className="border border-gray-200 rounded-md overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 bg-gray-50">
          {dayNames.map(day => (
            <div key={day} className="p-2 text-center text-xs font-medium text-gray-600">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Days */}
        <div className="grid grid-cols-7 bg-white">
          {calendarDays.map((date, index) => {
            const dateStr = formatDate(date);
            console.log(dateStr)
            const isSelected = selectedDate === dateStr;
            const isSelectable = isDateSelectable(date) && isCurrentMonth(date);
            const isToday = formatDate(date) === today;
            
            return (
              <button
                key={index}
                onClick={() => isSelectable && setSelectedDate(dateStr)}
                disabled={!isSelectable}
                className={`
                  p-2 text-xs h-8 flex items-center justify-center transition-all duration-200
                  border-r border-b border-gray-100 last:border-r-0
                  ${isSelected 
                    ? 'bg-blue-500 text-white font-medium' 
                    : isSelectable 
                      ? 'hover:bg-blue-50 text-gray-900 hover:text-blue-600' 
                      : 'text-gray-400 cursor-not-allowed'
                  }
                  ${isToday && !isSelected ? 'bg-blue-50 font-semibold text-blue-600 ring-1 ring-blue-200' : ''}
                  ${!isCurrentMonth(date) ? 'opacity-30' : ''}
                `}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};


const renderTimeSlots = () => {
  const timeSlots = [];
  
  // Generate time slots every 15 minutes from 9:00 AM to 9:00 PM
  for (let hour = 9; hour <= 21; hour++) {
    const minutes = ['00', '15', '30', '45'];
    
    for (const minute of minutes) {
      // Don't add slots beyond 9:00 PM
      if (hour === 21 && minute !== '00') {
        break;
      }
      
      timeSlots.push(`${hour.toString().padStart(2, '0')}:${minute}`);
    }
  }
     
  return (
    <div className="w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 space-y-3">
      <h4 className="text-sm font-semibold text-gray-900 mb-3">Select Time</h4>
      <div className="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto">
        {timeSlots.map((time) => (
          <button
            key={time}
            onClick={() => setSelectedTime(time)}
            className={`
              p-2 text-xs border rounded-md transition-all duration-200 font-medium
              ${selectedTime === time
                ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300'
              }
            `}
          >
            {new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
               hour: '2-digit',
               minute: '2-digit',
              hour12: true
             })}
          </button>
        ))}
      </div>
    </div>
  );
};

const formatScheduledTime = (datetime) => {
  const date = new Date(datetime);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // 0-based
  const day = String(date.getDate()).padStart(2, '0');

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12 || 12; // convert to 12-hour format
  const formattedHours = String(hours).padStart(2, '0');

  return `${year}-${month}-${day} ${formattedHours}:${minutes} ${ampm}`;
};




  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
       <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
           <div className="flex items-center gap-4">
             <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
               <Calendar className="w-8 h-8 text-white" />
             </div>
             <div>
               <h1 className="text-3xl font-bold text-gray-800">Campaign Scheduler</h1>
               <p className="text-gray-600 mt-1">Schedule and manage your email campaigns</p>
             </div>
           </div>
         </div>


        {/* Campaign Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campaign
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scheduled Time
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {campaign.campaign_name}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {campaign.subject_line}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(campaign.status)}`}>
                        {getStatusIcon(campaign.status)}
                        <span className="capitalize">{campaign.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {campaign.is_scheduled && campaign.scheduled_at? (
                        <div className="space-y-1">
                          <div className="font-medium text-gray-900">
                            {formatScheduledTime(campaign.scheduled_at)}
                          
                          </div>
                
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Not scheduled</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {campaign.is_scheduled ? (
                          <>
                            <button
                              onClick={() => handleUnschedule(campaign.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-50 text-red-700 border border-red-200 rounded-md hover:bg-red-100 transition-colors"
                              disabled={loading}
                            >
                              <Pause className="w-4 h-4" />
                              Unschedule
                            </button>
                            <button
                              onClick={() => handleExecuteNow(campaign.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-50 text-green-700 border border-green-200 rounded-md hover:bg-green-100 transition-colors"
                              disabled={loading}
                            >
                              <Play className="w-4 h-4" />
                              Execute Now
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedCampaign(campaign);
                              setShowCalendarModal(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                          >
                            <Calendar className="w-4 h-4" />
                            Schedule
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Calendar Modal */}
      {showCalendarModal && selectedCampaign && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            {selectedCampaign.is_scheduled ? 'Reschedule Campaign' : 'Schedule Campaign'}
          </h2>
          <p className="text-xs text-gray-600 mt-1 truncate">{selectedCampaign.campaign_name}</p>
        </div>
        <button
          onClick={() => {
            setShowCalendarModal(false);
            setSelectedDate('');
            setSelectedTime('');
            setSelectedCampaign(null);
          }}
          className="p-1 hover:bg-gray-100 rounded-md transition-colors"
        >
          <X size={18} />
        </button>
      </div>
      
      <div className="p-4 space-y-4">
        {/* Current Schedule (if exists) */}
        {selectedCampaign.is_scheduled && selectedCampaign.scheduled_datetime && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <h4 className="text-sm font-medium text-yellow-900 mb-1">Currently Scheduled</h4>
            <div className="text-xs text-yellow-800 space-y-1">
              <div>Date: {formatScheduledTime(selectedCampaign.scheduled_datetime).date}</div>
              <div>Time: {formatScheduledTime(selectedCampaign.scheduled_datetime).time}</div>
            </div>
          </div>
        )}
                
                {/* Calendar */}
                {renderCalendar()}
                
                {/* Time Slots */}
                {selectedDate && renderTimeSlots()}
                
                {/* Timezone */}
                <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Timezone
          </label>
          <select 
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
            <option value="America/New_York">America/New_York (EST)</option>
            <option value="Europe/London">Europe/London (GMT)</option>
            <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
            <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
            <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
          </select>
        </div>
                
                {/* Selected Schedule Summary */}
               {selectedDate && selectedTime && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="text-sm font-medium text-blue-900 mb-1">New Schedule</h4>
            <div className="text-xs text-blue-800 space-y-1">
              <div>Date: {new Date(selectedDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</div>
              <div>Time: {new Date(`2000-01-01T${selectedTime}`).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
              })}</div>
              <div>Timezone: {timezone}</div>
            </div>
          </div>
        )}
                
                {/* Actions */}
                <div className="flex justify-end gap-2 pt-3 border-t">
          <button
            onClick={() => {
              setShowCalendarModal(false);
              setSelectedDate('');
              setSelectedTime('');
              setSelectedCampaign(null);
            }}
            className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          {selectedCampaign.is_scheduled && (
            <button
              onClick={() => handleUnschedule(selectedCampaign.id)}
              disabled={loading}
              className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-white bg-red-500 rounded-md hover:bg-red-600 disabled:bg-gray-400 transition-colors"
            >
              {loading ? <RefreshCw className="animate-spin" size={14} /> : <Pause size={14} />}
              {loading ? 'Unscheduling...' : 'Unschedule'}
            </button>
          )}
          <button
            onClick={() => handleSchedule(selectedCampaign.id)}
            disabled={loading || !selectedDate || !selectedTime}
            className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
          >
            {loading ? <RefreshCw className="animate-spin" size={14} /> : <Calendar size={14} />}
            {loading ? 'Scheduling...' : selectedCampaign.is_scheduled ? 'Reschedule' : 'Schedule'}
          </button>
        </div>
      
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignScheduler;


