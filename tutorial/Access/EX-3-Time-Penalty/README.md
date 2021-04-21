## The Time Penalty Response
It is important for our end user that we handle every possible response. No one will use a platform that spits
out cryptic errors and fails to perform adequately. Let's make some changes in `connect` again. If you've been lucky enough to 
recieve the Time Penalty response, you'll see that it has three properties. We will only be concerned with `p-ticket` and `p-time`.
`p-ticket` is a special token that you must present with the Authorization header. Let's make some changes in `connect.js` to 
reflect the Time Penalty response model. We'll start with the `buildRequest` function:

```javascript
const buildRequest = (data, ticket = '') => {

    let raw_body = data
    if(ticket) {
        raw_body['p-ticket'] = ticket
    }
    const body = JSON.stringify(raw_body)

    const request = {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body,
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
const handleRetry = async (request, json) => {
    const ticket    = json['p-ticket'],
          time      = json['p-time']

    console.log(`Time Penalty present. Retrying operation in ${time}s`)

    const retry = () => {
        return new Promise((res) => {

            let js

            setTimeout(async () => {
                js = await fetch(DEMO_URL + '/auth/accesstokenrequest', buildRequest(request, ticket))
                    .catch(console.error)
                    .then(res => res.json())
                if(js['p-ticket']) {
                    const { errorText, accessToken, userId, userStatus, name, expirationTime } = js
                    if(errorText) {
                        console.error(errorText)
                        return
                    }
                    setAccessToken(accessToken, expirationTime)
                    console.log(`Successfully stored access token ${accessToken} for user {name: ${name}, ID: ${userId}, status: ${userStatus}}.`)
                }
            }, time * 1000)

            res(js)
        }) 
    }
        
    return await retry()
}
```

Our `handleRetry` function takes the original request data and our JSON response as parameters. We assign our `p-time` and `p-ticket` fields
to local variables. We then set a timer for the amount of time noted in the response times 1000. This is because the `setTimeout` function
accepts time in milliseconds, and our JSON response records time in seconds. At the end of that time period the inner function will make the 
request again, with the special ticket added in to the body of the request. It will keep repeating this cycle until it gets a successful response or
an error. 

Additionally we must update our actual `connect` function:

```javascript
export const connect = async (data) => {
    let { token, expiration } = getAccessToken()
    console.log(token, expiration)
    if(token && tokenIsValid(expiration)) {
        console.log('Already connected. Using valid token.')
        return
    }

    const request = buildRequest(data)

    let js = await fetch(DEMO_URL + '/auth/accesstokenrequest', request).then(res => res.json())

    if(js['p-ticket']) {
        return handleRetry(data, js) 
    } else {
        const { errorText, accessToken, userId, userStatus, name, expirationTime } = js
        if(errorText) {
            console.error(errorText)
            return
        }
        setAccessToken(accessToken, expirationTime)
        console.log(`Successfully stored access token ${accessToken} for user {name: ${name}, ID: ${userId}, status: ${userStatus}}.`)
    }
}
```

Now our `connect` function will make sure to start the retry cycle if the response is a time penalty. Finally, we're ready to
test it out, and see that our authorization works. We get console updates that tell us it's working. But to be sure,
let's create another request that requires an access token. We will cover doing so in the next section.

### [< Prev Section](https://github.com/tradovate/example-api-js/tree/main/tutorial/Access/EX-2-Storing-A-Token) [Next Section >](https://github.com/tradovate/example-api-js/tree/main/tutorial/Access/EX-4-Test-Request)
