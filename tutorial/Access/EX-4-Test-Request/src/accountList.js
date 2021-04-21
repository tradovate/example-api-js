import { URL } from './env'
import { getAccessToken } from './storage'

export const accountList = async () => {
    const { token } = getAccessToken()

    if(!token) {
        console.error('No Access Token found locally. Please acquire an access token and try again.')
    }

    const js = await fetch(URL + '/account/list', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
        },
    })
    .catch(console.error)
    .then(res => res.json())

    return js
}