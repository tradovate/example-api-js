import { DEMO_URL } from './env'
import { setAccessToken, getAccessToken, tokenIsValid, setAvailableAccounts, getAvailableAccounts} from './storage'

const buildRequest = (data, ticket = '') => {

    let raw_body = data
    if(ticket) {
        raw_body['p-ticket'] = ticket
    }
    const body = JSON.stringify(raw_body)

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

const handleRetry = async (request, json) => {
    const ticket    = json['p-ticket'],
          time      = json['p-time']

    console.log(`Time Penalty present. Retrying operation in ${time}s`)

    //save the timeout id so we can prevent it from recursing forever
    let timeout

    const retry = () => {
        return new Promise((res) => {

            let js

            timeout = setTimeout(async () => {
                js = await fetch(DEMO_URL + '/auth/accesstokenrequest', buildRequest(request, ticket))
                    .catch(console.error)
                    .then(res => res.json())
    
                if(!js['p-ticket']) {
                    const { errorText, accessToken, userId, userStatus, name, expirationTime } = js
                    if(errorText) {
                        console.error(errorText)
                        return
                    }

                    //get account info
                    const accRes = await fetch(DEMO_URL + '/account/list', {
                        method: 'GET',
                        headers: {
                            Authorization: `Bearer ${token}`,
                            Accept: 'application/json',
                            'Content-Type': 'application/json'
                        }
                    })

                    const accs = await accRes.json()

                    setAvailableAccounts(accs)

                    setAccessToken(accessToken, expirationTime)

                    console.log(`Successfully stored access token ${accessToken} for user {name: ${name}, ID: ${userId}, status: ${userStatus}}.`)
                }
            }, time * 1000)

            res(js)
            return
        }) 
    }
    clearTimeout(timeout)
    return await retry() //clear timeout and recurse if we didn't get an OK response
}

export const connect = async (data) => {
    let { token, expiration } = getAccessToken()
    console.log(token, expiration)
    if(token && tokenIsValid(expiration) && Array.isArray(getAvailableAccounts())) {
        console.log('Already connected. Using valid token.')
        return
    }

    const request = buildRequest(data)

    let js = await fetch(DEMO_URL + '/auth/accesstokenrequest', request).then(res => res.json())

    if(js['p-ticket']) {
        return handleRetry(data, js) 
    } else {
        const { errorText, accessToken, userId, userStatus, name, expirationTime } = js

        if(errorText) {
            console.error(errorText)
            return
        }

        //get account info
        const accRes = await fetch(DEMO_URL + '/account/list', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })

        const accs = await accRes.json()

        console.log(accs)

        setAvailableAccounts(accs)

        setAccessToken(accessToken, expirationTime)

        console.log(`Successfully stored access token ${accessToken} for user {name: ${name}, ID: ${userId}, status: ${userStatus}}.`)
    }
}