import { connect } from './connect'

connect(
    {
        name: "<replace with your credentials>",
        password: "<replace with your credentials>",
        appId: "My App",
        appVersion: "1.0",
    },
    data => {
        const { accessToken, userId, userStatus, name, expirationTime } = data
        console.log(`Successfully stored access token for user {name: ${name}, ID: ${userId}, status: ${userStatus}}.`)
    },
    err => console.error(err)
)