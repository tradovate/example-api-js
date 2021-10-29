## The Time Penalty Response
When we've made too many requests over too short a time period, or when sent bad info to a novel endpoint too many times (like `accessTokenRequest`s, for example), we'll receive a time penalty response. This response is a JSON object with up to three fields, `p-ticket`, `p-time`, and `p-captcha`. The `p-ticket` is a code that we need to send when we retry the request. `p-time` is the amount of time in seconds that you must wait before retrying the request. `p-captcha` refers to the possibility that the user will need to prove that he or she is not a robot before retrying the request. If you get a response with `p-captcha: true`, it means that the endpoint you requested was intended to be used through the Trader application, or was intended to be used only very rarely by third party applications. If you're developing a third party application, be sure to inform your users that they should try again in an hour if they've received this response, as you cannot resolve it from that third party app.

## Accommodating the Time Penalty Response
We'll take our current `connect` function and add a branch to handle the time penalty:

```js
export const connect = async (data) => {
    const { token, expiration } = getAccessToken()
    if(token && tokenIsValid(expiration)) {
        console.log('Already have an access token. Using existing token.')
        return
    }

    const authResponse = await tvPost('/auth/accesstokenrequest', data, false)

    //added branch
    if(authResponse['p-ticket']) {
        await handleRetry(data, authResponse)
    }

    const { accessToken, expirationTime, } = await tvPost('/auth/accesstokenrequest', data, false)

    setAccessToken(accessToken, expirationTime)
}
```

Now we need to define `handleRetry`. We'll use the `waitForMs` helper function included in the `./utils` folder of this project.

```js
const handleRetry = async (data, json) => {
    const ticket    = json['p-ticket'],
          time      = json['p-time'],
          captcha   = json['p-captcha']

    if(captcha) {
        console.error('Captcha present, cannot retry auth request via third party application. Please try again in an hour.')
        return
    }

    console.log(`Time Penalty present. Retrying operation in ${time}s`)

    await waitForMs(time * 1000) 
    await connect({ ...data, 'p-ticket': ticket })   
}
```

If we get the `captcha` response, we just log an error and return. This will always be the case if you get a time penalty from `/auth/accesstokenrequest`, because it is a novel endpoint. So this code is mostly pointless. However, if you were to use it with other endpoints, it would work and retry the operation. If it isn't the token request operation we would wait for the amount of time indicated by `p-time` and try to call our endpoint again, with `p-ticket` in the body.

> *Note that this is only to illustrate what to do when you've exceeded a call limit for an API endpoint. `accesstokenrequest` will always have the `p-captcha: true` if it responds with the time penalty. However, if you'd attempted too many order modifications over too short a time period, you could rectify it by waiting `p-time` and retrying the request with `p-ticket` as an additional body parameter.*

### [< Prev Section](https://github.com/tradovate/example-api-js/tree/main/tutorial/Access/EX-2-Storing-A-Token) [Next Section >](https://github.com/tradovate/example-api-js/tree/main/tutorial/Access/EX-4-Test-Request)
