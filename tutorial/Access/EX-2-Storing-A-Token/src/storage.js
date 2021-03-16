const STORAGE_KEY = 'tradovate-api-access-token'
const EXPIRATION_KEY = 'tradovate-api-access-expiration'

export const setAccessToken = (token, expiration) => {
    localStorage.setItem(STORAGE_KEY, token)
    localStorage.setItem(EXPIRATION_KEY, expiration)
}

export const getAccessToken = () => {
    const token = localStorage.getItem(STORAGE_KEY)
    const expiration = localStorage.getItem(EXPIRATION_KEY)
    if(!token) {
        console.warn('No access token retrieved. Please request an access token.')
    }
    return { token, expiration }
}