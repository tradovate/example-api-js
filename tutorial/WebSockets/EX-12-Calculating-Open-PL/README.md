# Calculating P&L In Real-Time
One thing that the Tradovate Trader application does for us is calculate your profits and losses in real-time. If you're designing your own tools,
it is very likely you'll want to know your profits and losses. Luckily, just about any of the features that are available in the Trader app are also
available through our REST and WebSocket APIs. All we need to do is put the pieces together. First let's review a simple formula for calculating profits
and losses:

> ## P&L = (Sell Price - Buy Price) * Value Per Point * Contract Qty

That's simple enough. We just need to composite those values from our position (by making requests to the API), and compare them to real-time prices.


## Setting Up the UI
If you're following along with the live project, you'll notice we have some simple controls already in place in the `index.html` file. We also have
a lot of the boilerplate work done in the `app.js` file, like referencing our document objects and acquiring credentials. With that being done, we can
focus on the meat of the problem.

The first thing we should do is pull up any existing positions we may hold. We can get a list of positions associate with our account by using the
`'/positions/ldeps'` endpoint. In `app.js`, put this in the `main` function, below where we setup our UI:

```js
const main = async () => {
    //...

    setupUI()

    POSITIONS = await tvGet('/position/ldeps', {masterids: [getAvailableAccounts()[0].id]})
 
    //...
}
```
Since `'/position/ldeps'` returns a JSON array, we can simply assign the decoded result to our `POSITIONS` array. Now that we have our base positions,
we should write a way to make buys and sells, since we might not have open positions already. In the `setupUI` function we will add some code:

```js
const setupUI = () => {

    const onClick = (buyOrSell = 'Buy') => async () => {
        //first available account
        const { name, id } = getAvailableAccounts()[0]

        if(!$symbol.value) return

        let { orderId } = await tvPost('/order/placeOrder', {
            action: buyOrSell,
            symbol: $symbol.value,
            orderQty: parseInt($qty.value, 10),
            orderType: 'Market',
            accountName: name,
            accountId: id
        })

        let { contractId } = await tvGet('/order/item', {id: orderId})
        
        POSITIONS = await tvGet('/position/ldeps', {masterids: [getAvailableAccounts()[0].id]})

        let position = POSITIONS.find(p => p.contractId === contractId)
        
        const element = document.createElement('div')
        element.innerHTML = renderPos(name, position)
        const $maybeSymbol = document.querySelector(`#position-list li[data-name="${$symbol.value}"]`)

        if($maybeSymbol) {
            $maybeSymbol.parentElement.replaceWith(element)
        } else $posList.appendChild(element)
    }

    $buyBtn.addEventListener('click', onClick('Buy'))
    $sellBtn.addEventListener('click', onClick('Sell'))
}
```

We have created a helper function that will construct the click callback for our buy and sell buttons based on what string we pass in. We can assign this
function to the click events of the document objects included with the boilerplate code. Clicking one of the buttons will cause this chain of events to 
occur:

- We get our primary account. As an 'early out' we return if the `$symbol` input document object has no value.
- We make a request to place a buy/sell order for whatever symbol is present in the `$symbol` input object with a quantity
equal to the value of the `$qty` number input object. We'll need the `orderId` from the response JSON, so we destructure it from the result.
- We make a request to get the order information using the `orderId`. From this response, we need the `contractId` field.
- We set the `POSITIONS` array to the value of the response object returned from `'/position/ldeps'` using our active account's ID as the query parameter.
- We find the position we just added to `POSITIONS`. We then create an element and use the `renderPos` function (included with this project) to
set the `innerHTML` value of our element. If there is already an element with the same `name` data, we will replace it. Otherwise we append the new element.

By using the helper function, we save ourselves from having to write this same code twice.

## Setup Real-Time Quotes
The next thing we need to do is setup a real-time data subscription so that we have something by which to compare our open positions. We already 
instantiated a new `MarketDataSocket` in our boilerplate code - now we just need to use it. Go back to `app.js` and add more code to the `main` function,
we'll place this code below our assignment to `POSITIONS`:

```js
    POSITIONS.forEach(async pos => {

        if(pos.netPos === 0 && pos.prevPos === 0) return

        await socket.subscribeQuote(name, ({Trade}) => {

            let buy = pos.netPrice ? pos.netPrice : pos.prevPrice
            const { price } = Trade     

            //now what??

        })        
    })

