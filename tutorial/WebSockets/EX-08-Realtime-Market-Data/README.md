# Getting Realtime Market Data
The most interesting benefit of using the WebSocket client is getting access to data in real-time. Picking up where we left off in EX-7, let's clear out our UI code, and all the things pertaining to the specifics of our test request. Navigate to EX-8 in your project folder and run the typical `yarn install` to get your dependencies situated. You'll see we've stripped out all the specifics of the EX-7 solution, leaving us with our reusable tools and giving us a clean slate to work with for our Market Data project.

## Using the Subscribe Feature
Let's imagine we want to listen for realtime quote data about a certain contract. Choose any futures contract you like (and is on the CME). In order to listen to market data events, we need to send a request to a real-time subscription endpoint. Since we already wrote an appropriate `subscribe` function, that should be easy enough. 

```js
import { URLs } from '../../../tutorialsURLs'

const { MD_URL } = URLs

const main = async () => {
    const { accessToken } = await connect(credentials)
    
    const mySocket = new TradovateSocket({debugLabel: 'Market Data API'})
    await mySocket.connect(MD_URL, accessToken)

    const unsubscribe = await mySocket.subscribe({
        url: 'md/subscribequote',
        body: { symbol: 'MNQZ1' },
        subscription: (item) => {
            //...
        }
    })
}

main()

```

Then we will need to listen for messages with this schema:

```javascript
{
  "e":"md",
  "d": {
    "quotes": [ // each individual quote array-item is what subscribe will process
      {
        "timestamp":"2017-04-13T04:59:06.588Z",
        "contractId":123456, // ID of the quote contract
        "entries": {
          // Any of entries may absent if no data available for them.
          // Either "price" or "size" field (but not both) may absent in any entries.
          "Bid": { "price":18405, "size":7 },
          "TotalTradeVolume": { "price":18405, "size":7 },
          "Offer": { "price":18410, "size":12 },
          "LowPrice": { "price":18405, "size":7 },
          "Trade": { "price":18405, "size":2 },
          "OpenInterest": { "price":18405, "size":7 },
          "OpeningPrice": { "price":18405, "size":7 },
          "HighPrice": { "price":18405, "size":7 },
          "SettlementPrice": { "price":18405, "size":7 },
          "EmptyBook": { "price":18405, "size":7 }
        }
      }
    ]
  }
}
```


That's all we need to open the actual subscription. The body of `subscribe` needs a `symbol` field, which could be either a string or a number. This symbol is the ID of the contract that we want to track. We will begin to recieve responses from the server very quickly if we've done this properly. Also note that we've stored `unsubscribe` - this is a result of the `subscribe` function that will cancel the subscription in question. 

Now that we know how to get some real-time data, let's render it. Add this to your `index.html` file:

```HTML
<!DOCTYPE html>
<html>
  <head>
    <meta charset='utf-8'>
    <meta name='title' content='Project meta title'>
    <meta name='description' content='Project description'>
    <title>Tradovate API JS Example</title>
    <base href="./" />
    <style>
      #status {
        transition: background-color .33s ease-in;
        height: 1em;
        width: 1em;
        border-radius: 50%;
        background-color: silver;
      }

      span {
        display: flex;
        flex-direction: row;
        margin: auto;
        align-items: center;
        flex-wrap: wrap;
      }

      div { margin: 1em; }

      section span div {
        height: 10em;
        width: 14.5em;        
        padding: 0 1em;
        box-shadow: 0 .2em .5em -.33em black;        
        border-radius: 4px;
      }

      button {
        margin: 1em;
      }
    </style>
  </head>
  <body>
    <span>
      <button id="request-btn">Watch</button>
      <button id="unsubscribe-btn">Unwatch</button>
      <input id="symbol" type="text" placeholder="BTCM1" />
      <button id="connect-btn">Connect</button>
      <button id="disconnect-btn">Disconnect</button>
      <div id="status"></div>
    </span>
    <section id="outlet">
      <!-- stuff will get rendered here -->
    </section>
  </body>
</html>
```

Most important are the buttons we've added to the `<span>` element. We will be hooking up their click events to change our application state.
Now we need a new file. Create a file named `renderQuote.js`, which will actually perform the changes to our document. Add this code:

```javascript
const renderPriceSize = ({price, size}) => `
    ${price ? '<li>price: ' +price+ '</li>' : ''}
    ${size ? '<li>size: ' +size+ '</li>' : ''}
