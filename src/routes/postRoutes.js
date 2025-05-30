"use strict";

const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");


router.post("/getUniversityName", postController.getUniversityName);
// 전체 게시글 불러오기
router.get("/postAll/:university_url", postController.postAll);

// 게시글 작성폼 (현재 output 기능은 제거, API 서버이므로 제외)

// 게시글 작성자 받아오기
router.get("/getPostWriter/:post_id", postController.postWriter);

// 게시글 수정
router.post("/modifyPost", postController.modifyPost);

// 게시글 보여주기
router.get("/showPost/:post_id", postController.showPost);

// 게시글 작성
router.post("/uploadPost", postController.uploadPost);

// 카테고리별 게시글 정렬
router.get("/showPostListbyCategory/:category/:university_url", postController.showPostListbyCategory);

// 게시글 검색
router.get("/searchPost/:keyword", postController.searchPost);

// 게시글 삭제
router.delete("/deletePost/:post_id/:user_email", postController.deletePost);


//좋아요, 북마크, 댓글 증가감소
router.patch("/increaseHeart", postController.increaseHeart);
router.patch("/decreaseHeart", postController.decreaseHeart);
router.patch("/increaseScrap", postController.increaseScrap);
router.patch("/decreaseScrap", postController.decreaseScrap);
router.patch("/increaseComment", postController.increaseComment);
router.patch("/decreaseComment", postController.decreaseComment);


// 사용자 반응 게시글 불러오기
router.post("/mypage/community/post/:category", postController.myCommunityPostData);

//댓글
router.get("/comments/:post_id", postController.getComments);


module.exports = router;
