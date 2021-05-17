import { connect } from './connect'
import { MDS_URL } from './env'
import { setAccessToken } from './storage'
import { renderQuote } from './renderQuote'
import { MarketDataSocket } from './MarketDataSocket'
import { renderDOM } from './renderDOM'

const main = async () => {

    await connect({
        name:       "alennert02@gmail.com",
        password:   "YumD00d24!",
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
    const $watchDom     = document.getElementById('subscribe-dom')
    const $unwatchDom   = document.getElementById('unsubscribe-dom')
    const $outlet2      = document.getElementById('outlet-2')
    const $sym1         = document.getElementById('sym1')
    const $sym2         = document.getElementById('sym2')

    let lastSym1, lastSym2

    //The websocket helper tool
    const socket = new MarketDataSocket()

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
        socket.getSocket().addEventListener('message', onStateChange)
        socket.getSocket().addEventListener('message', onStateChange) //this.socket may be old. Get the real socket and replace listener
    })

    //disconnect socket on disconnect button click
    $discBtn.addEventListener('click', () => {
        if(!socket.isConnected()) return

        socket.disconnect()
        $statusInd.style.backgroundColor = 'red'
        $outlet.innerText = ''
        $outlet2.innerText = ''
        
    })

    $unsubBtn.addEventListener('click', () => {
        socket.unsubscribe(lastSym1)
        lastSym1 = ''
    })

    //clicking the request button will fire our request and initialize
    //a listener to await the response.
    $reqBtn.addEventListener('click', () => {

        socket.subscribeQuote($sym1.value, data => {
            lastSym1 = $sym1.value
            const newElement = document.createElement('div')
            newElement.innerHTML = renderQuote(lastSym1, data)
            $outlet.firstElementChild
                ? $outlet.firstElementChild.replaceWith(newElement)
                : $outlet.append(newElement)
        })
        
    })

    $watchDom.addEventListener('click', () => {
        socket.subscribeDOM($sym2.value, data => {
            lastSym2 = $sym2.value
            const newElement = document.createElement('div')
            newElement.innerHTML = renderDOM(lastSym2, data)
            $outlet2.firstElementChild
                ? $outlet2.firstElementChild.replaceWith(newElement)
                : $outlet2.append(newElement)
        })
    })

    $unwatchDom.addEventListener('click', () => {
        socket.unsubscribe(lastSym2)
        lastSym2 = ''
    })
}

main()