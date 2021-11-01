const STORAGE_KEY       = 'tradovate-api-access-token'
const EXPIRATION_KEY    = 'tradovate-api-access-expiration'
const DEVICE_ID_KEY     = 'tradovate-device-id'
const AVAIL_ACCTS_KEY   = 'tradovate-api-available-accounts'
const USER_DATA_KEY     = 'tradovate-user-data'

export const setDeviceId = (id) => {
    sessionStorage.setItem(DEVICE_ID_KEY, id)
}

export const getDeviceId = () => {
    return sessionStorage.getItem(DEVICE_ID_KEY)
}

export const setAvailableAccounts = accounts => {
    sessionStorage.setItem(AVAIL_ACCTS_KEY, JSON.stringify(accounts))
}

/**
 * Returns and array of available accounts or undefined.
 * @returns Account[]
 */
export const getAvailableAccounts = () => {
    return JSON.parse(sessionStorage.getItem(AVAIL_ACCTS_KEY))
}

/**
 * Use a predicate function to find an account. May be undefined.
 */
export const queryAvailableAccounts = predicate => {
    return JSON.parse(getAvailableAccounts()).find(predicate)
}

export const setAccessToken = (token, expiration) => {
    //if(!token || !expiration) throw new Error('attempted to set undefined token')
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

export const tokenIsValid = expiration => new Date(expiration) - new Date() > 0 

export const setUserData = (data) => sessionStorage.setItem(USER_DATA_KEY, JSON.stringify(data))
export const getUserData = () => JSON.parse(sessionStorage.getItem(USER_DATA_KEY))