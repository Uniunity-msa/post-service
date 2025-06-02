import { baseUrls } from '/post/js/apiUrl.js';

//글 에디터
const Editor = toastui.Editor;

const postApiUrl = baseUrls.post;
const userApiUrl = baseUrls.user;
var userInfo; //유저정보


const loadloginData = async () => {
  const res = await fetch(`${userApiUrl}/me`, {
    credentials: "include", // 쿠키 포함
  });

  console.log("🔍  응답 상태:", res.status); // 200, 401 등
  console.log("🔍  응답 OK 여부:", res.ok);

  if (!res.ok) {
    alert("로그인이 필요합니다.");
    return;
  }
  const data = await res.json();
  console.log("✅  받아온 유저 정보:", data); // 실제 유저 정보 로그
  userInfo = data; 
  
  setSelectCategory(userInfo.user_type);
};

// 파일명을 생성하는 함수
function generateUniqueFileName(blob) {
  const timestamp = Date.now(); // 현재 시간을 기반으로 파일명 생성
  const extension = getExtensionFromBlob(blob); // Blob에서 확장자 추출
  return `${userInfo.university_url}_${timestamp}_${userInfo.user_nickname}.${extension}`;
}

// Blob에서 파일 확장자 추출
function getExtensionFromBlob(blob) {
  const match = /image\/([a-z]+)/.exec(blob.type); // Blob의 MIME 타입에서 확장자 추출
  if (match) {
    return match[1];
  }
  throw new Error('Invalid blob type');
}
var loading = false;
const loading_component = document.getElementById("loading");

const setLoading = (loading) => {
  loading_component.style.display = loading === true ? 'flex' : 'none';
}
let editor ;
function generateEditor(initialContent) {
    editor = new toastui.Editor({
    el: document.querySelector('#editor'),
    previewStyle: 'vertical',
    initialEditType: 'wysiwyg',
    previewHighlight: false,
    initialValue: initialContent,
    height: '1000px',
    // 사전입력 항목
    // 이미지가 Base64 형식으로 입력되는 것 가로채주는 옵션
    hooks: {
      async addImageBlobHook(blob, callback) {
        try {
          // FormData 생성
          const formData = new FormData();
          const modified_file = new File([blob], generateUniqueFileName(blob));
          formData.append('file', modified_file);
          //   파일 업로드 API 호출
          loading = true;
          setLoading(loading);
          const response = await fetch(`${postApiUrl}/file`, {
            method: 'POST',
            body: formData,
          });
          if (response.ok) {
            // 파일 업로드 성공
            const { fileUrl } = await response.json();

            // 콜백 함수 호출하여 에디터에 이미지 추가
            callback(fileUrl, 'alt text');
          } else {
            // 파일 업로드 실패
            console.error('Failed to upload image');
          }
        } catch (error) {
          console.error('Error uploading image:', error);
        } finally {
          loading = false;
          setLoading(loading);
        }
      }
    },
  });
}



//카테고리 선택
var selectedValue;
const partnerCategory = document.querySelector('#partnerCategory'),
  sotreUpload = document.querySelector('#sotreUpload'),
  postWrite = document.querySelector('#postWrite');
let selectPostCategoryElement = document.getElementById('select_post_category');
const postTitle = document.getElementById('post_title');
const postSubmitBtn = document.getElementById('post_submit_btn');

const setSelectCategory = (user_type) => {
  const selectElement = document.getElementById("select_post_category");
  selectElement.innerHTML = ""; // Clear existing options

  const defaultOption = document.createElement("option");
  defaultOption.text = "글 카테고리를 선택해주세요";
  defaultOption.selected = true;
  selectElement.appendChild(defaultOption);
  console.log("🎯 현재 user_type:", user_type);
  if (user_type === "student") {
    const options = ["제휴 추천", "잡담"];
    const values = ["제휴 추천", "잡담"];
    for (let i = 0; i < options.length; i++) {
      const option = document.createElement("option");
      option.value = values[i];
      option.text = options[i];
      selectElement.appendChild(option);
    }
  } else if (user_type === "council") {
    let options;
    let values;
    if(getUniversityUrl()=='modify'){
      options = ["총학생회 공지사항", "제휴 추천", "잡담"];
      values = ["총학생회 공지사항", "제휴 추천", "잡담"];
    }else{
      options = ["제휴 등록", "총학생회 공지사항", "제휴 추천", "잡담"];
      values = ["제휴 등록", "총학생회 공지사항", "제휴 추천", "잡담"];
    }

    for (let i = 0; i < options.length; i++) {
      const option = document.createElement("option");
      option.value = values[i];
      option.text = options[i];
      selectElement.appendChild(option);
    }
  } else { // 상인
    const options = ["제휴 제안", "가게 홍보"];
    const values = ["제휴 제안", "가게 홍보"];
    for (let i = 0; i < options.length; i++) {
      const option = document.createElement("option");
      option.value = values[i];
      option.text = options[i];
      selectElement.appendChild(option);
    }
  }
}


