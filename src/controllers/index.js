"use strict"

const express =require("express");
const router = express.Router();
const cors = require('cors');
const ctrl = require("./home.ctrl");

//전체게시글 불러오기
router.get("/postAll/:university_url",ctrl.post.postAll);
//게시글 작성폼
router.get("/postform/:university_url",ctrl.output.postform);
// ??
router.get("/postviewer/:post_id",ctrl.output.postviewer);
//게시글 수정
router.get("postform/modify",ctrl.output.postformModify);
//게시글 작성자 받아오기
router.get("/getPostWriter/:post_id",ctrl.post.postWriter);
//게시글 수정
router.post("/modifyPost",ctrl.post.modifyPost);
//게시글 보여주기
router.get("/showPost/:post_id",ctrl.post.showPost);
//게시글 작성
router.post("/uploadPost",ctrl.post.uploadPost);
//카테고리별 게시글 정렬
router.get("/showPostListbyCategory/:category/:university_url",ctrl.post.showPostListbyCategory);
//게시글 검색
router.get('/searchPost/:keyword',ctrl.post.searchPost);
// ??
router.get("/showPostListAll/:university_url",ctrl.output.post);

module.exports=router;