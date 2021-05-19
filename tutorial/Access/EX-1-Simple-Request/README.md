## Building a Request

The problem with our previous code is that we don't consider what the endpoint of our request is expecting.
We are currently blindly firing a request with no information - no headers, and no body.
Servers don't normally respond well to this. Fortunately, our API is well documented, so you can look at the details for using any of our endpoints on our [Official API documentation](https://api.tradovate.com). 
We need to give the server some information so that it can
complete our request. This is where `fetch`'s configuration options come in handy. We can use them to do things
like set headers, or send a request body. If we look up the `/auth/accesstokenrequest` request ([here](https://api.tradovate.com/#operation/accessTokenRequest)) on the official docs, we can see that we do need to set headers and send a body.


## Make It Easier
We can make life even easier for ourselves by using a new file included with this project - `services.js`. This file contains two functions
that can become really helpful when you're making a large number of API requests. Let's talk about each of them:

- `tvGet` - this function is for use with any of our endpoints that are labeled as `GET`s. Now instead of fiddling with many lines of code per request,
you can call `tvGet` with just an endpoint and an object representing the query string. All the complicated string manipulations and decoding of the JSON 
response are taken care of for you. Here's how we can use it:

```js
//no parameters
const jsonResponseA = await tvGet('/account/list')

//parameter object, URL will become '/contract/item?id=2287764'
const jsonResponseB = await tvGet('/contract/item', { id: 2287764 })
```

- `tvPost` - this function is for use with any of our endpoints that are labeled as `POST`s. `tvPost` uses the exact same interface as `tvGet` making
it very simple to remember how to use either and not worry about whether you're creating a query or a JSON body. Here are some more examples:

```js
//placing an order with tvPost

const myAcct = getAvailableAccounts()[0] //<-- you can import this function from storage.js

const jsonResponseC = await tvPost('/order/placeorder', {
    accountSpec: myAcct.name,
    accountId: myAcct.id,
    action: 'Buy',
    symbol: 'MNQM1',
    orderQty: 2,
    orderType: 'Market',
    isAutomated: false //was this order placed by you or your robot?
})
```

These helpers will make our lives a bit easier in the coming sections.

## Making the Connection
Let's revise our `connect` function to utilize our new `services.js` features.

```javascript
//connect.js

export const connect = async (data) => {

    const json = await tvPost('/auth/accesstokenrequest', data, false)

    console.log(json)
}

```
The `connect` function  uses our `tvPost` function to to make the access token request.
Notice that `false` on the end - this is about the only time we need to override the third parameter to `tvPost`, when making an access token request. This parameter tells `tvPost` to not set up an Authentication header with the Bearer scheme. Since the access token request's response is the way we get our access token, this makes sense. The `services.js` functions make a simple connection very easy to establish.

# 2FA
There is one more field that you need to configure for use of multi-factor authentication. Multi-factor authentication is becoming more and 
more important as the quantity of valuable information that passes through the web is greater than ever before. If you want to configure 2FA with your application, you must 
also provide the `deviceId` field in your request. You can assign device IDs as you'd like but _it is strongly advised that you use a third party
software for this purpose_. Multi-factor authentication is important for the security of your
clients and business alike, and we should not trivialize the process of creating device IDs. This is a simple example of how we can create them
using the `device-uuid` package:

```js
import "device-uuid"

//set device ID, behaves differently for browser and mobile device.
let DEVICE_ID
if(!isMobile()) {
    const device = getDeviceId()
    DEVICE_ID = device || new DeviceUUID().get()
    setDeviceId(DEVICE_ID)
} else {
    DEVICE_ID = new DeviceUUID().get()
}

const connect_data = {
    name:       "<replace with your credentials>",
    password:   "<replace with your credentials>",
    appId:      "Sample App",
    appVersion: "1.0",
    cid:        8,
    sec:        'f03741b6-f634-48d6-9308-c8fb871150c2',
    deviceId:   DEVICE_ID
}

await connect(connect_data)
```
On mobile devices, you should rely on your third-party software to reliably generate IDs. However, browsers are engineered to not play well with
device-ID tracking software. After you generate a device ID for a browser, you should cahce it locally using `localStorage` or a cookie. In the example
project I use a utility function to do this, provided with the project.

In the next section, we will cover the authentication response. There are two possible 'successful' results. The first is a JSON object that has fields 
for your authorization token and account info. The second is a Time Penalty response. Sometimes there have been too many requests made to the server in 
too small a time period. When this happens, you may receive the Time Penalty response. We should handle both of these responses properly for the sake of 
our end user's experience.

### [< Prev Section](https://github.com/tradovate/example-api-js/tree/main/tutorial/Access/EX-0-Access-Start) [Next Section >](https://github.com/tradovate/example-api-js/tree/main/tutorial/Access/EX-2-Storing-A-Token)
