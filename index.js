const express = require("express");
const path = require("path");
const postRouter = require("./src/routes/postRoutes");
const app = express();
const PORT = 3000;

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
  console.log("index.js GET 요청 받음");
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
