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
Inside this project you will find all the reusable code from the [Access tutorial](https://github.com/tradovate/example-api-js/tree/main/tutorial/Access/EX-0-Access-Start). 

## Connecting Your WebSocket
Open `app.js`. Add the `URLs` import to the top of the file, and then append the WebSocket code to the end of the file:

```javascript
import { URLs } from '../../../tutorialsURLs.js'
const { WS_DEMO_URL } = URLs

//...

const ws = new WebSocket(WS_DEMO_URL)
```

That's pretty simple. Let's explore the WebSocket's functionality a bit. WebSockets communicate in *frames*. A frame in our case consists of
an indicator character followed by a data string. There are four possible indicator characters:
* `o` -  The 'open' frame. This is the first response sent by the websocket server indicating that you've made a connection.
* `h` -  The 'heartbeat' frame. In order to keep the websocket connection alive, the server has to send messages at regular intervals
        or else the connection will time out.
* `a` -  This is an array of JSON data. This type of message is what Tradovate's system builds upon, so this response will be the subject of most of our discussion.
* `c` - This signifies the 'closed' frame, for running shutdown logic when the connection is closed.

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
If you run what we've written so far, it might work - but we won't know it (at least not without inspecting the network panel in the devtools). That's because we haven't explored the rest
of the websocket API yet, like how to intercept a response message. The WebSocket has a few properties that we can assign our own custom functions
to, which will allow us to do just that:

```javascript
//when you receive the open frame. This is always the first message you receive.
ws.onopen = msg => console.log(msg)

//anytime you receive a message. All messages will be caught here
ws.onmessage = msg => console.log(msg)

//handle errors here
ws.onerror = err => console.error(err)

//when the connection closes. cleanup logic goes here
ws.onclose = msg => console.log(msg)
```
Additionally, WebSocket abides by the standard event emitter API so we could also call `addEventListener` and `removeEventListener` to
manage our message interception in a more dynamic and declarative way. I personally prefer this method.

```js
ws.addEventListener('message', myCallback)
```

We will need at minimum to override the `onmessage` function (or `addEventListener` for `'message'`), as `'message'` is the universal message type. Let's do that now.

```javascript

ws.onmessage = msg => {

    const { data } = msg
    const type = data.slice(0,1) // what kind of message is this? the first character lets us know

    //message discriminator
    switch(type) {
        case 'o':
            console.log('Opening Socket Connection...')
            const { token } = getAccessToken()
            ws.send(`authorize\n0\n\n${token}`) //we need to send our auth message on the 'open' frame 
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

With a switch like this, we can intercept all the different message types. We use object destructuring to acquire the `data` field from the
`msg` response. We acquire the `type` by slicing the first character from the `data` portion of the message. Then we will pass it through our switch, which will call the proper corresponding logic. 

The most important message type for setting up the WebSocket is the *open* message type, signified by the `'o'` character in the head position. This is the very first message your socket will process upon connection, and your response will complete the connection to the socket. To complete the response we must send our access token which learned to receive in the Access part of the Tradovate API JavaScript tutorial. Luckily, we are reusing that logic, so we can simply import our `getAccessToken` function from `storage.js` and expect to have an access token provided to us when we call it.

When our application runs, we should get an array of JSON objects in response. These objects will be logged to the developer's console, where we can view them. There should be only one response in this first array and it should look like this:

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

### [Next Section >](https://github.com/tradovate/example-api-js/tree/main/tutorial/WebSockets/EX-06-Heartbeats)






