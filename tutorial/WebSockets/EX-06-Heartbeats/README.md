# Handling Heartbeats
We now know how to authorize our client with the Tradovate WebSocket API. We also have explored the WebSocket native interface,
and so we are almost prepared to start making and handling requests. But first we need to understand how to send client side 
heartbeats. Heartbeat frames are important because they keep your connection to the server alive. Without them, the server will drop your client due to timeout.

## Getting Organized
Before we proceed, we should rearrange our project a bit to keep it better organized. First, create a new file in `src` called `TradovateSocket.js`. We will put our 
socket logic in this file, and we will encapsulate that logic within an object. Since we're going to be making requests time and time again, we should probably 
add that functionality to our new `TradovateSocket` object. This way we aren't doing
things like relying on 'magic strings' to make our app work. We'll use the classic
[JavaScript Function Constructor pattern](https://www.educative.io/collection/page/5429798910296064/5725579815944192/5920633608208384):

```javascript
//TradovateSocket.js
import { WSS_URL } from "./env";
import { getAccessToken } from './storage'

function Counter() {
    this.current = 0
    this.increment = () => {
        this.current += 1
        return this.current
    }
}

export function TradovateSocket() {
    this.ws = null
    this.counter = new Counter()
}

WSHelper.prototype.request = function({url, query, body}) {
    this.ws.send(`${url}\n${this.counter.increment()}\n${query}\n${JSON.stringify(body)}`)
}

```
We have a few things happening here. First, we need a way to assign a unique ID to each request we send from the client. We
will use this very simple `Counter` helper to track the IDs. Next, we define the `TradovateSocket` constructor. We define `ws`, the 
field that will hold our websocket, and we use our counter as a component of the `TradovateSocket`. 

We assign the function `request` to the prototype of `TradovateSocket`, which is the standard method for extending constructor-function objects. Our `request` function
simply helps us write a correctly formatted request. It's better to encapsulate logic like this so we're not writing strings
by hand too often - this is what I mean when I say *magic strings*. Strings are easy to make mistakes in, and will result in cryptic errors
that won't be easy to debug. Therefore, when we have a known and repetitive solution it's better to abstract that solution when we can. 

Now that we have a few convenient helper functions, we can transplant our previous logic from `app.js`. But let's organize it a bit better.
Remove the websocket code from `app.js` and add this to `socket.js`:

```javascript

TradovateSocket.prototype.connect = function(url) {
    //2 == 'CLOSING', 3 == 'CLOSED' websocket states. Make a new socket instance if we looking at a closed one
    if(!this.ws || this.ws.readyState == 3 || this.ws.readyState == 2) 
        this.ws = new WebSocket(url)

    this.ws.onmessage = msg => {
        const { type, data } = msg
        const kind = data.slice(0,1)
        if(type !== 'message') {
            console.log('non-message type received')
            console.log(msg)
            return
        }
    
        //message discriminator
        switch(kind) {
            case 'o':
                console.log('Opening Socket Connection...')
                const { token } = getAccessToken()
                this.ws.send(`authorize\n0\n\n${token}`)         
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
}
```

This is quite nearly the same code, except it is now encapsulated in an object. Note the change in our variable use - we must use `this`. It is important that
we use the instance of our `TradovateSocket` object to access `ws`. Now we don't have to clutter up our `app.js` file. Back in `app.js` we can use our `TradovateSocket` 
module. We'll add the import statement to the top of the file, and some code to the end of the file:

```javascript
import { TradovateSocket } from './TradovateSocket.js'

//...

const ws = new TradovateSocket()
ws.connect()
```

If we run this code, it should work as expected. We should see our success response in the developer's console, along with our heartbeat
message. But if we wait a few seconds with the dev tools open, you'll notice the heartbeat stops logging. That's because the client also needs to send its
own heartbeat messages back to the server. A heartbeat frame is simply an empty array, stringified. About every 2.5s, we should broadcast
a heartbeat frame in order to maintain the connection. Conveniently, we receive a heartbeat about every 2.5s. We can use the hook we created 
to add this functionality. Add a line to the heartbeat switch case:

```javascript
//TradovateSocket.js

//...
    case 'h':
        console.log('received server heartbeat...')
        this.ws.send('[]') //<-- add this, returns a client heartbeat in response
        break
//...

```
## Heartbeats Extended
When we run the code we won't get disconnected via timeout, and we can see the console continuing to log beyond that point. There's one *gotcha* about
heartbeats though - The server won't send heartbeats when it is broadcasting subscription data. So if we want to keep our connection alive, we still
have to keep sending our heartbeats, even though we're not receiving heartbeat messages. So we might as well send a heartbeat message in the `'a'` case as well.

```javascript
//...
    case 'a':
        const data = JSON.parse(msg.data.slice(1))
        console.log(data)
        this.ws.send('[]') //<-- add this line 
        break
//...
```

Now it *really* works. It truly will not disconnect you. And because we are using WebSockets and not relying on the native `setTimer` API,
our connection should even stay alive after being in an inactive tab. Some readers may be thinking, 'That can't be efficient for real-time data!' -
however, the server will actually ignore heartbeat messages that are broadcast too soon. It won't start looking for them until the appropriate amount
of time has passed. So sending extra heartbeats is a negligible effort in exchange for keeping the socket alive in a single line. Now that we know 
how to connect and maintain a connection to the WebSocket, we can discuss how to make a simple request with the WebSockets API in the next section.

### [< Prev Section](https://github.com/tradovate/example-api-js/tree/main/tutorial/WebSockets/EX-05-WebSockets-Start) [Next Section >](https://github.com/tradovate/example-api-js/tree/main/tutorial/WebSockets/EX-07-Making-Requests)

