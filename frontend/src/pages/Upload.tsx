import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';

const GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
  'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
  'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
  'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
];

interface PhotoEntry {
  id: string;
  title: string;
  description: string;
  takenDate: string;
  gradient: string;
  tags: string[];
}

export default function Upload() {
  const [searchParams] = useSearchParams();
  const preAlbumId = searchParams.get('albumId') || '';

  const [albums, setAlbums] = useState<any[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState(preAlbumId);
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [tagInput, setTagInput] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [albumsLoading, setAlbumsLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.getAlbums().then(setAlbums).finally(() => setAlbumsLoading(false));
  }, []);

  const addPhotos = (count: number) => {
    const newPhotos: PhotoEntry[] = [];
    for (let i = 0; i < count; i++) {
      newPhotos.push({
        id: `${Date.now()}-${i}`,
        title: '',
        description: '',
        takenDate: new Date().toISOString().split('T')[0],
        gradient: GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)],
        tags: [],
      });
    }
    setPhotos(prev => [...prev, ...newPhotos]);
  };

  const removePhoto = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  const updatePhoto = (id: string, field: keyof PhotoEntry, value: string) => {
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const addTagToEntry = (photoId: string) => {
    const input = (tagInput[photoId] || '').trim();
    if (!input) return;
    setPhotos(prev => prev.map(p => {
      if (p.id !== photoId) return p;
      if (p.tags.includes(input)) return p;
      return { ...p, tags: [...p.tags, input] };
    }));
    setTagInput(prev => ({ ...prev, [photoId]: '' }));
  };

  const removeTagFromEntry = (photoId: string, tag: string) => {
    setPhotos(prev => prev.map(p => {
      if (p.id !== photoId) return p;
      return { ...p, tags: p.tags.filter(t => t !== tag) };
    }));
  };

  const handleSubmit = async () => {
    if (!selectedAlbum) { alert('请选择相册'); return; }
    const valid = photos.filter(p => p.title.trim());
    if (valid.length === 0) { alert('请至少填写一张照片的标题'); return; }

    setLoading(true);
    try {
      const payload = valid.map(p => ({
        title: p.title.trim(),
        description: p.description.trim(),
        takenDate: p.takenDate,
        imageData: p.gradient,
        albumId: Number(selectedAlbum),
        tags: p.tags.filter(t => t.trim()),
      }));
      await api.createPhotosBulk(payload);
      setSuccess(`成功上传 ${valid.length} 张照片`);
      setPhotos([]);
      setTimeout(() => navigate(`/albums/${selectedAlbum}`), 1500);
    } catch (err: any) {
      alert(err.message || '上传失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <h1>📤 上传照片</h1>
      </div>

      {success && (
        <div style={{ background: '#e8fde8', color: '#27ae60', padding: '12px 16px', borderRadius: 8, marginBottom: 16, textAlign: 'center', fontWeight: 600 }}>
          ✅ {success}
        </div>
      )}

      <div className="form-group" style={{ maxWidth: 400, marginBottom: 20 }}>
        <label>选择相册</label>
        {albumsLoading ? (
          <div className="loading">加载相册列表</div>
        ) : albums.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--text-light)' }}>
            还没有相册，<Link to="/" style={{ color: 'var(--primary)' }}>去创建一个</Link>
          </div>
        ) : (
          <select value={selectedAlbum} onChange={e => setSelectedAlbum(e.target.value)}>
            <option value="">-- 请选择相册 --</option>
            {albums.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        )}
      </div>

      <div className="upload-area" onClick={() => addPhotos(3)}>
        <div className="upload-icon">📷</div>
        <div className="upload-text">点击此处添加照片</div>
        <div className="upload-hint">每次点击添加 3 张占位照片（无实际文件上传）</div>
      </div>

      {photos.length > 0 && (
        <>
          <div className="upload-preview-grid">
            {photos.map(photo => (
              <div key={photo.id} className="upload-preview-item">
                <button className="preview-remove" onClick={() => removePhoto(photo.id)}>×</button>
                <div className="preview-img" style={{ background: photo.gradient }}>
                  <span style={{ fontSize: 28 }}>📷</span>
                </div>
                <div className="preview-fields">
                  <input
                    placeholder="照片标题 *"
                    value={photo.title}
                    onChange={e => updatePhoto(photo.id, 'title', e.target.value)}
                  />
                  <input
                    placeholder="描述（可选）"
                    value={photo.description}
                    onChange={e => updatePhoto(photo.id, 'description', e.target.value)}
                  />
                  <input
                    type="date"
                    value={photo.takenDate}
                    onChange={e => updatePhoto(photo.id, 'takenDate', e.target.value)}
                  />
                  <div className="tag-input-row">
                    <input
                      placeholder="添加标签，回车确认"
                      value={tagInput[photo.id] || ''}
                      onChange={e => setTagInput(prev => ({ ...prev, [photo.id]: e.target.value }))}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTagToEntry(photo.id); } }}
                    />
                    <button type="button" className="btn btn-sm btn-ghost" onClick={() => addTagToEntry(photo.id)}>+</button>
                  </div>
                  {photo.tags.length > 0 && (
                    <div className="tag-list">
                      {photo.tags.map(tag => (
                        <span key={tag} className="tag-item">
                          {tag}
                          <button type="button" className="tag-remove" onClick={() => removeTagFromEntry(photo.id, tag)}>×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={() => addPhotos(3)}>再添加 3 张</button>
            <button
              className="btn btn-primary btn-lg"
              onClick={handleSubmit}
              disabled={loading || !selectedAlbum}
              style={{ marginLeft: 'auto', minWidth: 160 }}
            >
              {loading ? '上传中...' : `上传 ${photos.filter(p => p.title.trim()).length} 张照片`}
            </button>
          </div>
        </>
      )}
    </>
  );
}
