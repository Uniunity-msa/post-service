"use strict";

const Post = require("../models/post");

const { fetchUserInfoFromUserService } = require("../utils/userClient");
const postWithRabbitMQ = new Post();
const { sendUniversityURL, receiveUniversityData, generateCorrelationId } = require("../rabbit/rabbitMQ");

// 서버 시작할 때 RabbitMQ 연결해두기
postWithRabbitMQ.connectToRabbitMQ()
  .then(() => console.log("RabbitMQ 사전 연결 완료"))
  .catch((err) => console.error("RabbitMQ 사전 연결 실패", err));

  
const postController = {

  // 게시글 업로드
  uploadPost: async (req, res) => {
      try {
	 console.log("🍪 클라이언트가 보낸 쿠키:", req.headers.cookie);
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

  getUniversityName: async (req, res) => {
    try {
            const university_url = req.body.university_url;
            const correlationId = generateCorrelationId();
            await sendUniversityURL(university_url, 'SendUniversityName', correlationId);
            const data = await receiveUniversityData('RecvPostUniversityName', correlationId)
            return res.json(data.university_name);
    }catch (err) {
            console.error('getUniversityName error:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    },

  // 전체 게시글 목록 반환
  postAll: async (req, res) => {
      try {
      const university_url = req.params.university_url;
      const correlationId = generateCorrelationId();
      // MQ로 university_id 받아오기
      await sendUniversityURL(university_url, 'SendUniversityID', correlationId);
      const rawData = await receiveUniversityData('RecvPostUniversityID', correlationId);
      console.log("rawData:", rawData);
      // 숫자면 객체로 감싸기
      const data = typeof rawData.university_id === 'number'
        ? { university_id: rawData.university_id }
        : rawData.university_id;
      console.log("rawData.university_id:", rawData.university_id);
      console.log("[postall]university_id: ", data.university_id);

      const post = new Post();
      const response = await post.showPostListAll(data.university_id);
      return res.json(response);
    } catch (err) {
      console.error("postAll error:", err);
      return res.status(500).json({ error: "학교 정보를 불러오지 못했습니다." });
    }
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

    try {
      const university_url = req.params.university_url;
      const correlationId = generateCorrelationId();
      // MQ로 university_id 받아오기
      await sendUniversityURL(university_url, 'SendUniversityID', correlationId);
      const rawData = await receiveUniversityData('RecvPostUniversityID', correlationId);
      
      // 숫자면 객체로 감싸기
      const data = typeof rawData.university_id === 'number'
        ? { university_id: rawData.university_id }
        : rawData.university_id
      const post = new Post();
      const response = await post.showPostListbyCategory(data.university_id, mappedCategory);
      return res.json(response);
    } catch (err) {
      console.error("카테고리별 게시글 조회 실패:", err);
      return res.status(500).json({ error: "학교 정보를 불러오지 못했습니다." });
    }
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
    const post = new Post(); 
    const { post_id } = req.body;
    const response = await post.increaseHeart(post_id);
    return res.status(200).json(response);
  },

  // 좋아요 수 감소
  decreaseHeart: async (req, res) => {
    const post = new Post(); 
    const { post_id } = req.body;
    const response = await post.decreaseHeart(post_id);
    return res.status(200).json(response);
},
  // 스크랩 수 증가
  increaseScrap: async (req, res) => {
    const post = new Post();
    const { post_id } = req.body;
    const response = await post.increaseScrap(post_id);
    return res.status(200).json(response);
  },
  // 스크랩 수 감소
  decreaseScrap: async (req, res) => {
    const post = new Post();
    const { post_id } = req.body;
    const response = await post.decreaseScrap(post_id);
    return res.status(200).json(response);
},
  // 댓글 수 증가
  increaseComment: async (req, res) => {
    const { post_id } = req.body;
    const post = new Post();
    const result = await post.increaseCommentCount(post_id);
    return res.json(result);
  },

  // 댓글 수 감소
  decreaseComment: async (req, res) => {
    const { post_id } = req.body;
    const post = new Post();
    const result = await post.decreaseCommentCount(post_id);
    return res.json(result);
  },

  // 마이페이지 → 내가 작성한 글 / 댓글 단 글 / 좋아요 / 스크랩 글 조회
  myCommunityPostData: async (req, res) => {
    try {
      if (!postWithRabbitMQ.channel) {
        await postWithRabbitMQ.connectToRabbitMQ();
      }  
      // 쿠키를 통해 사용자 정보 가져오기
      const user = await fetchUserInfoFromUserService(req.headers.cookie);
      const user_email = user.user_email;
      let response;
      if (req.params.category === '1') {
        response = await postWithRabbitMQ.myCommunityPost(user_email);
      } else if (req.params.category === '2') {
        response = await postWithRabbitMQ.myCommunityCommentPost(user_email);
      } else if (req.params.category === '3') {
        response = await postWithRabbitMQ.getUserHeartList(user_email);
      } else if (req.params.category === '4') {
        response = await postWithRabbitMQ.getUserScrapList(user_email);
      } else {
        return res.status(400).json({ error: 'Invalid category' });
      }
      return res.json(response);
    } catch (err) {
      console.error('myCommunityPostData error:', err);
      return res.status(401).json({ message: '로그인이 필요합니다.' });
    }
  },

  //댓글
  getComments: async (req, res) => {
    const post = new Post();
    const response = await post.getComments(req.params.post_id);
    return res.json(response);
  },

  // RabbitMQ로부터 받은 요청 처리
  getPostListWithImage: async (university_id) => {
    try {
      const postList = await Post.getImagesInfo(university_id); // storage에 만든 함수 호출
      return postList; // { post_info: [...] }
    } catch (error) {
      console.error("게시글+이미지 불러오기 실패:", error);
      throw error;
    }
  }

};

module.exports = postController;
