import { getAccessToken } from './storage'
import { URLs } from '../../../tutorialsURLs'

const { DEMO_URL } = URLs

/**
 * Call to make GET requests to the Tradovate REST API. `query` will be placed in the query position of the URL.
 * ```js
 * //no parameters
 *  const jsonResponseA = await tvGet('/account/list')
 *
 * //parameter object, URL will become '/contract/item?id=2287764'
 * const jsonResponseB = await tvGet('/contract/item', { id: 2287764 })
 * ```
 * @param {string} endpoint 
 * @param {{[k: string]: any}} query 
 * @returns 
 */
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

        //console.log(q.toString())
        let url = query !== null
            ? DEMO_URL + endpoint + q
            : DEMO_URL + endpoint

        //console.log(url)

        const res = await fetch(url, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
                'Content-Type': 'application/json'
            }
        })

        const js = await res.json()

        //console.log(js)

        return js

    } catch(err) {
        console.error(err)
    }
}

/**
 * Use this function to make POST requests to the Tradovate REST API. `data` will be placed in the body of the request as JSON.
 * ```js
 * //placing an order with tvPost 
 * const jsonResponseC = await tvPost('/order/placeorder', {
 *   accountSpec: myAcct.name,
 *   accountId: myAcct.id,
 *   action: 'Buy',
 *   symbol: 'MNQM1',
 *   orderQty: 2,
 *   orderType: 'Market',
 *   isAutomated: true //was this order placed by you or your robot?
 * })
 * ```
 * @param {string} endpoint The Tradovate API endpoint to access
 * @param {{[k:string]: any}} data data to send with your request
 * @param {boolean} _usetoken use false to opt out of the Bearer authorization scheme. You will want this to be false only if you are sending an `accessTokenRequest` 
 * @returns 
 */
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

        //console.log(js)

        return js

    } catch(err) {
        console.error(err)
    }
}

