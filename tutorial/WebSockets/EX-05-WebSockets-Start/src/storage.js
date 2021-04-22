const STORAGE_KEY = 'tradovate-api-access-token'
const EXPIRATION_KEY = 'tradovate-api-access-expiration'

export const setAccessToken = (token, expiration) => {
    //if(!token || !expiration) throw new Error('attempted to set undefined token')
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

export const tokenIsValid = expiration => new Date(expiration) - new Date() > 0 