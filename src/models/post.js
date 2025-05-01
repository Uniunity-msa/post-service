"use strict";

const PostStorage = require("./postStorage");
const UserClient = require("../utils/userClient");

class Post {
  constructor(body) {
    this.body = body;
  }

  async createPost() {
    const client = this.body;
    try {
      const response = await PostStorage.savePost(client);
      if (client.category === "총학생회 공지사항") {
        const response2 = await PostStorage.saveImagePost(
          response.post_id,
          response.postInfo.post_content,
          response.formattedDateTime
        );
        if (response.result && response2.result) {
          return response;
        }
      }
      return response;
    } catch (err) {
      return { err };
    }
  }

  async modifyPost() {
    const client = this.body;
    try {
      const response = await PostStorage.updatePost(client);
      const postInfo = await PostStorage.getPost(client.post_id);
      response.postInfo = postInfo;

      if (client.category === "총학생회 공지사항") {
        const response2 = await PostStorage.saveImagePost(
          response.post_id,
          response.postInfo.post_content,
          response.postInfo.post_date
        );
        if (response.result && response2.result) {
          return response;
        }
      }
      return response;
    } catch (err) {
      return { err };
    }
  }

  async doDeletePost(postId, userEmail) {
    try {
      return await PostStorage.goDeletePost(postId, userEmail);
    } catch (err) {
      return { err };
    }
  }

  async showPostListbyCategory(universityUrl, category) {
    try {
      const universityId = await PostStorage.getUniversityUrlToID(universityUrl);
      return await PostStorage.getPostListbyCategory(universityId, category);
    } catch (err) {
      return { success: false, msg: err };
    }
  }

  async showPostListAll(universityUrl) {
    try {
      const universityId = await PostStorage.getUniversityUrlToID(universityUrl);
      return await PostStorage.getPostListAll(universityId);
    } catch (err) {
      return { success: false, msg: err };
    }
  }

  async showPost(postId) {
    try {
      const response = await PostStorage.getPost(postId);
      const userInfo = await UserClient.getUserInfo(response.user_email);
      response.user_nickname = userInfo.user_nickname;
      return response;
    } catch (err) {
      return { err };
    }
  }

  async searchPost(keyword) {
    try {
      return await PostStorage.searchPost(keyword);
    } catch (err) {
      return { success: false, msg: err };
    }
  }

   //마이페이지-내가 작성한 게시글 보기
   async myCommunityPost() {
    try {
        const client = this.body;
        const response = await PostStorage.getMyPost(client);
        return response;
    } catch (err) {
        return {
            result: false,
            status: 500,
            msg: err
        };
    }
}

  async postWriter(postId) {
    try {
      return await PostStorage.postWriter(postId);
    } catch (err) {
      return { success: false, msg: err };
    }
  }
}

module.exports = Post;
