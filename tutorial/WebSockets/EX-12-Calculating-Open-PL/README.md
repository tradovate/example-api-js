# Calculating P&L In Real-Time
One thing that the Tradovate Trader application does for us is calculate your profits and losses in real-time. If you're designing your own tools,
it is very likely you'll want to know your profits and losses. Luckily, just about any of the features that are available in the Trader app are also
available through our REST and WebSocket APIs. All we need to do is put the pieces together. First let's review a simple formula for calculating profits
and losses:

> ## P&L = (Sell Price - Buy Price) * Value Per Point * Contract Qty

That's simple enough. We just need to composite those values from our position (we'll use user sync requests), and compare them to real-time prices.


## Setting Up the UI
If you're following along with the live project, you'll notice we have some simple controls already in place in the `index.html` file. We also have
a lot of the boilerplate work done in the `app.js` file, like referencing our document objects and acquiring credentials. With that being done, we can
focus on the meat of the problem.

The first thing we should do is pull up any existing positions we may hold. Conveniently this is available to us via the `'user/syncrequest'` endpoint. In `app.js`, look at the `setupUI` function. We will add some code:

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
        await socket.synchronize() //synchronize the result - this is what we need the socket for
    }

    $buyBtn.addEventListener('click', onClick('Buy'))
    $sellBtn.addEventListener('click', onClick('Sell'))
}
```

We have created a helper function that will construct the click callback for our buy and sell buttons based on what string we pass in. We can assign this
function to the click events of the document objects included with the boilerplate code. Clicking one of the buttons will cause this chain of events to 
occur:

- We get our primary account. As an 'early out' we return if the `$symbol` or `$qty` input document object has no value.
- We make a request to place a buy/sell order for whatever symbol is present in the `$symbol` input object with a quantity
equal to the value of the `$qty` number input object. 
- We synchronize our user data via the realtime WebSocket connection. This is why we needed to pass this function the `socket` variable.

By using the helper function, we save ourselves from having to write this same code twice.

## Setup Real-Time Quotes
The next thing we need to do is setup a real-time data subscription so that we have something by which to compare our open positions. We already 
instantiated a new `MarketDataSocket` in our boilerplate code - now we just need to use it. Go back to `app.js` and add more code to the `main` function,
we're going to write a callback for the `onSync` hook, and we'll setup our necessary market data subscriptions therein.

```js
socket.onSync(({positions, contracts, products}) => {
    //for each position we hold
    positions.forEach(async pos => {

        //see if we are still open in this position
        if(pos.netPos === 0 && pos.prevPos === 0) return

        //find the contract for this position
        const { name } = contracts.find(c => c.id === pos.contractId)

        //get the value per point from the product catalogue, accounting for 2, 3, and 4 character naming schemes.
        let item = products.find(p => p.name === name.slice(0, 3))
        item ||= products.find(p => p.name === name.slice(0, 2))
        item ||= products.find(p => p.name === name.slice(0, 4))

        let vpp = item.valuePerPoint    

        //use the quote data to calculate open PL in real time.
        await mdsocket.subscribeQuote(name, ({Trade}) => {

            let buy = pos.netPrice ? pos.netPrice : pos.prevPrice
            const { price } = Trade            

            let pl = (price - buy) * vpp * pos.netPos 
            
            //add an element to the page for this position, or update an element if it already exists.
            const element = document.createElement('div')
            element.innerHTML = renderPos(name, pl, pos.netPos)
            const $maybeItem = document.querySelector(`#position-list li[data-name="${name}"`)
            $maybeItem ? $maybeItem.innerHTML = renderPos(name, pl, pos.netPos) : $posList.appendChild(element)

            //if this position is open, look at the pls array and find this pos. if it exists, update it, 
            //otherwise push this new value to pls for aggregation
            const maybePL = pls.find(p => p.name === name)
            if(maybePL) {
                maybePL.pl = pl
            } else {
                pls.push({ name, pl })
            }

            //finally, aggregate the PLs and update the cumulative PL UI Element.
            runPL()
        })        
    })
})
```

For each position we hold, we initiate a quote subscription for the contract in question. If we have already exited our position (no net position or 
previous position), then we shouldn't do anything with this position and we return early. It is also worth noting that the `netPos` and `prevPos` 
parameters track the number of contracts you hold for the given position. We can also easily grab the average purchase price from the position
object using its `netPrice` field. If this is a position from sometime before today, it will be in the `prevPrice` field. Likewise, getting the quote price
is also quite simple - it's located in the `Trade.price` object field from the quote data.  We use the product data we found using the contract name to determine the value per point of the contract in question. Then we can do our actual P&L calculation for this position. 

Now all that's left is to aggregate the results of our individual positions' open P&Ls. At the end of the `onSync` callback above, we call `runPL()`. This is where we will handle aggregating our results into a net open P&L, and set the text of our `$openPL` element to that value.

```js

    const runPL = () => {
        const totalPL = pls.map(({pl}) => pl).reduce((a, b) => a + b, 0)
        $openPL.innerHTML = ` $${totalPL}`
    }
}
```
In order for this to work you need to hold positions, so play with the buy and sell buttons here (not exactly suggested but possible), or go to the Trader
application and place some orders there. Make sure you understand margins for your purchases - ETH and BTC have extremely high initial margins. You'll likely accidentally auto-liq your test account (I did because of exactly this). Once you have positions to compare, boot up this project again and you should see an accurate description of your open P&L. Congratulations, you've successfully calculated your P&L manually - give yourself a pat on the back.

### [< Prev Section](https://github.com/tradovate/example-api-js/tree/main/tutorial/WebSockets/EX-11-Tick-Charts)

