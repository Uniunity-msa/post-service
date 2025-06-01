# 1. Node.js 베이스 이미지 사용
FROM node:18

# 2. 컨테이너 내부 작업 디렉토리 지정
WORKDIR /app

# nc 설치 추가
RUN apt-get update && apt-get install -y netcat-openbsd && rm -rf /var/lib/apt/lists/*

# 3. package.json 복사 후 의존성 설치
COPY package*.json ./
RUN npm install

# 4. 전체 소스 코드 복사
COPY . .

# 5. wait-for.sh 실행 권한 부여
RUN chmod +x wait-for.sh

# 6. 앱이 사용하는 포트 열기 (ex: 3000)

EXPOSE 3000

# 6. 서버 실행
CMD ["./wait-for.sh", "post-service-db", "3306", "node", "index.js"]
