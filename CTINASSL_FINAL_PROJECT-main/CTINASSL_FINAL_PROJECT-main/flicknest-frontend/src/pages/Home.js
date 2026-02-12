import React from 'react';
import Hero from '../components/Hero';
import MovieGrid from '../components/MovieGrid';

function Home() {
  return (
    <div>
      <Hero />
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <h2 style={{ color: '#fff', fontSize: '2rem', marginBottom: '1.5rem', textAlign: 'left' }}>Trending</h2>
        <MovieGrid />
      </section>
    </div>
  );
}

export default Home;
