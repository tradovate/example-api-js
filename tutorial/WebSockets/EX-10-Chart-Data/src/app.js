import { connect } from './connect'
import { credentials } from '../../../tutorialsCredentials'
import { URLs } from '../../../tutorialsURLs'
import { TradovateSocket } from '../../EX-07-Making-Requests/src/TradovateSocket'
import { setAccessToken } from './storage'

setAccessToken(null)

const main = async () => {

    let unsubscribe //variable to hold our unsubscribe function

    const { accessToken } = await connect(credentials)

    //socket init
    const socket = new TradovateSocket()
    await socket.connect(URLs.MD_URL, accessToken)

    //HTML elements
    const $getChart     = document.getElementById('get-chart-btn')
    const $statusInd    = document.getElementById('status')

    const onStateChange = _ => {
        $statusInd.style.backgroundColor = 
            socket.ws.readyState == 0 ? 'gold'      //pending
        :   socket.ws.readyState == 1 ? 'green'     //OK
        :   socket.ws.readyState == 2 ? 'orange'    //closing
        :   socket.ws.readyState == 3 ? 'red'       //closed
        :   /*else*/                    'silver'    //unknown/default           
    }
    socket.ws.addEventListener('message', onStateChange)
    
}

main()