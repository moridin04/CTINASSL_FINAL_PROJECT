// src/admin/components/AdminGenreList.js

import React, { useEffect, useState } from 'react';
import { getGenres, createGenre, updateGenre, deleteGenre } from '../utils/api';

const AdminGenreList = () => {
  const [genres, setGenres] = useState([]);
  const [name, setName] = useState('');

  useEffect(() => {
    getGenres().then(setGenres);
  }, []);

  const handleAdd = async () => {
    const newGenre = await createGenre({ name });
    setGenres([...genres, newGenre]);
    setName('');
  };

  const handleDelete = async (id) => {
    await deleteGenre(id);
    setGenres(genres.filter(g => g._id !== id));
  };

  return (
    <div>
      <h2>Genres</h2>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Genre name" />
      <button onClick={handleAdd}>Add Genre</button>
      <ul>
        {genres.map(g => (
          <li key={g._id}>
            {g.name}
            <button onClick={() => handleDelete(g._id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminGenreList;
