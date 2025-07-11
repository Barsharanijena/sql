const express = require('express');
const cors = require('cors')

const app = express();
app.use(cors());
const port = 3000;

app.get('/',(req,res)=>{
    res.send("welcome");
})

app.listen(port,()=>{
    console.log(`app running at http://localhost:${port}`);
})