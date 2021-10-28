import { setAccessToken, getAccessToken, tokenIsValid, setAvailableAccounts, setUserData, getUserData } from './storage'
import { tvGet, tvPost } from './services'
import { waitForMs } from './utils/waitForMs'


const handleRetry = async (data, json) => {
    const ticket    = json['p-ticket'],
          time      = json['p-time'],
          captcha   = json['p-captcha']

    if(captcha) {
        console.error('Captcha present, cannot retry auth request via third party application. Please try again in an hour.')
        return
    }

    console.log(`Time Penalty present. Retrying operation in ${time}s`)

    await waitForMs(time * 1000) 
    await connect({ ...data, 'p-ticket': ticket })   
}

export const connect = async (data) => {
    let { token, expiration } = getAccessToken()

    if(token && tokenIsValid(expiration)) {
        console.log('Already connected. Using valid token.') 
        const accounts = await tvGet('/account/list')
        const { token, expiration } = getAccessToken()
        const { userId, name } = getUserData()
        setAvailableAccounts(accounts)      
        return { accessToken: token, expirationTime: expiration, userId, name }
    }

    const authResponse = await tvPost('/auth/accesstokenrequest', data, false)

    if(authResponse['p-ticket']) {
        return await handleRetry(data, authResponse) 
    } else {
        const { errorText, accessToken, userId, userStatus, name, expirationTime } = authResponse

        if(errorText) {
            console.error(errorText)
            return
        }
        
        setAccessToken(accessToken, expirationTime)

        setUserData({ userId, name })

        const accounts = await tvGet('/account/list')

        console.log(accounts)

        setAvailableAccounts(accounts)

        console.log(`Successfully stored access token ${accessToken} for user {name: ${name}, ID: ${userId}, status: ${userStatus}}.`)

        return authResponse
    }
}