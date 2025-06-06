import React, { useState } from 'react';

export default function ControlPanel({
  userLocation,
  setUserLocation,
  setPredictionData,
  selectedTime,
  setSelectedTime
}) {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const formatTimeToDatetime = (input) => {
    const today = new Date();
    const pad = (n) => n.toString().padStart(2, '0');

    let hours, minutes;

    if (/am|pm/i.test(input)) {
      const [time, meridian] = input.trim().split(' ');
      if (!time || !meridian) throw new Error('Invalid time format');
      const [h, m] = time.split(':');
      hours = parseInt(h, 10);
      minutes = parseInt(m, 10);

      if (meridian.toLowerCase() === 'pm' && hours !== 12) hours += 12;
      if (meridian.toLowerCase() === 'am' && hours === 12) hours = 0;
    } else {

      const [h, m] = input.trim().split(':');
      hours = parseInt(h, 10);
      minutes = parseInt(m, 10);
    }

    if (isNaN(hours) || isNaN(minutes)) throw new Error('Invalid numeric values');

    return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())} ${pad(hours)}:${pad(minutes)}:00`;
  };

  const transformPredictionResponse = (response) => {
    const data = {};
    for (const zone of response.nearest_zones) {
      const zoneId = zone.zone_id;
      const predictions = zone.predictions || {};

      const timeseries = Object.entries(predictions).map(([key, val]) => ({
        time: key,
        demand: Math.round(val.predicted_demand),
        datetime: val.datetime 
      }));

      data[zoneId] = {
        zoneName: zone.zone_name,
        borough: zone.borough,
        demand: predictions["+0min"]?.predicted_demand ?? 0,
        timeseries
      };
    }
    return data;
  };

  const handlePredict = async () => {
    if (!query || !selectedTime) {
      alert('Please enter both a time and a location.');
      return;
    }

    let datetimeStr;
    try {
      datetimeStr = formatTimeToDatetime(selectedTime);
    } catch (err) {
      alert('Invalid time format. Use HH:MM or HH:MM AM/PM.');
      return;
    }

    try {
      setIsLoading(true);

      // Step 1: Geocode
      const geocodeRes = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
        {
          headers: { 'User-Agent': 'taximap-frontend' }
        }
      );

      const geocodeData = await geocodeRes.json();
      if (!geocodeData.length) throw new Error('No location found.');

      const lat = parseFloat(geocodeData[0].lat);
      const lon = parseFloat(geocodeData[0].lon);
      setUserLocation({ latitude: lat, longitude: lon });

      const predictRes = await fetch('http://localhost:8000/predict_by_coordinates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: lat,
          longitude: lon,
          datetime_str: datetimeStr
        })
      });

      if (!predictRes.ok) throw new Error('Prediction API failed.');

      const rawResponse = await predictRes.json();
      const transformed = transformPredictionResponse(rawResponse);
      setPredictionData(transformed);
    } catch (error) {
      console.error(error);
      alert(error.message || 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="control-panel space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Desired Pickup Time</label>
        <input
          type="text"
          className="w-full px-3 py-2 border rounded shadow-sm text-center"
          placeholder="08:00 or 08:00 AM"
          value={selectedTime}
          onChange={(e) => setSelectedTime(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Search Address</label>
        <div className="flex">
          <input
            type="text"
            className="flex-grow px-3 py-2 border rounded-l shadow-sm"
            placeholder="Enter an address"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            onClick={handlePredict}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-r hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="animate-spin h-5 w-5 border-b-2 border-white mx-auto"></div>
            ) : 'Predict'}
          </button>
        </div>
      </div>
    </div>
  );
}
