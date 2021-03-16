import { URL } from './env'
import { getAccessToken } from './storage'

export const accountList = (ok, err) => {
    const { token } = getAccessToken()

    if(!token) {
        console.error('No Access Token found locally. Please acquire an access token and try again.')
    }

    fetch(URL + '/account/list', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
        },
    }).then(
        res => res.json().then(ok),
        e => err(e)    
    )
}