const axios = require('axios');
const REACTION_SERVICE_URL = 'http://post-reaction-service:3002';

const ReactionClient = {
  async getCommentsByPostId(post_id) {
    try {
      const response = await axios.get(`${REACTION_SERVICE_URL}/showComment/postviewer/${post_id}`);
      return response.data;
    } catch (err) {
      console.error('❌ 댓글 조회 실패:', err.message || err);
      throw err;
    }
  },
  async deleteAllCommentsByPostId(post_id) {
    try {
      const response = await axios.delete(`${REACTION_SERVICE_URL}/deleteAllComments/${post_id}`);
      return response.data;
    } catch (err) {
      console.error('❌ 댓글 삭제 실패:', err.message || err);
      
    }
  }
};



module.exports = ReactionClient;
