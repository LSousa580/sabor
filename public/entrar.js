const formEntrar = document.getElementById("formEntrar");

formEntrar.addEventListener("submit", async(event) => {
    event.preventDefault();

    const dados = new FormData(formEntrar);
    const objeto = Object.fromEntries(dados); //!

     try {
        const response = await fetch("http://localhost:3000/api/vendedor/entrar", {
            method: "POST",
            headers:{ "Content-Type": "application/json"}, //!
            body: JSON.stringify(objeto) //!
        });
        
        const resultado = await response.json();

        if(!response.ok){
            throw new Error(resultado.mensagem);
        }

        //Mostra um alerta com uma mensagem
        alert(resultado.mensagem);

        //Zera todos os campos do formulário HTML
        formEntrar.reset(); 
    } catch (error) {
        console.log(error);
    }
});