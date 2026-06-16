import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function Slideshow() {
  const { id } = useParams();
  const albumId = Number(id);
  const [photos, setPhotos] = useState<any[]>([]);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.getPhotosByAlbum(albumId)
      .then(p => { setPhotos(p); })
      .finally(() => setLoading(false));
  }, [albumId]);

  useEffect(() => {
    if (!playing || photos.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % photos.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [playing, photos.length]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') navigate(`/albums/${albumId}`);
      if (e.key === 'ArrowLeft') setCurrent(prev => (prev - 1 + photos.length) % photos.length);
      if (e.key === 'ArrowRight') setCurrent(prev => (prev + 1) % photos.length);
      if (e.key === ' ') { e.preventDefault(); setPlaying(prev => !prev); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [photos.length, albumId]);

  if (loading) return <div className="loading">加载中</div>;
  if (photos.length === 0) {
    return (
      <div className="empty-state">
        <h3>相册没有照片</h3>
        <button className="btn btn-primary" onClick={() => navigate(`/albums/${albumId}`)}>返回相册</button>
      </div>
    );
  }

  const photo = photos[current];
  const photoEmojis = ['🌸', '🏖️', '🎂', '🎄', '🌅', '🎈', '🌻', '🐱', '🐶', '🍜'];

  return (
    <div className="slideshow-overlay">
      <button className="slideshow-close" onClick={() => navigate(`/albums/${albumId}`)}>
        ✕
      </button>

      <div className="slideshow-content">
        <div
          className="slideshow-image"
          style={{ background: photo.imageData || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
        >
          <span>{photoEmojis[photo.id % photoEmojis.length]}</span>
        </div>

        <div className="slideshow-title">{photo.title}</div>
        <div className="slideshow-desc">{photo.description || ''}</div>
        <div className="slideshow-counter">
          {current + 1} / {photos.length}
        </div>

        <div className="slideshow-controls">
          <button onClick={() => setCurrent((current - 1 + photos.length) % photos.length)}>⏮</button>
          <button onClick={() => setPlaying(!playing)}>{playing ? '⏸' : '▶'}</button>
          <button onClick={() => setCurrent((current + 1) % photos.length)}>⏭</button>
        </div>
      </div>
    </div>
  );
}
