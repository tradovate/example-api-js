export const waitForMs = t => {
    return new Promise((res) => {
        setTimeout(() => {
            res()
        }, t)
    })
}