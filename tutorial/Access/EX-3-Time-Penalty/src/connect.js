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

const handleRetry = (request, json, ok) => {
    const ticket    = json['p-ticket'],
          time      = json['p-time']

    console.log(`Time Penalty present. Retrying operation in ${time}s`)

    setTimeout(() => {
        fetch(URL + '/auth/accesstokenrequest', buildRequest(request, ticket))
            .then(res => res.json())
            .then(js => {
                js['p-ticket'] ? handleRetry(request, js, ok) : ok(js)
            })
        }, time * 1000)
}

const default_err = request => {
    request.json().then(js => console.log(js))
}

export const connect = (data, ok, err = default_err) => {
    let { token, expiration } = getAccessToken()

    if(token && new Date(expiration) - new Date() > 0) {
        console.log('Already connected. Using valid token.')
        return
    }

    const request = buildRequest(data)

    fetch(URL + '/auth/accesstokenrequest', request)
        .then(res => res.json(), err)
        .then(js => {
            js['p-ticket'] 
                ? handleRetry(request, js, ok) 
                : ok(js)
        })
}