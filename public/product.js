const formProduto = document.getElementById("formProduto");

formProduto.addEventListener("submit", async(event) => {
    event.preventDefault();

    const dados = new FormData(formProduto);

   try  {
        const response = await fetch("http://localhost:3000/api/produto/cadastrar", {
            method: "POST",
            body: dados
        });
        
        const resultado = await response.json();

        if(!response.ok){
            throw new Error(resultado.mensagem);
        }

        //Mostra um alerta com uma mensagem
        alert(resultado.mensagem);

        //Zera todos os campos do formulário HTML
        formProduto.reset(); 
    } catch (error) {
        console.log(error);
    }
});