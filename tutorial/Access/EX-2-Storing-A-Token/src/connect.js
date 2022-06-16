import { tvPost } from './services'
import { getAccessToken, setAccessToken, tokenIsValid } from './storage'

export const connect = async (data) => {
    const { token, expiration } = getAccessToken()
    if(token && tokenIsValid(expiration)) {
        console.log('Already have an access token. Using existing token.')
        return
    }
    const authResponse = await tvPost('/auth/accesstokenrequest', data, false)

    const { accessToken, expirationTime } = authResponse

    console.log(authResponse)
    
    setAccessToken(accessToken, expirationTime)
}