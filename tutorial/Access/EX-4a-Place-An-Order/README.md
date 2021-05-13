# Placing an Order
Now that we've learned how to write requests using the Tradovate API, let's do something a bit more exciting. In this tutorial,
I'll cover how to place an order using the basics we already know. When we left off, we had written a simple test request that 
used the `'/account/list'` to receive a list of Demo accounts available on the `trader-d` development server. We will use the same
process to build a request for placing an order.

First create a new file in your `src` folder called `placeOrder.js`. If you look at the [API docs](https://api.tradovate.com/#operation/placeOrder)
for `'/orders/placeOrder'`, you'll see that there are quite a few parameters for placing orders:

```js
{
    accountSpec: "string",
    accountId: 0,
    clOrdId: "string",
    action: "Buy",          //required
    symbol: "string",       //required
    orderQty: 0,            //required
    orderType: "Limit",     //required
    price: 0,
    stopPrice: 0,
    maxShow: 0,
    pegDifference: 0,
    timeInForce: "Day",
    expireTime: "2019-08-24T14:15:22Z",
    text: "string",
    activationTime: "2019-08-24T14:15:22Z",
    customTag50: "string",
    isAutomated: true
}
```
Of those parameters, I'll focus on the required parts and the special parameter `isAutomated`. If you look at the parameters `action` and `orderType`,
you may notice that their type signature is an `Enum` with preset values. We can just use strings to tackle this in JS, but let's make it really easy
on ourselves and export some special objects to act as those enums. In `placeOrder.js`:

```js
import { DEMO_URL } from './env'
import { getAccessToken } from './storage'

export const ORDER_TYPE = {
    Limit:              'Limit',
    MIT:                'MIT',
    Market:             'Market',
    QTS:                'QTS',
    Stop:               'Stop',
    StopLimit:          'StopLimit',
    TrailingStop:       'TralingStop',
    TrailingStopLimit:  'TrailingStopLimit'
}

export const ORDER_ACTION = {
    Buy:                'Buy',
    Sell:               'Sell'
}

export const placeOrder = async body => {
    //???
}
```

We simply copy over the Enum values listed in the API docs. Now we can get these magic strings with the `.` operator:

```js
console.log(ORDER_TYPE.Limit === 'Limit')   //=> true
console.log(ORDER_ACTION.Buy === 'Buy')     //=> true
```

This will make it much more difficult to make a mistake copying a string value. Now we are ready to write our `placeOrder` request:

```js
export const placeOrder = async ({
    action, 
    symbol,
    orderQty,
    orderType, 
    accountSpec, 
    accountId, 
    clOrdId, 
    price, 
    stopPrice, 
    maxShow, 
    pegDifference,
    timeInForce, 
    expireTime, 
    text, 
    activationTime, 
    customTag50, 
    isAutomated
}) => {

    const { id, name } = getAvailableAccounts()[0]
    const { token } = getAccessToken()

    const normalized_body = {
        action, symbol, orderQty, orderType,
        isAutomated: isAutomated || false,
        accountId: id,
        accountSpec: name
    }    

    if(!token) {
        console.error('No access token found. Please acquire a token and try again.')
        return
    }

    const res = await fetch(DEMO_URL + '/order/placeOrder', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(normalized_body)

    })
    const js = await res.json()

    return js
}
```
Although we're not using every parameter for this request, I've noted them all in the configuration object accepted by the `placeOrder` function
for clarity. Just like with our test request from the last section, we define the `fetch` options using a plain object. According to the 
[API docs](https://api.tradovate.com/#operation/placeOrder), `placeOrder` uses the `POST` method. We need to supply at least  `action` (Buy or Sell), 
`symbol` (the contract to buy/sell), `orderQty` (the amount you would like to purchase), and 'orderType' (one of the various order types, we can place).
However, if we send a request without an account ID or 'account Spec' (our account username) attached we will get a Violation response telling use we need to supply an account ID and Spec for this action. These fields are for the ID of the account you would like to make the order for, and the `accountSpec`
is the name given to the account. We can easily add some functions to our `storage.js` file to store this information when we connect. Add these lines
to your `storage.js` file:

```js
const AVAIL_ACCTS_KEY   = 'tradovate-api-available-accounts'

export const setAvailableAccounts = accounts => {
    sessionStorage.setItem(AVAIL_ACCTS_KEY, JSON.stringify(accounts))
}

/**
 * Returns and array of available accounts or undefined.
 * @returns Account[]
 */
export const getAvailableAccounts = () => {
    return JSON.parse(sessionStorage.getItem(AVAIL_ACCTS_KEY))
}

//...
```

Now in `connect.js` we'll add this functionality:

```js
export const connect = async (data) => {
    let { token, expiration } = getAccessToken()
    console.log(token, expiration)
    if(token && tokenIsValid(expiration)) {
        console.log('Already connected. Using valid token.')
        return
    }

    const request = buildRequest(data)

    let js = await fetch(DEMO_URL + '/auth/accesstokenrequest', request).then(res => res.json())

    if(js['p-ticket']) {
        return handleRetry(data, js) 
    } else {
        const { errorText, accessToken, userId, userStatus, name, expirationTime } = js
        if(errorText) {
            console.error(errorText)
            return
        }
        setAccessToken(accessToken, expirationTime)
        setAccountId(userId)                        //<-- added
        setAccountSpec(name)                  //<-- added
        console.log(`Successfully stored access token ${accessToken} for user {name: ${name}, ID: ${userId}, status: ${userStatus}}.`)
    }
}
```

When we connect, we will now also save our account information. Now we can try to make an order. In `app.js`:

```js
import { connect } from './connect'
import { ORDER_ACTION, ORDER_TYPE, placeOrder } from './placeOrder'


const main = async () => {
    //Connect to the tradovate API by retrieving an access token
    await connect({
        name:       "<Your Credentials Here>",
        password:   "<Your Credentials Here>",
        appId:      "Sample App",
        appVersion: "1.0",
        cid:        8,
        sec:        'f03741b6-f634-48d6-9308-c8fb871150c2',
    })


    const response = await placeOrder({
        action: ORDER_ACTION.Buy,
        symbol: 'ETHJ1',
        orderQty: 1,
        orderType: ORDER_TYPE.Market,
    })

    console.log(response)
}

//app entry point
main()

```

We utilize the async/await model to better organize our execution strategy. We won't try to call `placeOrder` until `connect` completes. Because we
setup our `placeOrder` function to supply the correct defaults, we only need to supply the required parameters. When we run this we will get a 200
response. Even if it says your order failed, if the response is a 200 response then you've placed your order correctly via JS. 

## A Note About Automated Orders
One thing that we didn't talk about was the `isAutomated` flag associated with the `placeOrder` data model. `isAutomated` defaults to false,
which is what you typically would want for a user physically placing an order on their own through your application. However, if you were to place an order
impersonally - like via a trading bot or through some other algorithmic process - you MUST supply `isAutomated` as `true`. The exchange is _very serious_ 
about this requirement and _*failing to do so could violate exchange policies*_.

### [< Prev](https://github.com/tradovate/example-api-js/tree/main/tutorial/Ex-4-Test-Request)

## Further Reading
To continue with the Tradovate API learning path, read part two - [WebSockets](https://github.com/tradovate/example-api-js/tree/main/tutorial/WebSockets/EX-05-WebSockets-Start).
