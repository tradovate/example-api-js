import { URL } from './env'
import { getAccessToken } from './storage'

const buildRequest = (data, ticket = '') => {
    const body = JSON.stringify(data)
    const request = {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body,
    }
    if(ticket) {
        request.headers.Authorization = `Bearer ${ticket}`
    }
    return request
}

const handleRetry = async (request, json) => {
    const ticket    = json['p-ticket'],
          time      = json['p-time']

    console.log(`Time Penalty present. Retrying operation in ${time}s`)

    let jsonResp

    const retry = () => 
        new Promise((res) => {
            setTimeout(async () => {
                jsonResp = await fetch(URL + '/auth/accesstokenrequest', buildRequest(request, ticket))
                    .catch(console.error)
                    .then(res => res.json())
                    .then(js => {
                        const { errorText, accessToken, userId, userStatus, name, expirationTime } = js
                        if(errorText) {
                            console.error(errorText)
                            return
                        }
                        setAccessToken(accessToken, expirationTime)
                        console.log(`Successfully stored access token for user {name: ${name}, ID: ${userId}, status: ${userStatus}}.`)
                        
                    })
                }, 
                time * 1000
            )
            res(jsonResp)
        })
        
    return await retry()
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
        return handleRetry(request, js) 
    } else {
        const { errorText, accessToken, userId, userStatus, name, expirationTime } = js
        if(errorText) {
            console.error(errorText)
            return
        }
        setAccessToken(accessToken, expirationTime)
        console.log(`Successfully stored access token {accessToken} for user {name: ${name}, ID: ${userId}, status: ${userStatus}}.`)
    }
}