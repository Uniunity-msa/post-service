"use strict";

const PostStorage = require("./postStorage");
const UserClient = require("../utils/userClient");
const amqp = require('amqplib/callback_api');
const { v4: uuidv4 } = require('uuid');

class Post {
  constructor(data) {
      this.body = data;
      this.channel = null;
  }

  // 채널이 준비될 때까지 기다리는 Promise를 반환
  connectToRabbitMQ() {
      return new Promise((resolve, reject) => {
          amqp.connect('amqp://guest:guest@rabbit:5672', (err, connection) => { // 나중에 IP 주소 바꾸기
              if (err) {
                  console.error('RabbitMQ 연결 오류:', err);
                  reject(err);
                  return;
              }

              connection.createChannel((err, channel) => {
                  if (err) {
                      console.error('채널 생성 오류:', err);
                      reject(err);
                      return;
                  }

                  this.channel = channel;

                  // 큐 선언
                  this.channel.assertQueue('CommentRequestQueue', { durable: true });
                  this.channel.assertQueue('HeartRequestQueue', { durable: true });
                  this.channel.assertQueue('ScrapRequestQueue', { durable: true });  
                  
                  resolve(); // 채널 준비 완료 후 resolve
              });
          });
      });
  }

//(마이페이지)내가 댓글 작성한 게시글 불러오기
async myCommunityCommentPost() {
try {
  const correlationId = uuidv4();

  //응답 받을 임시큐
  const tempQueue = await new Promise((resolve, reject) => {
    this.channel.assertQueue('', { exclusive: true }, (err, q) => {
      if (err) return reject(err);
      resolve(q.queue);
    });
  });

  const message = { 
    email: '20211138@sungshin.ac.kr', // 실제 email을 동적으로 받을 경우 수정 필요
  };

  // 응답 대기 
  const response = await new Promise((resolve, reject) => {
    this.channel.consume(tempQueue, async (msg) => {
      if (msg.properties.correlationId === correlationId) {
        const postIds = JSON.parse(msg.content.toString());
        const data = await PostStorage.getMyCommentPost(postIds);
        resolve(data);
      }
    }, { noAck: true });

    // 요청 메세지 보내기
    this.channel.sendToQueue('CommentRequestQueue', Buffer.from(JSON.stringify(message)), {
        replyTo: tempQueue,
        correlationId,
        persistent: true,
      }
    );
  });

  return response;

} catch (err) {
  return {
      result: false,
      status: 500,
      msg: err.message || err,
  };
}}

// 마이페이지) 유저 좋아요 목록 보기
async getUserHeartList() {
  try {
    if (!this.channel) {
      throw new Error('채널이 아직 초기화되지 않았습니다.');
    }

    const correlationId = uuidv4();
    const email = '20211151@sungshin.ac.kr';  // 실제 email을 동적으로 받을 경우 수정 필요

    // 임시 응답 큐 생성
    const tempQueue = await new Promise((resolve, reject) => {
      this.channel.assertQueue('', { exclusive: true }, (err, q) => {
        if (err) return reject(err);
        resolve(q.queue);
      });
    });

    const message = { email };

    // 응답 대기
    const response = await new Promise((resolve, reject) => {
      this.channel.consume(tempQueue, async (msg) => {
        if (msg.properties.correlationId === correlationId) {
          const postIds = JSON.parse(msg.content.toString());
          const data = await PostStorage.getUserHeartList(postIds);
          resolve(data);
        }
      }, { noAck: true });

      // 요청 메세지 보내기
      this.channel.sendToQueue('HeartRequestQueue', Buffer.from(JSON.stringify(message)), {
        replyTo: tempQueue,
        correlationId,
        persistent: true,
      });
    });

    return response;

  } catch (err) {
    return {
      result: false,
      status: 500,
      msg: err.message || err
    };
  }
}


// 마이페이지) 유저 스크랩 목록 보기
async getUserScrapList() {
  try {
    if (!this.channel) {
      throw new Error('채널이 아직 초기화되지 않았습니다.');
    }

    const correlationId = uuidv4();
    const email = '20211138@sungshin.ac.kr';  // 실제 email을 동적으로 받을 경우 수정 필요

    // 임시 응답 큐 생성
    const tempQueue = await new Promise((resolve, reject) => {
      this.channel.assertQueue('', { exclusive: true }, (err, q) => {
        if (err) return reject(err);
        resolve(q.queue);
      });
    });

    const message = { email };

    // 응답 대기
    const response = await new Promise((resolve, reject) => {
      this.channel.consume(tempQueue, async (msg) => {
        if (msg.properties.correlationId === correlationId) {
          const postIds = JSON.parse(msg.content.toString());
          const data = await PostStorage.getUserScrapList(postIds);
          resolve(data);
        }
      }, { noAck: true });

      // 요청 메세지 보내기
      this.channel.sendToQueue('ScrapRequestQueue', Buffer.from(JSON.stringify(message)), {
        replyTo: tempQueue,
        correlationId,
        persistent: true,
      });
    });

    return response;

  } catch (err) {
    return {
      result: false,
      status: 500,
      msg: err.message || err
    };
  }
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

  async showPostListbyCategory(universityId, category) {
    try {
      return await PostStorage.getPostListbyCategory(universityId, category);
    } catch (err) {
      return { success: false, msg: err };
    }
  }

  async showPostListAll(universityId) {
    try {
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
        const response = await PostStorage.getMyPost('20211138@sungshin.ac.kr');
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
  //좋아요 증가감소

  async increaseHeart(post_id) {
  try {
    return await PostStorage.updatePostLikeCount(post_id, +1);
  } catch (err) {
    return { result: false, msg: err.message || err };
  }
  }

  async decreaseHeart(post_id) {
    try {
      return await PostStorage.updatePostLikeCount(post_id, -1);
    } catch (err) {
      return { result: false, msg: err.message || err };
    }
  }

  //스크랩 증가감소
  async increaseScrap(post_id) {
  try {
    return await PostStorage.updatePostScrapCount(post_id, +1);
  } catch (err) {
    return { result: false, msg: err.message || err };
  }
  } 

  async decreaseScrap(post_id) {
  try {
    return await PostStorage.updatePostScrapCount(post_id, -1);
  } catch (err) {
    return { result: false, msg: err.message || err };
  }
}
}
        

module.exports = Post;
