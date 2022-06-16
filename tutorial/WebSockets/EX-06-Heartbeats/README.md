# Handling Heartbeats
We now know how to authorize our client with the Tradovate WebSocket API. We also have explored the WebSocket native interface, and so we are almost prepared to start making and handling requests. But first we need to understand how to send client side heartbeats. Heartbeat frames are important because they keep your connection to the server alive. Without them, the server will drop your client due to timeout.

## Getting Organized
Before we proceed, we should rearrange our project a bit to keep it better organized. First, create a new file in `src` called `TradovateSocket.js`. We will put our socket logic in this file, and we will encapsulate that logic within an object. Since we're going to be making requests time and time again, we should probably add that functionality to our new `TradovateSocket` object. This way we aren't doing things like relying on 'magic strings' to make our app work. We'll use the classic [JavaScript Function Constructor pattern](https://www.educative.io/collection/page/5429798910296064/5725579815944192/5920633608208384):

```javascript
//TradovateSocket.js
import { WSS_URL } from "./env";
import { getAccessToken } from './storage'

export function TradovateSocket() {
    let counter = 0
    
    this.ws = null
    this.increment = function() { return counter++ }
}

TradovateSocket.prototype.send = function({url, query, body}) {
    this.ws.send(`${url}\n${this.increment()}\n${query || ''}\n${body ? JSON.stringify(body) : ''}`)
}

```
We have a few things happening here. First, we need a way to assign a unique ID to each request we send from the client. We will use this very simple `counter` field to track the IDs `increment` gives us the ability to increment and return an ID value. Next, we define the `TradovateSocket` constructor. We define `ws` as the field that will hold our websocket, but we must initialize it to `null`, because a WebSocket expects a URL on instantiation, and we want to be able to provide the URL in a `connect` method. 

We assign the function `send` to the prototype of `TradovateSocket`, which is the standard method for extending constructor-function objects. Our `send` function simply helps us write a correctly formatted request. It's better to encapsulate logic like this so we're not writing strings
by hand too often - this is what I mean when I say *magic strings*. Strings are easy to make mistakes in, and can result in cryptic errors
that won't be easy to debug. Therefore, when we have a known and repetitive solution it's better to abstract that solution when we can. 

Now that we have a few convenient helper functions, we can transplant our previous logic from `app.js`. But let's organize it a bit better.
Remove the websocket code from `app.js` and add this to `socket.js`:

```javascript

TradovateSocket.prototype.connect = async function(url, token) {
    console.log('connecting...')
    const self = this

    return new Promise((res, rej) => {
        this.listeningURL = url
        this.ws = new WebSocket(url)
        //auth only
        this.ws.addEventListener('message', function onConnect(msg) {
            //we need 'self' to preserve outer 'this' value in event callbacks
            const [T, _] = prepareMessage(msg.data)
            if(T === 'o') {
                self.send({
                    url: 'authorize',
                    body: token,
                })
            }
        })
    })
}

function prepareMessage(raw) {
    const T = raw.slice(0, 1)
    const data = raw.length > 1 ? JSON.parse(raw.slice(1)) : []

    return [T, data]
}
```
This is much cleaner and we can reuse the `prepareMessage` function whenever we need to slice up the message data we get from our WebSocket. We use the instance of our `TradovateSocket` object to access `ws`. Now we don't have to clutter up our `app.js` file. Back in `app.js` we can use our `TradovateSocket` module. We'll add the import statement to the top of the file, and some code to the end of the file:

```javascript
import { TradovateSocket } from './TradovateSocket.js'

//...

const { accessToken } = await connect(credentials)

const ws = new TradovateSocket()
ws.connect(WS_DEMO_URL, accessToken)
```

If we run this code, it should work as expected. We should see our success response in the developer's console, along with our heartbeat
message. But if we wait a few seconds with the dev tools open, you'll notice the heartbeat stops logging. That's because the client also needs to send its own heartbeat messages back to the server. A heartbeat frame is simply an empty array, stringified. About every 2.5s, we should broadcast a heartbeat frame in order to maintain the connection. Conveniently, the message switch gives us a good hook to setup a timer. Unfortunately `setInterval` won't be the best option for web applications - if you switch tabs the browser may begin to throttle WebSocket messages. So instead we'll have to measure time between heartbeats. Luckily, it's not much more difficult. Here's how we could measure for heartbeats without using a single `setTimeout` or `setInterval`:

```javascript
//...

const ws = new WebSocket(WSS_URL)

let curTime = new Date()    //original time. we will replace this value with the message time

ws.onmessage = msg => {

    const now = new Date() //time at call of onmessage

    if(now.getTime() - curTime.getTime() >= 2500) {
        ws.send('[]')
        console.log('sent response heartbeat')
        curTime = new Date()    //set the new timer
    }

    //...

    //message discriminator
    switch(kind) {
        case 'o':
            console.log('Opening Socket Connection...')
            const { token } = getAccessToken()
            ws.send(`authorize\n0\n\n${token}`)                        
            break
        case 'h':
            console.log('received server heartbeat...')             
            break
        case 'a':
            const data = JSON.parse(msg.data.slice(1))
            console.log(data)
            break
        case 'c':
            console.log('closing websocket')
            break
        default:
            console.error('Unexpected response token received:')
            console.error(msg)
            break;
    }    
}

```
In the next section, we'll share a much more complete version of the `TradovateSocket` which you can use generically for any of the real-time API endpoints. In the next section, we'll discuss making simple requests with our Socket.

### [< Prev Section](https://github.com/tradovate/example-api-js/tree/main/tutorial/WebSockets/EX-05-WebSockets-Start) [Next Section >](https://github.com/tradovate/example-api-js/tree/main/tutorial/WebSockets/EX-07-Making-Requests)

