# Chart Data
Another of the set of real-time operations supported by the Tradovate WebSocket API is retrieving chart data via a request to `md/getChart`. 
This operation is much like the other realtime operations we've discussed up to this point. The one major difference between requesting a chart and
getting any other real-time market data is the parameter requirement for a chart. Let's review those parameters now:

```js
{
  "symbol":"ESM7" | 123456,
  "chartDescription": {
    "underlyingType":"MinuteBar", // Available values: Tick, DailyBar, MinuteBar, Custom, DOM
    "elementSize":15,
    "elementSizeUnit":"UnderlyingUnits", // Available values: Volume, Range, UnderlyingUnits, Renko, MomentumRange, PointAndFigure, OFARange
    "withHistogram": true | false
  },
  "timeRange": {
    // All fields in "timeRange" are optional, but at least any one is required
    "closestTimestamp":"2017-04-13T11:33Z",
    "closestTickId":123,
    "asFarAsTimestamp":"2017-04-13T11:33Z",
    "asMuchAsElements":66
  },
}
```

Just like our other real-time subscriptions, the parameter object has to contain a symbol corresponding to the contract you'd like to chart. But we additionally 
have a `chartDescription` object, and a `timeRange` object. The `chartDescription` is a configuration object that represents the scale and unit that your chart
data will arrive as. It also allows us to specify whether or not we would like histogram data additionally. The `timeRange` object allows us to specify some
values that filter how many elements we receive and from when. Let's write yet another extension on the `MarketDataSocket` to help us retrieve our chart data:

```js
MarketDataSocket.prototype.getChart = async function({symbol, chartDescription, timeRange}, fn) {

    const { realtimeId, historicalId } = await this.request({
        url: 'md/getChart',
        body: {
            symbol,
            chartDescription,
            timeRange
        }
    })

    const subscriber = msg => {
        const results = getJSON(msg)
        if(!results) return
        console.log(msg)

        const isChart = data => data.e && data.e === 'chart'
        results
            .filter(isChart)
            .map(data => data.d.charts)
            .flat()
            .filter(({id, eoh}) => !eoh && (id === realtimeId || id === historicalId))
            .forEach(fn)
    }

    const subscription = () => {
        this.ws.removeEventListener('message', subscriber)
        this.request({
            url: 'md/cancelChart',
            body: {
                subscriptionId: historicalId
            }
        })
    }

    this.ws.addEventListener('message', subscriber)
    this.subscriptions.push({symbol, subscription})
    return subscription
}
```

We've employed the same pattern that we've been using to retrieve real-time data. We first make our request to initiate our real-time subscription. We can
see our new parameters here, which we will be passing as a configuration object to this function. We use the `realtimeId` and `historicalId` values returned
from our request to track and clean up our subscription. Next, we create a `subscriber` function that figures out whether any incoming messages are for the
subscription we're tracking. Just like our other extensions to `MarketDataSocket`, we do this by creating a functional pipeline, where we filter and transform
our data to get exactly what we want. If we have a match it will finally call our callback, `fn`, on each of the pertinent data items. We encapsulate the
subscription in the `subscription` function, allowing us to unsubscribe by simply calling the `subscription` function. We add the `subscriber` function as a
listener to the `'message'` event on our internal websocket, and push the subscription data to our `subscriptions` array. Finally, we return the subscription
itself to allow for manual unsubscription.

Now, let's try to get the chart data. Open `app.js`, go to the main function and add some code:

```js
$getChart.addEventListener('click', () => {
    socket.getChart({
        symbol: 'BTCJ1',
        chartDescription: {
            underlyingType: 'MinuteBar',
            elementSize: 30,
            elementSizeUnit: 'UnderlyingUnits',
            withHistogram: false,
        },
        timeRange: {
            asMuchAsElements: 20
        }
    }, (chart) => {
        console.log(chart)
    })
})
```

Now we can discuss some of these new parameters. First off, I'm watching `BTCJ1` which is a bitcoin contract for March. Feel free to use whatever symbol
you like. I'm using the most basic set of parameters possible. The `'MinuteBar'` value for `underlyingType` means we'll be measuring in minutes.
`elementSize` is the number of `underlyingType` per data element. In our case it's minutes, so we'll get data in intervals as small as 30 minutes. To determine my
time range, I'm just using the `asMuchAsElements` field, but we could specify a time range as well using a combination of `closestTimetamp` and 
`asFarAsTimestamp`. Our current configuration will give us the last 20 records at 30 minute intervals for whatever contract we are looking up.

