const db = require('../config/db');

const communityEventController = {
  handleUserDeleted: async (eventData) => {
    const userId = eventData.userId;
    if (!userId) return;

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 좋아요 삭제
      await connection.query(
        'DELETE FROM like_item WHERE user_id = ?',
        [userId]
      );

      // 스크랩 삭제
      await connection.query(
        'DELETE FROM scrap WHERE user_id = ?',
        [userId]
      );

      // 댓글 좋아요 삭제 (댓글 삭제 전에)
      await connection.query(
        `DELETE li FROM like_item li
         JOIN \`comment\` c ON li.target_type = 'comment' AND li.target_id = c.comment_id
         WHERE c.user_id = ?`,
        [userId]
      );

      // 댓글 삭제
      await connection.query(
        'DELETE FROM `comment` WHERE user_id = ?',
        [userId]
      );

      // 게시글 좋아요 삭제 (게시글 삭제 전에)
      await connection.query(
        `DELETE li FROM like_item li
         JOIN post p ON li.target_type = 'post' AND li.target_id = p.post_id
         WHERE p.user_id = ?`,
        [userId]
      );

      // 게시글 스크랩 삭제
      await connection.query(
        `DELETE s FROM scrap s
         JOIN post p ON s.post_id = p.post_id
         WHERE p.user_id = ?`,
        [userId]
      );

      // 게시글 삭제
      await connection.query(
        'DELETE FROM post WHERE user_id = ?',
        [userId]
      );

      await connection.commit();
      console.log(`[community] 유저 ${userId} 회원탈퇴 → 데이터 삭제 완료`);
    } catch (err) {
      await connection.rollback();
      console.error(`[community] 유저 ${userId} 데이터 삭제 실패:`, err.message);
    } finally {
      connection.release();
    }
  }
};

module.exports = communityEventController;