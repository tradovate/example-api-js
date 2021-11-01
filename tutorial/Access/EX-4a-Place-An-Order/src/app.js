import { credentials } from '../../../tutorialsCredentials'
import { connect } from './connect'
import { ORDER_ACTION, ORDER_TYPE, placeOrder } from './placeOrder'


const main = async () => {
    //Connect to the tradovate API by retrieving an access token
    await connect(credentials)

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
