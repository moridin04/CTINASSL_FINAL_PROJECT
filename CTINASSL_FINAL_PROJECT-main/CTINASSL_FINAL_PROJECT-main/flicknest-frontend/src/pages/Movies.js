// src/pages/Movies.js

import React, { useEffect, useState } from "react";
import publicApi from "../utils/publicApi";
import MovieCard from "../components/MovieCard";
import "../styles/MovieGrid.css";

const Movies = ({ searchResults }) => {
  const [trending, setTrending] = useState([]);
  const [latest, setLatest] = useState([]);
  const [comingSoon, setComingSoon] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMovies() {
      setLoading(true);
      try {
        const [trendingRes, latestRes, comingSoonRes] = await Promise.all([
          publicApi.get("/movies/trending"),
          publicApi.get("/movies/latest"),
          publicApi.get("/movies/coming-soon"),
        ]);
        setTrending(trendingRes.data);
        setLatest(latestRes.data);
        setComingSoon(comingSoonRes.data);
      } catch (err) {}
      setLoading(false);
    }
    fetchMovies();
  }, []);

  return (
    <div className="movie-section">
      <div className="movie-section-title">
        {searchResults ? "Search Results" : "Trending"}
      </div>
      {loading ? (
        <div style={{ color: "#fff" }}>Loading...</div>
      ) : (
        <div className={`movie-grid${searchResults && searchResults.length === 1 ? ' movie-grid-single' : ''}`}>
          {(searchResults ?? trending).map((movie) => (
            <MovieCard
              movie={movie}
              key={movie._id}
              wide={searchResults && searchResults.length === 1}
            />
          ))}
        </div>
      )}

      {!searchResults && (
        <>
          <div className="movie-section-title" style={{ marginTop: "3rem" }}>
            Latest Movies
          </div>
          <div className="movie-grid">
            {latest.map((movie) => (
              <MovieCard movie={movie} key={movie._id} />
            ))}
          </div>
          <div className="movie-section-title" style={{ marginTop: "3rem" }}>
            Coming Soon
          </div>
          <div className={`movie-grid${comingSoon.length === 1 ? ' movie-grid-single' : ''}`}>
            {comingSoon.length === 0 ? (
              <div style={{ color: "#fff", padding: "2rem" }}>No coming soon movies!</div>
            ) : (
              comingSoon.map((movie) => (
                <MovieCard movie={movie} key={movie._id} wide={comingSoon.length === 1} />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Movies;
