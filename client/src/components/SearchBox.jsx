import React, { useState } from 'react';

const SearchBox = ({ onSelectLocation }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Use Nominatim OpenStreetMap API for geocoding
  const handleInputChange = async (e) => {
    const value = e.target.value;
    setQuery(value);
    if (value.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}`
    );
    const data = await res.json();
    setResults(data);
    setShowDropdown(true);
  };

  const handleSelect = (location) => {
    setQuery(location.display_name);
    setShowDropdown(false);
    setResults([]);
    onSelectLocation(location);
  };

  return (
    <div className="relative w-64 lg:w-80 font-sans">
      <div className="relative group">
        <input
          type="text"
          className="w-full pl-10 pr-4 py-2 rounded-full bg-gray-100 text-slate-700 placeholder:text-gray-400 outline-none border border-transparent focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-100 transition-all shadow-inner"
          placeholder="Search location..."
          value={query}
          onChange={handleInputChange}
          onFocus={() => setShowDropdown(results.length > 0)}
        />
        {/* Search Icon */}
        <div className="absolute left-3 top-2.5 text-gray-400 group-hover:text-cyan-600 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
      </div>

      {showDropdown && results.length > 0 && (
        <ul className="absolute left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto overflow-x-hidden">
          {results.map((loc) => (
            <li
              key={loc.place_id}
              className="px-4 py-3 cursor-pointer hover:bg-gray-50 text-sm text-slate-700 border-b border-gray-50 last:border-none hover:pl-5 transition-all"
              onClick={() => handleSelect(loc)}
            >
              <div className="truncate font-medium">{loc.display_name.split(',')[0]}</div>
              <div className="text-xs text-gray-400 truncate">{loc.display_name}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchBox;
