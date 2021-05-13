import { connect } from './connect'
import { renderETH } from './renderETH'
import { TradovateSocket } from './TradovateSocket'

const main = async () => {
    //Connect to the tradovate API by retrieving an access token
    //await allows us to not call any further code until this is done,
    //ensuring that our dependent code will execute properly. This
    //is how we are strategizing our initialization.
    await connect({
        name:       "<replace with your credentials>",
        password:   "<replace with your credentials>",
        appId:      "Sample App",
        appVersion: "1.0",
        cid:        8,
        sec:        'f03741b6-f634-48d6-9308-c8fb871150c2',
    })


    // APPLICATION ----------------------------------------------------

    //HTML elements
    const $outlet       = document.getElementById('outlet')
    const $reqBtn       = document.getElementById('request-btn')
    const $connBtn      = document.getElementById('connect-btn')
    const $statusInd    = document.getElementById('status')

    //The websocket helper tool
    const helper = new TradovateSocket()

    //give user some feedback about the state of their connection
    //by adding an event listener to 'message' that will change the color
    $connBtn.addEventListener('click', () => {
        helper.connect()
        helper.ws.addEventListener('message', msg => {
            $statusInd.style.backgroundColor = 
                helper.ws.readyState == 0 ? 'gold'      //pending
            :   helper.ws.readyState == 1 ? 'green'     //OK
            :   helper.ws.readyState == 2 ? 'orange'    //closing
            :   helper.ws.readyState == 3 ? 'red'       //closed
            :   /*else*/                    'silver'    //unknown/default           
        })
    })

    //clicking the request button will fire our request and initialize
    //a listener to await the response.
    $reqBtn.addEventListener('click', async () => {
        let data = await helper.request({
            url: 'product/find',
            query: `name=ETH`
        })

        const div = document.createElement('div')
        div.innerHTML = renderETH(data)
        $outlet.firstElementChild 
            ? $outlet.firstElementChild.replaceWith(div)
            : $outlet.appendChild(div)
        
    })
}

main()