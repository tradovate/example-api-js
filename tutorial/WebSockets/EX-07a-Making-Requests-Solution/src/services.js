import { getAccessToken } from './storage'
import { URLs } from '../../../tutorialsURLs'

const { DEMO_URL } = URLs

export const tvGet = async (endpoint, query = null) => {
    const { token } = getAccessToken()
    try {
        let q = ''
        if(query) {
            q = Object.keys(query).reduce((acc, next, i, arr) => {
                acc += next + '=' + query[next]
                if(i !== arr.length - 1) acc += '&'
                return acc
            }, '?')
        }

        console.log(q.toString())
        let url = query !== null
            ? DEMO_URL + endpoint + q
            : DEMO_URL + endpoint

        console.log(url)

        const res = await fetch(url, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
                'Content-Type': 'application/json'
            }
        })

        const js = await res.json()

        return js

    } catch(err) {
        console.error(err)
    }
}

export const tvPost = async (endpoint, data, _usetoken = true) => {
    const { token } = getAccessToken()
    const bearer = _usetoken ? { Authorization: `Bearer ${token}` } : {} 
    try {
        const res = await fetch(DEMO_URL + endpoint, {
            method: 'POST',
            headers: {
                ...bearer,
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })

        const js = await res.json()

        return js

    } catch(err) {
        console.error(err)
    }
}

