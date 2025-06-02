import { baseUrls } from '/post/js/apiUrl.js';

const postApiUrl = baseUrls.post;
const userApiUrl = baseUrls.user;
const startApiUrl = baseUrls.start;
let userInfo; // 유저정보
//로그인(로그아웃), 회원가입(마이페이지)버튼
const loginStatusBtn = document.getElementById("loginStatusBtn");
const signUpBtn = document.getElementById("signUpBtn");
const navBar = document.getElementById("navbar");

const currentUrl = window.location.origin; 
const redirectUri = `${currentUrl}/mypage`; // 로그인/로그아웃 완료 후 돌아올 주소

// 유저 로그인 상태 확인 및 정보 로드
const fetchLoginData = async () => {
    try {
        const url = `${userApiUrl}/me`; 

        const res = await fetch(url, {
            credentials: "include",
        });

        const data = await res.json();

        //테스트용
        console.log("[로그인 체크] 응답 데이터:", data);

        if (!data.loginStatus) {
            alert('로그인 세션이 만료되었습니다. 다시 로그인해주세요.');
            window.location.href = `${userApiUrl}/login`;
            return;
        }

        userInfo = data; // user_email, university_url 등 저장
        setLoginHeader(data);

        
        // // 현재 경로가 /mypage가 아니면 리다이렉트
        // if (window.location.pathname !== '/mypage') {
        //     window.location.href = redirectUri;
        //  }
    } catch (error) {
        console.error("로그인 정보 확인 실패:", error);

        alert("서버 문제로 로그인 정보를 확인하지 못했습니다.");
        window.location.href = `${userApiUrl}/login`;
    }
};

const setLoginHeader = (res) => {
    navBar.setAttribute("href", `${startApiUrl}`);
    if (res.loginStatus) {
        //loginStatusBtn.setAttribute("href", `${userApiUrl}/auth/logout`);
        loginStatusBtn.innerText = "로그아웃"
        loginStatusBtn.onclick = async (e) => {
            e.preventDefault();
            try {

                //테스트용
                console.log("[로그아웃] 요청 시작");

                const response = await fetch(`${userServiceUrl}/logout`, {
                    credentials: "include",
                });

                if (response.ok) {
                    const data = await response.json();

                    //테스트용
                    console.log("[로그아웃] 성공:", data);
                    
                    window.location.href = redirectUri;
                } else {
                    //테스트용
                    console.warn("[로그아웃] 실패 상태 코드:", response.status);

                    alert("로그아웃 실패");
                }
            } catch (err) {
                console.error("로그아웃 요청 실패:", err);
            }
        };
        signUpBtn.setAttribute("href", `${postApiUrl}/council/${res.university_url}`);
        signUpBtn.innerText = "나의학교"
    }
    else {
        alert('로그인 세션이 만료되었습니다. 다시 로그인해주세요.');
        window.location.href = `${userApiUrl}/login`; // 리다이렉션 처리
    }

}

const fetchPostData = async () => {
    let paths = window.location.pathname.split('/');
    let category = paths[paths.length - 1]; // 마지막 segment가 category여야 함
    console.log("category: ", category);
    const commnunityPostTitle = document.getElementById("community_post_title")
    if (category === '1') {
        commnunityPostTitle.textContent = '내가 작성한 게시글'
    } else if (category === '2') {
        commnunityPostTitle.textContent = '내가 댓글 단 게시글'
    } else if (category === '3') {
        commnunityPostTitle.textContent = '나의 좋아요 게시글'
    } else if (category === '4') {
        commnunityPostTitle.textContent = '나의 스크랩 게시글'
    }

    const url = `${postApiUrl}/mypage/community/post/${category}`;

    try {
        const res = await fetch(url, {
            method: "POST",
            credentials: "include", // 세션 쿠키 전달 필수
        });

        const result = await res.json();

        if (result.status === 200) {
            result.result.forEach((data) => createCard(data));
        } else if (result.status === 202) {
            createEmptyCard(result.result);
        } else {
            alert("서버의 문제로 게시글 관리 접근에 실패했습니다. 다시 시도해주세요.");
        }
    } catch (error) {
        console.error("Error: ", error);
        alert("서버의 문제로 게시글 관리 접근에 실패했습니다. 다시 시도해주세요.");
    }
}

