# Making Requests From the WebSocket Client
In EX-6, we learned how to make a websocket connection and keep that connection alive using a heartbeat frame.
We are nearly prepared to start making requests using our websocket client. Recall that client side requests are
sent as plain text documents. To get a feel for the specifics of using these messages, let's look at a few valid
requests.

A request with no query or body.

```
executionReport/list
4

```

A request with a query parameter

```
tradingPermission/ldeps
8
masterids=1

```

A request with a body

```
contract/rollcontract
33

{"name":"YMZ6","forward":true,"ifExpired":true}
```

There are a few things to note about these documents.

    - Unlike the standard request format, the format for a websocket request's endpoint URL never has a leading `/`.
    - Both the URL and ID parameters are required for every request.
    - If we skip a parameter, we must include a newline, even if that line is blank.

As long as we rely on our `request` function from the WSHelper object, all of that should be taken care of for us, and we'll
never have to think about the ID parameter at all. So now that we can make requests, let's try it out.

## Our First WebSocket Request
In order to make our request a bit more interactive, let's use a button to initiate the call. In fact, we'll add a few HTML elements to
make our test application a bit more entertaining. Let's imagine we're interested in the details of the cryptocurrency product, ETH. We can 
retrieve ETH (futures) product data using our websocket client. Go to `index.html` and make these changes:

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
      #status {
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

      div { 
        margin: 1em;
        border-left: .1em solid black;
      }

      button {
        margin: 1em;
      }
    </style>
  </head>
  <body>
    <span>
      <button id="request-btn">ETH Details</button>
      <button id="connect-btn">Connect</button>
      <div id="status"></div>
    </span>
    <section id="outlet">
      <!-- stuff will get rendered here -->
    </section>
  </body>
</script>
```
We've added a style element to the head, to make things somewhat more visually appealing. There are also three new elements on the page inside
a `<span>` element.

    - `request-btn` - the button we'll use to initiate our request.
    - `connect-btn` - A button to initiate the connection to the websocket.
    - `status` - A `div` element that we will use to create a 'status' indicator. When we're connected to the socket, it will be green. If
                 we get disconnected, it will be red.

Let's go to `app.js`. First, remove your call to `connect()`. Then let's add some code:

```javascript
//HTML elements
const $outlet       = document.getElementById('outlet')
const $reqBtn       = document.getElementById('request-btn')
const $connBtn      = document.getElementById('connect-btn')
const $statusInd    = document.getElementById('status')
```
All we're doing here is retrieving the elements we'll be using in our application.

Now let's add the status icon color-indication effect:

```javascript
$connBtn.addEventListener('click', () => {
    helper.connect()
    helper.ws.addEventListener('message', msg => {
        $statusInd.style.backgroundColor = 
            helper.ws.readyState == 0 ? 'gold'      //pending
        :   helper.ws.readyState == 1 ? 'green'     //OK
        :   helper.ws.readyState == 2 ? 'orange'    //closing
        :   helper.ws.readyState == 3 ? 'red'       //closed
        :   /*else*/                    'silver'    //unknown|default           
    })
})

