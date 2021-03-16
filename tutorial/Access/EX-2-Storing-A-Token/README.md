## Storing a Token
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

### [< Prev Section](https://github.com/tradovate/example-api-js/tree/main/tutorial/Access/EX-1-Simple-Request) [Next Section >](https://github.com/tradovate/example-api-js/tree/main/tutorial/Access/EX-3-Time-Penalty)