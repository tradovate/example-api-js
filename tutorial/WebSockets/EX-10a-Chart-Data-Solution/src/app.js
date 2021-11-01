import { connect } from './connect'
import { credentials } from '../../../tutorialsCredentials'
import { URLs } from '../../../tutorialsURLs'
import { TradovateSocket } from './TradovateSocket'
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

                if(chart.eoh) {
                    console.log('end of history')
                    return
                }
                
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
            }
        })
    })

    await socket.connect(URLs.MD_URL, accessToken)

    socket.ws.addEventListener('message', onStateChange)

    
}

main()