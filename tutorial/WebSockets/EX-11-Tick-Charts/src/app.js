import { connect } from './connect'
import { setAccessToken } from './storage'
import { MarketDataSocket } from './MarketDataSocket'

const main = async () => {

    let all_bars = []
    let subscription

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
    const $getChart     = document.getElementById('get-chart-btn')
    const $statusInd    = document.getElementById('status')
    const $symbol       = document.getElementById('symbol')
    const $type         = document.getElementById('type')
    const $nElements    = document.getElementById('n-elements')
    const $elemSize     = document.getElementById('elem-size')


    const onStateChange = _ => {
        $statusInd.style.backgroundColor = 
            socket.ws.readyState == 0 ? 'gold'      //pending
        :   socket.ws.readyState == 1 ? 'green'     //OK
        :   socket.ws.readyState == 2 ? 'orange'    //closing
        :   socket.ws.readyState == 3 ? 'red'       //closed
        :   /*else*/                    'silver'    //unknown/default           
    }
    socket.ws.addEventListener('message', onStateChange)

    $getChart.addEventListener('click', async () => {  
        all_bars = []
  
        if(subscription) subscription()
        subscription = await socket.getChart({
            symbol: $symbol.value,
            chartDescription: {
                underlyingType: $type.value,
                elementSize: parseInt($elemSize.value),
                elementSizeUnit: 'UnderlyingUnits',
                withHistogram: false,
            },
            timeRange: {
                asMuchAsElements: parseInt($nElements.value)
            }
        }, (chart) => { 
            //we need to render our chart still!
        })
    })
}

main()