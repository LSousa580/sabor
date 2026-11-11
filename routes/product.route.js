const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");//1. chamar o multer para o código
const fs = require('fs'); //2. chamar o File Stream(leitor de arquivo)

const ProdutoController = require("../controllers/product.controller.js");

const uploadDir = path.join(__dirname, '..', '/uploads'); //3. Definir pasta: /sabor/uploads
//4. Verifica se a pasta de arquivos não existe no servidor
if(!fs.existsSync(uploadDir)){
     fs.mkdir(uploadDir);//5... se não existir ele cria ela.
}

//6. Configura as informações de arquivos para upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const unique = Date.now() + '_' + Math.round(Math.random() * 1e9);
        cb(null, unique + path.extname(file.originalname));
    }
});

//7. Configura o filtro de arquivos e pasta de armazenamento
const upload = multer({
    storage,
    limits: {fileSize: 5 * 1024 * 1024},
    fileFilter: (req, file, cb)=>{
        const ok = ['image/jpeg', 'image/png', 'image/webp']
                    .includes(file.mimetype);

        cb(ok ? null : new Error('Apenas JPG, JPEG e PNG'), ok);
    }
});


//Rotas para o uso do Controlador de Produtos
router.post("/produto/cadastrar", upload.single("image"), ProdutoController.cadastrar);
router.get("/produto/listar", ProdutoController.listar);
router.post("/produto/atualizar/:id", ProdutoController.atualizar);
router.post("/produto/apagar/:id", ProdutoController.apagar);

module.exports = router;