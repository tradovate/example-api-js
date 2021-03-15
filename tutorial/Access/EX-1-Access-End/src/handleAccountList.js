
const $outlet = document.querySelector('#outlet')

export const handleAccountList = (data) => {

    data.forEach(item => {
        const { 
            accountType,
            active,
            archived,
            autoLiqProfileId,
            clearingHouseId,
            id,
            legalStatus,
            marginAccountType,
            name,
            riskCategoryId,
            userId,
        } = item

        const templateHtml = `
            <h1>Name: ${name}</h1>
            <h2>Account Type: ${accountType}</h2>
            <section>
                <div>Active: ${active ? 'Yes' : 'Inactive'}</div>
                <div>ID: ${id}</div>
                <div>UserID: ${userId}</div>
                <div>legalStatus: ${legalStatus}</div>
                <div>marginAccountType: ${marginAccountType}</div>
                <div>riskCategory: ${riskCategoryId}</div>
                <div>autoLiqProfileId: ${autoLiqProfileId}</div>
                <div>clearingHouseId: ${clearingHouseId}</div>
                <div>archived: ${archived}</div>
            </section>
        `

        const container = document.createElement('div')
        container.innerHTML = templateHtml

        if($outlet.firstElementChild) {            
            $outlet.firstElementChild.replaceWith(container)
        } else {
            $outlet.appendChild(container)
        }
    })
}