If we fire this off, we should get some responses logged to the console. If we explore the output, we can find that each chart object has 
a  `bars` field. The bars field is going to be very important to us, because it holds the data we need to draw charts. `bars` is an array of
objects with this format:

```js
"bars": [ // "bars" may contain multiple bar objects
    {
    "timestamp":"2017-04-13T11:00:00.000Z",
    "open":2334.25,
    "high":2334.5,
    "low":2333,
    "close":2333.75,
    "upVolume":4712,
    "downVolume":201,
    "upTicks":1333,
    "downTicks":82,
    "bidVolume":2857,
    "offerVolume":2056
    }
]
```

We can utilize these fields to draw our data. People love OHLC charts, so let's make one of those - it's way easier than you think.

## Rendering a Chart
Unless you're planning on writing your own chart rendering software, its time to use a third party library. 
[CanvasJS](https://canvasjs.com/docs/stockcharts/basics-of-creating-html5-stockchart/) has amazingly simple solutions for charts, so I'll be using it
for this demonstration. First let's add this line to the head of our `index.html` file:

```html
<head>
  ...
  <script type="text/javascript" src="https://canvasjs.com/assets/script/canvasjs.stock.min.js"></script>
  ...
</head>
```

...and we'll add some controls to the body:

```html
<body>

    <span>
      <button id="get-chart-btn">Get Chart</button>

      <label for="type">TYPE
        <select name="type" id="type">  
          <option value="MinuteBar">MinuteBar</option> 
          <option value="Tick">Tick</option>      
          <option value="DailyBar">DailyBar</option>      
        </select>
      </label>

      <label for="n-elements">#ELEMS
        <input name="n-elements" id="n-elements" type="number" min="1" value="100" max="500"  />
      </label>

      <label for="elem-size">ELEM SIZE
        <input name="elem-size" id="elem-size" type="number" min="1" value="30" max="720"  />
      </label>

      <div id="status"></div>
    </span>


    <span>
      <input id="symbol" type="text" placeholder="BTCJ1"/>
      <h1>Chart</h1>
    </span>

    <main id='outlet'>
      
    </main>
</body>
```
Using these controls, we can manipulate the output of our request. Let's open `app.js` and add to our `main` function. First we will get some
references to the HTML controls we added:

```js
const main = async () => {
  //...
    const $getChart     = document.getElementById('get-chart-btn')
    const $symbol       = document.getElementById('symbol')
    const $type         = document.getElementById('type')
    const $nElements    = document.getElementById('n-elements')
    const $elemSize     = document.getElementById('elem-size')
  //...
}
```
We will need to hold our data in an array. Add this to the top of the `main` function:
```js
const main = async () => {
  let all_bars = []
  //...
}
```

Then we'll add an event listener to the `$getChart` button:

```js
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
        })

        chart.bars.forEach(bar => {
            const { high, low, open, close, timestamp } = bar
            all_bars.push({x: new Date(timestamp), y: [open, high, low, close]})
        })

        stockChart.render()
    })
})
```

First we reset our `all_bars` data points array to its empty state. We will then get our subscription to the chart data using our WebSocket. Notice we use
the values from the controls we added to the page to parameterize the request. This is what will make our page interactive. The callback function we pass to
our `getChart` method is very important. This is where we will add our rendering logic. Because we've added the script tag containing a reference to the CanvasJS
Stock package, the `CanvasJS.StockChart` constructor will be globally available. We use that constructor to instantiate our chart. The parameters for instantiating
a CanvasJS chart are pretty straightforward and similar to our chart data. We assign the chart a custom title based on our `$symbol` input parameters. To get a beautiful
candlestick chart, all we need to do is add an object to the `charts` field with the `candlestick` type. We also need to add our data to the `all_bars` array - we referenced 
this array in our StockChart constructor, so it will look at this array for data. CanvasJS' StockChart expects data points in this format for the candlestick chart type:

```js
  { 
      x: Date, y: [open: number, high: number, low: number, close: number]
  }
```

That's why we transform our data to match that pattern in the `forEach` loop. Finally, we can render our chart by calling its `render()` method. If we fire this up
and set some simple parameters, we should be able to generate beautiful charts with ease. But if you were to select 'Tick' from the 'TYPE' select menu, it would 
fail. That's because Tick charts are in a completely different format, which we will discuss in the next section.

### [< Prev Section](https://github.com/tradovate/example-api-js/tree/main/tutorial/WebSockets/EX-9-Realtime-Market-Data-Pt2) [Next Section >](https://github.com/tradovate/example-api-js/tree/main/tutorial/WebSockets/EX-11-Tick-Charts)
