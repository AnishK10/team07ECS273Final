// src/App.jsx
import React, { useState } from 'react';
import MapView from './components/MapView';
import ControlPanel from './components/ControlPanel';
import ZoneDetails from './components/ZoneDetails';
import TimeSlider from './components/TimeSlider';
import DemandChart from './components/DemandChart';

export default function App() {
  const [selectedZone, setSelectedZone] = useState(null);
  const [predictionData, setPredictionData] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedTime, setSelectedTime] = useState("08:00");

  return (
    <div className="h-screen flex flex-col bg-white">
      <header className="bg-gray-900 text-white py-4 text-center text-2xl font-semibold shadow">
        TAXIMAP
      </header>

      <div className="flex flex-grow">
        <div className="w-2/3 h-full relative flex-shrink-0">
          <MapView
            selectedZone={selectedZone}
            setSelectedZone={setSelectedZone}
            predictionData={predictionData}
            setUserLocation={setUserLocation}
            selectedTime={selectedTime}
          />
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
        <div className="pointer-events-auto">
          <TimeSlider
            selectedTime={selectedTime}
            setSelectedTime={setSelectedTime}
          />
        </div>
      </div>
        </div>

        {/* Control Panel and Details */}
        <div className="w-1/3 h-full p-4 bg-white shadow-xl overflow-y-auto flex flex-col">
          <ControlPanel
            userLocation={userLocation}
            setUserLocation={setUserLocation}
            setPredictionData={setPredictionData}
            selectedTime={selectedTime}
            setSelectedTime={setSelectedTime}
          />

          {selectedZone && predictionData && (
            <div className="space-y-4 mt-4">
              <div className="p-4 border rounded-lg bg-white shadow">
                <h2 className="text-lg font-semibold text-gray-800 mb-2 text-center">Zone Information</h2>
                <ZoneDetails zone={selectedZone} data={predictionData[selectedZone]} />
              </div>

              <DemandChart data={predictionData[selectedZone]} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
