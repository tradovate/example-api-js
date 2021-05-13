import { URL } from './env'

const TOKEN_KEY = 'tradovate-api-access-token'

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

export const connect = async (data) => {
    let token = sessionStorage.getItem(TOKEN_KEY)
    //check to see if the expiration date is later than right now
    if(token) {
        console.log('Already connected. Using valid token.') // if we're connected we don't need a new token.
        return
    }
    const request = buildRequest(data)

    const res = await fetch(URL + '/auth/accesstokenrequest', request)
    const json = await res.json()

    console.log(json)

    sessionStorage.setItem(TOKEN_KEY, json)
}