"use strict";

const PostStorage = require("./postStorage");
const UserClient = require("../utils/userClient");
const ReactionClient = require("../utils/reactionClient");
const amqp = require('amqplib/callback_api');
const { v4: uuidv4 } = require('uuid');

class Post {
  constructor(data) {
      this.body = data;
      this.channel = null;
  }

  async connectToRabbitMQ() {
    const rabbitUrl = process.env.RABBIT || 'amqp://localhost';
    const QUEUES = [
      'CommentRequestQueue',
      'HeartRequestQueue',
      'ScrapRequestQueue',
    ];
    for (let i = 0; i < RETRY_COUNT; i++) {
      try {
        const connection = await amqp.connect(rabbitUrl);
        channel = await connection.createChannel();
  
        // 모든 큐 선언 (필요 시 SEND_QUEUES 도 추가 가능)
        for (const queue of QUEUES) {
          await channel.assertQueue(queue, { durable: false });
        }
  
        console.log("✅ 게시글 불러오기 통신 RabbitMQ 연결 성공");
        return channel;
      } catch (err) {
        console.error(`❌ 게시글 불러오기 통신 RabbitMQ 연결 실패 (${i + 1}/${RETRY_COUNT}):`, err.message);
        if (i < RETRY_COUNT - 1) {
          await new Promise((res) => setTimeout(res, RETRY_DELAY));
        } else {
          console.error("💥 게시글 불러오기 통신 모든 재시도 실패. RabbitMQ 연결에 실패했습니다.");
          throw err;
        }
      }
    }
  }

  // // 채널이 준비될 때까지 기다리는 Promise를 반환
  // connectToRabbitMQ() {
  //     return new Promise((resolve, reject) => {
  //         amqp.connect('amqp://guest:guest@rabbit:5672', (err, connection) => { // 나중에 IP 주소 바꾸기
  //             if (err) {
  //                 console.error('RabbitMQ 연결 오류:', err);
  //                 reject(err);
  //                 return;
  //             }

  //             connection.createChannel((err, channel) => {
  //                 if (err) {
  //                     console.error('채널 생성 오류:', err);
  //                     reject(err);
  //                     return;
  //                 }

  //                 this.channel = channel;

  //                 // 큐 선언
  //                 this.channel.assertQueue('CommentRequestQueue', { durable: true });
  //                 this.channel.assertQueue('HeartRequestQueue', { durable: true });
  //                 this.channel.assertQueue('ScrapRequestQueue', { durable: true });  
                  
  //                 resolve(); // 채널 준비 완료 후 resolve
  //             });
  //         });
  //     });
  // }

//(마이페이지)내가 댓글 작성한 게시글 불러오기
async myCommunityCommentPost(user_email) {
try {
  const correlationId = uuidv4();

  //응답 받을 임시큐
  const tempQueue = await new Promise((resolve, reject) => {
    this.channel.assertQueue('', { exclusive: true }, (err, q) => {
      if (err) return reject(err);
      resolve(q.queue);
    });
  });

  const message = { user_email};

  // 응답 대기 
  const response = await new Promise((resolve, reject) => {
    this.channel.consume(tempQueue, async (msg) => {
      if (msg.properties.correlationId === correlationId) {
        //테스트용
        console.log('[post-service] CommentRequestQueue 메시지 수신:', msg.content.toString());
           
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
async getUserHeartList(user_email) {
  try {
    if (!this.channel) {
      throw new Error('채널이 아직 초기화되지 않았습니다.');
    }

    const correlationId = uuidv4();

    // 임시 응답 큐 생성
    const tempQueue = await new Promise((resolve, reject) => {
      this.channel.assertQueue('', { exclusive: true }, (err, q) => {
        if (err) return reject(err);
        resolve(q.queue);
      });
    });

    const message = { user_email };

    // 응답 대기
    const response = await new Promise((resolve, reject) => {
      this.channel.consume(tempQueue, async (msg) => {
        if (msg.properties.correlationId === correlationId) {
          //테스트용
        console.log('[post-service] HeartRequestQueue 메시지 수신:', msg.content.toString());
         
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
async getUserScrapList(user_email) {
  try {
    if (!this.channel) {
      throw new Error('채널이 아직 초기화되지 않았습니다.');
    }

    const correlationId = uuidv4();

    // 임시 응답 큐 생성
    const tempQueue = await new Promise((resolve, reject) => {
      this.channel.assertQueue('', { exclusive: true }, (err, q) => {
        if (err) return reject(err);
        resolve(q.queue);
      });
    });

    const message = { user_email };

    // 응답 대기
    const response = await new Promise((resolve, reject) => {
      this.channel.consume(tempQueue, async (msg) => {
        if (msg.properties.correlationId === correlationId) {
          //테스트용
        console.log('[post-service] ScrapRequestQueue 메시지 수신:', msg.content.toString());
         
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
      const result = await PostStorage.goDeletePost(postId, userEmail);

      // 게시글 삭제에 성공했을 때만 댓글 삭제 요청
      if (result.result === true) {
        const commentDelete = await ReactionClient.deleteAllCommentsByPostId(postId);
        console.log("✅ 댓글 삭제 완료:", commentDelete);
      }

      return result;
    } catch (err) {
      console.error("❌ 게시글 삭제 또는 댓글 삭제 실패:", err);
      return { result: false, error: err.message || err };
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
      // 이미 user_nickname이 포함되어 있으므로 따로 가져올 필요 없음
      return response;
    } catch (err) {
      console.error("showPost 내부 에러:", err);
      return { err: err.message || "게시글 조회 중 오류 발생" };
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
   async myCommunityPost(user_email) {
    try {
        const response = await PostStorage.getMyPost(user_email);
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

async getComments(post_id) {
  try {
    const comments = await ReactionClient.getCommentsByPostId(post_id);
    return comments;
  } catch (err) {
    return { success: false, msg: err.message || err };
  }
}

//start-service 요청 처리: postId, imgUrl 보내기
  async getImagesInfo(university_id) {
    try{
      console.log('model/post.getImagesInfo 실행');
      const response = await PostStorage.getImagesInfo(university_id);
      return response;
    } catch (err) {
      return {success:false ,msg:err};
    }
  }

//댓글 증가감소

   async increaseCommentCount(post_id) {
    try {
      return await PostStorage.updatePostCommentCount(post_id);
    } catch (err) {
      return { result: false, msg: err.message || err };
    }
  }

  async decreaseCommentCount(post_id) {
    try {
      return await PostStorage.reducePostCommentCount(post_id);
    } catch (err) {
      return { result: false, msg: err.message || err };
    }
  }
}
        

module.exports = Post;
