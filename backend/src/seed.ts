import { getDb } from './db';
import bcrypt from 'bcryptjs';

const db = getDb();

// Clear existing data
db.exec('DELETE FROM comments');
db.exec('DELETE FROM likes');
db.exec('DELETE FROM photos');
db.exec('DELETE FROM albums');
db.exec('DELETE FROM users');
db.exec("DELETE FROM sqlite_sequence WHERE name IN ('users','albums','photos','likes','comments')");

const hash = bcrypt.hashSync('123456', 10);

// Create users
db.prepare(`INSERT INTO users (username, password_hash, display_name, role, avatar_color) VALUES (?, ?, ?, ?, ?)`).run('admin', hash, '管理员', 'admin', '#E74C3C');
db.prepare(`INSERT INTO users (username, password_hash, display_name, role, avatar_color) VALUES (?, ?, ?, ?, ?)`).run('dad', hash, '爸爸', 'member', '#3498DB');
db.prepare(`INSERT INTO users (username, password_hash, display_name, role, avatar_color) VALUES (?, ?, ?, ?, ?)`).run('mom', hash, '妈妈', 'member', '#E91E63');
db.prepare(`INSERT INTO users (username, password_hash, display_name, role, avatar_color) VALUES (?, ?, ?, ?, ?)`).run('kid', hash, '小明', 'member', '#27AE60');
db.prepare(`INSERT INTO users (username, password_hash, display_name, role, avatar_color) VALUES (?, ?, ?, ?, ?)`).run('grandma', hash, '奶奶', 'member', '#9B59B6');

// Helper: generate a photo placeholder color
function photoColor(seed: number): string {
  const colors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
    'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
    'linear-gradient(135deg, #f5576c 0%, #ff6a88 100%)',
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
    'linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)',
    'linear-gradient(135deg, #9890e3 0%, #b1f4cf 100%)',
    'linear-gradient(135deg, #ebc0fd 0%, #d9ded8 100%)',
    'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
    'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
  ];
  return colors[seed % colors.length];
}

function emoji(seed: number): string {
  const emojis = ['🌸', '🏖️', '🎂', '🎄', '🌅', '🎈', '🌻', '🐱', '🐶', '🍜', '🏖️', '🎉', '🌈', '🏔️', '🎄', '🎂'];
  return emojis[seed % emojis.length];
}

// Create albums
const albums = [
  { name: '2024春节', description: '全家团聚，欢度新春', creatorId: 1 },
  { name: '宝宝成长', description: '记录小明的每一天', creatorId: 3 },
  { name: '暑假旅行', description: '2024年夏天的海边之旅', creatorId: 2 },
  { name: '奶奶的花园', description: '奶奶精心照料的花草', creatorId: 5 },
  { name: '家庭聚餐', description: '每周日的家庭晚餐时光', creatorId: 2 },
  { name: '生日快乐', description: '家人们的生日庆祝', creatorId: 3 },
];

const insertAlbum = db.prepare('INSERT INTO albums (name, description, creator_id) VALUES (?, ?, ?)');
const insertPhoto = db.prepare('INSERT INTO photos (title, description, taken_date, image_data, uploader_id, album_id) VALUES (?, ?, ?, ?, ?, ?)');
const insertLike = db.prepare('INSERT OR IGNORE INTO likes (user_id, photo_id) VALUES (?, ?)');
const insertComment = db.prepare('INSERT INTO comments (content, user_id, photo_id) VALUES (?, ?, ?)');

