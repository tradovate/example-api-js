# Calculating P&L In Real-Time
One thing that the Tradovate Trader application does for us is calculate your profits and losses in real-time. If you're designing your own tools,
it is very likely you'll want to know your profits and losses. Luckily, just about any of the features that are available in the Trader app are also
available through our REST and WebSocket APIs. All we need to do is put the pieces together. First let's review a simple formula for calculating profits and losses:

> ## P&L = (Sell Price - Buy Price) * Value Per Point * Contract Qty

That's simple enough. We just need to composite those values from our position (we'll use user sync requests), and compare them to real-time prices.

## Setting Up the UI
If you're following along with the demo project, you'll notice we have some simple controls already in place in the `index.html` file. We also have
a lot of the boilerplate work done in the `app.js` file, like referencing our HTML document objects and acquiring credentials. With that being done, we can focus on the meat of the problem.

First, let's setup a way to make buys or sells to modify our position, just in case we don't already hold any positions on our demo account. In `app.js`, look at the `setupUI` function. We will add some code:

```js
const setupUI = () => {

    const setupUI = (socket) => {

    const onClick = (buyOrSell = 'Buy') => async () => {
        //first available account
        const { name, id } = getAvailableAccounts()[0]

        if(!$symbol.value || !$qty.value) return

        let { orderId } = await tvPost('/order/placeOrder', {
            action: buyOrSell,
            symbol: $symbol.value,
            orderQty: parseInt($qty.value, 10),
            orderType: 'Market',
            accountName: name,
            accountId: id
        })
        console.log(orderId)
       
    }

    $buyBtn.addEventListener('click', onClick('Buy'))
    $sellBtn.addEventListener('click', onClick('Sell'))
}
```

We have created a helper function that will construct the click callback for our buy and sell buttons based on what string we pass in. We can assign this function to the click events of the document objects included with the boilerplate code. Clicking one of the buttons will cause this chain of events to occur:

- We get our primary account. As an 'early out' we return if the `$symbol` or `$qty` input document object has no value.
- We make a request to place a buy/sell order for whatever symbol is present in the `$symbol` input object with a quantity equal to the value of the `$qty` number input object. 
- We synchronize our user data via the realtime WebSocket connection. This is why we needed to pass this function the `socket` variable.

By using the helper function, we save ourselves from having to write this same code twice.

## Setup Real-Time Quotes
Now we will set up a real-time subscription to our user data using the `user/syncrequest` endpoint for our `subscribe` function.

```js
const main = async () => {     

    const pls = []
    
    //combines all your open p&ls into one 
    const runPL = () => {
        const totalPL = pls.map(({pl}) => pl).reduce((a, b) => a + b, 0)
        $openPL.innerHTML = ` $${totalPL.toFixed(2)}`
    }

    //Connect to the tradovate API by retrieving an access token
    const { accessToken, userId } = await connect(credentials)

    const socket = new TradovateSocket({debugLabel: 'Realtime API'}) //you can label your sockets for debugging
    await socket.connect(URLs.WS_DEMO_URL, accessToken)

    const mdsocket = new TradovateSocket({debugLabel: 'Market Data API'})
    await mdsocket.connect(URLs.MD_URL, accessToken)
    
    socket.subscribe({
        url: 'user/syncrequest',
        body: { users: [userId] },
        subscription: (item) => {
            if(item.users) { //this is the initial response
                const { positions, contracts, products } = item

                positions.forEach(async pos => {
                    if(pos.netPos === 0 && pos.prevPos === 0) return
            
                    //we need the name variable from the contract this position is related to
                    const { name } = contracts.find(contract => contract.id === pos.contractId)
            
                    //get the value per point from products
                    let item = products.find(product => product.name.startsWith(name))
                    
                    let vpp = item.valuePerPoint

                    //our subscription has an inner subscription
                    let unsubscribe = await mdsocket.subscribe({
                        url: 'md/subscribequote',
                        body: { symbol: name },
                        //entries is a field on the quote data object
                        subscription: ({entries}) => {                         
                            
                            let buy = pos.netPrice ? pos.netPrice : pos.prevPrice
                            const { Trade } = entries //current Trade quote
                            const { price } = Trade   //price of the Trade quote
                
                            let pl = (price - buy) * vpp * pos.netPos //our p&l formula
                            
                            //render the HTML
                            const element = document.createElement('div')
                            element.innerHTML = renderPos(name, pl, pos.netPos)
                            const $maybeItem = document.querySelector(`#position-list li[data-name="${name}"`)
                            $maybeItem ? $maybeItem.innerHTML = renderPos(name, pl, pos.netPos) : $posList.appendChild(element)
                
                            //update existing p&l or push a new one
                            const maybePL = pls.find(p => p.name === name)
                            if(maybePL) {
                                maybePL.pl = pl
                            } else {
                                pls.push({ name, pl })
                            }

                            //run the p&l reducer to get total p&l
                            runPL()                            
                        }
                    })                            
                })
            }
        }
    })
    //...
}
```

### [< Prev Section](https://github.com/tradovate/example-api-js/tree/main/tutorial/WebSockets/EX-11-Tick-Charts)

