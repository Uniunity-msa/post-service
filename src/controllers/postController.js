"use strict";

const Post = require("../models/post");

const { fetchUserInfoFromUserService } = require("../utils/userClient");
const post = new Post();
const postWithRabbitMQ = new Post(); // 전역 인스턴스


// 서버 시작할 때 RabbitMQ 연결해두기
postWithRabbitMQ.connectToRabbitMQ()
  .then(() => console.log("RabbitMQ 사전 연결 완료"))
  .catch((err) => console.error("RabbitMQ 사전 연결 실패", err));

  
const postController = {
  // uploadPost: async (req, res) => {
  //   const post = new Post(req.body);
  //   const response = await post.createPost();
  //   return res.json(response);
  // },

  // 게시글 업로드
  uploadPost: async (req, res) => {
      try {
        // 1. 클라이언트가 보낸 쿠키를 user-service에 그대로 전달
        const user = await fetchUserInfoFromUserService(req.headers.cookie);

        // 2. 사용자 정보를 게시글 데이터에 포함
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
        return res.status(401).json({ message: "로그인이 필요합니다." });
      }
    },

  // 전체 게시글 목록 반환
  postAll: async (req, res) => {
    const post = new Post();
    const response = await post.showPostListAll(req.params.university_url);
    return res.json(response);
  },
  // 단일 게시글 상세 조회
  showPost: async (req, res) => {
    const post = new Post();
    const response = await post.showPost(req.params.post_id);
    return res.json(response);
  },

  // 게시글 수정
  modifyPost: async (req, res) => {
    const post = new Post(req.body);
    const response = await post.modifyPost();
    return res.json(response);
  },
  // 카테고리별 게시글 조회
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

  // 키워드 기반 게시글 검색
  searchPost: async (req, res) => {
    const post = new Post();
    const response = await post.searchPost(req.params.keyword);
    return res.json(response);
  },
  // 게시글 삭제
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
  // 게시글 작성자 정보 반환
  postWriter: async (req, res) => {
    const post = new Post();
    const response = await post.postWriter(req.params.post_id);
    return res.json(response);
  },

  
  //좋아요, 북마크, 댓글 증가감소
  increaseHeart: async (req, res) => {
    const { post_id } = req.body;
    const response = await post.increaseHeart(post_id);
    return res.status(200).json(response);
  },

  // 좋아요 수 감소
  decreaseHeart: async (req, res) => {
    const { post_id } = req.body;
    const response = await post.decreaseHeart(post_id);
    return res.status(200).json(response);
},
  // 스크랩 수 증가
  increaseScrap: async (req, res) => {
    const { post_id } = req.body;
    const response = await post.increaseScrap(post_id);
    return res.status(200).json(response);
  },
  // 스크랩 수 감소
  decreaseScrap: async (req, res) => {
    const { post_id } = req.body;
    const response = await post.decreaseScrap(post_id);
    return res.status(200).json(response);
},
  // 댓글 수 증가
  increaseComment: async (req, res) => {
    const { post_id } = req.body;
    const result = await PostStorage.updatePostCommentCount(post_id);
    return res.json(result);
  },
  // 댓글 수 감소
  decreaseComment: async (req, res) => {
    const { post_id } = req.body;
    const result = await PostStorage.reducePostCommentCount(post_id);
    return res.json(result);
  },


  // 마이페이지 → 내가 작성한 글 / 댓글 단 글 / 좋아요 / 스크랩 글 조회
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