const photoSeeds = [
  // Album 1: 春节
  [
    { title: '团圆饭', desc: '满满一桌子菜，全家围坐', date: '2024-02-09' },
    { title: '放烟花', desc: '除夕夜的烟花，好漂亮', date: '2024-02-09' },
    { title: '贴春联', desc: '爸爸在门口贴春联', date: '2024-02-08' },
    { title: '发红包', desc: '奶奶给孩子们发红包', date: '2024-02-10' },
    { title: '全家福', desc: '难得的全家合影', date: '2024-02-10' },
    { title: '年夜饭准备', desc: '妈妈和奶奶在厨房忙碌', date: '2024-02-09' },
  ],
  // Album 2: 宝宝成长
  [
    { title: '第一次翻身', desc: '小明终于学会翻身啦', date: '2024-01-15' },
    { title: '笑眯眯', desc: '今天心情特别好', date: '2024-02-01' },
    { title: '吃辅食', desc: '第一次吃米糊，表情好搞笑', date: '2024-03-10' },
    { title: '学走路', desc: '扶着沙发站起来啦', date: '2024-04-20' },
    { title: '玩积木', desc: '专注的小模样', date: '2024-05-05' },
  ],
  // Album 3: 暑假旅行
  [
    { title: '出发啦', desc: '一家人的旅行开始', date: '2024-07-15' },
    { title: '海边日出', desc: '清晨五点起来看日出', date: '2024-07-16' },
    { title: '沙滩城堡', desc: '爸爸堆的沙滩城堡', date: '2024-07-16' },
    { title: '吃海鲜', desc: '新鲜的海鲜大餐', date: '2024-07-17' },
    { title: '海边合照', desc: '全家在海边的合影', date: '2024-07-17' },
    { title: '落日余晖', desc: '海边的落日美极了', date: '2024-07-17' },
    { title: '回程', desc: '依依不舍地踏上归途', date: '2024-07-18' },
  ],
  // Album 4: 奶奶的花园
  [
    { title: '月季盛开', desc: '红色月季开得真好', date: '2024-04-15' },
    { title: '向日葵', desc: '向日葵朝着太阳笑', date: '2024-05-20' },
    { title: '多肉合集', desc: '奶奶养的多肉植物', date: '2024-06-01' },
    { title: '茉莉花开', desc: '满院飘香的茉莉', date: '2024-06-10' },
  ],
  // Album 5: 家庭聚餐
  [
    { title: '火锅之夜', desc: '周末在家涮火锅', date: '2024-03-24' },
    { title: '包饺子', desc: '全家一起包饺子', date: '2024-04-07' },
    { title: '烧烤聚会', desc: '院子里的BBQ派对', date: '2024-05-12' },
    { title: '生日蛋糕', desc: '自己做的蛋糕', date: '2024-06-02' },
  ],
  // Album 6: 生日快乐
  [
    { title: '吹蜡烛', desc: '许愿时间到', date: '2024-03-15' },
    { title: '拆礼物', desc: '好期待礼物里面是什么', date: '2024-03-15' },
    { title: '生日合影', desc: '生日快乐！', date: '2024-03-15' },
  ],
];

const transaction = db.transaction(() => {
  let photoId = 0;

  albums.forEach((album, ai) => {
    const result = insertAlbum.run(album.name, album.description, album.creatorId);
    const albumId = result.lastInsertRowid;

    const photos = photoSeeds[ai];
    photos.forEach((photo, pi) => {
      insertPhoto.run(
        photo.title,
        photo.desc,
        photo.date,
        photoColor(photoId),
        album.creatorId,
        albumId
      );
      photoId++;
    });
  });

  // Update album covers
  db.prepare(`
    UPDATE albums SET cover_image = (
      SELECT image_data FROM photos WHERE album_id = albums.id ORDER BY created_at LIMIT 1
    )
  `).run();

  // Add likes
  const totalPhotos = photoId;
  for (let i = 1; i <= 5; i++) {
    for (let p = 1; p <= totalPhotos; p++) {
      if (Math.random() > 0.4) {
        insertLike.run(i, p);
      }
    }
  }

  // Add comments
  const commentTexts = [
    '拍得真好看！', '好温馨的画面', '想念大家', '太可爱了',
    '下次还要一起去', '这照片拍得太棒了', '好幸福啊', '笑死我了',
    '好想回到那个时候', '好香啊，看得我饿了', '下次再一起',
  ];

  for (let p = 1; p <= totalPhotos; p++) {
    const numComments = Math.floor(Math.random() * 4);
    for (let c = 0; c < numComments; c++) {
      const userId = Math.floor(Math.random() * 5) + 1;
      const text = commentTexts[Math.floor(Math.random() * commentTexts.length)];
      insertComment.run(text, userId, p);
    }
  }
});

transaction();

console.log('Seed data inserted successfully!');
console.log('Users: admin, dad, mom, kid, grandma (all passwords: 123456)');
console.log('Albums: 6');
console.log('Photos: 29');
process.exit(0);
