import { tvPost } from './services'
import { getAccessToken, setAccessToken, tokenIsValid } from './storage'

export const connect = async (data) => {
    const { token, expiration } = getAccessToken()
    if(token && tokenIsValid(expiration)) {
        console.log('Already have an access token. Using existing token.')
        return
    }
    const { accessToken, expirationTime } = await tvPost('/auth/accesstokenrequest', data, false)

    setAccessToken(accessToken, expirationTime)
}