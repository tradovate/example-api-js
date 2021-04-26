## Building a Request

The problem with our previous code is that we don't consider what the endpoint of our request is expecting.
We are currently blindly firing a request with no information - no headers, and no body.
Servers don't normally respond well to this. Fortunately, our API is well documented, so you can look at the details for using any of our endpoints on our [Official API documentation](https://api.tradovate.com). 
We need to give the server some information so that it can
complete our request. This is where `fetch`'s configuration options come in handy. We can use them to do things
like set headers, or send a request body. If we look up the `/auth/accesstokenrequest` request ([here](https://api.tradovate.com/#operation/accessTokenRequest)) on the official docs, we can see that we do need to set headers and send a body.

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
        cid: 8,
        sec: 'f03741b6-f634-48d6-9308-c8fb871150c2',

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
required by our access endpoint. We simply take the provided data from the `data` parameter and turn it into a JSON string using `JSON.stringify`.
Then we return an object with the expected request information required by our endpoint. In our case, we have a `POST` 
request (meaning we're sending information), we are using JSON for the data format of the request, and our request
body will be the JSON form of whatever data we pass in.

In our `connect` function, we've added some things as well. We make a call to our new `buildRequest` function.
In your own application, replace the `name` and `password` fields with your own credentials. The `appId` and `appVersion` 
fields aren't important for our example. However, _it will be mandatory for live accounts to use the security key_. This consists of two fields - 
the `cid` and `sec` fields. For testing purposes we can use this special dev key, but for live accounts you will need to request a key from Tradovate.
This key should be kept private in your real application. `cid` refers to the client application ID associated with your app. `sec` is
a UUID that will also be unique to your application. 

We assign the result of our`buildRequest` function to the `request` local variable. We then use the `request` variable in our `fetch` call. 
As expected, this will configure our request mode and headers. If we run this code now, it should give us a successful response.

# 2FA
There is one more field that you need to configure for use of multi-factor authentication. Multi-factor authentication is becoming more and 
more important as more valuable information passes through the web than ever before. If you want to configure 2FA with your application, you must 
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
