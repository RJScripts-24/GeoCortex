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
    <div className="relative w-80">
      <input
        type="text"
        className="w-full px-4 py-2 rounded bg-white/10 text-white placeholder:text-gray-400 outline-none border border-white/20 focus:border-cyan-400 transition"
        placeholder="Search location..."
        value={query}
        onChange={handleInputChange}
        onFocus={() => setShowDropdown(results.length > 0)}
      />
      {showDropdown && results.length > 0 && (
        <ul className="absolute left-0 right-0 mt-1 bg-black/90 border border-white/10 rounded shadow-lg z-50 max-h-60 overflow-y-auto">
          {results.map((loc) => (
            <li
              key={loc.place_id}
              className="px-4 py-2 cursor-pointer hover:bg-cyan-900/40 text-sm text-white"
              onClick={() => handleSelect(loc)}
            >
              {loc.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchBox;
