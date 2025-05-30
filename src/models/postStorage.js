"use strict"
const { reject } = require("underscore");

const { pool } = require("../config/db");
const { uploadImageToGCS } = require("../utils/gcsUploader");



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
                const query = 'INSERT INTO Post(user_email, user_nickname, university_id, post_title, post_content, category, post_date) VALUES (?,?,?,?,?,?,?);';
                pool.query(query,
                    [
                        postInfo.user_email,
                        postInfo.user_nickname,
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
     //게시글 등록시 post이미지 저장(클라우드 스토리지 사용방식으로 변경)
    
    static async saveImagePost(postId, postInfo, formattedDateTime) {
        return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            if (err) return reject(err);
    
            try {
            const post_id = postId;
    
            // src="data:image/..." 태그에서 base64 이미지 추출
            const regex = /<img\s+src="([^"]+)"\s+alt="[^"]+"\s+contenteditable="false">/gi;
            const matches = postInfo.match(regex);
    
            if (!matches || matches.length === 0) {
                connection.release();
                return resolve({ result: true, status: 201 });
            }
    
            // 첫 번째 이미지만 처리 (여러 개 저장 원하면 반복문으로 확장 가능)


            const base64Image = matches[0].match(/src="([^"]+)"/)[1];
            const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
            const buffer = Buffer.from(base64Data, "base64");
    
            const uploadedUrl = await uploadImageToGCS(buffer, `post_${post_id}.jpg`);
    
            const imageQuery = 'INSERT INTO PostImage(image_id, post_id, image_url, image_date) VALUES (?, ?, ?, ?);';
            connection.query(imageQuery, [null, post_id, uploadedUrl, formattedDateTime], (imageErr) => {
                connection.release();
                if (imageErr) {
                return reject({ result: false, status: 500, err: `${imageErr}` });
                }
                return resolve({ result: true, status: 201 });
            });
            } catch (err) {
            connection.release();
            reject({ result: false, status: 500, err: `${err}` });
            }
        });
        });
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
    // // unversity_url 입력받아 university_id 보내기
    // static getUniversityUrlToID(university_url) {
    //     return new Promise(async (resolve, reject) => {
    //         pool.getConnection((err, connection) => {
    //             if (err) {
    //                 console.error('MySQL 연결 오류: ', err);
    //                 reject(err)
    //             }

    //             pool.query("SELECT university_id FROM University WHERE university_url=?;", [university_url], function (err, rows) {
    //                 pool.releaseConnection(connection);
    //                 if (err) {
    //                     console.error('Query 함수 오류', err);
    //                     reject(err)
    //                 }
    //                 resolve(rows[0].university_id);
    //             })
    //         })

    //     });
    // }
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
    //내가 작성한 게시글 삭제하기
static goDeletePost(post_id, user_email) {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, connection) => {
            if (err) {
                console.error('MySQL 연결 오류: ', err);
                return reject({
                    result: false,
                    status: 500,
                    err: `${err}`
                });
            }

            const checkQuery = 'SELECT * FROM Post WHERE post_id = ?';

            connection.query(checkQuery, [post_id], (err, result) => {
                if (err) {
                    connection.release();
                    return reject({
                        result: false,
                        status: 500,
                        err: `${err}`
                    });
                }

                if (result.length === 0) {
                    connection.release();
                    return reject({
                        result: false,
                        status: 404,
                        err: '게시글을 찾을 수 없습니다.'
                    });
                }

                const post = result[0];
                if (post.user_email !== user_email) {
                    connection.release();
                    return reject({
                        result: false,
                        status: 403,
                        err: '게시글 삭제 권한이 없습니다.'
                    });
                }

                const deleteQuery = 'DELETE FROM Post WHERE post_id = ? AND user_email = ?';
                connection.query(deleteQuery, [post_id, user_email], (err, result) => {
                    connection.release();
                    if (err) {
                        return reject({
                            result: false,
                            status: 500,
                            err: `${err}`
                        });
                    }

                    if (result.affectedRows > 0) {
                        return resolve({
                            result: true,
                            status: 200
                        });
                    } else {
                        return reject({
                            result: false,
                            status: 404,
                            err: '게시글을 찾을 수 없거나 삭제 권한이 없습니다.'
                        });
                    }
                });
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

    // 게시글 댓글 수 증가
    static updatePostCommentCount(post_id) {
        return new Promise((resolve, reject) => {
            pool.getConnection((err, connection) => {
                if (err) {
                    console.error('MySQL 연결 오류: ', err);
                    reject(err);
                    return;
                }

                const query = 'UPDATE Post SET comment_count = comment_count + 1 WHERE post_id = ?';

                connection.query(query, [post_id], (err) => {
                    pool.releaseConnection(connection);
                    if (err) {
                        console.error('Query 오류: ', err);
                        reject({ result: false, err: `${err}` });
                    } else {
                        resolve({ result: true });
                    }
                });
            });
        });
    }

    // 게시글 댓글 수 감소
    static reducePostCommentCount(post_id) {
        return new Promise((resolve, reject) => {
            pool.getConnection((err, connection) => {
                if (err) {
                    console.error('MySQL 연결 오류: ', err);
                    reject(err);
                    return;
                }

                const query = 'UPDATE Post SET comment_count = comment_count - 1 WHERE post_id = ?';

                connection.query(query, [post_id], (err) => {
                    pool.releaseConnection(connection);
                    if (err) {
                        console.error('Query 오류: ', err);
                        reject({ result: false, err: `${err}` });
                    } else {
                        resolve({ result: true });
                    }
                });
            });
        });
    }
    //좋아요 증가 감소
    static updatePostLikeCount(post_id, delta) {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, connection) => {
        if (err) return reject(err);

        const query = `UPDATE Post SET like_count = like_count + ? WHERE post_id = ?`;
        connection.query(query, [delta, post_id], (err) => {
            connection.release();
            if (err) reject({ result: false, err: `${err}` });
            else resolve({ result: true });
        });
        });
    });
    }
  //스크랩 증가 감소

    static updatePostScrapCount(post_id, delta) {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, connection) => {
        if (err) return reject(err);
        const query = `UPDATE Post SET scrap_count = scrap_count + ? WHERE post_id = ?`;
        connection.query(query, [delta, post_id], (err) => {
            connection.release();
            if (err) reject({ result: false, err: `${err}` });
            else resolve({ result: true });
        });
        });
    });
    }
  


