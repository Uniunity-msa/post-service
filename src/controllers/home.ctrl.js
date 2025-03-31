"use strict"

const Post = require("../models/Post");

const output = {
    postform: (req, res) => {
        res.render('post/postform.html');
    },
    postviewer: (req, res) => {
        res.render('post/postviewer.html');
    },
    postformModify:(req,res)=>{
        res.render('post/postform.html');
    },
    post: (req, res) => {
        res.render('post/post.html');
    },
}

const post = {
    uploadPost: async (req, res) => {
        const post = new Post(req.body);
        const response = await post.createPost();
        return res.json(response);
    },

    postAll: async (req, res) => {
        let university_url = req.params.university_url;
        const post = new Post();
        const response = await post.showPostListAll(university_url);
        return res.json(response);
    },
    showPost: async (req, res) => {
        let post_id = req.params.post_id;
        const post = new Post();
        const response = await post.showPost(post_id);
        return res.json(response);

    },
    modifyPost:async(req,res)=>{
        const post=new Post(req.body);
        const response = await post.modifyPost();
        return res.json(response);

    },
    showPostListbyCategory: async (req, res) => {
        let university_url = req.params.university_url;
        let category = req.params.category;

        if (category === "chat")
            category = "잡담";
        else if (category === "affiliate_registration")
            category = "제휴 등록";
        else if (category === "affiliate_referral")
            category = "제휴 추천";
        else if (category === "affiliate_offer")
            category = "제휴 제안";
        else if (category === "announcement")
            category = "총학생회 공지사항";
        else if (category === "store_promotion")
            category = "가게 홍보";
        else {
            res.status(404).send({ success: false, err: "404 Not Found" });
        }
        //else return res.json({success:false ,err:"url 잘못입력"});
        const post = new Post();
        const response = await post.showPostListbyCategory(university_url, category);
        return res.json(response);
    },
    searchPost: async (req, res) => {
        const post = new Post();
        const response = await post.searchPost(req.params.keyword);
        return res.json(response);

    },
    DeletePost: async (req, res) => {
        let post_id = req.params.post_id;
        let user_email = req.params.user_email;

        try {
            const post = new Post();
            const response = await post.doDeletePost(post_id, user_email);
            return res.json(response);
        } catch (err) {
            console.error('게시글 삭제 실패:', err);
            return res.status(500).json({ error: '게시글 삭제에 실패하였습니다.' });
        }
    },
    // 게시글 작성자 반환
    postWriter: async (req, res) => {
        const post = new Post();
        const response = await post.postWriter(req.params.post_id);
        return res.json(response);
    }
}

module.exports = {post, output};