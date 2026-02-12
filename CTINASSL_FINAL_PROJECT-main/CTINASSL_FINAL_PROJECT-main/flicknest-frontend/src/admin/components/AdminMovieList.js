// src/admin/components/AdminMovieList.js

import React, { useEffect, useState } from "react";
import { applyThemeFromStorage } from "../utils/theme";
import Select from "react-select";
import { FiUpload, FiImage, FiX, FiTrash2, FiEdit2 } from "react-icons/fi";
import {
  getAdminMovies,
  createAdminMovie,
  updateAdminMovie,
  deleteAdminMovie,
  getGenres,
} from "../utils/api";
import "./MovieList.css";

const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: "var(--input-bg)",
    borderColor: state.isFocused ? "#AF1763" : "var(--border-color)",
    minHeight: "45px",
    boxShadow: state.isFocused ? "0 0 0 1px #AF1763" : "none",
    borderRadius: "8px",
    color: "var(--text-color)",
    cursor: "pointer",
    "&:hover": { borderColor: "#AF1763" },
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: "var(--card-bg)",
    border: "1px solid var(--border-color)",
    borderRadius: "8px",
    zIndex: 9999,
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused ? "var(--hover-bg)" : "transparent",
    color: "var(--text-color)",
    cursor: "pointer",
    "&:active": { backgroundColor: "#AF1763", color: "#fff" },
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: "rgba(175, 23, 99, 0.15)",
    border: "1px solid rgba(175, 23, 99, 0.3)",
    borderRadius: "4px",
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: "#ff4d94",
    fontWeight: 600,
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    color: "#ff4d94",
    ":hover": { backgroundColor: "#AF1763", color: "white" },
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "var(--text-color)",
  }),
  input: (provided) => ({
    ...provided,
    color: "var(--text-color)",
  }),
  placeholder: (provided) => ({
    ...provided,
    color: "var(--text-muted)",
  }),
};

const statusOptions = [
  { value: "Latest Movies", label: "Latest Movies" },
  { value: "Trending", label: "Trending" },
  { value: "Coming Soon", label: "Coming Soon" },
];

