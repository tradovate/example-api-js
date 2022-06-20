import { getAccessToken } from './storage'
import { URLs } from '../../../tutorialsURLs'

const { DEMO_URL, LIVE_URL } = URLs

/**
 * Call to make GET requests to the Tradovate REST API. The passed `query` object will be reconstructed to a query string and placed in the query position of the URL.
 * ```js
 * //no parameters
 *  const jsonResponseA = await tvGet('/account/list')
 *
 * //parameter object, URL will become '/contract/item?id=2287764'
 * const jsonResponseB = await tvGet('/contract/item', { id: 2287764 })
 * ```
 * 
 * New! You can interact with the browser devolopers' console. In the console enter commands:
 * ```
 * > tradovate.get('/account/list') //=> account data []
 * > tradovate.get('/contract/item', {id: 12345}) //=> maybe contract
 * ```
 * 
 * @param {string} endpoint 
 * @param {{[k:string]: any}} query object key-value-pairs will be converted into query, for ?masterid=1234 use `{masterid: 1234}`
 * @param {'demo' | 'live'} env 
 * @returns 
 */
export const tvGet = async (endpoint, query = null, env = 'demo') => {
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

        console.log('With query:', q.toString() || '<no query>')

        let baseURL = env === 'demo' ? DEMO_URL : env === 'live' ? LIVE_URL : ''        
        if(!baseURL) throw new Error(`[Services:tvGet] => 'env' variable should be either 'live' or 'demo'.`)

        let url = query !== null
            ? baseURL + endpoint + q
            : baseURL + endpoint

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
 * 
 * @param {string} endpoint 
 * @param {{[k:string]: any}} data 
 * @param {boolean} _usetoken 
 * @param {'live' | 'demo'} env 
 * @returns 
 */
export const tvPost = async (endpoint, data, _usetoken = true, env = 'demo') => {
    const { token } = getAccessToken()
    const bearer = _usetoken ? { Authorization: `Bearer ${token}` } : {} 

    let baseURL = env === 'demo' ? DEMO_URL : env === 'live' ? LIVE_URL : ''
    if(!baseURL) throw new Error(`[Services:tvPost] => 'env' variable should be either 'live' or 'demo'.`)

    try {
        const res = await fetch(baseURL + endpoint, {
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

//New! Interact with the API via browser console.
window.tradovate = {
    get: tvGet,
    post: tvPost
}