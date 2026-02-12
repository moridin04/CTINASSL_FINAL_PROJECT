// src/components/SearchBar.js

import React, { useState } from "react";
import publicApi from "../utils/publicApi";
import { useNavigate, useLocation } from "react-router-dom";
import { FiSearch } from "react-icons/fi";
import "../styles/SearchBar.css";

function SearchBar({ onResults }) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // Reset search when input is cleared
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    if (!value.trim() && onResults) {
      onResults(null); // Reset results when cleared
      if (location.pathname !== "/movies") navigate("/movies");
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      const res = await publicApi.get(`/movies/search?q=${encodeURIComponent(query)}`);
      if (onResults) onResults(res.data);
      if (location.pathname !== "/movies") navigate("/movies");
    } catch (err) {
      if (onResults) onResults([]);
      if (location.pathname !== "/movies") navigate("/movies");
    }
  };

  return (
    <form onSubmit={handleSearch} className="search-bar-container">
      <input
        type="text"
        className="search-input"
        value={query}
        onChange={handleInputChange}
        placeholder="Search movies..."
      />
      <button type="submit" className="search-btn">
        <FiSearch />
      </button>
    </form>
  );
}

export default SearchBar;
