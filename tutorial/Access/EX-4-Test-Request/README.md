# A 'Real' Request
To make simple requests to the Tradovate API, we can utilize the helper functions included in `services.js`. Open `app.js` and add this code in the main function, below `connect`.

```javascript
const main = async () => {
    connect({...})

    const $accountListBtn = document.querySelector('#get-acct-btn')

    $accountListBtn.addEventListener('click', async () => {
        let accounts = await tvGet('/account/list')
        handleAccountList(accounts)
    })
}
```

The button is part of the HTML document included as `index.html` with this project. To that button we add a simple event listener that looks up your available accounts and then renders them using the `handleAccountList` function. But we haven't written that function yet. Let's create a new file in `src` called `handleAccountList.js`.

```javascript

export const handleAccountList = (data) => {
    const $outlet = document.querySelector('#outlet')
    
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
that comes with this repo will already have this section placed inside. We expect a JSON response, and we expect our data to come to us in the form of an array. For each data item, we will create
a small HTML template that shows the account information for the item in question. This is really just a simple listing of
every field on the Account object. Then we create an element to put that HTML into. If there's some HTML children in our 
`$outlet` object, we will replace the children with the `container`. Otherwise we will append our `container` object into
the empty `$outlet`.

Now when we run `yarn start` from the console and navigate to `localhost:8080`, we should see a button. If we open our 
developer tools, we will see our connection messages logged to the console. Then, if we click the button we should see
an HTML rendered version of the demo account data retrieved from the API.

### [< Prev Section](https://github.com/tradovate/example-api-js/tree/main/tutorial/Access/EX-3-Time-Penalty) [Next Section >](https://github.com/tradovate/example-api-js/tree/main/tutorial/Access/EX-4a-Place-An-Order)