```
We first add a click listener to the connect button. When we click it, it will add a listener to the websocket's `'message'` event.
The listener function simply looks at the `readyState` property of the websocket itself to determine what color the `div` should be.
Since we receive a message at least every 2.5 seconds, this should behave closely to real-time.

To make our actual request, we simply use our helper's `request` function. Let's do this by adding a click event listener to the `$reqBtn`
 element. To get ETH, we'll use the `url` and `query` configuration parameters, like so:

```javascript
$reqBtn.addEventListener('click', () => {
    helper.request({
        url: 'product/find',
        query: 'name=ETH'
    })
})
```
Now when we click the button, the request will fire. We can see the response logged in the console, which should be successful. But there
is one issue - we only get a log. We don't have any other way to communicate with this without changing our WSHelper's `connect` logic.
However, we *can* write a simple helper extension that will allow us to listen arbitrarily for responses. First we need to modify `request` ever-so-slightly.
Because a response is guaranteed to contain the ID of the request that caused it, we can utilize that ID to listen for our specific response: 

```javascript
WSHelper.prototype.request = function({url, query, body}) {
    this.ws.send(`${url}\n${this.counter.increment()}\n${query}\n${JSON.stringify(body)}`)
    return this.counter.current //<-- added return value
}
```
Since our counter keeps track of the IDs, we just need to return its `current` value for use later. Now let's write a brand new function
that we'll call `listen` as a method on WSHelper:

```javascript
WSHelper.prototype.listen = function(id, fn) {
    const ws = this.ws //cache value as local var to prevent 'this' problems in our subscription

    const subscription = msg => {
        if(msg.data.slice(0, 1) !== 'a') 
            return

        const data = JSON.parse(msg.data.slice(1))

        data.forEach(item => {
            if(item.i === id) {
                fn(item.d)
                ws.removeEventListener('message', subscription)
            }
        })

    } 
    ws.addEventListener('message', subscription)
}
```

This function will create a one-shot subscription to the `'message'` event of your websocket. It listens for a message that contains
the original request ID in its data. Once it gets that message, it calls the associated `fn` function and then unsubscribes. This will prevent
your listener from being called with the incorrect message, and it will prevent it from persisting beyond its anticipated response. 

We also want to show our user something when they make the request. So to render our data, we'll need to make a template. Create a new file in
`src` called `renderETH.js`.

```javascript
export const renderETH = ({
    allowProviderContractInfo,
    contractGroupId,
    currencyId,
    description,
    exchangeChannelId,
    exchangeId,
    id,
    isMicro,
    marketDataSource,
    name,
    priceFormat,
    priceFormatType,
    productType,
    status,
    tickSize,
    valuePerPoint,
}) => {
    return `
        <section>
            <h1>${name}</h1>
            <p>currency ID: ${currencyId == 1 ? '$' : currencyId}</p>
            <h3>info:</h2>
            <span>
                <div>allowProviderContractInfo: ${allowProviderContractInfo}</div>
                <div>contractGroupId: ${contractGroupId}</div>
                <div>exchangeChannelId: ${exchangeChannelId}</div>
                <div>exchangeId: ${exchangeId}</div>
                <div>id: ${id}</div>
                <div>isMicro: ${isMicro}</div>
                <div>marketDataSource: ${marketDataSource}</div>
                <div>priceFormat: ${priceFormat}</div>
                <div>priceFormatType: ${priceFormatType}</div>
                <div>productType: ${productType}</div>
                <div>status: ${status}</div>
                <div>tickSize: ${tickSize}</div>
                <div>valuePerPoint: ${valuePerPoint}</div>
            </span>
            <h3>Description</h3>
            <p>${description}</p>
        </section>
    `
}
```
It's just a big list of all the data that a `Product` type response contains. But it's at least something to visualize our data. 
By using our new render function, we can create some HTML to put in our `$outlet` element. We can now finish our `$reqBtn`'s click
event:

```javascript
$reqBtn.addEventListener('click', () => {
    //now we get the id
    const id = helper.request({
        url: 'product/find',
        query: `name=ETH`
    })

    helper.listen(id, data => {
        const div = document.createElement('div')
        div.innerHTML = renderETH(data)
        $outlet.firstElementChild 
            ? $outlet.firstElementChild.replaceWith(div)
            : $outlet.appendChild(div)
    })
})
```

When we run this code, we first must connect to the socket, by clicking the 'Connect' button. Then we can try our request.
When we click the 'ETH Details' button, our application should call our `renderETH` function and replace the content of `$outlet`
with our ETH template. However, the true benefits of using WebSockets are real-time communications. In the next section, we will
discuss utilizing the real-time capabilities of the WebSocket client to get market data in real time.

### [< Prev Section](https://github.com/tradovate/example-api-js/tree/main/tutorial/WebSockets/EX-6-Heartbeats) [Next Section >](https://github.com/tradovate/example-api-js/tree/main/tutorial/WebSockets/EX-8-Realtime-Market-Data)