function truncateText(elementId, maxLength, data) {
    const element = document.getElementById(elementId);
    console.log(element)
    if (element) {
        if (data.length > maxLength) {
            element.textContent = data.slice(0, maxLength) + '...';
        }
    }
}
function createEmptyCard(data) {
    const cardContainer = document.getElementById('card_container');

    // Create a new card element
    const cardElement = document.createElement('div');
    cardElement.classList.add('mt-2', 'mb-3', 'card');

    // Fill in the card template with data
    cardElement.innerHTML = `

    <div class="card-body d-flex justify-content-between">
            <div>
                <h2 class="card-title h5 mt-2" id="post_title" style="font-weight:500;">${data} </h2>
            </div>
        </div>
    </div>
    </div>

    `;
    // Append the card to the container
    cardContainer.appendChild(cardElement);
}

// Function to create a card element with data and append it to the container
function createCard(data) {
    // console.log(data)
    // let post_title = document.getElementById('post_title').textContent = data.post_title;
    // let post_content = document.getElementById('post_content').textContent = data.post_content;
    // //게시글 제목이 30자이상이면 나머지 문자열 ...처리
    // if (data.post_title.length > 30) {
    //     post_title = truncateText('post_title', 30, data.post_title);
    // }
    // //게시글 내용이 100글자 이상이면 나머지 문자열 ...처리
    // if (data.post_content.length > 100) {
    //     post_content = truncateText('post_content', 100, data.post_content);
    // }


    const cardContainer = document.getElementById('card_container');

    // Create a new card element
    const cardElement = document.createElement('div');
    cardElement.classList.add('mt-2', 'mb-3', 'card');

    // Fill in the card template with data
    cardElement.innerHTML = `
        <div class="card-body d-flex justify-content-between">
            <div>
                <div class="small text-muted">${data.post_date}</div>
                <h2 class="card-title h4 mt-2">${data.post_title}</h2>
            </div>
            <div>
                <a class="btn read-more-btn btn-outline-secondary" href="${postApiUrl}/postviewer/${data.post_id}">게시글 보러가기 →</a>
            </div>
        </div>

        <div class="card-text ps-3 d-flex justify-content-between mb-2">
            <p class="small text-muted">${data.category}</p>
        </div>

        <div class="card-text ps-3 d-flex">
            <img width="24" height="24" src="https://img.icons8.com/color/48/filled-like.png" style="margin-right: 0.3rem;"  alt="filled-like" />
            <p class="small text-muted" style="margin-right: 1rem;" >${data.like_count}</p>
            <img width="24" height="24" src="https://img.icons8.com/fluency/48/filled-star.png" style="margin-right: 0.3rem; margin-bottom:0.3rem" alt="filled-star"/>
            <p class="small text-muted" style="margin-right: 1rem;">${data.scrap_count}</p>
            <img width="24" height="24" src="https://img.icons8.com/color/48/speech-bubble-with-dots.png" style="margin-right: 0.3rem;" alt="speech-bubble-with-dots"/>
            <p class="small text-muted" style="margin-right: 1rem;">${data.comment_count}</p>
            <img width="24" height="24" src="https://img.icons8.com/external-yogi-aprelliyanto-flat-yogi-aprelliyanto/32/external-click-marketing-and-seo-yogi-aprelliyanto-flat-yogi-aprelliyanto.png" style="margin-right: 0.3rem;" alt="external-click-marketing-and-seo-yogi-aprelliyanto-flat-yogi-aprelliyanto"/>
            <p class="small text-muted" style="margin-right: 1rem;">${data.view_count}</p>
            </div>
    `;
    // Append the card to the container
    cardContainer.appendChild(cardElement);
}



// function updatePostData(data) {
//     var card = document.createElement('div');
//     card.className = 'card mb-3';

//     var cardBody = document.createElement('div');
//     cardBody.className = 'card-body d-flex justify-content-between';

//     document.getElementById('post_date').textContent = data.post_date;
//     document.getElementById('post_category').textContent = data.post_category;
//     document.getElementById('comment_count').textContent = data.comment_count;
//     document.getElementById('like_count').textContent = data.like_count;
//     // document.getElementById('scrap_count').textContent = data.scrap_count;


// }

// 로드 후 loadData()실행
window.addEventListener('DOMContentLoaded', async function () {
    await fetchLoginData();
    await fetchPostData();

});
