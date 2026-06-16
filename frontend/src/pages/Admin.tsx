import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'users' | 'albums'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    loadData();
  }, [tab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === 'users') {
        setUsers(await api.getAdminUsers());
      } else {
        setAlbums(await api.getAdminAlbums());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: number, name: string) => {
    if (!confirm(`确定要删除用户「${name}」吗？`)) return;
    try {
      await api.deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteAlbum = async (id: number, name: string) => {
    if (!confirm(`确定要删除相册「${name}」吗？所有照片都会被删除。`)) return;
    try {
      await api.deleteAlbum(id);
      setAlbums(prev => prev.filter(a => a.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <>
      <div className="page-header">
        <h1>⚙️ 管理后台</h1>
      </div>

      <div className="admin-tabs">
        <button className={tab === 'users' ? 'active' : ''} onClick={() => setTab('users')}>
          用户管理
        </button>
        <button className={tab === 'albums' ? 'active' : ''} onClick={() => setTab('albums')}>
          相册管理
        </button>
      </div>

      {loading ? (
        <div className="loading">加载中</div>
      ) : tab === 'users' ? (
        <div className="admin-table">
          <table>
            <thead>
              <tr>
                <th>用户</th>
                <th>用户名</th>
                <th>角色</th>
                <th>照片数</th>
                <th>注册时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <span className="table-avatar" style={{ background: u.avatarColor || '#999' }}>
                      {u.displayName?.charAt(0) || '?'}
                    </span>
                    {u.displayName}
                  </td>
                  <td style={{ color: 'var(--text-light)' }}>{u.username}</td>
                  <td>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 10px',
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 600,
                      background: u.role === 'admin' ? '#fde8e8' : '#e8f0de',
                      color: u.role === 'admin' ? '#c0392b' : '#27ae60',
                    }}>
                      {u.role === 'admin' ? '管理员' : '成员'}
                    </span>
                  </td>
                  <td>{u.photoCount || 0}</td>
                  <td style={{ color: 'var(--text-lighter)', fontSize: 13 }}>{u.createdAt?.slice(0, 10)}</td>
                  <td>
                    {u.id !== user?.id && (
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteUser(u.id, u.displayName)}>
                        删除
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="admin-table">
          <table>
            <thead>
              <tr>
                <th>相册名</th>
                <th>描述</th>
                <th>创建者</th>
                <th>照片数</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {albums.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 600 }}>{a.name}</td>
                  <td style={{ color: 'var(--text-light)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.description || '-'}
                  </td>
                  <td>{a.creator_name}</td>
                  <td>{a.photo_count || 0}</td>
                  <td style={{ color: 'var(--text-lighter)', fontSize: 13 }}>{a.created_at?.slice(0, 10)}</td>
                  <td>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => navigate(`/albums/${a.id}`)}
                      style={{ marginRight: 4 }}
                    >
                      查看
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteAlbum(a.id, a.name)}>
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
