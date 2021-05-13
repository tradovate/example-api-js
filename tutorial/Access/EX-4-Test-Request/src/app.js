import { accountList } from './accountList'
import { handleAccountList } from './handleAccountList'
import { connect } from './connect'

const main = async () => {
    await connect({
        name:       "<replace with your credentials>",
        password:   "<replace with your credentials>",
        appId:      "Sample App",
        appVersion: "1.0",
        cid:        8,
        sec:        'f03741b6-f634-48d6-9308-c8fb871150c2',
    })

    // APPLICATION ------------------

    const $accountListBtn = document.querySelector('#get-acct-btn')

    $accountListBtn.addEventListener('click', async () => {
        let js = await accountList()
        handleAccountList(js)
    })

}

main()