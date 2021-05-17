import { connect } from './connect'
import { setAccessToken } from './storage'
import { MarketDataSocket } from './MarketDataSocket'
import { MDS_URL } from './env'

const main = async () => {

    let all_bars = []
    let subscription

    await connect({
        name:       "<your credentials here>",
        password:   "<your credentials here>",
        appId:      "Sample App",
        appVersion: "1.0",
        cid:        8,
        sec:        'f03741b6-f634-48d6-9308-c8fb871150c2',
    }, data => {
        const { accessToken, userId, userStatus, name, expirationTime } = data
        setAccessToken(accessToken, expirationTime)
        console.log(`Successfully stored access token for user {name: ${name}, ID: ${userId}, status: ${userStatus}}.`)
    })

    //socket init
    const socket = new MarketDataSocket()
    await socket.connect(MDS_URL)

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

            let stockChart = new CanvasJS.StockChart("outlet", {
                title: {
                    text: `${$symbol.value} Chart`
                },
                charts: [
                    {      
                        data: [
                        {        
                            type: "candlestick", //Change it to "spline", "area", "column"
                            dataPoints : all_bars
                        }
                    ]
                }],
                navigator: {
                    slider: {
                        minimum: new Date('2020 01 01'),
                        maximum: new Date()
                    }
                }
            }); 
            chart.bars.forEach(bar => {
                const { high, low, open, close, timestamp } = bar
                all_bars.push({x: new Date(timestamp), y: [open, high, low, close]})
            })

            stockChart.render()
        })
    })
}

main()