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

### [< Prev Section](https://github.com/tradovate/example-api-js/tree/main/tutorial/EX-0-Access-Start)\t\t[Next Section >](https://github.com/tradovate/example-api-js/tree/main/tutorial/Access/EX-2-Storing-A-Token)