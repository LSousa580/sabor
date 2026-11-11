const db = require("../configs/database.js");

const CooperativaController = {
    /**
     * função para cadastro de cooperativas
     * @param {*} req 
     * @param {*} res 
     */
    async cadastrar(req, res){
        try {
            const [id] = await db('cooperativas').insert(req.body);
            res.status(201).json({mensagem: "cooperativa cadastrada", id});
        } catch (error) {
            res.status(500).json({
                mensagem: "erro ao cadastrar cooperativa",
                erro: error.message
            })
        }
    },
    /**
     * Função para listar as cooperativas cadastrados
     * @param {*} req 
     * @param {*} res 
     */
    async listar(req, res){
        const cooperativas = await db('cooperativas').select('*');
        res.status(201).json({cooperativas});
    },
    /**
     * Função para atualizar os dados da cooperativa
     * @param {*} req 
     * @param {*} res 
     */
    async atualizar(req, res){
        await db('cooperativas').where({id_cooperativa: req.params.id_cooperativa}).update(req.body);
        res.json({mensagem:"Cooperativa atualizada!"});
    },
    /**
     * Função para remover cooperativa
     * @param {*} req 
     * @param {*} res 
     */
    async apagar(req,res){
        await db('cooperativas').where({id_cooperativa: req.params.id_cooperativa}).del();
        res.json({mensagem: "Cooperativa removida!"});
    },
};

module.exports = CooperativaController;