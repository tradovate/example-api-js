import { connect } from './connect'
import { MDS_URL } from './env'
import { MarketDataSocket } from './MarketDataSocket'
import { renderQuote } from './renderQuote'

const main = async () => {

    await connect({
        name:       "<replace with your credentials>",
        password:   "<replace with your credentials>",
        appId:      "Sample App",
        appVersion: "1.0",
        cid:        8,
        sec:        'f03741b6-f634-48d6-9308-c8fb871150c2',
    })

    //HTML elements
    const $outlet       = document.getElementById('outlet')
    const $reqBtn       = document.getElementById('request-btn')
    const $unsubBtn     = document.getElementById('unsubscribe-btn')
    const $connBtn      = document.getElementById('connect-btn')
    const $discBtn      = document.getElementById('disconnect-btn')
    const $statusInd    = document.getElementById('status')
    const $symbol       = document.getElementById('symbol')

    //The websocket helper tool
    const socket = new MarketDataSocket()
    let lastSymb

    //give user some feedback about the state of their connection
    //by adding an event listener to 'message' that will change the color
    const onStateChange = _ => {
        $statusInd.style.backgroundColor = 
            socket.ws.readyState == 0 ? 'gold'      //pending
        :   socket.ws.readyState == 1 ? 'green'     //OK
        :   socket.ws.readyState == 2 ? 'orange'    //closing
        :   socket.ws.readyState == 3 ? 'red'       //closed
        :   /*else*/                    'silver'    //unknown/default           
    }

    $connBtn.addEventListener('click', async () => {
        if(socket.isConnected()) return

        await socket.connect(MDS_URL)  
        //add your feedback function to the socket's
        socket.ws.addEventListener('message', onStateChange)
    })

    //disconnect socket on disconnect button click
    $discBtn.addEventListener('click', () => {
        if(!socket.isConnected()) return

        socket.disconnect()
        $statusInd.style.backgroundColor = 'red'
        $outlet.innerText = ''
        
    })

    $unsubBtn.addEventListener('click', () => {
        socket.unsubscribeQuote(lastSymb)
        lastSymb = ''
    })

    //clicking the request button will fire our request and initialize
    //a listener to await the response.
    $reqBtn.addEventListener('click', async () => {

        lastSymb = $symbol.value
        socket.subscribeQuote($symbol.value, data => {
            const newElement = document.createElement('div')
            newElement.innerHTML = renderQuote($symbol.value, data)
            $outlet.firstElementChild
                ? $outlet.firstElementChild.replaceWith(newElement)
                : $outlet.append(newElement)
        })
        
    })
}

main()