import { connect } from './connect'
import { credentials } from '../../../tutorialsCredentials'
import { URLs } from '../../../tutorialsURLs'
import { TradovateSocket } from './TradovateSocket'
import { setAccessToken } from './storage'

setAccessToken(null)

const main = async () => {

    let all_bars = []
    let unsubscribe
    let _chart

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

    const getRegularChart = () => {
        return new CanvasJS.StockChart("outlet", {
            title: {
                text: `${$symbol.value} Chart`
            },
            charts: [
                {      
                    data: [
                    {        
                        type: "candlestick",
                        dataPoints : all_bars
                    }
                ]
            }]
        })
    }

    const handleRegularChart = chart => { 
        if(chart.eoh) {
            console.log('end of history')
            return
        }
        chart.bars.forEach(bar => {
            const { high, low, open, close, timestamp } = bar
            all_bars.push({x: new Date(timestamp), y: [open, high, low, close]})
        })
    }

    const getTickChart = () => {
        $elemSize.value = 1
        return new CanvasJS.StockChart("outlet", {
            title: {
                text: `${$symbol.value} Chart`
            },
            charts: [
                {      
                    data: [
                    {        
                        type: "line", 
                        dataPoints : all_bars
                    }
                ]
            }]
        })
    }
    const handleTickChart = ({bt: timestamp, ts: tickSize, bp: basePrice, tks, id, eoh}) => {
        if(eoh) {
            console.log('end of history')
            return
        }
        // console.log(tks)
        tks.forEach(({t, p: price, s, b, a, bs, as}) => {
            all_bars.push({ x: new Date(timestamp +  t), y: (basePrice + price) * tickSize })
        })

        all_bars.sort((a, b) => new Date(a.x) - new Date(b.x))

        _chart.render()
    }
    
    $getChart.addEventListener('click', async () => {  
        all_bars = []

        if(unsubscribe) unsubscribe() //unsubscribe existing subsciptions
        
        if($type.value === 'Tick') {
            _chart = getTickChart()
        } else {
            _chart = getRegularChart()
        }

        unsubscribe = await socket.subscribe({
            url: 'md/getchart',
            body: { 
                symbol: $symbol.value,
                chartDescription: {
                    underlyingType: $type.value,
                    elementSize: $type.value === 'Tick' || $type.value === 'DailyBar' ? 1 : parseInt($elemSize.value),
                    elementSizeUnit: 'UnderlyingUnits',
                    // withHistogram: true,
                },
                timeRange: {
                    ...{ asMuchAsElements: parseInt($nElements.value) },
                    // closestTimestamp: "2020-10-30T19:45:00.000Z",
                    asFarAsTimeStamp: "2020-05-01T19:45:00.000Z"
                }
            },    
            subscription: chart => {
                console.log(chart)
                // console.log($type.value)
                if($type.value === 'Tick') {
                    handleTickChart(chart)
                } else {
                    handleRegularChart(chart)
                } 
                _chart.render()
            }
        })        
    })

    await socket.connect(URLs.MD_URL, accessToken)

    socket.ws.addEventListener('message', onStateChange)
}

main()