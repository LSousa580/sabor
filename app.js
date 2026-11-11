const productController = require("./controllers/product.controller.js");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");
const path = require("path");
const fs = require("fs");//!

const uploadDir = path.join(__dirname, '/uploads');
if(!fs.existsSync(uploadDir)){
     fs.mkdir(uploadDir);
}

//Importa as rotas a serem usadas
const rotasVendedor = require("./routes/vendedor.route.js");
const rotasProduto = require("./routes/product.route.js");
const rotasCooperativa = require("./routes/cooperativa.route.js");
const rotasCooperativaVendedor = require("./routes/cooperativa_vendedor.route.js");
const ProductController = require("./controllers/product.controller.js");

const app = express();//Inicializa o servidor express
app.use(express.json());
app.use(helmet());//Protege o cabeçalho das request
app.use(cors());
app.use(morgan('dev'));

//Cria um ponto para uso das Rotas
app.use("/api", rotasVendedor);
app.use("/api", rotasProduto);
app.use("/api", rotasCooperativa);
app.use("/api", rotasCooperativaVendedor);

app.get("/status", async (req, res)=>{
    res.json({mensagem: "Funcionando", status: 200});
});

//9. Faz o express usar o diretório de uploads
app.use('/uploads', express.static(uploadDir));

app.listen(3000, ()=> console.log('OK'));

app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname, "public")));