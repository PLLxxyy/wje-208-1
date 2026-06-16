import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

function getInitial(name: string): string {
  return name ? name.charAt(0) : '?';
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <header className="app-header">
        <Link to="/" className="logo">
          <span className="logo-icon">📷</span>
          <span>家庭相册</span>
        </Link>
        <nav>
          {user ? (
            <>
              <Link to="/">相册</Link>
              <Link to="/upload">上传</Link>
              <Link to="/profile">我的</Link>
              {user.role === 'admin' && <Link to="/admin">管理</Link>}
              <div className="nav-user">
                <span
                  className="user-avatar"
                  style={{ background: user.avatarColor }}
                >
                  {getInitial(user.displayName)}
                </span>
                <span>{user.displayName}</span>
              </div>
              <button onClick={handleLogout}>退出</button>
            </>
          ) : (
            <>
              <Link to="/login">登录</Link>
              <Link to="/register">注册</Link>
            </>
          )}
        </nav>
      </header>
      <main className="main-container">
        <Outlet />
      </main>
    </>
  );
}
