// src/components/MovieCard.js

import React from 'react';

function getImageUrl(image) {
  if (!image) return '/default-poster.png'; // Fallback to your local default image
  if (image.startsWith('/assets/')) return `http://localhost:4000${image}`; // For local API assets
  return image;
}

function MovieCard({ movie, wide = false }) {
  return (
    <div className={`movie-card${wide ? ' movie-card-wide' : ''}`}>
      <img
        src={getImageUrl(movie.image)}
        alt={movie.title}
        className={`movie-image${wide ? ' movie-image-wide' : ''}`}
        onError={e => { e.target.onerror = null; e.target.src = '/default-poster.png'; }}
      />
      <div className="movie-info">
        <h3>{movie.title}</h3>
        <div className="movie-meta">
          <span>
            {Array.isArray(movie.genre) ? movie.genre.join(', ') : movie.genre || 'Genre N/A'}
          </span>
          {" | "}
          <span>
            {movie.releaseDate
              ? movie.releaseDate.slice(0, 4)
              : movie.year || ''}
          </span>
        </div>
        <div className="movie-rating">⭐ {movie.rating || 'N/A'}</div>
        {movie.description && (
          <div className="movie-description">{movie.description}</div>
        )}
      </div>
    </div>
  );
}

export default MovieCard;