function uploadPost(postCategory) {
  const req = {
    user_email: userInfo.user_email,
    post_title: postTitle.value,
    post_content: editor.getHTML(),
    category: postCategory,
    university_id: userInfo.university_id
  };
  console.log(req);

  fetch(`${postApiUrl}/uploadPost`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(req),
  })
    .then(async (res) => {
    const data = await res.json();
      if (res.status === 201) {
        console.log("게시글 작성 완료");
        window.location.href = `/post/all/${userInfo.university_url}`; // 리다이렉션 처리
      } else {
        alert("서버의 문제로 게시글 작성이 실패했습니다. 다시 시도해주세요.");
      }
    })
    .catch((error) => {
      console.error("Error: ", error);
      alert("서버의 문제로 게시글 작성이 실패했습니다. 다시 시도해주세요.");
    })
}

function modifyPost(postId,postCategory){
  const req= {
    post_id:postId,
    post_title: postTitle.value,
    post_content: editor.getHTML(),
    category: postCategory,
  };

  fetch(`${postApiUrl}/modifyPost`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(req),
  })
    .then((res) => res.json())
    .then(res => {
      if (res.status === 201) {
        console.log("게시글 수정 완료");
        window.location.href = `/postviewer/${postId}`; // 리다이렉션 처리
      } else {
        alert("서버의 문제로 게시글 수정이 실패했습니다. 다시 시도해주세요.");
      }
    })
    .catch((error) => {
      console.error("Error: ", error);
      alert("서버의 문제로 게시글 수정이 실패했습니다. 다시 시도해주세요.");
    })
}


selectPostCategoryElement.addEventListener('change', function () {
  selectedValue = this.value;
  console.log(selectedValue)
  // 제휴가게 등록하기 로드
  if (selectedValue == "제휴 등록") {
    postWrite.style.display = "none";
    sotreUpload.style.display = "block";
    loadPartnerUpload();
    storeUploadBtn.addEventListener('click', function () {
      try {
        updateStore();
        alert("등록이 완료되었습니다.");
      } catch {
        alert("등록이 실패했습니다. 올바른 정보를 입력하셨는지 확인해주세요.")
      }

    });
  }
  //게시글 작성에디터
  else {
    postWrite.style.display = "block";
    sotreUpload.style.display = "none";
    if (getUniversityUrl() == 'modify') {
      postSubmitBtn.addEventListener('click', function () {
        modifyPost(getModifyPostId(),selectedValue);
      });
    }else{
      postSubmitBtn.addEventListener('click', function () {
        uploadPost(selectedValue);
      });
    }
   
    

  }
});

// 제휴 등록 폼에 필요한 변수들
const storeUploadBtn = document.querySelector('#uploadBtn'),
  BtnAddr = document.querySelector('#serchBtnAddr'),
  BtnContent = document.querySelector('#serchBtnContent');
const storeName = document.querySelector('#storeName'),
  store_location = document.querySelector('#store_location'),
  content = document.querySelector('#content'),
  startDate = document.querySelector('#startDate'),
  endDate = document.querySelector('#endDate');
var getlatitude, getlongitude;
// 제휴 등록 페이지에 필요한 함수 고정 코드
// ===========================================================================================
// university_url 값을 받아오는 함수
function getUniversityUrl() {
  // 현재 페이지의 URL에서 경로(pathname) 부분을 추출
  const path = window.location.pathname;

  // 경로에서 universityUrl 값을 추출
  const pathParts = path.split('/');
  const universityUrl = pathParts[pathParts.length - 1];
  return universityUrl;
}