```

For each position we hold, we initiate a quote subscription for the contract in question. If we have already exited our position (no net position or 
previous position), then we shouldn't do anything with this position and we return early. It is also worth noting that the `netPos` and `prevPos` 
parameters track the number of contracts you hold for the given position. We can also easily grab the average purchase price from the position
object using its `netPrice` field. If this is a position from sometime before today, it will be in the `prevPrice` field. Likewise, getting the quote price
is also quite simple - it's located in the `Trade.price` object field from the quote data. 

Recalling our original equation, we still need the value per point parameter to complete the full calculation. We will need to make some additional 
requests to make this possible. Still in the `POSITIONS.forEach` function, add this code between the 'early out' and the socket subscription:

```js
POSITIONS.forEach(async pos => {

        if(pos.netPos === 0 && pos.prevPos === 0) return

    // NEW CODE
        const { name } = await tvGet('/contract/item', {id: pos.contractId})

        const { valuePerPoint } = await tvGet('/product/find', { name: name.slice(0, name.length - 2) })
    // END NEW CODE

        await socket.subscribeQuote(name, ({Trade}) => {

            let buy = pos.netPrice ? pos.netPrice : pos.prevPrice
            const { price } = Trade     

            //now what??

        })        
    })

```

We need to get the `valuePerPoint` field from the `product` catalogue. We can do so by first getting the contract symbol from `'/contract/item'`. We use
the symbol as a parameter for our next request to `'/product/find'`. The contract month code is always the last two characters of the contract symbol, so
we chop that off using the `slice` function. Now we have all the ingredients to make our calculation:

```js
const main = async () => {
  //...
    POSITIONS.forEach(async pos => {

        if(pos.netPos === 0 && pos.prevPos === 0) return

        const { name } = await tvGet('/contract/item', {id: pos.contractId})

        const { valuePerPoint } = await tvGet('/product/find', { name: name.slice(0, name.length - 2) })

        await socket.subscribeQuote(name, ({Trade}) => {

            let buy = pos.netPrice ? pos.netPrice : pos.prevPrice
            const { price } = Trade            

            let pl = (price - buy) * valuePerPoint * pos.netPos //<-- Added the calculation.
        })
    })

  //...
}
```

Now all that's left is to aggregate the results of our individual positions' open P&Ls.

```js
const main = async () => {
  //...

  //ADDED CODE
    const pls = [] //this stores the aggregated position P&L
    
    //This function sums all the P&Ls and shows the total in the $openPL element
    const runPL = () => {
        const totalPL = pls.map(({pl}) => pl).reduce((a, b) => a + b, 0)
        $openPL.innerHTML = ` $${totalPL}`
    }
  //END ADDED

    POSITIONS.forEach(async pos => {

        if(pos.netPos === 0 && pos.prevPos === 0) return

        const { name } = await tvGet('/contract/item', {id: pos.contractId})

        const { valuePerPoint } = await tvGet('/product/find', { name: name.slice(0, name.length - 2) })

        await socket.subscribeQuote(name, ({Trade}) => {

            let buy = pos.netPrice ? pos.netPrice : pos.prevPrice
            const { price } = Trade            

            let pl = (price - buy) * valuePerPoint * pos.netPos //<-- Added the calculation.

          //ADDED CODE this just renders existing positions.
            const element = document.createElement('div')
            element.innerHTML = renderPos(name, pl)
            const $maybeItem = document.querySelector(`[data-name="${name}"`)

            if($maybeItem) {
                $maybeItem.parentElement.replaceWith(element)
            } else {
                $posList.appendChild(element)
            }

            //this tells us whether or not we are already tracking this position
            const maybePL = pls.find(p => p.name === name)
            if(maybePL) {
                maybePL.pl = pl //update if it exists
            } else { //else push a new position data
                pls.push({ name, pl }) // we will need to track PL by name so we cache an object
            }
            //finally, aggregate the results into the $openPL element text.
            runPL()
          //END ADDED
        })
    })

  //...
}
```
In order for this to work you need to hold positions, so play with the buy and sell buttons here (not exactly suggested but possible), or go to the Trader
application and place some orders there. Once you have positions to compare, boot up this project again and you should see an accurate description of your 
open P&L. Congratulations, you've successfully calculated your P&L manually - give yourself a pat on the back.

### [< Prev Section](https://github.com/tradovate/example-api-js/tree/main/tutorial/WebSockets/EX-11-Tick-Charts)

