
import React from 'react';

export default function TimeSlider({ selectedTime, setSelectedTime }) {
  return (
    <div className="bg-white px-4 py-3 rounded-lg shadow-md w-80 mx-auto border">
  <label className="block text-xs font-medium mb-1 text-gray-700">Adjust Time</label>
  <input
    type="range"
    min="0"
    max="23"
    step="1"
    value={parseInt(selectedTime.split(':')[0])}
    onChange={e => setSelectedTime(`${e.target.value.padStart(2, '0')}:00`)}
    className="w-full accent-blue-500"
  />
  <div className="text-center text-xs mt-1 text-gray-800">{selectedTime}</div>
</div>

  );
}
