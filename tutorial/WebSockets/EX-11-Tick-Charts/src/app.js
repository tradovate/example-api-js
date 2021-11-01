import { connect } from './connect'
import { credentials } from '../../../tutorialsCredentials'
import { URLs } from '../../../tutorialsURLs'
import { TradovateSocket } from '../../EX-07-Making-Requests/src/TradovateSocket'
import { setAccessToken } from './storage'

setAccessToken(null)

const main = async () => {

    let all_bars = []
    let unsubscribe

    const { accessToken } = await connect(credentials)

    //socket init
    const socket = new TradovateSocket()
    
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
    
    $getChart.addEventListener('click', async () => {  
        all_bars = []
        
        if(unsubscribe) unsubscribe()
        
        unsubscribe = await socket.subscribe({
            url: 'md/getchart',
            body: { 
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
            },
            subscription: chart => { 
                //we need to render our chart still!
            }
        })
    })
    
    await socket.connect(URLs.MD_URL, accessToken)
    
    socket.ws.addEventListener('message', onStateChange)
}

main()