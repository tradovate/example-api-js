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
You can clone [this one](https://github.com/tradovate/example-api-js/tree/) to easily follow along.    
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

Now we have something we can run. Open the file called `app.js` in `src` and uncomment `connect()`.

```javascript
import { connect } from './connect'

connect()
```

When we run that code, we'll get an error. We should see `GET 400`, an error that basically means
we've not made our request correctly and the server couldn't give us anything back. This actually
makes perfect sense, because each endpoint has unique expectations - none of which we've accounted for.

### [Next Section >](http://github.com/tradovate/example-api-js/tree/main/tutorial/Access/EX-1-Simple-Request)
