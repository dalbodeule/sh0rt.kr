// https://velog.io/@awesomelon/%EA%B0%84%EB%8B%A8%ED%95%98%EA%B2%8C-%EB%82%9C%EC%88%98%ED%99%94-%EB%AC%B8%EC%9E%90%EC%97%B4-%EC%83%9D%EC%84%B1%ED%95%98%EA%B8%B0
const randomAddr = () => {
    return Math.random().toString(36).substring(2,11)
}

export default randomAddr