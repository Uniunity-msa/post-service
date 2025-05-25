// const currentUrl = window.location.href;
// const post_id = currentUrl.split("/").pop();
// console.log("🆔 post_id:", post_id);

// // 댓글 불러오기
// const fetchComments = async () => {
//   const commentViewerContainer = document.querySelector("#commentViewer");
//   if (!commentViewerContainer) return;

//   try {
//     const response = await fetch(`${apiUrl}/showComment/postviewer/${post_id}`);
//     const data = await response.json();
//     console.log("📨 댓글 데이터:", data);

//     commentViewerContainer.innerHTML = ""; // 초기화

//     data.forEach((comment) => {
//       const card = document.createElement('div');
//       card.classList.add('card', 'p-3', 'mb-2');

//       const content = `
//         <p><strong>${comment.user_email}</strong></p>
//         <p>${comment.comment_date}</p>
//         <p>${comment.comment_content}</p>
//         <p>❤️ ${comment.like_count_comment}</p>
//       `;
//       card.innerHTML = content;
//       commentViewerContainer.appendChild(card);
//     });

//   } catch (error) {
//     console.error("❌ 댓글 불러오기 오류:", error);
//   }
// };

// // 댓글 작성
// document.getElementById('write_comment_btn')?.addEventListener('click', async () => {
//   const content = document.querySelector('.comment-form textarea')?.value.trim();
//   if (!content) {
//     alert("댓글을 입력해주세요.");
//     return;
//   }

//   try {
//     const response = await fetch(`${apiUrl}/uploadComment/postviewer/${post_id}`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json"
//       },
//       body: JSON.stringify({
//         user_email: "20211125@sungshin.ac.kr", // ⚠️ 나중에 자동으로 받아오도록 수정
//         comment_content: content
//       })
//     });

//     const result = await response.json();
//     if (result.status === 201) {
//       document.querySelector('.comment-form textarea').value = "";
//       fetchComments(); // 댓글 새로고침
//     } else {
//       alert("댓글 등록에 실패했습니다.");
//       console.error(result.err);
//     }
//   } catch (err) {
//     console.error("❌ 댓글 등록 실패:", err);
//   }
// });

// // 초기 로딩 시 댓글 표시
// window.addEventListener("DOMContentLoaded", fetchComments);
