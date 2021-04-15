import { DEMO_URL } from './env'
import { getAccessToken, setAccessToken, tokenIsValid } from './storage'

const buildRequest = (data, ticket = '') => {
    const body = ticket ? JSON.stringify({...data, 'p-ticket': ticket}) : JSON.stringify(data)
    const request = {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body,
    }
    return request
}

const handleRetry = (request, json, ok) => {
    const ticket    = json['p-ticket'],
          time      = json['p-time']

    console.log(`Time Penalty present. Retrying operation in ${time}s`)

    setTimeout(() => {
        fetch(DEMO_URL + '/auth/accesstokenrequest?', buildRequest(request, ticket))
            .then(res => res.json())
            .then(js => {
                if(js['p-ticket']) {
                    handleRetry(request, js, ok) 
                } else {
                    const { accessToken, userId, userStatus, name, expirationTime } = js
                    setAccessToken(accessToken, expirationTime)
                    console.log(`Successfully stored access token for user {name: ${name}, ID: ${userId}, status: ${userStatus}}.`)
                }
            })
        }, time * 1000)
}

export const connect = async (data) => {
    let { token, expiration } = getAccessToken()

    if(token && tokenIsValid(expiration)) {
        console.log('Already connected. Using valid token.')
        return
    }

    const request = buildRequest(data)

    let js = await fetch(DEMO_URL + '/auth/accesstokenrequest', request).then(res => res.json())

    if(js['p-ticket']) {
        handleRetry(request, js, ok) 
    } else {
        const { errorText, accessToken, userId, userStatus, name, expirationTime } = js
        if(errorText) {
            console.error(errorText)
            return
        }
        setAccessToken(accessToken, expirationTime)
        console.log(`Successfully stored access token for user {name: ${name}, ID: ${userId}, status: ${userStatus}}.`)
    }
}