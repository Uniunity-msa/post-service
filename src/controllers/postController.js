"use strict";

const Post = require("../models/post");
const post = new Post();
const postWithRabbitMQ = new Post(); // 전역 인스턴스

// 서버 시작할 때 RabbitMQ 연결해두기
postWithRabbitMQ.connectToRabbitMQ()
  .then(() => console.log("RabbitMQ 사전 연결 완료"))
  .catch((err) => console.error("RabbitMQ 사전 연결 실패", err));

  
const postController = {
  uploadPost: async (req, res) => {
    const post = new Post(req.body);
    const response = await post.createPost();
    return res.json(response);
  },

  postAll: async (req, res) => {
    const post = new Post();
    const response = await post.showPostListAll(req.params.university_url);
    return res.json(response);
  },

  showPost: async (req, res) => {
    const post = new Post();
    const response = await post.showPost(req.params.post_id);
    return res.json(response);
  },

  modifyPost: async (req, res) => {
    const post = new Post(req.body);
    const response = await post.modifyPost();
    return res.json(response);
  },

  showPostListbyCategory: async (req, res) => {
    const categoryMap = {
      chat: "잡담",
      affiliate_registration: "제휴 등록",
      affiliate_referral: "제휴 추천",
      affiliate_offer: "제휴 제안",
      announcement: "총학생회 공지사항",
      store_promotion: "가게 홍보"
    };

    const mappedCategory = categoryMap[req.params.category];
    if (!mappedCategory) {
      return res.status(400).json({ error: "Invalid category" });
    }

    const post = new Post();
    const response = await post.showPostListbyCategory(req.params.university_url, mappedCategory);
    return res.json(response);
  },

  searchPost: async (req, res) => {
    const post = new Post();
    const response = await post.searchPost(req.params.keyword);
    return res.json(response);
  },

  deletePost: async (req, res) => {
    try {
      const post = new Post();
      const response = await post.doDeletePost(req.params.post_id, req.params.user_email);
      return res.json(response);
    } catch (err) {
      console.error("게시글 삭제 실패:", err);
      return res.status(500).json({ error: "게시글 삭제에 실패하였습니다." });
    }
  },

  postWriter: async (req, res) => {
    const post = new Post();
    const response = await post.postWriter(req.params.post_id);
    return res.json(response);
  },


  myCommunityPostData: async (req, res) => {
    const category = req.params.category;
    let response;
    if (category === '1') {
        response = await postWithRabbitMQ.myCommunityPost();
    } else if (category === '2') {
        response = await postWithRabbitMQ.myCommunityCommentPost();
    } else if (category === '3') {
        response = await postWithRabbitMQ.getUserHeartList();
    } else if (category === '4') {
        response = await postWithRabbitMQ.getUserScrapList();
    }
    return res.json(response);
  }

};

module.exports = postController;
