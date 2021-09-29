# WebRTC Project

Zoom Clone using NodeJS, WebRTC and WebSocket

# nodemon : 소스코드가 수정될 때마다 서버 자동으로 재시작
# 이 프로젝트에서는 "exec" : "babel-node src/server/js"로 명시되어 있는데, 소스코드가 변경될 때 마다 서버 재시작 대신 babel-node src/server.js 파일을 실행함.
# babel-node 파일은 내가 작성한 js 문법의 코드를 일반적인 node.js 문법 코드로 변역해 주는 역할을 하며, src/server.js에 컴파일 해준다.
# babel-node를 실행시키면 babel-node는 바로 babel.config.json을 찾고 babel.config.json 파일에서 코드에 적용해야 하는 presets을 실행

# "ignore": ["src/public/*"]
#   -> 사용자에게만 보여지는 프론트엔드 app.js가 수정될 때마다 nodemon으로 서버가 재시작 되는것을 막음 (views나 server가 수정될 때 마다 재시작 하도록 설정)

# webpack : server side js 코드가 늘어나면 관리나 유지보수가 어려우므로 이를 모듈별로 묶어줌

# package.json : spring으로 따지만 maven같은 라이브러리 설정 파일, 어떤 라이브러리나 모듈을 다운받아 사용하는지를 정의 및 설명해 놓은 파일
# scripts에 실행할 파일명 기재,
# dependencies : 모듈 및 라이브러리의 name과 version 기재, 배포시 프로덕션 환경에서 필요한 라이브러리 파일 기재
# devDependencies : 로컬 환경 및 테스트시 필요한 라이브러리 파일 기재

# package-lock.json : package.json 파일 보다 좀 더 디테일하게 정의해 놓은 파일
# package,json과 package-lock.json 파일의 차이점 : https://velog.io/@songyouhyun/Package.json%EA%B3%BC-Package-lock.json%EC%9D%98-%EC%B0%A8%EC%9D%B4 참조

# babel : 자주 업데이트 되는 js 문법을 자동으로 개발 환경에 맞게 바꿔줌
# ex) es6 문법으로 개발하면 자동으로 es5로 바꿔줌

# app.js : 프론트엔드 단에서 구동되는 코드
# server.js : 백엔드 단에서 구동되는 코드
# pug : html, css, java script 파일 include

# emit() : 이벤트를 다른쪽으로 전달하고 싶은 경우 사용
# on() : 전달된 이벤트를 받음