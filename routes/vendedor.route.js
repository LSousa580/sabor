const express = require("express");
const router = express.Router();

const VendedorController = require("../controllers/vendedor.controller.js");

//Rotas para o uso do Controlador de Vendedores
router.post("/vendedor/cadastrar", VendedorController.cadastrar);
router.get("/vendedor/listar", VendedorController.listar);
router.post("/vendedor/atualizar/:id_vendedor", VendedorController.atualizar);
router.post("/vendedor/apagar/:id_vendedor", VendedorController.apagar);

module.exports = router;