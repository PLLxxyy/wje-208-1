import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, '..', 'data.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initDb(db);
  }
  return db;
}

function initDb(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      avatar_color TEXT DEFAULT '#FF6B6B',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS albums (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      cover_image TEXT,
      creator_id INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (creator_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      taken_date TEXT,
      image_data TEXT NOT NULL,
      uploader_id INTEGER NOT NULL,
      album_id INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (uploader_id) REFERENCES users(id),
      FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      photo_id INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, photo_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      photo_id INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS photo_tags (
      photo_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY (photo_id, tag_id),
      FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );
  `);
}

// ── User Functions ──

export function createUser(username: string, passwordHash: string, displayName: string, role: string = 'member'): any {
  const db = getDb();
  const stmt = db.prepare(
    'INSERT INTO users (username, password_hash, display_name, role) VALUES (?, ?, ?, ?)'
  );
  return stmt.run(username, passwordHash, displayName, role);
}

export function findUserByUsername(username: string): any {
  const db = getDb();
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
}

export function findUserById(id: number): any {
  const db = getDb();
  return db.prepare('SELECT id, username, display_name, role, avatar_color, created_at FROM users WHERE id = ?').get(id);
}

export function getUserPhotoCount(userId: number): number {
  const db = getDb();
  const row = db.prepare('SELECT COUNT(*) as count FROM photos WHERE uploader_id = ?').get(userId) as any;
  return row.count;
}

export function getUserAlbumCount(userId: number): number {
  const db = getDb();
  const row = db.prepare('SELECT COUNT(*) as count FROM albums WHERE creator_id = ?').get(userId) as any;
  return row.count;
}

export function getUserLikesReceived(userId: number): number {
  const db = getDb();
  const row = db.prepare(`
    SELECT COUNT(*) as count FROM likes
    JOIN photos ON likes.photo_id = photos.id
    WHERE photos.uploader_id = ?
  `).get(userId) as any;
  return row.count;
}

// ── Album Functions ──

export function createAlbum(name: string, description: string, creatorId: number): any {
  const db = getDb();
  return db.prepare(
    'INSERT INTO albums (name, description, creator_id) VALUES (?, ?, ?)'
  ).run(name, description, creatorId);
}

export function getAllAlbums(): any[] {
  const db = getDb();
  return db.prepare(`
    SELECT a.*, u.display_name as creator_name,
           (SELECT COUNT(*) FROM photos WHERE album_id = a.id) as photo_count
    FROM albums a
    JOIN users u ON a.creator_id = u.id
    ORDER BY a.created_at DESC
  `).all();
}

export function getAlbumById(id: number): any {
  const db = getDb();
  return db.prepare(`
    SELECT a.*, u.display_name as creator_name,
           (SELECT COUNT(*) FROM photos WHERE album_id = a.id) as photo_count
    FROM albums a
    JOIN users u ON a.creator_id = u.id
    WHERE a.id = ?
  `).get(id);
}

export function updateAlbum(id: number, name: string, description: string): any {
  const db = getDb();
  return db.prepare(
    'UPDATE albums SET name = ?, description = ? WHERE id = ?'
  ).run(name, description, id);
}

export function deleteAlbum(id: number): any {
  const db = getDb();
  return db.prepare('DELETE FROM albums WHERE id = ?').run(id);
}

export function updateAlbumCover(albumId: number, imageData: string): any {
  const db = getDb();
  return db.prepare('UPDATE albums SET cover_image = ? WHERE id = ?').run(imageData, albumId);
}

// ── Photo Functions ──

export function createPhoto(title: string, description: string, takenDate: string, imageData: string, uploaderId: number, albumId: number): any {
  const db = getDb();
  return db.prepare(
    'INSERT INTO photos (title, description, taken_date, image_data, uploader_id, album_id) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(title, description, takenDate, imageData, uploaderId, albumId);
}

export function getPhotoById(id: number): any {
  const db = getDb();
  return db.prepare(`
    SELECT p.*, u.display_name as uploader_name,
           (SELECT COUNT(*) FROM likes WHERE photo_id = p.id) as like_count,
           (SELECT COUNT(*) FROM comments WHERE photo_id = p.id) as comment_count
    FROM photos p
    JOIN users u ON p.uploader_id = u.id
    WHERE p.id = ?
  `).get(id);
}

export function getPhotosByAlbumId(albumId: number): any[] {
  const db = getDb();
  return db.prepare(`
    SELECT p.*, u.display_name as uploader_name,
           (SELECT COUNT(*) FROM likes WHERE photo_id = p.id) as like_count,
           (SELECT COUNT(*) FROM comments WHERE photo_id = p.id) as comment_count
    FROM photos p
    JOIN users u ON p.uploader_id = u.id
    WHERE p.album_id = ?
    ORDER BY p.created_at DESC
  `).all(albumId);
}

export function getPhotosByUserId(userId: number): any[] {
  const db = getDb();
  return db.prepare(`
    SELECT p.*, a.name as album_name,
           (SELECT COUNT(*) FROM likes WHERE photo_id = p.id) as like_count
    FROM photos p
    JOIN albums a ON p.album_id = a.id
    WHERE p.uploader_id = ?
    ORDER BY p.created_at DESC
  `).all(userId);
}

export function getAllPhotos(): any[] {
  const db = getDb();
  return db.prepare(`
    SELECT p.*, u.display_name as uploader_name, a.name as album_name,
           (SELECT COUNT(*) FROM likes WHERE photo_id = p.id) as like_count,
           (SELECT COUNT(*) FROM comments WHERE photo_id = p.id) as comment_count
    FROM photos p
    JOIN users u ON p.uploader_id = u.id
    JOIN albums a ON p.album_id = a.id
    ORDER BY p.created_at DESC
  `).all();
}

export function deletePhoto(id: number): any {
  const db = getDb();
  return db.prepare('DELETE FROM photos WHERE id = ?').run(id);
}

// ── Like Functions ──

export function toggleLike(userId: number, photoId: number): boolean {
  const db = getDb();
  const existing = db.prepare(
    'SELECT id FROM likes WHERE user_id = ? AND photo_id = ?'
  ).get(userId, photoId);

  if (existing) {
    db.prepare('DELETE FROM likes WHERE user_id = ? AND photo_id = ?').run(userId, photoId);
    return false;
  } else {
    db.prepare('INSERT INTO likes (user_id, photo_id) VALUES (?, ?)').run(userId, photoId);
    return true;
  }
}

export function isLikedByUser(userId: number, photoId: number): boolean {
  const db = getDb();
  const row = db.prepare(
    'SELECT id FROM likes WHERE user_id = ? AND photo_id = ?'
  ).get(userId, photoId);
  return !!row;
}

export function getLikeCount(photoId: number): number {
  const db = getDb();
  const row = db.prepare('SELECT COUNT(*) as count FROM likes WHERE photo_id = ?').get(photoId) as any;
  return row.count;
}

// ── Comment Functions ──

export function createComment(content: string, userId: number, photoId: number): any {
  const db = getDb();
  return db.prepare(
    'INSERT INTO comments (content, user_id, photo_id) VALUES (?, ?, ?)'
  ).run(content, userId, photoId);
}

export function getCommentsByPhotoId(photoId: number): any[] {
  const db = getDb();
  return db.prepare(`
    SELECT c.*, u.display_name as user_name, u.avatar_color
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.photo_id = ?
    ORDER BY c.created_at ASC
  `).all(photoId);
}

export function deleteComment(id: number): any {
  const db = getDb();
  return db.prepare('DELETE FROM comments WHERE id = ?').run(id);
}

// ── Admin Functions ──

export function getAllUsers(): any[] {
  const db = getDb();
  return db.prepare(`
    SELECT id, username, display_name, role, avatar_color, created_at,
           (SELECT COUNT(*) FROM photos WHERE uploader_id = users.id) as photo_count
    FROM users
    ORDER BY created_at DESC
  `).all();
}

export function deleteUser(id: number): any {
  const db = getDb();
  return db.prepare('DELETE FROM users WHERE id = ?').run(id);
}

export function getUserStats(userId: number) {
  return {
    photoCount: getUserPhotoCount(userId),
    albumCount: getUserAlbumCount(userId),
    likesReceived: getUserLikesReceived(userId),
  };
}

// ── Tag Functions ──

export function addTagToPhoto(photoId: number, tagName: string): any {
  const db = getDb();
  const trimmed = tagName.trim();
  if (!trimmed) return null;
  let tag: any = db.prepare('SELECT * FROM tags WHERE name = ?').get(trimmed);
  if (!tag) {
    const result = db.prepare('INSERT INTO tags (name) VALUES (?)').run(trimmed);
    tag = { id: result.lastInsertRowid, name: trimmed };
  }
  db.prepare('INSERT OR IGNORE INTO photo_tags (photo_id, tag_id) VALUES (?, ?)').run(photoId, tag.id);
  return tag;
}

export function removeTagFromPhoto(photoId: number, tagId: number): any {
  const db = getDb();
  return db.prepare('DELETE FROM photo_tags WHERE photo_id = ? AND tag_id = ?').run(photoId, tagId);
}

export function getTagsByPhotoId(photoId: number): any[] {
  const db = getDb();
  return db.prepare(`
    SELECT t.id, t.name FROM tags t
    JOIN photo_tags pt ON t.id = pt.tag_id
    WHERE pt.photo_id = ?
    ORDER BY t.name
  `).all(photoId);
}

export function getAllTags(): any[] {
  const db = getDb();
  return db.prepare(`
    SELECT t.id, t.name, COUNT(pt.photo_id) as photo_count
    FROM tags t
    LEFT JOIN photo_tags pt ON t.id = pt.tag_id
    GROUP BY t.id
    ORDER BY t.name
  `).all();
}

export function getPhotosByTag(tagId: number): any[] {
  const db = getDb();
  return db.prepare(`
    SELECT p.*, u.display_name as uploader_name, a.name as album_name,
           (SELECT COUNT(*) FROM likes WHERE photo_id = p.id) as like_count,
           (SELECT COUNT(*) FROM comments WHERE photo_id = p.id) as comment_count
    FROM photos p
    JOIN photo_tags pt ON p.id = pt.photo_id
    JOIN users u ON p.uploader_id = u.id
    JOIN albums a ON p.album_id = a.id
    WHERE pt.tag_id = ?
    ORDER BY p.created_at DESC
  `).all(tagId);
}
