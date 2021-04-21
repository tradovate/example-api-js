import { DEMO_URL } from './env'
import { getAccountSpec, getAccessToken, getAccountId } from './storage'

export const ORDER_TYPE = {
    Limit:              'Limit',
    MIT:                'MIT',
    Market:             'Market',
    QTS:                'QTS',
    Stop:               'Stop',
    StopLimit:          'StopLimit',
    TrailingStop:       'TralingStop',
    TrailingStopLimit:  'TrailingStopLimit'
}

export const ORDER_ACTION = {
    Buy:                'Buy',
    Sell:               'Sell'
}

export const placeOrder = async ({
    action, 
    symbol,
    orderQty,
    orderType, 
    accountSpec, 
    accountId, 
    clOrdId, 
    price, 
    stopPrice, 
    maxShow, 
    pegDifference,
    timeInForce, 
    expireTime, 
    text, 
    activationTime, 
    customTag50, 
    isAutomated
}) => {

    const normalized_body = {
        action, symbol, orderQty, orderType,
        isAutomated: isAutomated || false,
        accountId: accountId || getAccountId(),
        accountSpec: accountSpec || getAccountSpec()
    }    

    console.log(normalized_body)

    const { token } = getAccessToken()

    if(!token) {
        console.error('No access token found. Please acquire a token and try again.')
        return
    }

    const js = await fetch(DEMO_URL + '/order/placeOrder', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(normalized_body)

    }).then(res => res.json())

    return js
}
