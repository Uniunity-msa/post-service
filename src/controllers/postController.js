"use strict";

const Post = require("../models/post");
const { verifyTokenWithUserService } = require("../utils/userClient");

const postController = {
  // uploadPost: async (req, res) => {
  //   const post = new Post(req.body);
  //   const response = await post.createPost();
  //   return res.json(response);
  // },

  uploadPost: async (req, res) => {
      try {
        // 토큰 추출
        const authHeader = req.headers.authorization;
        if (!authHeader) {
          return res.status(401).json({ message: 'No token provided' });
        }
        const token = authHeader.split(" ")[1];

        // 유저 서비스에 토큰 검증 요청
        const authResult = await verifyTokenWithUserService(token);

        if (authResult.status !== 'success') {
          return res.status(401).json({ message: 'Invalid token' });
        }

        const user = authResult.user;

        // 3게시글 정보와 함께 유저 정보 포함시켜 Post 객체 생성
        const postDataWithUser = {
          ...req.body,
          user_email: user.user_email,
          user_nickname: user.user_nickname,
          university_id: user.university_id,
          university_url: user.university_url,
        };

        const post = new Post(postDataWithUser);
        const response = await post.createPost();
        return res.status(201).json(response);

      } catch (err) {
        console.error("게시글 업로드 실패:", err);
        return res.status(500).json({ message: "게시글 업로드 중 오류 발생" });
      }
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
  }
};

module.exports = postController;
