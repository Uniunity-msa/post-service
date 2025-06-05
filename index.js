const express = require("express");
const path = require("path");
const postRouter = require("./src/routes/postRoutes");
const app = express();
const PORT = 3000;

const mysql = require('mysql2/promise');
const amqp = require('amqplib');

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Readiness Probe용 엔드포인트: DB & RabbitMQ 연결 검사
app.get('/ready', async (req, res) => {
  try {
    // MySQL 연결 검사
    const dbConn = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      connectTimeout: 2000  // 연결 타임아웃 2초
    });

    // 간단한 쿼리로 DB ping 대체 (SELECT 1)
    await dbConn.execute('SELECT 1');
    await dbConn.end();

    // 2) RabbitMQ 연결 검사
    // 아래 URL 형식: amqp://user:password@host:port
    const rabbitUrl = `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`;
    const rabbitConn = await amqp.connect(rabbitUrl, { timeout: 2000 }); 
    // 채널을 열었다가 바로 닫으면 연결 상태 확인 가능
    const channel = await rabbitConn.createChannel();
    await channel.close();
    await rabbitConn.close();

    // 둘 다 성공하면 READY
    res.status(200).json({ status: 'READY' });
  } catch (err) {
    console.error('Readiness check failed:', err.message);
    res.status(500).json({ status: 'NOT_READY', error: err.message });
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 실제 API 라우터
app.use("/post", postRouter);

// EJS 설정
app.engine("html", require("ejs").renderFile);
app.set("views", path.join(__dirname, "src/views"));  // 뷰 폴더 설정
app.set("view engine", "ejs");                        // EJS 사용

// 정적 리소스 제공 (CSS, JS 등)
app.use(express.static(path.join(__dirname, "src/public")));

// 추가: /post 경로 전용 정적 리소스
app.use("/post/css", express.static(path.join(__dirname, "src/public/css")));
app.use("/post/js", express.static(path.join(__dirname, "src/public/js")));

// EJS 뷰 렌더링 라우터
app.get("/post/postform/:university_url", (req, res) => {
  res.render("post/postform", { university_url: req.params.university_url });
});

app.get("/post/list", (req, res) => {
  res.render("post/communityPost"); // src/views/post/communityPost.ejs
});

app.get("/post/postviewer/:post_id", (req, res) => {
  res.render("post/postviewer", { post_id: req.params.post_id });
});

app.get("/post/all/:university_url", (req, res) => {
  res.render("post/post", { university_url: req.params.university_url });
});
app.get("/post/showPostListAll/:university_url", (req, res) => {
  res.render("post/post", { university_url: req.params.university_url });
});

app.get("/post/mypage/community/post/:category", (req, res) => {
  res.render("post/communityPost", { category: req.params.category });
});



//  RabbitMQ consumer 실행 추가
const { consumePostListRequest } = require("./src/rabbit/rabbitMQ");

(async () => {
  try {
    await consumePostListRequest();
    console.log("✅ RabbitMQ 게시글 목록 소비 시작됨");
  } catch (err) {
    console.error("❌ RabbitMQ 게시글 목록 소비 실패:", err);
  }
})();

// 서버 시작
app.listen(PORT, () => {
  console.log(`✅ server running: http://localhost:${PORT}`);
});
