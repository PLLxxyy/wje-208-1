import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';

export default function AlbumDetail() {
  const { id } = useParams();
  const albumId = Number(id);
  const [album, setAlbum] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([api.getAlbum(albumId), api.getPhotosByAlbum(albumId)])
      .then(([a, p]) => { setAlbum(a); setPhotos(p); })
      .finally(() => setLoading(false));
  }, [albumId]);

  const handleDelete = async () => {
    if (!confirm('确定要删除这个相册吗？所有照片都会被删除。')) return;
    try {
      await api.deleteAlbum(albumId);
      navigate('/');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveEdit = async () => {
    try {
      await api.updateAlbum(albumId, { name: editName, description: editDesc });
      setAlbum({ ...album, name: editName, description: editDesc });
      setEditing(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeletePhoto = async (photoId: number) => {
    if (!confirm('确定要删除这张照片吗？')) return;
    try {
      await api.deletePhoto(photoId);
      setPhotos(photos.filter(p => p.id !== photoId));
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <div className="loading">加载中</div>;
  if (!album) return <div className="empty-state"><h3>相册不存在</h3></div>;

  const canEdit = user && (user.role === 'admin' || user.id === album.creator_id);

  return (
    <>
      <div className="breadcrumb">
        <Link to="/">相册列表</Link>
        <span>/</span>
        <span>{album.name}</span>
      </div>

      <div className="page-header">
        <div>
          <h1>{album.name}</h1>
          {album.description && <div className="subtitle">{album.description}</div>}
          <div className="subtitle">由 {album.creator_name} 创建 &middot; {photos.length} 张照片</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {photos.length > 0 && (
            <button className="btn btn-ghost" onClick={() => navigate(`/albums/${albumId}/slideshow`)}>
              ▶ 幻灯片
            </button>
          )}
          {user && (
            <Link to={`/upload?albumId=${albumId}`} className="btn btn-primary">
              + 上传照片
            </Link>
          )}
          {canEdit && (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => {
                setEditName(album.name);
                setEditDesc(album.description || '');
                setEditing(true);
              }}>编辑</button>
              <button className="btn btn-danger btn-sm" onClick={handleDelete}>删除</button>
            </>
          )}
        </div>
      </div>

      {photos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🖼️</div>
          <h3>相册还是空的</h3>
          <p>上传一些照片来填充这个相册吧</p>
          {user && <Link to={`/upload?albumId=${albumId}`} className="btn btn-primary">上传照片</Link>}
        </div>
      ) : (
        <div className="photo-grid">
          {photos.map(photo => (
            <div key={photo.id} className="photo-card">
              <div
                className="photo-thumb"
                style={{ background: photo.imageData || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                onClick={() => navigate(`/photos/${photo.id}`)}
              >
                <span style={{ fontSize: 40 }}>
                  {['🌸', '🏖️', '🎂', '🎄', '🌅', '🎈', '🌻', '🐱', '🐶', '🍜'][photo.id % 10]}
                </span>
              </div>
              <div className="photo-card-body">
                <h4 onClick={() => navigate(`/photos/${photo.id}`)} style={{ cursor: 'pointer' }}>{photo.title}</h4>
                <div className="photo-meta">
                  <span className="meta-item">❤️ {photo.likeCount || 0}</span>
                  <span className="meta-item">💬 {photo.commentCount || 0}</span>
                  {canEdit && (
                    <button
                      className="btn btn-sm btn-ghost"
                      style={{ marginLeft: 'auto', padding: '2px 6px', fontSize: 11 }}
                      onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photo.id); }}
                    >
                      删除
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>编辑相册</h3>
            <div className="form-group">
              <label>相册名称</label>
              <input value={editName} onChange={e => setEditName(e.target.value)} autoFocus />
            </div>
            <div className="form-group">
              <label>相册描述</label>
              <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={() => setEditing(false)} style={{ flex: 1 }}>取消</button>
              <button className="btn btn-primary" onClick={handleSaveEdit} style={{ flex: 1 }}>保存</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
