import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import {
  AuthRequest, requireAuth, optionalAuth, requireAdmin, signToken
} from '../middleware/auth';
import {
  createUser, findUserByUsername, findUserById,
  createAlbum, getAllAlbums, getAlbumById, updateAlbum, deleteAlbum, updateAlbumCover,
  createPhoto, getPhotoById, getPhotosByAlbumId, getPhotosByUserId, getAllPhotos, deletePhoto,
  toggleLike, isLikedByUser, getLikeCount,
  createComment, getCommentsByPhotoId, deleteComment,
  getAllUsers, deleteUser, getUserStats,
  addTagToPhoto, removeTagFromPhoto, getTagsByPhotoId, getAllTags, getPhotosByTag
} from '../db';

const router = Router();

// ── Auth Routes ──

router.post('/auth/register', (req: AuthRequest, res: Response) => {
  try {
    const { username, password, displayName } = req.body;
    if (!username || !password || !displayName) {
      return res.status(400).json({ error: '请填写所有字段' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: '密码至少6位' });
    }

    const existing = findUserByUsername(username);
    if (existing) {
      return res.status(400).json({ error: '用户名已存在' });
    }

    const hash = bcrypt.hashSync(password, 10);
    const result = createUser(username, hash, displayName);
    const user = findUserById(result.lastInsertRowid);
    const token = signToken(user.id, user.role);

    res.json({
      token,
      user: { id: user.id, username: user.username, displayName: user.display_name, role: user.role, avatarColor: user.avatar_color }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/auth/login', (req: AuthRequest, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: '请填写所有字段' });
    }

    const user = findUserByUsername(username);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const token = signToken(user.id, user.role);
    res.json({
      token,
      user: { id: user.id, username: user.username, displayName: user.display_name, role: user.role, avatarColor: user.avatar_color }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/auth/me', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const user = findUserById(req.userId!);
    if (!user) return res.status(404).json({ error: '用户不存在' });
    const stats = getUserStats(req.userId!);
    res.json({
      id: user.id, username: user.username, displayName: user.display_name,
      role: user.role, avatarColor: user.avatar_color, createdAt: user.created_at,
      ...stats
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Album Routes ──

router.get('/albums', (req: AuthRequest, res: Response) => {
  try {
    res.json(getAllAlbums());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/albums/:id', (req: AuthRequest, res: Response) => {
  try {
    const album = getAlbumById(Number(req.params.id));
    if (!album) return res.status(404).json({ error: '相册不存在' });
    res.json(album);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/albums', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: '请输入相册名称' });
    const result = createAlbum(name, description || '', req.userId!);
    res.json({ id: result.lastInsertRowid, message: '相册创建成功' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/albums/:id', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const album = getAlbumById(Number(req.params.id));
    if (!album) return res.status(404).json({ error: '相册不存在' });
    if (req.userRole !== 'admin' && album.creator_id !== req.userId) {
      return res.status(403).json({ error: '没有权限编辑此相册' });
    }
    const { name, description } = req.body;
    updateAlbum(Number(req.params.id), name || album.name, description ?? album.description);
    res.json({ message: '相册更新成功' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/albums/:id', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const album = getAlbumById(Number(req.params.id));
    if (!album) return res.status(404).json({ error: '相册不存在' });
    if (req.userRole !== 'admin' && album.creator_id !== req.userId) {
      return res.status(403).json({ error: '没有权限删除此相册' });
    }
    deleteAlbum(Number(req.params.id));
    res.json({ message: '相册已删除' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Photo Routes ──

router.get('/photos', optionalAuth, (req: AuthRequest, res: Response) => {
  try {
    const photos = getAllPhotos();
    const result = photos.map((p: any) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      takenDate: p.taken_date,
      imageData: p.image_data,
      uploaderName: p.uploader_name,
      uploaderId: p.uploader_id,
      albumId: p.album_id,
      albumName: p.album_name,
      likeCount: p.like_count,
      commentCount: p.comment_count,
      createdAt: p.created_at,
      liked: req.userId ? isLikedByUser(req.userId, p.id) : false
    }));
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/photos/album/:albumId', optionalAuth, (req: AuthRequest, res: Response) => {
  try {
    const photos = getPhotosByAlbumId(Number(req.params.albumId));
    const result = photos.map((p: any) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      takenDate: p.taken_date,
      imageData: p.image_data,
      uploaderName: p.uploader_name,
      uploaderId: p.uploader_id,
      albumId: p.album_id,
      likeCount: p.like_count,
      commentCount: p.comment_count,
      createdAt: p.created_at,
      liked: req.userId ? isLikedByUser(req.userId, p.id) : false
    }));
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/photos/user/:userId', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const photos = getPhotosByUserId(Number(req.params.userId));
    res.json(photos.map((p: any) => ({
      id: p.id, title: p.title, albumName: p.album_name,
      imageData: p.image_data, likeCount: p.like_count, createdAt: p.created_at
    })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/photos/:id', optionalAuth, (req: AuthRequest, res: Response) => {
  try {
    const photo = getPhotoById(Number(req.params.id));
    if (!photo) return res.status(404).json({ error: '照片不存在' });
    res.json({
      id: photo.id,
      title: photo.title,
      description: photo.description,
      takenDate: photo.taken_date,
      imageData: photo.image_data,
      uploaderName: photo.uploader_name,
      uploaderId: photo.uploader_id,
      albumId: photo.album_id,
      likeCount: photo.like_count,
      commentCount: photo.comment_count,
      createdAt: photo.created_at,
      liked: req.userId ? isLikedByUser(req.userId, photo.id) : false
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/photos', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const { title, description, takenDate, imageData, albumId, tags } = req.body;
    if (!title || !imageData || !albumId) {
      return res.status(400).json({ error: '请填写照片标题并选择相册' });
    }

    const album = getAlbumById(Number(albumId));
    if (!album) return res.status(404).json({ error: '相册不存在' });

    const result = createPhoto(
      title, description || '', takenDate || new Date().toISOString().split('T')[0],
      imageData, req.userId!, Number(albumId)
    );

    if (album.photo_count === 0) {
      updateAlbumCover(Number(albumId), imageData);
    }

    const photoId = result.lastInsertRowid;
    if (Array.isArray(tags)) {
      for (const tagName of tags) {
        if (typeof tagName === 'string' && tagName.trim()) {
          addTagToPhoto(photoId, tagName.trim());
        }
      }
    }

    res.json({ id: photoId, message: '照片上传成功' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/photos/bulk', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const { photos } = req.body;
    if (!photos || !Array.isArray(photos) || photos.length === 0) {
      return res.status(400).json({ error: '请选择至少一张照片' });
    }

    const results: number[] = [];
    for (const photo of photos) {
      if (!photo.title || !photo.imageData || !photo.albumId) continue;
      const album = getAlbumById(Number(photo.albumId));
      if (!album) continue;

      const result = createPhoto(
        photo.title, photo.description || '', photo.takenDate || new Date().toISOString().split('T')[0],
        photo.imageData, req.userId!, Number(photo.albumId)
      );
      const photoId = result.lastInsertRowid as number;
      results.push(photoId);

      if (album.photo_count === 0 && results.length === 1) {
        updateAlbumCover(Number(photo.albumId), photo.imageData);
      }

      if (Array.isArray(photo.tags)) {
        for (const tagName of photo.tags) {
          if (typeof tagName === 'string' && tagName.trim()) {
            addTagToPhoto(photoId, tagName.trim());
          }
        }
      }
    }

    res.json({ count: results.length, ids: results, message: `成功上传 ${results.length} 张照片` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/photos/:id', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const photo = getPhotoById(Number(req.params.id));
    if (!photo) return res.status(404).json({ error: '照片不存在' });
    if (req.userRole !== 'admin' && photo.uploader_id !== req.userId) {
      return res.status(403).json({ error: '没有权限删除此照片' });
    }
    deletePhoto(Number(req.params.id));
    res.json({ message: '照片已删除' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Like Routes ──

router.post('/photos/:id/like', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const photoId = Number(req.params.id);
    const photo = getPhotoById(photoId);
    if (!photo) return res.status(404).json({ error: '照片不存在' });

    const liked = toggleLike(req.userId!, photoId);
    const count = getLikeCount(photoId);
    res.json({ liked, likeCount: count });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Comment Routes ──

router.get('/photos/:id/comments', (req: AuthRequest, res: Response) => {
  try {
    const comments = getCommentsByPhotoId(Number(req.params.id));
    res.json(comments.map((c: any) => ({
      id: c.id, content: c.content,
      userId: c.user_id, userName: c.user_name, avatarColor: c.avatar_color,
      createdAt: c.created_at
    })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/photos/:id/comments', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: '请输入评论内容' });

    const photo = getPhotoById(Number(req.params.id));
    if (!photo) return res.status(404).json({ error: '照片不存在' });

    const result = createComment(content, req.userId!, Number(req.params.id));
    const user = findUserById(req.userId!);

    res.json({
      id: result.lastInsertRowid, content,
      userId: req.userId, userName: user.display_name, avatarColor: user.avatar_color,
      createdAt: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/comments/:id', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    deleteComment(Number(req.params.id));
    res.json({ message: '评论已删除' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Tag Routes ──

router.get('/tags', (_req: AuthRequest, res: Response) => {
  try {
    const tags = getAllTags();
    res.json(tags.map((t: any) => ({ id: t.id, name: t.name, photoCount: t.photo_count })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/tags/:id/photos', optionalAuth, (req: AuthRequest, res: Response) => {
  try {
    const photos = getPhotosByTag(Number(req.params.id));
    const result = photos.map((p: any) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      takenDate: p.taken_date,
      imageData: p.image_data,
      uploaderName: p.uploader_name,
      uploaderId: p.uploader_id,
      albumId: p.album_id,
      albumName: p.album_name,
      likeCount: p.like_count,
      commentCount: p.comment_count,
      createdAt: p.created_at,
      liked: req.userId ? isLikedByUser(req.userId, p.id) : false
    }));
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/photos/:id/tags', (req: AuthRequest, res: Response) => {
  try {
    const tags = getTagsByPhotoId(Number(req.params.id));
    res.json(tags.map((t: any) => ({ id: t.id, name: t.name })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/photos/:id/tags', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: '请输入标签名' });

    const photo = getPhotoById(Number(req.params.id));
    if (!photo) return res.status(404).json({ error: '照片不存在' });

    const tag = addTagToPhoto(Number(req.params.id), name.trim());
    res.json({ id: tag.id, name: tag.name });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/photos/:photoId/tags/:tagId', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    removeTagFromPhoto(Number(req.params.photoId), Number(req.params.tagId));
    res.json({ message: '标签已移除' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin Routes ──

router.get('/admin/users', requireAuth, requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const users = getAllUsers();
    res.json(users.map((u: any) => ({
      id: u.id, username: u.username, displayName: u.display_name,
      role: u.role, avatarColor: u.avatar_color, photoCount: u.photo_count,
      createdAt: u.created_at
    })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/admin/users/:id', requireAuth, requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    deleteUser(Number(req.params.id));
    res.json({ message: '用户已删除' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/admin/albums', requireAuth, requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    res.json(getAllAlbums());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
