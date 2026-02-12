// src/components/MovieGrid.js

import React from 'react';
import MovieCard from './MovieCard';
import '../styles/MovieGrid.css';

function MovieGrid({ movies, title = "Trending" }) {
  if (!movies) return null;
  const isSingle = movies.length === 1;

  return (
    <section className="movie-section">
      <h2 className="movie-section-title">{title}</h2>
      <div className={`movie-grid${isSingle ? ' movie-grid-single' : ''}`}>
        {movies.map(movie => (
          <MovieCard movie={movie} key={movie.id || movie._id} wide={isSingle} />
        ))}
      </div>
    </section>
  );
}

export default MovieGrid;
