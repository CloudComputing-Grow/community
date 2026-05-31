const db = require('../config/db');

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
      scrap_count AS scrapCount,
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
exports.getPostById = async ({ postId, userId }) => {
  let sql = `
    SELECT
      p.post_id AS postId,
      p.user_id AS userId,
      p.title,
      p.content,
      p.like_count AS likeCount,
      p.comment_count AS commentCount,
      p.scrap_count AS scrapCount,
      p.created_at AS createdAt
  `;

  const params = [];

  if (userId) {
    sql += `,
      EXISTS (
        SELECT 1
        FROM like_item
        WHERE target_type = 'post'
          AND target_id = p.post_id
          AND user_id = ?
      ) AS likedByUser,
      EXISTS (
        SELECT 1
        FROM scrap
        WHERE post_id = p.post_id
          AND user_id = ?
      ) AS scrappedByUser
    `;
    params.push(userId, userId);
  }

  sql += `
    FROM post p
    WHERE p.post_id = ?
  `;

  params.push(postId);

  const [rows] = await db.query(sql, params);
  return rows[0];
};

// 게시글 삭제
exports.deletePost = async ({ postId, userId }) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [posts] = await connection.query(
      `
      SELECT user_id AS userId
      FROM post
      WHERE post_id = ?
      `,
      [postId]
    );

    if (posts.length === 0) {
      await connection.rollback();
      return { status: 404 };
    }

    if (posts[0].userId !== Number(userId)) {
      await connection.rollback();
      return { status: 403 };
    }

    await connection.query(
      `
      DELETE FROM like_item
      WHERE target_type = 'post' AND target_id = ?
      `,
      [postId]
    );

    await connection.query(
      `
      DELETE FROM post
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

// 댓글 목록 조회
exports.getCommentsByPostId = async ({ postId, userId }) => {
  let sql = `
    SELECT
      comment_id AS commentId,
      post_id AS postId,
      user_id AS userId,
      content,
      like_count AS likeCount,
      created_at AS createdAt
  `;

  const params = [];

  if (userId) {
    sql += `,
      EXISTS (
        SELECT 1
        FROM like_item
        WHERE target_type = 'comment'
          AND target_id = c.comment_id
          AND user_id = ?
      ) AS likedByUser
    `;
    params.push(userId);
  }

  sql += `
    FROM \`comment\` c
    WHERE post_id = ?
    ORDER BY created_at ASC
  `;

  params.push(postId);

  const [rows] = await db.query(sql, params);
  return rows;
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

    // 댓글에 달린 좋아요 먼저 삭제
    await connection.query(
      `
      DELETE FROM like_item
      WHERE target_type = 'comment'
        AND target_id = ?
      `,
      [commentId]
    );

    // 댓글 삭제
    await connection.query(
      `
      DELETE FROM \`comment\`
      WHERE comment_id = ? AND post_id = ?
      `,
      [commentId, postId]
    );

    // 게시글 댓글 수 감소
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

// 게시글 좋아요 토글
exports.togglePostLike = async ({ postId, userId }) => {
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
      await connection.rollback();
      return { status: 404 };
    }

    const [likes] = await connection.query(
      `
      SELECT like_id
      FROM like_item
      WHERE target_type = 'post'
        AND target_id = ?
        AND user_id = ?
      `,
      [postId, userId]
    );

    let liked;

    if (likes.length > 0) {
      await connection.query(
        `
        DELETE FROM like_item
        WHERE target_type = 'post'
          AND target_id = ?
          AND user_id = ?
        `,
        [postId, userId]
      );

      await connection.query(
        `
        UPDATE post
        SET like_count = GREATEST(like_count - 1, 0)
        WHERE post_id = ?
        `,
        [postId]
      );

      liked = false;
    } else {
      await connection.query(
        `
        INSERT INTO like_item (target_type, target_id, user_id)
        VALUES ('post', ?, ?)
        `,
        [postId, userId]
      );

      await connection.query(
        `
        UPDATE post
        SET like_count = like_count + 1
        WHERE post_id = ?
        `,
        [postId]
      );

      liked = true;
    }

    const [[countRow]] = await connection.query(
      `
      SELECT like_count AS likeCount
      FROM post
      WHERE post_id = ?
      `,
      [postId]
    );

    await connection.commit();

    return {
      liked,
      likeCount: countRow.likeCount,
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

// 댓글 좋아요 토글
exports.toggleCommentLike = async ({ commentId, userId }) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [comments] = await connection.query(
      `
      SELECT comment_id
      FROM \`comment\`
      WHERE comment_id = ?
      `,
      [commentId]
    );

    if (comments.length === 0) {
      await connection.rollback();
      return { status: 404 };
    }

    const [likes] = await connection.query(
      `
      SELECT like_id
      FROM like_item
      WHERE target_type = 'comment'
        AND target_id = ?
        AND user_id = ?
      `,
      [commentId, userId]
    );

    let liked;

    if (likes.length > 0) {
      await connection.query(
        `
        DELETE FROM like_item
        WHERE target_type = 'comment'
          AND target_id = ?
          AND user_id = ?
        `,
        [commentId, userId]
      );

      await connection.query(
        `
        UPDATE \`comment\`
        SET like_count = GREATEST(like_count - 1, 0)
        WHERE comment_id = ?
        `,
        [commentId]
      );

      liked = false;
    } else {
      await connection.query(
        `
        INSERT INTO like_item (target_type, target_id, user_id)
        VALUES ('comment', ?, ?)
        `,
        [commentId, userId]
      );

      await connection.query(
        `
        UPDATE \`comment\`
        SET like_count = like_count + 1
        WHERE comment_id = ?
        `,
        [commentId]
      );

      liked = true;
    }

    const [[countRow]] = await connection.query(
      `
      SELECT like_count AS likeCount
      FROM \`comment\`
      WHERE comment_id = ?
      `,
      [commentId]
    );

    await connection.commit();

    return {
      liked,
      likeCount: countRow.likeCount,
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

// 게시글 스크랩 토글
exports.togglePostScrap = async ({ postId, userId }) => {
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
      await connection.rollback();
      return { status: 404 };
    }

    const [scraps] = await connection.query(
      `
      SELECT scrap_id
      FROM scrap
      WHERE post_id = ?
        AND user_id = ?
      `,
      [postId, userId]
    );

    let scrapped;

    if (scraps.length > 0) {
      await connection.query(
        `
        DELETE FROM scrap
        WHERE post_id = ?
          AND user_id = ?
        `,
        [postId, userId]
      );

      await connection.query(
        `
        UPDATE post
        SET scrap_count = GREATEST(scrap_count - 1, 0)
        WHERE post_id = ?
        `,
        [postId]
      );

      scrapped = false;
    } else {
      await connection.query(
        `
        INSERT INTO scrap (post_id, user_id)
        VALUES (?, ?)
        `,
        [postId, userId]
      );

      await connection.query(
        `
        UPDATE post
        SET scrap_count = scrap_count + 1
        WHERE post_id = ?
        `,
        [postId]
      );

      scrapped = true;
    }

    const [[countRow]] = await connection.query(
      `
      SELECT scrap_count AS scrapCount
      FROM post
      WHERE post_id = ?
      `,
      [postId]
    );

    await connection.commit();

    return {
      scrapped,
      scrapCount: countRow.scrapCount,
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

// 내 스크랩 목록 조회
exports.getMyScraps = async (userId) => {
  const sql = `
    SELECT
      s.scrap_id AS scrapId,
      s.post_id AS postId,
      p.user_id AS postUserId,
      p.title,
      p.content,
      p.like_count AS likeCount,
      p.comment_count AS commentCount,
      p.scrap_count AS scrapCount,
      s.created_at AS scrappedAt,
      p.created_at AS postCreatedAt
    FROM scrap s
    JOIN post p ON s.post_id = p.post_id
    WHERE s.user_id = ?
    ORDER BY s.created_at DESC
  `;

  const [rows] = await db.query(sql, [userId]);
  return rows;
};