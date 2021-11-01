import { credentials } from '../../../tutorialsCredentials'
import { URLs } from '../../../tutorialsURLs'
import { TradovateSocket } from '../../EX-07-Making-Requests/src/TradovateSocket'
import { connect } from './connect'
import { renderQuote } from './renderQuote'
import { setAccessToken } from './storage'

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
    const $symbol       = document.getElementById('symbol')

    //The websocket helper tool
    const socket = new TradovateSocket()
    let lastSymb
    let unsubscribe

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
        //add your feedback function to the socket's
        socket.ws.addEventListener('message', onStateChange)
    })

    //disconnect socket on disconnect button click
    $discBtn.addEventListener('click', () => {
        if(socket.ws.readyState !== 1) return

        socket.ws.close()
        $statusInd.style.backgroundColor = 'red'
        $outlet.innerText = ''
        
    })

    $unsubBtn.addEventListener('click', () => {
        unsubscribe()
        lastSymb = ''
    })

    //clicking the request button will fire our request and initialize
    //a listener to await the response.
    $reqBtn.addEventListener('click', async () => {

        lastSymb = $symbol.value
        unsubscribe = socket.subscribe({
            url: 'md/subscribequote',
            body: { symbol: $symbol.value },
            subscription:  data => {
                const newElement = document.createElement('div')
                newElement.innerHTML = renderQuote($symbol.value, data.entries)
                $outlet.firstElementChild
                    ? $outlet.firstElementChild.replaceWith(newElement)
                    : $outlet.append(newElement)
            }
        })        
    })
}

main()