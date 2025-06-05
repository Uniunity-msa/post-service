import { baseUrls } from '/post/js/apiUrl.js';

var currentUrl = window.location.href;
var post_id = currentUrl.split("/").pop();
var university_url;
var postWriterInfo;
const writeCommentBtn = document.getElementById('write_comment_btn');
var domain;
var university_url;
const navBar = document.getElementById("navbar-brand");
let userInfo; // 유저정보
const postApiUrl = baseUrls.post;
const userApiUrl = baseUrls.user;
const reactionApiUrl = baseUrls.reaction;

// 작성자 회원 정보 불러오기 (jwt방식으로 변경)
const loadloginData = async () => {
  const res = await fetch(`${userApiUrl}/me`, {
    credentials: "include", // 쿠키 포함
  });


  if (!res.ok) {
    userInfo = null;
    return;
  }
  const data = await res.json();
  userInfo = data; 
  
};



// 게시글 작성자 이메일 가져오기
const postWriter = async (post_id) => {
  const url = `${postApiUrl}/getPostWriter/${post_id}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    postWriterInfo = data;
    domain = extractDomainFromEmail(postWriterInfo.user_email);
    university_url = domain;
  } catch (error) {
    console.error('게시글 작성자 정보 불러오기 오류', error);
  }
};

// 게시글 수정, 삭제 버튼 보이는 조건
async function showDeleteButtonIfNeeded() {
  await postWriter(post_id);
  if (
  userInfo &&
  postWriterInfo &&
  userInfo.user_email === postWriterInfo.user_email
) {
  modifyPost.style.display = 'block';
  deletePost.style.display = 'block';
} else {
  modifyPost.style.display = 'none';
  deletePost.style.display = 'none';
  }
}



function extractDomainFromEmail(email) {
  const parts = email.split("@");
  if (parts.length === 2) {
    const domainParts = parts[1].split(".");
    if (domainParts.length >= 2) {
      return domainParts[0];
    }
  }
  return null;
}

var postInfo; // 게시글 정보
// 게시글 정보 불러오기
const loadPostData = async () => {
  try {
    const url = `${postApiUrl}/showPost/${post_id}`;
    const response = await fetch(url);
    const data = await response.json();
    postInfo = data;
  
    const postTitle = document.getElementById('post_title');
    const postCategory = document.getElementById('post_category');
    const postDate = document.getElementById('post_date');
    const postContent = document.getElementById('post_content');
    const viewCount = document.getElementById('view_count');
    const likeCount = document.getElementById('like_count');
    const scrapCount = document.getElementById('scrap_count');
    const commentCount = document.getElementById('comment_count');
    const deletePost = document.getElementById('delete');
    const modifyPost = document.getElementById('modify');
    const userNickname = document.getElementById('user_nickname');
    // const readMoreBtn = document.getElementById('read_more_btn');

    postTitle.textContent = postInfo.post_title;
    postCategory.textContent = postInfo.category;
    postDate.textContent = postInfo.post_date;
    postContent.textContent = postInfo.post_content;
    viewCount.innerHTML = `<img width="24" height="24" src="https://img.icons8.com/external-yogi-aprelliyanto-flat-yogi-aprelliyanto/32/external-click-marketing-and-seo-yogi-aprelliyanto-flat-yogi-aprelliyanto.png" style="margin-right: 0.3rem;" alt="external-click-marketing-and-seo-yogi-aprelliyanto-flat-yogi-aprelliyanto"/> ${postInfo.view_count}`;
    likeCount.innerHTML = `<img width="24" height="24" src="https://img.icons8.com/color/48/filled-like.png" id="like_img" style="margin-right: 0.3rem;" alt="filled-like" /> ${postInfo.like_count}`;
    scrapCount.innerHTML = `<img width="24" height="24" src="https://img.icons8.com/fluency/48/filled-star.png" id="scrap_img" style="margin-right: 0.3rem; " alt="filled-star"/> ${postInfo.scrap_count}`
    commentCount.innerHTML = `<img width="24" height="24" src="https://img.icons8.com/color/48/speech-bubble-with-dots.png" style="margin-right: 0.3rem;" alt="speech-bubble-with-dots"/> ${postInfo.comment_count}`;
    userNickname.textContent = postInfo.user_nickname;
    modifyPost.innerHTML=`<img width="24" height="24" src="https://img.icons8.com/external-others-amoghdesign/24/external-modify-multimedia-flat-30px-others-amoghdesign.png"  style="margin-right: 0.3rem;"/>`
    deletePost.innerHTML = `<img width="24" height="24" src="https://img.icons8.com/?size=512&id=heybTkWFZ8KQ&format=png" style="margin-right: 0.3rem;" />`;

    // 화살표 버튼을 숨기거나 표시하는 함수
    function toggleCarouselButtons(visible) {
      const carouselButtons = document.querySelectorAll('.carousel-control-prev, .carousel-control-next');
      carouselButtons.forEach(button => {
        if (visible) {
          button.style.display = 'block';
        } else {
          button.style.display = 'none';
        }
      });
    }
    if (postInfo.category === "총학생회 공지사항") {
      toggleCarouselButtons(true);

      // 게시글 정보 로드 후, 이미지 URL 추출 및 카루셀 추가
      const htmlContent = postInfo.post_content;
      const regex = /<img\s+src="([^"]+)"\s+alt="[^"]+"\s+contenteditable="false">/gi;
      const imageUrls = [];
      let match;
      while ((match = regex.exec(htmlContent)) !== null) {
        imageUrls.push(match[1]);
      }
      if (imageUrls.length === 0) {
        toggleCarouselButtons(false);
      }
      else if (imageUrls.length > 0) {
        const imageCarousel = document.getElementById('imageCarousel');
        const carouselInner = imageCarousel.querySelector('.carousel-inner');
        // imageCarousel.style.height = '400px';
        carouselInner.innerHTML = '';

        for (let i = 0; i < imageUrls.length; i++) {
          const imageUrl = imageUrls[i];
          const carouselItem = document.createElement('div');
          carouselItem.classList.add('carousel-item');

          if (i === 0) {
            carouselItem.classList.add('active');
          }

          const imageElement = document.createElement('img');
          imageElement.src = imageUrl;
          imageElement.alt = `이미지 ${i + 1}`;

          carouselItem.appendChild(imageElement);
          carouselInner.appendChild(carouselItem);
        }
      }


      const viewer = toastui.Editor.factory({
        el: document.querySelector('.toast-custom-viewer'),
        viewer: true,
        height: '1000px',
        initialValue: postInfo.post_content.replace(/<img[^>]+>/gi, '')
      });
    }
    else {
      toggleCarouselButtons(false);
      const viewer = toastui.Editor.factory({
        el: document.querySelector('.toast-custom-viewer'),
        viewer: true,
        height: '1000px',
        initialValue: postInfo.post_content,
      });
    }
  }
  catch (error) {
    console.error('게시글 정보 불러오기 오류', error);
  }
  //********* 마이페이지 하트기능 **********//
  // post_id 값을 받아오는 함수
  function getPostID() {
    const url = new URL(window.location.href);
    const postID = url.pathname.split('/').pop();
    return postID;
  }

  const likeImg = document.querySelector('#like_img');

  // 하트추가 기능
  function addHeart() {
    if (!userInfo || !userInfo.user_email) {
      alert("로그인 후에 기능을 사용할 수 있습니다.");
    }

    // 자기 글이면 좋아요 불가
    if (userInfo.user_email === postWriterInfo.user_email) {
      alert("자신이 작성한 글에는 좋아요를 누를 수 없습니다.");
      return;
    }
      //사용자가 이미 해당 게시글에 하트를 눌렀는지 확인
      const postID = getPostID();
      const req = {
        post_id: postID,
        user_email: userInfo.user_email
      };
      fetch(`${reactionApiUrl}/checkHeart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req),
      })
        .then((res) => res.json())
      .then(res => {
        if (res.result == false) {
          fetch(`${reactionApiUrl}/addHeart`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(req),
          })
            .then((res) => res.json())
            .then(async res => {
              alert("하트 목록에 추가 되었습니다.");
            })
            .catch(console.error);
        } else {
          fetch(`${reactionApiUrl}/deleteHeart/${res.result.heart_id}`)
            .then((res) => res.json())
            .then(async res => {
              alert("하트 목록에서 삭제 되었습니다.");
            })
            .catch(console.error);
        }
      })
      .catch(console.error);
    
  }

  likeImg.addEventListener('click', function () {
    addHeart();
  })

  //********* 마이페이지 스크랩기능 **********//
  const scrapImg = document.querySelector('#scrap_img');

  // 스크랩추가 기능
  function addScrap() {
    if (!userInfo || !userInfo.user_email) {
    alert("로그인 후에 기능을 사용할 수 있습니다.");
  }
    // 자기 글이면 스크랩 불가
    if (userInfo.user_email === postWriterInfo.user_email) {
      alert("자신이 작성한 글에는 스크랩을 할 수 없습니다.");
      return;
    }

    //사용자가 이미 해당 게시글에 스크랩를 눌렀는지 확인
    const postID = getPostID();
    const req = {
      post_id: postID,
      user_email: userInfo.user_email
    };
    fetch(`${reactionApiUrl}/checkScrap`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Network response was not ok');
        }
        return res.json();
      })
      .then(res => {
        // 사용자가 해당게시글에 스크랩를 누르지 않았을 경우 -> 스크랩 추가
        if (res.result == false) {
          fetch(`${reactionApiUrl}/addScrap`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(req),
          })
            .then((res) => {
              if (!res.ok) {
                throw new Error('Network response was not ok');
              }
              return res.json();
            })
            .then(async res => {
              alert("스크랩 목록에 추가 되었습니다.");
            })
            .catch((error) => {
              console.error('There has been a problem with your fetch operation:', error);
            });
        }
        // 사용자가 해당게시글에 스크랩를 눌렀을 경우 -> 스크랩 삭제
        else {
          fetch(`${reactionApiUrl}/deleteScrap/${res.result.scrap_id}`)
            .then((res) => {
              if (!res.ok) {
                throw new Error('Network response was not ok');
              }
              return res.json();
            })
            .then(async res => {
              alert("스크랩 목록에서 삭제 되었습니다.");
            })
            .catch((error) => {
              console.error('There has been a problem with your fetch operation:', error);
            });
        }
      })
      .catch((error) => {
        console.error('There has been a problem with your fetch operation:', error);
      });
    
  }

  scrapImg.addEventListener('click', function () {
    addScrap();
  })
  // page 로드 후 loadData() 실행
};

