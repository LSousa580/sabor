const db = require("../configs/database.js");

const ProdutoController = {
    /**
     * função para cadastro de produtos
     * @param {*} req 
     * @param {*} res 
     */
    async cadastrar(req, res){
        try {
            const [id] = await db('produtos').insert(req.body);
            res.status(201).json({mensagem: "produto cadastrado", id});
        } catch (error) {
            res.status(500).json({
                mensagem: "erro ao cadastrar produto",
                erro: error.message
            })
        }
    },
    /**
     * Função para listar os produtos cadastrados
     * @param {*} req 
     * @param {*} res 
     */
    async listar(req, res){
        const produtos = await db('produtos').select('*');
        res.status(201).json({produtos});
    },
    /**
     * Função para atualizar os dados do produto
     * @param {*} req 
     * @param {*} res 
     */
    async atualizar(req, res){
        await db('produtos').where({id_produto: req.params.id_produto}).update(req.body);
        res.json({mensagem:"produto atualizado!"});
    },
    /**
     * Função para remover produto
     * @param {*} req 
     * @param {*} res 
     */
    async apagar(req,res){
        await db('produtos').where({id_produto: req.params.id_produto}).del();
        res.json({mensagem: "Produto removido!"});
    },
};

module.exports = ProdutoController;