# Using the Tradovate API

## What's an API?
One of the most powerful features of modern applications is the ability to access
the building blocks of that application via its API. API stands for Application 
Programming Interface - literally an interface to build applications with. Developers 
often expose their API's functionality to the public, allowing people to use their 
application for personal or open-source projects. In web development, we typically
access APIs by making an HTTP request. If you don't know how to use the `fetch` function
to make HTTP requests, or if you're not familiar with `Promise`s, I'd suggest brushing 
up on those subjects before proceeding with this document. 

<!-- add more about the end goal of this application -->
## Accessing the Tradovate API
Today I'd like to dsicuss how to access and practically utilize the features of the 
Tradovate API. We will build a tiny application using data retrieved in real time 
from from Tradovate. The first thing we'll need to do to access the API is get our
hands on an authorization token. Head over to the [Tradovate registration page](https://trader-d.tradovate.com/register).
Make sure you create actual credentials with a username and password. Using the social option
will not work for our purposes at this time, so please refrain from doing so for this project.
Now that we're registered, we can attempt to get an auth token. Let's fire up a brand new project.
<!-- create and increment steps for using API as repo's -->
You can clone [this one](https://github.com/tradovate/example-api-js/tutorial/Access/EX-0-Access-Start) to easily follow along.    
Once you have the project cloned, make sure to install its dependencies. Open a terminal, navigate to
the directory of your project, and run this command:

```
> yarn install
```

That will install the dependencies for our project. Once we're all done installing, let's look at 
what we have to start with. Our project structure looks something like this:

```

|-src
|---env.js
|---connect.js
|-.babelrc
|-index.html
|-package.json
|-webpack.config.js

```

The only things we will need to concern ourselves with now are the `src` folder and the 
`index.html` file. Let's first look in `src`. Open `env.js` and have a look at what's inside.

```javascript
export const URL = 'https://demo-api-d.tradovate.com/v1'
```

The `env` file (short for 'environment') will hold environment variables that we will need time and time 
again. When we need to declare variables that are part of the development environment and which will be used
in many different places, it's best practice to keep them somewhere like an `env` file instead of rewriting
them. For now, our `env` is just one simple line. This is the base URL that will connect us with the Tradovate 
application. Now let's take a look in `connect.js`.

```javascript
import { URL } from './env'

const connect = () => { /*...*/ }
```

It's an empty template for use to build our `connect` function. This is where our project will begin.

## Playing Fetch
In order to connect to any API we must use the `fetch` function. `fetch` takes a URL and some optional 
configuration and returns a `Promise`. A `Promise` is a special data type that represents data you don't
have yet. After constructing a promise, it will begin running its course, trying to retrieve data. There 
are two paths a Promise may take from this point - resolution or rejection. When a promise resolves, we 
get data back from a server or database somewhere. When a promise is rejected, we instead get an error 
message that tells us something about what went wrong. 

Let's try to write our first `fetch`. In the body of `connect`, add this code:

```javascript
const connect = () => {
    fetch(URL + '/auth/accesstokenrequest')
}
```

What we're doing here is asking our browser to `fetch` a resource located at our base URL plus 
`/auth/accesstokenrequest`. The string we append to the end of our base URL is known as an *endpoint*.
Typically an endpoint is associated with a function on the back end. So when we ask to retrieve the data
located at our URL plus `/auth/accesstokenrequest`, we are actually asking the backend to call a function 
associated with that endpoint and *maybe* give us a response back. In our case, we are looking for a response
containing an authorization token.

However, if we were to run that code, it would do nothing. That's because we've given it absolutely no instruction
for what to do with data if it retrieves anything. Let's rectify that, using the Promise's `.then` method.

```javascript
const connect = () => {
    fetch(URL + '/auth/accesstokenrequest')
        .then(data => console.log(data))
}
```

Now we have something we can run. Create a new file called `app.js` in `src`.

```javascript
import { connect } from './connect'

connect()
```

And when we run that code, we'll get an error. We should see `GET 400`, an error that basically means
we've not made our request correctly and the server couldn't give us anything back. This actually
makes perfect sense, because each endpoint has unique expectations - none of which we've accounted for.

## Building a Request

The problem with our previous code is that we don't consider what the endpoint of our request is expecting.
We are currently blindly firing a request with no information - no headers, and no body.
Servers don't normally respond well to this. We need to give the server some information so that it can
complete our request. This is where `fetch`'s configuration options come in handy. We can use them to do things
like set headers, or send a request body. It turns out, our access request does require both a header and a body.
So let's go back into `connect.js` and make some changes:

```javascript

const buildRequest = (data) => {
    //Server expects JSON body
    const body = JSON.stringify(data)
    return {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body,
    }
}

const connect = () => {
    //data we need to send with the request
    const request = buildRequest({
        name: "MyUsername",
        password: "MyS00perSecretP@ss",
        appId: "My App",
        appVersion: "1.0",

    })
    //fire the request
    fetch(URL + '/auth/accesstokenrequest', request)
        .then(res => res.json())
        .then(data => console.log(data))
}

```

There's a bit happening in the above code, so let's go through it part by part. 

First, we've introduced a new function called `buildRequest`. As the name suggests, this function will help 
us build our request. Exploring the [fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#supplying_request_options)
grants us some insights into the request options interface. We need to supply all of the expected properties in the
request options object. The return value of `buildRequest` does exactly that - it preloads an object with the values 
required by our access endpoint. We actually don't do a whole lot in the `buildRequest` function.
We simply take the provided data from the `request` parameter and turn it into a JSON string using `JSON.stringify`.
Then we return an object with the expected request information required by our endpoint. In our case, we have a `POST` 
request (meaning we're sending information), we are using JSON for the data format of the request, and our request
body will be the JSON form of whatever data we pass in.

In our `connect` function, we've added some things as well. We make a call to our new `buildRequest` function.
In your own application, replace the `name` and `password` fields with your credentials. The `appId` and `appVersion` 
fields aren't important for our example, which uses the demo API. We assign the resulting object to the `request` local 
variable. We then use the `request` variable in our `fetch` call. As expected, this will configure our request mode
and headers. If we run this code now, it should give us a successful response. There are two possible 'successful' results.
The first is a JSON object that has fields for your authorization token and account info. The second is a Time Penalty response.
Sometimes there have been too many requests made to the server in too small a time period. When this happens, you may receive the
Time Penalty response. We should handle both of these responses properly for the sake of our end user's experience.

## Handling Responses
We need to handle two cases when it comes to handling our responses. The first case is the true 'success' case.
This occurs when we receive our account information and an authorization token in the response object. When we
encounter this case, we should store the access token. Let's write a helper function to do exactly that.
Create a new file called `storage.js`. 

```javascript
const STORAGE_KEY = 'tradovate-api-access-token'
const EXPIRATION_KEY = 'tradovate-api-access-expiration'

export const setAccessToken = (token, expiration) => {
    localStorage.setItem(STORAGE_KEY, token)
    localStorage.setItem(EXPIRATION_KEY, expiration)
}

export const getAccessToken = () => {
    const token = localStorage.getItem(STORAGE_KEY)
    const expiration = localStorage.getItem(EXPIRATION_KEY)
    if(!token) {
        console.warn('No access token retrieved. Please request an access token.')
    }
    return { token, expiration }
}
```

This function will help us by caching the token and the expiration date of the token. If we use these helpers
to get and set our access token, we can prevent our client from making requests for a new token on each connection.
Let's see how they work. In `app.js` let's make some changes:

```javascript
const connect = (data, ok, err) => {
    let { token, expiration } = getAccessToken()
    //check to see if the expiration date is later than right now
    if(token && new Date(expiration) - new Date() > 0) {
        console.log('Already connected. Using valid token.') // if we're connected we don't need a new token.
        return
    }
    const request = buildRequest(data)

    fetch(URL + '/auth/accesstokenrequest', request)
        .catch(err)
        .then(res => res.json())
        .then(ok)        
}
```

We now accept three parameters for our `connect` function. The first is our JSON body, `data`. The next is the `ok` function
to be called when the operation is successful. If the operation fails, we call an `err` function in the `catch` Promise method.
Now let's change `app.js` to reflect our storage system.

```javascript

connect(
    {
        name: "MyUsername",
        password: "MyS00perSecretP@ss",
        appId: "My App",
        appVersion: "1.0",
    },
    data => {
        const { accessToken, userId, userStatus, name, expirationTime } = data
        setAccessToken(accessToken, expirationTime)
        console.log(`Successfully stored access token for user {name: ${name}, ID: ${userId}, status: ${userStatus}}.`)
    },
    err => console.error(err)
)

```

We now supply our data as an object. We pass a success function and an error function as well. If our operation succeeds,
we store our token and log a nice little message. If the operation is a failure we will log the error out using `console.error`.
Now when we run this code, we should see our success message. If we refresh our page, our token should still be stored and so
it should display our already-logged-in message. There is an exception though - some readers may have gotten a different response.
If you got a response with properties like `p-ticket` and `p-time` instead of the standard auth response, then you've gotten a 
Time Penalty response. There is nothing wrong with this response. But it is a possible response, and therefore we should handle it.

## The Time Penalty Response
It is important for our end user that we handle every possible response. No one will use a platform that spits
out cryptic errors and fails to perform adequately. Let's make some changes in `connect` again. If you've been lucky enough to 
recieve the Time Penalty response, you'll see that it has three properties. We will only be concerned with `p-ticket` and `p-time`.
`p-ticket` is a special token that you must present with the Authorization header. Let's make some changes in `connect.js` to 
reflect the Time Penalty response model. We'll start with the `buildRequest` function:

```javascript
const buildRequest = (data, ticket = '') => {
    const body = JSON.stringify(data)
    const request = {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body,
    }
    if(ticket) {
        request.headers.Authorization = `Bearer ${ticket}`
    }
    return request
}
```

`buildRequest` now takes an optional parameter, `ticket`, which defaults to the empty string. We have added a conditional section
that checks for the prescence of the ticket parameter. The empty string will have its type coerced to `false` according to
standard javascript semantics. If the `ticket` string is not empty, we will append the `Authorization` header to our request, 
using our `ticket` in the value. 

Now we need to add a brand new function to `connect.js`. We will call it `handleRetry`, and - not surprisingly - it will handle
the condition that we must retry our original request.

```javascript
const handleRetry = (request, json, ok, err) => {
    const ticket    = json['p-ticket'],
          time      = json['p-time']

    console.log(`Time Penalty present. Retrying operation in ${time}s`)

    setTimeout(() => {
        fetch(URL + '/auth/accesstokenrequest', buildRequest(request, ticket))
            .catch(err)
            .then(res => res.json())
            .then(js => {
                js['p-ticket'] ? handleRetry(request, js, ok) : ok(js)
            })
        }, time * 1000)
}
```

Our `handleRetry` function takes the original request data, our JSON response, and `ok`, a function to call if the operation
is successful. We assign our `p-time` and `p-ticket` fields to local variables. We then set a timer for the amount of time
noted in the response times 1000. This is because the `setTimeout` function accepts time in milliseconds, and our JSON response
records time in seconds. At the end of that time period the inner function will make the request again, with the special
ticket added in to the Authorization header. It will keep repeating this cycle until it gets a successful response or an error. 

Finally we must update our actual `connect` function:

```javascript
export const connect = (data, ok, err) => {
    let { token, expiration } = getAccessToken()

    if(token && new Date(expiration) - new Date() > 0) {
        console.log('Already connected. Using valid token.')
        return
    }

    const request = buildRequest(data)

    fetch(URL + '/auth/accesstokenrequest', request)
        .then(res => res.json(), err)
        .then(js => {
            js['p-ticket'] 
                ? handleRetry(request, js, ok) 
                : ok(js)
        })
}
```

Now our `connect` function will make sure to start the retry cycle if the response is a time penalty. Finally, we're ready to
test it out, and see that our authorization works. We get console updates that tell us it's working. But to be sure,
let's create another request that requires an access token. Create a new file called `accountList.js`. Paste this code
inside:

```javascript
import { URL } from './env'
import { getAccessToken } from './storage'

export const accountList = (ok, err) => {
    const { token } = getAccessToken()

    if(!token) {
        console.error('No Access Token found locally. Please acquire an access token and try again.')
    }

    fetch(URL + '/account/list', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
        },
    }).then(
        res => res.json().then(ok),
        e => res.json().err(e)    
    )
}
```

Looks familiar. This is very much like the core of our access token request. We use the 