const AdminMovieList = () => {
  useEffect(() => {
    applyThemeFromStorage();
  }, []);

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    title: "",
    genre: [],
    rating: "",
    description: "",
    cast: "",
    releaseDate: "",
    image: "",
    status: "Latest Movies",
  });

  const [editId, setEditId] = useState(null);
  const [genreOptions, setGenreOptions] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    fetchMovies();
    fetchGenres();
  }, []);

  const fetchMovies = async () => {
    setLoading(true);
    try {
      const data = await getAdminMovies();
      setMovies(data);
    } catch (err) {
      console.warn("Failed to fetch movies.");
    }
    setLoading(false);
  };

  const fetchGenres = async () => {
    try {
      const data = await getGenres();
      const formatted = data.map((g) => ({ value: g.name, label: g.name }));
      setGenreOptions(formatted);
    } catch (err) {
      const defaults = [
        "Action",
        "Comedy",
        "Drama",
        "Fantasy",
        "Horror",
        "Sci-Fi",
        "Thriller",
        "Western",
      ];
      setGenreOptions(defaults.map((g) => ({ value: g, label: g })));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "rating") {
      let val = Number(value);
      if (val > 10) val = 10;
      if (val < 0) val = 0;
      setForm({ ...form, rating: val });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleGenreChange = (selectedOptions) => {
    const values = selectedOptions
      ? selectedOptions.map((opt) => opt.value)
      : [];
    setForm({ ...form, genre: values });
  };

  const handleStatusChange = (selectedOption) => {
    setForm({
      ...form,
      status: selectedOption ? selectedOption.value : "Latest Movies",
    });
  };

  async function uploadImage(file) {
    const formData = new FormData();
    formData.append("image", file);
    const res = await fetch("http://localhost:4000/api/upload", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Image upload failed");
    const data = await res.json();
    return data.imageUrl;
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setForm((prev) => ({ ...prev, image: "" }));

    try {
      const realUrl = await uploadImage(file);
      setForm((prev) => ({ ...prev, image: realUrl }));
      setPreviewUrl("");
    } catch (err) {
      alert("Image upload failed");
      setForm((prev) => ({ ...prev, image: "" }));
      setPreviewUrl("");
    }
  };

  const handleRemoveImage = (e) => {
    e.stopPropagation();
    setForm((prev) => ({ ...prev, image: "" }));
    setImageFile(null);
    setPreviewUrl("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const ratingClamped = Math.max(0, Math.min(Number(form.rating), 10));
      const payload = {
        ...form,
        rating: ratingClamped,
        genre: form.genre,
        cast:
          typeof form.cast === "string"
            ? form.cast.split(",").map((s) => s.trim())
            : form.cast,
        status: form.status,
      };
      if (imageFile && !form.image.startsWith("/assets/")) {
        try {
          const realUrl = await uploadImage(imageFile);
          payload.image = realUrl;
        } catch (err) {
          alert("Image upload failed");
          return;
        }
      }

      if (editId) {
        await updateAdminMovie(editId, payload);
        setEditId(null);
      } else {
        await createAdminMovie(payload);
      }
      setForm({
        title: "",
        genre: [],
        rating: "",
        description: "",
        cast: "",
        releaseDate: "",
        image: "",
        status: "Latest Movies",
      });
      setImageFile(null);
      setPreviewUrl("");
      fetchMovies();
    } catch (err) {
      alert("Failed to save movie.");
    }
  };

  const handleEdit = (movie) => {
    setEditId(movie._id);
    setForm({
      title: movie.title,
      genre: Array.isArray(movie.genre) ? movie.genre : [movie.genre],
      rating: movie.rating,
      description: movie.description,
      cast: Array.isArray(movie.cast) ? movie.cast.join(", ") : movie.cast,
      releaseDate: movie.releaseDate,
      image: movie.image,
      status: movie.status || "Latest Movies",
    });
    setImageFile(null);
    setPreviewUrl("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this movie?")) {
      await deleteAdminMovie(id);
      fetchMovies();
    }
  };

  const getSelectedGenreObjects = () =>
    form.genre.map((g) => ({ value: g, label: g }));

  const getPreviewImage = () => {
    if (previewUrl) return previewUrl;
    if (form.image) {
      if (form.image.startsWith("/assets/"))
        return `http://localhost:4000${form.image}`;
      return form.image;
    }
    return "";
  };

  return (
    <div className="movie-list-container">
      <header className="page-header">
        <h1>Movies Management</h1>
        <p>Add, edit, or remove movies from your database.</p>
      </header>

      <section className="form-card">
        <h3>{editId ? "Edit Movie" : "Add New Movie"}</h3>
        <form onSubmit={handleSubmit} className="movie-form">
          <div className="form-split-layout">
            <div className="poster-section">
              <label className="section-label">Movie Poster</label>
              <div
                className={`poster-upload-area ${
                  getPreviewImage() ? "has-image" : ""
                }`}
                onClick={() => document.getElementById("poster-upload").click()}
              >
                <input
                  type="file"
                  accept="image/*"
                  id="poster-upload"
                  hidden
                  onChange={handleImageUpload}
                />
                {getPreviewImage() ? (
                  <div className="poster-preview-container">
                    <img
                      src={getPreviewImage()}
                      alt="Preview"
                      className="poster-preview-img"
                    />
                    <div className="poster-overlay">
                      <FiUpload className="overlay-icon" />
                      <span>Change Poster</span>
                    </div>
                    <button
                      type="button"
                      className="remove-poster-btn"
                      onClick={handleRemoveImage}
                    >
                      <FiX />
                    </button>
                  </div>
                ) : (
                  <div className="poster-placeholder">
                    <div className="upload-icon-circle">
                      <FiImage />
                    </div>
                    <span className="upload-text">Upload Poster</span>
                    <span className="upload-subtext">300 x 450px</span>
                  </div>
                )}
              </div>
            </div>

            <div className="details-section">
              <div className="form-grid">
                <div className="form-group">
                  <label>Title</label>
                  <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Genre</label>
                  <Select
                    isMulti
                    name="genre"
                    options={genreOptions}
                    value={getSelectedGenreObjects()}
                    onChange={handleGenreChange}
                    styles={customSelectStyles}
                    classNamePrefix="react-select"
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <Select
                    name="status"
                    options={statusOptions}
                    value={statusOptions.find(
                      (opt) => opt.value === form.status
                    )}
                    onChange={handleStatusChange}
                    styles={customSelectStyles}
                    classNamePrefix="react-select"
                    isSearchable={false}
                  />
                </div>
                <div className="form-group">
                  <label>Rating (0-10)</label>
                  <input
                    name="rating"
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={form.rating}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Release Date</label>
                  <input
                    name="releaseDate"
                    type="date"
                    value={form.releaseDate}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Cast (comma separated)</label>
                <input
                  name="cast"
                  value={form.cast}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  rows="4"
                  value={form.description}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  {editId ? "Update Movie" : "Add Movie"}
                </button>
                {editId && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setEditId(null);
                      setForm({
                        title: "",
                        genre: [],
                        rating: "",
                        description: "",
                        cast: "",
                        releaseDate: "",
                        image: "",
                        status: "Latest Movies",
                      });
                      setImageFile(null);
                      setPreviewUrl("");
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      </section>

      <section className="table-card">
        <h3>All Movies</h3>
        {loading ? (
          <div className="loading-state">Loading movies...</div>
        ) : (
          <div className="table-responsive">
            <table className="movie-table">
              <thead>
                <tr>
                  <th>Poster</th>
                  <th>Title</th>
                  <th>Genre</th>
                  <th>Status</th>
                  <th>Rating</th>
                  <th>Release Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {movies.length > 0 ? (
                  movies.map((m) => (
                    <tr key={m._id}>
                      <td>
                        {m.image ? (
                          <img
                            src={
                              m.image.startsWith("/assets/")
                                ? `http://localhost:4000${m.image}`
                                : m.image
                            }
                            alt={m.title}
                            className="table-poster-img"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src =
                                "https://placehold.co/60x90/2A3038/6c7293?text=No+Img";
                            }}
                          />
                        ) : (
                          <div className="no-poster-box">
                            <FiImage />
                          </div>
                        )}
                      </td>
                      <td className="font-medium">{m.title}</td>
                      <td>
                        {/* SHOW ALL GENRES (No +1) */}
                        <div className="genre-badges">
                          {Array.isArray(m.genre) && m.genre.length > 0 ? (
                            m.genre.map((g, i) => (
                              <span key={i} className="badge">
                                {g}
                              </span>
                            ))
                          ) : (
                            <span className="badge">{m.genre || "-"}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            m.status === "Trending"
                              ? "badge-purple"
                              : m.status === "Coming Soon"
                              ? "badge-blue"
                              : "badge-default"
                          }`}
                        >
                          {m.status || "Latest Movies"}
                        </span>
                      </td>
                      <td>⭐ {m.rating}</td>
                      <td>{m.releaseDate}</td>
                      <td className="text-right">
                        {/* Side-by-side Actions */}
                        <div className="actions-wrapper">
                          <button
                            className="action-btn edit"
                            onClick={() => handleEdit(m)}
                          >
                            <FiEdit2 /> Edit
                          </button>
                          <button
                            className="action-btn delete"
                            onClick={() => handleDelete(m._id)}
                          >
                            <FiTrash2 /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="empty-state">
                      No movies found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminMovieList;
