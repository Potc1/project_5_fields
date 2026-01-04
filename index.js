const express = require('express')
const fs = require('fs');
const cors = require('cors')
const bodyParser = require('body-parser');
const path = require('path');

const app = express()
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send('Home')
})

app.get('/:id/file.geojson', async (req, res) => {
    try {
    const path = `${__dirname}\\fields\\map_polygons${req.params.id}.geojson`
    const content = fs.readFileSync(path)
    res.sendFile(path)
    }
    catch (err){
        res.sendFile(`${__dirname}\\fields\\temp.geojson`)
        console.log(`Файл с id:${req.params.id} не найден ${err}`)
    }

})

app.post('/:id/create', async (req, res) => {
    try{
        const fieldData = req.body;
        console.log('The data is', fieldData)
        const path = `${__dirname}\\fields\\map_polygons${req.params.id}.geojson`
        const file = JSON.parse(fs.readFileSync(path, 'utf-8'))
        /*
        нужно добавить обработчик ошибок на чтение, потому что в слуаче
        отсутствия у usera файла изначально читать будет нечего, поэтому 
        нужно:
        1. скопировать структуру файла temp.geojson в новый файл map_polygons:id.geojson
        2. запушить данные в него
        */
        file.features.push(fieldData)
        const res = JSON.stringify(file)
        fs.writeFileSync(path, res)
        
    }
    catch (err) {
        console.log(`Ошибка ${err}`)
    } 
})

const PORT = 3200

app.listen(PORT, () => {
    console.log(`Server started at http://localhost:${PORT}`)
})