const db = require("../configs/database.js");

const CooperativaVendedorController = {
    /**
     * função para cadastro de cooperativa_vendedor
     * @param {*} req 
     * @param {*} res 
     */
    async adicionar(req, res) {
        try {
            const [id] = await db('cooperativas_vendedores').insert(req.body);
            res.status(201).json({ mensagem: "vendedor adicionado", id });
        } catch (error) {
            res.status(500).json({
                mensagem: "erro ao adicionar vendedor",
                erro: error.message
            })
        }
    },
    /**
     * Função para listar as cooperativa_vendedor cadastrados
     * @param {*} req 
     * @param {*} res 
     */
    async listar(req, res) {
        try {
            const result = await db('cooperativas_vendedores')
                .join('cooperativas', 'cooperativas.id_cooperativa', '=', 'cooperativas_vendedores.id_cooperativa')
                .join('vendedores', 'vendedores.id_vendedor', '=', 'cooperativas_vendedores.id_vendedor')
                .select('*');

            res.status(201).json(result);
        } catch (error) {
            res.status(500).json({ error: 'Error ao buscar dados', mensagem: error.message });
        }
    },
    /**
     * Função para remover cooperativa_vendedor
     * @param {*} req 
     * @param {*} res 
     */
    async remover(req, res) {
        await db('cooperativas_vendedores').where({ id_cooperativa_vendedor: req.params.id_cooperativa_vendedor }).del();
        res.json({ mensagem: "vendedor removido com sucesso!" });
    }
}

module.exports = CooperativaVendedorController