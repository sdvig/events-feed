const axios = require('axios')

const main = async () => {
    const res = await axios.get('https://google.com')
    
    console.log(res.data)
}

main()