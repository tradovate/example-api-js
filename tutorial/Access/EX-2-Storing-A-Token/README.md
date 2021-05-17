## Storing a Token
Now that we now how to get an access token, we really should find a way to store it. Fortunately, included with this project is a file called `storage.js`. This additional file contains functions that will let you set and retrieve pertinent items using `sessionStorage`. Using `sessionStorage` ensures that our temporary tokens will be cleared at the end of the session, and it also means that our apps will work even in Incognito mode.

Let's see how our storage functions work. In `connect.js` we will make some changes:

```javascript
//connect.js

import { tvPost } from './services'
import { getAccessToken, setAccessToken, tokenIsValid } from './storage'

export const connect = async (data) => {
    const { token, expiration } = getAccessToken()
    if(token && tokenIsValid(expiration)) {
        console.log('Already have an access token. Using existing token.')
        return
    }
    const { accessToken, expirationTime } = await tvPost('/auth/accesstokenrequest', data, false)

    setAccessToken(accessToken, expirationTime)
}
```
Our `connect` function now checks for a valid token. If it can't find it, then it will fire the regular access token request and store the response token and expiry.

There is an exception though - some readers may have gotten a different response.
If you got a response with properties like `p-ticket` and `p-time` instead of the standard auth response, then you've gotten a 
Time Penalty response. This happens when you try to log in too many times with incorrect credentials. There is nothing wrong with this response. But it is a possible response, and therefore we should handle it.

### [< Prev Section](https://github.com/tradovate/example-api-js/tree/main/tutorial/Access/EX-1-Simple-Request) [Next Section >](https://github.com/tradovate/example-api-js/tree/main/tutorial/Access/EX-3-Time-Penalty)