// 마이페이지) 내가 작성한 게시글 보기
static getMyPost(userInfo) {
    const user_email = userInfo;
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
// 마이페이지 - 내가 작성한 댓글 단 게시글 불러오기
static getMyCommentPost(post_ids) {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, connection) => {
            if (err) {
                console.error('MySQL 연결 오류:', err);
                return reject(err);
            }

            // post_ids가 없거나 빈 배열이면 처리
            if (!post_ids || post_ids.length === 0) {
                connection.release();
                return resolve({ result: "현재 내가 댓글 단 게시글이 없습니다. 게시글에 댓글을 작성해 보세요 :)", status: 202 });
            }

            const sql = "SELECT * FROM Post WHERE post_id IN (?) ORDER BY post_id DESC";

            connection.query(sql, [post_ids], (err, rows) => {
                connection.release();

                if (err) {
                    console.error('Query 함수 오류', err);
                    return reject(err);
                }

                if (rows.length === 0) {
                    return resolve({ result: "현재 내가 댓글 단 게시글이 없습니다. 게시글에 댓글을 작성해 보세요 :)", status: 202 });
                }

                return resolve({ result: rows, status: 200 });
            });
        });
    });
}

// 마이페이지) user_email에 해당하는 사용자의 하트 목록 보여주기
static getUserHeartList(post_ids) {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, connection) => {
            if (err) {
                console.error('MySQL 연결 오류:', err);
                return reject(err);
            }

            // post_ids가 없거나 빈 배열이면 처리
            if (!post_ids || post_ids.length === 0) {
                connection.release();
                return resolve({ result: "현재 내가 좋아요한 게시글이 없습니다. 게시글에 좋아요를 눌러보세요 :)", status: 202 });
            }

            const sql = "SELECT * FROM Post WHERE post_id IN (?) ORDER BY post_id DESC";
            connection.query(sql, [post_ids], (err, rows) => {
                connection.release();

                if (err) {
                    console.error('Query 함수 오류', err);
                    return reject(err);
                }

                if (rows.length === 0) {
                    return resolve({ result: "현재 내가 좋아요한 게시글이 없습니다. 게시글에 좋아요를 눌러보세요 :)", status: 202 });
                }

                return resolve({ result: rows, status: 200 });
            });
        });
    });
}

// 마이페이지) post_id에 해당하는 사용자의 스크랩 목록 보여주기
static getUserScrapList(post_ids) {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, connection) => {
            if (err) {
                console.error('MySQL 연결 오류:', err);
                return reject(err);
            }

            // post_ids가 없거나 빈 배열이면 처리
            if (!post_ids || post_ids.length === 0) {
                connection.release();
                return resolve({ result: "현재 내가 스크랩한 게시글이 없습니다. 게시글을 스크랩해 보세요 :)", status: 202 });
            }

            const sql = "SELECT * FROM Post WHERE post_id IN (?) ORDER BY post_id DESC";

            connection.query(sql, [post_ids], (err, rows) => {
                connection.release();

                if (err) {
                    console.error('Query 함수 오류', err);
                    return reject(err);
                }

                if (rows.length === 0) {
                    return resolve({ result: "현재 내가 스크랩한 게시글이 없습니다. 게시글을 스크랩해 보세요 :)", status: 202 });
                }

                return resolve({ result: rows, status: 200 });
            });
        });
    });
}
static getImagesInfo(university_id) {
    console.log('postStorage.getImagesInfo 실행');

    return new Promise((resolve, reject) => {
        pool.getConnection((err, connection) => {
            if (err) {
                console.error('MySQL 연결 오류: ', err);
                return reject(err);
            }

            const query = `
                SELECT p.post_id, i.image_url
                FROM Post p
                LEFT JOIN PostImage i ON p.post_id = i.post_id
                WHERE p.university_id = ?
            `;

            connection.query(query, [university_id], (err, results) => {
                connection.release();

                if (err) {
                    console.error('쿼리 실행 오류: ', err);
                    return reject(err);
                }

                // 응답 형식에 맞게 데이터 정제
                const post_info = results.map(row => ({
                    post_id: row.post_id,
                    img_url: row.image_url
                }));

                resolve({ post_info });
            });
        });
    });
}

}

module.exports = PostStorage;
