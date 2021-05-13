const STORAGE_KEY = 'tradovate-api-access-token'
const EXPIRATION_KEY = 'tradovate-api-access-expiration'

export const setAccessToken = (token, expiration) => {
    sessionStorage.setItem(STORAGE_KEY, token)
    sessionStorage.setItem(EXPIRATION_KEY, expiration)
}

export const getAccessToken = () => {
    const token = sessionStorage.getItem(STORAGE_KEY)
    const expiration = sessionStorage.getItem(EXPIRATION_KEY)
    if(!token) {
        console.warn('No access token retrieved. Please request an access token.')
    }
    return { token, expiration }
}