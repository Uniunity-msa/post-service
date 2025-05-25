const express = require("express");
const path = require("path");
const postRouter = require("./src/routes/postRoutes");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// EJS 설정
app.engine("html", require("ejs").renderFile);
app.set("views", path.join(__dirname, "src/views"));  // 뷰 폴더 설정
app.set("view engine", "ejs");                        // EJS 사용

// 정적 리소스 제공 (CSS, JS 등)
app.use(express.static(path.join(__dirname, "src/public")));

// EJS 뷰 렌더링 라우터
app.get("/post/form", (req, res) => {
  res.render("post/postform"); // src/views/post/postform.ejs
});

app.get("/post/list", (req, res) => {
  res.render("post/communityPost"); // src/views/post/communityPost.ejs
});

app.get("/postviewer/:post_id", (req, res) => {
  res.render("post/postviewer", { post_id: req.params.post_id });
});

app.get("/post/all/:university_url", (req, res) => {
  res.render("post/post", { university_url: req.params.university_url });
});
app.get("/showPostListAll/:university_url", (req, res) => {
  res.render("post/post", { university_url: req.params.university_url });
});

app.get("/mypage/community/post/:category", (req, res) => {
  res.render("post/communityPost", { category: req.params.category });
});



// 실제 API 라우터
app.use("/", postRouter);




// 서버 시작
app.listen(PORT, () => {
  console.log(`✅ server running: http://localhost:${PORT}`);
});
