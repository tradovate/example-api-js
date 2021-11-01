
import { handleAccountList } from './handleAccountList'
import { connect } from './connect'
import { tvGet } from './services'
import { credentials } from '../../../tutorialsCredentials'

const main = async () => {
    await connect(credentials)

    // APPLICATION ------------------

    const $accountListBtn = document.querySelector('#get-acct-btn')

    $accountListBtn.addEventListener('click', async () => {
        let accounts = await tvGet('/account/list')
        handleAccountList(accounts)
    })

}

main()