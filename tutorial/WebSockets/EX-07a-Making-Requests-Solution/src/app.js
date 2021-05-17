import { WSS_URL } from './env'
import { connect } from './connect'
import { renderETH } from './renderETH'
import { TradovateSocket } from './TradovateSocket'

const main = async () => {
    //Connect to the tradovate API by retrieving an access token
    //await allows us to not call any further code until this is done,
    //ensuring that our dependent code will execute properly. This
    //is how we are strategizing our initialization.
    await connect({
        name:       "alennert02@gmail.com",
        password:   "YumD00d24!",
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
    const socket = new TradovateSocket()

    //give user some feedback about the state of their connection
    //by adding an event listener to 'message' that will change the color
    $connBtn.addEventListener('click', async () => {
        await socket.connect(WSS_URL)
        
        socket.onSync(() => {
            console.log('your special sync callback fired.')
        })

        await socket.synchronize()
        socket.ws.addEventListener('message', msg => {
            $statusInd.style.backgroundColor = 
                socket.ws.readyState == 0 ? 'gold'      //pending
            :   socket.ws.readyState == 1 ? 'green'     //OK
            :   socket.ws.readyState == 2 ? 'orange'    //closing
            :   socket.ws.readyState == 3 ? 'red'       //closed
            :   /*else*/                    'silver'    //unknown/default           
        })
    })

    //clicking the request button will fire our request and initialize
    //a listener to await the response.
    $reqBtn.addEventListener('click', async () => {
        let data = await socket.request({
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