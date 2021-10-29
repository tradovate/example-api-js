const STORAGE_KEY       = 'tradovate-api-access-token'
const EXPIRATION_KEY    = 'tradovate-api-access-expiration'
const DEVICE_ID_KEY     = 'tradovate-device-id'
const AVAIL_ACCTS_KEY   = 'tradovate-api-available-accounts'

export const setAvailableAccounts = accounts => {
    sessionStorage.setItem(AVAIL_ACCTS_KEY, JSON.stringify(accounts))
}

/**
 * Returns and array of available accounts or undefined.
 * @returns Account[]
 */
export const getAvailableAccounts = () => {
    return JSON.parse(sessionStorage.getItem(JSON.parse(AVAIL_ACCTS_KEY)))
}

/**
 * Use a predicate function to find an account. May be undefined.
 */
export const queryAvailableAccounts = predicate => {
    return getAvailableAccounts().find(predicate)
}

export const setDeviceId = (id) => {
    sessionStorage.setItem(DEVICE_ID_KEY, id)
}

export const getDeviceId = () => {
    return sessionStorage.getItem(DEVICE_ID_KEY)
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