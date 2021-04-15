import { URL } from './env'

const buildRequest = (data) => {
    //Server expects JSON body
    const body = JSON.stringify(data)
    return {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body,
    }
}

export const connect = (data) => {
    let { token, expiration } = getAccessToken()
    //check to see if the expiration date is later than right now
    if(token && new Date(expiration) - new Date() > 0) {
        console.log('Already connected. Using valid token.') // if we're connected we don't need a new token.
        return
    }
    const request = buildRequest(data)

    fetch(URL + '/auth/accesstokenrequest', request)
        .catch(console.error)
        .then(res => res.json())
        .then(console.log)    
}