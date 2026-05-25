const db = require('../config/db');

exports.dbTest = async () => {
  const [rows] = await db.query('SELECT DATABASE() AS dbName');
  return rows[0];
};

// 게시글 작성
exports.createPost = async ({ userId, title, content }) => {
  const sql = `
    INSERT INTO post (user_id, title, content)
    VALUES (?, ?, ?)
  `;

  const [result] = await db.query(sql, [userId, title, content]);

  return {
    postId: result.insertId,
    userId: Number(userId),
    title,
    content,
  };
};

// 게시글 목록 조회 / 검색
exports.getPosts = async (search) => {
  let sql = `
    SELECT
      post_id AS postId,
      user_id AS userId,
      title,
      content,
      like_count AS likeCount,
      comment_count AS commentCount,
      created_at AS createdAt
    FROM post
  `;

  const params = [];

  if (search) {
    sql += `
      WHERE title LIKE ? OR content LIKE ?
    `;
    params.push(`%${search}%`, `%${search}%`);
  }

  sql += `
    ORDER BY created_at DESC
  `;

  const [rows] = await db.query(sql, params);
  return rows;
};

// 게시글 상세 조회
exports.getPostById = async (postId) => {
  const sql = `
    SELECT
      post_id AS postId,
      user_id AS userId,
      title,
      content,
      like_count AS likeCount,
      comment_count AS commentCount,
      created_at AS createdAt
    FROM post
    WHERE post_id = ?
  `;

  const [rows] = await db.query(sql, [postId]);
  return rows[0];
};

// 게시글 삭제
exports.deletePost = async ({ postId, userId }) => {
  const [posts] = await db.query(
    `
    SELECT user_id AS userId
    FROM post
    WHERE post_id = ?
    `,
    [postId]
  );

  if (posts.length === 0) {
    return { status: 404 };
  }

  if (posts[0].userId !== Number(userId)) {
    return { status: 403 };
  }

  await db.query(
    `
    DELETE FROM post
    WHERE post_id = ?
    `,
    [postId]
  );

  return { status: 200 };
};