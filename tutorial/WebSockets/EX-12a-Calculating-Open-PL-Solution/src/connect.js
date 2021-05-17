import { setAccessToken, getAccessToken, tokenIsValid, setAvailableAccounts } from './storage'
import { tvGet, tvPost } from './services'

const handleRetry = async (data, json) => {
    const ticket    = json['p-ticket'],
          time      = json['p-time']

    console.log(`Time Penalty present. Retrying operation in ${time}s`)

    //save the timeout id so we can prevent it from recursing forever
    let timeout

    const retry = () => {
        return new Promise((res) => {

            let authResponse

            timeout = setTimeout(async () => {
                authResponse = await tvPost('/auth/accesstokenrequest', { ...data, 'p-ticket': ticket })

                if(!authResponse['p-ticket']) {
                    const { errorText, accessToken, userId, userStatus, name, expirationTime } = authResponse

                    if(errorText) {
                        console.error(errorText)
                        return
                    }

                    const accounts = await tvGet('/account/list')

                    console.log(accounts)

                    setAvailableAccounts(accounts)
                    setAccessToken(accessToken, expirationTime)
                    res()
                    console.log(`Successfully stored access token ${accessToken} for user {name: ${name}, ID: ${userId}, status: ${userStatus}}.`)
                }
            }, time * 1000)

            return
        }) 
    }
    clearTimeout(timeout)
    return await retry() //clear timeout and recurse if we didn't get an OK response
}

export const connect = async (data) => {
    let { token, expiration } = getAccessToken()

    if(token && tokenIsValid(expiration)) {
        console.log('Already connected. Using valid token.') 
        const accounts = await tvGet('/account/list')
        console.log(accounts)
        setAvailableAccounts(accounts)      
        return
    }

    const authResponse = await tvPost('/auth/accesstokenrequest', data, false)
    console.log(authResponse)
    if(authResponse['p-ticket']) {
        return await handleRetry(data, authResponse) 
    } else {
        const { errorText, accessToken, userId, userStatus, name, expirationTime } = authResponse

        if(errorText) {
            console.error(errorText)
            return
        }

        const accounts = await tvGet('/account/list')

        console.log(accounts)

        setAvailableAccounts(accounts)
        setAccessToken(accessToken, expirationTime)

        console.log(`Successfully stored access token ${accessToken} for user {name: ${name}, ID: ${userId}, status: ${userStatus}}.`)
    }
}