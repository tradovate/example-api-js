import { connect } from './connect'
import { setAccessToken } from './storage'
import { MarketDataSocket } from './MarketDataSocket'
import { renderChart } from './renderChart'
import { fixChart } from './utils/fixChart'

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
    const $outlet       = document.getElementById('outlet')
    const $getChart     = document.getElementById('get-chart-btn')
    const $statusInd    = document.getElementById('status')
    const $min          = document.getElementById('min')
    const $max          = document.getElementById('max')
    const $symbol       = document.getElementById('symbol')
    const $type         = document.getElementById('type')
    const $nElements    = document.getElementById('n-elements')
    const $elemSize     = document.getElementById('elem-size')

    //to make it feel real-timey, scroll to end on each append
    const myObs = new MutationObserver(entries => 
        entries.forEach(e => {
            $outlet.scrollTo({
                behavior: 'smooth',
                left: $outlet.scrollWidth
            })
        })
    )

    myObs.observe($outlet, {
        childList: true
    })
  
    $min.addEventListener('change', e => {
        const max = $max.value
        const min = e.target.value
        fixChart(min, max)
    })

    $max.addEventListener('change', e => {
        const max = e.target.value
        const min = $min.value
        fixChart(min, max)
    })

    const onStateChange = msg => {
        $statusInd.style.backgroundColor = 
            socket.ws.readyState == 0 ? 'gold'      //pending
        :   socket.ws.readyState == 1 ? 'green'     //OK
        :   socket.ws.readyState == 2 ? 'orange'    //closing
        :   socket.ws.readyState == 3 ? 'red'       //closed
        :   /*else*/                    'silver'    //unknown/default           
    }
    socket.ws.addEventListener('message', onStateChange)

    $getChart.addEventListener('click', async () => {
        $outlet.innerHTML = ''
        all_bars = []
        if(subscription) subscription()
        subscription = await socket.getChart({
            symbol: $symbol.value,
            chartDescription: {
                underlyingType: $type.value,
                elementSize: parseInt($elemSize.value, 10),
                elementSizeUnit: 'UnderlyingUnits',
                withHistogram: false,
            },
            timeRange: {
                asMuchAsElements: parseInt($nElements.value, 10)
            }
        }, (chart) => { 
            $outlet.innerHTML = ''
            chart.bars.forEach(bar => all_bars.push(bar))
            all_bars.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

            const max = all_bars
                .map(bar => bar.high)
                .reduce((acc, next) => Math.max(acc, next))

            const min = all_bars
                .map(bar => bar.low)
                .reduce((acc, next) => Math.min(acc, next))

            const template = renderChart({min, max}, {bars: all_bars})

            const newElement = document.createElement('div')
            newElement.innerHTML = template
            Array.prototype.forEach.call(newElement.children, ch => $outlet.append(ch))

            $min.value = min
            $min.dispatchEvent(new Event('changed'))
            $max.value = max
            $max.dispatchEvent(new Event('changed'))

            fixChart($min.value, $max.value)
        })
    })
}

main()