function setCenter(map, latitude, longitude) {
  // 이동할 위도 경도 위치를 생성합니다
  var moveLatLon = new kakao.maps.LatLng(latitude, longitude);

  // 지도 중심을 이동 시킵니다
  map.setCenter(moveLatLon);
}

function updateStore() {
  const universityUrl = getUniversityUrl();
  const req = {
    storeName: storeName.value,
    store_location: store_location.value,
    latitude: getlatitude,
    longitude: getlongitude,
    content: content.value,
    startDate: startDate.value,
    endDate: endDate.value,
    university_url: universityUrl
  };

  fetch(`${postApiUrl}/uploadPartner`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(req),
  })
    .then((res) => res.json())
    .then(res => {
      console.log(res);
    })
}
function loadPartnerUpload() {
  var mapContainer = document.getElementById('map'), // 지도를 표시할 div 
    mapOption = {
      center: new kakao.maps.LatLng(37.566826, 126.9786567), // 지도의 중심좌표
      level: 3 // 지도의 확대 레벨
    };

  // 지도를 생성합니다    
  var map = new kakao.maps.Map(mapContainer, mapOption);

  // 학교별로 중심좌표 이동시키기
  const universityUrl = getUniversityUrl();
  const req = {
    university_url: universityUrl
  };

  fetch(`${postApiUrl}/getUniversityLocation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(req),
  }).then((res) => res.json())
    .then(res => {
      setCenter(map, parseFloat(res.latitude), parseFloat(res.longitude));
    })

  // 주소-좌표 변환 객체를 생성합니다
  var geocoder = new kakao.maps.services.Geocoder();

  BtnAddr.addEventListener('click', function () {
    // 주소로 좌표를 검색합니다
    geocoder.addressSearch(store_location.value, function (result, status) {

      // 정상적으로 검색이 완료됐으면 
      if (status === kakao.maps.services.Status.OK) {

        var coords = new kakao.maps.LatLng(result[0].y, result[0].x);
        getlatitude = parseFloat(result[0].y);
        getlongitude = parseFloat(result[0].x);

        // 결과값으로 받은 위치를 마커로 표시합니다
        var marker = new kakao.maps.Marker({
          map: map,
          position: coords
        });

        // 지도의 중심을 결과값으로 받은 위치로 이동시킵니다
        map.setCenter(coords);
      }
    });
  })
}
var university_url = getUniversityUrl();

function getModifyPostId() {
  return localStorage.getItem('post_id');
}

function loadModifyPage() {
  const postId = getModifyPostId();
  if (postId) {
    loadPostData(postId)
  } else {
    alert("게시글 정보 불러오기 오류");
  }

}

var postInfo; // 게시글 정보

// 게시글 정보 불러오기
const loadPostData = async (post_id) => {
  try {
    const url = `${postApiUrl}/showPost/${post_id}`;
    const response = await fetch(url);
    const data = await response.json();
    postInfo = data;
    console.log(postInfo);
    postTitle.value = postInfo.post_title;
    generateEditor(postInfo.post_content);
    const selectedCategory = postInfo.category;

    // select 요소 내의 option 요소들을 순회하면서 선택 상태를 설정합니다
    for (let i = 0; i < selectPostCategoryElement.options.length; i++) {
      if (selectPostCategoryElement.options[i].value === selectedCategory) {
        selectPostCategoryElement.options[i].selected = true;
        triggerChangeEvent(selectPostCategoryElement);
        break; // 선택된 상태로 설정한 후 반복문 종료
      }
    }
    postSubmitBtn.textContent = '수정하기'
  } catch (error) {
    console.error('게시글 정보 불러오기 오류', error);
  }
}

function triggerChangeEvent(element) {
  const event = new Event('change', {
      bubbles: true,
      cancelable: true,
  });

  element.dispatchEvent(event);
}




// navBar.addEventListener("click", function() {
//   window.location.href = `${apiUrl}/showPostListAll/${university_url}`;
// });
// ===========================================================================================
//page 로드 후 loadData()실행
window.addEventListener('DOMContentLoaded', function () {
  loadloginData();
  if (getUniversityUrl() == 'modify') {
    loadModifyPage();
  } else {
    generateEditor('')
  }
});
