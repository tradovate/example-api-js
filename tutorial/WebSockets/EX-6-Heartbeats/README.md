# Handling Heartbeats
We now know how to authorize our client with the Tradovate WebSocket API. We also have explored the WebSocket native interface,
and so we are almost prepared to start making and handling requests. First we need to understand how to send client side 
heartbeats.

## Getting Organized
We should rearrange our project a bit to keep it better organized. First, create a new file in `src` called `socket.js`. We will put
our socket logic in this file. Since we're going to be making requests time and time again, we should probably try to encapsulate that
functionality so that we aren't doing things like relying on 'magic strings' to make our app work. The easiest way to do this is to
use an object to store your logic. We'll use the classic JavaScript Function Constructor pattern:

```javascript
//socket.js
import { WSS } from "./env";
import { getAccessToken } from './storage'

function Counter() {
    this.current = 0
    this.increment = () => {
        this.current += 1
        return this.current
    }
}

export function WSHelper() {
    this.ws = null
    this.counter = new Counter()
}

WSHelper.prototype.request = function({url, query, body}) {
    this.ws.send(`${url}\n${this.counter.increment()}\n${query}\n${JSON.stringify(body)}`)
}

```
We have a few things happening here. First, we need a way to assign a unique ID to each request we send from the client. We
will use this very simple `Counter` helper to track the IDs. Next, we define the `WSHelper` constructor. We define `ws`, the 
field that will hold our websocket, and we use our counter as a component of the WSHelper. We assign the function `request`
to the prototype of `WSHelper`, which is the standard method for extending constructor-function objects. Our `request` function
simply helps us write a correctly formatted request. It's better to encapsulate logic like this so we're not writing strings
by hand too often. Strings are easy to make mistakes in, and will result in cryptic errors that won't be easy to figure out. 

Now that we have a few convenient helper functions, we can transplant our previous logic from `app.js`. Remove the websocket
code from `app.js` and add this to `socket.js`:

```javascript

WSHelper.prototype.connect = function() {
    this.ws = new WebSocket(WSS)

    const handleOpen = _ => {
        console.log('Making WS auth request...')
        const { token } = getAccessToken()
        this.request({
            url: 'authorize',
            body: token
        })
    }

    const handleHeartbeat = msg => {
        console.log('ba-bump.')
    }

    const handleJSON = msg => {
        //cut off the frame indicator
        const data = JSON.parse(msg.data.slice(1))
        console.log(data)
    }

    const handleClose = msg => {
        console.log(msg)
    }

    const handleException = msg => {
        console.error('Unexpected response token received:')
        console.error(msg)
    }

    //message discriminator
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
                handleOpen(msg)
                break
            case 'h':
                handleHeartbeat(msg)
                break
            case 'a':
                handleJSON(msg)
                break
            case 'c':
                handleClose(msg)
                break
            default:
                handleException(msg)
        }
    }
}
```

This is quite nearly the same code, except we replaced our `onopen` function with the WSHelper's `request`. Now we don't have to clutter up
our `app.js` file. Back in `app.js` we can use our `WSHelper` module. We'll add the import statement to the top of the file, and some code 
to the end of the file:

```javascript
import { WSHelper } from './socket.js'

//...

const ws = new WSHelper()
ws.connect()
```

If we run this code, it should work as expected. We should see our success response in the developer's console, along with our heartbeat
message. But if we wait a few seconds (about 25), you'll notice the heartbeat stops. That's because the client also needs to send its
own heartbeat messages back to the server. About every 2.5s, we should broadcast a heartbeat frame in order to maintain the connection.

```javascript
//socket.js

//in the constructor add this field
export function WSHelper() {
    this.ws = null
    this.counter = new Counter()
    this.heartbeat = null //<-- new field
}

WSHelper.prototype.startHeartbeat = function() {
    if(!this.ws) return
    this.hearbeat = setInterval(() => {
        console.log('ba')
        this.ws.send('[]')
    }, 2500)
}

WSHelper.prototype.connect = function() {
    this.ws = new WebSocket(WSS)

    //start heartbeat
    this.startHeartbeat()

    //rest of function...
}

```

When we run the code we won't get disconnected after 25 seconds, and we can see the console continuing to log beyond that point.
In the next section, we will tackle making requests using the websocket client.

### [< Prev Section](https://github.com/tradovate/example-api-js/tree/main/tutorial/WebSockets/EX-5-WebSockets-Start) [Next Section >](https://github.com/tradovate/example-api-js/tree/main/tutorial/WebSockets/EX-7-Making-Requests)

