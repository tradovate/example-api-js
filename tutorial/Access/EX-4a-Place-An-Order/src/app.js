import { connect } from './connect'
import { ORDER_ACTION, ORDER_TYPE, placeOrder } from './placeOrder'
import { getAccessToken } from './storage'


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

    let to

    const isOk = await new Promise(function run(res) {
        if(getAccessToken().token) {
            res(true)
            return 
        }

        to = setTimeout(() => {
            if(!getAccessToken().token) {
                run(res)
            } else {
                clearTimeout(to)
                res(true)
            }
        }, 36*1000)
    }).catch(err => {
        console.log(err)
        clearTimeout(to)
    })
    
    console.log(isOk)
    

    const response = await placeOrder({
        action: ORDER_ACTION.Buy,
        symbol: 'ETHJ1',
        orderQty: 1,
        orderType: ORDER_TYPE.Market,
    })

    console.log(response)
}

//app entry point
main()
