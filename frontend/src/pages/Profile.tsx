import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    refreshUser();
    api.getPhotosByUser(user.id).then(setPhotos).finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;
  if (loading) return <div className="loading">加载中</div>;

  return (
    <>
      <div className="profile-header">
        <div className="profile-avatar" style={{ background: user.avatarColor || '#E74C3C' }}>
          {user.displayName?.charAt(0) || '?'}
        </div>
        <div className="profile-info">
          <h2>{user.displayName}</h2>
          <div style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 2 }}>@{user.username}</div>
          <div className="profile-role" style={{ marginTop: 6 }}>
            {user.role === 'admin' ? '管理员' : '家庭成员'}
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📸</div>
          <div className="stat-number">{user.photoCount || 0}</div>
          <div className="stat-label">我上传的照片</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📁</div>
          <div className="stat-number">{user.albumCount || 0}</div>
          <div className="stat-label">我创建的相册</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">❤️</div>
          <div className="stat-number">{user.likesReceived || 0}</div>
          <div className="stat-label">获得的点赞</div>
        </div>
      </div>

      <div className="page-header">
        <h1>我的照片</h1>
      </div>

      {photos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📷</div>
          <h3>还没有上传照片</h3>
          <p>去相册里上传一些照片吧</p>
        </div>
      ) : (
        <div className="photo-grid">
          {photos.map(photo => (
            <div
              key={photo.id}
              className="photo-card"
              onClick={() => navigate(`/photos/${photo.id}`)}
            >
              <div
                className="photo-thumb"
                style={{ background: photo.imageData || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
              >
                <span style={{ fontSize: 36 }}>
                  {['🌸', '🏖️', '🎂', '🎄', '🌅', '🎈', '🌻', '🐱', '🐶', '🍜'][photo.id % 10]}
                </span>
              </div>
              <div className="photo-card-body">
                <h4>{photo.title}</h4>
                <div className="photo-meta">
                  <span className="meta-item">📁 {photo.albumName}</span>
                  <span className="meta-item">❤️ {photo.likeCount || 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
