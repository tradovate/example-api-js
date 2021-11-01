import { connect } from './connect'
import { renderQuote } from './renderQuote'
import { renderDOM } from './renderDOM'
import { credentials } from '../../../tutorialsCredentials'
import { URLs } from '../../../tutorialsURLs'
import { setAccessToken } from './storage'
import { TradovateSocket } from './TradovateSocket'

setAccessToken(null)

const main = async () => {

    const { accessToken } = await connect(credentials)

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

    let unsubscribeQuote, unsubscribeDom

    //The websocket helper tool
    const socket = new TradovateSocket()

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
        if(socket.ws && socket.ws.readyState === 1) return

        await socket.connect(URLs.MD_URL, accessToken)    
        socket.ws.addEventListener('message', onStateChange)
        socket.ws.addEventListener('message', onStateChange) //this.socket may be old. Get the real socket and replace listener
    })

    //disconnect socket on disconnect button click
    $discBtn.addEventListener('click', () => {
        if(socket.ws && socket.ws.readyState !== 1) return

        socket.ws.close()
        $statusInd.style.backgroundColor = 'red'
        $outlet.innerText = ''
        $outlet2.innerText = ''
        
    })

    $unsubBtn.addEventListener('click', () => {
        unsubscribeQuote()
    })

    //clicking the request button will fire our request and initialize
    //a listener to await the response.
    $reqBtn.addEventListener('click', async () => {

        unsubscribeQuote = await socket.subscribe({
            url: 'md/subscribequote',
            body: { symbol: $sym1.value },
            subscription: data => {
                const newElement = document.createElement('div')
                newElement.innerHTML = renderQuote($sym1.value, data.entries)
                $outlet.firstElementChild
                    ? $outlet.firstElementChild.replaceWith(newElement)
                    : $outlet.append(newElement)
            }
        })
        
    })

    $watchDom.addEventListener('click', async () => {

        unsubscribeDom = await socket.subscribe({
            url: 'md/subscribedom',
            body: { symbol: $sym2.value },
            subscription: data => {
                const newElement = document.createElement('div')
                newElement.innerHTML = renderDOM($sym2.value, data)
                $outlet2.firstElementChild
                    ? $outlet2.firstElementChild.replaceWith(newElement)
                    : $outlet2.append(newElement)
            }
        })
    })

    $unwatchDom.addEventListener('click', () => {
        unsubscribeDom()
    })
}

main()