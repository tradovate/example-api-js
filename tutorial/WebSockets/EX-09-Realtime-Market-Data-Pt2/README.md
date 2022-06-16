# Realtime Features Part Two - Depth of Market
Where we left off in part 8, we had learned to use the Tradovate WebSocket API to get data in real-time. But there are more real-time operations available to us than just quotes. One other operation we can perform is to measure Depth of Market for a given contract. To listen to DOM events, its much the same as listening to quote events. We make a request to the DOM subscription endpoint just like with quotes. Now that we have learned how to work with websockets, this should be no problem. 

```js
import { URLs } from '../../../tutorialsURLs'

const { MD_URL } = URLs

const main = async () => {
    const { accessToken } = await connect(credentials)
    
    const mySocket = new TradovateSocket({debugLabel: 'Market Data API'})
    await mySocket.connect(MD_URL, accessToken)

    const unsubscribe = await mySocket.subscribe({
        url: 'md/subscribedom',
        body: { symbol: 'MNQZ1' },
        subscription: (item) => {
            //...
        }
    })
}

main()
```

This should be familiar. It looks exactly like `subscribeQuote`. Here's the expected data schema:

```js
{
  "e":"md",
  "d": {
    "doms": [ // each individual dom array-item is what subscribe will process
      {
        "contractId":123456, // ID of the DOM contract
        "timestamp":"2017-04-13T11:33:57.488Z",
        "bids": [ // Actual depth of "bids" may varies depending on available data
          {"price":2335.25,"size":33},
          ...
          {"price":2333,"size":758}
        ],
        "offers": [ // Actual depth of "offers" may varies depending on available data
          {"price":2335.5,"size":255},
          ...
          {"price":2337.75,"size":466}
        ]
      }
    ]
  }
}
```

Now let's add to our HTML file so we can render it.

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset='utf-8'>
    <meta name='title' content='Project meta title'>
    <meta name='description' content='Project description'>
    <title>Tradovate API JS Example</title>
    <base href="./" />
    <style>
      <!-- ... -->
    </style>
  </head>
  <body>
    <span>
      <button id="request-btn">Watch</button>
      <button id="unsubscribe-btn">Unwatch</button>
      <button id="connect-btn">Connect</button>
      <button id="disconnect-btn">Disconnect</button>
      <div id="status"></div>
    </span>
    <section id="outlet">
      <!-- stuff will get rendered here -->
    </section>

    <!-- new stuff here -->
    <span>
      <button id="subscribe-dom">Watch DOM</button>
      <button id="unsubscribe-dom">Unwatch DOM</button>
    </span>
    <section id="outlet-2">

    </section>
  </body>
</script>

```
Be sure to grab the styles from the solution or port your own if you want it to be readable. The important parts are the new buttons and the second outlet `<section>` element. Let's go back into `app.js` and add some references to those elements:

```javascript
//...
    const $watchDom     = document.getElementById('subscribe-dom')
    const $unwatchDom   = document.getElementById('unsubscribe-dom')
    const $outlet2      = document.getElementById('outlet-2')
    const $sym1         = document.getElementById('sym1')
    const $sym2         = document.getElementById('sym2')
//...
```

...and we'll have to attach some event listeners to the buttons. But before we do that, we need to add another render function to render DOM data. Create
a new file called `renderDOM.js` now. The DOM response object follows this schema:



Now we'll write a render function to handle that schema:

```javascript
import { renderPriceSize } from './renderPriceSize'

const renderBidOffer = bid => `
    <div>
        <ul>
            ${renderPriceSize(bid)}
        </ul>
    </div>
`

export const renderDOM = (symbol, {
    contractId,
    timestamp,
    bids,
    offers,
}) => `
    <section>
        <span>
            <h1>${symbol} - ${contractId}</h1>
            <time datetime="${new Date(timestamp)}"></time>
        </span>
        <div class="dom-cols">         
            <div class="dom-col-item">
                <h2>Bids</h2>
                ${bids.map(renderBidOffer).join()}
            </div>
            <div class="dom-col-item">
                <h2>Offers</h2>
                ${offers.map(renderBidOffer).join()}
            </div>            
        <div>
    </section>
`
```

Now we just have to hook up our functions to our HTML Element events. We will look at the Ethereum contract `ETHH1`. Back in `app.js` look at the
`main` function. Add this code to the end of the that function:

```javascript
//...in main()

    $watchDom.addEventListener('click', async () => {

        unsubscribeDom = await socket.subscribe({
            url: 'md/subscribedom',
            body: { symbol: $sym2.value },
            subscription: data => {
                const newElement = document.createElement('div')
                newElement.innerHTML = renderDOM($sym2.value, data)
                $outlet2.firstElementChild
                    ? $outlet2.firstElementChild.replaceWith(newElement)
                    : $outlet2.append(newElement)
            }
        })
    })

    $unwatchDom.addEventListener('click', () => {
        unsubscribeDom()
    })
//...
```
## More Real-Time Features
When we run this code, we should now get two outlet boxes. We can listen to one or both of the subscriptions at a time. We can arbitrarily cancel them and create new ones with our controls with no problem. And they'll render their data in real time and hold that subscription even in background tabs or when you have the browser out of focus. But wait, there's more!

There is one other real-time feature that we can request with this same interface. Using this exact same formula, we can get real-time subscriptions to the histogram for a given contract. The functionality to do so is included in the solution to this section. We simply pass a given contract symbol and we may begin tracking its histogram. The data received follows this schema:

```js
{
  "e":"md",
  "d": {
    "histograms": [ //each of these individual array objects is what `subscribe` will process.
      {
        "contractId":123456, // ID of the histogram contract
        "timestamp":"2017-04-13T11:33:57.412Z",
        "tradeDate": {
          "year":2017,
          "month":4,
          "day":13
        },
        "base":2338.75,
        "items": { // Actual number of histogram items may depend on data
          "-14":5906,
          ...
          "2":1234,
        },
        "refresh":false
      }
    ]
  }
}
```

There is still one other real-time operation - the get chart data operation. Although this is real-time as well, it doesn't follow the same interface 
as the other market data operations. Because of this departure from the pattern we now know, we'll cover chart data in the next section.

### [< Prev Section](https://github.com/tradovate/example-api-js/tree/main/tutorial/WebSockets/EX-08-Realtime-Market-Data) [Next Section >](https://github.com/tradovate/example-api-js/tree/main/tutorial/WebSockets/EX-10-Chart-Data)
