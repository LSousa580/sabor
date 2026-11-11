CREATE TABLE ALUNOS (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome varchar(255),
  altura decimal,
  senha varchar(32)
);

INSERT INTO ALUNOS(nome, altura, senha)
VALUES("Luís Carlos", 1.80, "alunos@#");

SELECT * 
FROM alunos
WHERE nome = "Luís Carlos"