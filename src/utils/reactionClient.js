const axios = require('axios');
const REACTION_SERVICE_URL = 'http://post-reaction-service:3002'; // 이건 예시....이런식으로 구성

// ---------------------- 좋아요 ----------------------
exports.addHeart = async (data) => {
    const res = await axios.post(`${REACTION_SERVICE_URL}/addHeart`, data);
    return res.data;
  };
  
  exports.checkHeart = async (data) => {
    const res = await axios.post(`${REACTION_SERVICE_URL}/checkHeart`, data);
    return res.data;
  };
  
  exports.deleteHeart = async (heartId) => {
    const res = await axios.get(`${REACTION_SERVICE_URL}/deleteHeart/${heartId}`);
    return res.data;
  };
  
  exports.getPostHeartNum = async (postId) => {
    const res = await axios.get(`${REACTION_SERVICE_URL}/postHeartNum/${postId}`);
    return res.data;
  };
  
  // ---------------------- 스크랩 ----------------------
  // 스크랩 개수 반환 -> XXXX 그냥 내가 스크랩한 게시글 확인용으로만 사용
  exports.addScrap = async (data) => {
    const res = await axios.post(`${REACTION_SERVICE_URL}/addScrap`, data);
    return res.data;
  };
  
  exports.checkScrap = async (data) => {
    const res = await axios.post(`${REACTION_SERVICE_URL}/checkScrap`, data);
    return res.data;
  };
  
  exports.deleteScrap = async (scrapId) => {
    const res = await axios.get(`${REACTION_SERVICE_URL}/deleteScrap/${scrapId}`);
    return res.data;
  };
  
  // ---------------------- 댓글 ----------------------
  exports.getCommentsByPostId = async (postId) => {
    const res = await axios.get(`${REACTION_SERVICE_URL}/showComment/postviewer/${postId}`);
    return res.data;
  };
  
  exports.uploadComment = async (commentData) => {
    const res = await axios.post(`${REACTION_SERVICE_URL}/uploadComment/postviewer`, commentData);
    return res.data;
  };
  
  exports.deleteComment = async ({ postId, userEmail, commentId }) => {
    const res = await axios.delete(`${REACTION_SERVICE_URL}/doDeleteComment/${postId}/${userEmail}/${commentId}`);
    return res.data;
  };
  
  exports.getPostCommentNum = async (postId) => {
    const res = await axios.get(`${REACTION_SERVICE_URL}/postCommentNum/${postId}`);
    return res.data;
  };
  
  exports.getCommentWriter = async (commentId) => {
    const res = await axios.get(`${REACTION_SERVICE_URL}/getCommentWriter/${commentId}`);
    return res.data;
  };