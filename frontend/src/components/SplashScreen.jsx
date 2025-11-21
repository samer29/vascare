import React from "react";
import img from "../assets/VascCarelogo.png";
import clinicInfo from "../config/clinicinfo.json";
const SplashScreen = ({ onEnter }) => {
  return (
    <div className="flex items-center justify-center h-screen w-screen bg-gradient-to-br from-green-200 to-green-100 text-gray-800">
      <div className="flex flex-col items-center justify-center text-center p-12 bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200 transition-transform duration-300 hover:scale-[1.02] w-[90%] max-w-md">
        {/* Custom Logo with Heartbeat Pulse */}
        <div className="flex justify-center items-center mb-8 animate-heartbeat">
          <img
            src={img}
            alt="VascCare Logo"
            className="h-24 w-24 object-contain drop-shadow-xl"
          />
        </div>

        {/* Title */}
        <h1 className="text-5xl font-extrabold text-gray-800 tracking-tight">
          VascCare
        </h1>
        <p className="text-lg mt-3 text-gray-600">
          {clinicInfo.name} – {clinicInfo.address}
        </p>

        {/* Enter Button */}
        <button
          onClick={onEnter}
          className="mt-12 px-12 py-4 text-lg font-semibold text-white rounded-full bg-gradient-to-r from-green-600 to-green-400 shadow-lg hover:shadow-2xl hover:scale-105 transform transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-green-300"
        >
          Entrer
        </button>
      </div>
    </div>
  );
};

export default SplashScreen;
