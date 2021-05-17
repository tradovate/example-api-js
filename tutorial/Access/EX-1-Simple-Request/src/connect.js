

export const connect = async (data) => {

    const json = await tvPost('/auth/accesstokenrequest', data, false)

    console.log(json)
}