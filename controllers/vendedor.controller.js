const db = require("../configs/database.js");

const VendedorController = {
    async entrar(req, res) {
        try {
            const { email, senha } = req.body;

            if (!email || !senha) {
                return res.status(400).json({ mensagem: "dados faltando" });
            }

            const vendedor = await db('vendedores').where({ email_vendedor: email }).first();

            if (!vendedor) {
                return res.status(401).json({ mensagem: "dados inválidos" });
            }

            if (senha != vendedor.senha_vendedor) {
                return res.status(401).json({ mensagem: "senha inválida" });
            }

            return res.status(200).json({
                mensagem: "Entrada no sistema com sucesso",
                dados: {
                    id: vendedor.id_vendedor,
                    nome: vendedor.nome_vendedor
                }
            });
        } catch (error) {
            console.error('Erro no processamento ', error);
            return res.status(500).json({ erro: 'Erro no servidor' });
        }

    },

    /**
     * Função para cadastro de vendedores
     * @param {*} req 
     * @param {*} res 
     */
    async cadastrar(req, res) {
        if (!req.file) {
            return res.status(400).json({ error: "Imagem não enviada" });
        }

        try {
            const { 
                nome_vendedor,
                telefone_vendedor,
                email_vendedor,
                senha_vendedor,
                localidade_vendedor,
            } = req.body;
            const image_vendedor = req.file;

            const dados = {
                image_vendedor: `/uploads/${image_vendedor.filename}`,
                nome_vendedor: nome_vendedor,
                telefone_vendedor: telefone_vendedor,
                email_vendedor: email_vendedor,
                senha_vendedor: senha_vendedor,
                localidade_vendedor: localidade_vendedor
            };

            const [id] = await db('vendedores').insert(dados);
            res.status(201).json({ mensagem: "vendedor cadastrado", id });
        } catch (error) {
            res.status(500).json({
                mensagem: "erro ao cadastrar vendedor",
                erro: error.message
            })
        }
    },
    /**
     * Função para listar os vendedores cadastrados
     * @param {*} req 
     * @param {*} res 
     */
    async listar(req, res) {
        const vendedores = await db('vendedores').select('*');
        res.status(201).json({ vendedores });
    },
    /**
     * Função para atualizar os dados do vendedor
     * @param {*} req 
     * @param {*} res 
     */
    async atualizar(req, res) {
        await db('vendedores')
            .where({ id_vendedor: req.params.id_vendedor })
            .update(req.body);
        res.json({ mensagem: "Vendedor atualizado!" });
    },
    /**
     * Função para remover vendedor
     * @param {*} req 
     * @param {*} res 
     */
    async apagar(req, res) {
        await db('vendedores')
            .where({ id_vendedor: req.params.id_vendedor })
            .del();
        res.json({ mensagem: "Vendedor removido!" });
    },
};

module.exports = VendedorController;