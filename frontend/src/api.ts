const BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request(path: string, options: RequestInit = {}): Promise<any> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '请求失败');
  return data;
}

export const api = {
  // Auth
  register: (body: { username: string; password: string; displayName: string }) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  login: (body: { username: string; password: string }) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  getMe: () => request('/auth/me'),

  // Albums
  getAlbums: () => request('/albums'),
  getAlbum: (id: number) => request(`/albums/${id}`),
  createAlbum: (body: { name: string; description: string }) =>
    request('/albums', { method: 'POST', body: JSON.stringify(body) }),
  updateAlbum: (id: number, body: { name: string; description: string }) =>
    request(`/albums/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteAlbum: (id: number) =>
    request(`/albums/${id}`, { method: 'DELETE' }),

  // Photos
  getPhotos: () => request('/photos'),
  getPhotosByAlbum: (albumId: number) => request(`/photos/album/${albumId}`),
  getPhotosByUser: (userId: number) => request(`/photos/user/${userId}`),
  getPhoto: (id: number) => request(`/photos/${id}`),
  createPhoto: (body: { title: string; description: string; takenDate: string; imageData: string; albumId: number }) =>
    request('/photos', { method: 'POST', body: JSON.stringify(body) }),
  createPhotosBulk: (photos: any[]) =>
    request('/photos/bulk', { method: 'POST', body: JSON.stringify({ photos }) }),
  deletePhoto: (id: number) =>
    request(`/photos/${id}`, { method: 'DELETE' }),

  // Likes
  toggleLike: (photoId: number) =>
    request(`/photos/${photoId}/like`, { method: 'POST' }),

  // Comments
  getComments: (photoId: number) => request(`/photos/${photoId}/comments`),
  addComment: (photoId: number, content: string) =>
    request(`/photos/${photoId}/comments`, { method: 'POST', body: JSON.stringify({ content }) }),
  deleteComment: (id: number) =>
    request(`/comments/${id}`, { method: 'DELETE' }),

  // Admin
  getAdminUsers: () => request('/admin/users'),
  deleteUser: (id: number) => request(`/admin/users/${id}`, { method: 'DELETE' }),
  getAdminAlbums: () => request('/admin/albums'),
};
