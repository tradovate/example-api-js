## Another Request
From where we left off in EX-3, create a new file called `accountList.js`. Paste this code inside:

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

The highlight of this file is the `accountList` function. It calls out to the Tradovate API. This should look familiar. It is 
very much like the core of our access token request. We use the `fetch` function to retrieve the data at our endpoint. In this
case we also must provide our access token as part of the Authorization header. If we don't have an access token, the function
will log an error in the console. 

Just like our `connect` function, we will need to handle the response of the operation. Let's separate this logic into its own
file as well. Create another new file called `handleAccountList.js`, and write this code:

```javascript
const $outlet = document.querySelector('#outlet')

export const handleAccountList = (data) => {

    data.forEach(item => {
        const { 
            accountType,
            active,
            archived,
            autoLiqProfileId,
            clearingHouseId,
            id,
            legalStatus,
            marginAccountType,
            name,
            riskCategoryId,
            userId,
        } = item

        const templateHtml = `
            <h1>Name: ${name}</h1>
            <h2>Account Type: ${accountType}</h2>
            <section>
                <div>Active: ${active ? 'Yes' : 'Inactive'}</div>
                <div>ID: ${id}</div>
                <div>UserID: ${userId}</div>
                <div>legalStatus: ${legalStatus}</div>
                <div>marginAccountType: ${marginAccountType}</div>
                <div>riskCategory: ${riskCategoryId}</div>
                <div>autoLiqProfileId: ${autoLiqProfileId}</div>
                <div>clearingHouseId: ${clearingHouseId}</div>
                <div>archived: ${archived}</div>
            </section>
        `

        const container = document.createElement('div')
        container.innerHTML = templateHtml

        if($outlet.firstElementChild) {            
            $outlet.firstElementChild.replaceWith(container)
        } else {
            $outlet.appendChild(container)
        }
    })
}

```

The first thing we do is retrieve a reference to `$outlet`, an HTML object that already exists on our page. The `index.html` file
that comes with this repo will already have this section placed inside. Then we declare the `handleAccountList` function.
We expect a JSON response, and we expect our data to come to us in the form of an array. For each data item, we will create
a small HTML template that shows the account information for the item in question. This is really just a simple listing of
every field on the Account object. Then we create an element to put that HTML into. If there's some HTML children in our 
`$outlet` object, we will replace the children with the `container`. Otherwise we will append our `container` object into
the empty `$outlet`.

## Make it an App
Now we can finally add our changes to `app.js`, and test that we can gain access to the Tradovate API and call restricted
functions using our Access Token. Let's rework `app.js`.

```javascript
import { accountList } from './accountList'
import { handleAccountList } from './handleAccountList'
import { connect } from './connect'
import { setAccessToken } from './storage'

//Connect to the tradovate API by retrieving an access token
connect({
    name:       "<replace with your credentials>",
    password:   "<replace with your credentials>",
    appId:      "Sample App",
    appVersion: "1.0",
}, data => {
    const { accessToken, userId, userStatus, name, expirationTime } = data
    setAccessToken(accessToken, expirationTime)
    console.log(`Successfully stored access token for user {name: ${name}, ID: ${userId}, status: ${userStatus}}.`)
})

// APPLICATION ------------------

const $accountListBtn = document.querySelector('#get-acct-btn')

$accountListBtn.addEventListener('click', () => accountList(handleAccountList, console.error))

```

First, make sure you import the new `accountList` and `handleAccountList` functions. Then after our connection logic,
we have to get a reference to `$accountListBtn`, another HTML object that's already on our built-in page. All we have to
do is add an event listener to our button that initiates our request. We use the `accountList` function to make the call
to the `/account/list` endpoint. Like our `connect` function, we must supply the success and failure functions as parameters.
Here we are using the `handleAccountList` on success, to render our accounts. Otherwise we log an error to the console.

Now when we run `yarn start` from the console and navigate to `localhost:8080`, we should see a button. If we open our 
developer tools, we will see our connection messages logged to the console. Then, if we click the button we should see
an HTML rendered version of the demo account data retrieved from the API.

### [< Prev Section](https://github.com/tradovate/example-api-js/tree/main/tutorial/Access/EX-0-Access-Start)

## Further Reading
<!-- TODO: ADD NEXT CHAPTER LINKS -->