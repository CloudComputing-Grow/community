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

// 댓글 작성
exports.createComment = async ({ postId, userId, content }) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [posts] = await connection.query(
      `
      SELECT post_id
      FROM post
      WHERE post_id = ?
      `,
      [postId]
    );

    if (posts.length === 0) {
      const error = new Error('게시글이 존재하지 않습니다.');
      error.status = 404;
      throw error;
    }

    const [result] = await connection.query(
      `
      INSERT INTO \`comment\` (post_id, user_id, content)
      VALUES (?, ?, ?)
      `,
      [postId, userId, content]
    );

    await connection.query(
      `
      UPDATE post
      SET comment_count = comment_count + 1
      WHERE post_id = ?
      `,
      [postId]
    );

    await connection.commit();

    return {
      commentId: result.insertId,
      postId: Number(postId),
      userId: Number(userId),
      content,
    };
  } catch (err) {
    await connection.rollback();

    if (err.status === 404) {
      return { status: 404 };
    }

    throw err;
  } finally {
    connection.release();
  }
};

// 댓글 삭제
exports.deleteComment = async ({ postId, commentId, userId }) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [comments] = await connection.query(
      `
      SELECT comment_id AS commentId, user_id AS userId
      FROM \`comment\`
      WHERE comment_id = ? AND post_id = ?
      `,
      [commentId, postId]
    );

    if (comments.length === 0) {
      await connection.rollback();
      return { status: 404 };
    }

    if (comments[0].userId !== Number(userId)) {
      await connection.rollback();
      return { status: 403 };
    }

    await connection.query(
      `
      DELETE FROM \`comment\`
      WHERE comment_id = ? AND post_id = ?
      `,
      [commentId, postId]
    );

    await connection.query(
      `
      UPDATE post
      SET comment_count = GREATEST(comment_count - 1, 0)
      WHERE post_id = ?
      `,
      [postId]
    );

    await connection.commit();

    return { status: 200 };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};