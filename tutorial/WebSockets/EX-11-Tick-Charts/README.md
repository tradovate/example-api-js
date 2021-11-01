# Tradovate Tick Charts

In the last section, we discussed getting chart data and how to render a beautiful chart using that data. In this section, we'll pick up right where we left off - diving into Tick Charts. Retrieving a Tick Chart is nearly exactly the same as retrieving a regular minute or daily chart. The primary difference is in the data you receive. In order to request a Tick Chart all you need to do is change your `underlyingType` field to 'Tick' in the request object. In the project, we've linked this field to a control. This allows us to change the parameter to Tick by simply choosing Tick from the drop-down. The only problem is that our current solution isn't equipped to handle data in the format that a Tick Chart response gives us. Responses look like this:

```js
{
    "charts": [                     // Array of packets.
        {
            "id": 16335,            // Subscription ID, the same as historical/real-time subscription IDs from request response.
            "s": "db",              // Source of packet data.
            "td": 20190718,         // Trade date YYYYMMDD.
            "bp": 11917,            // Base price of the packet (integer number of contract tick sizes).
                                    // Tick prices are calculated as relative from this one.
            "bt": 1563421179735,    // Base timestamp of the packet.
                                    // Tick timestamps are calculated as relative from this value.
            "ts": 0.25,             // Tick size of the contract for which the tick chart is requested.
            "tks": [                // Array of ticks of this packet.
                {
                    "t": 0,         // Tick relative timestamp.
                                    // Actual tick timestamp is packet.bt + tick.t
                    "p": 0,         // Tick relative price (in contract tick sizes).
                                    // Actual tick price is packet.bp + tick.p
                    "s": 3,         // Tick size (seems more proper name should be tick volume).
                                    // Please don't confuse with contract tick size (packet.ts).
                    "b": -1,        // Bid relative price (optional).
                                    // Actual bid price is packet.bp + tick.b
                    "a": 0,         // Ask relative price (optional).
                                    // Actual ask price is packet.bp + tick.a
                    "bs": 122,      // Bid size (optional).
                    "as": 28,       // Ask size (optional).
                    "id": 11768401  // Tick ID
                },
                ...
            ]
        },
        // Multiple packets are possible...
        {
            "id": 16335,
            eoh: true               // End of history flag.
                                    // If the request time range assumes historical data,
                                    // this flag indicates that historical ticks are loaded and
                                    // further packets will contain real-time ticks.
        }
    ]
};
```

This short-form naming scheme is typical of websocket conventions, unfortunately. But we will decode it and you'll have a tick chart in no time. Let's first observe the structure of our response. There is a main `chart` object which has a `tks` array. This resembles our former `chart` and `bars` objects from the last section. The important fields on the `chart` structure are `bp`, the base price of the contract, `bt` the base timestamp of our request, and `ts` the tick size of the contract. Each tick's fields are relative to these fields - `t` is the relative timestamp, and `p` is the relative price. With just those fields I've discussed, we can draw a pretty nice tick chart. Let's open up `app.js` and make some changes. First remove all mentions of the chart from before - we're going to make a separate chart based on what type of chart the request asks for. We'll move our chart reference out of the subscription callback and up to the top of the main function:


```js
const main = async () => {
    let all_bars = []
    let subscription
    let _chart

    //...
}

```

Next we will create some helper functions within this scope to deal with whether we've got a tick chart or a normal chart. Here are the helpers for the
regular chart:

```js
const main = async () => {
    //...
    const getRegularChart = () => {
        return new CanvasJS.StockChart("outlet", {
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
            }]
        })
    }
    
    const handleRegularChart = chart => { 
        chart.bars.forEach(bar => {
            const { high, low, open, close, timestamp } = bar
            all_bars.push({x: new Date(timestamp), y: [open, high, low, close]})
        })
    }
    //...
}
```
The regular chart uses the candlestick type. We render it using `handleRegularChart`, which is the function we'll ultimately use in the callback. We still have
to handle the tick chart case however. 

```js
//...
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

    const handleTickChart = ({bt: timestamp, ts: tickSize, bp: basePrice, tks, id}) => {
        tks.forEach(({t, p: price, s, b , a, bs, as}) => {
            all_bars.push({x: new Date(timestamp +  t), y: (basePrice + price) * tickSize})
        })

        all_bars.sort((a, b) => new Date(a.x) - new Date(b.x))

        _chart.render()
    }
//...
```

Its almost the same as the regular chart. I've opted for a line chart instead of a candlestick chart this time.  The more important part is the
`handleTickChart` function. I've renamed some of the parameters using destructuring, mostly to make better sense of what they mean. We have to format the data
differently than our OHLC chart. In order to get the correct timestamp for each tick, we must add its relative timestamp to the base timestamp. Then, to
retrieve its price actively, we need to add the basePrice to the relative price of the tick, then multiply that number by the tick size of the contract.
We also sort our bars - that's because sometimes we will get our ticks out of order. Before we render them, we will want the data points to be in chronological
order, or else our chart could render with weird reversed lines and gaps.

Let's use our new function to write the actual callback to our realtime subscription. Look at the 'click' listener for the `$getChart` element:

```js
//...
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
//...
```
First we clear our `all_bars` array. These are our data points, and we don't want to save points from old charts. Next, if we have a subscription
we will cancel it so we don't receive updates for charts we're no longer rendering. Here's where we start splitting our chart logic - if the `$type` element has the 'Tick' value, we want to render a tick chart. Otherwise, we render a regular chart. Then we setup our subscription as usual. I've added a constraint to Tick and DailyBar charts which require an `elementSize` field value of 1. In the callback function we again split our logic based on what type of chart we're reading. If it's a Tick Chart we use the update logic for tick charts, otherwise we use the standard chart logic. Finally we render our initial instance of the chart. If we fire this up and run it with appropriate parameters, we should see pretty charts for each of the dropdown selection items, including our new Tick Charts. We can watch Tick Charts unfold in real time, too. If you pick a particularly active contract and a small element range, you should be able to see the chart grow with time. In my examples I've been using BTCx1 and ETHx1, the bitcoin and ethereum cryptocurrencies contracts. Bitcoin updates fairly quickly, if you want to get a feel for how your chart will behave with live data, but for really fast live data, check on the `NQx1` and `ESx1` families of contracts.

Congratulations, you've now rendered Charts and Tick Charts using the Tradovate Real-Time API! 

### [< Prev Section](https://github.com/tradovate/example-api-js/tree/main/tutorial/WebSockets/EX-10-Chart-Data) [Next Section >](https://github.com/tradovate/example-api-js/tree/main/tutorial/WebSockets/EX-12-Calculating-Open-PL)
