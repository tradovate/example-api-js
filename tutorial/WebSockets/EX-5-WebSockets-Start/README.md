# Connecting Tradovate's WebSocket Client
<!-- https://github.com/tradovate/example-api-js/tree/main/tutorial/ -->
The Tradovate API has a realtime WebSocket component additional to its standard API features. To access it, we must connect to the
WebSocket host and use the access token that we acquired in the [Access section](https://github.com/tradovate/example-api-js/tree/main/tutorial/Access/EX-0-Access-Start).
Communicating with a WebSocket is a little different than communicating with an API, but our WebSockets response model is
designed to mimic a standard HTTP response, so it should be easy to understand.

## Getting Set Up
To follow along with this lesson, clone this repository locally. Then open a command terminal and navigate to the WebSocket tutorial. 
Run the following commands:

```
> cd c:/path/to/repo/tutorial/WebSockets/EX-5-WebSockets-Start
> yarn install
```

Make sure to replace `path/to/repo` with the local path you've cloned this repository to. This will install the dependencies of the
repository so that you can run it locally.

## Exploring the Project
Inside this project you will find everything from the [Access tutorial](https://github.com/tradovate/example-api-js/tree/main/tutorial/Access/EX-0-Access-Start),
save for the test request we built to explore the API. Astute analysts will also notice that `env.js` has changed. We've added a set of new URLs and made our
naming scheme a bit more universal. We'll be using these URLs in the WebSocket module. We've also removed the button from the `index.html` page, so that we can
start with a fresh slate for our test application. The `connect` function has been refactored as well - it is now asynchronous, and its usage has changed
slightly in `app.js`. We now run a `main` function from `app.js`. This is so we can strategize our asynchronous initialization. If that sounds scary,
don't worry - it will be more apparent what that means as we add to our application. We will need almost everything we built on in part one to connect our 
WebSocket. This is where we will begin in EX-5. 

## Connecting Your WebSocket
Open `app.js`. Add the `WSS_URL` import to the top of the file, and then append the WebSocket code to the end of the file:

```javascript
import { WSS_URL } from './env'

//...

const ws = new WebSocket(WSS_URL)
```

That's pretty simple. Let's explore the WebSocket's functionality a bit. WebSockets communicate in *frames*. A frame in our case consists of
an indicator character followed by a data string. There are four possible indicator characters:
    -`o` -  The 'open' frame. This is the first response sent by the websocket server indicating that you've made a connection.
    -`h` -  The 'heartbeat' frame. In order to keep the websocket connection alive, the server has to send messages at regular intervals
            or else the connection will time out.
    -`a` -  This is an array of JSON data. This type of message is what Tradovate's system builds upon, and we will discuss
            this response most heavily.
    -`c` - This signifies the 'closed' frame, for running shutdown logic when the connection is closed.

In order to send a frame, we simply use the websocket's `send` method.

```javascript
ws.send(`a["my_json_message"]`)
```

For requests, Tradovate uses plain text (not JSON) delimited by newlines to send requests. They follow this format:
```
operation
id
query
body
```
The newlines are important. It is the way that we separate the parameters of requests, and even if you don't use the line, you must
include it. The authorization request is the perfect example of this. The request looks like this:
```
authorize
1

<your-access-token>
```

So when we make the request string we write it like so:

```javascript

const { token } = getAccessToken()
const authRequest = `authorize\n1\n\n${token}`

ws.send(authRequest)
```

## Getting Some Feedback
If you run what we've written so far, it might work - but we won't know it. That's because we haven't explored the rest
of the websocket API yet. The WebSocket has a few properties that we can assign our own custom functions
to:

```javascript
//when you receive the open frame
ws.onopen = msg => console.log(msg)

//anytime you receive a message. You should process Tradovate's JSON responses here
ws.onmessage = msg => console.log(msg)

//handle errors here
ws.onerror = err => console.error(err)

//when the connection closes. cleanup logic goes here
ws.onclose = msg => console.log(msg)
```

We need to at least override the `onmessage` function, as this is a universal message type. Let's do that now.

```javascript

ws.onmessage = msg => {

    const { type, data } = msg
    const kind = data.slice(0,1) // what kind of message is this? the first character lets us know

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

With a switch like this, we can intercept all the messages. We use object destructuring to acquire the `type` and `data` fields from the
`msg` response. We acquire the `kind` by slicing the first character from the `data` portion of the message. If it's not a `message` type
object, we will log it and discard it. Otherwise, we will pass it through our switch discriminator, which will call corresponding logic. The
most important message type for now is the *open* message type, signified by the `'o'` character in the head position. This is the very first
message your socket will process upon connection, and it will complete the connection to the socket. To do so, we must send credentials we
learned to receive in the Access part of the Tradovate API JavaScript tutorial. Luckily, we are reusing that logic, so we can simply import
our `getAccessToken` function from `storage.js` and expect to have an access token provided to us.
Now when our application runs, we should get an array of JSON objects in response. These objects will be logged to the developer's
console, where we can view them. There should be only one response in this first array and it should look like this:

```
[{
    s: 200,
    i: 1
}]
```

This is the expected success response for the `authorize` operation. If you're seeing this, you've successfully connected to 
the websocket host. In this particular response, the `s` is a status - in this case 200, just like a successful web response. 
The `i` field is the ID of the sent request. Each ID must be unique in the scope of the current connection. There are also
a few schemas that can exist for responses. We will discuss more of that in EX-6.

### [Next Section >](https://github.com/tradovate/example-api-js/tree/main/tutorial/WebSockets/EX-6-Heartbeats)






