const PostStorage = require("./PostStorage");
const User = require("./User");

class Post {
    constructor(body) {
        this.body = body;
    }
    //게시글 작성하기
    async createPost() {
        const client = this.body;
        try {
            const response = await PostStorage.savePost(client);
            if(client.category==="총학생회 공지사항"){
                const response2 = await PostStorage.saveImagePost(
                    response.post_id,
                    response.postInfo.post_content,
                    response.formattedDateTime
                )
                if(response.result==true && response2.result==true){
                    return response;
                }
            }
            else{
                return response;
            }
        } catch (err) {
            return { err }
        }
    }
    //게시글 수정하기
    async modifyPost(){
        const client = this.body;
        try {
            const response = await PostStorage.updatePost(client);
            const postInfo=await PostStorage.getPost(client.post_id);
            
            response.postInfo=postInfo;
            if(client.category==="총학생회 공지사항"){
                const response2 = await PostStorage.saveImagePost(
                    response.post_id,
                    response.postInfo.post_content,
                    response.postInfo.post_date
                )
                if(response.result==true && response2.result==true){
                    return response;
                }
            }
            else{
                return response;
            }
        } catch (err) {
            return { err }
        }
    }
    //게시글 삭제하기
    async doDeletePost( post_id, user_email) {
        try {
            const response = await PostStorage.goDeletePost(post_id, user_email);
            return response;
        } catch (err) {
            return { err };
        }
    }
    //카테고리별로 정렬
    async showPostListbyCategory(university_url, category) {
        try {
            let university_id = await PostStorage.getUniversityUrlToID(university_url);
            const response = await PostStorage.getPostListbyCategory(university_id, category);
            return response;
        } catch (err) {
            return { success: false, msg: err };
        }
    }
    //최신순 포스트 리스트 불러오기
    async showPostListAll(university_url, page = 1, pageSize = 10) {
        try {
            let university_id = await PostStorage.getUniversityUrlToID(university_url);
            const response = await PostStorage.getPostListAll(university_id);
            return response;
        } catch (err) {
            return { success: false, msg: err };
        }
    }
    //post_id로 게시글 불러오기
    async showPost(post_id) {
        try {
            var response = await PostStorage.getPost(post_id);
            const user=new User()
            const userInfo= await user.getUserInfo(response.user_email)
            const user_nickname=userInfo.user_nickname
            response.user_nickname=user_nickname
            
            return response;
        } catch (err) {
            return { err }
        }

    }
    // 게시글 검색하기
    async searchPost(keyword) {
        try {
            const response = await PostStorage.searchPost(keyword);
            return response;
        } catch (err) {
            return { success: false, msg: err };
        }
    }
    //마이페이지-내가 작성한 게시글 보기
    async myCommunityPost() {
        try {
            const client = this.body;
            const response = await PostStorage.getMyPost(client);
            return response;
        } catch (err) {
            return {
                result: false,
                status: 500,
                msg: err
            };
        }
    }
    // 게시글 작성자 반환
    async postWriter(post_id){
        try{
            const response = await PostStorage.postWriter(post_id);
            return response;
        } catch (err) {
            return{success:false,msg:err};
        }
    }
}