window.addEventListener('DOMContentLoaded', async function () {
  await loadloginData();
  await loadPostData();

  fetchComments();//댓글 보기
  await showDeleteButtonIfNeeded();
});


var currentUrl = window.location.href;
var post_id = currentUrl.split("/").pop();

var commentInfo; // 댓글정보

const fetchComments = async () => {
  const commentViewerContainer = document.querySelector("#commentViewer");

  if (!commentViewerContainer) {
    console.error("댓글을 표시할 수 없습니다");
    return;
  }

  try {
    const response = await fetch(`${reactionApiUrl}/showComment/postviewer/${post_id}`);
    const data = await response.json();
    const deleteIconImageUrl = 'https://img.icons8.com/?size=512&id=heybTkWFZ8KQ&format=png';


    // 댓글 컨테이너 초기화
    commentViewerContainer.innerHTML = "";

    data.forEach((comment) => {
      // 댓글 카드 생성
      const commentCardElement = document.createElement('div');
      commentCardElement.classList.add('card', 'p-4', 'mt-2');

      // 댓글 정보를 담는 div 요소 생성
      const commentInfoElement = document.createElement('div');
      commentInfoElement.classList.add('row');

      // 유저 닉네임 표시
      const userNickNameElement = document.createElement('div');
      userNickNameElement.classList.add('col-11','fw-bold');
      const userNickNameParagraph = document.createElement('p');
      userNickNameParagraph.classList.add('fs-4');
      userNickNameParagraph.textContent = comment.user_nickname;
      userNickNameElement.appendChild(userNickNameParagraph);


      // 좋아요 수를 담는 div 요소 생성
      // const LikeCountElement = document.createElement('div');
      // LikeCountElement.classList.add('col-6', 'text-end');

      
      // 좋아요 수 표시
      // const likeCountElement = document.createElement('p');
      // likeCountElement.classList.add('fs-4');
      // likeCountElement.textContent = comment.like_count_comment;
      //댓글 삭제
      const deleteCommentElement = document.createElement('div');
      deleteCommentElement.classList.add('col-1', 'text-end');
      // 댓글 삭제 아이콘 이미지 생성 및 설정
      const deleteIconElement = document.createElement('img');
      deleteIconElement.width = 24;
      deleteIconElement.height = 24;

      if (userInfo && userInfo.user_email === comment.user_email) {
        deleteIconElement.src = deleteIconImageUrl;
        deleteIconElement.alt = 'Delete Comment';
        deleteIconElement.id = comment.comment_id;


        deleteIconElement.addEventListener("click", () => handleDeleteCommentClick(comment.comment_id));

        deleteCommentElement.appendChild(deleteIconElement);

        deleteCommentElement.appendChild(deleteIconElement);
   

      }

      // 생성한 요소들을 commentInfoElement에 추가
      commentInfoElement.appendChild(userNickNameElement);
      commentInfoElement.appendChild(deleteCommentElement);
     
      // commentInfoElement.appendChild(subdateLikeCountElement);


      // 댓글 내용 표시
      const commentContentElement = document.createElement('p');
      commentContentElement.classList.add('fs-4');
      commentContentElement.textContent = comment.comment_content;

      // // 댓글 날짜 표시
      const commentDateElement = document.createElement('p');
      commentDateElement.classList.add('fs-5','text-secondary');
      commentDateElement.textContent = comment.comment_date;




      // 생성한 요소들을 commentCardElement에 추가
      commentCardElement.appendChild(commentInfoElement);
      commentCardElement.appendChild(commentContentElement);
      commentCardElement.appendChild(commentDateElement);

      // 댓글 컨테이너에 생성한 댓글 카드를 추가
      commentViewerContainer.appendChild(commentCardElement);
    });



  } catch (error) {
    console.error("댓글 불러오기 오류:", error);
  }
};


