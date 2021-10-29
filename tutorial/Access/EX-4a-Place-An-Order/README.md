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

    const res = await tvPost('/order/placeOrder', normalized_body)

    return res
}
```
Although we're not using every parameter for this request, I've noted them all in the configuration object accepted by the `placeOrder` function
for clarity. We define the request options using a plain object. According to the 
[API docs](https://api.tradovate.com/#operation/placeOrder), `placeOrder` uses the `POST` method. We need to supply at least `action` (Buy or Sell), 
`symbol` (the contract to buy/sell), `orderQty` (the amount you would like to purchase), and 'orderType' (one of the various order types, we can place).
However, if we send a request without an account ID or 'account Spec' (our account username) attached we will get a Violation response telling use we need to supply an account ID and Spec for this action. These fields are for the ID of the account you would like to make the order for, and the `accountSpec`
is the name given to the account. We can get all the required parameters using the `storage.js` functions included with this project.

In `app.js` we can attempt to place an order:

```js
import { credentials } from '../../../tutorialsCredentials.js'
import { connect } from './connect'
import { ORDER_ACTION, ORDER_TYPE, placeOrder } from './placeOrder'


const main = async () => {
    //Connect to the tradovate API by retrieving an access token
    await connect(credentials)

    const $symbol = document.getElementById('symbol')
    const $input = document.getElementById('buy')

    $input.addEventListener('click', async () => {
        if(!$symbol.value) return 
        const response = await placeOrder({
            action: ORDER_ACTION.Buy,
            symbol: $symbol.value,
            orderQty: 1,
            orderType: ORDER_TYPE.Market,
        })
        console.log(response)
    })
}

//app entry point
main()
```

When we put a valid symbol into the input box and press buy, it should place an buy market order for whatever symbol you entered. Because we setup our `placeOrder` function to supply the correct defaults, we only need to supply the required parameters. When we run this we will get a 200 response. Even if the response text says your order failed, if the response is a 200 response then you've placed your order correctly via JS. 

## A Note About Automated Orders
One thing that we didn't talk about was the `isAutomated` flag associated with the `placeOrder` data model. `isAutomated` defaults to false,
which is what you typically would want for a user physically placing an order on their own through your application. However, if you were to place an order
impersonally - like via a trading bot or through some other algorithmic process - you MUST supply `isAutomated` as `true`. The exchange is _very serious_ 
about this requirement and _*failing to do so could violate exchange policies*_.

### [< Prev](https://github.com/tradovate/example-api-js/tree/main/tutorial/Ex-4-Test-Request)

## Further Reading
To continue with the Tradovate API learning path, read part two - [WebSockets](https://github.com/tradovate/example-api-js/tree/main/tutorial/WebSockets/EX-05-WebSockets-Start).
