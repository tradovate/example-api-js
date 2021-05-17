import { connect } from './connect'
import { ORDER_ACTION, ORDER_TYPE, placeOrder } from './placeOrder'


const main = async () => {
    //Connect to the tradovate API by retrieving an access token
    await connect({
        name:       "<Your Credentials Here>",
        password:   "<Your Credentials Here>",
        appId:      "Sample App",
        appVersion: "1.0",
        cid:        8,
        sec:        'f03741b6-f634-48d6-9308-c8fb871150c2',
    })

    const $symbol = document.getElementById('symbol')
    const $input = document.getElementById('buy')

    $input.addEventListener('click', async () => {
        if(!$symbol.value) return 
        const response = await placeOrder({
            action: ORDER_ACTION.Buy,
            symbol: $symbol.value,
            orderQty: 1,
            orderType: ORDER_TYPE.Market,
        })
        console.log(response)
    })
}

//app entry point
main()
