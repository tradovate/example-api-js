import { connect } from './connect'
import { MDS_URL } from './env'
import { setAccessToken } from './storage'
import { renderQuote } from './renderQuote'
import { MarketDataSocket } from './MarketDataSocket'
import { renderDOM } from './renderDOM'

const main = async () => {

    await connect({
        name:       "<your credentials here>",
        password:   "<your credentials here>",
        appId:      "Sample App",
        appVersion: "1.0",
    }, data => {
        const { accessToken, userId, userStatus, name, expirationTime } = data
        setAccessToken(accessToken, expirationTime)
        console.log(`Successfully stored access token for user {name: ${name}, ID: ${userId}, status: ${userStatus}}.`)
    })

    //HTML elements
    const $outlet       = document.getElementById('outlet')
    const $reqBtn       = document.getElementById('request-btn')
    const $unsubBtn     = document.getElementById('unsubscribe-btn')
    const $connBtn      = document.getElementById('connect-btn')
    const $discBtn      = document.getElementById('disconnect-btn')
    const $statusInd    = document.getElementById('status')
    const $watchEth     = document.getElementById('subscribe-dom')
    const $unwatchEth   = document.getElementById('unsubscribe-dom')
    const $outlet2      = document.getElementById('outlet-2')

    //The websocket helper tool
    const socket = new MarketDataSocket()

    //give user some feedback about the state of their connection
    //by adding an event listener to 'message' that will change the color
    const onStateChange = msg => {
        $statusInd.style.backgroundColor = 
            socket.ws.readyState == 0 ? 'gold'      //pending
        :   socket.ws.readyState == 1 ? 'green'     //OK
        :   socket.ws.readyState == 2 ? 'orange'    //closing
        :   socket.ws.readyState == 3 ? 'red'       //closed
        :   /*else*/                    'silver'    //unknown/default           
    }
    socket.getSocket().addEventListener('message', onStateChange)

    $connBtn.addEventListener('click', () => {
        if(socket.isConnected()) return

        socket.connect(MDS_URL)    
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
        socket.unsubscribe('BTCH1')
    })

    //clicking the request button will fire our request and initialize
    //a listener to await the response.
    $reqBtn.addEventListener('click', () => {

        socket.subscribeQuote('BTCH1', data => {
            const newElement = document.createElement('div')
            newElement.innerHTML = renderQuote(data)
            $outlet.firstElementChild
                ? $outlet.firstElementChild.replaceWith(newElement)
                : $outlet.append(newElement)
        })
        
    })

    $watchEth.addEventListener('click', () => {
        socket.subscribeDOM('ETHH1', data => {
            const newElement = document.createElement('div')
            newElement.innerHTML = renderDOM(data)
            $outlet2.firstElementChild
                ? $outlet2.firstElementChild.replaceWith(newElement)
                : $outlet2.append(newElement)
        })
    })

    $unwatchEth.addEventListener('click', () => socket.unsubscribe('ETHH1'))
}

main()