// const brandNav= document.getElementById('navbar-brand');



writeCommentBtn.addEventListener('click', function () {
  var commentContent = document.querySelector('.comment-form textarea').value;
  if (!userInfo || !userInfo.user_email) {
    alert("로그인 후에 게시글을 작성할 수 있습니다.");
  }
  else if(userInfo.university_id!=postInfo.university_id){
    alert("해당 대학교 재학생과 대학교 인근 상인만 댓글을 작성할 수 있습니다. ");
  }
  
  else {
    if(commentContent.trim().length ==0){
      alert("댓글을 입력해주세요");
    }
    else if (commentContent.trim().length > 0) {
      // 댓글 등록 API 호출
      fetch(`${reactionApiUrl}/uploadComment/postviewer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          post_id: postInfo.post_id,
          user_email: userInfo.user_email,
          comment_content: commentContent,

        })
      })
        .then(response => response.json())
        .then(data => { //data.status === 201

          if (data.status === 201) {
 
            fetchComments();
            document.querySelector('.comment-form textarea').value = "";
                    

          } else {
            // 등록 실패한 경우, 오류 메시지를 표시하거나 다른 처리를 수행
            console.error('댓글 등록 실패data:', data);
            console.error('댓글 등록 실패:', data.err);
          }
        })
        .catch(error => {
          console.error('댓글 등록 실패:', error);
        });
    } else {
      alert("댓글 등록 실패.");
    }
  }

});


//게시글지우기
const fetchDeletePost = async (post_id, user_email) => {
  try {
    const response = await fetch(`/deletePost/${post_id}/${user_email}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    if (!response.ok) {
      throw new Error('서버 응답이 올바르지 않습니다.');
    }

    const data = await response.json();

    if (data.result === true) {
      alert("게시글이 성공적으로 삭제되었습니다.");
      // 삭제 성공 후 추가 작업이 필요하면 이곳에 추가
      window.location.href = `${postApiUrl}/showPostListALL/${userInfo.university_url}`;
    } else {
      alert("게시글 삭제에 실패하였습니다.");
    }
  } catch (error) {
    console.error('서버 응답 에러:', error);
    alert("서버 응답에 오류가 발생하였습니다.");
  }
};


function handleDeleteClick() {
  const confirmed = window.confirm("게시글을 삭제하시겠습니까?");

  if (confirmed) {
    const post_id = postInfo.post_id;
    const user_email = userInfo.user_email;

    // 서버로 게시글 삭제 요청
    fetchDeletePost(post_id, user_email); // fetchDeletePost 함수를 호출하여 게시글 삭제
  } else {
    // 삭제 취소 시 처리
  }
}

function handleModifyClick() {
  const confirmed = window.confirm("게시글을 수정하시겠습니까?");

  if (confirmed) {
    const post_id = postInfo.post_id;
    setModifyPostId(post_id)
    
  }
}

function setModifyPostId(post_id){
  localStorage.setItem('post_id',post_id);
  window.location.href = '/postform/modify'; // 수정 페이지로 리다이렉션
}


// 게시글 삭제 아이콘 클릭 이벤트 리스너
const deletePost = document.getElementById("delete");
const modifyPost = document.getElementById("modify");
deletePost.addEventListener("click", handleDeleteClick);
modifyPost.addEventListener("click",handleModifyClick);



//댓글 지우기!!!
const fetchDeleteComment = async (user_email, comment_id) => {
  try {
    const url = `${reactionApiUrl}/doDeleteComment/${user_email}/${comment_id}`

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }

    })
    if (!response.ok) {
      throw new Error('서버 응답이 올바르지 않습니다.');
    }

    const data = await response.json();

    if (data.result === true) {
      alert("댓글이 성공적으로 삭제되었습니다.");
      window.location.href = `${postApiUrl}/postviewer/${post_id}`;
    } else {
      console.error('댓글 삭제 실패:', data.err);
      alert("댓글 삭제에 실패하였습니다.");
    }
  } catch (error) {
    console.error('서버 응답 에러:', error);
    alert("서버 응답에 오류가 발생하였습니다.");
  }
};


function handleDeleteCommentClick(comment_id) {
  const confirmed = window.confirm("삭제하시겠습니까?");

  if (confirmed) {
    const user_email = userInfo.user_email;

    // // 서버로 댓글 삭제 요청
    fetchDeleteComment(user_email, comment_id);
  } else {
    // 삭제 취소 시 처리
  }
}
