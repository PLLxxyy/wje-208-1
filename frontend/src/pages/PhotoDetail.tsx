import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';

export default function PhotoDetail() {
  const { id } = useParams();
  const photoId = Number(id);
  const [photo, setPhoto] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [newTag, setNewTag] = useState('');
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([api.getPhoto(photoId), api.getComments(photoId), api.getPhotoTags(photoId)])
      .then(([p, c, t]) => { setPhoto(p); setComments(c); setTags(t); })
      .finally(() => setLoading(false));
  }, [photoId]);

  const handleLike = async () => {
    if (!user) { navigate('/login'); return; }
    try {
      const result = await api.toggleLike(photoId);
      setPhoto((prev: any) => ({ ...prev, liked: result.liked, likeCount: result.likeCount }));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return;
    try {
      const result = await api.addComment(photoId, newComment.trim());
      setComments(prev => [...prev, result]);
      setNewComment('');
      setPhoto((prev: any) => ({ ...prev, commentCount: (prev.commentCount || 0) + 1 }));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      await api.deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      setPhoto((prev: any) => ({ ...prev, commentCount: Math.max(0, (prev.commentCount || 1) - 1) }));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddTag = async () => {
    if (!newTag.trim() || !user) return;
    try {
      const result = await api.addPhotoTag(photoId, newTag.trim());
      setTags(prev => [...prev, result]);
      setNewTag('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRemoveTag = async (tagId: number) => {
    try {
      await api.removePhotoTag(photoId, tagId);
      setTags(prev => prev.filter(t => t.id !== tagId));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeletePhoto = async () => {
    if (!confirm('确定要删除这张照片吗？')) return;
    try {
      await api.deletePhoto(photoId);
      navigate(`/albums/${photo.albumId}`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <div className="loading">加载中</div>;
  if (!photo) return <div className="empty-state"><h3>照片不存在</h3></div>;

  const photoEmojis = ['🌸', '🏖️', '🎂', '🎄', '🌅', '🎈', '🌻', '🐱', '🐶', '🍜'];
  const canDelete = user && (user.role === 'admin' || user.id === photo.uploaderId);

  return (
    <>
      <div className="breadcrumb">
        <Link to="/">相册列表</Link>
        <span>/</span>
        <Link to={`/albums/${photo.albumId}`}>返回相册</Link>
        <span>/</span>
        <span>{photo.title}</span>
      </div>

      <div className="photo-detail-container">
        <div className="photo-detail-main">
          <div
            className="photo-display"
            style={{ background: photo.imageData || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          >
            <span>{photoEmojis[photo.id % photoEmojis.length]}</span>
          </div>

          <div className="photo-actions">
            <button className={`like-btn ${photo.liked ? 'liked' : ''}`} onClick={handleLike}>
              {photo.liked ? '❤️' : '🤍'} {photo.likeCount || 0}
            </button>
            {canDelete && (
              <button className="btn btn-danger btn-sm" onClick={handleDeletePhoto}>删除照片</button>
            )}
          </div>

          <div className="photo-description">
            <h3>{photo.title}</h3>
            <div className="desc-text">{photo.description || '暂无描述'}</div>
            <div className="desc-meta">
              <span>📸 {photo.uploaderName}</span>
              {photo.takenDate && <span>📅 {photo.takenDate}</span>}
              <span>🕐 {photo.createdAt?.slice(0, 10)}</span>
            </div>
            <div className="photo-tags-section">
              <span className="tags-label">🏷️ 标签</span>
              <div className="tag-list">
                {tags.map(tag => (
                  <span key={tag.id} className="tag-item">
                    {tag.name}
                    {user && (
                      <button className="tag-remove" onClick={() => handleRemoveTag(tag.id)}>×</button>
                    )}
                  </span>
                ))}
                {tags.length === 0 && (
                  <span style={{ fontSize: 12, color: 'var(--text-lighter)' }}>暂无标签</span>
                )}
              </div>
              {user && (
                <div className="tag-input-row">
                  <input
                    value={newTag}
                    onChange={e => setNewTag(e.target.value)}
                    placeholder="添加标签，回车确认"
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                  />
                  <button className="btn btn-sm btn-ghost" onClick={handleAddTag}>添加</button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="photo-detail-sidebar">
          <div className="comments-section">
            <h3>💬 评论 ({comments.length})</h3>

            {user && (
              <div className="comment-input-group">
                <input
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="写一条评论..."
                  onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                />
                <button className="btn btn-primary btn-sm" onClick={handleAddComment}>发送</button>
              </div>
            )}

            {comments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-lighter)', fontSize: 13 }}>
                还没有评论，来发表第一条吧
              </div>
            ) : (
              <div className="comment-list">
                {comments.map(c => (
                  <div key={c.id} className="comment-item">
                    <div className="comment-avatar" style={{ background: c.avatarColor || '#999' }}>
                      {c.userName?.charAt(0) || '?'}
                    </div>
                    <div className="comment-body">
                      <div className="comment-user">{c.userName}</div>
                      <div className="comment-text">{c.content}</div>
                      <div className="comment-time">{c.createdAt?.slice(0, 16).replace('T', ' ')}</div>
                    </div>
                    {user && (user.id === c.userId || user.role === 'admin') && (
                      <button
                        className="btn btn-sm btn-ghost"
                        style={{ padding: '2px 6px', fontSize: 11, flexShrink: 0 }}
                        onClick={() => handleDeleteComment(c.id)}
                      >
                        删除
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
