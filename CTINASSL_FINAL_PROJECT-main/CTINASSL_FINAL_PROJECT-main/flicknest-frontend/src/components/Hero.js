// src/components/Hero.js

import React, { useEffect, useState } from 'react';
import publicApi from '../utils/publicApi';
import watchingImg from '../assets/watching.avif';
import '../styles/Hero.css';
import '../styles/MovieGrid.css';
import MovieCard from './MovieCard';

function Hero() {
  const [comingSoon, setComingSoon] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchComingSoon() {
      setLoading(true);
      try {
        const res = await publicApi.get('/movies/coming-soon');
        setComingSoon(res.data);
      } catch (err) {
        setComingSoon([]);
      }
      setLoading(false);
    }
    fetchComingSoon();
  }, []);

  return (
    <div>
      <section className="hero" style={{ position: 'relative' }}>
        <img
          src={watchingImg}
          alt="Watching movies"
          className="hero-bg"
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            top: 0,
            left: 0,
            zIndex: 1,
            opacity: 0.4,
          }}
        />
        <div className="hero-overlay" style={{ position: 'relative', zIndex: 2 }}>
          <h1>
            Discover, explore, and track<br />
            your favorite films and series<br />
            <span className="hero-sub">—all in one place.</span>
          </h1>
        </div>
      </section>

      {/* Coming Soon Section */}
      <div className="movie-section" style={{ background: "transparent", marginTop: "32px" }}>
        <div className="movie-section-title" style={{ color: '#ffb400' }}>Coming Soon</div>
        {loading ? (
          <div style={{ color: "#fff" }}>Loading...</div>
        ) : (
          <div className={`movie-grid${comingSoon.length === 1 ? ' movie-grid-single' : ''}`}>
            {comingSoon.length === 0 ? (
              <div style={{
                color: "#fff",
                fontSize: "1.2rem",
                textAlign: "center",
                width: "100%",
                padding: "24px 0"
              }}>
                No coming soon movies!
              </div>
            ) : (
              comingSoon.map(movie => (
                <MovieCard movie={movie} key={movie._id} wide={comingSoon.length === 1} />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Hero;