`

export const renderQuote = (symbol, {
    Bid,
    HighPrice,
    LowPrice,
    Offer,
    OpenInterest,
    OpeningPrice,
    SettlementPrice,
    TotalTradeVolume,
    Trade,
}) => `
    <section>
        <h1>${symbol}</h1>
        <span>
            <div>
                <h3>Bid</h3>
                <ul>
                    ${renderPriceSize(Bid)}
                </ul>
            </div>
            <div>
                <h3>HighPrice</h3>
                <ul>
                    ${renderPriceSize(HighPrice)}
                </ul>
            </div>
            <div>
                <h3>LowPrice</h3> 
                <ul>
                    ${renderPriceSize(LowPrice)}
                </ul>
            </div>
            <div>
                <h3>Offer</h3>
                <ul>
                    ${renderPriceSize(Offer)}
                </ul>
            </div>
            <div>
                <h3>OpenInterest</h3>
                <ul>
                    ${renderPriceSize(OpenInterest)}
                </ul>
            </div>
            <div>
                <h3>OpeningPrice</h3>
                <ul>
                    ${renderPriceSize(OpeningPrice)}
                </ul>
            </div>
            <div>
                <h3>SettlementPrice</h3>
                <ul>
                    ${renderPriceSize(SettlementPrice)}
                </ul>
            </div>
            <div>
                <h3>TotalTradeVolume</h3>
                <ul>
                    ${renderPriceSize(TotalTradeVolume)}
                </ul>
            </div>
            <div>
                <h3>Trade</h3>
                <ul>
                    ${renderPriceSize(Trade)}
                </ul>
            </div>
        </span>
    </section>
`
```

It seems like a lot but that's just because our data object is big, and I want to show every possible field. It's really just a straightforward 
mapping of every possible field of a Quote object into an HTML element. Let's go back to `app.js` and add our new rendering logic to it.

```javascript

const main = async () => {

    const { accessToken } = await connect(credentials)

    //HTML elements
    const $outlet       = document.getElementById('outlet')
    const $reqBtn       = document.getElementById('request-btn')
    const $unsubBtn     = document.getElementById('unsubscribe-btn')
    const $connBtn      = document.getElementById('connect-btn')
    const $discBtn      = document.getElementById('disconnect-btn')
    const $statusInd    = document.getElementById('status')
    const $symbol       = document.getElementById('symbol')

    //The websocket helper tool
    const socket = new TradovateSocket()
    let lastSymb
    let unsubscribe

    //give user some feedback about the state of their connection
    //by adding an event listener to 'message' that will change the color
    const onStateChange = _ => {
        $statusInd.style.backgroundColor = 
            socket.ws.readyState == 0 ? 'gold'      //pending
        :   socket.ws.readyState == 1 ? 'green'     //OK
        :   socket.ws.readyState == 2 ? 'orange'    //closing
        :   socket.ws.readyState == 3 ? 'red'       //closed
        :   /*else*/                    'silver'    //unknown/default           
    }

    $connBtn.addEventListener('click', async () => {
        if(socket.ws && socket.ws.readyState === 1) return

        await socket.connect(URLs.MD_URL, accessToken)  
        //add your feedback function to the socket's
        socket.ws.addEventListener('message', onStateChange)
    })

    //disconnect socket on disconnect button click
    $discBtn.addEventListener('click', () => {
        if(socket.ws.readyState !== 1) return

        socket.ws.close()
        $statusInd.style.backgroundColor = 'red'
        $outlet.innerText = ''
        
    })

    $unsubBtn.addEventListener('click', () => {
        unsubscribe()
        lastSymb = ''
    })

    //clicking the request button will fire our request and initialize
    //a listener to await the response. This will trigger our renders.
    $reqBtn.addEventListener('click', async () => {

        lastSymb = $symbol.value
        unsubscribe = socket.subscribe({
            url: 'md/subscribequote',
            body: { symbol: $symbol.value },
            subscription:  data => {
                const newElement = document.createElement('div')
                newElement.innerHTML = renderQuote($symbol.value, data.entries)
                $outlet.firstElementChild
                    ? $outlet.firstElementChild.replaceWith(newElement)
                    : $outlet.append(newElement)
            }
        })        
    })
}

main()
```

Now when we boot it up, it should do what we intend. Upon initialization we connect to the main tradovate API and get our access token.
Then we send our auth message via the websocket and wait for the open message. We should see our UI appear a moment after clicking the 'Watch' button.
Congratulations, you've learned how to stream real-time market data using the Tradovate WebSockets API. There are still a few other real-time features
to explore, so we will cover them in the next section.

### [< Prev Section](https://github.com/tradovate/example-api-js/tree/main/tutorial/WebSockets/EX-07-Making-Requests) [Next Section >](https://github.com/tradovate/example-api-js/tree/main/tutorial/WebSockets/EX-09-Realtime-Market-Data-Pt2)
