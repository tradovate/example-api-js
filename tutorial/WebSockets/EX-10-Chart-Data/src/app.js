import { connect } from './connect'
import { setAccessToken } from './storage'
import { MarketDataSocket } from './MarketDataSocket'
import { renderChart } from './renderChart'

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

    //socket init
    const socket = new MarketDataSocket()

    //HTML elements
    const $getChart = document.getElementById('get-chart-btn')
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