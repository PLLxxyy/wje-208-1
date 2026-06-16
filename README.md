# 家庭相册共享 (Family Photo Album)

家人共享相册、上传照片、点赞评论的全栈 Web 应用。

## 功能特性

- 用户注册/登录（JWT 认证）
- 创建和管理相册（如"2024春节"、"宝宝成长"）
- 照片批量上传
- 首页相册列表，点进相册看照片网格
- 幻灯片播放模式
- 每张照片添加描述和拍摄日期
- 家人之间点赞和评论
- 个人中心：我上传的照片统计
- 管理员：管理相册和用户

## 技术栈

- **前端**: Vite + React 18 + TypeScript（端口 5208）
- **后端**: Express + TypeScript + better-sqlite3（端口 3208）
- **认证**: JWT + bcryptjs
- **开发工具**: concurrently

## 快速开始

```bash
# 安装所有依赖
npm run install:all

# 初始化数据库并填充种子数据
npm run seed

# 同时启动前后端开发服务器
npm run dev
```

访问 http://localhost:5208

## 测试账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin  | 123456 | 管理员 |
| dad    | 123456 | 家人 |
| mom    | 123456 | 家人 |
| kid    | 123456 | 家人 |

## 项目结构

```
├── package.json              # 根配置（concurrently）
├── README.md
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts           # Express 服务器入口
│       ├── db.ts              # 数据库初始化
│       ├── seed.ts            # 种子数据
│       ├── middleware/
│       │   └── auth.ts        # JWT 认证中间件
│       └── routes/
│           └── index.ts       # 所有 API 路由
└── frontend/
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── index.html             # 全局样式（<style> 标签）
    └── src/
        ├── main.tsx           # 入口
        ├── App.tsx            # 路由配置
        ├── App.css            # 保留（备用）
        ├── AuthContext.tsx    # 认证上下文
        ├── Layout.tsx         # 页面布局
        └── pages/             # 各页面组件
```
