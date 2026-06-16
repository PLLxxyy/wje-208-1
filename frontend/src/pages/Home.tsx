import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';

const ALBUM_EMOJIS = ['📷', '🌸', '🏖️', '🎄', '🎂', '🌅', '🌻', '🎈', '🏔️', '🍜'];

function AlbumCover({ album }: { album: any }) {
  const color = album.cover_image || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  const isGradient = color.includes('gradient');

  return (
    <div
      className="album-cover"
      style={isGradient ? { background: color } : { background: '#f0f0f0' }}
    >
      <span>{ALBUM_EMOJIS[album.id % ALBUM_EMOJIS.length]}</span>
      <span className="photo-count-badge">{album.photo_count} 张照片</span>
    </div>
  );
}

export default function Home() {
  const [albums, setAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.getAlbums().then(setAlbums).finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const result = await api.createAlbum({ name: name.trim(), description: desc.trim() });
      const album = await api.getAlbum(result.id);
      setAlbums(prev => [album, ...prev]);
      setName('');
      setDesc('');
      setShowCreate(false);
    } catch (err) {
      alert('创建失败');
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div className="loading">加载相册中</div>;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>📷 家庭相册</h1>
          <div className="subtitle">和家人一起记录美好瞬间</div>
        </div>
        {user && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            + 创建相册
          </button>
        )}
      </div>

      {albums.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📷</div>
          <h3>还没有相册</h3>
          <p>{user ? '点击上方按钮创建第一个相册吧' : '登录后即可创建相册'}</p>
          {!user && <Link to="/login" className="btn btn-primary">去登录</Link>}
        </div>
      ) : (
        <div className="album-grid">
          {albums.map(album => (
            <div
              key={album.id}
              className="album-card"
              onClick={() => navigate(`/albums/${album.id}`)}
            >
              <AlbumCover album={album} />
              <div className="album-info">
                <h3>{album.name}</h3>
                <div className="album-desc">{album.description || '暂无描述'}</div>
                <div className="album-meta">
                  <div className="album-creator">
                    <span className="mini-avatar" style={{ background: album.creator_name === '管理员' ? '#E74C3C' : '#3498DB' }}>
                      {album.creator_name?.charAt(0)}
                    </span>
                    <span>{album.creator_name}</span>
                  </div>
                  <span>{album.created_at?.split('T')[0] || album.created_at?.slice(0, 10)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>创建新相册</h3>
            <div className="form-group">
              <label>相册名称</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="例如：2024春节、宝宝成长"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>相册描述</label>
              <textarea
                value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder="简单描述一下这个相册"
              />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)} style={{ flex: 1 }}>取消</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={creating} style={{ flex: 1 }}>
                {creating ? '创建中...' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
