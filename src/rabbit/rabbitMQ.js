const amqp = require("amqplib");

const RECV_QUEUES = [
  'RecvPostUniversityName',
  'RecvPostUniversityID',
  'RecvPostList',
  'SendPostList'
  
];

let channel;

async function connectRabbitMQ() {
  const rabbitUrl = process.env.RABBIT || 'amqp://localhost'; // env 변수 사용, 없으면 localhost 기본
  const connection = await amqp.connect(rabbitUrl);
  channel = await connection.createChannel();

  // 모든 RECV 큐 선언
  for (const queue of RECV_QUEUES) {
    await channel.assertQueue(queue, { durable: false });
  }

  return channel;
}

// university_url을 전송
async function sendUniversityURL(university_url, sendQueueName) {
  if (!channel) await connectRabbitMQ();
  let recvQueueName;
  if(sendQueueName == 'SendUniversityName'){
    recvQueueName = 'RecvPostUniversityName';
  } else if(sendQueueName == 'SendUniversityID'){
    recvQueueName = 'RecvPostUniversityID';
  } else{
    console.log("명시되지 않은 sendQueueName 입니다.");
  }

  channel.sendToQueue(
    sendQueueName,  // 올바르게 인자로 받은 큐 이름 사용
    Buffer.from(JSON.stringify({ university_url })),
    {
      replyTo: recvQueueName,
    }
  );
}

// university data 수신
async function receiveUniversityData(queueName) {
  if (!channel) await connectRabbitMQ();

  if (!RECV_QUEUES.includes(queueName)) {
    throw new Error(`알 수 없는 수신 큐: ${queueName}`);
  }

  // 최대 10번까지, 300ms 간격으로 메시지 수신 시도
  for (let i = 0; i < 10; i++) {
    const msg = await channel.get(queueName, { noAck: false });
    if (msg) {
      const data = JSON.parse(msg.content.toString());
      console.log(`[post] ${queueName} 수신:`, data);
      channel.ack(msg);
      return data;
    }
    // 메시지가 없으면 300ms 대기 후 재시도
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  throw new Error(`${queueName} 큐에서 메시지를 받지 못했습니다.`);
}


// 게시글 목록 요청 처리 (post-service에서 consume)
async function consumePostListRequest(callback) {
    try {
    if (!channel) {
      console.log("[post] RabbitMQ 채널 없음 → 연결 시도");
      await connectRabbitMQ();
    }

    const queueName = 'SendPostList';
    await channel.assertQueue(queueName, { durable: false });
    console.log(`[post] 큐 구독 시작: ${queueName}`);

    channel.consume(queueName, async (msg) => {
      if (msg !== null) {
        console.log("[post] 메시지 수신됨");

        try {
          const { university_id } = JSON.parse(msg.content.toString());
          console.log(`[post]  게시글 목록 요청 수신 → university_id=${university_id}`);

          // 컨트롤러 없이 직접 DB 접근
          const result = await require('../models/postStorage').getImagesInfo(university_id);

          const replyQueue = msg.properties.replyTo;
          const correlationId = msg.properties.correlationId || null;

          if (!replyQueue) {
            console.error("[post]  replyTo가 undefined입니다. 응답 보낼 큐가 없습니다.");
            return;
          }

          channel.sendToQueue(
            replyQueue,
            Buffer.from(JSON.stringify(result)),
            { correlationId }
          );
          console.log(`[post]  응답 전송 완료 → replyTo=${replyQueue}, correlationId=${correlationId}`);

          channel.ack(msg);
          console.log("[post]  메시지 ack 완료");
        } catch (err) {
          console.error("[post]  메시지 처리 중 에러:", err);
        }

      } else {
        console.warn("[post] ❕ null 메시지 수신됨 → 무시함");
      }
    });
  } catch (err) {
    console.error("[post]  consumePostListRequest 초기화 중 에러:", err);
  }
}


module.exports = {
  sendUniversityURL,
  receiveUniversityData,
  consumePostListRequest
};