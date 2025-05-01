"use strict"
const { reject } = require("underscore");
const { pool } = require("../config/db");

class PostStorage {
    //게시글 등록
    static async savePost(postInfo) {
        return new Promise(async (resolve, reject) => {
            pool.getConnection((err, connection) => {
                if (err) {
                    console.error('MySQL 연결 오류: ', err);
                    reject(err);
                }
                
                console.log("🔥 postInfo:", postInfo);

                function getCurrentDateTime() {
                    const now = new Date();
                    const offset = 9 * 60; // 9시간을 분 단위로 변환
                    const localTime = now.getTime() + now.getTimezoneOffset() * 60 * 1000; // 로컬 시간을 밀리초 단위로 변환
                    const seoulTime = new Date(localTime + offset * 60 * 1000); // 서울 시간 계산
                    const year = seoulTime.getFullYear();
                    const month = String(seoulTime.getMonth() + 1).padStart(2, '0');
                    const day = String(seoulTime.getDate()).padStart(2, '0');
                    const hours = String(seoulTime.getHours()).padStart(2, '0');
                    const minutes = String(seoulTime.getMinutes()).padStart(2, '0');
                    const seconds = String(seoulTime.getSeconds()).padStart(2, '0');
                    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
                }
                // 현재 시간을 YYYY-MM-DD HH:MM:SS 형식으로 포맷팅
                const formattedDateTime = getCurrentDateTime();
                const query = 'INSERT INTO Post(user_email, university_id, post_title, post_content, category, post_date) VALUES (?,?,?,?,?,?);';
                pool.query(query,
                    [
                        postInfo.user_email,
                        postInfo.university_id,
                        postInfo.post_title,
                        postInfo.post_content,
                        postInfo.category,
                        formattedDateTime
                    ],
                    (err, result) => {
                        if (err) {
                            pool.releaseConnection(connection);
                            reject({
                                result: false,
                                status: 500,
                                err: `${err}`
                            });
                        } else {
                            pool.releaseConnection(connection);
                            resolve({
                                result: true,
                                status: 201,
                                post_id: result.insertId,
                                postInfo: postInfo,
                                formattedDateTime: formattedDateTime
                            });
                        }
                    });
            });
        });
    }
     //게시글 등록시 post이미지 저장
     static async saveImagePost(postId, postInfo, formattedDateTime) {
        return new Promise(async (resolve, reject) => {
            pool.getConnection(async (err, connection) => {
                if (err) {
                    console.error('MySQL 연결 오류: ', err);
                    reject(err);
                }
                const post_id = postId; // 새로 추가된 게시글의 ID
                const regex = /<img\s+src="([^"]+)"\s+alt="[^"]+"\s+contenteditable="false">/gi;
                const matches = postInfo.match(regex);
                const image_url = matches && matches.length > 0 ? matches[0].replace(/<img\s+src="([^"]+)"\s+alt="[^"]+"\s+contenteditable="false">/gi, '$1') : null;
                if (image_url) {
                    const imageQuery = 'INSERT INTO PostImage(image_id, post_id, image_url, image_date) VALUES (?, ?, ?, ?);';
                    pool.query(imageQuery, [null, post_id, image_url, formattedDateTime], (imageErr) => {
                        pool.releaseConnection(connection);
                        if (imageErr) {
                            reject({
                                result: false,
                                status: 500,
                                err: `${imageErr}`
                            });
                        } else {
                            resolve({
                                result: true,
                                status: 201
                            });
                        }
                    });
                } else {  //이미지 url 없음
                    resolve({
                        result: true,
                        status: 201
                    });
                }
            })
        })
    }
     //post_id로 게시글 불러오기
     static getPost(post_id) {
        return new Promise(async (resolve, reject) => {
            pool.getConnection((err, connection) => {
                if (err) {
                    console.error('MySQL 연결 오류: ', err);
                    reject(err)
                }
                pool.query("SELECT * FROM Post WHERE post_id=?;", [post_id], function (err, rows) {
                    pool.releaseConnection(connection);
                    if (err) {
                        console.error('Query 함수 오류', err);
                        reject(err)
                    }
                    resolve(rows[0]);
                })
            })
        });
    }
    //post_id로 게시글 수정
    static updatePost(postInfo) {
        return new Promise(async (resolve, reject) => {
            pool.getConnection((err, connection) => {
                if (err) {
                    console.error('MySQL 연결 오류: ', err);
                    reject({err:`${err}`})
                }

                const query = `UPDATE Post SET post_title = ?, post_content = ?, category = ? WHERE (post_id = ?);`

                pool.query(query,
                    [
                        postInfo.post_title,
                        postInfo.post_content,
                        postInfo.category,
                        postInfo.post_id,
                    ],
                    (err,result) => {
                        if (err) {
                            pool.releaseConnection(connection);
                            reject({
                                result: false,
                                status: 500,
                                err: `${err}`
                            });
                        } else {
                            pool.releaseConnection(connection);
                            resolve({
                                result: true,
                                status: 201,
                                post_id: postInfo.post_id
                            });
                        }
                    });
            });
        });
    }
    // unversity_url 입력받아 university_id 보내기
    static getUniversityUrlToID(university_url) {
        return new Promise(async (resolve, reject) => {
            pool.getConnection((err, connection) => {
                if (err) {
                    console.error('MySQL 연결 오류: ', err);
                    reject(err)
                }

                pool.query("SELECT university_id FROM University WHERE university_url=?;", [university_url], function (err, rows) {
                    pool.releaseConnection(connection);
                    if (err) {
                        console.error('Query 함수 오류', err);
                        reject(err)
                    }
                    resolve(rows[0].university_id);
                })
            })

        });
    }
    //최신순 포스트 리스트 불러오기
    static getPostListAll(university_id, page = 1, pageSize = 10) {
        return new Promise(async (resolve, reject) => {
            const offset = (page - 1) * pageSize;

            pool.getConnection((err, connection) => {
                if (err) {
                    console.error('MySQL 연결 오류: ', err);
                    reject(err)
                }

                const query = "SELECT * FROM Post WHERE university_id = ? ORDER BY post_id DESC";
                pool.query(query, [university_id], (err, data) => {
                    pool.releaseConnection(connection);
                    if (err) reject(`${err}`);
                    else {
                        resolve(data);
                    }
                });
            });
        })
    }
    //카테고리별로 게시글 불러오기
    static getPostListbyCategory(university_id, category) {
        return new Promise(async (resolve, reject) => {
            pool.getConnection((err, connection) => {
                if (err) {
                    console.error('MySQL 연결 오류: ', err);
                    reject(err)
                }

                pool.query("SELECT * FROM Post WHERE category=? AND university_id=?  ORDER BY post_id DESC;", [category, university_id], function (err, rows) {
                    pool.releaseConnection(connection);
                    if (err) {
                        console.error('Query 함수 오류', err);
                        reject(err)
                    }
                    resolve(rows);
                })
            })
        });
    }
    // 게시글 검색
    static async searchPost(keyword) {
        return new Promise(async (resolve, reject) => {
            pool.getConnection((err, connection) => {
                if (err) {
                    console.error('MySQL 연결 오류: ', err);
                    reject(err);
                }
                var k = '%' + keyword + '%';
                pool.query("SELECT * FROM Post WHERE post_title LIKE ?;", [k], function (err, rows) {
                    connection.release();
                    if (err) {
                        console.error('Query 오류', err);
                        reject(err);
                    }
                    resolve(rows);
                })
            });
        })
    }
     // 마이페이지) 내가 작성한 게시글 보기
     static getMyPost(userInfo) {
        const user_email = userInfo.user_email;
        return new Promise(async (resolve, reject) => {
            pool.getConnection((err, connection) => {
                if (err) {
                    console.error('MySQL 연결 오류: ', err);
                    reject(err)
                }

                pool.query("SELECT * FROM Post WHERE user_email=?  ORDER BY post_id DESC;", [user_email], function (err, rows) {
                    pool.releaseConnection(connection);
                    if (err) {
                        console.error('Query 함수 오류', err);
                        reject(err)
                    }
                    else if (rows.length < 1) {
                        pool.releaseConnection(connection);
                        resolve({ result: "현재 내가 작성한 게시글이 없습니다. 게시글을 작성해 보세요 :)", status: 202 });
                    }
                    resolve({ result: rows, status: 200 });
                })
            })
        });
    }
    //내가 작성한 게시글 삭제하기
    static goDeletePost(post_id, user_email) {
        return new Promise(async (resolve, reject) => {
            pool.getConnection((err, connection) => {
                if (err) {
                    console.error('MySQL 연결 오류: ', err);
                    reject(err);
                }

                const deleteCommentsQuery = 'DELETE FROM Comment WHERE post_id = ?';
                const checkQuery = 'SELECT * FROM Post WHERE post_id = ?';

                pool.query(deleteCommentsQuery, [post_id], (err) => {
                    if (err) {
                        pool.releaseConnection(connection);
                        reject({
                            result: false,
                            status: 500,
                            err: `${err}`
                        });
                    } else {
                        pool.query(checkQuery, [post_id], (err, result) => {
                            if (err) {
                                pool.releaseConnection(connection);
                                reject({
                                    result: false,
                                    status: 500,
                                    err: `${err}`
                                });
                            } else {
                                if (result.length > 0) {
                                    const post = result[0];
                                    if (post.user_email === user_email) {
                                        const deleteQuery = 'DELETE FROM Post WHERE post_id=? AND user_email = ?';
                                        pool.query(deleteQuery, [post_id, user_email], (err, result) => {
                                            pool.releaseConnection(connection);
                                            if (err) {
                                                reject({
                                                    result: false,
                                                    status: 500,
                                                    err: `${err}`
                                                });
                                            } else {
                                                if (result.affectedRows > 0) {
                                                    resolve({
                                                        result: true,
                                                        status: 200
                                                    });
                                                } else {
                                                    reject({
                                                        result: false,
                                                        status: 404,
                                                        err: '게시글을 찾을 수 없거나 삭제 권한이 없습니다.'
                                                    });
                                                }
                                            }
                                        });
                                    } else {
                                        pool.releaseConnection(connection);
                                        reject({
                                            result: false,
                                            status: 403,
                                            err: '게시글 삭제 권한이 없습니다.'
                                        });
                                    }
                                } else {
                                    pool.releaseConnection(connection);
                                    reject({
                                        result: false,
                                        status: 404,
                                        err: '게시글을 찾을 수 없습니다.'
                                    });
                                }
                            }
                        });
                    }
                });
            });
        });
    }
    //게시글 작성자 반환
    static postWriter(post_id) {
        return new Promise((resolve, reject) => {
            pool.getConnection((err, connection) => {
                if (err) {
                    console.error('MySQL 연결 오류: ', err);
                    reject(err);
                }
                pool.query("SELECT user_email FROM Post WHERE post_id = ?;", [post_id], function (err, rows) {
                    pool.releaseConnection(connection);
                    if (err) {
                        console.error('Query 함수 오류', err);
                        reject(err);
                    }
                    resolve(rows[0]);
                });
            });
        });
    }

}

module.exports = PostStorage;